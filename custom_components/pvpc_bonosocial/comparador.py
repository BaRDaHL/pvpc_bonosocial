"""Comparador de tarifas de un suministro (DISENO §8 bis, F8): consulta, resultado y avisos.

Al pulsar el botón «Comparar tarifas» (o con el servicio `comparar_tarifas`, o una vez al mes
si el usuario lo activa):

1. se toman los periodos de factura de los últimos 12 meses del suministro (lo pagado y los
   kWh por periodo; también lo que habría costado el PVPC sin bono);
2. se envían a la CNMC **solo** el código postal, las potencias y los kWh anuales por periodo;
3. se guarda el resultado (sensor «Mejor alternativa de tarifa») y se avisa con una
   notificación persistente y, si se pide, por un destino `notify` (Telegram incluido);
4. se apunta en el histórico mensual (`historico_comparativas`): el podio de ofertas del mes, la
   previsión más baja de la CNMC y lo pagado. Si el usuario lo activa, el último día del mes sin
   comparativa se compara en silencio (sin notificación ni destino) solo para rellenarlo.

Un fallo de la CNMC no afecta a nada más: se avisa y se conserva la comparativa anterior.
"""

from __future__ import annotations

import contextlib
import logging
import re
from collections.abc import Mapping
from dataclasses import replace
from datetime import date, datetime, timedelta
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

from . import historico_comparativas as hc
from . import idiomas
from .cnmc import CnmcNoResponde, ConsultaCnmc, async_consultar, enlace_ficha, enlace_listado
from .comparativa import (
    AVISO_BONO_NUEVO,
    AVISO_BONO_PERDIDO,
    AVISO_BONO_TERMICO,
    AVISO_COBERTURA,
    AVISO_ESTIMADAS,
    AVISO_EXTRAPOLADO,
    AVISO_PIERDE_BONO,
    AVISO_PREVISION_VOLATIL,
    AVISO_REVISION_PRECIOS,
    AVISO_SIN_OFERTAS,
    MAX_OFERTAS,
    VEREDICTO_DEPENDE_PRECIOS,
    VEREDICTO_LIBRE,
    VEREDICTO_LIBRE_PIERDE_BONO,
    VEREDICTO_QUEDARSE,
    VEREDICTO_QUEDARSE_CON_BONO,
    Comparativa,
    bono_termico_en_plazo,
    comparar,
    consulta_anual,
    ordenar_avisos,
    ventana_12_meses,
)
from .const import (
    CONF_CODIGO_POSTAL,
    CONF_COMPARADOR_DESTINO,
    CONF_COMPARADOR_ENVIO,
    CONF_COMPARADOR_FORMATO,
    CONF_COMPARADOR_UMBRAL,
    CONF_COMPARAR_FIN_MES,
    CONF_COMPARAR_MENSUAL,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    DOMAIN,
)
from .engine.factura import Bono
from .facturacion import FacturacionSuministro, suministro_de
from .prices.aiopvpc.const import REFERENCE_TZ

_LOGGER = logging.getLogger(__name__)
STORE_VERSION = 1
DIA_MENSUAL = 2  # el día 2 de cada mes a las 10:17
HORA_MENSUAL = (10, 17)
HORA_FIN_MES = (21, 43)  # el último día del mes, si en el mes no se ha comparado
MOSTRADAS = 3

ESTADO_OK = "ok"
ESTADO_SIN_CODIGO_POSTAL = "sin_codigo_postal"
ESTADO_SIN_DATOS = "sin_datos"
ESTADO_CNMC_NO_RESPONDE = "cnmc_no_responde"


def senal(subentry_id: str) -> str:
    return f"{DOMAIN}_comparador_{subentry_id}"


def _f(x: Decimal | None) -> float | None:
    return None if x is None else float(x)


