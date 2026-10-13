"""Comparador de tarifas de un suministro (DISENO §8 bis, F8): consulta, resultado y avisos.

Al pulsar el botón «Comparar tarifas» (o con el servicio `comparar_tarifas`, o una vez al mes
si el usuario lo activa):

1. se toman los periodos de factura de los últimos 12 meses del suministro (lo pagado y los
   kWh por periodo; también lo que habría costado el PVPC sin bono);
2. se envían a la CNMC **solo** el código postal, las potencias y los kWh anuales por periodo;
3. se guarda el resultado (sensor «Mejor alternativa de tarifa») y se avisa con una
   notificación persistente y, si se pide, por un destino `notify` (Telegram incluido).

Un fallo de la CNMC no afecta a nada más: se avisa y se conserva la comparativa anterior.
"""

from __future__ import annotations

import contextlib
import logging
import re
from collections.abc import Mapping
from datetime import datetime
from decimal import Decimal
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .cnmc import CnmcNoResponde, ConsultaCnmc, async_consultar
from .comparativa import (
    AVISO_COBERTURA,
    AVISO_ESTIMADAS,
    AVISO_EXTRAPOLADO,
    AVISO_PIERDE_BONO,
    AVISO_SIN_OFERTAS,
    MAX_OFERTAS,
    VEREDICTO_LIBRE,
    VEREDICTO_LIBRE_PIERDE_BONO,
    VEREDICTO_QUEDARSE,
    VEREDICTO_QUEDARSE_CON_BONO,
    Comparativa,
    comparar,
    consulta_anual,
    ventana_12_meses,
)
from .const import CONF_CODIGO_POSTAL, CONF_COMPARAR_MENSUAL, CONF_POTENCIA_P1, CONF_POTENCIA_P2, DOMAIN
from .facturacion import FacturacionSuministro

_LOGGER = logging.getLogger(__name__)
STORE_VERSION = 1
DIA_MENSUAL = 2  # el día 2 de cada mes a las 10:17
HORA_MENSUAL = (10, 17)
MOSTRADAS = 3

ESTADO_OK = "ok"
ESTADO_SIN_CODIGO_POSTAL = "sin_codigo_postal"
ESTADO_SIN_DATOS = "sin_datos"
ESTADO_CNMC_NO_RESPONDE = "cnmc_no_responde"


def senal(subentry_id: str) -> str:
    return f"{DOMAIN}_comparador_{subentry_id}"


def _f(x: Decimal | None) -> float | None:
    return None if x is None else float(x)


def a_dict(c: Comparativa, ahora: datetime) -> dict[str, Any]:
    """Resultado guardable (JSON) y que se muestra en los atributos del sensor."""
    v = c.ventana
    return {
        "fecha": ahora.isoformat(timespec="minutes"),
        "periodo": {
            "inicio": v.inicio.isoformat(),
            "fin": v.fin.isoformat(),
            "dias": v.dias,
            "facturas_conciliadas": v.conciliadas,
            "facturas_estimadas": v.estimadas,
        },
        "kwh": {k: float(x) for k, x in v.kwh.items()},
        "kwh_anuales": dict(c.kwh_anuales),
        "pagado": float(v.pagado),
        "pagado_anual": float(v.pagado_anual),
        "pagado_sin_bono": _f(v.pagado_sin_bono) if v.con_bono else None,
        "pagado_sin_bono_anual": _f(v.pagado_sin_bono_anual) if v.con_bono else None,
        "pvpc_cnmc": _f(c.pvpc_cnmc),
        "ofertas": [
            {
                "comercializadora": a.oferta.comercializadora,
                "oferta": a.oferta.oferta,
                "importe_primer_anio": float(a.oferta.importe_primer_anio),
                "importe_segundo_anio": float(a.oferta.importe_segundo_anio),
                "ahorro_anual": float(a.ahorro_primer_anio),
                "ahorro_segundo_anio": float(a.ahorro_segundo_anio),
                "permanencia": a.oferta.permanencia,
                "penalizacion": float(a.oferta.penalizacion_eur),
                "servicios_adicionales": a.oferta.servicios_adicionales,
                "verde": a.oferta.verde,
                "precio_unico": a.oferta.precio_unico,
                "solo_nuevos_clientes": a.oferta.solo_nuevos_clientes,
                "validez": a.oferta.validez,
                "tipo": a.oferta.tipo,
            }
            for a in c.alternativas[:MAX_OFERTAS]
        ],
        "total_ofertas": c.total_ofertas,
        "grandes_ausentes": list(c.grandes_ausentes),
        "avisos": list(c.avisos),
        "veredicto": c.veredicto,
    }


# --- texto -------------------------------------------------------------------------------


