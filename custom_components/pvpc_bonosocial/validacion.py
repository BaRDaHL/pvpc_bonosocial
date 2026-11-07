"""Comprobaciones de los formularios y servicios que dan un mensaje traducido.

Si un valor no pasa el esquema del formulario, Home Assistant enseña el texto crudo de voluptuous,
en inglés («value must be at most 15.0»). Por eso los rangos se comprueban en el propio flujo.
"""

from __future__ import annotations

from collections.abc import Mapping
from decimal import Decimal
from typing import Any

import voluptuous as vol
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TimeSelector,
)

MAX_KWH_FACTURA = 100000
MAX_TOTAL_FACTURA = 100000


class NumeroConAviso(NumberSelector):
    """Número con rango: el frontend ve el mínimo y el máximo, y el flujo da el error traducido."""

    def __init__(self, clave_error: str, **config: Any) -> None:
        super().__init__(NumberSelectorConfig(mode=NumberSelectorMode.BOX, **config))
        self.clave_error = clave_error

    def __call__(self, data: Any) -> float:
        return float(data)


class HoraConAviso(TimeSelector):
    """Hora que el esquema deja pasar para que el flujo dé el error traducido."""

    def __call__(self, data: Any) -> str:
        return str(data)


def errores_de_rango(datos: Mapping[str, Any], campos: Mapping[str, NumeroConAviso]) -> dict[str, str]:
    """Clave de error de cada campo presente que se sale de su rango."""
    errores: dict[str, str] = {}
    for campo, selector in campos.items():
        valor = datos.get(campo)
        # Escrito al revés para que NaN, que no compara con nada, también sea un error.
        if valor is not None and not selector.config["min"] <= valor <= selector.config["max"]:
            errores[campo] = selector.clave_error
    return errores


def hora_valida(texto: str) -> bool:
    try:
        cv.time(texto)
    except vol.Invalid:
        return False
    return True


def errores_factura(
    kwh: Mapping[str, int], total: Decimal | float, bonificados: int | None
) -> dict[str, str]:
    """Errores de una factura real, por campo. Una errata aquí desvía la calibración y el arrastre.

    Sin consumo con importe es una factura posible (casa vacía: se paga la potencia); a cero euros
    no, porque la potencia y el alquiler siempre se facturan.
    """
    errores: dict[str, str] = {}
    if total <= 0:
        errores["total"] = "importe_a_cero"
    if bonificados is not None and bonificados > sum(kwh.values()):
        errores["kwh_bonificados"] = "bonificados_mayor_que_consumo"
    return errores
