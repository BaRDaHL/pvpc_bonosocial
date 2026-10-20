"""Flujo de las subentradas «Suministro» (DISENO §2.1): alta, reconfiguración y factura real.

Cada suministro necesita su propia fuente de consumo horario: un sensor de energía de HA
(sus estadísticas horarias) o una estadística externa (`dominio:objeto`).

«Reconfigurar» abre un menú: cambiar los datos del suministro o introducir una factura real
(a mano o leyendo el PDF de la Comercializadora Regulada, Gas & Power) para conciliarla.
"""

from __future__ import annotations

import io
import logging
import os
import zipfile
import zlib
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigSubentryFlow, SubentryFlowResult
from homeassistant.const import CONF_NAME, UnitOfEnergy
from homeassistant.helpers.selector import (
    DateSelector,
    EntitySelector,
    EntitySelectorConfig,
    FileSelector,
    FileSelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    StatisticSelector,
    StatisticSelectorConfig,
)
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_TARIFF,
    CAMPOS_CONTRATO,
    CONF_ALQUILER,
    CONF_ARRASTRE_INICIAL,
    CONF_BONO,
    CONF_CATEGORIA,
    CONF_CODIGO_POSTAL,
    CONF_COMPARADOR_DESTINO,
    CONF_COMPARADOR_ENVIO,
    CONF_COMPARADOR_FORMATO,
    CONF_COMPARADOR_UMBRAL,
    CONF_COMPARAR_MENSUAL,
    CONF_CONTRATOS_ANTERIORES,
    CONF_DIAS_EMISION,
    CONF_FIN_ULTIMA_FACTURA,
    CONF_FUENTE,
    CONF_IDS_HEREDADOS,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    CONF_SEGUNDA_OPINION,
    CONF_SHELLY_CANAL,
    CONF_SHELLY_FRECUENCIA,
    CONF_SHELLY_IP,
    CONF_TIPO_FUENTE,
    DEFAULT_ALQUILER,
    DEFAULT_DIAS_EMISION,
    ENVIOS_COMPARADOR,
    FORMATOS_COMPARADOR,
    FRECUENCIAS_SHELLY,
    FUENTE_ESTADISTICA,
    FUENTE_SENSOR,
    TIPOS_FUENTE,
)
from .engine import LIMITES_ANUALES_KWH, Bono
from .factura_pdf import DatosFactura, FacturaNoReconocida, leer_factura
from .facturacion import FacturaFutura
from .helpers import TERRITORIO_PENINSULA, config_entrada, territorio
from .prices.aiopvpc.const import REFERENCE_TZ

_LOGGER = logging.getLogger(__name__)

UNIDADES_ENERGIA = {UnitOfEnergy.WATT_HOUR, UnitOfEnergy.KILO_WATT_HOUR, UnitOfEnergy.MEGA_WATT_HOUR}
STATE_CLASSES_ENERGIA = {"total", "total_increasing"}
NOMBRE_POR_DEFECTO = "Suministro"


def _potencia() -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(
            min=0.1, max=15, step=0.001, unit_of_measurement="kW", mode=NumberSelectorMode.BOX
        )
    )


def _select(opciones: list[str], clave: str) -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(options=opciones, translation_key=clave, mode=SelectSelectorMode.DROPDOWN)
    )


def fuente_en_uso(datos_suministros: list[dict[str, Any]], tipo: str, fuente: str) -> bool:
    return any(d.get(CONF_TIPO_FUENTE) == tipo and d.get(CONF_FUENTE) == fuente for d in datos_suministros)