def _eur(x: float, idioma: str) -> str:
    texto = f"{x:,.2f}"
    if idioma == "es":
        texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
        return f"{texto} €"
    return f"€{texto}"


def _kwh(x: float, idioma: str) -> str:
    texto = f"{round(x):,}"
    return texto.replace(",", ".") if idioma == "es" else texto


def _limpio(nombre: str) -> str:
    """Sin los caracteres que rompen el Markdown de Telegram (un `_` suelto tumba el envío)."""
    return " ".join(re.sub(r"[_*`\[\]]", " ", nombre).split())


def _fecha(iso: str, idioma: str) -> str:
    a, m, d = iso.split("-")
    return f"{d}/{m}/{a}" if idioma == "es" else iso


TEXTOS = {
    "es": {
        "titulo": "Comparativa de tarifas · {nombre}",
        "periodo": "Del {inicio} al {fin} ({dias} días, {facturas}): {kwh} kWh "
        "(P1 {p1} · P2 {p2} · P3 {p3}).",
        "facturas": "{n} facturas",
        "factura": "1 factura",
        "facturas_estimadas": "{n} facturas, {e} estimadas",
        "pagado": "Has pagado {pagado} ({anual} en un año).",
        "pagado_bono": "Con bono social has pagado {pagado} ({anual} en un año). Sin bono, en el PVPC, "
        "habrías pagado {sin} ({sin_anual} en un año).",
        "mejores": "Mejores ofertas de mercado libre (CNMC, primer año, con tu consumo real):",
        "oferta": "{i}. {comercializadora}, «{oferta}»: {importe}{segundo} → {ahorro}",
        "segundo": " (2.º año {importe})",
        "ahorra": "ahorras {x} al año",
        "cuesta": "pagas {x} más al año",
        "permanencia": " Permanencia (penalización ~{x}).",
        "servicios": " Con servicios adicionales.",
        "nuevos": " Solo nuevos clientes.",
        "pvpc_cnmc": "PVPC sin bono según la CNMC: {x} al año.",
        "ninguna": "La CNMC no ha devuelto ninguna oferta de mercado libre para tu código postal.",
        AVISO_PIERDE_BONO: "⚠️ El bono social solo existe con el PVPC de una comercializadora de "
        "referencia: si cambias a mercado libre, lo pierdes. Compara con lo que pagas con bono.",
        AVISO_COBERTURA: "⚠️ El comparador de la CNMC solo incluye las ofertas que le envían las "
        "comercializadoras; no están: {ausentes}. No es un censo completo del mercado.",
        AVISO_EXTRAPOLADO: "⚠️ Solo hay {dias} días de facturas: lo pagado y el consumo se han "
        "extrapolado a un año.",
        AVISO_ESTIMADAS: "⚠️ Hay facturas estimadas: concilia las facturas reales para afinar la comparativa.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ Con tu bono social, el PVPC sigue siendo lo más barato: la "
        "mejor oferta libre te costaría {x} más al año.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 La mejor oferta libre sale {x} más barata al año que lo que "
        "pagas con bono, aunque lo perderías. Comprueba las condiciones antes de cambiar.",
        VEREDICTO_LIBRE: "💡 Con la mejor oferta te ahorrarías {x} al año.",
        VEREDICTO_QUEDARSE: "✅ Ninguna oferta mejora lo que pagas: la mejor te costaría {x} más al año.",
        "impuestos": "Los importes de la CNMC llevan los impuestos y el alquiler del contador de hoy; "
        "lo pagado, los de cada factura.",
    },
    "en": {
        "titulo": "Tariff comparison · {nombre}",
        "periodo": "From {inicio} to {fin} ({dias} days, {facturas}): {kwh} kWh "
        "(P1 {p1} · P2 {p2} · P3 {p3}).",
        "facturas": "{n} bills",
        "factura": "1 bill",
        "facturas_estimadas": "{n} bills, {e} estimated",
        "pagado": "You paid {pagado} ({anual} per year).",
        "pagado_bono": "With the social bonus you paid {pagado} ({anual} per year). Without it, on PVPC, "
        "you would have paid {sin} ({sin_anual} per year).",
        "mejores": "Best free-market offers (CNMC, first year, with your real consumption):",
        "oferta": "{i}. {comercializadora}, “{oferta}”: {importe}{segundo} → {ahorro}",
        "segundo": " (2nd year {importe})",
        "ahorra": "you save {x} per year",
        "cuesta": "you pay {x} more per year",
        "permanencia": " Minimum stay (penalty ~{x}).",
        "servicios": " With additional services.",
        "nuevos": " New customers only.",
        "pvpc_cnmc": "PVPC without bonus according to the CNMC: {x} per year.",
        "ninguna": "The CNMC returned no free-market offers for your postal code.",
        AVISO_PIERDE_BONO: "⚠️ The social bonus only exists with the PVPC of a reference retailer: "
        "switching to the free market loses it. Compare with what you pay with the bonus.",
        AVISO_COBERTURA: "⚠️ The CNMC comparator only includes offers sent by retailers; missing: "
        "{ausentes}. It is not a complete census of the market.",
        AVISO_EXTRAPOLADO: "⚠️ Only {dias} days of bills: payments and consumption were extrapolated "
        "to a year.",
        AVISO_ESTIMADAS: "⚠️ Some bills are estimates: reconcile the real bills to refine the comparison.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ With your social bonus, PVPC is still the cheapest: the best "
        "free-market offer would cost you {x} more per year.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 The best free-market offer is {x} per year cheaper than what you "
        "pay with the bonus, although you would lose it. Check the conditions before switching.",
        VEREDICTO_LIBRE: "💡 With the best offer you would save {x} per year.",
        VEREDICTO_QUEDARSE: "✅ No offer beats what you pay: the best would cost you {x} more per year.",
        "impuestos": "CNMC amounts use today's taxes and meter rental; payments, those of each bill.",
    },
}


