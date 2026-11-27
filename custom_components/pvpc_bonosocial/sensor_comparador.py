"""Sensor «Mejor alternativa de tarifa» de cada suministro (DISENO §8 bis, F8).

Estado: ahorro anual estimado (primer año) de la mejor oferta de mercado libre frente a lo
pagado en los últimos 12 meses; negativo si todas salen más caras. Atributos: la comparativa
guardada (lo pagado, sin bono, las mejores ofertas —la tarjeta enseña 4 y Telegram 3— y los avisos)
y el histórico mensual de comparativas (`historico`, sin grabar en el recorder).
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .comparador import Comparador, senal
from .const import CONF_COMPARADOR_DESTINO, SUBENTRY_SUMINISTRO
from .helpers import primera_subentrada
from .historico_comparativas import para_atributo
from .sensor_suministro import EUR, dispositivo, entity_id_suministro

CLAVE = "mejor_alternativa"


class MejorAlternativa(SensorEntity):
    _attr_has_entity_name = True
    _attr_translation_key = CLAVE
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_native_unit_of_measurement = EUR
    _attr_suggested_display_precision = 2
    _attr_should_poll = False
    # La lista de ofertas es lo que más pesa y la tarjeta la lee del estado; el último intento
    # cambia en cada reintento. Ninguno de los dos sirve en el historial; el histórico mensual de
    # comparativas ya se guarda en el Store del comparador.
    _unrecorded_attributes = frozenset({"ofertas", "ultimo_intento", "historico"})

    def __init__(self, comparador: Comparador, primero: bool) -> None:
        sub = comparador.facturacion.subentrada
        self.comparador = comparador
        self._attr_unique_id = f"{sub.subentry_id}_{CLAVE}"
        self.entity_id = entity_id_suministro(sub, primero, CLAVE)
        self._attr_device_info = dispositivo(sub)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(
            async_dispatcher_connect(self.hass, senal(self.comparador.subentry_id), self._actualizar)
        )

    @callback
    def _actualizar(self) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self) -> float | None:
        r = self.comparador.resultado
        if not r or not r["ofertas"]:
            return None
        return r["ofertas"][0]["ahorro_anual"]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        r = self.comparador.resultado or {}
        return {
            **r,
            "estado": self.comparador.estado,
            "ultimo_intento": self.comparador.ultimo_intento,
            # Para la tarjeta: el botón «Enviar» solo sale si hay a dónde enviarla.
            "destino": self.comparador.facturacion.datos.get(CONF_COMPARADOR_DESTINO),
            # Para la tarjeta (botón «Histórico»): un mes por fila, el más reciente primero.
            "historico": para_atributo(self.comparador.historico),
        }


def entidades_de(entry: ConfigEntry, comparadores: dict[str, Comparador]):
    primero = primera_subentrada(entry, SUBENTRY_SUMINISTRO)
    for subentry_id, comp in comparadores.items():
        yield subentry_id, [MejorAlternativa(comp, subentry_id == primero)]