def pct_bono_medio(tarifas: Any, bono: Bono, inicio: date, fin: date) -> Decimal | None:
    """% medio del descuento del bono entre `inicio` y `fin` (exclusivo), por días; None sin bono.

    El % cambia por fecha (42,5 % en 2026, 35 % desde 2027 si no se prorroga): para comparar el
    descuento de la ventana con el de los próximos 12 meses hay que prorratearlo."""
    if bono is Bono.NINGUNO:
        return None
    concepto = "descuento_bono_vulnerable" if bono is Bono.VULNERABLE else "descuento_bono_severo"
    dias = (fin - inicio).days
    if dias <= 0:
        return None
    try:
        total = sum((tarifas.valor(concepto, inicio + timedelta(days=i)) for i in range(dias)), Decimal(0))
    except (KeyError, LookupError, ValueError):
        return None
    return total / dias


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
        "pagado_sin_bono": _f(v.pagado_sin_bono) if v.pagada_con_bono else None,
        "pagado_sin_bono_anual": _f(v.pagado_sin_bono_anual) if v.pagada_con_bono else None,
        "pvpc_cnmc": _f(c.pvpc_cnmc),
        "pvpc_cnmc_prevision": _f(c.pvpc_cnmc_prevision),
        "pvpc_cnmc_prevision_bono": _f(c.pvpc_cnmc_prevision_bono),
        "ofertas": [
            {
                "id": a.oferta.id,
                "comercializadora": a.oferta.comercializadora,
                "oferta": a.oferta.oferta,
                "importe_primer_anio": float(a.oferta.importe_primer_anio),
                "importe_segundo_anio": float(a.oferta.importe_segundo_anio),
                "ahorro_anual": float(a.ahorro_primer_anio),
                "ahorro_segundo_anio": float(a.ahorro_segundo_anio),
                "ahorro_prevision": _f(a.ahorro_prevision),
                "revision": a.oferta.revision,
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
    """«1.234,56 €» en español, catalán, gallego y euskera; «€1,234.56» en inglés."""
    texto = f"{x:,.2f}"
    if idiomas.coma_decimal(idioma):
        texto = texto.replace(",", "X").replace(".", ",").replace("X", ".")
        return f"{texto} €"
    return f"€{texto}"


def _kwh(x: float, idioma: str) -> str:
    texto = f"{round(x):,}"
    return texto.replace(",", ".") if idiomas.coma_decimal(idioma) else texto


def _limpio(nombre: str) -> str:
    """Sin los caracteres que rompen el Markdown de Telegram (un `_` suelto tumba el envío)."""
    return " ".join(re.sub(r"[_*`\[\]]", " ", nombre).split())


def _linea_pvpc_cnmc(r: Mapping[str, Any], t: Mapping[str, str], idioma: str) -> str:
    """El PVPC sin bono de la CNMC: el del último año y, si la da, su previsión del año que viene."""
    if r.get("pvpc_cnmc_prevision_bono") is not None:
        return t["pvpc_cnmc_prevision_bono"].format(
            x=_eur(r["pvpc_cnmc"], idioma),
            p=_eur(r["pvpc_cnmc_prevision"], idioma),
            b=_eur(r["pvpc_cnmc_prevision_bono"], idioma),
        )
    if r.get("pvpc_cnmc_prevision") is not None:
        return t["pvpc_cnmc_prevision"].format(
            x=_eur(r["pvpc_cnmc"], idioma), p=_eur(r["pvpc_cnmc_prevision"], idioma)
        )
    return t["pvpc_cnmc"].format(x=_eur(r["pvpc_cnmc"], idioma))


def _texto_veredicto(r: Mapping[str, Any], t: Mapping[str, Any], idioma: str) -> str | None:
    """El veredicto con sus cifras; «depende» junta lo del último año y lo de la previsión.

    None con un veredicto que estos textos no conocen (una comparativa guardada por otra versión):
    se omite en lugar de romper el texto entero.
    """
    mejor = r["ofertas"][0]
    if r["veredicto"] not in t:
        return None
    if r["veredicto"] != VEREDICTO_DEPENDE_PRECIOS:
        return t[r["veredicto"]].format(x=_eur(abs(mejor["ahorro_anual"]), idioma))
    x, y = mejor["ahorro_anual"], mejor.get("ahorro_prevision") or 0
    pasado = t["dep_oferta" if x > 0 else "dep_pvpc"].format(x=_eur(abs(x), idioma))
    futuro = t["dep_prev_oferta" if y > 0 else "dep_prev_pvpc"].format(y=_eur(abs(y), idioma))
    return t[VEREDICTO_DEPENDE_PRECIOS].format(pasado=pasado, futuro=futuro)


def _texto_aviso(aviso: str, r: Mapping[str, Any], t: Mapping[str, Any], idioma: str) -> str:
    revision = r["ofertas"][0].get("revision") if r.get("ofertas") else None
    return t[aviso].format(
        ausentes=", ".join(x.title() for x in r["grandes_ausentes"]),
        dias=r["periodo"]["dias"],
        sin_anual=_eur(r.get("pagado_sin_bono_anual") or 0, idioma),
        revision=t["revisiones"].get(revision, revision or ""),
    )


MESES = {
    "es": (
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ),
    "en": (
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ),
    "ca": (
        "gener",
        "febrer",
        "març",
        "abril",
        "maig",
        "juny",
        "juliol",
        "agost",
        "setembre",
        "octubre",
        "novembre",
        "desembre",
    ),
    "gl": (
        "xaneiro",
        "febreiro",
        "marzo",
        "abril",
        "maio",
        "xuño",
        "xullo",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "decembro",
    ),
    "eu": (
        "urtarrila",
        "otsaila",
        "martxoa",
        "apirila",
        "maiatza",
        "ekaina",
        "uztaila",
        "abuztua",
        "iraila",
        "urria",
        "azaroa",
        "abendua",
    ),
}


def _eur_kwh(x: float, idioma: str) -> str:
    return f"{x:.3f}".replace(".", ",") + " €/kWh" if idiomas.coma_decimal(idioma) else f"€{x:.3f}/kWh"


def _urteko(anio: int) -> str:
    """Año con el sufijo de genitivo del euskera: «2026ko», pero «2025eko» (bost), «2021eko» (bat) o
    «2030eko» (hamar); «2031ko» (hamaika) vuelve a acabar en vocal."""
    consonante = (anio % 10 in (1, 5) and anio % 20 != 11) or anio % 100 in (10, 30, 50, 70, 90)
    return f"{anio}{'eko' if consonante else 'ko'}"


def _mes(mes: str, idioma: str) -> str:
    a, m = mes.split("-")
    nombre = MESES[idioma][int(m) - 1]
    return f"{_urteko(int(a))} {nombre}" if idioma == "eu" else f"{nombre} {a}"


def texto_termometro(r: Mapping[str, Any], idioma: str = "es") -> str | None:
    """La mejor oferta de hoy frente a la mejor de cada mes anterior guardado (€/kWh); sin predecir."""
    termo = r.get("termometro")
    if not termo or not r.get("ofertas"):
        return None
    idioma = idiomas.idioma(idioma)
    t = TEXTOS[idioma]
    barata, cara = termo["mas_barata"], termo["mas_cara"]
    frase = t.get(f"termometro_{termo.get('posicion')}")
    if frase is None:  # posición que esta versión no conoce: sin termómetro
        return None
    return frase.format(
        n=termo["meses"],
        x=_eur_kwh(termo["eur_kwh"], idioma),
        mes_barata=_mes(barata["mes"], idioma),
        barata=_eur_kwh(barata["eur_kwh"], idioma),
        mes_cara=_mes(cara["mes"], idioma),
        cara=_eur_kwh(cara["eur_kwh"], idioma),
    )


def _fecha(iso: str, idioma: str) -> str:
    return idiomas.fecha(iso, idioma)


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
        "ahorra": "ahorras {x} al año.",
        "cuesta": "pagas {x} más al año.",
        "permanencia": " Permanencia (penalización ~{x}).",
        "servicios": " Con servicios adicionales.",
        "nuevos": " Solo nuevos clientes.",
        "pvpc_cnmc": "PVPC sin bono según la CNMC: {x} con los precios del último año.",
        "pvpc_cnmc_prevision": "PVPC sin bono según la CNMC: {x} con los precios del último año · "
        "previsión próximo año: {p}.",
        "pvpc_cnmc_prevision_bono": "PVPC según la CNMC: {x} sin bono con los precios del último año · "
        "previsión próximo año: {p} sin bono, ≈{b} con tu bono.",
        "ninguna": "La CNMC no ha devuelto ninguna oferta de mercado libre para tu código postal.",
        AVISO_PIERDE_BONO: "⚠️ El bono social solo existe con el PVPC de una comercializadora de "
        "referencia: si cambias a mercado libre, lo pierdes. Compara con lo que pagas con bono.",
        AVISO_BONO_PERDIDO: "⚠️ Ya no tienes bono social: las ofertas se comparan con lo que habrías "
        "pagado sin bono en el PVPC ({sin_anual} en un año), que es lo que pagarás desde ahora.",
        AVISO_BONO_NUEVO: "⚠️ Parte de lo pagado en estos 12 meses no lleva el bono social que tienes "
        "ahora: con tu bono pagarás menos, así que el ahorro de las ofertas sale mayor de lo que es.",
        AVISO_COBERTURA: "ℹ️ El comparador de la CNMC solo incluye las ofertas que le envían las "
        "comercializadoras; no están: {ausentes}. No es un censo completo del mercado.",
        AVISO_EXTRAPOLADO: "ℹ️ Solo hay {dias} días de facturas: lo pagado y el consumo se han "
        "extrapolado a un año.",
        AVISO_ESTIMADAS: "⚠️ Hay facturas estimadas: concilia las facturas reales para afinar la comparativa.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ Con tu bono social, el PVPC sigue siendo lo más barato: la "
        "mejor oferta libre te costaría {x} más al año.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 La mejor oferta libre sale {x} más barata al año que lo que "
        "pagas con bono, aunque lo perderías. Comprueba las condiciones antes de cambiar.",
        VEREDICTO_LIBRE: "💡 Con la mejor oferta te ahorrarías {x} al año.",
        VEREDICTO_QUEDARSE: "✅ Ninguna oferta mejora lo que pagas: la mejor te costaría {x} más al año.",
        "revision": " Revisión de precios {r}.",
        "prev_ahorra": " Con la previsión de la CNMC ahorrarías {x}.",
        "prev_cuesta": " Con la previsión de la CNMC pagarías {x} más.",
        "dep_pvpc": "con los precios del último año, el PVPC te salió {x} más barato que la mejor oferta",
        "dep_oferta": "con los precios del último año, la mejor oferta te habría salido {x} más barata",
        "dep_prev_pvpc": "con la previsión de la CNMC para los próximos 12 meses, el PVPC saldría {y} "
        "más barato",
        "dep_prev_oferta": "con la previsión de la CNMC para los próximos 12 meses, la mejor oferta "
        "saldría {y} más barata",
        "revisiones": {
            "mensual": "mensual",
            "trimestral": "trimestral",
            "cuatrimestral": "tres veces al año",
            "semestral": "semestral",
            "anual": "anual",
            "bienal": "cada dos años",
            "trienal": "cada tres años",
            "quinquenal": "cada cinco años",
        },
        AVISO_BONO_TERMICO: "🛑 Si cambias de comercializadora antes del 1 de enero, no tendrás el bono "
        "social a 31 de diciembre y perderás el bono social térmico que se cobra el próximo año: una "
        "ayuda en dinero (mínimo 50 €) que recibes aunque no tengas gas. Para no perderlo, cámbiate a "
        "partir del 1 de enero.",
        AVISO_PREVISION_VOLATIL: "⚠️ La previsión de la CNMC para el PVPC sale de los precios del mercado de "
        "futuros de hoy y cambia mucho de un mes a otro: es un escenario, no lo que vas a pagar.",
        AVISO_REVISION_PRECIOS: "ℹ️ La mejor oferta revisa sus precios ({revision}); la CNMC calcula sus "
        "importes sin esas revisiones.",
        VEREDICTO_DEPENDE_PRECIOS: "⚖️ Depende de los precios: {pasado}; {futuro}. Vuelve a comparar antes "
        "de decidir.",
        "leer_avisos": "👇 Antes de decidir, lee los avisos del final.",
        "leer_avisos_termico": "👇 Antes de decidir, lee los avisos del final: hay uno importante sobre el "
        "bono social térmico.",
        "impuestos": "Los importes de la CNMC llevan los impuestos y el alquiler del contador de hoy; "
        "lo pagado, los de cada factura.",
        "confirmar": "ℹ️ Los precios son los que publica la CNMC y pueden estar desfasados: confírmalos con "
        "la comercializadora antes de contratar.",
        "termometro_mas_barata": "🌡️ La mejor oferta de hoy ({x}) es la más barata (en €/kWh) de los "
        "últimos {n} meses.",
        "termometro_mas_cara": "🌡️ La mejor oferta de hoy ({x}) es la más cara (en €/kWh) de los "
        "últimos {n} meses.",
        "termometro_entre": "🌡️ La mejor oferta de hoy ({x}) está entre la más barata ({mes_barata}, "
        "{barata}) y la más cara ({mes_cara}, {cara}) de los últimos {n} meses.",
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
        "ahorra": "you save {x} per year.",
        "cuesta": "you pay {x} more per year.",
        "permanencia": " Minimum stay (penalty ~{x}).",
        "servicios": " With additional services.",
        "nuevos": " New customers only.",
        "pvpc_cnmc": "PVPC without bonus according to the CNMC: {x} at last year's prices.",
        "pvpc_cnmc_prevision": "PVPC without bonus according to the CNMC: {x} at last year's prices · "
        "next year's forecast: {p}.",
        "pvpc_cnmc_prevision_bono": "PVPC according to the CNMC: {x} without bonus at last year's prices · "
        "next year's forecast: {p} without bonus, ≈{b} with your bonus.",
        "ninguna": "The CNMC returned no free-market offers for your postal code.",
        AVISO_PIERDE_BONO: "⚠️ The social bonus only exists with the PVPC of a reference retailer: "
        "switching to the free market loses it. Compare with what you pay with the bonus.",
        AVISO_BONO_PERDIDO: "⚠️ You no longer have the social bonus: offers are compared with what you "
        "would have paid on PVPC without it ({sin_anual} per year), which is what you will pay from now on.",
        AVISO_BONO_NUEVO: "⚠️ Part of what you paid in these 12 months does not include the social bonus "
        "you have now: with it you will pay less, so the savings of the offers look bigger than they are.",
        AVISO_COBERTURA: "ℹ️ The CNMC comparator only includes offers sent by retailers; missing: "
        "{ausentes}. It is not a complete census of the market.",
        AVISO_EXTRAPOLADO: "ℹ️ Only {dias} days of bills: payments and consumption were extrapolated "
        "to a year.",
        AVISO_ESTIMADAS: "⚠️ Some bills are estimates: reconcile the real bills to refine the comparison.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ With your social bonus, PVPC is still the cheapest: the best "
        "free-market offer would cost you {x} more per year.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 The best free-market offer is {x} per year cheaper than what you "
        "pay with the bonus, although you would lose it. Check the conditions before switching.",
        VEREDICTO_LIBRE: "💡 With the best offer you would save {x} per year.",
        VEREDICTO_QUEDARSE: "✅ No offer beats what you pay: the best would cost you {x} more per year.",
        "revision": " Price review {r}.",
        "prev_ahorra": " With the CNMC forecast you would save {x}.",
        "prev_cuesta": " With the CNMC forecast you would pay {x} more.",
        "dep_pvpc": "at last year's prices, PVPC was {x} cheaper than the best offer",
        "dep_oferta": "at last year's prices, the best offer would have been {x} cheaper",
        "dep_prev_pvpc": "with the CNMC forecast for the next 12 months, PVPC would be {y} cheaper",
        "dep_prev_oferta": "with the CNMC forecast for the next 12 months, the best offer would be "
        "{y} cheaper",
        "revisiones": {
            "mensual": "monthly",
            "trimestral": "quarterly",
            "cuatrimestral": "three times a year",
            "semestral": "every six months",
            "anual": "yearly",
            "bienal": "every two years",
            "trienal": "every three years",
            "quinquenal": "every five years",
        },
        AVISO_BONO_TERMICO: "🛑 If you switch retailer before 1 January, you won't have the social bonus on "
        "31 December and you'll lose the thermal social bonus paid next year: a cash aid (at least €50) "
        "you get even if you have no gas. To keep it, switch on or after 1 January.",
        AVISO_PREVISION_VOLATIL: "⚠️ The CNMC forecast for PVPC comes from today's futures market prices and "
        "changes a lot from month to month: it is a scenario, not what you will pay.",
        AVISO_REVISION_PRECIOS: "ℹ️ The best offer reviews its prices ({revision}); the CNMC works out its "
        "amounts without those reviews.",
        VEREDICTO_DEPENDE_PRECIOS: "⚖️ It depends on prices: {pasado}; {futuro}. Compare again before "
        "deciding.",
        "leer_avisos": "👇 Before deciding, read the notes at the end.",
        "leer_avisos_termico": "👇 Before deciding, read the notes at the end: there is an important one "
        "about the thermal social bonus.",
        "impuestos": "CNMC amounts use today's taxes and meter rental; payments, those of each bill.",
        "confirmar": "ℹ️ Prices are those published by the CNMC and may be out of date: confirm them with "
        "the retailer before signing up.",
        "termometro_mas_barata": "🌡️ Today's best offer ({x}) is the cheapest (per kWh) of the last "
        "{n} months.",
        "termometro_mas_cara": "🌡️ Today's best offer ({x}) is the most expensive (per kWh) of the last "
        "{n} months.",
        "termometro_entre": "🌡️ Today's best offer ({x}) is between the cheapest ({mes_barata}, {barata}) "
        "and the most expensive ({mes_cara}, {cara}) of the last {n} months.",
    },
    "ca": {
        "titulo": "Comparativa de tarifes · {nombre}",
        "periodo": "Del {inicio} al {fin} ({dias} dies, {facturas}): {kwh} kWh (P1 {p1} · P2 {p2} · P3 "
        "{p3}).",
        "facturas": "{n} factures",
        "factura": "1 factura",
        "facturas_estimadas": "{n} factures, {e} estimades",
        "pagado": "Has pagat {pagado} ({anual} en un any).",
        "pagado_bono": "Amb bo social has pagat {pagado} ({anual} en un any). Sense bo, al PVPC, "
        "hauries pagat {sin} ({sin_anual} en un any).",
        "mejores": "Millors ofertes del mercat lliure (CNMC, primer any, amb el teu consum real):",
        "oferta": "{i}. {comercializadora}, «{oferta}»: {importe}{segundo} → {ahorro}",
        "segundo": " (2n any {importe})",
        "ahorra": "estalvies {x} l'any.",
        "cuesta": "pagues {x} més l'any.",
        "permanencia": " Permanència (penalització ~{x}).",
        "servicios": " Amb serveis addicionals.",
        "nuevos": " Només clients nous.",
        "pvpc_cnmc": "PVPC sense bo segons la CNMC: {x} amb els preus de l'últim any.",
        "pvpc_cnmc_prevision": "PVPC sense bo segons la CNMC: {x} amb els preus de l'últim any · "
        "previsió per a l'any vinent: {p}.",
        "pvpc_cnmc_prevision_bono": "PVPC segons la CNMC: {x} sense bo amb els preus de l'últim any · "
        "previsió per a l'any vinent: {p} sense bo, ≈{b} amb el teu bo.",
        "ninguna": "La CNMC no ha retornat cap oferta del mercat lliure per al teu codi postal.",
        AVISO_PIERDE_BONO: "⚠️ El bo social només existeix amb el PVPC d'una comercialitzadora de "
        "referència: si canvies al mercat lliure, el perds. Compara-ho amb el que pagues amb bo.",
        AVISO_BONO_PERDIDO: "⚠️ Ja no tens bo social: les ofertes es comparen amb el que hauries pagat "
        "sense bo al PVPC ({sin_anual} en un any), que és el que pagaràs a partir d'ara.",
        AVISO_BONO_NUEVO: "⚠️ Part del que s'ha pagat en aquests 12 mesos no porta el bo social que "
        "tens ara: amb el teu bo pagaràs menys, així que l'estalvi de les ofertes surt més gran del "
        "que és.",
        AVISO_COBERTURA: "ℹ️ El comparador de la CNMC només inclou les ofertes que li envien les "
        "comercialitzadores; no hi són: {ausentes}. No és un cens complet del mercat.",
        AVISO_EXTRAPOLADO: "ℹ️ Només hi ha {dias} dies de factures: el que s'ha pagat i el consum "
        "s'han extrapolat a un any.",
        AVISO_ESTIMADAS: "⚠️ Hi ha factures estimades: concilia les factures reals per afinar la comparativa.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ Amb el teu bo social, el PVPC continua sent el més barat: la "
        "millor oferta lliure et costaria {x} més l'any.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 La millor oferta lliure surt {x} més barata l'any que el que "
        "pagues amb bo, tot i que el perdries. Comprova les condicions abans de canviar.",
        VEREDICTO_LIBRE: "💡 Amb la millor oferta t'estalviaries {x} l'any.",
        VEREDICTO_QUEDARSE: "✅ Cap oferta millora el que pagues: la millor et costaria {x} més l'any.",
        "revision": " Revisió de preus {r}.",
        "prev_ahorra": " Amb la previsió de la CNMC estalviaries {x}.",
        "prev_cuesta": " Amb la previsió de la CNMC pagaries {x} més.",
        "dep_pvpc": "amb els preus de l'últim any, el PVPC et va sortir {x} més barat que la millor oferta",
        "dep_oferta": "amb els preus de l'últim any, la millor oferta t'hauria sortit {x} més barata",
        "dep_prev_pvpc": "amb la previsió de la CNMC per als pròxims 12 mesos, el PVPC sortiria {y} "
        "més barat",
        "dep_prev_oferta": "amb la previsió de la CNMC per als pròxims 12 mesos, la millor oferta "
        "sortiria {y} més barata",
        "revisiones": {
            "mensual": "mensual",
            "trimestral": "trimestral",
            "cuatrimestral": "tres vegades l'any",
            "semestral": "semestral",
            "anual": "anual",
            "bienal": "cada dos anys",
            "trienal": "cada tres anys",
            "quinquenal": "cada cinc anys",
        },
        AVISO_BONO_TERMICO: "🛑 Si canvies de comercialitzadora abans de l'1 de gener, no tindràs el bo "
        "social a 31 de desembre i perdràs el bo social tèrmic que es cobra l'any vinent: un ajut en "
        "diners (mínim 50 €) que reps encara que no tinguis gas. Per no perdre'l, canvia a partir de "
        "l'1 de gener.",
        AVISO_PREVISION_VOLATIL: "⚠️ La previsió de la CNMC per al PVPC surt dels preus del mercat de "
        "futurs d'avui i canvia molt d'un mes a l'altre: és un escenari, no el que pagaràs.",
        AVISO_REVISION_PRECIOS: "ℹ️ La millor oferta revisa els seus preus ({revision}); la CNMC en "
        "calcula els imports sense aquestes revisions.",
        VEREDICTO_DEPENDE_PRECIOS: "⚖️ Depèn dels preus: {pasado}; {futuro}. Torna a comparar abans de "
        "decidir.",
        "leer_avisos": "👇 Abans de decidir, llegeix els avisos del final.",
        "leer_avisos_termico": "👇 Abans de decidir, llegeix els avisos del final: n'hi ha un "
        "d'important sobre el bo social tèrmic.",
        "impuestos": "Els imports de la CNMC porten els impostos i el lloguer del comptador d'avui; el "
        "que s'ha pagat, els de cada factura.",
        "confirmar": "ℹ️ Els preus són els que publica la CNMC i poden estar desfasats: confirma'ls "
        "amb la comercialitzadora abans de contractar.",
        "termometro_mas_barata": "🌡️ La millor oferta d'avui ({x}) és la més barata (en €/kWh) dels "
        "últims {n} mesos.",
        "termometro_mas_cara": "🌡️ La millor oferta d'avui ({x}) és la més cara (en €/kWh) dels últims "
        "{n} mesos.",
        "termometro_entre": "🌡️ La millor oferta d'avui ({x}) està entre la més barata ({mes_barata}, "
        "{barata}) i la més cara ({mes_cara}, {cara}) dels últims {n} mesos.",
    },
    "gl": {
        "titulo": "Comparativa de tarifas · {nombre}",
        "periodo": "Do {inicio} ao {fin} ({dias} días, {facturas}): {kwh} kWh (P1 {p1} · P2 {p2} · P3 {p3}).",
        "facturas": "{n} facturas",
        "factura": "1 factura",
        "facturas_estimadas": "{n} facturas, {e} estimadas",
        "pagado": "Pagaches {pagado} ({anual} nun ano).",
        "pagado_bono": "Con bono social pagaches {pagado} ({anual} nun ano). Sen bono, no PVPC, "
        "pagarías {sin} ({sin_anual} nun ano).",
        "mejores": "Mellores ofertas de mercado libre (CNMC, primeiro ano, co teu consumo real):",
        "oferta": "{i}. {comercializadora}, «{oferta}»: {importe}{segundo} → {ahorro}",
        "segundo": " (2.º ano {importe})",
        "ahorra": "aforras {x} ao ano.",
        "cuesta": "pagas {x} máis ao ano.",
        "permanencia": " Permanencia (penalización ~{x}).",
        "servicios": " Con servizos adicionais.",
        "nuevos": " Só clientes novos.",
        "pvpc_cnmc": "PVPC sen bono segundo a CNMC: {x} cos prezos do último ano.",
        "pvpc_cnmc_prevision": "PVPC sen bono segundo a CNMC: {x} cos prezos do último ano · "
        "previsión para o próximo ano: {p}.",
        "pvpc_cnmc_prevision_bono": "PVPC segundo a CNMC: {x} sen bono cos prezos do último ano · "
        "previsión para o próximo ano: {p} sen bono, ≈{b} co teu bono.",
        "ninguna": "A CNMC non devolveu ningunha oferta de mercado libre para o teu código postal.",
        AVISO_PIERDE_BONO: "⚠️ O bono social só existe co PVPC dunha comercializadora de "
        "referencia: se cambias a mercado libre, pérdelo. Compara co que pagas con bono.",
        AVISO_BONO_PERDIDO: "⚠️ Xa non tes bono social: as ofertas compáranse co que pagarías "
        "sen bono no PVPC ({sin_anual} nun ano), que é o que pagarás de agora en diante.",
        AVISO_BONO_NUEVO: "⚠️ Parte do pagado nestes 12 meses non leva o bono social que tes "
        "agora: co teu bono pagarás menos, así que o aforro das ofertas sae maior do que é.",
        AVISO_COBERTURA: "ℹ️ O comparador da CNMC só inclúe as ofertas que lle envían as "
        "comercializadoras; non están: {ausentes}. Non é un censo completo do mercado.",
        AVISO_EXTRAPOLADO: "ℹ️ Só hai {dias} días de facturas: o pagado e o consumo extrapoláronse a un ano.",
        AVISO_ESTIMADAS: "⚠️ Hai facturas estimadas: concilia as facturas reais para afinar a comparativa.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ Co teu bono social, o PVPC segue sendo o máis barato: a "
        "mellor oferta libre custaríache {x} máis ao ano.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 A mellor oferta libre sae {x} máis barata ao ano do que "
        "pagas con bono, aínda que o perderías. Comproba as condicións antes de cambiar.",
        VEREDICTO_LIBRE: "💡 Coa mellor oferta aforrarías {x} ao ano.",
        VEREDICTO_QUEDARSE: "✅ Ningunha oferta mellora o que pagas: a mellor custaríache {x} máis ao ano.",
        "revision": " Revisión de prezos {r}.",
        "prev_ahorra": " Coa previsión da CNMC aforrarías {x}.",
        "prev_cuesta": " Coa previsión da CNMC pagarías {x} máis.",
        "dep_pvpc": "cos prezos do último ano, o PVPC saíuche {x} máis barato que a mellor oferta",
        "dep_oferta": "cos prezos do último ano, a mellor oferta saíriache {x} máis barata",
        "dep_prev_pvpc": "coa previsión da CNMC para os próximos 12 meses, o PVPC sairía {y} máis barato",
        "dep_prev_oferta": "coa previsión da CNMC para os próximos 12 meses, a mellor oferta "
        "sairía {y} máis barata",
        "revisiones": {
            "mensual": "mensual",
            "trimestral": "trimestral",
            "cuatrimestral": "tres veces ao ano",
            "semestral": "semestral",
            "anual": "anual",
            "bienal": "cada dous anos",
            "trienal": "cada tres anos",
            "quinquenal": "cada cinco anos",
        },
        AVISO_BONO_TERMICO: "🛑 Se cambias de comercializadora antes do 1 de xaneiro, non terás o "
        "bono social a 31 de decembro e perderás o bono social térmico que se cobra o próximo ano: "
        "unha axuda en diñeiro (mínimo 50 €) que recibes aínda que non teñas gas. Para non perdelo, "
        "cambia a partir do 1 de xaneiro.",
        AVISO_PREVISION_VOLATIL: "⚠️ A previsión da CNMC para o PVPC sae dos prezos do mercado de "
        "futuros de hoxe e cambia moito dun mes a outro: é un escenario, non o que vas pagar.",
        AVISO_REVISION_PRECIOS: "ℹ️ A mellor oferta revisa os seus prezos ({revision}); a CNMC calcula "
        "os seus importes sen esas revisións.",
        VEREDICTO_DEPENDE_PRECIOS: "⚖️ Depende dos prezos: {pasado}; {futuro}. Volve comparar antes "
        "de decidir.",
        "leer_avisos": "👇 Antes de decidir, le os avisos do final.",
        "leer_avisos_termico": "👇 Antes de decidir, le os avisos do final: hai un importante sobre o "
        "bono social térmico.",
        "impuestos": "Os importes da CNMC levan os impostos e o aluguer do contador de hoxe; "
        "o pagado, os de cada factura.",
        "confirmar": "ℹ️ Os prezos son os que publica a CNMC e poden estar desfasados: confírmaos coa "
        "comercializadora antes de contratar.",
        "termometro_mas_barata": "🌡️ A mellor oferta de hoxe ({x}) é a máis barata (en €/kWh) dos "
        "últimos {n} meses.",
        "termometro_mas_cara": "🌡️ A mellor oferta de hoxe ({x}) é a máis cara (en €/kWh) dos "
        "últimos {n} meses.",
        "termometro_entre": "🌡️ A mellor oferta de hoxe ({x}) está entre a máis barata ({mes_barata}, "
        "{barata}) e a máis cara ({mes_cara}, {cara}) dos últimos {n} meses.",
    },
    "eu": {
        "titulo": "Tarifen konparaketa · {nombre}",
        "periodo": "Aldia: {inicio} – {fin} ({dias} egun, {facturas}): {kwh} kWh (P1 {p1} · P2 {p2} · "
        "P3 {p3}).",
        "facturas": "{n} faktura",
        "factura": "1 faktura",
        "facturas_estimadas": "{n} faktura, {e} zenbatetsita",
        "pagado": "{pagado} ordaindu duzu ({anual} urtebetean).",
        "pagado_bono": "Gizarte-bonuarekin, {pagado} ordaindu duzu ({anual} urtebetean). Bonurik gabe, "
        "PVPCan, {sin} ordainduko zenukeen ({sin_anual} urtebetean).",
        "mejores": "Merkatu libreko eskaintza onenak (CNMC, lehen urtea, zure benetako kontsumoarekin):",
        "oferta": "{i}. {comercializadora}, «{oferta}»: {importe}{segundo} → {ahorro}",
        "segundo": " (2. urtea: {importe})",
        "ahorra": "urtean {x} aurrezten duzu.",
        "cuesta": "urtean {x} gehiago ordaintzen duzu.",
        "permanencia": " Iraunkortasuna (penalizazioa ~{x}).",
        "servicios": " Zerbitzu gehigarriekin.",
        "nuevos": " Bezero berrientzat soilik.",
        "pvpc_cnmc": "PVPC bonurik gabe, CNMCren arabera: {x}, azken urteko prezioekin.",
        "pvpc_cnmc_prevision": "PVPC bonurik gabe, CNMCren arabera: {x}, azken urteko prezioekin · "
        "hurrengo urteko aurreikuspena: {p}.",
        "pvpc_cnmc_prevision_bono": "PVPC, CNMCren arabera: {x} bonurik gabe, azken urteko prezioekin · "
        "hurrengo urteko aurreikuspena: {p} bonurik gabe, ≈{b} zure bonuarekin.",
        "ninguna": "CNMCk ez du merkatu libreko eskaintzarik itzuli zure posta-koderako.",
        AVISO_PIERDE_BONO: "⚠️ Gizarte-bonua erreferentziako merkaturatzaile baten PVPCarekin bakarrik "
        "dago: merkatu librera aldatzen bazara, galdu egingo duzu. Alderatu bonuarekin ordaintzen "
        "duzunarekin.",
        AVISO_BONO_PERDIDO: "⚠️ Jada ez duzu gizarte-bonurik: eskaintzak PVPCan bonurik gabe ordainduko "
        "zenukeenarekin alderatzen dira ({sin_anual} urtebetean), hori baita hemendik aurrera "
        "ordainduko duzuna.",
        AVISO_BONO_NUEVO: "⚠️ 12 hilabete hauetan ordaindutakoaren zati batek ez du orain duzun "
        "gizarte-bonua: zure bonuarekin gutxiago ordainduko duzu; beraz, eskaintzen aurrezpena benetan "
        "dena baino handiagoa ateratzen da.",
        AVISO_COBERTURA: "ℹ️ CNMCren konparatzaileak merkaturatzaileek bidaltzen dizkioten eskaintzak "
        "soilik jasotzen ditu; hauek ez daude: {ausentes}. Ez da merkatuaren errolda osoa.",
        AVISO_EXTRAPOLADO: "ℹ️ {dias} egunetako fakturak baino ez daude: ordaindutakoa eta kontsumoa "
        "urtebetera estrapolatu dira.",
        AVISO_ESTIMADAS: "⚠️ Faktura zenbatetsiak daude: bateratu benetako fakturak konparaketa doitzeko.",
        VEREDICTO_QUEDARSE_CON_BONO: "✅ Zure gizarte-bonuarekin, PVPC da oraindik merkeena: eskaintza "
        "libre onenak {x} gehiago kostatuko litzaizuke urtean.",
        VEREDICTO_LIBRE_PIERDE_BONO: "💡 Eskaintza libre onena urtean {x} merkeagoa da bonuarekin "
        "ordaintzen duzuna baino, nahiz eta bonua galdu. Egiaztatu baldintzak aldatu aurretik.",
        VEREDICTO_LIBRE: "💡 Eskaintza onenarekin {x} aurreztuko zenuke urtean.",
        VEREDICTO_QUEDARSE: "✅ Eskaintza batek ere ez du hobetzen ordaintzen duzuna: onenak {x} gehiago "
        "kostatuko litzaizuke urtean.",
        "revision": " Prezioen berrikuspena: {r}.",
        "prev_ahorra": " CNMCren aurreikuspenarekin, {x} aurreztuko zenuke.",
        "prev_cuesta": " CNMCren aurreikuspenarekin, {x} gehiago ordainduko zenuke.",
        "dep_pvpc": "azken urteko prezioekin, PVPCarekin {x} gutxiago ordaindu zenuen eskaintza "
        "onenarekin baino",
        "dep_oferta": "azken urteko prezioekin, eskaintza onenarekin {x} gutxiago ordainduko zenukeen",
        "dep_prev_pvpc": "CNMCk hurrengo 12 hilabeteetarako egindako aurreikuspenarekin, PVPCarekin {y} "
        "gutxiago ordainduko zenuke",
        "dep_prev_oferta": "CNMCk hurrengo 12 hilabeteetarako egindako aurreikuspenarekin, eskaintza "
        "onenarekin {y} gutxiago ordainduko zenuke",
        "revisiones": {
            "mensual": "hilero",
            "trimestral": "hiru hilean behin",
            "cuatrimestral": "urtean hiru aldiz",
            "semestral": "sei hilean behin",
            "anual": "urtero",
            "bienal": "bi urtean behin",
            "trienal": "hiru urtean behin",
            "quinquenal": "bost urtean behin",
        },
        AVISO_BONO_TERMICO: "🛑 Urtarrilaren 1a baino lehen merkaturatzailez aldatzen bazara, ez duzu "
        "gizarte-bonurik izango abenduaren 31n, eta hurrengo urtean kobratzen den gizarte-bono termikoa "
        "galduko duzu: diru-laguntza bat (gutxienez 50 €), gasik ez baduzu ere jasotzen duzuna. Ez "
        "galtzeko, aldatu urtarrilaren 1etik aurrera.",
        AVISO_PREVISION_VOLATIL: "⚠️ CNMCk PVPCrako egiten duen aurreikuspena gaurko "
        "etorkizun-merkatuko prezioetatik ateratzen da, eta asko aldatzen da hilabete batetik bestera: "
        "agertoki bat da, ez ordainduko duzuna.",
        AVISO_REVISION_PRECIOS: "ℹ️ Eskaintza onenak bere prezioak berrikusten ditu ({revision}); CNMCk "
        "berrikuspen horiek gabe kalkulatzen ditu zenbatekoak.",
        VEREDICTO_DEPENDE_PRECIOS: "⚖️ Prezioen araberakoa da: {pasado}; {futuro}. Alderatu berriro "
        "erabaki aurretik.",
        "leer_avisos": "👇 Erabaki aurretik, irakurri amaierako abisuak.",
        "leer_avisos_termico": "👇 Erabaki aurretik, irakurri amaierako abisuak: bat garrantzitsua da "
        "gizarte-bono termikoari buruz.",
        "impuestos": "CNMCren zenbatekoek gaurko zergak eta kontagailuaren alokairua dituzte; "
        "ordaindutakoak, faktura bakoitzekoak.",
        "confirmar": "ℹ️ Prezioak CNMCk argitaratutakoak dira, eta zaharkituta egon daitezke: berretsi "
        "merkaturatzailearekin kontratatu aurretik.",
        "termometro_mas_barata": "🌡️ Gaurko eskaintza onena ({x}) azken {n} hilabeteetako merkeena da "
        "(€/kWh-tan).",
        "termometro_mas_cara": "🌡️ Gaurko eskaintza onena ({x}) azken {n} hilabeteetako garestiena da "
        "(€/kWh-tan).",
        "termometro_entre": "🌡️ Gaurko eskaintza onena ({x}) azken {n} hilabeteetako merkeenaren "
        "({mes_barata}, {barata}) eta garestienaren ({mes_cara}, {cara}) artean dago.",
    },
}


