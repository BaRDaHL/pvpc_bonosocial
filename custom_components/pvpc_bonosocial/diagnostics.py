"""Diagnóstico de la integración (DISENO §10): lo necesario para depurar, sin datos personales.

La configuración se filtra con una **lista de permitidos** (`PUBLICO`): una clave que no esté
ahí sale como `**REDACTED**`, así que una opción nueva queda oculta hasta que alguien decida
que se puede enseñar. Dentro de los valores permitidos (p. ej. los contratos anteriores) se
ocultan además las claves de `OCULTAR` con async_redact_data.

Se ocultan el token de ESIOS, la IP del Shelly, el código postal, los destinos de las
notificaciones (resumen y comparador), las credenciales y el suministro de Datadis (CUPS), el
bono social y su categoría (dicen si el hogar es vulnerable y cómo es), y los nombres. Los
avisos de la distribuidora que llegan de Datadis pasan por `sin_cups`.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from datetime import timedelta
from typing import Any

from homeassistant.components.diagnostics import REDACTED, async_redact_data
from homeassistant.const import CONF_API_TOKEN, CONF_NAME
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_BETTER_PRICE_TARGET,
    ATTR_ENABLE_PRIVATE_API,
    ATTR_HOLIDAY_SOURCE,
    ATTR_NEXT_BEST_IN_UPDATE,
    ATTR_NEXT_PERIOD_IN_UPDATE,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ATTR_NEXT_PRICE_IN_UPDATE,
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    ATTR_PRICE_MODE,
    ATTR_SHOW_REFERENCE_PRICE,
    ATTR_TARIFF,
    CONF_ALQUILER,
    CONF_ARRASTRE_INICIAL,
    CONF_BONO,
    CONF_CATEGORIA,
    CONF_CODIGO_POSTAL,
    CONF_COLOR_VALLE,
    CONF_COMPARADOR_DESTINO,
    CONF_COMPARADOR_ENVIO,
    CONF_COMPARADOR_FORMATO,
    CONF_COMPARADOR_UMBRAL,
    CONF_COMPARAR_MENSUAL,
    CONF_CONTRATOS_ANTERIORES,
    CONF_DATADIS_CLAVE,
    CONF_DATADIS_SUMINISTRO,
    CONF_DATADIS_USUARIO,
    CONF_DESTINO,
    CONF_DIAS_EMISION,
    CONF_DURACION_FRANJA,
    CONF_FIN_ULTIMA_FACTURA,
    CONF_FORMATO_TABLA,
    CONF_FRANJAS_HOY,
    CONF_FRANJAS_MANANA,
    CONF_FUENTE,
    CONF_HOY_ACTIVO,
    CONF_HOY_HORA,
    CONF_IDS_HEREDADOS,
    CONF_INCLUIR_CONSUMO,
    CONF_INCLUIR_FACTURA,
    CONF_MANANA_ACTIVO,
    CONF_MANANA_HORA,
    CONF_MOSTRAR_PERIODO,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    CONF_RESTO_HOY,
    CONF_SEGUNDA_OPINION,
    CONF_SHELLY_CANAL,
    CONF_SHELLY_FRECUENCIA,
    CONF_SHELLY_IP,
    CONF_SUMINISTRO,
    CONF_TIPO_FUENTE,
    LEGACY_ATTR_ENABLE_INJECTION_PRICE,
    LEGACY_ATTR_POWER,
    LEGACY_ATTR_POWER_P2_P3,
    SUBENTRY_DATADIS,
    SUBENTRY_SUMINISTRO,
)
from .flujo_datadis import CONF_REVISION
from .importacion import CONF_IMPORTAR
from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.coordinator import PVPCConfigEntry

# Claves de configuración que se pueden enseñar tal cual (entrada principal y subentradas).
PUBLICO = frozenset(
    {
        # entrada principal
        ATTR_TARIFF,
        ATTR_POWER_P1,
        ATTR_POWER_P3,
        ATTR_BETTER_PRICE_TARGET,
        ATTR_ENABLE_PRIVATE_API,
        ATTR_PRICE_MODE,
        ATTR_SHOW_REFERENCE_PRICE,
        ATTR_HOLIDAY_SOURCE,
        ATTR_NEXT_PRICE_IN_UPDATE,
        ATTR_NEXT_BEST_IN_UPDATE,
        ATTR_NEXT_PERIOD_IN_UPDATE,
        ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
        LEGACY_ATTR_ENABLE_INJECTION_PRICE,
        LEGACY_ATTR_POWER,
        LEGACY_ATTR_POWER_P2_P3,
        CONF_IMPORTAR,
        # suministro
        CONF_POTENCIA_P1,
        CONF_POTENCIA_P2,
        CONF_TIPO_FUENTE,
        CONF_FUENTE,
        CONF_FIN_ULTIMA_FACTURA,
        CONF_DIAS_EMISION,
        CONF_ALQUILER,
        CONF_ARRASTRE_INICIAL,
        CONF_CONTRATOS_ANTERIORES,
        CONF_IDS_HEREDADOS,
        CONF_COMPARAR_MENSUAL,
        CONF_COMPARADOR_ENVIO,
        CONF_COMPARADOR_UMBRAL,
        CONF_COMPARADOR_FORMATO,
        CONF_SEGUNDA_OPINION,
        CONF_SHELLY_CANAL,
        CONF_SHELLY_FRECUENCIA,
        # resumen por notificación
        CONF_SUMINISTRO,
        CONF_HOY_ACTIVO,
        CONF_HOY_HORA,
        CONF_MANANA_ACTIVO,
        CONF_MANANA_HORA,
        CONF_FRANJAS_HOY,
        CONF_FRANJAS_MANANA,
        CONF_DURACION_FRANJA,
        CONF_INCLUIR_CONSUMO,
        CONF_INCLUIR_FACTURA,
        CONF_COLOR_VALLE,
        CONF_MOSTRAR_PERIODO,
        CONF_FORMATO_TABLA,
        CONF_RESTO_HOY,
        # Datadis
        CONF_REVISION,
    }
)
# Claves que se ocultan siempre, también dentro de los valores permitidos (contratos anteriores).
OCULTAR = frozenset(
    {
        CONF_API_TOKEN,
        CONF_NAME,
        CONF_SHELLY_IP,
        CONF_CODIGO_POSTAL,
        CONF_DESTINO,
        CONF_COMPARADOR_DESTINO,
        CONF_DATADIS_USUARIO,
        CONF_DATADIS_CLAVE,
        CONF_DATADIS_SUMINISTRO,
        CONF_BONO,
        CONF_CATEGORIA,
        "title",
        "unique_id",
    }
)
# CUPS: ES + 16 dígitos + 2 letras de control, a veces con 2 caracteres más (punto frontera).
_CUPS = re.compile(r"ES\d{16}[A-Z]{2}(?:\d[A-Z])?", re.IGNORECASE)


def sin_cups(texto: Any) -> Any:
    """Tapa los CUPS de un texto (los avisos de la distribuidora pueden traerlo)."""
    return _CUPS.sub(REDACTED, texto) if isinstance(texto, str) else texto


def config_sin_datos_personales(datos: Mapping[str, Any]) -> dict[str, Any]:
    """Configuración para el diagnóstico: solo las claves de `PUBLICO`, sin las de `OCULTAR` dentro."""
    return {
        k: async_redact_data(v, OCULTAR) if k in PUBLICO and k not in OCULTAR else REDACTED
        for k, v in datos.items()
    }


def _precios(coordinador: Any) -> dict[str, Any]:
    historico = getattr(coordinador, "historico", None)
    if historico is None:
        return {"historico": None}
    dias = historico.dias()
    hoy = dt_util.now(REFERENCE_TZ).date()
    return {
        "zona": historico.zona,
        "dias_guardados": len(dias),
        "primero": dias[0].isoformat() if dias else None,
        "ultimo": dias[-1].isoformat() if dias else None,
        "hoy_publicado": historico.dia(hoy) is not None,
        "manana_publicado": historico.dia(hoy + timedelta(days=1)) is not None,
        "tarifas": historico.tarifas is not None,
        "ultima_actualizacion_ok": coordinador.last_update_success,
    }


def _sin_ip(estado: dict[str, Any], ip: str | None) -> dict[str, Any]:
    """El error del Shelly lleva su URL: se oculta la IP."""
    if ip and isinstance(estado.get("error"), str):
        return {**estado, "error": estado["error"].replace(ip, "**REDACTED**")}
    return estado


def _suministro(facturacion: Any) -> dict[str, Any]:
    d = facturacion.data
    ajuste = facturacion.ajuste()
    out: dict[str, Any] = {
        "actualizacion_ok": facturacion.last_update_success,
        "inicio_periodo": facturacion.inicio_periodo.isoformat() if facturacion.inicio_periodo else None,
        "usa_shelly": facturacion.usa_shelly,
        "shelly": _sin_ip(facturacion.estado_shelly, facturacion.datos.get(CONF_SHELLY_IP)),
        "calibracion": {"alfa": float(ajuste.alfa), "gamma_kwh_hora": float(ajuste.gamma_kwh_hora)}
        if ajuste
        else None,
        "precision": facturacion.precision,
        "facturas": [
            {
                "inicio": c["inicio"],
                "fin": c["fin"],
                "estado": c.get("estado"),
                "total": c.get("total"),
                "total_estimado": c.get("total_estimado"),
                "consumo": c.get("consumo"),
                "bonificados": c.get("bonificados"),
                "horas": c.get("horas"),
            }
            for c in facturacion.cerradas[-14:]
        ],
    }
    if d is not None:
        est = d.estimacion
        out.update(
            {
                "problema": d.problema,
                "horas_sin_precio": d.horas_sin_precio,
                "horas_sin_consumo": d.horas_sin_consumo,
                "horas_corregidas_shelly": d.horas_corregidas_shelly,
                "ultima_hora_medida": d.ultima_hora_medida.isoformat() if d.ultima_hora_medida else None,
                "arrastre_kwh": d.arrastre_kwh,
                "acumulado": float(est.acumulado.total) if est and est.acumulado else None,
                "prevision": float(est.prevision.total) if est else None,
                "kwh_medidos": {p: float(v) for p, v in est.kwh_medidos.items()} if est else None,
            }
        )
    return out


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: PVPCConfigEntry) -> dict[str, Any]:
    coordinador = getattr(entry, "runtime_data", None)
    suministros = getattr(coordinador, "suministros", {}) or {}
    subentradas = []
    for n, (subentry_id, sub) in enumerate(entry.subentries.items(), start=1):
        info: dict[str, Any] = {
            "tipo": sub.subentry_type,
            "numero": n,
            "datos": config_sin_datos_personales(sub.data),
        }
        if sub.subentry_type == SUBENTRY_SUMINISTRO and subentry_id in suministros:
            info["estado"] = _suministro(suministros[subentry_id])
        cuenta = (getattr(coordinador, "datadis", {}) or {}).get(subentry_id)
        if sub.subentry_type == SUBENTRY_DATADIS and cuenta is not None and cuenta.data:
            info["estado"] = {k: sin_cups(v) for k, v in cuenta.data.items() if k != "estadistica"}
        subentradas.append(info)
    return {
        "entrada": {
            "version": entry.version,
            "minor_version": entry.minor_version,
            "data": config_sin_datos_personales(entry.data),
            "options": config_sin_datos_personales(entry.options),
        },
        "precios": _precios(coordinador) if coordinador is not None else None,
        "subentradas": subentradas,
    }
