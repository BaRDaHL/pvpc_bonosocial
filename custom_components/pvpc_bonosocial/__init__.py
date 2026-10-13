"""The PVPC Next integration to collect Spain official electric prices."""

import logging
from datetime import datetime, timedelta

from homeassistant.const import CONF_API_TOKEN, CONF_NAME, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType
from homeassistant.util import dt as dt_util

from .comparador import Comparador
from .const import (
    ATTR_BETTER_PRICE_TARGET,
    ATTR_ENABLE_PRIVATE_API,
    ATTR_NEXT_BEST_IN_UPDATE,
    ATTR_NEXT_PERIOD_IN_UPDATE,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ATTR_NEXT_PRICE_IN_UPDATE,
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    ATTR_PRICE_MODE,
    ATTR_SHOW_REFERENCE_PRICE,
    ATTR_TARIFF,
    CONF_SHELLY_FRECUENCIA,
    DEFAULT_ENABLE_PRIVATE_API,
    DEFAULT_PRICE_MODE,
    DEFAULT_SHOW_REFERENCE_PRICE,
    DEFAULT_UPDATE_FREQUENCY,
    DOMAIN,
    ENTRY_VERSION,
    LEGACY_ATTR_ENABLE_INJECTION_PRICE,
    LEGACY_ATTR_POWER,
    LEGACY_ATTR_POWER_P2_P3,
    LEGACY_ATTR_POWER_P3,
    SUBENTRY_DATADIS,
    SUBENTRY_SUMINISTRO,
    UPDATE_FREQUENCY_BY_SENSOR,
    UPDATE_FREQUENCY_OPTIONS,
    normalize_price_mode,
)
from .cuenta_datadis import CuentaDatadis
from .facturacion import FacturacionSuministro
from .helpers import get_enabled_sensor_keys
from .importacion import CONF_IMPORTAR, async_importar, async_revisar_pvpc_next
from .migracion import async_migrar_v02
from .notificacion import programar as programar_resumenes
from .prices.aiopvpc.const import KEY_ADJUSTMENT
from .prices.coordinator import ElecPricesDataUpdateCoordinator, PVPCConfigEntry, zona_de_tarifa
from .prices.historico import HistoricoPrecios
from .servicios import registrar as registrar_servicios
from .tarjeta import async_registrar as async_registrar_tarjeta

