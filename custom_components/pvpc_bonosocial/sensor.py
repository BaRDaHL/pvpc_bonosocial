"""Sensor to collect the reference daily prices of electricity ('PVPC') in Spain."""

from __future__ import annotations

import logging
from collections.abc import Callable, Mapping
from dataclasses import dataclass, replace
from datetime import UTC, date, datetime, timedelta
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import (
    CONF_API_TOKEN,
    CURRENCY_EURO,
    UnitOfEnergy,
    UnitOfPower,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.typing import StateType
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_ENABLE_PRIVATE_API,
    ATTR_SHOW_REFERENCE_PRICE,
    CONF_COLOR_VALLE,
    DEFAULT_ENABLE_PRIVATE_API,
    DEFAULT_NAME,
    DEFAULT_SHOW_REFERENCE_PRICE,
    DEFAULT_UPDATE_FREQUENCY,
    DOMAIN,
    LEGACY_ATTR_ENABLE_INJECTION_PRICE,
    PREFIJO_ENTIDADES,
    PRICE_MODES,
    SUBENTRY_RESUMEN,
    SUFIJOS_ENTIDADES,
    UPDATE_FREQUENCY_BY_SENSOR,
    UPDATE_FREQUENCY_OPTIONS,
    normalize_better_price_target,
)
from .helpers import ahora_precios, config_entrada, make_sensor_unique_id
from .notificacion import codigos_de_color, periodos_de
from .prices.aiopvpc.const import (
    KEY_ADJUSTMENT,
    KEY_INDEXED,
    KEY_INJECTION,
    KEY_MAG,
    KEY_OMIE,
    KEY_PVPC,
    SENSOR_KEY_TO_DATAID,
    TARIFFS,
)
from .prices.aiopvpc.pvpc_tariff import (
    get_current_and_next_power_periods,
    get_current_and_next_price_periods,
)
from .prices.aiopvpc.utils import ensure_utc_time
from .prices.coordinator import ElecPricesDataUpdateCoordinator, PVPCConfigEntry
from .sensor_comparador import entidades_de as entidades_comparador
from .sensor_datadis import entidades_de as entidades_datadis
from .sensor_suministro import entidades_de as entidades_suministro

_LOGGER = logging.getLogger(__name__)
PARALLEL_UPDATES = 1
_PRICE_UNIT = f"{CURRENCY_EURO}/{UnitOfEnergy.KILO_WATT_HOUR}"
_PRICE_LEVEL_THRESHOLDS = (
    (0.2, "very_cheap"),
    (0.4, "cheap"),
    (0.6, "neutral"),
    (0.8, "expensive"),
)
_PRICE_LEVEL_TARGET_MAX = {
    "very_cheap": 0.2,
    "cheap": 0.4,
    "neutral": 0.6,
}
_KEY_REFERENCE_PVPC = "PVPC_REFERENCE"


@dataclass(frozen=True, kw_only=True)
class PVPCAttributeSensorDescription(SensorEntityDescription):
    """Describe a PVPC attribute-backed sensor."""

    attribute_key: str | None = None
    value_fn: Callable[[ElecPricesDataUpdateCoordinator], StateType] | None = None
    update_every_minute: bool = False


def entity_id_de(clave: str) -> str:
    """entity_id propio (sensor.pvpc_bs_*). Solo se usa al crear la entidad en el registro."""
    return f"sensor.{PREFIJO_ENTIDADES}{SUFIJOS_ENTIDADES[clave]}"


