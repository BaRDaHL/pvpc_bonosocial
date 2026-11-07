"""Helper functions to relate sensors keys and unique ids."""

from datetime import datetime
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_API_TOKEN
from homeassistant.helpers.entity_registry import RegistryEntry
from homeassistant.util import dt as dt_util

from .const import (
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    LEGACY_ATTR_POWER,
    LEGACY_ATTR_POWER_P2_P3,
    LEGACY_ATTR_POWER_P3,
    SUBENTRY_SUMINISTRO,
)
from .prices.aiopvpc.const import (
    ALL_SENSORS,
    KEY_ADJUSTMENT,
    KEY_INDEXED,
    KEY_INJECTION,
    KEY_MAG,
    KEY_OMIE,
    KEY_PVPC,
    LEGACY_TARIFFS,
    REFERENCE_TZ,
    TARIFFS,
    normalize_tariff,
)

_KEY_REFERENCE_PVPC = "PVPC_REFERENCE"
_TARIFF_IDS = (*TARIFFS, *LEGACY_TARIFFS)
_ha_uniqueid_to_sensor_key = {
    **{tariff: KEY_PVPC for tariff in _TARIFF_IDS},
    **{f"{tariff}_{KEY_INJECTION}": KEY_INJECTION for tariff in _TARIFF_IDS},
    **{f"{tariff}_INYECTION": KEY_INJECTION for tariff in _TARIFF_IDS},
    **{f"{tariff}_{KEY_MAG}": KEY_MAG for tariff in _TARIFF_IDS},
    **{f"{tariff}_{KEY_OMIE}": KEY_OMIE for tariff in _TARIFF_IDS},
    **{f"{tariff}_{KEY_INDEXED}": KEY_ADJUSTMENT for tariff in _TARIFF_IDS},
    **{f"{tariff}_{_KEY_REFERENCE_PVPC}": KEY_PVPC for tariff in _TARIFF_IDS},
}


def get_enabled_sensor_keys(
    using_private_api: bool,
    entries: list[RegistryEntry],
    enable_private_api: bool,
) -> set[str]:
    """Get enabled API indicators."""
    if not using_private_api:
        return {KEY_PVPC}
    if len(entries) > 1:
        # activate only enabled sensors
        sensor_keys: set[str] = set()
        seen_injection = False
        for sensor in entries:
            if sensor.disabled:
                continue
            sensor_key = _ha_uniqueid_to_sensor_key.get(sensor.unique_id)
            if sensor_key == KEY_INJECTION:
                seen_injection = True
                if not enable_private_api:
                    continue
            if sensor_key == KEY_ADJUSTMENT:
                # Indexed prices require both ADJUSTMENT and PVPC source series.
                sensor_keys.add(KEY_PVPC)
            if sensor_key is not None:
                sensor_keys.add(sensor_key)
        if enable_private_api and not seen_injection:
            sensor_keys.add(KEY_INJECTION)
        return sensor_keys
    # default sensors when enabling token access
    sensor_keys = {KEY_PVPC}
    if enable_private_api:
        sensor_keys.add(KEY_INJECTION)
    return sensor_keys


def primera_subentrada(entry: ConfigEntry, tipo: str) -> str | None:
    """Id de la primera subentrada de ese tipo, en el orden de la entrada (el de creación).

    Su entidad lleva el entity_id sin el nombre del suministro. Se calcula sobre las subentradas y
    no sobre las que han cargado: si la primera falla al arrancar, otra nueva no debe quedarse su
    entity_id (chocarían cuando la primera vuelva a cargar).
    """
    return next((sid for sid, sub in entry.subentries.items() if sub.subentry_type == tipo), None)


