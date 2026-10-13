"""Botón «Comparar tarifas» de cada suministro (DISENO §8 bis, F8)."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .comparador import Comparador
from .prices.coordinator import PVPCConfigEntry
from .sensor_suministro import dispositivo, entity_id_suministro

CLAVE = "comparar_tarifas"


class CompararTarifas(ButtonEntity):
    _attr_has_entity_name = True
    _attr_translation_key = CLAVE

    def __init__(self, comparador: Comparador, primero: bool) -> None:
        sub = comparador.facturacion.subentrada
        self.comparador = comparador
        self._attr_unique_id = f"{sub.subentry_id}_{CLAVE}"
        self.entity_id = entity_id_suministro(sub, primero, CLAVE, dominio="button")
        self._attr_device_info = dispositivo(sub)

    async def async_press(self) -> None:
        await self.comparador.async_comparar()


async def async_setup_entry(
    hass: HomeAssistant, entry: PVPCConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    comparadores = getattr(entry.runtime_data, "comparadores", {})
    primero = next(iter(comparadores), None)
    for subentry_id, comp in comparadores.items():
        async_add_entities([CompararTarifas(comp, subentry_id == primero)], config_subentry_id=subentry_id)