def texto(r: Mapping[str, Any], nombre: str, idioma: str = "es") -> tuple[str, str]:
    """(título, texto) de la comparativa guardada."""
    idioma = "es" if idioma.split("-")[0] == "es" else "en"
    t = TEXTOS[idioma]
    p = r["periodo"]
    facturas = (
        t["facturas_estimadas"].format(
            n=p["facturas_conciliadas"] + p["facturas_estimadas"], e=p["facturas_estimadas"]
        )
        if p["facturas_estimadas"]
        else t["facturas" if p["facturas_conciliadas"] != 1 else "factura"].format(
            n=p["facturas_conciliadas"]
        )
    )
    k = r["kwh"]
    lineas = [
        t["periodo"].format(
            inicio=_fecha(p["inicio"], idioma),
            fin=_fecha(p["fin"], idioma),
            dias=p["dias"],
            facturas=facturas,
            kwh=_kwh(sum(k.values()), idioma),
            p1=_kwh(k["P1"], idioma),
            p2=_kwh(k["P2"], idioma),
            p3=_kwh(k["P3"], idioma),
        )
    ]
    if r.get("pagado_sin_bono") is not None:
        lineas.append(
            t["pagado_bono"].format(
                pagado=_eur(r["pagado"], idioma),
                anual=_eur(r["pagado_anual"], idioma),
                sin=_eur(r["pagado_sin_bono"], idioma),
                sin_anual=_eur(r["pagado_sin_bono_anual"], idioma),
            )
        )
    else:
        lineas.append(
            t["pagado"].format(pagado=_eur(r["pagado"], idioma), anual=_eur(r["pagado_anual"], idioma))
        )
    lineas.append("")
    ofertas = r["ofertas"][:MOSTRADAS]
    if ofertas:
        lineas.append(t["mejores"])
        for i, o in enumerate(ofertas, 1):
            ahorro = o["ahorro_anual"]
            segundo = (
                t["segundo"].format(importe=_eur(o["importe_segundo_anio"], idioma))
                if o["importe_segundo_anio"] and o["importe_segundo_anio"] != o["importe_primer_anio"]
                else ""
            )
            linea = t["oferta"].format(
                i=i,
                comercializadora=_limpio(o["comercializadora"]),
                oferta=_limpio(o["oferta"]),
                importe=_eur(o["importe_primer_anio"], idioma),
                segundo=segundo,
                ahorro=(t["ahorra"] if ahorro >= 0 else t["cuesta"]).format(x=_eur(abs(ahorro), idioma)),
            )
            if o["permanencia"]:
                linea += t["permanencia"].format(x=_eur(o["penalizacion"], idioma))
            if o["servicios_adicionales"]:
                linea += t["servicios"]
            if o["solo_nuevos_clientes"]:
                linea += t["nuevos"]
            lineas.append(linea)
    else:
        lineas.append(t["ninguna"])
    if r.get("pvpc_cnmc") is not None:
        lineas.append(t["pvpc_cnmc"].format(x=_eur(r["pvpc_cnmc"], idioma)))
    if r.get("veredicto") and r["ofertas"]:
        lineas += ["", t[r["veredicto"]].format(x=_eur(abs(r["ofertas"][0]["ahorro_anual"]), idioma))]
    avisos = [a for a in r["avisos"] if a != AVISO_SIN_OFERTAS]
    if avisos:
        lineas.append("")
    for aviso in avisos:
        lineas.append(
            t[aviso].format(ausentes=", ".join(x.title() for x in r["grandes_ausentes"]), dias=p["dias"])
        )
    lineas += ["", t["impuestos"]]
    return t["titulo"].format(nombre=nombre), "\n".join(lineas)


