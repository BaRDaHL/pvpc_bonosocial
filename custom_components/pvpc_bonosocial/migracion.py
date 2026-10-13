"""Migraciones de la configuración (DISENO §9).

- v0.2 (entrada versión 1 de este dominio) → entrada principal (versión 2) + primer
  suministro. `sensor.pvpc_bono_social_coste_hoy` pasa a `sensor.pvpc_bs_coste_hoy` con
  su historial y el panel de Energía actualizado; se retiran `coste_total` (y sus
  estadísticas), `debug` y el botón.
- Normalización de la configuración y de los unique_id antiguos de PVPC Next (versiones
  1-6 de su dominio), que se aplica al importar una entrada de PVPC Next.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from types import MappingProxyType
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import CONF_API_TOKEN, CONF_NAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import (
    ATTR_BETTER_PRICE_TARGET,
    ATTR_ENABLE_PRIVATE_API,
    ATTR_HOLIDAY_SOURCE,
    ATTR_NEXT_BEST_IN_UPDATE,
    ATTR_NEXT_PERIOD_IN_UPDATE,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ATTR_NEXT_PRICE_IN_UPDATE,
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    ATTR_PRICE_MODE,
    ATTR_SHOW_REFERENCE_PRICE,
    ATTR_TARIFF,
    CONF_ALQUILER,
    CONF_BONO,
    CONF_CATEGORIA,
    CONF_DIAS_EMISION,
    CONF_FIN_ULTIMA_FACTURA,
    CONF_FUENTE,
    CONF_IDS_HEREDADOS,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    CONF_TIPO_FUENTE,
    DEFAULT_ALQUILER,
    DEFAULT_BETTER_PRICE_TARGET,
    DEFAULT_DIAS_EMISION,
    DEFAULT_NAME,
    DEFAULT_PRICE_MODE,
    DEFAULT_SHOW_REFERENCE_PRICE,
    DEFAULT_TARIFF,
    DEFAULT_UPDATE_FREQUENCY,
    DOMAIN,
    ENTRY_MINOR_VERSION,
    ENTRY_VERSION,
    FUENTE_SENSOR,
    LEGACY_ATTR_ENABLE_INJECTION_PRICE,
    LEGACY_ATTR_POWER,
    LEGACY_ATTR_POWER_P2_P3,
    PREFIJO_ENTIDADES,
    SUBENTRY_SUMINISTRO,
)
from .engine import LIMITES_ANUALES_KWH, Bono
from .prices.aiopvpc.const import TARIFF_ALIASES, normalize_tariff
from .renombrado import async_actualizar_panel_energia, avisar_nombres, renombrar

_LOGGER = logging.getLogger(__name__)

# --- v0.2 ---------------------------------------------------------------------------

# unique_id de las entidades de la v0.2
V02_COSTE_HOY = "pvpc_bonosocial_cost_today"
V02_COSTE_TOTAL = "pvpc_bonosocial_cost_total"
V02_CREDITO = "pvpc_bonosocial_credit_kwh"
V02_DEBUG = "pvpc_bonosocial_debug"
V02_BOTON = "pvpc_bonosocial_reset_state"
# Claves de las entidades del suministro que conservan el unique_id de la v0.2
CLAVE_COSTE_HOY = "coste_hoy"
CLAVE_KWH_BONIFICABLES = "kwh_bonificables"


def _bono_v02(descuento_pct: float) -> Bono:
    if descuento_pct <= 0:
        return Bono.NINGUNO
    return Bono.SEVERO if descuento_pct >= 50 else Bono.VULNERABLE


def _categoria_v02(limite_kwh: float) -> str:
    """Categoría cuyo límite anual está más cerca del configurado en la v0.2."""
    return min(LIMITES_ANUALES_KWH, key=lambda c: abs(LIMITES_ANUALES_KWH[c] - limite_kwh))


def datos_desde_v02(config: Mapping[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """(datos de la entrada principal, datos del primer suministro) a partir de la v0.2."""
    potencia = float(config.get("power_kw", 4.6))
    bono = _bono_v02(float(config.get("discount_pct", 0)))
    alquiler_dia = config.get("rent_eur_day")
    alquiler = round(float(alquiler_dia) * 365 / 12, 2) if alquiler_dia else DEFAULT_ALQUILER
    principal = {
        CONF_NAME: DEFAULT_NAME,
        ATTR_TARIFF: DEFAULT_TARIFF,
        ATTR_POWER_P1: potencia,
        ATTR_POWER_P3: potencia,
        ATTR_BETTER_PRICE_TARGET: DEFAULT_BETTER_PRICE_TARGET,
        ATTR_NEXT_PRICE_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
        ATTR_NEXT_BEST_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
        ATTR_NEXT_PERIOD_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
        ATTR_NEXT_POWER_PERIOD_IN_UPDATE: DEFAULT_UPDATE_FREQUENCY,
        ATTR_ENABLE_PRIVATE_API: False,
        ATTR_PRICE_MODE: DEFAULT_PRICE_MODE,
        ATTR_SHOW_REFERENCE_PRICE: DEFAULT_SHOW_REFERENCE_PRICE,
        CONF_API_TOKEN: None,
    }
    suministro = {
        CONF_POTENCIA_P1: potencia,
        CONF_POTENCIA_P2: potencia,
        CONF_BONO: bono.value,
        CONF_CATEGORIA: (
            _categoria_v02(float(config.get("credit_max_kwh", 0))) if bono is not Bono.NINGUNO else None
        ),
        CONF_TIPO_FUENTE: FUENTE_SENSOR,
        CONF_FUENTE: config.get("energy_entity"),
        CONF_FIN_ULTIMA_FACTURA: None,
        CONF_DIAS_EMISION: DEFAULT_DIAS_EMISION,
        CONF_ALQUILER: alquiler,
        CONF_IDS_HEREDADOS: {CLAVE_COSTE_HOY: V02_COSTE_HOY, CLAVE_KWH_BONIFICABLES: V02_CREDITO},
    }
    return principal, suministro


async def async_migrar_v02(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Entrada de la v0.2 → entrada principal + primer suministro. Idempotente."""
    otra = next(
        (
            e
            for e in hass.config_entries.async_entries(DOMAIN)
            if e.entry_id != entry.entry_id and e.version >= ENTRY_VERSION
        ),
        None,
    )
    if otra is not None:
        _LOGGER.error(
            "Ya hay una entrada «%s» de PVPC + Bono Social; elimina la entrada antigua «%s» "
            "y añade el suministro desde la entrada nueva",
            otra.title,
            entry.title,
        )
        return False

    principal, suministro = datos_desde_v02({**entry.data, **entry.options})
    if not any(s.subentry_type == SUBENTRY_SUMINISTRO for s in entry.subentries.values()):
        hass.config_entries.async_add_subentry(
            entry,
            ConfigSubentry(
                data=MappingProxyType(suministro),
                subentry_type=SUBENTRY_SUMINISTRO,
                title="Suministro",
                unique_id=None,
            ),
        )
    subentrada = next(s for s in entry.subentries.values() if s.subentry_type == SUBENTRY_SUMINISTRO)

    registro = er.async_get(hass)
    retiradas = []
    renombres: dict[str, str] = {}
    for entidad in er.async_entries_for_config_entry(registro, entry.entry_id):
        if entidad.unique_id in (V02_COSTE_HOY, V02_CREDITO):
            registro.async_update_entity(entidad.entity_id, config_subentry_id=subentrada.subentry_id)
            clave = CLAVE_COSTE_HOY if entidad.unique_id == V02_COSTE_HOY else CLAVE_KWH_BONIFICABLES
            nuevo = f"sensor.{PREFIJO_ENTIDADES}{clave}"
            if renombrar(hass, entidad.entity_id, nuevo):
                renombres[entidad.entity_id] = nuevo
        elif entidad.unique_id in (V02_COSTE_TOTAL, V02_DEBUG, V02_BOTON):
            retiradas.append(entidad.entity_id)
            registro.async_remove(entidad.entity_id)
    _limpiar_estadisticas(hass, [e for e in retiradas if e.startswith("sensor.")])
    # El panel de Energía usa coste_hoy como coste de la red: se le pone el nombre nuevo.
    await async_actualizar_panel_energia(hass, renombres)
    avisar_nombres(hass, renombres)

    hass.config_entries.async_update_entry(
        entry,
        data=principal,
        options={},
        unique_id=principal[ATTR_TARIFF],
        version=ENTRY_VERSION,
        minor_version=ENTRY_MINOR_VERSION,
    )
    _LOGGER.info("Migrada la configuración de la v0.2 (retiradas: %s)", ", ".join(retiradas) or "ninguna")
    return True