def _format_time_to_better_price(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> float | None:
    next_target = _next_target_price(coordinator)
    if not next_target:
        return None
    next_ts, _price, _ratio = next_target
    now_utc = ensure_utc_time(dt_util.utcnow())
    delta_seconds = int((next_ts - now_utc).total_seconds())
    return _format_time_delta(coordinator, "pvpc_time_to_next_best", delta_seconds)


def _format_time_to_next_price(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> float | None:
    next_price = _next_price_candidate(coordinator)
    if not next_price:
        return None
    next_ts, _price = next_price
    now_utc = ensure_utc_time(dt_util.utcnow())
    delta_seconds = int((next_ts - now_utc).total_seconds())
    return _format_time_delta(coordinator, "pvpc_next_price_in", delta_seconds)


def _segundos_hasta_periodo(coordinator: ElecPricesDataUpdateCoordinator, calcular) -> int:
    """Segundos hasta el siguiente periodo según `calcular` (de precio o de potencia)."""
    now_local = ensure_utc_time(dt_util.utcnow()).astimezone(_local_timezone(coordinator))
    hour_start = now_local.replace(minute=0, second=0, microsecond=0)
    _current_period, _next_period, delta = calcular(
        hour_start,
        zone_ceuta_melilla=coordinator.api.tariff != TARIFFS[0],
        published=coordinator.api.published_period,
    )
    # En UTC: el día del cambio de hora, la resta en hora de pared se come o suma una hora.
    next_period_start = hour_start.astimezone(UTC) + delta
    return int((next_period_start - now_local).total_seconds())


def _format_time_to_next_period(coordinator: ElecPricesDataUpdateCoordinator) -> float | None:
    segundos = _segundos_hasta_periodo(coordinator, get_current_and_next_price_periods)
    return _format_time_delta(coordinator, "pvpc_next_period_in", segundos)


def _format_time_to_next_power_period(coordinator: ElecPricesDataUpdateCoordinator) -> float | None:
    segundos = _segundos_hasta_periodo(coordinator, get_current_and_next_power_periods)
    return _format_time_delta(coordinator, "pvpc_next_power_period_in", segundos)


def _normalize_update_frequency(value: str | None) -> str:
    if value in UPDATE_FREQUENCY_OPTIONS:
        return value
    return DEFAULT_UPDATE_FREQUENCY


def _get_update_frequency(coordinator: ElecPricesDataUpdateCoordinator, sensor_key: str) -> str:
    option_key = UPDATE_FREQUENCY_BY_SENSOR.get(sensor_key)
    if not option_key:
        return DEFAULT_UPDATE_FREQUENCY
    config = config_entrada(coordinator.config_entry)
    return _normalize_update_frequency(config.get(option_key))


def _format_time_delta(
    coordinator: ElecPricesDataUpdateCoordinator,
    sensor_key: str,
    delta_seconds: int,
) -> float:
    """Cuenta atrás en horas (device_class duration, unidad h): «9 h 34 min» en vez de «09:34».

    Hasta la v1.2.1 era un texto «HH:MM» que se leía como una hora del reloj. Con «cada hora»
    se redondea hacia arriba a horas enteras, como antes. Con «cada minuto» se publica el punto
    medio del minuto ((m + 0,5) / 60): el frontend de HA trunca los minutos de la parte decimal
    tras redondear a la precisión mostrada (2 decimales), y con el valor exacto m/60 un
    «59 min» se quedaba en «58 min».
    """
    delta_seconds = max(delta_seconds, 0)
    hours, remainder = divmod(delta_seconds, 3600)
    if _get_update_frequency(coordinator, sensor_key) != "minute":
        return float(hours + 1 if remainder else hours)
    minutos = hours * 60 + remainder // 60
    return round((minutos + 0.5) / 60, 4)


def _apply_update_frequency(
    description: PVPCAttributeSensorDescription,
    frequency: str,
) -> PVPCAttributeSensorDescription:
    if frequency == "minute":
        return replace(description, update_every_minute=True)
    if frequency == "hourly":  # basta el temporizador de cada hora del coordinador
        return replace(description, update_every_minute=False)
    if frequency == "disabled":
        return replace(description, update_every_minute=False, entity_registry_enabled_default=False)
    return description


def _price_ratio_category(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> str | None:
    attributes = coordinator.api.sensor_attributes.get(KEY_PVPC, {})
    price_ratio = attributes.get("price_ratio")
    if price_ratio is None:
        return None
    return _price_level_from_ratio(price_ratio)


def _local_timezone(coordinator: ElecPricesDataUpdateCoordinator):
    tz = dt_util.get_time_zone(coordinator.hass.config.time_zone)
    return tz or dt_util.UTC


def _rangos_por_dia(current_prices: dict[datetime, float], local_tz) -> dict[date, tuple[float, float]]:
    """(mínimo, máximo) de cada día local."""
    rangos: dict[date, tuple[float, float]] = {}
    for ts, price in current_prices.items():
        dia = ts.astimezone(local_tz).date()
        minimo, maximo = rangos.get(dia, (price, price))
        rangos[dia] = (min(minimo, price), max(maximo, price))
    return rangos


def _ratio_en_rango(price: float, rango: tuple[float, float]) -> float:
    minimo, maximo = rango
    if maximo == minimo:
        return 0.6
    return round((price - minimo) / (maximo - minimo), 2)


def _price_ratio_for_timestamp(
    current_prices: dict[datetime, float],
    ts: datetime,
    price: float,
    local_tz,
) -> float | None:
    rango = _rangos_por_dia(current_prices, local_tz).get(ts.astimezone(local_tz).date())
    return _ratio_en_rango(price, rango) if rango else None


def _next_price_candidate(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> tuple[datetime, float] | None:
    current_prices = coordinator.data.sensors.get(KEY_PVPC, {})
    now_utc = ensure_utc_time(dt_util.utcnow())
    current_hour = now_utc.replace(minute=0, second=0, microsecond=0)
    next_hour = current_hour + timedelta(hours=1)
    if next_hour in current_prices:
        return next_hour, current_prices[next_hour]
    next_ts = min((ts for ts in current_prices if ts > current_hour), default=None)
    if not next_ts:
        return None
    return next_ts, current_prices[next_ts]


def _next_price_value(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> float | None:
    next_price = _next_price_candidate(coordinator)
    if not next_price:
        return None
    _ts, price = next_price
    return price


def _next_target_price(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> tuple[datetime, float, float] | None:
    """La primera hora futura que llega al objetivo o, si no hay ninguna, la más barata."""
    current_prices = coordinator.data.sensors.get(KEY_PVPC, {})
    now_utc = ensure_utc_time(dt_util.utcnow())
    local_tz = _local_timezone(coordinator)
    rangos = _rangos_por_dia(current_prices, local_tz)
    futuras = [
        (ts, price, _ratio_en_rango(price, rangos[ts.astimezone(local_tz).date()]))
        for ts, price in current_prices.items()
        if ts > now_utc
    ]
    if not futuras:
        return None
    max_ratio = _PRICE_LEVEL_TARGET_MAX[normalize_better_price_target(coordinator.better_price_target)]
    en_objetivo = [c for c in futuras if c[2] <= max_ratio]
    if en_objetivo:
        return min(en_objetivo, key=lambda c: c[0])
    return min(futuras, key=lambda c: (c[1], c[0]))


def _better_price_value(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> StateType:
    next_target = _next_target_price(coordinator)
    if not next_target:
        return None
    _ts, price, _ratio = next_target
    return price


def _next_price_level(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> str | None:
    next_price = _next_price_candidate(coordinator)
    if not next_price:
        return None
    ts, price = next_price
    current_prices = coordinator.data.sensors.get(KEY_PVPC, {})
    local_tz = _local_timezone(coordinator)
    price_ratio = _price_ratio_for_timestamp(current_prices, ts, price, local_tz)
    if price_ratio is None:
        return None
    return _price_level_from_ratio(price_ratio)


def _better_price_level(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> str | None:
    next_target = _next_target_price(coordinator)
    if not next_target:
        return None
    _ts, _price, ratio = next_target
    return _price_level_from_ratio(ratio)


def _num_better_prices_ahead(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> int | None:
    current_prices = coordinator.data.sensors.get(KEY_PVPC, {})
    if not current_prices:
        return None
    now_utc = ensure_utc_time(dt_util.utcnow())
    try:
        current_price = current_prices[now_utc.replace(minute=0, second=0, microsecond=0)]
    except KeyError:
        return None
    return sum(1 for ts, price in current_prices.items() if ts > now_utc and price < current_price)


def _avg_price_today(
    coordinator: ElecPricesDataUpdateCoordinator,
) -> StateType:
    current_prices = coordinator.data.sensors.get(KEY_PVPC, {})
    if not current_prices:
        return None
    local_tz = _local_timezone(coordinator)
    today = ensure_utc_time(dt_util.utcnow()).astimezone(local_tz).date()
    prices_today = [price for ts, price in current_prices.items() if ts.astimezone(local_tz).date() == today]
    if not prices_today:
        return None
    return round(sum(prices_today) / len(prices_today), 5)


def _price_level_from_ratio(price_ratio: float) -> str:
    for threshold, label in _PRICE_LEVEL_THRESHOLDS:
        if price_ratio <= threshold:
            return label
    return "very_expensive"


def _data_id_value(sensor_key: str) -> StateType:
    return SENSOR_KEY_TO_DATAID.get(sensor_key)


def _api_source_label(coordinator: ElecPricesDataUpdateCoordinator) -> str:
    return "private" if coordinator.api.using_private_api else "public"


def _price_mode_label(coordinator: ElecPricesDataUpdateCoordinator) -> str:
    return coordinator.price_mode


SENSOR_TYPES: tuple[SensorEntityDescription, ...] = (
    SensorEntityDescription(
        key=KEY_PVPC,
        icon="mdi:currency-eur",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        translation_key="precio",
    ),
    SensorEntityDescription(
        key=KEY_INJECTION,
        icon="mdi:transmission-tower-export",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        translation_key="precio_excedentes",
    ),
    SensorEntityDescription(
        key=KEY_MAG,
        icon="mdi:bank-transfer",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        translation_key="ajuste_gas",
        entity_registry_enabled_default=False,
    ),
    SensorEntityDescription(
        key=KEY_OMIE,
        icon="mdi:shopping",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        translation_key="precio_omie",
        entity_registry_enabled_default=False,
    ),
)

REFERENCE_PRICE_SENSORS: dict[str, SensorEntityDescription] = {
    "pvpc": SensorEntityDescription(
        key=KEY_INDEXED,
        icon="mdi:chart-line",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        translation_key="precio_indexado",
    ),
    "indexed": SensorEntityDescription(
        key=_KEY_REFERENCE_PVPC,
        icon="mdi:currency-eur",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        translation_key="precio_pvpc",
    ),
}
# Sensores «… en»: una duración en horas (HA la enseña como «9 h 34 min»), no una hora del reloj.
# Sin state_class a propósito: una cuenta atrás no es una medida que merezca estadísticas.
_CUENTA_ATRAS: dict[str, Any] = {
    "device_class": SensorDeviceClass.DURATION,
    "native_unit_of_measurement": UnitOfTime.HOURS,
    "suggested_display_precision": 2,
    "icon": "mdi:timer-sand",
}
# pylint: disable=unexpected-keyword-arg
ATTRIBUTE_SENSOR_TYPES: tuple[PVPCAttributeSensorDescription, ...] = (
    PVPCAttributeSensorDescription(
        key="pvpc_data_id",
        translation_key="id_dato_pvpc",
        attribute_key="data_id",
        icon="mdi:identifier",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,  # solo para comprobar el dato en ESIOS
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_api_source",
        translation_key="fuente_api",
        value_fn=_api_source_label,
        device_class=SensorDeviceClass.ENUM,
        options=["private", "public"],
        icon="mdi:api",
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_price_mode",
        translation_key="modo_precio",
        value_fn=_price_mode_label,
        device_class=SensorDeviceClass.ENUM,
        options=list(PRICE_MODES),
        icon="mdi:tune-variant",
        entity_category=EntityCategory.DIAGNOSTIC,
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_tariff",
        translation_key="tarifa",
        attribute_key="tariff",
        icon="mdi:map",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_period",
        translation_key="periodo",
        attribute_key="period",
        icon="mdi:clock-outline",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_current_power_period",
        translation_key="periodo_potencia",
        attribute_key="power_period",
        icon="mdi:flash",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_power_period",
        translation_key="siguiente_periodo_potencia",
        attribute_key="next_power_period",
        icon="mdi:flash",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_power_period_in",
        translation_key="siguiente_periodo_potencia_en",
        value_fn=_format_time_to_next_power_period,
        update_every_minute=True,
        **_CUENTA_ATRAS,
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_available_power",
        translation_key="potencia_disponible",
        attribute_key="available_power",
        native_unit_of_measurement=UnitOfPower.WATT,
        device_class=SensorDeviceClass.POWER,
        state_class=SensorStateClass.MEASUREMENT,
        icon="mdi:flash",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_period",
        translation_key="siguiente_periodo",
        attribute_key="next_period",
        icon="mdi:clock-outline",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_period_in",
        translation_key="siguiente_periodo_en",
        value_fn=_format_time_to_next_period,
        update_every_minute=True,
        **_CUENTA_ATRAS,
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_min_price",
        translation_key="precio_minimo",
        attribute_key="min_price",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        icon="mdi:arrow-down-bold",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_max_price",
        translation_key="precio_maximo",
        attribute_key="max_price",
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        icon="mdi:arrow-up-bold",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_best_price",
        translation_key="siguiente_mejor_precio",
        value_fn=_better_price_value,
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        icon="mdi:arrow-collapse-down",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_price",
        translation_key="siguiente_precio",
        value_fn=_next_price_value,
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        icon="mdi:arrow-right-bold",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_price_in",
        translation_key="siguiente_precio_en",
        value_fn=_format_time_to_next_price,
        update_every_minute=True,
        **_CUENTA_ATRAS,
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_price_level",
        translation_key="nivel_siguiente_precio",
        value_fn=_next_price_level,
        device_class=SensorDeviceClass.ENUM,
        icon="mdi:scale-balance",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_time_to_next_best",
        translation_key="siguiente_mejor_precio_en",
        value_fn=_format_time_to_better_price,
        update_every_minute=True,
        **_CUENTA_ATRAS,
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_num_better_prices_ahead",
        translation_key="precios_mejores",
        value_fn=_num_better_prices_ahead,
        icon="mdi:counter",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_avg_price_today",
        translation_key="precio_medio",
        value_fn=_avg_price_today,
        native_unit_of_measurement=_PRICE_UNIT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=5,
        icon="mdi:chart-line",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_price_ratio_category",
        translation_key="nivel_precio",
        value_fn=_price_ratio_category,
        device_class=SensorDeviceClass.ENUM,
        icon="mdi:scale-balance",
    ),
    PVPCAttributeSensorDescription(
        key="pvpc_next_best_price_level",
        translation_key="nivel_siguiente_mejor_precio",
        value_fn=_better_price_level,
        device_class=SensorDeviceClass.ENUM,
        icon="mdi:scale-balance",
    ),
)

PRIVATE_API_ATTRIBUTE_SENSOR_TYPES: tuple[PVPCAttributeSensorDescription, ...] = (
    PVPCAttributeSensorDescription(
        key="injection_price_data_id",
        translation_key="id_dato_excedentes",
        value_fn=lambda _coordinator: _data_id_value(KEY_INJECTION),
        icon="mdi:identifier",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,  # solo para comprobar el dato en ESIOS
    ),
    PVPCAttributeSensorDescription(
        key="mag_tax_data_id",
        translation_key="id_dato_ajuste_gas",
        value_fn=lambda _coordinator: _data_id_value(KEY_MAG),
        icon="mdi:identifier",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
    ),
    PVPCAttributeSensorDescription(
        key="omie_price_data_id",
        translation_key="id_dato_omie",
        value_fn=lambda _coordinator: _data_id_value(KEY_OMIE),
        icon="mdi:identifier",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
    ),
)
# pylint: enable=unexpected-keyword-arg
_ATRIBUTOS_PRECIO = frozenset(
    {
        "price_position",
        "price_ratio",
        "max_price_at",
        "min_price_at",
        "next_best_at",
        "price_02h_d",  # only on DST day change with 25h
        "price_next_day_02h_d",
        *(f"price_{hora:02d}h" for hora in range(24)),
        *(f"price_next_day_{hora:02d}h" for hora in range(24)),
    }
)


async def async_setup_entry(
    _hass: HomeAssistant,
    entry: PVPCConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the electricity price sensor from config_entry."""
    coordinator = entry.runtime_data
    if entry.unique_id is None:
        _LOGGER.debug(
            "Config entry has no unique_id; falling back to entry_id (entry_id=%s)",
            entry.entry_id,
        )
    entry_unique_id = entry.unique_id or entry.entry_id
    config = config_entrada(entry)
    api_token = config.get(CONF_API_TOKEN)
    enable_private_api = config.get(ATTR_ENABLE_PRIVATE_API)
    if enable_private_api is None:
        enable_private_api = config.get(LEGACY_ATTR_ENABLE_INJECTION_PRICE)
    if enable_private_api is None:
        enable_private_api = bool(api_token) if api_token else DEFAULT_ENABLE_PRIVATE_API
    show_reference_price = config.get(ATTR_SHOW_REFERENCE_PRICE, DEFAULT_SHOW_REFERENCE_PRICE)
    sensors = [ElecPriceSensor(coordinator, SENSOR_TYPES[0], entry_unique_id)]
    unique_id = entry_unique_id
    for sensor_desc in ATTRIBUTE_SENSOR_TYPES:
        update_key = UPDATE_FREQUENCY_BY_SENSOR.get(sensor_desc.key)
        if update_key:
            update_value = _normalize_update_frequency(config.get(update_key))
            sensor_desc = _apply_update_frequency(sensor_desc, update_value)
        sensors.append(PVPCAttributeSensor(coordinator, sensor_desc, unique_id))
    if enable_private_api and coordinator.api.using_private_api:
        sensors.extend(
            PVPCAttributeSensor(coordinator, sensor_desc, unique_id)
            for sensor_desc in PRIVATE_API_ATTRIBUTE_SENSOR_TYPES
        )
    if coordinator.api.using_private_api:
        extra_sensors = []
        if enable_private_api:
            extra_sensors.extend(SENSOR_TYPES[1:])
            if show_reference_price:
                reference_sensor = REFERENCE_PRICE_SENSORS.get(coordinator.price_mode)
                if reference_sensor is not None:
                    extra_sensors.append(reference_sensor)
        sensors.extend(
            ElecPriceSensor(coordinator, sensor_desc, entry_unique_id) for sensor_desc in extra_sensors
        )
    async_add_entities(sensors)

    # Entidades de factura de cada suministro, asociadas a su subentrada.
    for subentry_id, entidades in entidades_suministro(entry, getattr(coordinator, "suministros", {})):
        async_add_entities(entidades, config_subentry_id=subentry_id)
    for subentry_id, entidades in entidades_comparador(entry, getattr(coordinator, "comparadores", {})):
        async_add_entities(entidades, config_subentry_id=subentry_id)
    for subentry_id, entidades in entidades_datadis(entry, getattr(coordinator, "datadis", {})):
        async_add_entities(entidades, config_subentry_id=subentry_id)


def _dispositivo(coordinator: ElecPricesDataUpdateCoordinator) -> DeviceInfo:
    return DeviceInfo(
        configuration_url="https://api.esios.ree.es",
        entry_type=DeviceEntryType.SERVICE,
        identifiers={(DOMAIN, coordinator.entry_id)},
        manufacturer="REE",
        name=DEFAULT_NAME,
    )


class ElecPriceSensor(CoordinatorEntity[ElecPricesDataUpdateCoordinator], SensorEntity):
    """Class to hold the prices of electricity as a sensor."""

    _attr_has_entity_name = True
    _unrecorded_attributes = frozenset({"colores_hoy", "colores_manana", "periodos_hoy", "periodos_manana"})

    def __init__(
        self,
        coordinator: ElecPricesDataUpdateCoordinator,
        description: SensorEntityDescription,
        unique_id: str | None,
    ) -> None:
        """Initialize ESIOS sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_attribution = coordinator.api.attribution
        self._attr_unique_id = make_sensor_unique_id(unique_id, description.key)
        self.entity_id = entity_id_de(description.key)
        self._attr_device_info = _dispositivo(coordinator)

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        sensor_key = self._effective_sensor_key
        # Sin datos si ESIOS no respondió al arrancar y el histórico no tenía los de hoy.
        data = self.coordinator.data
        return data is not None and data.availability.get(sensor_key, False)

    @property
    def _effective_sensor_key(self) -> str:
        """Return key used to read state/attributes for this entity."""
        if self.entity_description.key == _KEY_REFERENCE_PVPC:
            return KEY_PVPC
        if self.entity_description.key == KEY_PVPC and self.coordinator.price_mode == "indexed":
            return KEY_INDEXED
        return self.entity_description.key

    async def async_added_to_hass(self) -> None:
        """Handle entity which will be added."""
        await super().async_added_to_hass()
        sensor_key = self._effective_sensor_key
        if sensor_key == KEY_INDEXED:
            # INDEXED is a composed series (PVPC - ADJUSTMENT); request ADJUSTMENT data.
            self.coordinator.api.update_active_sensors(KEY_ADJUSTMENT, True)
            self.async_on_remove(lambda: self.coordinator.api.update_active_sensors(KEY_ADJUSTMENT, False))
            self.hass.async_create_task(self.coordinator.async_request_refresh())
        else:
            # Enable API downloads for this sensor
            self.coordinator.api.update_active_sensors(sensor_key, True)
            self.async_on_remove(lambda: self.coordinator.api.update_active_sensors(sensor_key, False))

        _LOGGER.debug(
            "Setup of ESIOS sensor %s (%s, unique_id: %s)",
            self.entity_description.key,
            self.entity_id,
            self._attr_unique_id,
        )

    @property
    def native_value(self) -> StateType:
        """Return the state of the sensor."""
        return self.coordinator.api.states.get(self._effective_sensor_key)

    @property
    def extra_state_attributes(self) -> Mapping[str, Any]:
        """Return the state attributes."""
        sensor_key = self._effective_sensor_key
        sensor_attributes = self.coordinator.api.sensor_attributes.get(sensor_key, {})
        attributes = {key: value for key, value in sensor_attributes.items() if key in _ATRIBUTOS_PRECIO}
        if self.entity_description.key == KEY_PVPC:
            attributes["mode"] = self.coordinator.price_mode
            attributes.update(self._colores())
        return attributes

    def _colores(self) -> dict[str, list]:
        """Color y periodo de cada hora de hoy y de mañana para la tarjeta (como el resumen)."""
        historico = self.coordinator.historico
        if historico is None:
            return {}
        regla = next(
            (
                s.data.get(CONF_COLOR_VALLE, "laborables")
                for s in self.coordinator.config_entry.subentries.values()
                if s.subentry_type == SUBENTRY_RESUMEN
            ),
            "laborables",
        )
        hoy = ahora_precios(self.hass.config.time_zone).date()
        out = {}
        for sufijo, dia in (("hoy", hoy), ("manana", hoy + timedelta(days=1))):
            codigos = codigos_de_color(historico, dia, regla)
            if codigos is not None:
                out[f"colores_{sufijo}"] = codigos
                out[f"periodos_{sufijo}"] = periodos_de(historico, dia)
        return out


class PVPCAttributeSensor(CoordinatorEntity[ElecPricesDataUpdateCoordinator], SensorEntity):
    """Expose PVPC attributes as standalone sensors."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: ElecPricesDataUpdateCoordinator,
        description: PVPCAttributeSensorDescription,
        unique_id: str,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_attribution = coordinator.api.attribution
        self._attr_unique_id = f"{unique_id}_{description.key}"
        self.entity_id = entity_id_de(description.key)
        self._attr_device_info = _dispositivo(coordinator)

    @property
    def available(self) -> bool:
        """Return if entity is available."""
        if self.entity_description.entity_category == EntityCategory.DIAGNOSTIC:
            return self.coordinator.last_update_success and self.coordinator.data is not None
        data = self.coordinator.data
        return data is not None and data.availability.get(KEY_PVPC, False)

    async def async_added_to_hass(self) -> None:
        """Handle entity which will be added."""
        await super().async_added_to_hass()
        if self.entity_description.update_every_minute:
            self.async_on_remove(async_track_time_change(self.hass, self._update_on_time_change, second=[0]))
        if self.entity_description.key in UPDATE_FREQUENCY_BY_SENSOR:
            self._update_on_time_change(dt_util.utcnow())

    @callback
    def _update_on_time_change(self, now: datetime) -> None:
        """Las cuentas atrás cambian cada minuto (lo de cada hora lo hace el coordinador)."""
        self.async_write_ha_state()

    @property
    def native_value(self) -> StateType:
        """Return the state of the sensor."""
        if self.entity_description.value_fn is not None:
            return self.entity_description.value_fn(self.coordinator)
        attributes = self.coordinator.api.sensor_attributes.get(KEY_PVPC, {})
        if self.entity_description.key == "pvpc_num_better_prices_ahead":
            return attributes.get(self.entity_description.attribute_key, 0)
        sin_potencia = self.coordinator.potencia_contratada is None
        if self.entity_description.key == "pvpc_available_power" and sin_potencia:
            return None  # sin suministro no se conoce la potencia contratada: no se inventa
        return attributes.get(self.entity_description.attribute_key)
