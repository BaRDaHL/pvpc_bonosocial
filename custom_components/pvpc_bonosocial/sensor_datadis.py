"""Sensor de estado de cada cuenta de Datadis (F7)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import slugify

from .const import DOMAIN, PREFIJO_ENTIDADES
from .cuenta_datadis import CuentaDatadis

ESTADOS = ["ok", "sin_datos", "sin_datos_recientes", "esperando", "credenciales", "no_responde"]


class EstadoDatadis(CoordinatorEntity[CuentaDatadis], SensorEntity):
    """Si Datadis da datos, hasta qué día y qué días se han descartado."""

    _attr_has_entity_name = True
    _attr_translation_key = "estado_datadis"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ESTADOS
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, cuenta: CuentaDatadis, primero: bool) -> None:
        super().__init__(cuenta)
        sub = cuenta.subentrada
        self._attr_unique_id = f"{sub.subentry_id}_estado_datadis"
        sufijo = "" if primero else f"_{slugify(sub.title)}"
        self.entity_id = f"sensor.{PREFIJO_ENTIDADES}estado_datadis{sufijo}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, sub.subentry_id)},
            name=sub.title,
            manufacturer="Datadis",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url="https://datadis.es",
        )

    @property
    def native_value(self) -> str | None:
        return (self.coordinator.data or {}).get("estado")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {k: v for k, v in (self.coordinator.data or {}).items() if k != "estado"}


def entidades_de(entry: ConfigEntry, cuentas: dict[str, CuentaDatadis]):
    primero = next(iter(cuentas), None)
    for subentry_id, cuenta in cuentas.items():
        yield subentry_id, [EstadoDatadis(cuenta, subentry_id == primero)]
