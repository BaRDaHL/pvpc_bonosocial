"""Días facturados, tramos y redondeos, con las convenciones de la Comercializadora de Referencia."""

from __future__ import annotations

import calendar
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

CENTIMO = Decimal("0.01")
SEIS_DECIMALES = Decimal("0.000001")


def euros(x: Decimal) -> Decimal:
    """Redondeo de una línea de factura: céntimos, mitad hacia arriba."""
    return x.quantize(CENTIMO, ROUND_HALF_UP)


def entero(x: Decimal) -> int:
    return int(x.quantize(Decimal(1), ROUND_HALF_UP))


def dias_anio(anio: int) -> int:
    return 366 if calendar.isleap(anio) else 365


@dataclass(frozen=True)
class Tramo:
    """Días facturados entre dos fechas: `desde` excluido, `hasta` incluido (como en la factura)."""

    desde: date
    hasta: date

    @property
    def dias(self) -> int:
        return (self.hasta - self.desde).days

    @property
    def anio(self) -> int:
        """Año de los días del tramo (un tramo nunca cruza el 1 de enero)."""
        return (self.desde + timedelta(days=1)).year

    @property
    def primer_dia(self) -> date:
        return self.desde + timedelta(days=1)

    def dias_facturados(self) -> Iterator[date]:
        dia = self.primer_dia
        while dia <= self.hasta:
            yield dia
            dia += timedelta(days=1)


def partir(desde: date, hasta: date, cambios: Iterable[date]) -> list[Tramo]:
    """Parte un periodo (desde excluido, hasta incluido) en tramos.

    Corta en cada 1 de enero y en cada día de `cambios` (primer día de una vigencia
    nueva) que caiga dentro del periodo. Cada tramo termina el día anterior al corte.
    """
    if hasta <= desde:
        raise ValueError(f"Periodo vacío: {desde} → {hasta}")
    cortes = {date(a, 1, 1) for a in range(desde.year + 1, hasta.year + 1)}
    cortes |= set(cambios)
    limites = sorted(c - timedelta(days=1) for c in cortes if desde < c - timedelta(days=1) < hasta)
    tramos, inicio = [], desde
    for fin in limites:
        tramos.append(Tramo(inicio, fin))
        inicio = fin
    tramos.append(Tramo(inicio, hasta))
    return tramos


def repartir_entero(total: int, pesos: list[int]) -> list[int]:
    """Reparte un entero en proporción a unos pesos: half-up y el último absorbe el resto."""
    suma = sum(pesos)
    if suma == 0:
        return [0] * len(pesos)
    partes = [entero(Decimal(total) * p / suma) for p in pesos[:-1]]
    return [*partes, total - sum(partes)]