class SuministroSubentryFlow(ConfigSubentryFlow):
    """Añadir o reconfigurar un suministro."""

    def __init__(self) -> None:
        self._datos: dict[str, Any] = {}
        self._titulo: str = NOMBRE_POR_DEFECTO
        self._leida: DatosFactura | None = None
        self._lote: Subida | None = None
        self._hecha: tuple[date, date] | None = None

    # --- entradas -------------------------------------------------------------------

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        entry = self._get_entry()
        lugar = territorio(config_entrada(entry)[ATTR_TARIFF], self.hass.config.time_zone)
        if lugar != TERRITORIO_PENINSULA:
            # La factura solo está hecha para la Península y Baleares (helpers.territorio).
            return self.async_abort(reason=f"no_soportado_{lugar}")
        return await self._paso_datos("user", user_input)

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        return self.async_show_menu(step_id="reconfigure", menu_options=["factura_real", "datos"])

    async def async_step_datos(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        if user_input is None and not self._datos:
            subentrada = self._get_reconfigure_subentry()
            self._datos = dict(subentrada.data)
            self._titulo = subentrada.title
        return await self._paso_datos("datos", user_input)

    def _contrato_cambiado(self) -> bool:
        original = self._get_reconfigure_subentry().data
        return any(original.get(c) != self._datos.get(c) for c in CAMPOS_CONTRATO)

    async def async_step_cambio_contrato(
        self, user_input: dict[str, Any] | None = None
    ) -> SubentryFlowResult:
        """Desde qué día rige el contrato nuevo (vacío: es una corrección y vale para todo)."""
        errores: dict[str, str] = {}
        if user_input is not None:
            desde = user_input.get("vigente_desde")
            if desde and date.fromisoformat(desde) > dt_util.now().date():
                errores["vigente_desde"] = "fecha_futura"
            else:
                if desde:
                    original = self._get_reconfigure_subentry().data
                    hasta = (date.fromisoformat(desde) - timedelta(days=1)).isoformat()
                    anteriores = [
                        c for c in original.get(CONF_CONTRATOS_ANTERIORES) or [] if c["hasta"] < hasta
                    ]
                    anteriores.append({"hasta": hasta, **{c: original.get(c) for c in CAMPOS_CONTRATO}})
                    self._datos[CONF_CONTRATOS_ANTERIORES] = anteriores
                return await self.async_step_fuente()
        esquema = vol.Schema(
            {
                vol.Optional(
                    "vigente_desde", description={"suggested_value": dt_util.now().date().isoformat()}
                ): DateSelector()
            }
        )
        return self.async_show_form(step_id="cambio_contrato", data_schema=esquema, errors=errores)

    @property
    def _reconfigurando(self) -> bool:
        return self.source == "reconfigure"

    # --- pasos ----------------------------------------------------------------------

    async def _paso_datos(self, step_id: str, user_input: dict[str, Any] | None) -> SubentryFlowResult:
        errores: dict[str, str] = {}
        if user_input is not None:
            bono = user_input[CONF_BONO]
            categoria = user_input.get(CONF_CATEGORIA)
            if bono != Bono.NINGUNO and not categoria:
                errores[CONF_CATEGORIA] = "categoria_requerida"
            else:
                self._titulo = user_input[CONF_NAME].strip() or NOMBRE_POR_DEFECTO
                self._datos.update(
                    {
                        CONF_POTENCIA_P1: float(user_input[CONF_POTENCIA_P1]),
                        CONF_POTENCIA_P2: float(user_input[CONF_POTENCIA_P2]),
                        CONF_BONO: bono,
                        CONF_CATEGORIA: categoria if bono != Bono.NINGUNO else None,
                        CONF_TIPO_FUENTE: user_input[CONF_TIPO_FUENTE],
                    }
                )
                if self._reconfigurando and self._contrato_cambiado():
                    return await self.async_step_cambio_contrato()
                return await self.async_step_fuente()

        actual = {**self._datos, CONF_NAME: self._titulo, **(user_input or {})}
        esquema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=actual.get(CONF_NAME, NOMBRE_POR_DEFECTO)): str,
                vol.Required(CONF_POTENCIA_P1, default=actual.get(CONF_POTENCIA_P1, 4.6)): _potencia(),
                vol.Required(CONF_POTENCIA_P2, default=actual.get(CONF_POTENCIA_P2, 4.6)): _potencia(),
                vol.Required(CONF_BONO, default=actual.get(CONF_BONO, Bono.NINGUNO.value)): _select(
                    [b.value for b in Bono], "bono"
                ),
                vol.Optional(
                    CONF_CATEGORIA,
                    description={"suggested_value": actual.get(CONF_CATEGORIA)},
                ): _select(list(LIMITES_ANUALES_KWH), "categoria"),
                vol.Required(CONF_TIPO_FUENTE, default=actual.get(CONF_TIPO_FUENTE, FUENTE_SENSOR)): _select(
                    list(TIPOS_FUENTE), "tipo_fuente"
                ),
            }
        )
        return self.async_show_form(step_id=step_id, data_schema=esquema, errors=errores)

    async def async_step_fuente(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        tipo = self._datos[CONF_TIPO_FUENTE]
        errores: dict[str, str] = {}
        if user_input is not None:
            fuente = user_input[CONF_FUENTE]
            error = self._validar_fuente(tipo, fuente)
            if error:
                errores[CONF_FUENTE] = error
            else:
                self._datos[CONF_FUENTE] = fuente
                if tipo == FUENTE_SENSOR:
                    return await self.async_step_comprobacion()
                self._datos.update({CONF_SHELLY_IP: None, CONF_SHELLY_FRECUENCIA: "desactivada"})
                return await self.async_step_factura()

        if tipo == FUENTE_SENSOR:
            selector: Any = EntitySelector(EntitySelectorConfig(domain="sensor", device_class="energy"))
        else:
            selector = StatisticSelector(StatisticSelectorConfig())
        actual = (user_input or {}).get(CONF_FUENTE, self._datos.get(CONF_FUENTE))
        esquema = vol.Schema({vol.Required(CONF_FUENTE, description={"suggested_value": actual}): selector})
        return self.async_show_form(step_id="fuente", data_schema=esquema, errors=errores)

    async def async_step_comprobacion(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Opcional: comprobar el consumo de HA con la memoria de un Shelly EM."""
        if user_input is not None:
            ip = (user_input.get(CONF_SHELLY_IP) or "").strip().removeprefix("http://").strip("/")
            self._datos.update(
                {
                    CONF_SHELLY_IP: ip or None,
                    CONF_SHELLY_CANAL: int(user_input.get(CONF_SHELLY_CANAL, "1")) - 1,
                    CONF_SHELLY_FRECUENCIA: user_input[CONF_SHELLY_FRECUENCIA] if ip else "desactivada",
                }
            )
            return await self.async_step_factura()
        esquema = vol.Schema(
            {
                vol.Optional(
                    CONF_SHELLY_IP, description={"suggested_value": self._datos.get(CONF_SHELLY_IP)}
                ): str,
                vol.Required(
                    CONF_SHELLY_CANAL, default=str(int(self._datos.get(CONF_SHELLY_CANAL, 0)) + 1)
                ): _select(["1", "2"], "shelly_canal"),
                vol.Required(
                    CONF_SHELLY_FRECUENCIA, default=self._datos.get(CONF_SHELLY_FRECUENCIA, "diaria")
                ): _select(list(FRECUENCIAS_SHELLY), "shelly_frecuencia"),
            }
        )
        return self.async_show_form(step_id="comprobacion", data_schema=esquema)

    async def async_step_factura(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        errores: dict[str, str] = {}
        if user_input is not None:
            codigo_postal = (user_input.get(CONF_CODIGO_POSTAL) or "").strip()
            if codigo_postal and not (len(codigo_postal) == 5 and codigo_postal.isdigit()):
                errores[CONF_CODIGO_POSTAL] = "codigo_postal_invalido"
            if error := self._validar_fin_ultima_factura(user_input.get(CONF_FIN_ULTIMA_FACTURA)):
                errores[CONF_FIN_ULTIMA_FACTURA] = error
        if user_input is not None and not errores:
            fin = user_input.get(CONF_FIN_ULTIMA_FACTURA)
            self._datos.update(
                {
                    CONF_FIN_ULTIMA_FACTURA: date.fromisoformat(fin).isoformat() if fin else None,
                    CONF_DIAS_EMISION: int(user_input[CONF_DIAS_EMISION]),
                    CONF_ALQUILER: float(user_input[CONF_ALQUILER]),
                    CONF_ARRASTRE_INICIAL: int(user_input.get(CONF_ARRASTRE_INICIAL) or 0),
                    CONF_CODIGO_POSTAL: codigo_postal or None,
                    CONF_COMPARAR_MENSUAL: bool(user_input.get(CONF_COMPARAR_MENSUAL))
                    and bool(codigo_postal),
                    CONF_SEGUNDA_OPINION: bool(user_input.get(CONF_SEGUNDA_OPINION)) and bool(codigo_postal),
                    CONF_COMPARADOR_DESTINO: user_input.get(CONF_COMPARADOR_DESTINO) or None,
                    CONF_COMPARADOR_ENVIO: user_input.get(CONF_COMPARADOR_ENVIO, "siempre"),
                    CONF_COMPARADOR_UMBRAL: float(user_input.get(CONF_COMPARADOR_UMBRAL) or 0),
                    CONF_COMPARADOR_FORMATO: user_input.get(CONF_COMPARADOR_FORMATO, "completo"),
                }
            )
            self._datos.setdefault(CONF_IDS_HEREDADOS, {})
            if self._reconfigurando:
                inicio_antes = self._inicio_periodo_actual()
                nuevo = self._datos.get(CONF_FIN_ULTIMA_FACTURA)
                if not nuevo or nuevo == inicio_antes:
                    return self.async_update_and_abort(
                        self._get_entry(),
                        self._get_reconfigure_subentry(),
                        title=self._titulo,
                        data=self._datos,
                    )
                # Cambia el inicio del periodo en curso: se rehace al recargar y se dice desde cuándo.
                self.hass.config_entries.async_update_subentry(
                    self._get_entry(), self._get_reconfigure_subentry(), title=self._titulo, data=self._datos
                )
                return self.async_abort(
                    reason="periodo_cambiado",
                    description_placeholders={"inicio": _dma(date.fromisoformat(nuevo))},
                )
            return self.async_create_entry(title=self._titulo, data=self._datos)

        esquema = vol.Schema(
            {
                vol.Optional(
                    CONF_FIN_ULTIMA_FACTURA,
                    description={"suggested_value": self._inicio_periodo_actual()},
                ): DateSelector(),
                vol.Required(
                    CONF_DIAS_EMISION, default=self._datos.get(CONF_DIAS_EMISION, DEFAULT_DIAS_EMISION)
                ): NumberSelector(NumberSelectorConfig(min=0, max=30, step=1, mode=NumberSelectorMode.BOX)),
                vol.Optional(
                    CONF_ARRASTRE_INICIAL, default=int(self._datos.get(CONF_ARRASTRE_INICIAL, 0))
                ): NumberSelector(NumberSelectorConfig(min=0, max=5000, step=1, mode=NumberSelectorMode.BOX)),
                vol.Required(
                    CONF_ALQUILER, default=self._datos.get(CONF_ALQUILER, DEFAULT_ALQUILER)
                ): NumberSelector(
                    NumberSelectorConfig(
                        min=0, max=5, step=0.01, unit_of_measurement="€", mode=NumberSelectorMode.BOX
                    )
                ),
                vol.Optional(
                    CONF_CODIGO_POSTAL, description={"suggested_value": self._datos.get(CONF_CODIGO_POSTAL)}
                ): str,
                vol.Optional(
                    CONF_COMPARAR_MENSUAL, default=bool(self._datos.get(CONF_COMPARAR_MENSUAL))
                ): bool,
                vol.Optional(CONF_SEGUNDA_OPINION, default=bool(self._datos.get(CONF_SEGUNDA_OPINION))): bool,
                vol.Optional(
                    CONF_COMPARADOR_DESTINO,
                    description={"suggested_value": self._datos.get(CONF_COMPARADOR_DESTINO)},
                ): EntitySelector(EntitySelectorConfig(domain="notify")),
                vol.Optional(
                    CONF_COMPARADOR_ENVIO, default=self._datos.get(CONF_COMPARADOR_ENVIO, "siempre")
                ): _select(ENVIOS_COMPARADOR, CONF_COMPARADOR_ENVIO),
                vol.Optional(
                    CONF_COMPARADOR_UMBRAL, default=float(self._datos.get(CONF_COMPARADOR_UMBRAL) or 0)
                ): NumberSelector(
                    NumberSelectorConfig(
                        min=0, max=5000, step=1, unit_of_measurement="€", mode=NumberSelectorMode.BOX
                    )
                ),
                vol.Optional(
                    CONF_COMPARADOR_FORMATO, default=self._datos.get(CONF_COMPARADOR_FORMATO, "completo")
                ): _select(FORMATOS_COMPARADOR, CONF_COMPARADOR_FORMATO),
            }
        )
        return self.async_show_form(step_id="factura", data_schema=esquema, errors=errores)

    # --- factura real (conciliación) -------------------------------------------------

    def _facturacion(self) -> Any:
        """Coordinador de facturación del suministro (None si la integración no está cargada)."""
        if not self._reconfigurando:
            return None
        datos = getattr(self._get_entry(), "runtime_data", None)
        return getattr(datos, "suministros", {}).get(self._reconfigure_subentry_id)

    def _inicio_periodo_actual(self) -> str | None:
        """La fecha que de verdad rige: el inicio del periodo en curso (avanza con cada cierre o
        factura), no la que se tecleó en el alta."""
        facturacion = self._facturacion()
        if facturacion is not None and facturacion.inicio_periodo is not None:
            return facturacion.inicio_periodo.isoformat()
        return self._datos.get(CONF_FIN_ULTIMA_FACTURA)

    def _validar_fin_ultima_factura(self, fin: str | None) -> str | None:
        """No puede ser anterior al fin de una factura real ya introducida (esa manda)."""
        if not fin:
            return None
        facturacion = self._facturacion()
        conciliada = facturacion.ultima_conciliada() if facturacion is not None else None
        if conciliada is not None and date.fromisoformat(fin) < date.fromisoformat(conciliada["fin"]):
            return "antes_de_factura_real"
        return None

    async def async_step_factura_real(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Subir el PDF de la factura (opcional) para rellenar el formulario."""
        if self._facturacion() is None:
            return self.async_abort(reason="no_cargada")
        errores: dict[str, str] = {}
        self._leida = None
        if user_input is not None:
            archivo = user_input.get("pdf")
            if not archivo:
                return await self.async_step_factura_datos()
            try:
                leidas = await self.hass.async_add_executor_job(_leer_subida, self.hass, archivo)
            except ValueError:
                errores["pdf"] = "pdf_no_subido"
            else:
                if leidas.zip:
                    leidas.apartar_no_validas(dt_util.now(REFERENCE_TZ).date())
                    if not leidas.buenas:
                        errores["pdf"] = "zip_sin_facturas"
                    else:
                        self._lote = leidas
                        return await self.async_step_factura_lote()
                elif leidas.buenas:
                    self._leida = leidas.buenas[0][1]
                    return await self.async_step_factura_datos()
                else:
                    errores["pdf"] = leidas.malas[0][1]
        esquema = vol.Schema(
            {
                vol.Optional("pdf"): FileSelector(
                    FileSelectorConfig(accept=".pdf,.zip,application/pdf,application/zip")
                )
            }
        )
        return self.async_show_form(step_id="factura_real", data_schema=esquema, errors=errores)

    async def async_step_factura_datos(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Datos de la factura real; si vienen del PDF, el usuario solo tiene que revisarlos."""
        facturacion = self._facturacion()
        if facturacion is None:
            return self.async_abort(reason="no_cargada")
        errores: dict[str, str] = {}
        if user_input is not None:
            inicio = date.fromisoformat(user_input["inicio"])
            fin = date.fromisoformat(user_input["fin"])
            emision = user_input.get("emision")
            bonificados = user_input.get("kwh_bonificados")
            try:
                await facturacion.async_conciliar(
                    inicio=inicio,
                    fin=fin,
                    emision=date.fromisoformat(emision) if emision else None,
                    kwh={p: int(user_input[f"kwh_{p.lower()}"]) for p in ("P1", "P2", "P3")},
                    total=Decimal(str(user_input["total"])).quantize(Decimal("0.01")),
                    bonificados=int(bonificados) if bonificados is not None else None,
                )
            except FacturaFutura:
                errores["fin"] = "factura_futura"
            except ValueError:
                errores["base"] = "periodo_no_valido"
            else:
                self._hecha = (inicio, fin)
                return await self.async_step_factura_hecha()

        sugerido = self._sugerencia_factura(facturacion)
        actual = {**sugerido, **(user_input or {})}
        kwh = NumberSelector(
            NumberSelectorConfig(
                min=0, max=100000, step=1, unit_of_measurement="kWh", mode=NumberSelectorMode.BOX
            )
        )

        def _campo(clave: str, obligatorio: bool = True) -> vol.Marker:
            tipo = vol.Required if obligatorio else vol.Optional
            return tipo(clave, description={"suggested_value": actual.get(clave)})

        esquema = vol.Schema(
            {
                _campo("inicio"): DateSelector(),
                _campo("fin"): DateSelector(),
                _campo("emision", False): DateSelector(),
                _campo("kwh_p1"): kwh,
                _campo("kwh_p2"): kwh,
                _campo("kwh_p3"): kwh,
                _campo("total"): NumberSelector(
                    NumberSelectorConfig(
                        min=0, max=100000, step=0.01, unit_of_measurement="€", mode=NumberSelectorMode.BOX
                    )
                ),
                _campo("kwh_bonificados", False): kwh,
            }
        )
        return self.async_show_form(step_id="factura_datos", data_schema=esquema, errors=errores)

    async def async_step_factura_hecha(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Factura introducida: añadir otra sin salir, o terminar."""
        inicio, fin = self._hecha
        return self.async_show_menu(
            step_id="factura_hecha",
            menu_options=["factura_real", "terminar"],
            description_placeholders={"inicio": _dma(inicio), "fin": _dma(fin)},
        )

    async def async_step_terminar(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        inicio, fin = self._hecha
        return self.async_abort(
            reason="factura_conciliada",
            description_placeholders={"inicio": inicio.isoformat(), "fin": fin.isoformat()},
        )

    async def async_step_factura_lote(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        """Varias facturas de un ZIP: se revisa la lista y se introducen todas de una vez."""
        facturacion = self._facturacion()
        if facturacion is None:
            return self.async_abort(reason="no_cargada")
        lote = self._lote
        buenas = sorted(lote.buenas, key=lambda x: x[1].inicio)
        if user_input is not None:
            hechas = 0
            fallidas: list[str] = []
            for nombre, f in buenas:
                try:
                    await facturacion.async_conciliar(
                        inicio=f.inicio,
                        fin=f.fin,
                        emision=f.emision,
                        kwh=dict(f.kwh),
                        total=f.total,
                        bonificados=f.bonificados,
                    )
                except ValueError:
                    _LOGGER.warning("Factura %s del ZIP no válida (%s – %s)", nombre, f.inicio, f.fin)
                    fallidas.append(nombre)
                else:
                    hechas += 1
            return self.async_abort(
                reason="lote_conciliado",
                description_placeholders={
                    "n": str(hechas),
                    "fallidas": f" ✗ {', '.join(fallidas)}" if fallidas else "",
                },
            )
        lineas = [f"- {_dma(f.inicio)} – {_dma(f.fin)}: **{_euros_texto(f.total)}**" for _, f in buenas]
        es = self.hass.config.language.split("-")[0] == "es"
        motivos = MOTIVOS_ZIP["es" if es else "en"]
        malas = [f"- {nombre}: {motivos.get(motivo, motivo)}" for nombre, motivo in lote.malas]
        return self.async_show_form(
            step_id="factura_lote",
            data_schema=vol.Schema({}),
            description_placeholders={
                "n": str(len(buenas)),
                "lista": "\n".join(lineas),
                "descartadas": (
                    "\n\n" + ("Se quedan fuera:" if es else "Left out:") + "\n" + "\n".join(malas)
                )
                if malas
                else "",
            },
        )

    def _sugerencia_factura(self, facturacion: Any) -> dict[str, Any]:
        leida = self._leida
        if leida is not None:
            return {
                "inicio": leida.inicio.isoformat(),
                "fin": leida.fin.isoformat(),
                "emision": leida.emision.isoformat() if leida.emision else None,
                **{f"kwh_{p.lower()}": v for p, v in leida.kwh.items()},
                "total": float(leida.total),
                "kwh_bonificados": leida.bonificados,
            }
        pendiente = facturacion.periodo_pendiente()
        if pendiente is None:
            return {}
        inicio, fin = pendiente
        dias = int(self._get_reconfigure_subentry().data.get(CONF_DIAS_EMISION, DEFAULT_DIAS_EMISION))
        return {
            "inicio": inicio.isoformat(),
            "fin": fin.isoformat(),
            "emision": (fin + timedelta(days=dias)).isoformat(),
        }

    # --- validación -----------------------------------------------------------------

    def _validar_fuente(self, tipo: str, fuente: str) -> str | None:
        otros = [
            dict(s.data)
            for sid, s in self._get_entry().subentries.items()
            if not (self._reconfigurando and sid == self._reconfigure_subentry_id)
        ]
        if fuente_en_uso(otros, tipo, fuente):
            return "fuente_en_uso"
        if tipo == FUENTE_ESTADISTICA:
            # Las estadísticas de entidades (sensor.x) se eligen como sensor.
            return None if ":" in fuente else "estadistica_no_externa"
        estado = self.hass.states.get(fuente)
        if estado is None:
            return "fuente_no_encontrada"
        if (
            estado.attributes.get("device_class") != "energy"
            or estado.attributes.get("unit_of_measurement") not in UNIDADES_ENERGIA
            or estado.attributes.get("state_class") not in STATE_CLASSES_ENERGIA
        ):
            return "fuente_no_energia"
        return None


# Límites de lo subido (para no leer un ZIP enorme o malicioso). Una factura de la COR pesa ~1 MiB;
# 12 PDF son un año entero. Dentro del ZIP se cuentan los bytes descomprimidos de verdad, no los
# que declara el propio ZIP, así que lo leído nunca pasa de 12 × 4 MiB.
MAX_FACTURAS_ZIP = 12
MAX_BYTES_PDF = 4 * 1024 * 1024
MAX_BYTES_ZIP = 50 * 1024 * 1024
MOTIVOS_ZIP = {
    "es": {
        "pdf_no_reconocido": "no se reconoce (solo facturas de la Comercializadora Regulada, Gas & Power)",
        "es_abono": "es un abono (importe negativo)",
        "demasiado_grande": "demasiado grande",
        "sobran": f"hay más de {MAX_FACTURAS_ZIP} PDF en el ZIP",
        "no_legible": "no se puede descomprimir (¿con contraseña o dañado?)",
        "factura_futura": "acaba después de hoy (revisa las fechas de la factura)",
        "periodo_no_valido": "el periodo no tiene entre 1 y 62 días",
    },
    "en": {
        "pdf_no_reconocido": "not recognised (only bills from Comercializadora Regulada, Gas & Power)",
        "es_abono": "it is a credit note (negative amount)",
        "demasiado_grande": "too large",
        "sobran": f"more than {MAX_FACTURAS_ZIP} PDFs in the ZIP",
        "no_legible": "cannot be extracted (password-protected or damaged?)",
        "factura_futura": "ends after today (check the bill dates)",
        "periodo_no_valido": "the period is not between 1 and 62 days",
    },
}


@dataclass
class Subida:
    """Facturas leídas de lo subido: un PDF o un ZIP con varios."""

    zip: bool
    buenas: list[tuple[str, DatosFactura]] = field(default_factory=list)
    malas: list[tuple[str, str]] = field(default_factory=list)  # (archivo, motivo)

    def apartar_no_validas(self, hoy: date) -> None:
        """Aparta, con su motivo, las que el motor rechazaría al introducirlas (antes se
        descartaban en silencio después de pulsar Enviar)."""
        for nombre, f in list(self.buenas):
            if f.fin > hoy:
                motivo = "factura_futura"
            elif f.fin <= f.inicio or (f.fin - f.inicio).days > 62:
                motivo = "periodo_no_valido"
            else:
                continue
            self.buenas.remove((nombre, f))
            self.malas.append((nombre, motivo))

    def leer(self, nombre: str, contenido: bytes) -> None:
        try:
            factura = leer_factura(contenido)
        except FacturaNoReconocida as exc:
            _LOGGER.info("PDF de factura no reconocido (%s): %s", nombre, exc)
            self.malas.append((nombre, "pdf_no_reconocido"))
            return
        if factura.total < 0:
            self.malas.append((nombre, "es_abono"))
        else:
            self.buenas.append((nombre, factura))


def _leer_subida(hass: Any, archivo: str) -> Subida:
    """Lee el PDF (o el ZIP de PDF) subido con el selector de archivos, en el ejecutor."""
    from homeassistant.components.file_upload import process_uploaded_file

    with process_uploaded_file(hass, archivo) as ruta:
        nombre = Path(ruta).name
        with Path(ruta).open("rb") as f:
            es_zip = f.read(2) == b"PK"
            if os.fstat(f.fileno()).st_size > (MAX_BYTES_ZIP if es_zip else MAX_BYTES_PDF):
                return Subida(zip=False, malas=[(nombre, "demasiado_grande")])
            f.seek(0)
            contenido = f.read()
    if not es_zip:
        subida = Subida(zip=False)
        subida.leer(nombre, contenido)
        return subida
    subida = Subida(zip=True)
    try:
        with zipfile.ZipFile(io.BytesIO(contenido)) as z:
            pdfs = [
                i
                for i in z.infolist()
                if not i.is_dir()
                and i.filename.lower().endswith(".pdf")
                and not Path(i.filename).name.startswith(".")
                and "__MACOSX" not in i.filename
            ]
            for n, info in enumerate(pdfs):
                nombre = Path(info.filename).name
                if n >= MAX_FACTURAS_ZIP:
                    subida.malas.append((nombre, "sobran"))
                elif info.file_size > MAX_BYTES_PDF:
                    subida.malas.append((nombre, "demasiado_grande"))
                else:
                    try:
                        datos = _leer_miembro(z, info)
                    except (
                        zipfile.BadZipFile,
                        RuntimeError,
                        NotImplementedError,
                        zlib.error,
                        EOFError,
                        OSError,
                    ):
                        # Con contraseña, dañado (CRC) o con una compresión que zipfile no conoce.
                        subida.malas.append((nombre, "no_legible"))
                        continue
                    if datos is None:
                        subida.malas.append((nombre, "demasiado_grande"))
                    else:
                        subida.leer(nombre, datos)
    except zipfile.BadZipFile as exc:
        raise ValueError("ZIP no válido") from exc
    return subida


def _leer_miembro(z: zipfile.ZipFile, info: zipfile.ZipInfo) -> bytes | None:
    """Descomprime un PDF del ZIP por bloques; None si pasa de MAX_BYTES_PDF (diga lo que diga el ZIP)."""
    with z.open(info) as f:
        datos = f.read(MAX_BYTES_PDF + 1)
    return None if len(datos) > MAX_BYTES_PDF else datos


def _dma(d: date) -> str:
    return f"{d:%d/%m/%Y}"


def _euros_texto(x: Decimal) -> str:
    return f"{x:.2f} €".replace(".", ",")
