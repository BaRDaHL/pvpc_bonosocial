"""Config flow for PVPC Next integration."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Any

import aiohttp
import voluptuous as vol
from homeassistant.config_entries import (
    SOURCE_REAUTH,
    SOURCE_RECONFIGURE,
    ConfigEntry,
    ConfigFlow,
    ConfigSubentryFlow,
    OptionsFlow,
)
from homeassistant.const import CONF_API_TOKEN, CONF_NAME
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_BETTER_PRICE_TARGET,
    ATTR_ENABLE_PRIVATE_API,
    ATTR_NEXT_BEST_IN_UPDATE,
    ATTR_NEXT_PERIOD_IN_UPDATE,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ATTR_NEXT_PRICE_IN_UPDATE,
    ATTR_PRICE_MODE,
    ATTR_SHOW_REFERENCE_PRICE,
    ATTR_TARIFF,
    BETTER_PRICE_TARGETS,
    DEFAULT_BETTER_PRICE_TARGET,
    DEFAULT_ENABLE_PRIVATE_API,
    DEFAULT_NAME,
    DEFAULT_PRICE_MODE,
    DEFAULT_SHOW_REFERENCE_PRICE,
    DEFAULT_TARIFF,
    DEFAULT_UPDATE_FREQUENCY,
    DOMAIN,
    ENTRY_MINOR_VERSION,
    ENTRY_VERSION,
    LEGACY_ATTR_ENABLE_INJECTION_PRICE,
    PRICE_MODES,
    SUBENTRY_DATADIS,
    SUBENTRY_RESUMEN,
    SUBENTRY_SUMINISTRO,
    UPDATE_FREQUENCY_OPTIONS,
    VALID_TARIFF,
    normalize_better_price_target,
    normalize_price_mode,
)
from .flujo_datadis import DatadisSubentryFlow
from .flujo_resumen import ResumenSubentryFlow
from .flujo_suministro import SuministroSubentryFlow
from .importacion import CONF_COPIA, CONF_IMPORTAR, config_importada, entrada_a_importar, resumen
from .prices.aiopvpc import EsiosForbiddenError, PVPCData

_MAIL_TO_LINK = "[consultasios@ree.es](mailto:consultasios@ree.es?subject=Personal%20token%20request)"


async def _async_comprobar_token(hass, api: PVPCData | None, token: str) -> tuple[PVPCData, str | None]:
    """Valida el token contra ESIOS. Devuelve la API (para reutilizarla) y la clave del error, si hay."""
    api = api or PVPCData(session=async_get_clientsession(hass))
    try:
        if not await api.check_api_token(dt_util.utcnow(), token):
            return api, "invalid_auth"
    except EsiosForbiddenError:
        return api, "esios_rechaza"
    except (aiohttp.ClientError, TimeoutError):
        # fallo transitorio: no se pudo llegar a la API, lo que no dice nada del token
        return api, "cannot_connect"
    return api, None


# La potencia contratada no se pide aquí: se pide una sola vez, al añadir el suministro, y de ahí
# la leen también los sensores de precio (helpers.potencia_contratada). Hasta la v1.2.1 se pedía
# dos veces, con valores por defecto distintos.
_PREFERENCIAS_POR_DEFECTO = {
    ATTR_BETTER_PRICE_TARGET: DEFAULT_BETTER_PRICE_TARGET,
    ATTR_NEXT_PRICE_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
    ATTR_NEXT_BEST_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
    ATTR_NEXT_PERIOD_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
    ATTR_ENABLE_PRIVATE_API: DEFAULT_ENABLE_PRIVATE_API,
}


def _select(opciones: Iterable[str], clave: str) -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(options=list(opciones), translation_key=clave, mode=SelectSelectorMode.DROPDOWN)
    )


def _campos_preferencias(valores: Mapping[str, Any]) -> dict[Any, Any]:
    """Campos comunes del alta y las opciones, con los valores que hay que mostrar."""
    campos: dict[Any, Any] = {
        vol.Required(ATTR_BETTER_PRICE_TARGET, default=valores[ATTR_BETTER_PRICE_TARGET]): _select(
            BETTER_PRICE_TARGETS, "better_price_target"
        ),
    }
    for clave in (
        ATTR_NEXT_PRICE_IN_UPDATE,
        ATTR_NEXT_BEST_IN_UPDATE,
        ATTR_NEXT_PERIOD_IN_UPDATE,
        ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ):
        campos[vol.Required(clave, default=valores[clave])] = _select(
            UPDATE_FREQUENCY_OPTIONS, "update_frequency"
        )
    campos[vol.Required(ATTR_ENABLE_PRIVATE_API, default=valores[ATTR_ENABLE_PRIVATE_API])] = bool
    return campos


def _esquema_modo(modos: list[str], modo: str, precio_referencia: bool) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(ATTR_PRICE_MODE, default=modo if modo in modos else DEFAULT_PRICE_MODE): _select(
                modos, "price_mode"
            ),
            vol.Required(ATTR_SHOW_REFERENCE_PRICE, default=precio_referencia): bool,
        }
    )


def _available_price_modes(enable_private_api: bool, api_token: str | None) -> list[str]:
    """Return selectable price modes for current auth settings."""
    if enable_private_api and api_token:
        return list(PRICE_MODES)
    return [DEFAULT_PRICE_MODE]


class PVPCOptionsFlowHandler(OptionsFlow):
    """Handle PVPC options flow (la recarga la hace el update listener de la entrada)."""

    _better_price_target: str | None = None
    _enable_private_api: bool | None = None
    _price_mode: str | None = None
    _show_reference_price: bool | None = None
    _next_price_in_update: str | None = None
    _next_best_in_update: str | None = None
    _next_period_in_update: str | None = None
    _next_power_period_in_update: str | None = None
    _api_token: str | None = None
    _api: PVPCData | None = None

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        """Manage the options."""
        options = self.config_entry.options
        data = self.config_entry.data
        better_price_target = normalize_better_price_target(
            options.get(ATTR_BETTER_PRICE_TARGET, data.get(ATTR_BETTER_PRICE_TARGET))
        )
        next_price_in_update = options.get(
            ATTR_NEXT_PRICE_IN_UPDATE,
            data.get(ATTR_NEXT_PRICE_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY),
        )
        next_best_in_update = options.get(
            ATTR_NEXT_BEST_IN_UPDATE,
            data.get(ATTR_NEXT_BEST_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY),
        )
        next_period_in_update = options.get(
            ATTR_NEXT_PERIOD_IN_UPDATE,
            data.get(ATTR_NEXT_PERIOD_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY),
        )
        next_power_period_in_update = options.get(
            ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
            data.get(ATTR_NEXT_POWER_PERIOD_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY),
        )
        show_reference_price = options.get(
            ATTR_SHOW_REFERENCE_PRICE,
            data.get(ATTR_SHOW_REFERENCE_PRICE, DEFAULT_SHOW_REFERENCE_PRICE),
        )
        # El token es una credencial: vive solo en entry.data (ver helpers.config_entrada).
        api_token = data.get(CONF_API_TOKEN)
        enable_private_api = options.get(ATTR_ENABLE_PRIVATE_API)
        if enable_private_api is None:
            enable_private_api = options.get(LEGACY_ATTR_ENABLE_INJECTION_PRICE)
        if enable_private_api is None:
            enable_private_api = data.get(ATTR_ENABLE_PRIVATE_API)
        if enable_private_api is None:
            enable_private_api = data.get(LEGACY_ATTR_ENABLE_INJECTION_PRICE)
        if enable_private_api is None:
            enable_private_api = bool(api_token) if api_token else DEFAULT_ENABLE_PRIVATE_API

        valores = {
            ATTR_BETTER_PRICE_TARGET: better_price_target,
            ATTR_NEXT_PRICE_IN_UPDATE: next_price_in_update,
            ATTR_NEXT_BEST_IN_UPDATE: next_best_in_update,
            ATTR_NEXT_PERIOD_IN_UPDATE: next_period_in_update,
            ATTR_NEXT_POWER_PERIOD_IN_UPDATE: next_power_period_in_update,
            ATTR_ENABLE_PRIVATE_API: enable_private_api,
        }
        if user_input is not None:
            valores.update(user_input)
            self._better_price_target = user_input[ATTR_BETTER_PRICE_TARGET]
            self._next_price_in_update = user_input[ATTR_NEXT_PRICE_IN_UPDATE]
            self._next_best_in_update = user_input[ATTR_NEXT_BEST_IN_UPDATE]
            self._next_period_in_update = user_input[ATTR_NEXT_PERIOD_IN_UPDATE]
            self._next_power_period_in_update = user_input[ATTR_NEXT_POWER_PERIOD_IN_UPDATE]
            self._enable_private_api = user_input[ATTR_ENABLE_PRIVATE_API]
            self._show_reference_price = bool(show_reference_price)
            if self._enable_private_api:
                self._api_token = data.get(CONF_API_TOKEN)
                if self._api_token:
                    return await self.async_step_price_mode()
                return await self.async_step_api_token()
            self._price_mode = DEFAULT_PRICE_MODE
            return self._async_guardar()

        return self.async_show_form(step_id="init", data_schema=vol.Schema(_campos_preferencias(valores)))

    async def async_step_api_token(self, user_input: dict[str, Any] | None = None):
        """Pide el token (solo si la entrada no tiene ninguno) y lo valida contra ESIOS."""
        errors: dict[str, str] = {}
        if user_input is not None:
            if api_token := user_input.get(CONF_API_TOKEN, "").strip():
                self._api, error = await _async_comprobar_token(self.hass, self._api, api_token)
                if error is None:
                    self._api_token = api_token
                    return await self.async_step_price_mode()
                errors["base"] = error
            else:
                errors[CONF_API_TOKEN] = "obligatorio"

        schema = vol.Schema({vol.Required(CONF_API_TOKEN, default=self._api_token or ""): str})
        return self.async_show_form(
            step_id="api_token",
            data_schema=schema,
            errors=errors,
            description_placeholders={"mail_to_link": _MAIL_TO_LINK},
        )

    @callback
    def _async_guardar(self):
        """Guarda las preferencias en `options` y, si hay un token nuevo, la credencial en `data`.

        Las dos cosas van en una sola llamada a async_update_entry para que el update listener
        recargue la entrada una vez: cuando HA aplica después las opciones del create_entry ya
        son las mismas, async_update_entry no detecta cambio y no vuelve a disparar el listener.
        """
        opciones = {
            ATTR_BETTER_PRICE_TARGET: self._better_price_target,
            ATTR_NEXT_PRICE_IN_UPDATE: self._next_price_in_update,
            ATTR_NEXT_BEST_IN_UPDATE: self._next_best_in_update,
            ATTR_NEXT_PERIOD_IN_UPDATE: self._next_period_in_update,
            ATTR_NEXT_POWER_PERIOD_IN_UPDATE: self._next_power_period_in_update,
            ATTR_ENABLE_PRIVATE_API: bool(self._enable_private_api),
            ATTR_PRICE_MODE: self._price_mode,
            ATTR_SHOW_REFERENCE_PRICE: bool(self._show_reference_price),
        }
        entry = self.config_entry
        if self._enable_private_api and self._api_token and self._api_token != entry.data.get(CONF_API_TOKEN):
            self.hass.config_entries.async_update_entry(
                entry, data={**entry.data, CONF_API_TOKEN: self._api_token}, options=opciones
            )
        return self.async_create_entry(data=opciones)

    async def async_step_price_mode(self, user_input: dict[str, Any] | None = None):
        """Select price mode after private API credentials are available."""
        options = self.config_entry.options
        data = self.config_entry.data
        selectable_price_modes = _available_price_modes(bool(self._enable_private_api), self._api_token)
        default_mode = normalize_price_mode(
            self._price_mode or options.get(ATTR_PRICE_MODE, data.get(ATTR_PRICE_MODE, DEFAULT_PRICE_MODE))
        )
        default_show_reference_price = (
            bool(self._show_reference_price)
            if self._show_reference_price is not None
            else bool(
                options.get(
                    ATTR_SHOW_REFERENCE_PRICE,
                    data.get(ATTR_SHOW_REFERENCE_PRICE, DEFAULT_SHOW_REFERENCE_PRICE),
                )
            )
        )
        schema = _esquema_modo(selectable_price_modes, default_mode, default_show_reference_price)

        if user_input is not None:
            self._price_mode = normalize_price_mode(user_input[ATTR_PRICE_MODE])
            self._show_reference_price = bool(user_input[ATTR_SHOW_REFERENCE_PRICE])
            return self._async_guardar()

        return self.async_show_form(step_id="price_mode", data_schema=schema)


class TariffSelectorConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle config flow for PVPC Next."""

    VERSION = ENTRY_VERSION
    MINOR_VERSION = ENTRY_MINOR_VERSION
    _name: str | None = None
    _tariff: str | None = None
    _better_price_target: str | None = None
    _enable_private_api: bool | None = None
    _price_mode: str | None = None
    _show_reference_price: bool | None = None
    _next_price_in_update: str | None = None
    _next_best_in_update: str | None = None
    _next_period_in_update: str | None = None
    _next_power_period_in_update: str | None = None
    _api_token: str | None = None
    _api: PVPCData | None = None
    _origen_elegido: bool = False

    @staticmethod
    @callback
    def async_get_options_flow(_config_entry: ConfigEntry):
        """Return the options flow handler."""
        return PVPCOptionsFlowHandler()

    @classmethod
    @callback
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        """Suministros (cada uno con su fuente de consumo) y resúmenes por notificación."""
        return {
            SUBENTRY_SUMINISTRO: SuministroSubentryFlow,
            SUBENTRY_RESUMEN: ResumenSubentryFlow,
            SUBENTRY_DATADIS: DatadisSubentryFlow,
        }

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        """Initial configuration step."""
        if user_input is None and not self._origen_elegido and entrada_a_importar(self.hass):
            return await self.async_step_origen()
        valores: dict[str, Any] = {**_PREFERENCIAS_POR_DEFECTO, **(user_input or {})}
        if user_input is not None:
            # Sin raise_on_progress: un alta abandonada a medias (navegador cerrado) sigue viva hasta
            # reiniciar HA y no debe impedir empezar otra. La tarifa ya configurada sí aborta.
            await self.async_set_unique_id(user_input[ATTR_TARIFF], raise_on_progress=False)
            self._abort_if_unique_id_configured()

            self._name = user_input[CONF_NAME]
            self._tariff = user_input[ATTR_TARIFF]
            self._better_price_target = user_input[ATTR_BETTER_PRICE_TARGET]
            self._next_price_in_update = user_input[ATTR_NEXT_PRICE_IN_UPDATE]
            self._next_best_in_update = user_input[ATTR_NEXT_BEST_IN_UPDATE]
            self._next_period_in_update = user_input[ATTR_NEXT_PERIOD_IN_UPDATE]
            self._next_power_period_in_update = user_input[ATTR_NEXT_POWER_PERIOD_IN_UPDATE]
            self._enable_private_api = user_input[ATTR_ENABLE_PRIVATE_API]
            if self._enable_private_api:
                return await self.async_step_api_token()
            self._price_mode = DEFAULT_PRICE_MODE
            self._show_reference_price = DEFAULT_SHOW_REFERENCE_PRICE
            return self.async_create_entry(title=self._name, data=self._build_entry_data())

        data_schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=valores.get(CONF_NAME, DEFAULT_NAME)): str,
                vol.Required(ATTR_TARIFF, default=valores.get(ATTR_TARIFF, DEFAULT_TARIFF)): VALID_TARIFF,
                **_campos_preferencias(valores),
            }
        )
        return self.async_show_form(step_id="user", data_schema=data_schema)

    async def async_step_origen(self, user_input: dict[str, Any] | None = None):
        """Hay PVPC Next: importarla o empezar de cero."""
        return self.async_show_menu(step_id="origen", menu_options=["importar_pvpc_next", "nueva"])

    async def async_step_nueva(self, user_input: dict[str, Any] | None = None):
        """Configurar desde cero aunque haya PVPC Next."""
        self._origen_elegido = True
        return await self.async_step_user()

    async def async_step_importar_pvpc_next(self, user_input: dict[str, Any] | None = None):
        """Importar PVPC Next (DISENO §9.2, camino del alta): resumen y copia de seguridad."""
        origen = entrada_a_importar(self.hass)
        if origen is None:
            return self.async_abort(reason="sin_pvpc_next")
        errores: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_COPIA):
                errores[CONF_COPIA] = "falta_copia"
            else:
                config = config_importada(origen)
                await self.async_set_unique_id(config[ATTR_TARIFF], raise_on_progress=False)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=config[CONF_NAME], data={**config, CONF_IMPORTAR: origen.entry_id}
                )
        return self.async_show_form(
            step_id="importar_pvpc_next",
            data_schema=vol.Schema({vol.Required(CONF_COPIA, default=False): bool}),
            description_placeholders=resumen(self.hass, origen),
            errors=errores,
        )

    async def async_step_api_token(self, user_input: dict[str, Any] | None = None):
        """Optional step to set API token."""
        if user_input is not None:
            self._api_token = user_input[CONF_API_TOKEN]
            return await self._async_verify("api_token")
        return self.async_show_form(
            step_id="api_token",
            data_schema=self._esquema_token(),
            description_placeholders={"mail_to_link": _MAIL_TO_LINK},
        )

    async def _async_verify(self, step_id: str):
        """Verify API token if used."""
        errors: dict[str, str] = {}
        self._api_token = (self._api_token or "").strip()
        if not self._api_token:
            errors[CONF_API_TOKEN] = "obligatorio"
        else:
            self._api, error = await _async_comprobar_token(self.hass, self._api, self._api_token)
            if error is not None:
                errors["base"] = error
        if errors:
            return self.async_show_form(
                step_id=step_id,
                data_schema=self._esquema_token(),
                errors=errors,
                description_placeholders={"mail_to_link": _MAIL_TO_LINK},
            )

        if self.source in (SOURCE_REAUTH, SOURCE_RECONFIGURE):
            entry = (
                self._get_reauth_entry() if self.source == SOURCE_REAUTH else self._get_reconfigure_entry()
            )
            # Solo cambia la credencial, y solo en `data`, que es de donde la lee la entrada. Las
            # preferencias de `options` no se tocan; si una versión anterior dejó allí el token,
            # se quita para que no queden dos copias distintas.
            cambios: dict[str, Any] = {"data_updates": {CONF_API_TOKEN: self._api_token}}
            if CONF_API_TOKEN in entry.options:
                cambios["options"] = {k: v for k, v in entry.options.items() if k != CONF_API_TOKEN}
            if entry.update_listeners:
                # Cargada: el update listener de la entrada recarga al cambiar los datos.
                return self.async_update_and_abort(entry, **cambios)
            return self.async_update_reload_and_abort(entry, **cambios)

        return await self.async_step_price_mode()

    def _esquema_token(self) -> vol.Schema:
        return vol.Schema({vol.Required(CONF_API_TOKEN, default=self._api_token or ""): str})

    async def async_step_price_mode(self, user_input: dict[str, Any] | None = None):
        """Select price mode after private API credentials are available."""
        selectable_price_modes = _available_price_modes(bool(self._enable_private_api), self._api_token)
        default_mode = normalize_price_mode(self._price_mode)
        default_show_reference_price = (
            bool(self._show_reference_price)
            if self._show_reference_price is not None
            else DEFAULT_SHOW_REFERENCE_PRICE
        )
        schema = _esquema_modo(selectable_price_modes, default_mode, default_show_reference_price)

        if user_input is not None:
            self._price_mode = normalize_price_mode(user_input[ATTR_PRICE_MODE])
            self._show_reference_price = bool(user_input[ATTR_SHOW_REFERENCE_PRICE])
            self._abort_if_unique_id_configured()  # otra alta paralela pudo terminar antes
            assert self._name is not None
            return self.async_create_entry(
                title=self._name,
                data=self._build_entry_data(),
            )

        return self.async_show_form(step_id="price_mode", data_schema=schema)

    def _build_entry_data(self) -> dict[str, Any]:
        """Build normalized entry data payload."""
        return {
            CONF_NAME: self._name,
            ATTR_TARIFF: self._tariff,
            ATTR_BETTER_PRICE_TARGET: self._better_price_target,
            ATTR_NEXT_PRICE_IN_UPDATE: self._next_price_in_update,
            ATTR_NEXT_BEST_IN_UPDATE: self._next_best_in_update,
            ATTR_NEXT_PERIOD_IN_UPDATE: self._next_period_in_update,
            ATTR_NEXT_POWER_PERIOD_IN_UPDATE: self._next_power_period_in_update,
            ATTR_ENABLE_PRIVATE_API: bool(self._enable_private_api),
            ATTR_PRICE_MODE: normalize_price_mode(self._price_mode),
            ATTR_SHOW_REFERENCE_PRICE: bool(self._show_reference_price),
            CONF_API_TOKEN: self._api_token,
        }

    async def async_step_reauth(self, entry_data: Mapping[str, Any]):
        """ESIOS ha rechazado el token (401): se pide otro. `entry_data` es entry.data, donde vive."""
        self._api_token = entry_data.get(CONF_API_TOKEN)
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None):
        """Confirm re-authentication."""
        if user_input:
            self._api_token = user_input.get(CONF_API_TOKEN)
            return await self._async_verify("reauth_confirm")
        return self.async_show_form(step_id="reauth_confirm", data_schema=self._esquema_token())

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None):
        """Cambiar el token de ESIOS sin esperar a que lo rechace (Quality Scale: reconfiguration-flow)."""
        if user_input:
            self._api_token = user_input.get(CONF_API_TOKEN)
            return await self._async_verify("reconfigure")
        self._api_token = self._get_reconfigure_entry().data.get(CONF_API_TOKEN)
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self._esquema_token(),
            description_placeholders={"mail_to_link": _MAIL_TO_LINK},
        )