def texto(r: Mapping[str, Any], nombre: str, idioma: str = "es", *, breve: bool = False) -> tuple[str, str]:
    """(título, texto) de la comparativa guardada; `breve`: lo pagado, la mejor oferta y el veredicto."""
    idioma = idiomas.idioma(idioma)
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
    ofertas = r["ofertas"][: 1 if breve else MOSTRADAS]
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
            if o.get("revision"):
                linea += t["revision"].format(r=t["revisiones"].get(o["revision"], o["revision"]))
            if o.get("ahorro_prevision") is not None:
                y = o["ahorro_prevision"]
                linea += (t["prev_ahorra"] if y >= 0 else t["prev_cuesta"]).format(x=_eur(abs(y), idioma))
            lineas.append(linea)
    else:
        lineas.append(t["ninguna"])
    if r.get("pvpc_cnmc") is not None and not breve:
        lineas.append(_linea_pvpc_cnmc(r, t, idioma))
    if r.get("veredicto") and r["ofertas"]:
        lineas.append("")
        if v := _texto_veredicto(r, t, idioma):
            lineas.append(v)
        if termo := texto_termometro(r, idioma):
            lineas.append(termo)
        if not breve:
            lineas.append(_leer_avisos(r, t))
    if breve:
        return t["titulo"].format(nombre=nombre), "\n".join(lineas)
    avisos = _avisos_ordenados(r)
    if avisos:
        lineas.append("")
    for aviso in avisos:
        lineas.append(_texto_aviso(aviso, r, t, idioma))
    lineas += ["", t["impuestos"], t["confirmar"]]
    return t["titulo"].format(nombre=nombre), "\n".join(lineas)


