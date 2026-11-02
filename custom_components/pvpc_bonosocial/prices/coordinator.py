"""The PVPC Next integration to collect Spain official electric prices."""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import date, datetime, timedelta
from decimal import Decimal

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_API_TOKEN
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from ..const import (
    ATTR_BETTER_PRICE_TARGET,
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    ATTR_PRICE_MODE,
    ATTR_TARIFF,
    DEFAULT_BETTER_PRICE_TARGET,
    DEFAULT_PRICE_MODE,
    DOMAIN,
    LEGACY_ATTR_POWER,
    LEGACY_ATTR_POWER_P2_P3,
    LEGACY_ATTR_POWER_P3,
    normalize_better_price_target,
    normalize_price_mode,
)
from ..engine import Tarifas
from ..helpers import ZONA_CANARIAS, config_entrada
from .aiopvpc import DEFAULT_POWER_KW, BadApiTokenAuthError, EsiosApiData, PVPCData
from .aiopvpc.const import KEY_PVPC, REFERENCE_TZ, SENSOR_KEY_TO_DATAID, TARIFFS, normalize_tariff
from .aiopvpc.pvpc_tariff import _price_period_key
from .historico import HistoricoPrecios
from .periodos import discrepancias, horas_sin_casar, periodos_del_dia

_LOGGER = logging.getLogger(__name__)

PVPCConfigEntry = ConfigEntry["ElecPricesDataUpdateCoordinator"]

INTERVALO_HISTORICO = timedelta(minutes=30)
ISSUE_PERIODOS = "periodos_discrepantes"
ISSUE_PEAJES = "tabla_peajes_desfasada"
ISSUE_TARIFAS = "tarifas_por_revisar"
DIAS_AVISO_PEAJES = 7  # días publicados más recientes en los que se mira si la tabla casa
MAX_HORAS_EN_AVISO = 6


def zona_de_tarifa(tariff: str) -> str:
    """Zona del archivo 70: PCB (Península, Baleares, Canarias) o CYM (Ceuta y Melilla)."""
    return "PCB" if normalize_tariff(tariff) == TARIFFS[0] else "CYM"


def _en_hora_de_precios(publicado: Callable[[datetime], str | None]) -> Callable[[datetime], str | None]:
    """El periodo publicado a la hora «h» local: en Canarias, la hora «h» del archivo 70 es la
    canaria y el histórico la guarda con la de Madrid (como `helpers.ahora_precios`)."""

    def periodo(local: datetime) -> str | None:
        if getattr(local.tzinfo, "key", None) == ZONA_CANARIAS:
            local = local.replace(tzinfo=REFERENCE_TZ, fold=local.fold)
        return publicado(local)

    return periodo


