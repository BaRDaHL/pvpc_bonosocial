"""Calibración del medidor con las facturas conciliadas (F4).

Con las facturas del titular (10 periodos) el modelo que mejor encaja es
«contador = α · medidor + γ por hora» (α ≈ 0,96, γ ≈ 50 W): 0,47 € de error medio por
factura frente a 1,09 € del factor de la factura anterior (DISENO, estado de la F3).

- Con 3 o más periodos conciliados: mínimos cuadrados sobre los últimos 12.
- Con 1 o 2: solo el factor (α = real / medido, γ = 0).
- Se descartan las facturas con un cociente real/medido un 25 % distinto de la mediana.
- Si el ajuste sale absurdo (α fuera de 0,8-1,2 o γ fuera de ±300 W), se usa el factor.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal

from .vivo import Ajuste

MAX_PERIODOS = 12
MIN_PARA_AJUSTE = 3
ALFA_VALIDO = (Decimal("0.8"), Decimal("1.2"))
GAMMA_VALIDO_KWH_HORA = Decimal("0.3")
MAX_DESVIO = Decimal("0.25")  # una factura con un cociente un 25 % distinto de la mediana se descarta


@dataclass(frozen=True)
class PeriodoCalibracion:
    kwh_real: Decimal  # factura (contador de la distribuidora)
    kwh_medido: Decimal  # medidor del usuario en las mismas horas
    horas: int


def _factor(periodos: Sequence[PeriodoCalibracion]) -> Ajuste | None:
    medido = sum((p.kwh_medido for p in periodos), Decimal(0))
    if not medido:
        return None
    return Ajuste(sum((p.kwh_real for p in periodos), Decimal(0)) / medido, Decimal(0))


def ajustar(periodos: Sequence[PeriodoCalibracion]) -> Ajuste | None:
    """Ajuste del medidor a partir de los periodos conciliados (el último al final)."""
    recientes = [p for p in periodos if p.kwh_medido > 0 and p.horas > 0][-MAX_PERIODOS:]
    if not recientes:
        return None
    # Fuera las facturas que no cuadran con las demás (una mal metida, un cambio de medidor).
    cocientes = sorted(p.kwh_real / p.kwh_medido for p in recientes)
    mediana = cocientes[len(cocientes) // 2]
    recientes = [p for p in recientes if abs(p.kwh_real / p.kwh_medido / mediana - 1) <= MAX_DESVIO]
    if len(recientes) < MIN_PARA_AJUSTE:
        return _factor(recientes[-1:])
    x = [(p.kwh_medido, Decimal(p.horas)) for p in recientes]
    y = [p.kwh_real for p in recientes]
    sxx = sum((a * a for a, _ in x), Decimal(0))
    sxh = sum((a * h for a, h in x), Decimal(0))
    shh = sum((h * h for _, h in x), Decimal(0))
    sxy = sum((a * v for (a, _), v in zip(x, y, strict=True)), Decimal(0))
    shy = sum((h * v for (_, h), v in zip(x, y, strict=True)), Decimal(0))
    det = sxx * shh - sxh * sxh
    if not det:
        return _factor(recientes)
    alfa = (sxy * shh - sxh * shy) / det
    gamma = (sxx * shy - sxh * sxy) / det
    if not (ALFA_VALIDO[0] <= alfa <= ALFA_VALIDO[1]) or abs(gamma) > GAMMA_VALIDO_KWH_HORA:
        return _factor(recientes)
    return Ajuste(alfa, gamma)
