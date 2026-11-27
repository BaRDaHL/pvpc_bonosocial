"""Fecha editable «Fin de periodo» de cada suministro (DISENO §6)."""

from __future__ import annotations

from datetime import date, timedelta

from homeassistant.components import persistent_notification
from homeassistant.components.date import DateEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN, SUBENTRY_SUMINISTRO
from .facturacion import FacturacionSuministro
from .helpers import primera_subentrada
from .idiomas import error, fecha, idioma
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
    "ca": (
        "Fi del període en una data passada",
        "Has fixat el {fecha} com a fi del període en curs de «{nombre}». Com que aquesta data ja ha passat, "
        "el període s'ha tancat aquell dia amb una factura calculada i n'ha començat un de nou.",
    ),
    "gl": (
        "Fin do período nunha data pasada",
        "Fixaches o {fecha} como fin do período en curso de «{nombre}». Como esa data xa pasou, o período "
        "pechouse ese día cunha factura calculada e comezou un novo.",
    ),
    "eu": (
        "Aldiaren amaiera iraganeko data batean",
        "{fecha} jarri duzu «{nombre}» hornidurako uneko aldiaren amaiera gisa. Data hori igaro denez, aldia "
        "egun horretan itxi da faktura kalkulatu batekin, eta beste bat hasi da.",
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
            inicio = self.coordinator.inicio_periodo
            if inicio is None:
                raise error(self.hass, "sin_periodo_en_curso") from exc
            raise error(
                self.hass,
                "fin_periodo_no_valido",
                inicio=f"{inicio:%d/%m/%Y}",
                fin=f"{inicio + timedelta(days=62):%d/%m/%Y}",
            ) from exc
        if value < dt_util.now(REFERENCE_TZ).date():  # con la fecha de hoy aún no se cierra
            self._avisar_fecha_pasada(value)

    def _avisar_fecha_pasada(self, dia: date) -> None:
        """Poner una fecha pasada cierra el periodo, y antes pasaba sin decir nada."""
        lengua = idioma(self.hass.config.language)
        titulo, texto = AVISO_FECHA_PASADA[lengua]
        sub = self.coordinator.subentrada
        persistent_notification.async_create(
            self.hass,
            texto.format(fecha=fecha(dia, lengua), nombre=sub.title),
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