class ElecPricesDataUpdateCoordinator(  # pylint: disable=too-few-public-methods
    DataUpdateCoordinator[EsiosApiData]
):
    """Class to manage fetching Electricity prices data from API."""

    config_entry: PVPCConfigEntry
    historico: HistoricoPrecios | None = None
    suministros: dict = {}  # noqa: RUF012 (se reasigna por instancia al arrancar)
    datadis: dict = {}  # noqa: RUF012 (se reasigna por instancia al arrancar)
    comparadores: dict = {}  # noqa: RUF012 (se reasigna por instancia al arrancar)

    def __init__(
        self,
        hass: HomeAssistant,
        entry: PVPCConfigEntry,
        sensor_keys: set[str],
        use_private_api: bool,
    ) -> None:
        """Initialize."""
        config = config_entrada(entry)

        power_p1 = config.get(ATTR_POWER_P1, config.get(LEGACY_ATTR_POWER))
        power_p3 = config.get(
            ATTR_POWER_P3,
            config.get(LEGACY_ATTR_POWER_P2_P3, config.get(LEGACY_ATTR_POWER_P3)),
        )
        better_price_target = normalize_better_price_target(
            config.get(ATTR_BETTER_PRICE_TARGET, DEFAULT_BETTER_PRICE_TARGET)
        )
        if power_p1 is None:
            power_p1 = DEFAULT_POWER_KW
        if power_p3 is None:
            power_p3 = DEFAULT_POWER_KW
        configured_price_mode = normalize_price_mode(config.get(ATTR_PRICE_MODE, DEFAULT_PRICE_MODE))
        effective_price_mode = (
            configured_price_mode if configured_price_mode != "indexed" or use_private_api else "pvpc"
        )
        api_token = config.get(CONF_API_TOKEN) if use_private_api else None
        self._configured_price_mode = configured_price_mode
        self._price_mode = effective_price_mode
        if configured_price_mode == "indexed" and not use_private_api:
            _LOGGER.warning("Indexed mode requested but private API is disabled; falling back to PVPC mode")

        self.api = PVPCData(
            session=async_get_clientsession(hass),
            tariff=config[ATTR_TARIFF],
            local_timezone=dt_util.get_time_zone(hass.config.time_zone) or hass.config.time_zone,
            power=power_p1,
            power_valley=power_p3,
            api_token=api_token,
            sensor_keys=tuple(sensor_keys),
        )
        self._better_price_target = better_price_target
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=timedelta(minutes=30),
        )

    @property
    def entry_id(self) -> str:
        """Return entry ID."""
        return self.config_entry.entry_id

    @property
    def better_price_target(self) -> str:
        """Return canonical better-price target label."""
        return self._better_price_target

    @property
    def price_mode(self) -> str:
        """Return effective price mode."""
        return self._price_mode

    @property
    def configured_price_mode(self) -> str:
        """Return configured price mode."""
        return self._configured_price_mode

    async def _async_update_data(self) -> EsiosApiData:
        """Update electricity prices from the ESIOS API."""
        now = dt_util.utcnow()
        try:
            api_data = await self.api.async_update_all(self.data, now)
        except BadApiTokenAuthError as exc:
            raise ConfigEntryAuthFailed from exc
        if not api_data or not api_data.sensors or not any(api_data.availability.values()):
            raise UpdateFailed
        self._log_api_fetch(api_data, now)
        return api_data

    def _log_api_fetch(self, api_data: EsiosApiData, now: datetime) -> None:
        """Log fetched API payload details when debug logging is enabled."""
        if not _LOGGER.isEnabledFor(logging.DEBUG):
            return

        fetched_keys = sorted(key for key, available in api_data.availability.items() if available)
        unavailable_keys = sorted(key for key, available in api_data.availability.items() if not available)
        indicator_ids = {key: SENSOR_KEY_TO_DATAID.get(key, "n/a") for key in fetched_keys}
        _LOGGER.debug(
            "PVPC API fetch source=%s private=%s at=%s fetched_keys=%s unavailable_keys=%s indicator_ids=%s",
            api_data.data_source,
            self.api.using_private_api,
            now.isoformat(),
            fetched_keys,
            unavailable_keys,
            indicator_ids,
        )

        for key in fetched_keys:
            series = api_data.sensors.get(key, {})
            if not series:
                _LOGGER.debug("PVPC API fetch series=%s points=0", key)
                continue
            first_ts = min(series)
            last_ts = max(series)
            min_price = min(series.values())
            max_price = max(series.values())
            data_id = self.api.sensor_attributes.get(key, {}).get("data_id")
            _LOGGER.debug(
                "PVPC API fetch series=%s data_id=%s points=%d first=%s last=%s min=%.5f max=%.5f",
                key,
                data_id,
                len(series),
                first_ts.isoformat(),
                last_ts.isoformat(),
                min_price,
                max_price,
            )

    # --- histórico de precios (PCB y TEU por hora) -----------------------------------

    async def async_iniciar_historico(self) -> None:
        """Carga el histórico guardado y programa su actualización en segundo plano.

        El periodo publicado (TEU) pasa a mandar sobre la regla en los días con precio.
        Un fallo del histórico no impide que funcionen los sensores de precio.
        """
        tarifas = await self.hass.async_add_executor_job(Tarifas.empaquetadas)
        historico = HistoricoPrecios(self.hass, zona_de_tarifa(self.api.tariff), tarifas)
        await historico.async_cargar()
        self.historico = historico
        self.api.published_period = _en_hora_de_precios(historico.periodo_publicado)
        self._vigilar_tarifas()
        entry = self.config_entry
        entry.async_on_unload(
            async_track_time_interval(self.hass, self._async_tick_historico, INTERVALO_HISTORICO)
        )
        entry.async_create_background_task(
            self.hass, self.async_actualizar_historico(), f"{DOMAIN} histórico de precios"
        )

    async def _async_tick_historico(self, _now: datetime) -> None:
        self._vigilar_tarifas()
        await self.async_actualizar_historico()

    def _vigilar_tarifas(self) -> None:
        """Aviso si algún valor regulado de hoy pasó su fecha de revisión (`revisar_desde`): el
        motor lo sigue usando, pero la tabla puede no tener aún los valores del año nuevo."""
        if self.historico is None:
            return
        tarifas = self.historico.tarifas
        por_revisar = tarifas.por_revisar(dt_util.now(REFERENCE_TZ).date())
        if not por_revisar:
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_TARIFAS)
            return
        desde = min(v.revisar_desde for v in por_revisar.values() if v.revisar_desde)
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            ISSUE_TARIFAS,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_TARIFAS,
            translation_placeholders={
                # Los valores son los del año que acaba el día antes de la revisión.
                "anio": str((desde - timedelta(days=1)).year),
                "desde": desde.isoformat(),
                "version": tarifas.version,
                "conceptos": ", ".join(por_revisar),
            },
        )

    async def async_actualizar_historico(self) -> None:
        historico = self.historico
        if historico is None:
            return
        try:
            nuevos = await historico.async_actualizar(async_get_clientsession(self.hass), dt_util.utcnow())
        except Exception:
            _LOGGER.exception("Histórico de precios: error inesperado al actualizar")
            return
        if not nuevos:
            return
        _LOGGER.debug("Histórico de precios: %d días nuevos (%s…)", len(nuevos), nuevos[0])
        self._vigilar_periodos(historico, nuevos)
        # Con precios nuevos, la factura de cada suministro se recalcula.
        for facturacion in self.suministros.values():
            await facturacion.async_request_refresh()
        if self.data is not None and self.data.sensors.get(KEY_PVPC):
            # El periodo de las horas ya publicadas puede cambiar: se recalculan los atributos.
            self.api.process_state_and_attributes(self.data, KEY_PVPC, dt_util.utcnow())
            self.async_update_listeners()

    def _vigilar_periodos(self, historico: HistoricoPrecios, nuevos: list[date]) -> None:
        """Nivel 3 de DISENO §3.3: aviso si la regla y el TEU no coinciden y si el TEU no casa con
        la tabla de peajes (tabla desfasada).

        Se mira todo el histórico guardado, no solo los días nuevos: el relleno trae días viejos
        por tandas y una tanda que cuadra no debe borrar el aviso de otra que no. El de periodos
        se borra cuando ningún día guardado discrepa; el de la tabla, cuando los últimos
        `DIAS_AVISO_PEAJES` días publicados vuelven a casar (lo viejo no dice si la tabla de hoy
        está al día).
        """
        ceuta_melilla = self.api.tariff != TARIFFS[0]

        def _regla(inicio: datetime) -> str:
            return _price_period_key(inicio, ceuta_melilla)

        encontradas: list[tuple[datetime, str, str]] = []
        sin_casar: list[tuple[datetime, Decimal]] = []
        dias = historico.dias()
        recientes, nuevos_ = set(dias[-DIAS_AVISO_PEAJES:]), set(nuevos)
        for dia in dias:
            precios = historico.dia(dia)
            if precios is None:
                continue
            periodos = periodos_del_dia(dia, precios.teu, historico.tarifas)
            inicios = [i.astimezone(REFERENCE_TZ) for i in precios.inicios_utc()]
            del_dia = discrepancias(inicios, periodos, _regla)
            if dia in nuevos_:
                for inicio, regla, teu in del_dia:
                    _LOGGER.warning(
                        "Periodo de %s: la regla da %s y ESIOS aplicó %s; manda ESIOS",
                        inicio.strftime("%Y-%m-%d %H:%M"),
                        regla,
                        teu,
                    )
            encontradas += del_dia
            if dia in recientes:
                sin_casar += horas_sin_casar(dia, inicios, precios.teu, historico.tarifas)
        self._avisar_peajes(historico, sin_casar)
        if not encontradas:
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_PERIODOS)
            return
        horas = ", ".join(
            f"{inicio:%Y-%m-%d %H:%M} ({regla} → {teu})"
            for inicio, regla, teu in encontradas[-MAX_HORAS_EN_AVISO:]
        )
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            ISSUE_PERIODOS,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_PERIODOS,
            translation_placeholders={"total": str(len(encontradas)), "horas": horas},
        )

    def _avisar_peajes(self, historico: HistoricoPrecios, sin_casar: list[tuple[datetime, Decimal]]) -> None:
        """Aviso «tabla de peajes desfasada»: hay horas con TEU que no casan con ningún peaje."""
        if not sin_casar:
            ir.async_delete_issue(self.hass, DOMAIN, ISSUE_PEAJES)
            return
        _LOGGER.warning(
            "%d horas con un TEU que no casa con la tabla de peajes %s (la primera, %s: %s €/MWh): "
            "la tabla está desfasada",
            len(sin_casar),
            historico.tarifas.version,
            sin_casar[0][0].strftime("%Y-%m-%d %H:%M"),
            sin_casar[0][1],
        )
        horas = ", ".join(
            f"{inicio:%Y-%m-%d %H:%M} ({teu} €/MWh)" for inicio, teu in sin_casar[-MAX_HORAS_EN_AVISO:]
        )
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            ISSUE_PEAJES,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_PEAJES,
            translation_placeholders={
                "total": str(len(sin_casar)),
                "version": historico.tarifas.version,
                "horas": horas,
            },
        )