_LOGGER = logging.getLogger(__name__)
_DEPENDENCY_LOGGERS: tuple[str, ...] = ("custom_components.pvpc_bonosocial.prices.aiopvpc",)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.DATE, Platform.BUTTON]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Servicios y tarjeta de la integración (se registran una vez, no por entrada)."""
    registrar_servicios(hass)
    try:
        await async_registrar_tarjeta(hass)
    except Exception:  # la tarjeta nunca debe impedir que arranquen los sensores
        _LOGGER.exception("No se pudo registrar la tarjeta de PVPC + Bono Social")
    return True


def _sync_dependency_log_levels() -> None:
    """Align dependency logger levels with integration logger level."""
    integration_level = _LOGGER.getEffectiveLevel()
    for logger_name in _DEPENDENCY_LOGGERS:
        dependency_logger = logging.getLogger(logger_name)
        if dependency_logger.level == logging.NOTSET or dependency_logger.level > integration_level:
            dependency_logger.setLevel(integration_level)


async def async_setup_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """Set up pvpc hourly pricing from a config entry."""
    _sync_dependency_log_levels()
    if origen := entry.data.get(CONF_IMPORTAR):
        # Antes de leer la configuración y de cargar las plataformas (DISENO §9.2).
        await async_importar(hass, entry, origen)
        hass.config_entries.async_update_entry(
            entry, data={k: v for k, v in entry.data.items() if k != CONF_IMPORTAR}
        )
    entity_registry = er.async_get(hass)
    config = {**entry.data, **entry.options}
    api_token = config.get(CONF_API_TOKEN)
    enable_private_api = config.get(ATTR_ENABLE_PRIVATE_API)
    if enable_private_api is None:
        enable_private_api = config.get(LEGACY_ATTR_ENABLE_INJECTION_PRICE)
    if enable_private_api is None:
        enable_private_api = bool(api_token) if api_token else DEFAULT_ENABLE_PRIVATE_API
    use_private_api = bool(api_token) and enable_private_api
    power_p1 = config.get(ATTR_POWER_P1, config.get(LEGACY_ATTR_POWER))
    power_p3 = config.get(
        ATTR_POWER_P3,
        config.get(LEGACY_ATTR_POWER_P2_P3, config.get(LEGACY_ATTR_POWER_P3)),
    )
    better_price_target = config.get(ATTR_BETTER_PRICE_TARGET)
    next_price_in_update = config.get(ATTR_NEXT_PRICE_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY)
    next_best_in_update = config.get(ATTR_NEXT_BEST_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY)
    next_period_in_update = config.get(ATTR_NEXT_PERIOD_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY)
    next_power_period_in_update = config.get(ATTR_NEXT_POWER_PERIOD_IN_UPDATE, DEFAULT_UPDATE_FREQUENCY)
    if next_price_in_update not in UPDATE_FREQUENCY_OPTIONS:
        next_price_in_update = DEFAULT_UPDATE_FREQUENCY
    if next_best_in_update not in UPDATE_FREQUENCY_OPTIONS:
        next_best_in_update = DEFAULT_UPDATE_FREQUENCY
    if next_period_in_update not in UPDATE_FREQUENCY_OPTIONS:
        next_period_in_update = DEFAULT_UPDATE_FREQUENCY
    if next_power_period_in_update not in UPDATE_FREQUENCY_OPTIONS:
        next_power_period_in_update = DEFAULT_UPDATE_FREQUENCY
    sensor_keys = get_enabled_sensor_keys(
        using_private_api=use_private_api,
        entries=er.async_entries_for_config_entry(entity_registry, entry.entry_id),
        enable_private_api=enable_private_api,
    )
    price_mode = normalize_price_mode(config.get(ATTR_PRICE_MODE, DEFAULT_PRICE_MODE))
    show_reference_price = config.get(ATTR_SHOW_REFERENCE_PRICE, DEFAULT_SHOW_REFERENCE_PRICE)
    if use_private_api and (price_mode == "indexed" or (price_mode == "pvpc" and show_reference_price)):
        sensor_keys.add(KEY_ADJUSTMENT)
    coordinator = ElecPricesDataUpdateCoordinator(hass, entry, sensor_keys, use_private_api)
    _LOGGER.debug(
        "PVPC Next config entry_id=%s unique_id=%s name=%s tariff=%s timezone=%s "
        "power_p1=%s power_p3=%s better_price_target=%s "
        "price_mode=%s show_reference_price=%s "
        "enable_private_api=%s next_price_in_update=%s next_best_in_update=%s "
        "next_period_in_update=%s next_power_period_in_update=%s "
        "coordinator_update_interval=%s "
        "use_private_api=%s api_token_set=%s sensor_keys=%s entry_version=%s",
        entry.entry_id,
        entry.unique_id,
        config.get(CONF_NAME),
        config.get(ATTR_TARIFF),
        hass.config.time_zone,
        power_p1,
        power_p3,
        better_price_target,
        price_mode,
        show_reference_price,
        enable_private_api,
        next_price_in_update,
        next_best_in_update,
        next_period_in_update,
        next_power_period_in_update,
        coordinator.update_interval,
        use_private_api,
        bool(api_token),
        sorted(sensor_keys),
        entry.version,
    )
    await coordinator.async_config_entry_first_refresh()
    await coordinator.async_iniciar_historico()
    await _async_preparar_suministros(hass, entry, coordinator)

    await _async_preparar_datadis(hass, entry, coordinator)

    entry.runtime_data = coordinator
    programar_resumenes(hass, entry)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # Recarga al cambiar las opciones o al añadir, modificar o quitar un suministro. Es el
    # único mecanismo de recarga: HA no admite update listeners con OptionsFlowWithReload.
    entry.async_on_unload(entry.add_update_listener(_async_entrada_actualizada))
    _apply_update_frequency_disables(entity_registry, entry, config)
    async_revisar_pvpc_next(hass, entry)
    return True


async def _async_preparar_suministros(
    hass: HomeAssistant, entry: PVPCConfigEntry, coordinator: ElecPricesDataUpdateCoordinator
) -> None:
    """Un coordinador de facturación por suministro; un fallo de uno no impide arrancar."""
    coordinator.suministros = {}
    coordinator.comparadores = {}
    for subentry_id, sub in entry.subentries.items():
        if sub.subentry_type != SUBENTRY_SUMINISTRO or coordinator.historico is None:
            continue
        facturacion = FacturacionSuministro(hass, entry, sub, coordinator.historico)
        await facturacion.async_cargar()
        await facturacion.async_refresh()
        coordinator.suministros[subentry_id] = facturacion
        comparador = Comparador(hass, entry, facturacion)
        await comparador.async_cargar()
        comparador.programar()
        coordinator.comparadores[subentry_id] = comparador
        if facturacion.usa_shelly:
            _programar_shelly(hass, entry, facturacion)


async def _async_preparar_datadis(
    hass: HomeAssistant, entry: PVPCConfigEntry, coordinator: ElecPricesDataUpdateCoordinator
) -> None:
    """Una cuenta de Datadis por subentrada. La primera consulta va en segundo plano: Datadis
    puede tardar minutos y nunca debe retrasar el arranque."""
    coordinator.datadis = {}
    for subentry_id, sub in entry.subentries.items():
        if sub.subentry_type != SUBENTRY_DATADIS:
            continue
        cuenta = CuentaDatadis(hass, entry, sub)
        await cuenta.async_cargar()
        cuenta.async_set_updated_data(cuenta.resumen())
        coordinator.datadis[subentry_id] = cuenta
        entry.async_create_background_task(hass, cuenta.async_refresh(), f"{DOMAIN} Datadis {sub.title}")


def _programar_shelly(
    hass: HomeAssistant, entry: PVPCConfigEntry, facturacion: FacturacionSuministro
) -> None:
    """Comprobación con el Shelly a las 03:30 (diaria o los lunes) y al arrancar si toca."""

    async def _comprobar(ahora: datetime) -> None:
        if facturacion.datos.get(CONF_SHELLY_FRECUENCIA) == "semanal" and ahora.weekday() != 0:
            return
        await facturacion.async_comprobar_shelly()

    entry.async_on_unload(async_track_time_change(hass, _comprobar, hour=3, minute=30, second=0))
    ultima = facturacion.estado_shelly["ultima"]
    dias = 7 if facturacion.datos.get(CONF_SHELLY_FRECUENCIA) == "semanal" else 1
    if not ultima or dt_util.utcnow() - datetime.fromisoformat(ultima) > timedelta(days=dias):
        entry.async_create_background_task(
            hass, facturacion.async_comprobar_shelly(), f"{DOMAIN} comprobación Shelly"
        )


async def _async_entrada_actualizada(hass: HomeAssistant, entry: PVPCConfigEntry) -> None:
    hass.config_entries.async_schedule_reload(entry.entry_id)


def _apply_update_frequency_disables(
    entity_registry: er.EntityRegistry,
    entry: PVPCConfigEntry,
    config: dict,
) -> None:
    """Disable/enable minute-update sensors based on options."""
    entity_entries = er.async_entries_for_config_entry(entity_registry, entry.entry_id)
    if not entity_entries:
        return
    for entity_entry in entity_entries:
        unique_id = entity_entry.unique_id
        if not unique_id:
            continue
        matched = False
        for sensor_key, option_key in UPDATE_FREQUENCY_BY_SENSOR.items():
            if unique_id.endswith(f"_{sensor_key}"):
                matched = True
                frequency = config.get(option_key, DEFAULT_UPDATE_FREQUENCY)
                if frequency not in UPDATE_FREQUENCY_OPTIONS:
                    frequency = DEFAULT_UPDATE_FREQUENCY
                if frequency == "disabled":
                    if entity_entry.disabled_by != er.RegistryEntryDisabler.INTEGRATION:
                        entity_registry.async_update_entity(
                            entity_entry.entity_id,
                            disabled_by=er.RegistryEntryDisabler.INTEGRATION,
                        )
                elif entity_entry.disabled_by == er.RegistryEntryDisabler.INTEGRATION:
                    entity_registry.async_update_entity(
                        entity_entry.entity_id,
                        disabled_by=None,
                    )
                break
        if not matched:
            continue


async def async_unload_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> None:
    """Borra el histórico de precios y los datos de los suministros al eliminar la integración."""
    await HistoricoPrecios(hass, zona_de_tarifa(entry.data[ATTR_TARIFF]), None).async_borrar()
    for subentry_id in entry.subentries:
        await Store(hass, 1, f"{DOMAIN}.suministro_{subentry_id}").async_remove()
        await Store(hass, 1, f"{DOMAIN}.datadis_{subentry_id}").async_remove()
        await Store(hass, 1, f"{DOMAIN}.comparador_{subentry_id}").async_remove()


async def async_migrate_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """Migra la configuración guardada a la versión actual."""
    if entry.version > ENTRY_VERSION:
        return False  # vuelta atrás desde una versión más nueva
    if entry.version == 1:
        return await async_migrar_v02(hass, entry)
    return True