def _avisos_ordenados(r: Mapping[str, Any]) -> list[str]:
    """Avisos para mostrar, en su orden: sin el de «sin ofertas» y el del térmico solo de agosto a
    diciembre (también en una comparativa guardada que se vuelve a enviar en enero). Un aviso sin
    texto (guardado por otra versión) se omite: los cinco idiomas tienen las mismas claves."""
    hoy = dt_util.now().date()
    return ordenar_avisos(
        a
        for a in r.get("avisos") or []
        if a in TEXTOS["es"]
        and a != AVISO_SIN_OFERTAS
        and (a != AVISO_BONO_TERMICO or bono_termico_en_plazo(hoy))
    )


def _leer_avisos(r: Mapping[str, Any], t: Mapping[str, Any]) -> str:
    """Bajo el veredicto, siempre (José, 9-nov): que lean los avisos; si está el del térmico, se nombra."""
    return t["leer_avisos_termico"] if AVISO_BONO_TERMICO in _avisos_ordenados(r) else t["leer_avisos"]


def _aviso_tg(aviso: str, x: str) -> str:
    """Un aviso en MarkdownV2 con el formato de José; el emoji del principio, sin formato."""
    emoji, _, resto = x.partition(" ")
    if aviso in (AVISO_PIERDE_BONO, AVISO_BONO_TERMICO):
        return f"{emoji} *{_e(resto)}*"
    if aviso == AVISO_PREVISION_VOLATIL and ": " in resto:
        antes, _, despues = resto.partition(": ")
        return f"{emoji} __{_e(antes)}__{_e(': ')}*{_e(despues)}*"
    return _e(x)


