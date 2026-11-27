"""Fuente de consumo de cada suministro: seguir los renombrados y completar las subentradas (v1.4).

- **Renombrados.** El medidor se guarda por su `entity_id` y, además, por la entrada del registro de
  entidades (UUID, `CONF_FUENTE_REGISTRO`), que no cambia al renombrar la entidad. Al arrancar se
  resuelve el UUID y, si la entidad se llama ahora de otra forma, se actualiza la subentrada; con la
  integración cargada se escucha el registro y un renombrado actualiza la subentrada (lo que recarga la
  entrada). HA ya traslada las estadísticas al id nuevo (recorder/entity_registry.py), así que el
  consumo sigue llegando con el nombre nuevo.
- **Subentradas de antes de la v1.4**, sin cambiar la versión de la entrada (así una vuelta atrás a la
  v1.3 sigue funcionando): las cuentas de Datadis fijan el id de su estadística (el que ya usaban, el de
  su título) y los suministros con medidor guardan su UUID. Un suministro con fuente «estadística» que
  apunta a la de una cuenta de Datadis de la integración pasa a «datadis» (misma fuente, mismas cifras).

Se hace antes de registrar el update listener de la entrada: cambiar las subentradas aquí no recarga.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_entity_registry_updated_event

from .const import (
    CONF_DATADIS_CUENTA,
    CONF_DATADIS_ESTADISTICA,
    CONF_FUENTE,
    CONF_FUENTE_REGISTRO,
    CONF_TIPO_FUENTE,
    FUENTE_AMBOS,
    FUENTE_DATADIS,
    FUENTE_ESTADISTICA,
    FUENTE_SENSOR,
    SUBENTRY_DATADIS,
    SUBENTRY_SUMINISTRO,
)
from .cuenta_datadis import estadistica_de, id_estadistica_energia

_LOGGER = logging.getLogger(__name__)
# Tipos de fuente cuyo CONF_FUENTE es una entidad de HA (el medidor).
CON_MEDIDOR = (FUENTE_SENSOR, FUENTE_AMBOS)


def _actualizar(
    hass: HomeAssistant, entry: ConfigEntry, sub: ConfigSubentry, cambios: dict[str, Any]
) -> None:
    if any(sub.data.get(k) != v for k, v in cambios.items()):
        hass.config_entries.async_update_subentry(entry, sub, data={**sub.data, **cambios})


@callback
def async_completar_subentradas(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Completa las subentradas de versiones anteriores y sigue los renombrados hechos con HA parado."""
    cuentas: dict[str, str] = {}  # estadística → subentry_id de la cuenta
    for sid, sub in list(entry.subentries.items()):
        if sub.subentry_type != SUBENTRY_DATADIS:
            continue
        if not sub.data.get(CONF_DATADIS_ESTADISTICA):
            _actualizar(hass, entry, sub, {CONF_DATADIS_ESTADISTICA: id_estadistica_energia(sub.title)})
        cuentas[estadistica_de(entry.subentries[sid])] = sid

    registro = er.async_get(hass)
    for sid in list(entry.subentries):
        sub = entry.subentries[sid]
        if sub.subentry_type != SUBENTRY_SUMINISTRO:
            continue
        tipo = sub.data.get(CONF_TIPO_FUENTE)
        fuente = sub.data.get(CONF_FUENTE)
        if tipo == FUENTE_ESTADISTICA and fuente in cuentas:
            _actualizar(
                hass, entry, sub, {CONF_TIPO_FUENTE: FUENTE_DATADIS, CONF_DATADIS_CUENTA: cuentas[fuente]}
            )
            continue
        if tipo not in CON_MEDIDOR or not fuente:
            continue
        cambios = cambios_por_registro(registro, sub.data)
        if cambios.get(CONF_FUENTE) and cambios[CONF_FUENTE] != fuente:
            _LOGGER.info("%s: el medidor %s se llama ahora %s", sub.title, fuente, cambios[CONF_FUENTE])
        _actualizar(hass, entry, sub, cambios)


def cambios_por_registro(registro: er.EntityRegistry, datos: Any) -> dict[str, Any]:
    """Fuente y UUID según el registro de entidades (vacío si no hay nada que cambiar)."""
    uuid = datos.get(CONF_FUENTE_REGISTRO)
    fuente = datos.get(CONF_FUENTE)
    if uuid and (actual := er.async_resolve_entity_id(registro, uuid)) and actual != fuente:
        return {CONF_FUENTE: actual}
    if not uuid and fuente and (entidad := registro.async_get(fuente)) is not None:
        return {CONF_FUENTE_REGISTRO: entidad.id}
    return {}


@callback
def async_seguir_medidor(
    hass: HomeAssistant, entry: ConfigEntry, subentry_id: str, al_borrar: Callable[[], None]
) -> Callable[[], None] | None:
    """Escucha el registro de entidades del medidor del suministro: un renombrado actualiza la subentrada
    (y con ello se recarga la entrada); un borrado llama a `al_borrar` (el aviso de fuente sin datos)."""
    sub = entry.subentries.get(subentry_id)
    if sub is None or sub.data.get(CONF_TIPO_FUENTE) not in CON_MEDIDOR or not sub.data.get(CONF_FUENTE):
        return None

    @callback
    def _cambio(evento: Event[er.EventEntityRegistryUpdatedData]) -> None:
        actual = entry.subentries.get(subentry_id)
        if actual is None:
            return
        datos = evento.data
        if datos["action"] == "remove":
            _LOGGER.warning("%s: se ha borrado el medidor %s", actual.title, datos["entity_id"])
            al_borrar()
            return
        if datos["action"] == "update" and "old_entity_id" in datos:
            nuevo = datos["entity_id"]
            _LOGGER.info("%s: el medidor %s ahora se llama %s", actual.title, datos["old_entity_id"], nuevo)
            entidad = er.async_get(hass).async_get(nuevo)
            cambios: dict[str, Any] = {CONF_FUENTE: nuevo}
            if entidad is not None:
                cambios[CONF_FUENTE_REGISTRO] = entidad.id
            _actualizar(hass, entry, actual, cambios)

    return async_track_entity_registry_updated_event(hass, sub.data[CONF_FUENTE], _cambio)
