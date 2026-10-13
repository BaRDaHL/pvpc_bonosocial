"""Flujo de las subentradas «Datadis» (F7): alta, importar CSV y cambiar las credenciales."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigSubentryFlow, SubentryFlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    FileSelector,
    FileSelectorConfig,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .const import (
    CONF_DATADIS_CLAVE,
    CONF_DATADIS_SUMINISTRO,
    CONF_DATADIS_USUARIO,
    SUBENTRY_DATADIS,
)
from .datadis import CredencialesInvalidas, DatadisNoResponde, async_login, async_suministros, registros_csv

_LOGGER = logging.getLogger(__name__)
CONF_REVISION = "revision"  # cambia al cambiar las credenciales: fuerza una consulta nueva


def _credenciales(actual: dict[str, Any] | None = None) -> vol.Schema:
    actual = actual or {}
    return vol.Schema(
        {
            vol.Required(CONF_DATADIS_USUARIO, default=actual.get(CONF_DATADIS_USUARIO, "")): TextSelector(),
            vol.Required(CONF_DATADIS_CLAVE): TextSelector(
                TextSelectorConfig(type=TextSelectorType.PASSWORD)
            ),
        }
    )


def _titulo(suministro: dict[str, Any]) -> str:
    return f"Datadis {str(suministro.get('cups', ''))[-6:]}".strip()


class DatadisSubentryFlow(ConfigSubentryFlow):
    """Añadir una cuenta de Datadis (un suministro por subentrada)."""

    def __init__(self) -> None:
        self._credenciales: dict[str, Any] = {}
        self._suministros: list[dict[str, Any]] = []

    async def _probar(self, usuario: str, clave: str) -> tuple[list[dict[str, Any]] | None, str | None]:
        session = async_get_clientsession(self.hass)
        try:
            token = await async_login(session, usuario, clave)
            return await async_suministros(session, token), None
        except CredencialesInvalidas:
            return None, "credenciales"
        except DatadisNoResponde as exc:
            _LOGGER.info("Datadis no responde: %s", exc)
            return None, "no_responde"

    # --- alta -------------------------------------------------------------------------

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errores: dict[str, str] = {}
        if user_input is not None:
            usuario = user_input[CONF_DATADIS_USUARIO].strip().upper()
            suministros, error = await self._probar(usuario, user_input[CONF_DATADIS_CLAVE])
            if error:
                errores["base"] = error
            elif not suministros:
                errores["base"] = "sin_suministros"
            else:
                self._credenciales = {
                    CONF_DATADIS_USUARIO: usuario,
                    CONF_DATADIS_CLAVE: user_input[CONF_DATADIS_CLAVE],
                }
                self._suministros = suministros
                if len(suministros) == 1:
                    return self._crear(suministros[0])
                return await self.async_step_suministro()
        return self.async_show_form(step_id="user", data_schema=_credenciales(user_input), errors=errores)

    async def async_step_suministro(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is not None:
            elegido = next(s for s in self._suministros if s.get("cups") == user_input["cups"])
            return self._crear(elegido)
        opciones = [
            SelectOptionDict(
                value=s["cups"],
                label=" · ".join(
                    str(x) for x in (s["cups"], s.get("municipality"), s.get("distributor")) if x
                ),
            )
            for s in self._suministros
            if s.get("cups")
        ]
        esquema = vol.Schema(
            {
                vol.Required("cups"): SelectSelector(
                    SelectSelectorConfig(options=opciones, mode=SelectSelectorMode.LIST)
                )
            }
        )
        return self.async_show_form(step_id="suministro", data_schema=esquema)

    def _crear(self, suministro: dict[str, Any]) -> SubentryFlowResult:
        ya = {
            s.data.get(CONF_DATADIS_SUMINISTRO, {}).get("cups")
            for s in self._get_entry().subentries.values()
            if s.subentry_type == SUBENTRY_DATADIS
        }
        if suministro.get("cups") in ya:
            return self.async_abort(reason="ya_configurado")
        datos = {
            **self._credenciales,
            CONF_DATADIS_SUMINISTRO: {
                "cups": suministro["cups"],
                "distributorCode": str(suministro.get("distributorCode", "")),
                "pointType": int(suministro.get("pointType") or 5),
            },
            CONF_REVISION: 1,
        }
        return self.async_create_entry(title=_titulo(suministro), data=datos)

    # --- reconfigurar -------------------------------------------------------------------

    def _cuenta(self) -> Any:
        datos = getattr(self._get_entry(), "runtime_data", None)
        return getattr(datos, "datadis", {}).get(self._reconfigure_subentry_id)

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        return self.async_show_menu(step_id="reconfigure", menu_options=["importar_csv", "cuenta"])

    async def async_step_importar_csv(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        cuenta = self._cuenta()
        if cuenta is None:
            return self.async_abort(reason="no_cargada")
        errores: dict[str, str] = {}
        if user_input is not None:
            try:
                registros = await self.hass.async_add_executor_job(_leer_csv, self.hass, user_input["csv"])
            except ValueError as exc:
                _LOGGER.info("CSV de Datadis no válido: %s", exc)
                errores["csv"] = "csv_no_valido"
            else:
                c = await cuenta.async_importar(registros)
                if not c.horas and not c.rechazados:
                    errores["csv"] = "csv_vacio"
                else:
                    return self.async_abort(
                        reason="csv_importado",
                        description_placeholders={
                            "horas": str(len(c.horas)),
                            "rechazados": ", ".join(
                                f"{d.isoformat()} ({m})" for d, m in sorted(c.rechazados.items())
                            )
                            or "—",
                        },
                    )
        esquema = vol.Schema({vol.Required("csv"): FileSelector(FileSelectorConfig(accept=".csv,text/csv"))})
        return self.async_show_form(step_id="importar_csv", data_schema=esquema, errors=errores)

    async def async_step_cuenta(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        subentrada = self._get_reconfigure_subentry()
        errores: dict[str, str] = {}
        if user_input is not None:
            usuario = user_input[CONF_DATADIS_USUARIO].strip().upper()
            _, error = await self._probar(usuario, user_input[CONF_DATADIS_CLAVE])
            if error:
                errores["base"] = error
            else:
                datos = {
                    **subentrada.data,
                    CONF_DATADIS_USUARIO: usuario,
                    CONF_DATADIS_CLAVE: user_input[CONF_DATADIS_CLAVE],
                    CONF_REVISION: int(subentrada.data.get(CONF_REVISION, 1)) + 1,
                }
                return self.async_update_and_abort(self._get_entry(), subentrada, data=datos)
        return self.async_show_form(
            step_id="cuenta", data_schema=_credenciales(dict(subentrada.data)), errors=errores
        )


def _leer_csv(hass: Any, archivo: str) -> list[dict[str, Any]]:
    """Lee el CSV subido (en el ejecutor). Datadis lo da en UTF-8 o en Latin-1."""
    from homeassistant.components.file_upload import process_uploaded_file

    with process_uploaded_file(hass, archivo) as ruta:
        crudo = Path(ruta).read_bytes()
    try:
        texto = crudo.decode("utf-8")
    except UnicodeDecodeError:
        texto = crudo.decode("latin-1")
    return registros_csv(texto)
