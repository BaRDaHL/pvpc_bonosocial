"""Periodo de energía de cada hora a partir del TEU publicado por ESIOS (DISENO §3.3).

El TEU del archivo 70 es el peaje + cargo de energía que se aplicó a esa hora, en €/MWh
con 2 decimales. Comparándolo con la tabla de peajes vigente en la fecha
(engine/tarifas.json) se sabe si la hora fue P1, P2 o P3 sin depender del calendario de
festivos. Python puro, sin HA.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from datetime import date, datetime
from decimal import Decimal

from ..engine import TarifaAusente, Tarifas

PERIODOS = ("P1", "P2", "P3")
# El TEU viene redondeado a 0,01 €/MWh y la tabla tiene 6 decimales en €/kWh: la
# diferencia legítima es ≤ 0,005 €/MWh. Más de 0,5 €/MWh indica una tabla desfasada.
TOLERANCIA_MWH = Decimal("0.5")


def peajes_mwh(dia: date, tarifas: Tarifas) -> dict[str, Decimal] | None:
    """Peaje + cargo de energía por periodo en €/MWh, o None si la tabla no cubre el día."""
    try:
        return {p: tarifas.valor(f"peaje_energia_{p.lower()}", dia) * 1000 for p in PERIODOS}
    except TarifaAusente:
        return None


def periodo_por_teu(teu_mwh: Decimal, tabla: dict[str, Decimal]) -> str | None:
    """Periodo cuyo peaje está más cerca del TEU, o None si ninguno encaja."""
    periodo = min(PERIODOS, key=lambda p: abs(tabla[p] - teu_mwh))
    if abs(tabla[periodo] - teu_mwh) > TOLERANCIA_MWH:
        return None
    return periodo


def periodos_del_dia(dia: date, teu_mwh: Sequence[Decimal], tarifas: Tarifas) -> list[str | None]:
    """Periodo de cada hora del día (mismo orden que el archivo 70)."""
    tabla = peajes_mwh(dia, tarifas)
    if tabla is None:
        return [None] * len(teu_mwh)
    return [periodo_por_teu(teu, tabla) for teu in teu_mwh]


def discrepancias(
    inicios_locales: Sequence[datetime],
    periodos_teu: Sequence[str | None],
    regla: Callable[[datetime], str],
) -> list[tuple[datetime, str, str]]:
    """Horas en que la regla y el TEU no coinciden: (inicio local, regla, TEU)."""
    out = []
    for inicio, teu in zip(inicios_locales, periodos_teu, strict=True):
        if teu is None:
            continue
        por_regla = regla(inicio)
        if por_regla != teu:
            out.append((inicio, por_regla, teu))
    return out
