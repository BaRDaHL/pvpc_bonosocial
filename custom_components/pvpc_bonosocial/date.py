"""Fecha editable «Fin de periodo» de cada suministro (DISENO §6)."""

from __future__ import annotations

from datetime import date

from homeassistant.components.date import DateEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .facturacion import FacturacionSuministro
from .prices.coordinator import PVPCConfigEntry
from .sensor_suministro import dispositivo, entity_id_suministro


class FinPeriodo(CoordinatorEntity[FacturacionSuministro], DateEntity):
    """Corte previsto del periodo en curso; si se cambia, la previsión se ajusta a esa fecha."""

    _attr_has_entity_name = True
    _attr_translation_key = "fin_periodo"

    def __init__(self, coordinador: FacturacionSuministro, primero: bool) -> None:
        super().__init__(coordinador)
        sub = coordinador.subentrada
        self._attr_unique_id = f"{sub.subentry_id}_fin_periodo"
        self.entity_id = entity_id_suministro(sub, primero, "fin_periodo", dominio="date")
        self._attr_device_info = dispositivo(sub)

    @property
    def available(self) -> bool:
        return (
            super().available
            and self.coordinator.data is not None
            and self.coordinator.data.estimacion is not None
        )

    @property
    def native_value(self) -> date | None:
        return self.coordinator.data.estimacion.corte

    async def async_set_value(self, value: date) -> None:
        try:
            await self.coordinator.async_fijar_corte(value)
        except ValueError as exc:
            raise HomeAssistantError(str(exc)) from exc


async def async_setup_entry(
    hass: HomeAssistant, entry: PVPCConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    suministros = getattr(entry.runtime_data, "suministros", {})
    primero = next(iter(suministros), None)
    for subentry_id, coord in suministros.items():
        async_add_entities([FinPeriodo(coord, subentry_id == primero)], config_subentry_id=subentry_id)