# --- Telegram (MarkdownV2) --------------------------------------------------------------------

_MD2 = re.compile(r"([_*\[\]()~`>#+\-=|{}.!\\])")

TEXTOS_TG = {
    "es": {
        "periodo": "📅 {inicio} – {fin} · {dias} días · {facturas}",
        "kwh": "⚡ {kwh} kWh (P1 {p1} · P2 {p2} · P3 {p3})",
        "pagas": "💶 Lo que pagas",
        "con_bono": "Con bono social: ",
        "sin_bono": "Sin bono, en el PVPC: {sin} ({sin_anual} al año)",
        "pagado": "Has pagado: ",
        "al_anio": " ({x} al año)",
        "mejores": "🏷️ Mejores ofertas",
        "mejores_nota": " (CNMC, primer año, con tu consumo real)",
        "segundo": " (2.º año {x})",
        "ahorra": "ahorras {x} al año",
        "cuesta": "pagas {x} más al año",
        "permanencia": "permanencia (penalización ~{x})",
        "servicios": "con servicios adicionales",
        "nuevos": "solo nuevos clientes",
        "revision": "revisión {r}",
        "prev_ahorra": "previsión CNMC: ahorrarías {x}",
        "prev_cuesta": "previsión CNMC: pagarías {x} más",
        "todas": "Ver las {n} ofertas en el comparador de la CNMC",
        "todas_sin_n": "Ver todas las ofertas en el comparador de la CNMC",
    },
    "en": {
        "periodo": "📅 {inicio} – {fin} · {dias} days · {facturas}",
        "kwh": "⚡ {kwh} kWh (P1 {p1} · P2 {p2} · P3 {p3})",
        "pagas": "💶 What you pay",
        "con_bono": "With the social bonus: ",
        "sin_bono": "Without it, on PVPC: {sin} ({sin_anual} per year)",
        "pagado": "You paid: ",
        "al_anio": " ({x} per year)",
        "mejores": "🏷️ Best offers",
        "mejores_nota": " (CNMC, first year, with your real consumption)",
        "segundo": " (2nd year {x})",
        "ahorra": "you save {x} per year",
        "cuesta": "you pay {x} more per year",
        "permanencia": "minimum stay (penalty ~{x})",
        "servicios": "with additional services",
        "nuevos": "new customers only",
        "revision": "review {r}",
        "prev_ahorra": "CNMC forecast: you would save {x}",
        "prev_cuesta": "CNMC forecast: you would pay {x} more",
        "todas": "See the {n} offers in the CNMC comparator",
        "todas_sin_n": "See all offers in the CNMC comparator",
    },
    "ca": {
        "periodo": "📅 {inicio} – {fin} · {dias} dies · {facturas}",
        "kwh": "⚡ {kwh} kWh (P1 {p1} · P2 {p2} · P3 {p3})",
        "pagas": "💶 El que pagues",
        "con_bono": "Amb bo social: ",
        "sin_bono": "Sense bo, al PVPC: {sin} ({sin_anual} l'any)",
        "pagado": "Has pagat: ",
        "al_anio": " ({x} l'any)",
        "mejores": "🏷️ Millors ofertes",
        "mejores_nota": " (CNMC, primer any, amb el teu consum real)",
        "segundo": " (2n any {x})",
        "ahorra": "estalvies {x} l'any",
        "cuesta": "pagues {x} més l'any",
        "permanencia": "permanència (penalització ~{x})",
        "servicios": "amb serveis addicionals",
        "nuevos": "només clients nous",
        "revision": "revisió {r}",
        "prev_ahorra": "previsió CNMC: estalviaries {x}",
        "prev_cuesta": "previsió CNMC: pagaries {x} més",
        "todas": "Veure les {n} ofertes al comparador de la CNMC",
        "todas_sin_n": "Veure totes les ofertes al comparador de la CNMC",
    },
    "gl": {
        "periodo": "📅 {inicio} – {fin} · {dias} días · {facturas}",
        "kwh": "⚡ {kwh} kWh (P1 {p1} · P2 {p2} · P3 {p3})",
        "pagas": "💶 O que pagas",
        "con_bono": "Con bono social: ",
        "sin_bono": "Sen bono, no PVPC: {sin} ({sin_anual} ao ano)",
        "pagado": "Pagaches: ",
        "al_anio": " ({x} ao ano)",
        "mejores": "🏷️ Mellores ofertas",
        "mejores_nota": " (CNMC, primeiro ano, co teu consumo real)",
        "segundo": " (2.º ano {x})",
        "ahorra": "aforras {x} ao ano",
        "cuesta": "pagas {x} máis ao ano",
        "permanencia": "permanencia (penalización ~{x})",
        "servicios": "con servizos adicionais",
        "nuevos": "só clientes novos",
        "revision": "revisión {r}",
        "prev_ahorra": "previsión CNMC: aforrarías {x}",
        "prev_cuesta": "previsión CNMC: pagarías {x} máis",
        "todas": "Ver as {n} ofertas no comparador da CNMC",
        "todas_sin_n": "Ver todas as ofertas no comparador da CNMC",
    },
    "eu": {
        "periodo": "📅 {inicio} – {fin} · {dias} egun · {facturas}",
        "kwh": "⚡ {kwh} kWh (P1 {p1} · P2 {p2} · P3 {p3})",
        "pagas": "💶 Ordaintzen duzuna",
        "con_bono": "Gizarte-bonuarekin: ",
        "sin_bono": "Bonurik gabe, PVPCan: {sin} ({sin_anual} urtean)",
        "pagado": "Ordaindutakoa: ",
        "al_anio": " ({x} urtean)",
        "mejores": "🏷️ Eskaintza onenak",
        "mejores_nota": " (CNMC, lehen urtea, zure benetako kontsumoarekin)",
        "segundo": " (2. urtea: {x})",
        "ahorra": "urtean {x} aurrezten duzu",
        "cuesta": "urtean {x} gehiago ordaintzen duzu",
        "permanencia": "iraunkortasuna (penalizazioa ~{x})",
        "servicios": "zerbitzu gehigarriekin",
        "nuevos": "bezero berrientzat soilik",
        "revision": "berrikuspena: {r}",
        "prev_ahorra": "CNMCren aurreikuspena: {x} aurreztuko zenuke",
        "prev_cuesta": "CNMCren aurreikuspena: {x} gehiago ordainduko zenuke",
        "todas": "Ikusi {n} eskaintzak CNMCren konparatzailean",
        "todas_sin_n": "Ikusi eskaintza guztiak CNMCren konparatzailean",
    },
}


