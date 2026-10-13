"""Diagnóstico de la integración (DISENO §10): lo necesario para depurar, sin datos personales.

Se ocultan el token de ESIOS, la IP del Shelly, los destinos de las notificaciones y los
nombres de los suministros. No se guardan CUPS, credenciales de Datadis ni ID de chat, así
que no pueden salir aquí.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_API_TOKEN
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import (
    CONF_CODIGO_POSTAL,
    CONF_DATADIS_CLAVE,
    CONF_DATADIS_SUMINISTRO,
    CONF_DATADIS_USUARIO,
    CONF_DESTINO,
    CONF_SHELLY_IP,
    SUBENTRY_DATADIS,
    SUBENTRY_SUMINISTRO,
)
from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.coordinator import PVPCConfigEntry

OCULTAR = {
    CONF_API_TOKEN,
    CONF_SHELLY_IP,
    CONF_CODIGO_POSTAL,
    CONF_DESTINO,
    CONF_DATADIS_USUARIO,
    CONF_DATADIS_CLAVE,
    CONF_DATADIS_SUMINISTRO,
    "title",
    "unique_id",
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
            "datos": async_redact_data(dict(sub.data), OCULTAR),
        }
        if sub.subentry_type == SUBENTRY_SUMINISTRO and subentry_id in suministros:
            info["estado"] = _suministro(suministros[subentry_id])
        cuenta = (getattr(coordinador, "datadis", {}) or {}).get(subentry_id)
        if sub.subentry_type == SUBENTRY_DATADIS and cuenta is not None and cuenta.data:
            info["estado"] = {k: v for k, v in cuenta.data.items() if k != "estadistica"}
        subentradas.append(info)
    return {
        "entrada": {
            "version": entry.version,
            "minor_version": entry.minor_version,
            "data": async_redact_data(dict(entry.data), OCULTAR),
            "options": async_redact_data(dict(entry.options), OCULTAR),
        },
        "precios": _precios(coordinador) if coordinador is not None else None,
        "subentradas": subentradas,
    }
