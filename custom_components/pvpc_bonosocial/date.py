"""Fecha editable «Fin de periodo» de cada suministro (DISENO §6)."""

from __future__ import annotations

from datetime import date

from homeassistant.components import persistent_notification
from homeassistant.components.date import DateEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN, SUBENTRY_SUMINISTRO
from .facturacion import FacturacionSuministro
from .helpers import primera_subentrada
from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.coordinator import PVPCConfigEntry
from .sensor_suministro import dispositivo, entity_id_suministro

AVISO_FECHA_PASADA = {
    "es": (
        "Fin de periodo en una fecha pasada",
        "Has fijado el {fecha} como fin del periodo en curso de «{nombre}». Como esa fecha ya ha pasado, "
        "el periodo se ha cerrado ese día con una factura calculada y ha empezado uno nuevo.",
    ),
    "en": (
        "Period end on a past date",
        "You set {fecha} as the end of the current period of “{nombre}”. Since that date has already "
        "passed, the period closed on that day with a calculated bill and a new one has started.",
    ),
}


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
        if value < dt_util.now(REFERENCE_TZ).date():  # con la fecha de hoy aún no se cierra
            self._avisar_fecha_pasada(value)

    def _avisar_fecha_pasada(self, fecha: date) -> None:
        """Poner una fecha pasada cierra el periodo, y antes pasaba sin decir nada."""
        idioma = "es" if self.hass.config.language.split("-")[0] in ("es", "ca", "gl", "eu") else "en"
        titulo, texto = AVISO_FECHA_PASADA[idioma]
        sub = self.coordinator.subentrada
        persistent_notification.async_create(
            self.hass,
            texto.format(fecha=f"{fecha:%d/%m/%Y}", nombre=sub.title),
            title=titulo,
            notification_id=f"{DOMAIN}_fin_periodo_{sub.subentry_id}",
        )


async def async_setup_entry(
    hass: HomeAssistant, entry: PVPCConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    suministros = getattr(entry.runtime_data, "suministros", {})
    primero = primera_subentrada(entry, SUBENTRY_SUMINISTRO)
    for subentry_id, coord in suministros.items():
        async_add_entities([FinPeriodo(coord, subentry_id == primero)], config_subentry_id=subentry_id)
