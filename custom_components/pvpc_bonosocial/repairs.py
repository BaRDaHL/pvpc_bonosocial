"""Flujos de reparación (Repairs)."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components.repairs import RepairsFlow
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import issue_registry as ir

from .const import ATTR_TARIFF, DOMAIN
from .estadistica import ISSUE_PANEL, async_usar_en_panel
from .importacion import CONF_COPIA, CONF_IMPORTAR, ISSUE_IMPORTAR, config_importada, resumen


class ImportarPvpcNextFlow(RepairsFlow):
    """Importar PVPC Next con la integración ya cargada (DISENO §9.2, camino Repairs)."""

    def __init__(self, data: dict[str, Any]) -> None:
        self._entry_id: str = data["entry_id"]
        self._origen_id: str = data["origen"]

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        return await self.async_step_confirmar()

    async def async_step_confirmar(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        entry = self.hass.config_entries.async_get_entry(self._entry_id)
        origen = self.hass.config_entries.async_get_entry(self._origen_id)
        if entry is None or origen is None:
            return self.async_abort(reason="ya_no_existe")
        errores: dict[str, str] = {}
        if user_input is not None:
            if not user_input.get(CONF_COPIA):
                errores[CONF_COPIA] = "falta_copia"
            else:
                config = config_importada(origen)
                otra = self.hass.config_entries.async_entry_for_domain_unique_id(DOMAIN, config[ATTR_TARIFF])
                unique_id = config[ATTR_TARIFF] if otra is None or otra is entry else entry.unique_id
                # Al cambiar los datos, el update listener recarga la entrada y el arranque
                # mueve las entidades antes de cargar las plataformas.
                self.hass.config_entries.async_update_entry(
                    entry,
                    data={**entry.data, **config, CONF_IMPORTAR: origen.entry_id},
                    options={},
                    unique_id=unique_id,
                )
                if not entry.update_listeners:  # no cargada: nadie la recargaría
                    self.hass.config_entries.async_schedule_reload(entry.entry_id)
                return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="confirmar",
            data_schema=vol.Schema({vol.Required(CONF_COPIA, default=False): bool}),
            description_placeholders=resumen(self.hass, origen),
            errors=errores,
        )


class UsarEstadisticaCosteFlow(RepairsFlow):
    """Poner la estadística de coste del suministro en el panel de Energía (lo decide el usuario)."""

    def __init__(self, data: dict[str, Any], placeholders: dict[str, str]) -> None:
        self._fuente: str = data["fuente"]
        self._estadistica: str = data["estadistica"]
        self._placeholders = placeholders

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        return await self.async_step_confirmar()

    async def async_step_confirmar(self, user_input: dict[str, Any] | None = None) -> FlowResult:
        if user_input is not None:
            await async_usar_en_panel(self.hass, self._fuente, self._estadistica)
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="confirmar",
            data_schema=vol.Schema({}),
            description_placeholders=self._placeholders,
        )


async def async_create_fix_flow(
    hass: HomeAssistant, issue_id: str, data: dict[str, Any] | None
) -> RepairsFlow:
    if issue_id == ISSUE_IMPORTAR and data:
        return ImportarPvpcNextFlow(data)
    if issue_id.startswith(ISSUE_PANEL) and data:
        issue = ir.async_get(hass).async_get_issue(DOMAIN, issue_id)
        placeholders = dict(issue.translation_placeholders or {}) if issue else {}
        placeholders.setdefault("nueva", data["estadistica"])
        return UsarEstadisticaCosteFlow(data, placeholders)
    raise ValueError(f"Aviso sin reparación: {issue_id}")
