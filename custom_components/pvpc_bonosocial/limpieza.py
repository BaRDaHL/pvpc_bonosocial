"""Limpieza de lo que deja una subentrada borrada: sus Stores y sus avisos de Reparaciones.

HA (2025.11) no avisa a la integración de qué subentrada se borra: `async_remove_subentry` solo
limpia los registros de dispositivos y entidades y dispara los update listeners (que recargan la
entrada). Por eso no se limpia «al borrar» sino al arrancar, reconciliando contra lo que existe:

- Stores: un índice propio (`pvpc_bonosocial.subentradas`, entry_id → subentradas) recuerda las
  subentradas de cada entrada; las que estaban en el índice y ya no están en la entrada se
  borran (`suministro_`, `datadis_` y `comparador_<id>`). El registro común de consultas a
  Datadis (`datadis_consultas`) no es de ninguna subentrada y no se toca nunca (protección
  contra el 429).
- Avisos: se recorre el issue registry y se borra cualquier aviso del dominio cuyo id lleve el
  id de una subentrada que no existe en ninguna entrada del dominio. Así se limpian también los
  `factura_no_cuadra_*` persistentes que dejaron las versiones anteriores a este arreglo.

Al desinstalar (`async_remove_entry`) se borran los de todas las subentradas que la entrada tiene
o tuvo según el índice.
"""

from __future__ import annotations

import asyncio
import re

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.storage import Store

from .const import DOMAIN

STORE_INDICE = f"{DOMAIN}.subentradas"
STORES_POR_SUBENTRADA = ("suministro", "datadis", "comparador")
# Los id de subentrada son ULID (26 caracteres de Crockford base32) y van entre «_» en los avisos.
_ULID_EN_AVISO = re.compile(r"(?:^|_)([0-9A-HJKMNP-TV-Z]{26})(?=_|$)")
_CANDADO = f"{DOMAIN}_limpieza"


def _candado(hass: HomeAssistant) -> asyncio.Lock:
    return hass.data.setdefault(_CANDADO, asyncio.Lock())


async def async_borrar_datos_subentrada(hass: HomeAssistant, subentry_id: str) -> None:
    for prefijo in STORES_POR_SUBENTRADA:
        await Store(hass, 1, f"{DOMAIN}.{prefijo}_{subentry_id}").async_remove()
    for dominio, issue_id in list(ir.async_get(hass).issues):
        if dominio == DOMAIN and subentry_id in issue_id:
            ir.async_delete_issue(hass, DOMAIN, issue_id)


def _borrar_avisos_huerfanos(hass: HomeAssistant, excluir_entry_id: str | None = None) -> None:
    # Ids vivos: las subentradas y también las propias entradas (hay avisos por entrada).
    vivas = {
        sid
        for e in hass.config_entries.async_entries(DOMAIN)
        if e.entry_id != excluir_entry_id
        for sid in (e.entry_id, *e.subentries)
    }
    for dominio, issue_id in list(ir.async_get(hass).issues):
        if dominio != DOMAIN:
            continue
        encontrado = _ULID_EN_AVISO.search(issue_id)
        if encontrado and encontrado.group(1) not in vivas:
            ir.async_delete_issue(hass, DOMAIN, issue_id)


async def async_reconciliar(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Al arrancar la entrada: borra lo de sus subentradas que ya no existen."""
    async with _candado(hass):
        store: Store[dict[str, list[str]]] = Store(hass, 1, STORE_INDICE)
        indice = await store.async_load() or {}
        actuales = sorted(entry.subentries)
        for subentry_id in set(indice.get(entry.entry_id, [])) - set(actuales):
            await async_borrar_datos_subentrada(hass, subentry_id)
        _borrar_avisos_huerfanos(hass)
        if indice.get(entry.entry_id) != actuales:
            indice[entry.entry_id] = actuales
            await store.async_save(indice)


async def async_olvidar_entrada(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Al eliminar la entrada: borra lo de todas las subentradas que tiene o tuvo."""
    async with _candado(hass):
        store: Store[dict[str, list[str]]] = Store(hass, 1, STORE_INDICE)
        indice = await store.async_load() or {}
        for subentry_id in set(indice.pop(entry.entry_id, [])) | set(entry.subentries):
            await async_borrar_datos_subentrada(hass, subentry_id)
        _borrar_avisos_huerfanos(hass, excluir_entry_id=entry.entry_id)
        if indice:
            await store.async_save(indice)
        else:
            await store.async_remove()