def _limpiar_estadisticas(hass: HomeAssistant, statistic_ids: list[str]) -> None:
    """Borra las estadísticas largas de las entidades retiradas (las de coste_total están corruptas)."""
    if not statistic_ids or "recorder" not in hass.config.components:
        return
    from homeassistant.components.recorder import get_instance

    get_instance(hass).async_clear_statistics(statistic_ids)


# --- PVPC Next ----------------------------------------------------------------------

# Claves de sensor renombradas en versiones antiguas de PVPC Next
CLAVES_ANTIGUAS_PVPC_NEXT = {
    "pvpc_hours_to_next_period": "pvpc_next_period_in",
    "pvpc_next_better_price": "pvpc_next_best_price",
    "pvpc_time_to_better_price": "pvpc_time_to_next_best",
    "pvpc_better_price_level": "pvpc_next_best_price_level",
    "pvpc_power_period": "pvpc_current_power_period",
}


def normalizar_config_pvpc_next(
    data: Mapping[str, Any], options: Mapping[str, Any]
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Configuración de PVPC Next de cualquier versión, con las claves actuales."""
    data, options = dict(data), dict(options)
    for store in (data, options):
        tariff = store.get(ATTR_TARIFF)
        if tariff:
            store[ATTR_TARIFF] = normalize_tariff(tariff)
        if LEGACY_ATTR_POWER in store:
            store.setdefault(ATTR_POWER_P1, store[LEGACY_ATTR_POWER])
            store.pop(LEGACY_ATTR_POWER)
        if LEGACY_ATTR_POWER_P2_P3 in store:
            store.setdefault(ATTR_POWER_P3, store[LEGACY_ATTR_POWER_P2_P3])
            store.pop(LEGACY_ATTR_POWER_P2_P3)
        if LEGACY_ATTR_ENABLE_INJECTION_PRICE in store:
            store.setdefault(ATTR_ENABLE_PRIVATE_API, store[LEGACY_ATTR_ENABLE_INJECTION_PRICE])
            store.pop(LEGACY_ATTR_ENABLE_INJECTION_PRICE)
        # El calendario de festivos es propio: la fuente de PVPC Next ya no se usa.
        store.pop(ATTR_HOLIDAY_SOURCE, None)
    return data, options


def unique_id_actual_pvpc_next(unique_id: str) -> str:
    """unique_id de una entidad de PVPC Next con la tarifa y la clave actuales."""
    nuevo = unique_id
    for antigua, actual in TARIFF_ALIASES.items():
        if nuevo == antigua:
            nuevo = actual
            break
        if nuevo.startswith(f"{antigua}_"):
            nuevo = f"{actual}{nuevo[len(antigua) :]}"
            break
    if nuevo.endswith("_INYECTION"):
        nuevo = nuevo.replace("_INYECTION", "_INJECTION")
    for antigua, actual in CLAVES_ANTIGUAS_PVPC_NEXT.items():
        if nuevo.endswith(f"_{antigua}"):
            nuevo = f"{nuevo[: -len(antigua)]}{actual}"
            break
    return nuevo