# --- coordinador ----------------------------------------------------------------------------


class Comparador:
    """Comparativa de un suministro: la última buena se guarda y la ve el sensor."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, facturacion: FacturacionSuministro) -> None:
        self.hass = hass
        self.entry = entry
        self.facturacion = facturacion
        self.subentry_id = facturacion.subentrada.subentry_id
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{DOMAIN}.comparador_{self.subentry_id}"
        )
        self.resultado: dict[str, Any] | None = None
        self.estado: str | None = None
        self.ultimo_intento: str | None = None

    @property
    def nombre(self) -> str:
        return self.facturacion.subentrada.title

    @property
    def codigo_postal(self) -> str | None:
        return self.facturacion.datos.get(CONF_CODIGO_POSTAL) or None

    async def async_cargar(self) -> None:
        guardado = await self._store.async_load() or {}
        self.resultado = guardado.get("resultado")
        self.estado = guardado.get("estado")
        self.ultimo_intento = guardado.get("ultimo_intento")

    async def _async_guardar(self) -> None:
        await self._store.async_save(
            {"resultado": self.resultado, "estado": self.estado, "ultimo_intento": self.ultimo_intento}
        )
        async_dispatcher_send(self.hass, senal(self.subentry_id))

    async def async_comparar(self, *, destino: str | None = None, notificar: bool = True) -> dict[str, Any]:
        """Hace la comparativa; HomeAssistantError (con aviso) si no se puede."""
        ahora = dt_util.now()
        self.ultimo_intento = ahora.isoformat(timespec="minutes")
        try:
            comparativa = await self._async_calcular()
        except _Fallo as fallo:
            self.estado = fallo.estado
            await self._async_guardar()
            if notificar:
                persistent_notification.async_create(
                    self.hass,
                    fallo.mensaje,
                    title=TEXTOS["es"]["titulo"].format(nombre=self.nombre),
                    notification_id=f"{DOMAIN}_comparador_{self.subentry_id}",
                )
            raise HomeAssistantError(fallo.mensaje) from fallo
        self.resultado = a_dict(comparativa, ahora)
        self.estado = ESTADO_OK
        await self._async_guardar()
        titulo, cuerpo = texto(self.resultado, self.nombre, self.hass.config.language)
        if notificar:
            persistent_notification.async_create(
                self.hass, cuerpo, title=titulo, notification_id=f"{DOMAIN}_comparador_{self.subentry_id}"
            )
        if destino:
            from .notificacion import async_mandar, destino_telegram

            await async_mandar(self.hass, destino, titulo, cuerpo, destino_telegram(self.hass, destino))
        return self.resultado

    async def _async_calcular(self) -> Comparativa:
        if not self.codigo_postal:
            raise _Fallo(
                ESTADO_SIN_CODIGO_POSTAL,
                "Falta el código postal del suministro: añádelo en «Reconfigurar» para comparar tarifas.",
            )
        ventana = ventana_12_meses(await self.facturacion.async_periodos_pagados())
        if ventana is None:
            raise _Fallo(
                ESTADO_SIN_DATOS,
                "Aún no hay ningún periodo de factura cerrado: hace falta al menos uno para comparar.",
            )
        d = self.facturacion.datos
        consulta = ConsultaCnmc(
            self.codigo_postal,
            Decimal(str(d[CONF_POTENCIA_P1])),
            Decimal(str(d[CONF_POTENCIA_P2])),
            consulta_anual(ventana),
        )
        try:
            ofertas = await async_consultar(async_get_clientsession(self.hass), consulta)
        except CnmcNoResponde as exc:
            _LOGGER.warning("%s: el comparador de la CNMC no responde (%s)", self.nombre, exc)
            raise _Fallo(
                ESTADO_CNMC_NO_RESPONDE, "El comparador de la CNMC no responde; inténtalo más tarde."
            ) from exc
        return comparar(ventana, ofertas)

    def programar(self) -> None:
        """Comparativa mensual (día 2 a las 10:17) si el usuario la activó."""
        if not self.facturacion.datos.get(CONF_COMPARAR_MENSUAL):
            return

        async def _mensual(ahora: datetime) -> None:
            if ahora.day != DIA_MENSUAL:
                return
            with contextlib.suppress(HomeAssistantError):  # ya avisado
                await self.async_comparar()

        self.entry.async_on_unload(
            async_track_time_change(
                self.hass, _mensual, hour=HORA_MENSUAL[0], minute=HORA_MENSUAL[1], second=0
            )
        )


class _Fallo(Exception):
    def __init__(self, estado: str, mensaje: str) -> None:
        super().__init__(mensaje)
        self.estado = estado
        self.mensaje = mensaje