def _e(x: str) -> str:
    """Texto escapado para el MarkdownV2 de Telegram."""
    return _MD2.sub(r"\\\1", x)


def _enlace(texto_: str, url: str | None) -> str:
    if not url:
        return _e(texto_)
    return f"[{_e(texto_)}]({url.replace(chr(92), chr(92) * 2).replace(')', chr(92) + ')')})"


def texto_telegram(r: Mapping[str, Any], nombre: str, idioma: str = "es", *, breve: bool = False) -> str:
    """La comparativa para Telegram en MarkdownV2: secciones, negritas y enlaces a la CNMC (la ficha
    de cada oferta y el listado con todas). Mismo contenido que `texto`."""
    idioma = idiomas.idioma(idioma)
    t, g = TEXTOS[idioma], TEXTOS_TG[idioma]
    p, k = r["periodo"], r["kwh"]
    facturas = (
        t["facturas_estimadas"].format(
            n=p["facturas_conciliadas"] + p["facturas_estimadas"], e=p["facturas_estimadas"]
        )
        if p["facturas_estimadas"]
        else t["facturas" if p["facturas_conciliadas"] != 1 else "factura"].format(
            n=p["facturas_conciliadas"]
        )
    )
    lineas = [
        f"*{_e(t['titulo'].format(nombre=nombre))}*",
        _e(
            g["periodo"].format(
                inicio=_fecha(p["inicio"], idioma),
                fin=_fecha(p["fin"], idioma),
                dias=p["dias"],
                facturas=facturas,
            )
        ),
        _e(
            g["kwh"].format(
                kwh=_kwh(sum(k.values()), idioma),
                p1=_kwh(k["P1"], idioma),
                p2=_kwh(k["P2"], idioma),
                p3=_kwh(k["P3"], idioma),
            )
        ),
        "",
        f"*{_e(g['pagas'])}*",
    ]
    if r.get("pagado_sin_bono") is not None:
        lineas.append(
            _e(g["con_bono"])
            + f"*{_e(_eur(r['pagado'], idioma))}*"
            + _e(g["al_anio"].format(x=_eur(r["pagado_anual"], idioma)))
        )
        lineas.append(
            _e(
                g["sin_bono"].format(
                    sin=_eur(r["pagado_sin_bono"], idioma), sin_anual=_eur(r["pagado_sin_bono_anual"], idioma)
                )
            )
        )
    else:
        lineas.append(
            _e(g["pagado"])
            + f"*{_e(_eur(r['pagado'], idioma))}*"
            + _e(g["al_anio"].format(x=_eur(r["pagado_anual"], idioma)))
        )
    lineas.append("")
    ofertas = r["ofertas"][: 1 if breve else MOSTRADAS]
    if ofertas:
        lineas.append(f"*{_e(g['mejores'])}*" + _e(g["mejores_nota"]))
        for i, o in enumerate(ofertas, 1):
            ahorro = o["ahorro_anual"]
            lineas.append(
                _e(f"{i}. ") + _enlace(o["comercializadora"], o.get("enlace")) + _e(f" · {o['oferta']}")
            )
            segundo = (
                g["segundo"].format(x=_eur(o["importe_segundo_anio"], idioma))
                if o["importe_segundo_anio"] and o["importe_segundo_anio"] != o["importe_primer_anio"]
                else ""
            )
            extras = [(g["ahorra"] if ahorro >= 0 else g["cuesta"]).format(x=_eur(abs(ahorro), idioma))]
            if o["permanencia"]:
                extras.append(g["permanencia"].format(x=_eur(o["penalizacion"], idioma)))
            if o["servicios_adicionales"]:
                extras.append(g["servicios"])
            if o["solo_nuevos_clientes"]:
                extras.append(g["nuevos"])
            if o.get("revision"):
                extras.append(g["revision"].format(r=t["revisiones"].get(o["revision"], o["revision"])))
            if o.get("ahorro_prevision") is not None:
                y = o["ahorro_prevision"]
                prev = g["prev_ahorra"] if y >= 0 else g["prev_cuesta"]
                extras.append(prev.format(x=_eur(abs(y), idioma)))
            lineas.append(
                "    "
                + f"*{_e(_eur(o['importe_primer_anio'], idioma))}*"
                + _e(f"{segundo} → " + " · ".join(extras))
            )
        if r.get("enlace_listado"):
            todas = g["todas"].format(n=r["total_ofertas"]) if r.get("total_ofertas") else g["todas_sin_n"]
            lineas.append(_e(f"{len(ofertas) + 1}. ") + _enlace(todas, r["enlace_listado"]) + " ↗")
    else:
        lineas.append(_e(t["ninguna"]))
    if r.get("pvpc_cnmc") is not None and not breve:
        lineas.append(f"_{_e(_linea_pvpc_cnmc(r, t, idioma).rstrip('.'))}_")
    if r.get("veredicto") and r["ofertas"]:
        lineas.append("")
        if v := _texto_veredicto(r, t, idioma):
            cabeza, dos_puntos, resto = v.partition(":")
            lineas.append(f"*{_e(cabeza + dos_puntos)}*" + _e(resto))
        if termo := texto_termometro(r, idioma):
            lineas.append(_e(termo))
        if not breve:
            lineas.append(f"*{_e(_leer_avisos(r, t))}*")
    if breve:
        return "\n".join(lineas)
    # Avisos y, justo debajo, el de confirmar precios; la nota de impuestos al final, en cursiva.
    # Formato de José (9-nov): perder el bono y el térmico en negrita; la previsión subrayada hasta
    # los dos puntos y en negrita lo que sigue; el resto, texto normal.
    lineas.append("")
    lineas += [_aviso_tg(aviso, _texto_aviso(aviso, r, t, idioma)) for aviso in _avisos_ordenados(r)]
    lineas.append(_e(t["confirmar"]))
    lineas.append(f"_{_e(t['impuestos'])}_")
    return "\n".join(lineas)


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
        self._consulta: ConsultaCnmc | None = None
        self.estado: str | None = None
        self.ultimo_intento: str | None = None
        # Histórico mensual («AAAA-MM» → podio, previsión y pagado), ver historico_comparativas.
        self.historico: dict[str, Any] = {}

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
        self.historico = guardado.get("historico") or {}

    async def _async_guardar(self) -> None:
        await self._store.async_save(
            {
                "resultado": self.resultado,
                "estado": self.estado,
                "ultimo_intento": self.ultimo_intento,
                "historico": self.historico,
            }
        )
        async_dispatcher_send(self.hass, senal(self.subentry_id))

    async def async_comparar(
        self, *, destino: str | None = None, notificar: bool = True, enviar: bool = True
    ) -> dict[str, Any]:
        """Hace la comparativa; HomeAssistantError (con aviso) si no se puede."""
        ahora = dt_util.now()
        self.ultimo_intento = ahora.isoformat(timespec="minutes")
        try:
            comparativa = await self._async_calcular()
        except _Fallo as fallo:
            self.estado = fallo.estado
            await self._async_guardar()
            if notificar:
                t = TEXTOS[idiomas.idioma(self.hass.config.language)]
                persistent_notification.async_create(
                    self.hass,
                    idiomas.texto_error(self.hass, fallo.clave),
                    title=t["titulo"].format(nombre=self.nombre),
                    notification_id=f"{DOMAIN}_comparador_{self.subentry_id}",
                )
            raise idiomas.error(self.hass, fallo.clave) from fallo
        self.resultado = a_dict(comparativa, ahora)
        if self._consulta is not None:
            # Enlace a la ficha de cada oferta en la CNMC (con el consumo enviado): para la tarjeta.
            for o in self.resultado["ofertas"]:
                o["enlace"] = enlace_ficha(self._consulta, o["id"])
            self.resultado["enlace_listado"] = enlace_listado(self._consulta)
        self.estado = ESTADO_OK
        # Solo las comparativas buenas entran en el histórico (un fallo de la CNMC no lo toca).
        # El termómetro, contra los meses anteriores: antes o después de apuntar esta da igual.
        dia = ahora.astimezone(REFERENCE_TZ).date()
        self.resultado["termometro"] = hc.termometro(self.historico, self.resultado, dia)
        self.historico = hc.actualizar(self.historico, self.resultado, dia)
        await self._async_guardar()
        idioma = self.hass.config.language
        titulo, cuerpo = texto(self.resultado, self.nombre, idioma)
        if notificar:
            persistent_notification.async_create(
                self.hass, cuerpo, title=titulo, notification_id=f"{DOMAIN}_comparador_{self.subentry_id}"
            )
        # El destino del servicio se usa siempre; el de las opciones del suministro, con sus filtros.
        # `enviar` en False (la tarjeta): sin el destino de las opciones; se envía con su botón.
        breve = False
        if not destino and enviar and self._enviar(self.resultado):
            destino = self.facturacion.datos.get(CONF_COMPARADOR_DESTINO)
            breve = self.facturacion.datos.get(CONF_COMPARADOR_FORMATO) == "breve"
        if destino:
            try:
                await self._async_mandar(destino, breve)
            except HomeAssistantError as exc:
                _LOGGER.warning("%s: no se pudo enviar la comparativa a %s (%s)", self.nombre, destino, exc)
        return self.resultado

    async def async_enviar(self, destino: str | None = None) -> None:
        """Reenvía la última comparativa guardada, sin volver a consultar a la CNMC.

        Al destino pedido o al de las opciones del suministro, siempre (sin el filtro de «solo si
        ahorra»): lo pide el usuario desde la tarjeta o con el servicio `enviar_comparativa`.
        """
        if not self.resultado:
            raise idiomas.error(self.hass, "sin_comparativa")
        destino = destino or self.facturacion.datos.get(CONF_COMPARADOR_DESTINO)
        if not destino:
            raise idiomas.error(self.hass, "comparativa_sin_destino")
        await self._async_mandar(destino, self.facturacion.datos.get(CONF_COMPARADOR_FORMATO) == "breve")

    async def _async_mandar(self, destino: str, breve: bool) -> None:
        """La comparativa guardada al destino: a Telegram en MarkdownV2 con enlaces; al resto, en texto."""
        from .notificacion import async_mandar, destino_telegram

        idioma = self.hass.config.language
        telegram = destino_telegram(self.hass, destino)
        if telegram is not None:
            cuerpo = texto_telegram(self.resultado, self.nombre, idioma, breve=breve)
            await async_mandar(self.hass, destino, None, cuerpo, telegram, parse_mode="markdownv2")
            return
        titulo, cuerpo = texto(self.resultado, self.nombre, idioma, breve=breve)
        await async_mandar(self.hass, destino, titulo, cuerpo, None)

    def _enviar(self, r: Mapping[str, Any]) -> bool:
        """Si la comparativa va al destino de las opciones: siempre, o solo si se ahorra lo pedido."""
        d = self.facturacion.datos
        if not d.get(CONF_COMPARADOR_DESTINO):
            return False
        if d.get(CONF_COMPARADOR_ENVIO, "siempre") != "si_ahorra":
            return True
        mejor = r["ofertas"][0]["ahorro_anual"] if r.get("ofertas") else None
        return mejor is not None and mejor > float(d.get(CONF_COMPARADOR_UMBRAL) or 0)

    async def _async_calcular(self) -> Comparativa:
        if not self.codigo_postal:
            raise _Fallo(ESTADO_SIN_CODIGO_POSTAL, "comparar_sin_codigo_postal")
        ventana = ventana_12_meses(await self.facturacion.async_periodos_pagados())
        if ventana is None:
            raise _Fallo(ESTADO_SIN_DATOS, "comparar_sin_datos")
        # Lo que se pierde al cambiar es el bono de hoy: el contrato vigente manda sobre el de los
        # periodos ya cerrados (alta o baja del bono en el periodo en curso). Sin bono hoy, las
        # ofertas se comparan con lo pagado sin bono (`comparativa.Ventana.referencia_anual`).
        ventana = replace(ventana, bono=self.facturacion.con_bono_hoy)
        d = self.facturacion.datos
        consulta = ConsultaCnmc(
            self.codigo_postal,
            Decimal(str(d[CONF_POTENCIA_P1])),
            Decimal(str(d[CONF_POTENCIA_P2])),
            consulta_anual(ventana),
        )
        self._consulta = consulta
        try:
            ofertas = await async_consultar(async_get_clientsession(self.hass), consulta)
        except CnmcNoResponde as exc:
            _LOGGER.warning("%s: el comparador de la CNMC no responde (%s)", self.nombre, exc)
            raise _Fallo(ESTADO_CNMC_NO_RESPONDE, "comparar_cnmc_no_responde") from exc
        # % del bono prorrateado: el de la ventana y el de los próximos 12 meses (la previsión).
        tarifas = self.facturacion.historico.tarifas
        bono = suministro_de(self.facturacion.datos).bono
        hoy = dt_util.now().date()
        return comparar(
            ventana,
            ofertas,
            pct_bono_ventana=pct_bono_medio(tarifas, bono, ventana.inicio, ventana.fin),
            pct_bono_prevision=pct_bono_medio(tarifas, bono, hoy, hoy + timedelta(days=365)),
            hoy=hoy,
        )

    def programar(self) -> None:
        """Comparativa mensual (día 2 a las 10:17) y la de fin de mes, si el usuario las activó."""
        d = self.facturacion.datos
        if d.get(CONF_COMPARAR_MENSUAL):

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
        if d.get(CONF_COMPARAR_FIN_MES):

            async def _fin_de_mes(ahora: datetime) -> None:
                await self.async_completar_mes(ahora)

            self.entry.async_on_unload(
                async_track_time_change(
                    self.hass, _fin_de_mes, hour=HORA_FIN_MES[0], minute=HORA_FIN_MES[1], second=0
                )
            )

    async def async_completar_mes(self, ahora: datetime) -> bool:
        """El último día del mes, si no hay comparativa en el mes, compara en silencio: sin
        notificación ni destino, solo para el histórico. True si ha comparado (con o sin éxito)."""
        hoy = ahora.astimezone(REFERENCE_TZ).date()
        if (hoy + timedelta(days=1)).month == hoy.month or hc.tiene_mes(self.historico, hoy):
            return False
        if not self.codigo_postal:  # sin él no se envía nada (el formulario ya lo exige)
            return False
        with contextlib.suppress(HomeAssistantError):  # ni avisos: queda en el estado del sensor
            await self.async_comparar(notificar=False, enviar=False)
        return True


class _Fallo(Exception):
    """Comparativa imposible: el estado del sensor y la clave de su mensaje (exceptions de translations/)."""

    def __init__(self, estado: str, clave: str) -> None:
        super().__init__(clave)
        self.estado = estado
        self.clave = clave
