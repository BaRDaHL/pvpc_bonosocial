"""ESIOS API handler for HomeAssistant. PVPC tariff periods."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime, timedelta

from ..festivos import es_festivo_p3

_PRICE_HOURS_P1_PCB = (10, 11, 12, 13, 18, 19, 20, 21)
_PRICE_HOURS_P2_PCB = (8, 9, 14, 15, 16, 17, 22, 23)
_PRICE_HOURS_P1_CYM = (11, 12, 13, 14, 19, 20, 21, 22)
_PRICE_HOURS_P2_CYM = (8, 9, 10, 15, 16, 17, 18, 23)


def _valle_todo_el_dia(local_ts: datetime) -> bool:
    day = local_ts.date()
    return day.isoweekday() >= 6 or es_festivo_p3(day)


def _price_period_key(local_ts: datetime, zone_ceuta_melilla: bool) -> str:
    """Return price period key (P1/P2/P3) for current hour."""
    if local_ts.hour < 8 or _valle_todo_el_dia(local_ts):
        return "P3"
    p1_hours = _PRICE_HOURS_P1_CYM if zone_ceuta_melilla else _PRICE_HOURS_P1_PCB
    return "P1" if local_ts.hour in p1_hours else "P2"


def _power_period_key(local_ts: datetime, _zone_ceuta_melilla: bool) -> str:
    """Return power period key (P1/P3) for current hour."""
    if local_ts.hour < 8 or _valle_todo_el_dia(local_ts):
        return "P3"
    return "P1"


# Periodo de energía publicado por ESIOS para una hora local (por su TEU), o None si no
# hay dato. Lo aporta el histórico de precios: en los días con precio publicado manda
# sobre la regla (DISENO §3.3, nivel 1).
PublishedPeriodFn = Callable[[datetime], str | None]
PeriodKeyFn = Callable[[datetime, bool], str]


def _with_published(
    key_fn: PeriodKeyFn,
    published: PublishedPeriodFn | None,
    *,
    power: bool = False,
) -> PeriodKeyFn:
    if published is None:
        return key_fn

    def _key(local_ts: datetime, zone_ceuta_melilla: bool) -> str:
        period = published(local_ts)
        if period is None:
            return key_fn(local_ts, zone_ceuta_melilla)
        if power:
            return "P3" if period == "P3" else "P1"
        return period

    return _key


def _walk_until_change(
    key_fn: PeriodKeyFn, local_ts: datetime, zone_ceuta_melilla: bool
) -> tuple[str, str, timedelta]:
    """Advance one hour at a time until the period key changes."""
    current_period = key_fn(local_ts, zone_ceuta_melilla)
    delta = timedelta(hours=1)
    while (next_period := key_fn(local_ts + delta, zone_ceuta_melilla)) == current_period:
        delta += timedelta(hours=1)
    return current_period, next_period, delta


def get_current_and_next_price_periods(
    local_ts: datetime,
    zone_ceuta_melilla: bool,
    published: PublishedPeriodFn | None = None,
) -> tuple[str, str, timedelta]:
    """Get price periods for PVPC 2.0TD."""
    key_fn = _with_published(_price_period_key, published)
    return _walk_until_change(key_fn, local_ts, zone_ceuta_melilla)


def get_current_and_next_power_periods(
    local_ts: datetime,
    zone_ceuta_melilla: bool,
    published: PublishedPeriodFn | None = None,
) -> tuple[str, str, timedelta]:
    """Get power periods for PVPC 2.0TD."""
    key_fn = _with_published(_power_period_key, published, power=True)
    return _walk_until_change(key_fn, local_ts, zone_ceuta_melilla)
