"""Arrastre del bono social: kWh con descuento no consumidos (RD 897/2017, anexo I.1.b).

«Se añadirá la energía no consumida con derecho a descuento de los periodos de facturación
correspondientes a los doce meses completos anteriores». Modelo (DISENO §4.1):

- Si en un periodo se consume menos que su límite prorrateado, la diferencia (kWh enteros)
  queda como saldo, que caduca a los 12 meses del fin de ese periodo.
- En los periodos siguientes, si se pasa del límite prorrateado, se usa el saldo (primero
  el más antiguo) hasta donde haga falta.
- Si se conoce la factura real (conciliada), manda lo que aplicó la COR: lo usado es
  «kWh bonificados − límite prorrateado».

Con las facturas del titular, este modelo reproduce el caso de abr-jul-2025 (75 kWh
sobrantes usados como 14 + 61). En oct-dic-2025 la COR retrasó y repartió el arrastre de
otra forma: la conciliación corrige el saldo cuando la COR hace algo distinto.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from .calendario import dias_anio, entero
from .factura import tramos_de_periodo
from .tarifas import Tarifas


def prorrata(
    inicio: date,
    fin: date,
    limite_anual: int | None,
    tarifas: Tarifas,
    cambios: Mapping[date, int | None] | None = None,
) -> int:
    """Límite del bono del periodo sin arrastre: Σ tramos round(L · d / N).

    `cambios[d]` es el límite anual desde el día `d` (cambio de bono o de categoría a mitad
    de periodo; None = sin bono).
    """
    cambios = cambios or {}
    total = 0
    for t in tramos_de_periodo(inicio, fin, tarifas, cambios):
        limite = limite_anual
        for desde in sorted(cambios):
            if desde <= t.primer_dia:
                limite = cambios[desde]
        if limite:
            total += entero(Decimal(limite) * t.dias / dias_anio(t.anio))
    return total


@dataclass(frozen=True)
class PeriodoBono:
    inicio: date  # excluido, como en la factura
    fin: date
    prorrata: int  # límite prorrateado del periodo, sin arrastre
    consumo: int  # kWh del periodo
    bonificados: int | None = None  # kWh bonificados reales (factura conciliada) o None


def _caducar(lotes: list[list], referencia: date) -> None:
    """Quita los sobrantes de periodos que terminaron hace más de 12 meses."""
    limite = date(referencia.year - 1, referencia.month, min(referencia.day, 28))
    lotes[:] = [lote for lote in lotes if lote[0] > limite]


def saldo_arrastre(periodos: Sequence[PeriodoBono], inicio: date, saldo_inicial: int = 0) -> int:
    """kWh de arrastre disponibles para el periodo que empieza en `inicio`.

    `saldo_inicial` son los kWh acumulados antes del primer periodo conocido (los indica
    el usuario al instalar).
    """
    primero = min((p.inicio for p in periodos), default=inicio)
    lotes: list[list] = [[primero, saldo_inicial]] if saldo_inicial > 0 else []
    for p in sorted(periodos, key=lambda p: p.fin):
        if p.fin > inicio:
            break
        _caducar(lotes, p.inicio)
        disponible = sum(lote[1] for lote in lotes)
        if p.bonificados is not None:
            usado = max(0, p.bonificados - p.prorrata)
        else:
            usado = max(0, p.consumo - p.prorrata)
        usado = min(usado, disponible)
        for lote in lotes:  # el más antiguo primero
            tomado = min(lote[1], usado)
            lote[1] -= tomado
            usado -= tomado
        lotes = [lote for lote in lotes if lote[1] > 0]
        sobrante = p.prorrata - p.consumo
        if sobrante > 0:
            lotes.append([p.fin, sobrante])
    _caducar(lotes, inicio)
    return sum(lote[1] for lote in lotes)
