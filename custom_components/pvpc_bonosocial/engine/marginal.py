"""Precio marginal: lo que cuesta de verdad consumir 1 kWh más, con bono e impuestos."""

from __future__ import annotations

from decimal import Decimal


def precio_marginal(
    *,
    precio_kwh: Decimal,
    descuento: Decimal = Decimal(0),
    fraccion_bonificada: Decimal = Decimal(1),
    precio_medio_kwh: Decimal = Decimal(0),
    iee_tipo: Decimal,
    iee_minimo_activo: bool = False,
    iee_minimo_kwh: Decimal = Decimal("0.001"),
    iva: Decimal,
) -> Decimal:
    """Coste de 1 kWh más a precio PVPC `precio_kwh` (energía con peajes, €/kWh).

    Con reparto proporcional del bono, si el consumo del periodo pasa del límite
    (`fraccion_bonificada` = límite / consumo < 1), cada kWh adicional rebaja la
    fracción bonificada de todos los demás: el marginal es p·(1 − d·f) + d·f·p̄,
    con p̄ el precio medio de la energía del periodo. Si no pasa del límite: p·(1 − d).
    """
    f = min(fraccion_bonificada, Decimal(1))
    if f < 1:
        antes_impuestos = precio_kwh * (1 - descuento * f) + descuento * f * precio_medio_kwh
    else:
        antes_impuestos = precio_kwh * (1 - descuento)
    con_iee = antes_impuestos + iee_minimo_kwh if iee_minimo_activo else antes_impuestos * (1 + iee_tipo)
    return con_iee * (1 + iva)
