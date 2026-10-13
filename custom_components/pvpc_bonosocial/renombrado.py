"""Renombrado de entidades migradas a los nombres propios `sensor.pvpc_bs_*`.

Al cambiar el entity_id en el registro, el recorder de HA traslada el historial y las
estadísticas largas al nombre nuevo. Lo que no traslada es el panel de Energía (guarda
los nombres como texto), así que se actualizan aquí las referencias exactas al nombre
antiguo. Los scripts, automatizaciones y paneles del usuario no se tocan: se le avisa en
Repairs con la lista de cambios.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

ISSUE_NOMBRES = "nombres_cambiados"
CLAVES_PANEL_ENERGIA = ("energy_sources", "device_consumption", "device_consumption_water")


def renombrar(hass: HomeAssistant, entity_id: str, nuevo: str) -> bool:
    """Cambia el entity_id si el nuevo está libre. Devuelve si lo ha cambiado."""
    if entity_id == nuevo:
        return False
    registro = er.async_get(hass)
    if registro.async_is_registered(nuevo) or hass.states.get(nuevo) is not None:
        _LOGGER.warning("No se renombra %s: %s ya existe", entity_id, nuevo)
        return False
    registro.async_update_entity(entity_id, new_entity_id=nuevo)
    return True


def _reemplazar(valor: Any, renombres: Mapping[str, str]) -> Any:
    if isinstance(valor, str):
        return renombres.get(valor, valor)
    if isinstance(valor, list):
        return [_reemplazar(v, renombres) for v in valor]
    if isinstance(valor, dict):
        return {k: _reemplazar(v, renombres) for k, v in valor.items()}
    return valor


async def async_actualizar_panel_energia(hass: HomeAssistant, renombres: Mapping[str, str]) -> bool:
    """Sustituye los nombres antiguos en el panel de Energía. Devuelve si ha cambiado algo."""
    if not renombres:
        return False
    try:
        from homeassistant.components.energy.data import async_get_manager

        gestor = await async_get_manager(hass)
    except Exception:
        _LOGGER.exception("No se pudo leer el panel de Energía para actualizar los nombres")
        return False
    datos = gestor.data
    if not datos:
        return False
    cambios = {
        clave: _reemplazar(datos[clave], renombres)
        for clave in CLAVES_PANEL_ENERGIA
        if clave in datos and _reemplazar(datos[clave], renombres) != datos[clave]
    }
    if not cambios:
        return False
    await gestor.async_update(cambios)
    _LOGGER.info("Panel de Energía actualizado con los nombres nuevos: %s", ", ".join(sorted(cambios)))
    return True


def avisar_nombres(hass: HomeAssistant, renombres: Mapping[str, str]) -> None:
    """Aviso persistente con la lista «antiguo → nuevo» (se suma a uno anterior)."""
    if not renombres:
        return
    previo = ir.async_get(hass).async_get_issue(DOMAIN, ISSUE_NOMBRES)
    lineas = []
    if previo and previo.translation_placeholders:
        lineas = previo.translation_placeholders.get("cambios", "").splitlines()
    lineas += [f"{viejo} → {nuevo}" for viejo, nuevo in sorted(renombres.items())]
    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_NOMBRES,
        is_fixable=False,
        is_persistent=True,
        severity=ir.IssueSeverity.WARNING,
        translation_key=ISSUE_NOMBRES,
        translation_placeholders={"cambios": "\n".join(dict.fromkeys(lineas))},
    )
