"""Flujo de las subentradas «Resumen por notificación» (DISENO §8.3): una por destino.

El destino es cualquier entidad `notify`. Si es un chat de Telegram (`telegram_bot`), el
mensaje se manda con `telegram_bot.send_message` en Markdown y el ID del chat sale de la
configuración del bot: el usuario no lo escribe.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigSubentryFlow, SubentryFlowResult
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TimeSelector,
)

from .const import (
    COLORES_VALLE,
    CONF_COLOR_VALLE,
    CONF_DESTINO,
    CONF_DURACION_FRANJA,
    CONF_FRANJAS_HOY,
    CONF_FRANJAS_MANANA,
    CONF_HOY_ACTIVO,
    CONF_HOY_HORA,
    CONF_INCLUIR_CONSUMO,
    CONF_INCLUIR_FACTURA,
    CONF_MANANA_ACTIVO,
    CONF_MANANA_HORA,
    CONF_MOSTRAR_PERIODO,
    CONF_SUMINISTRO,
    SUBENTRY_SUMINISTRO,
)

POR_DEFECTO: dict[str, Any] = {
    CONF_HOY_ACTIVO: True,
    CONF_HOY_HORA: "07:00:00",
    CONF_MANANA_ACTIVO: True,
    CONF_MANANA_HORA: "21:05:00",
    CONF_FRANJAS_HOY: 4,
    CONF_FRANJAS_MANANA: 3,
    CONF_DURACION_FRANJA: 3,
    CONF_INCLUIR_CONSUMO: True,
    CONF_INCLUIR_FACTURA: False,
    CONF_COLOR_VALLE: "laborables",
    CONF_MOSTRAR_PERIODO: True,
}


def _numero(minimo: int, maximo: int) -> NumberSelector:
    return NumberSelector(NumberSelectorConfig(min=minimo, max=maximo, step=1, mode=NumberSelectorMode.BOX))


class ResumenSubentryFlow(ConfigSubentryFlow):
    """Añadir o cambiar un resumen de precios por notificación."""

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        return await self._formulario("user", user_input, dict(POR_DEFECTO))

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        actual = {**POR_DEFECTO, **self._get_reconfigure_subentry().data}
        return await self._formulario("reconfigure", user_input, actual)

    async def _formulario(
        self, step_id: str, user_input: dict[str, Any] | None, actual: dict[str, Any]
    ) -> SubentryFlowResult:
        suministros = {
            sid: sub.title
            for sid, sub in self._get_entry().subentries.items()
            if sub.subentry_type == SUBENTRY_SUMINISTRO
        }
        if user_input is not None:
            datos = {**POR_DEFECTO, **user_input}
            for clave in (CONF_FRANJAS_HOY, CONF_FRANJAS_MANANA, CONF_DURACION_FRANJA):
                datos[clave] = int(datos[clave])
            if datos.get(CONF_SUMINISTRO) not in suministros:
                datos[CONF_SUMINISTRO] = None
            titulo = self._titulo(datos[CONF_DESTINO])
            if step_id == "reconfigure":
                return self.async_update_and_abort(
                    self._get_entry(), self._get_reconfigure_subentry(), title=titulo, data=datos
                )
            return self.async_create_entry(title=titulo, data=datos)

        campos: dict[Any, Any] = {
            vol.Required(CONF_DESTINO, description={"suggested_value": actual.get(CONF_DESTINO)}): (
                EntitySelector(EntitySelectorConfig(domain="notify"))
            ),
        }
        if suministros:
            campos[
                vol.Optional(
                    CONF_SUMINISTRO,
                    description={"suggested_value": actual.get(CONF_SUMINISTRO) or next(iter(suministros))},
                )
            ] = SelectSelector(
                SelectSelectorConfig(
                    options=[SelectOptionDict(value=k, label=v) for k, v in suministros.items()],
                    mode=SelectSelectorMode.DROPDOWN,
                )
            )
        campos.update(
            {
                vol.Required(CONF_HOY_ACTIVO, default=actual[CONF_HOY_ACTIVO]): BooleanSelector(),
                vol.Required(CONF_HOY_HORA, default=actual[CONF_HOY_HORA]): TimeSelector(),
                vol.Required(CONF_MANANA_ACTIVO, default=actual[CONF_MANANA_ACTIVO]): BooleanSelector(),
                vol.Required(CONF_MANANA_HORA, default=actual[CONF_MANANA_HORA]): TimeSelector(),
                vol.Required(CONF_FRANJAS_HOY, default=actual[CONF_FRANJAS_HOY]): _numero(0, 6),
                vol.Required(CONF_FRANJAS_MANANA, default=actual[CONF_FRANJAS_MANANA]): _numero(0, 6),
                vol.Required(CONF_DURACION_FRANJA, default=actual[CONF_DURACION_FRANJA]): _numero(1, 6),
                vol.Required(CONF_INCLUIR_CONSUMO, default=actual[CONF_INCLUIR_CONSUMO]): BooleanSelector(),
                vol.Required(CONF_INCLUIR_FACTURA, default=actual[CONF_INCLUIR_FACTURA]): BooleanSelector(),
                vol.Required(CONF_MOSTRAR_PERIODO, default=actual[CONF_MOSTRAR_PERIODO]): BooleanSelector(),
                vol.Required(CONF_COLOR_VALLE, default=actual[CONF_COLOR_VALLE]): SelectSelector(
                    SelectSelectorConfig(
                        options=list(COLORES_VALLE),
                        translation_key="color_valle",
                        mode=SelectSelectorMode.DROPDOWN,
                    )
                ),
            }
        )
        return self.async_show_form(step_id=step_id, data_schema=vol.Schema(campos))

    def _titulo(self, destino: str) -> str:
        estado = self.hass.states.get(destino)
        if estado is not None and estado.name:
            return str(estado.name)
        entrada = er.async_get(self.hass).async_get(destino)
        return (entrada and (entrada.name or entrada.original_name)) or destino
