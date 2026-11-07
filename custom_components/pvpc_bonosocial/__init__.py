"""The PVPC Next integration to collect Spain official electric prices."""

import logging
from datetime import datetime, timedelta

from homeassistant.config_entries import ConfigSubentry
from homeassistant.const import CONF_API_TOKEN, Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.typing import ConfigType
from homeassistant.util import dt as dt_util

from .comparador import Comparador
from .const import (
    ATTR_ENABLE_PRIVATE_API,
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
    SUBENTRY_DATADIS,
    SUBENTRY_SUMINISTRO,
    UPDATE_FREQUENCY_BY_SENSOR,
    UPDATE_FREQUENCY_OPTIONS,
    normalize_price_mode,
)
from .cuenta_datadis import CuentaDatadis
from .facturacion import FacturacionSuministro
from .helpers import TERRITORIO_PENINSULA, config_entrada, get_enabled_sensor_keys, territorio
from .importacion import CONF_IMPORTAR, async_importar, async_revisar_pvpc_next
from .limpieza import async_olvidar_entrada, async_reconciliar
from .migracion import async_migrar_v02
from .notificacion import programar as programar_resumenes
from .prices.aiopvpc.const import KEY_ADJUSTMENT
from .prices.coordinator import (
    REINTENTO_SIN_PRECIOS,
    ElecPricesDataUpdateCoordinator,
    PVPCConfigEntry,
    zona_de_tarifa,
)
from .prices.historico import HistoricoPrecios
from .servicios import registrar as registrar_servicios
from .tarjeta import async_quitar as async_quitar_tarjeta
from .tarjeta import async_registrar as async_registrar_tarjeta

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.DATE, Platform.BUTTON]
ISSUE_TERRITORIO = "facturacion_no_soportada"
ISSUE_SUBENTRADA = "subentrada_no_cargada"
NOMBRES_TERRITORIO = {"canarias": "Canarias", "ceuta_melilla": "Ceuta y Melilla"}
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Servicios de la integración (se registran una vez, no por entrada)."""
    registrar_servicios(hass)
    return True


async def _async_tarjeta(hass: HomeAssistant) -> None:
    """Registra la tarjeta en cada alta de entrada: si se borró la integración (lo que quita el
    recurso) y se vuelve a añadir sin reiniciar HA, `async_setup` no se repite (T4)."""
    try:
        await async_registrar_tarjeta(hass)
    except Exception:  # la tarjeta nunca debe impedir que arranquen los sensores
        _LOGGER.exception("No se pudo registrar la tarjeta de PVPC + Bono Social")


async def async_setup_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """Set up pvpc hourly pricing from a config entry."""
    await _async_tarjeta(hass)
    if origen := entry.data.get(CONF_IMPORTAR):
        # Antes de leer la configuración y de cargar las plataformas (DISENO §9.2).
        await async_importar(hass, entry, origen)
        hass.config_entries.async_update_entry(
            entry, data={k: v for k, v in entry.data.items() if k != CONF_IMPORTAR}
        )
    # Stores y avisos de las subentradas borradas (HA no avisa al borrarlas; la entrada se recarga).
    await async_reconciliar(hass, entry)
    entity_registry = er.async_get(hass)
    config = config_entrada(entry)
    api_token = config.get(CONF_API_TOKEN)
    enable_private_api = config.get(ATTR_ENABLE_PRIVATE_API)
    if enable_private_api is None:
        enable_private_api = config.get(LEGACY_ATTR_ENABLE_INJECTION_PRICE)
    if enable_private_api is None:
        enable_private_api = bool(api_token) if api_token else DEFAULT_ENABLE_PRIVATE_API
    use_private_api = bool(api_token) and enable_private_api
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
    await coordinator.async_cargar_historico()
    try:
        await coordinator.async_config_entry_first_refresh()
    except ConfigEntryNotReady as err:
        if not _arrancar_sin_esios(entry, coordinator):
            raise
        _LOGGER.warning(
            "ESIOS no responde al arrancar (%s); se arranca con lo guardado y se reintentará cada %s",
            err.__cause__ or err,
            coordinator.update_interval,
        )
    await coordinator.async_iniciar_historico()
    await _async_preparar_suministros(hass, entry, coordinator)

    await _async_preparar_datadis(hass, entry, coordinator)

    entry.runtime_data = coordinator
    programar_resumenes(hass, entry)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # Recarga al cambiar las opciones o al añadir, modificar o quitar un suministro. Es el
    # único mecanismo de recarga: HA no admite update listeners con OptionsFlowWithReload.
    entry.async_on_unload(entry.add_update_listener(_async_entrada_actualizada))
    entry.async_on_unload(
        async_track_time_change(hass, coordinator.async_al_empezar_hora, minute=0, second=0)
    )
    _apply_update_frequency_disables(entity_registry, entry, config)
    async_revisar_pvpc_next(hass, entry)
    return True


def _arrancar_sin_esios(entry: PVPCConfigEntry, coordinator: ElecPricesDataUpdateCoordinator) -> bool:
    """ESIOS no ha respondido a la primera descarga: ¿se arranca igualmente?

    Sí si hay algo que dar sin él: los precios de hoy guardados en el histórico (el mismo
    archivo 70) o algún suministro o cuenta de Datadis (su factura sale del histórico y del
    consumo, no de la descarga de hoy). Los precios sin dato quedan no disponibles y el
    coordinador reintenta cada `REINTENTO_SIN_PRECIOS` hasta que ESIOS responda. En una
    instalación sin nada guardado ni suministros, ConfigEntryNotReady: el reintento de HA.
    """
    sembrado = coordinator.sembrar_desde_historico()
    con_subentradas = any(
        s.subentry_type in (SUBENTRY_SUMINISTRO, SUBENTRY_DATADIS) for s in entry.subentries.values()
    )
    if not (sembrado or con_subentradas):
        return False
    coordinator.update_interval = REINTENTO_SIN_PRECIOS
    return True


def _avisar_subentrada(hass: HomeAssistant, sub: ConfigSubentry, error: Exception | None) -> None:
    """Aviso en Reparaciones de un suministro o cuenta de Datadis que no se ha podido cargar
    (se borra cuando vuelve a cargar). Los demás y los precios siguen funcionando."""
    issue_id = f"{ISSUE_SUBENTRADA}_{sub.subentry_id}"
    if error is None:
        ir.async_delete_issue(hass, DOMAIN, issue_id)
        return
    ir.async_create_issue(
        hass,
        DOMAIN,
        issue_id,
        is_fixable=False,
        severity=ir.IssueSeverity.ERROR,
        translation_key=ISSUE_SUBENTRADA,
        translation_placeholders={"nombre": sub.title, "error": (str(error) or type(error).__name__)[:200]},
    )


async def _async_preparar_suministros(
    hass: HomeAssistant, entry: PVPCConfigEntry, coordinator: ElecPricesDataUpdateCoordinator
) -> None:
    """Un coordinador de facturación por suministro; un fallo de uno no impide arrancar."""
    coordinator.suministros = {}
    coordinator.comparadores = {}
    if not _facturacion_soportada(hass, entry):
        _borrar_avisos_suministros(hass, entry)
        return
    for subentry_id, sub in entry.subentries.items():
        if sub.subentry_type != SUBENTRY_SUMINISTRO or coordinator.historico is None:
            continue
        try:
            facturacion = FacturacionSuministro(hass, entry, sub, coordinator.historico)
            await facturacion.async_cargar()
            entry.async_on_unload(facturacion.async_guardar_ya)
            await facturacion.async_refresh()
            if facturacion.usa_shelly:
                _programar_shelly(hass, entry, facturacion)
            if facturacion.usa_segunda_opinion:
                _programar_segunda_opinion(hass, entry, facturacion)
        except Exception as err:
            # Un Store dañado o un dato imposible en la subentrada: fuera solo este suministro.
            _LOGGER.exception("No se pudo cargar el suministro %s", sub.title)
            _avisar_subentrada(hass, sub, err)
            continue
        _avisar_subentrada(hass, sub, None)
        coordinator.suministros[subentry_id] = facturacion
        try:
            comparador = Comparador(hass, entry, facturacion)
            await comparador.async_cargar()
            comparador.programar()
        except Exception:
            # Sin comparador la factura sigue: solo faltan la comparativa y su botón.
            _LOGGER.exception("No se pudo cargar el comparador de %s", sub.title)
            continue
        coordinator.comparadores[subentry_id] = comparador


def _borrar_avisos_suministros(hass: HomeAssistant, entry: PVPCConfigEntry) -> None:
    """Sin factura (fuera de la Península) los suministros no se cargan: sus avisos («no se ha
    podido cargar», «periodo incompleto», CNMC, panel…) ya no se pueden resolver ni se borrarían
    solos. El aviso de territorio, que es de la entrada, explica lo que pasa."""
    ids = {sid for sid, sub in entry.subentries.items() if sub.subentry_type == SUBENTRY_SUMINISTRO}
    for dominio, issue_id in list(ir.async_get(hass).issues):
        if dominio == DOMAIN and any(sid in issue_id for sid in ids):
            ir.async_delete_issue(hass, DOMAIN, issue_id)


def _facturacion_soportada(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """La factura solo se calcula en la Península y Baleares (helpers.territorio).

    En Canarias, Ceuta y Melilla los suministros que ya existan no se cargan (sus entidades
    quedan no disponibles) y se avisa en Reparaciones: es mejor no dar factura que darla mal.
    Los precios siguen funcionando.
    """
    issue_id = f"{ISSUE_TERRITORIO}_{entry.entry_id}"
    lugar = territorio(config_entrada(entry)[ATTR_TARIFF], hass.config.time_zone)
    con_suministros = any(s.subentry_type == SUBENTRY_SUMINISTRO for s in entry.subentries.values())
    if lugar == TERRITORIO_PENINSULA or not con_suministros:
        ir.async_delete_issue(hass, DOMAIN, issue_id)
        return lugar == TERRITORIO_PENINSULA
    _LOGGER.warning("La factura no se calcula fuera de la Península y Baleares (%s)", lugar)
    ir.async_create_issue(
        hass,
        DOMAIN,
        issue_id,
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key=ISSUE_TERRITORIO,
        translation_placeholders={"territorio": NOMBRES_TERRITORIO[lugar]},
    )
    return False


async def _async_preparar_datadis(
    hass: HomeAssistant, entry: PVPCConfigEntry, coordinator: ElecPricesDataUpdateCoordinator
) -> None:
    """Una cuenta de Datadis por subentrada. La primera consulta va en segundo plano: Datadis
    puede tardar minutos y nunca debe retrasar el arranque."""
    coordinator.datadis = {}
    for subentry_id, sub in entry.subentries.items():
        if sub.subentry_type != SUBENTRY_DATADIS:
            continue
        try:
            cuenta = CuentaDatadis(hass, entry, sub)
            await cuenta.async_cargar()
            entry.async_on_unload(cuenta.async_guardar_ya)
            cuenta.async_set_updated_data(cuenta.resumen())
        except Exception as err:
            _LOGGER.exception("No se pudo cargar la cuenta de Datadis %s", sub.title)
            _avisar_subentrada(hass, sub, err)
            continue
        _avisar_subentrada(hass, sub, None)
        coordinator.datadis[subentry_id] = cuenta
        entry.async_create_background_task(hass, cuenta.async_refresh(), f"{DOMAIN} Datadis {sub.title}")


def _programar_segunda_opinion(
    hass: HomeAssistant, entry: PVPCConfigEntry, facturacion: FacturacionSuministro
) -> None:
    """Comprobación de la última factura real con la CNMC: al subirla (desde la conciliación), al
    arrancar si falta y cada día a las 04:10 si la CNMC no respondió."""

    async def _pedir(_ahora: datetime | None = None) -> None:
        await facturacion.async_comprobar_factura()

    entry.async_on_unload(async_track_time_change(hass, _pedir, hour=4, minute=10, second=0))
    entry.async_create_background_task(hass, _pedir(), f"{DOMAIN} segunda opinión de la CNMC")


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
    for entity_entry in er.async_entries_for_config_entry(entity_registry, entry.entry_id):
        unique_id = entity_entry.unique_id
        for sensor_key, option_key in UPDATE_FREQUENCY_BY_SENSOR.items():
            if unique_id.endswith(f"_{sensor_key}"):
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


async def async_unload_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> None:
    """Borra el histórico de precios y los datos de los suministros al eliminar la integración."""
    await HistoricoPrecios(hass, zona_de_tarifa(entry.data[ATTR_TARIFF]), None).async_borrar()
    if not [e for e in hass.config_entries.async_entries(DOMAIN) if e.entry_id != entry.entry_id]:
        try:
            await async_quitar_tarjeta(hass)
        except Exception:
            _LOGGER.exception("No se pudo quitar el recurso de la tarjeta")
    await async_olvidar_entrada(hass, entry)


async def async_migrate_entry(hass: HomeAssistant, entry: PVPCConfigEntry) -> bool:
    """Migra la configuración guardada a la versión actual."""
    if entry.version > ENTRY_VERSION:
        return False  # vuelta atrás desde una versión más nueva
    if entry.version == 1:
        return await async_migrar_v02(hass, entry)
    if entry.version == ENTRY_VERSION and entry.minor_version < 2:
        _migrar_token_a_data(hass, entry)
    if entry.version == ENTRY_VERSION and entry.minor_version < 3:
        _migrar_potencia_a_data(hass, entry)
    return True


def _migrar_token_a_data(hass: HomeAssistant, entry: PVPCConfigEntry) -> None:
    """2.1 → 2.2: el token de ESIOS pasa de `options` a `data`, su único sitio desde la 2.2.

    Hasta la 2.1 las opciones guardaban una copia del token que tapaba la de `data`, y la
    reautenticación solo actualizaba `data`: la entrada seguía usando el token rechazado. Se
    conserva el token que de verdad se estaba usando (el de `options`, si existía). Un `None`
    en `options` solo significaba «API privada desactivada», y eso ya lo dice
    ATTR_ENABLE_PRIVATE_API, así que en ese caso se mantiene el de `data`.
    """
    data = dict(entry.data)
    options = dict(entry.options)
    if CONF_API_TOKEN in options:
        token = options.pop(CONF_API_TOKEN)
        if token:
            data[CONF_API_TOKEN] = token
    hass.config_entries.async_update_entry(entry, data=data, options=options, minor_version=2)


def _migrar_potencia_a_data(hass: HomeAssistant, entry: PVPCConfigEntry) -> None:
    """2.2 → 2.3: la potencia de la entrada deja de pedirse; la que valía pasa a `data`.

    Hasta la v1.2.1 la potencia se pedía dos veces: en el alta (y en «Configurar», que la guardaba
    en `options` tapando la de `data`) y al añadir el suministro. Desde la v1.2.2 solo se pide en
    el suministro, y «Configurar» ya no escribe `power_p1`/`power_p3`: si se dejaran en `options`,
    al guardar las opciones sin ellas la entrada volvería a la potencia del alta. Se conserva la
    que de verdad se usaba (la de `options`, si existía) en `data`, como reserva para una entrada
    sin suministro; con suministro manda la del suministro (helpers.potencia_contratada).
    """
    data = dict(entry.data)
    options = dict(entry.options)
    for clave in (ATTR_POWER_P1, ATTR_POWER_P3):
        if clave in options:
            valor = options.pop(clave)
            if valor is not None:
                data[clave] = valor
    hass.config_entries.async_update_entry(entry, data=data, options=options, minor_version=3)
