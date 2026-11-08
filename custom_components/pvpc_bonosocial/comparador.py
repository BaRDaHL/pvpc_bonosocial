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
from dataclasses import replace
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

from .cnmc import CnmcNoResponde, ConsultaCnmc, async_consultar, enlace_ficha, enlace_listado
from .comparativa import (
    AVISO_BONO_NUEVO,
    AVISO_BONO_PERDIDO,
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
from .const import (
    CONF_CODIGO_POSTAL,
    CONF_COMPARADOR_DESTINO,
    CONF_COMPARADOR_ENVIO,
    CONF_COMPARADOR_FORMATO,
    CONF_COMPARADOR_UMBRAL,
    CONF_COMPARAR_MENSUAL,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    DOMAIN,
)
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


def _prevision_con_bono(c: Comparativa) -> float | None:
    """La previsión de PVPC de la CNMC con el bono: aplicándole lo que el bono rebajó de verdad en
    tus facturas (lo pagado / lo que habrías pagado sin bono). Aproximada: el bono tiene tope de kWh."""
    v = c.ventana
    if c.pvpc_cnmc_prevision is None or not v.con_bono or not v.pagada_con_bono:
        return None
    if not v.pagado_sin_bono_anual:
        return None
    return round(float(c.pvpc_cnmc_prevision * v.pagado_anual / v.pagado_sin_bono_anual), 2)


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
        "pvpc_cnmc_prevision_bono": _prevision_con_bono(c),
        "ofertas": [
            {
                "id": a.oferta.id,
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
        "confirmar": "ℹ️ Los precios son los que publica la CNMC y pueden estar desfasados: confírmalos con "
        "la comercializadora antes de contratar.",
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
        "confirmar": "ℹ️ Prices are those published by the CNMC and may be out of date: confirm them with "
        "the retailer before signing up.",
    },
}


def texto(r: Mapping[str, Any], nombre: str, idioma: str = "es", *, breve: bool = False) -> tuple[str, str]:
    """(título, texto) de la comparativa guardada; `breve`: lo pagado, la mejor oferta y el veredicto."""
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
            lineas.append(linea)
    else:
        lineas.append(t["ninguna"])
    if r.get("pvpc_cnmc") is not None and not breve:
        lineas.append(_linea_pvpc_cnmc(r, t, idioma))
    if r.get("veredicto") and r["ofertas"]:
        lineas += ["", t[r["veredicto"]].format(x=_eur(abs(r["ofertas"][0]["ahorro_anual"]), idioma))]
    if breve:
        return t["titulo"].format(nombre=nombre), "\n".join(lineas)
    avisos = [a for a in r["avisos"] if a != AVISO_SIN_OFERTAS]
    if avisos:
        lineas.append("")
    for aviso in avisos:
        lineas.append(
            t[aviso].format(
                ausentes=", ".join(x.title() for x in r["grandes_ausentes"]),
                dias=p["dias"],
                sin_anual=_eur(r.get("pagado_sin_bono_anual") or 0, idioma),
            )
        )
    lineas += ["", t["impuestos"], t["confirmar"]]
    return t["titulo"].format(nombre=nombre), "\n".join(lineas)


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
        "todas": "See the {n} offers in the CNMC comparator",
        "todas_sin_n": "See all offers in the CNMC comparator",
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
    idioma = "es" if idioma.split("-")[0] == "es" else "en"
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
        v = t[r["veredicto"]].format(x=_eur(abs(r["ofertas"][0]["ahorro_anual"]), idioma))
        cabeza, dos_puntos, resto = v.partition(":")
        lineas += ["", f"*{_e(cabeza + dos_puntos)}*" + _e(resto)]
    if breve:
        return "\n".join(lineas)
    # Avisos y, justo debajo, el de confirmar precios: cada línea en monoespaciado (José, 8-nov);
    # la nota de impuestos al final, en cursiva. Dentro del bloque solo se escapan ` y \.
    avisos = [a for a in r["avisos"] if a != AVISO_SIN_OFERTAS]
    info = [
        t[aviso].format(
            ausentes=", ".join(x.title() for x in r["grandes_ausentes"]),
            dias=p["dias"],
            sin_anual=_eur(r.get("pagado_sin_bono_anual") or 0, idioma),
        )
        for aviso in avisos
    ] + [t["confirmar"]]
    lineas.append("")
    lineas += ["`" + x.replace("\\", "\\\\").replace("`", "\\`") + "`" for x in info]
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
                persistent_notification.async_create(
                    self.hass,
                    fallo.mensaje,
                    title=TEXTOS["es"]["titulo"].format(nombre=self.nombre),
                    notification_id=f"{DOMAIN}_comparador_{self.subentry_id}",
                )
            raise HomeAssistantError(fallo.mensaje) from fallo
        self.resultado = a_dict(comparativa, ahora)
        if self._consulta is not None:
            # Enlace a la ficha de cada oferta en la CNMC (con el consumo enviado): para la tarjeta.
            for o in self.resultado["ofertas"]:
                o["enlace"] = enlace_ficha(self._consulta, o["id"])
            self.resultado["enlace_listado"] = enlace_listado(self._consulta)
        self.estado = ESTADO_OK
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
            raise HomeAssistantError("Aún no hay ninguna comparativa: compara las tarifas antes de enviarla.")
        destino = destino or self.facturacion.datos.get(CONF_COMPARADOR_DESTINO)
        if not destino:
            raise HomeAssistantError(
                "El suministro no tiene destino para la comparativa: elígelo en las opciones del suministro."
            )
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
            raise _Fallo(
                ESTADO_SIN_CODIGO_POSTAL,
                "Falta el código postal del suministro: añádelo con la rueda dentada ⚙ del suministro "
                "(Reconfigurar) para comparar tarifas.",
            )
        ventana = ventana_12_meses(await self.facturacion.async_periodos_pagados())
        if ventana is None:
            raise _Fallo(
                ESTADO_SIN_DATOS,
                "Aún no hay ningún periodo de factura cerrado: hace falta al menos uno para comparar.",
            )
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
