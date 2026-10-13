"""Tabla de valores regulados con vigencia (tarifas.json)."""

from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from itertools import pairwise
from pathlib import Path
from typing import Any

ESQUEMA = 1
_EMPAQUETADA = Path(__file__).with_name("tarifas.json")


class TarifaAusente(LookupError):
    """No hay valor de un concepto para una fecha."""

    def __init__(self, concepto: str, dia: date) -> None:
        super().__init__(f"Sin valor de «{concepto}» para {dia.isoformat()}")
        self.concepto = concepto
        self.dia = dia


@dataclass(frozen=True)
class Condicion:
    """Restricción de un valor a ciertos suministros."""

    potencia_kw_menor_que: Decimal | None = None
    potencia_kw_hasta: Decimal | None = None  # menor o igual
    bono: frozenset[str] = field(default_factory=frozenset)

    def cumple(self, potencia_kw: Decimal, bono: str) -> bool:
        if self.potencia_kw_menor_que is not None and not potencia_kw < self.potencia_kw_menor_que:
            return False
        if self.potencia_kw_hasta is not None and not potencia_kw <= self.potencia_kw_hasta:
            return False
        return not (self.bono and bono not in self.bono)


@dataclass(frozen=True)
class Vigencia:
    desde: date
    hasta: date | None
    valor: Decimal
    fuente: str
    provisional: bool = False
    condicion: Condicion | None = None

    def cubre(self, dia: date) -> bool:
        return self.desde <= dia and (self.hasta is None or dia <= self.hasta)


class Tarifas:
    """Resuelve el valor vigente de cada concepto en un día."""

    def __init__(self, conceptos: Mapping[str, tuple[Vigencia, ...]], version: str) -> None:
        self._conceptos = dict(conceptos)
        self.version = version

    @classmethod
    def desde_dict(cls, datos: Mapping[str, Any]) -> Tarifas:
        if datos.get("esquema") != ESQUEMA:
            raise ValueError(f"Esquema de tarifas no soportado: {datos.get('esquema')}")
        conceptos = {}
        for nombre, c in datos["conceptos"].items():
            valores = tuple(_vigencia(v) for v in c["valores"])
            _comprobar_solapes(nombre, valores)
            conceptos[nombre] = valores
        return cls(conceptos, str(datos.get("version", "")))

    @classmethod
    def empaquetadas(cls) -> Tarifas:
        return cls.desde_dict(json.loads(_EMPAQUETADA.read_text(encoding="utf-8")))

    def vigencia(
        self, concepto: str, dia: date, *, potencia_kw: Decimal | None = None, bono: str = "ninguno"
    ) -> Vigencia:
        """Valor condicionado que aplique al suministro o, si no, el general."""
        general = None
        for v in self._conceptos[concepto]:
            if not v.cubre(dia):
                continue
            if v.condicion is None:
                general = general or v
            elif potencia_kw is not None and v.condicion.cumple(potencia_kw, bono):
                return v
        if general is None:
            raise TarifaAusente(concepto, dia)
        return general

    def valor(self, concepto: str, dia: date, **kwargs: Any) -> Decimal:
        return self.vigencia(concepto, dia, **kwargs).valor

    def cambios(self, concepto: str) -> list[date]:
        """Días en que empieza una vigencia del concepto."""
        return sorted({v.desde for v in self._conceptos[concepto]})


def _vigencia(v: Mapping[str, Any]) -> Vigencia:
    cond = v.get("condicion")
    return Vigencia(
        desde=date.fromisoformat(v["desde"]),
        hasta=date.fromisoformat(v["hasta"]) if v.get("hasta") else None,
        valor=Decimal(v["valor"]),
        fuente=v.get("fuente", ""),
        provisional=bool(v.get("provisional", False)),
        condicion=Condicion(
            potencia_kw_menor_que=Decimal(cond["potencia_kw_menor_que"])
            if "potencia_kw_menor_que" in cond
            else None,
            potencia_kw_hasta=Decimal(cond["potencia_kw_hasta"]) if "potencia_kw_hasta" in cond else None,
            bono=frozenset(cond.get("bono", ())),
        )
        if cond
        else None,
    )


def _comprobar_solapes(nombre: str, valores: tuple[Vigencia, ...]) -> None:
    generales = sorted((v for v in valores if v.condicion is None), key=lambda v: v.desde)
    for a, b in pairwise(generales):
        if a.hasta is None or a.hasta >= b.desde:
            raise ValueError(f"«{nombre}»: vigencias generales solapadas ({a.desde} y {b.desde})")