def potencia_contratada(entry: ConfigEntry) -> tuple[float, float] | None:
    """(P1, P2) contratadas en kW para los sensores de precio (potencia disponible), o None.

    Se piden una sola vez, al añadir el suministro: manda el primer suministro de la entrada. Si no
    hay ninguno, vale la potencia que guardó un alta anterior a la v1.2.2 o una importación de PVPC
    Next (en `data`; la migración 2.3 la consolida ahí). Sin nada de eso no se inventa: None.
    """
    primera = primera_subentrada(entry, SUBENTRY_SUMINISTRO)
    if primera is not None:
        datos = entry.subentries[primera].data
        if datos.get(CONF_POTENCIA_P1) is not None and datos.get(CONF_POTENCIA_P2) is not None:
            return float(datos[CONF_POTENCIA_P1]), float(datos[CONF_POTENCIA_P2])
    config = config_entrada(entry)
    p1 = config.get(ATTR_POWER_P1, config.get(LEGACY_ATTR_POWER))
    p2 = config.get(ATTR_POWER_P3, config.get(LEGACY_ATTR_POWER_P2_P3, config.get(LEGACY_ATTR_POWER_P3)))
    if p1 is None and p2 is None:
        return None
    return float(p1 if p1 is not None else p2), float(p2 if p2 is not None else p1)


def make_sensor_unique_id(config_entry_id: str | None, sensor_key: str) -> str:
    """Generate unique_id for each sensor kind and config entry."""
    assert sensor_key in ALL_SENSORS or sensor_key in {KEY_INDEXED, _KEY_REFERENCE_PVPC}
    assert config_entry_id is not None
    if sensor_key == KEY_PVPC:
        # for old compatibility
        return config_entry_id
    return f"{config_entry_id}_{sensor_key}"


def config_entrada(entry: ConfigEntry) -> dict[str, Any]:
    """Configuración efectiva de la entrada principal: `data` con las preferencias de `options` encima.

    El token de ESIOS es una credencial y vive solo en `entry.data` (lo escriben el alta, la
    reautenticación, la reconfiguración y el paso del token de las opciones). Si una versión
    anterior lo dejó en `options`, se ignora aquí: la migración 2.2 lo mueve a `data`.
    """
    opciones = {k: v for k, v in entry.options.items() if k != CONF_API_TOKEN}
    return {**entry.data, **opciones}


TERRITORIO_PENINSULA = "peninsula"
TERRITORIO_CANARIAS = "canarias"
TERRITORIO_CEUTA_MELILLA = "ceuta_melilla"


def territorio(tariff: str, zona_horaria: str | None) -> str:
    """Territorio del suministro, para saber si la factura se puede calcular.

    Los precios (sensores de la API) funcionan en todos: usan la zona horaria de HA y la tarifa.
    La factura (facturación, resumen, comparador, CNMC) solo está hecha para la Península y
    Baleares: hora de Madrid, regla de periodos peninsular e IVA. En Canarias rigen la hora
    canaria y el IGIC; en Ceuta y Melilla, sus periodos y el IPSI. Canarias no es una tarifa
    aparte (comparte la PCB): se distingue por la zona horaria de HA.
    """
    if normalize_tariff(tariff) != TARIFFS[0] or zona_horaria == "Africa/Ceuta":
        return TERRITORIO_CEUTA_MELILLA
    if zona_horaria == "Atlantic/Canary":
        return TERRITORIO_CANARIAS
    return TERRITORIO_PENINSULA


ZONA_CANARIAS = "Atlantic/Canary"


def ahora_precios(zona_horaria: str | None) -> datetime:
    """Ahora, en el reloj de los precios: la hora «h» del día de precios es la hora local «h».

    Los precios del PVPC van de 0 a 24 h y en Canarias se aplican a la hora local canaria,
    como hace aiopvpc al leer el archivo público (el día empieza a medianoche local). El
    histórico guarda los días con la hora de Madrid, así que en Canarias la hora local se
    traslada tal cual al reloj de Madrid; en el resto, es la hora de Madrid.
    """
    if zona_horaria != ZONA_CANARIAS:
        return dt_util.now(REFERENCE_TZ)
    local = dt_util.now(dt_util.get_time_zone(ZONA_CANARIAS))
    return local.replace(tzinfo=REFERENCE_TZ, fold=local.fold)
