"""Datos de una factura de luz en PDF para conciliarla (F4).

Solo reconoce las facturas de la **Comercializadora Regulada, Gas & Power** (Naturgy),
la comercializadora de referencia del titular: es la única de la que hay facturas para
probarlo. Para añadir otra hacen falta de 3 a 5 facturas consecutivas en PDF (README).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from .pdf_texto import texto_pdf

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7,
    "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}  # fmt: skip
NUM = r"-?\d{1,3}(?:\.\d{3})*,\d{2}"


class FacturaNoReconocida(ValueError):
    """El PDF no es una factura de una comercializadora soportada o le faltan datos."""


@dataclass(frozen=True)
class DatosFactura:
    comercializadora: str
    inicio: date
    fin: date
    emision: date | None
    kwh: dict[str, int]
    total: Decimal
    bonificados: int | None
    rectificativa: bool


def _fecha(texto: str) -> date:
    m = re.fullmatch(r"(\d{1,2}) de (\w+) de (\d{4})", texto.strip())
    if not m or m.group(2).lower() not in MESES:
        raise FacturaNoReconocida(f"Fecha no reconocida: {texto!r}")
    return date(int(m.group(3)), MESES[m.group(2).lower()], int(m.group(1)))


def _num(s: str) -> Decimal:
    return Decimal(s.replace(".", "").replace(",", "."))


def leer_factura(pdf: bytes) -> DatosFactura:
    try:
        texto = re.sub(r"\s+", " ", texto_pdf(pdf))
    except Exception as exc:  # PDF dañado o con algo que el lector no entiende
        raise FacturaNoReconocida(f"No se puede leer el PDF: {exc}") from exc
    if not re.search(r"Comercializadora Regulada,? Gas ?& ?Power", texto, re.I):
        raise FacturaNoReconocida(
            "Solo se reconocen las facturas de la Comercializadora Regulada, Gas & Power (Naturgy)"
        )
    periodo = re.search(r"(\d{1,2} de \w+ de \d{4}) a (\d{1,2} de \w+ de \d{4})", texto)
    total = re.search(r"TOTAL IMPORTE FACTURA: (" + NUM + r") ?€", texto)
    consumos = dict(re.findall(r"Consumo en P([123]): (\d+) kWh", texto))
    if not periodo or not total or set(consumos) != {"1", "2", "3"}:
        raise FacturaNoReconocida("No se encuentran el periodo, el total o los consumos P1/P2/P3")
    emision = re.search(r"emitida el (\d{1,2} de \w+ de \d{4})", texto)
    bonificados = re.search(r"Consumo bonificado: (\d+) kWh", texto)
    return DatosFactura(
        comercializadora="Comercializadora Regulada, Gas & Power",
        inicio=_fecha(periodo.group(1)),
        fin=_fecha(periodo.group(2)),
        emision=_fecha(emision.group(1)) if emision else None,
        kwh={f"P{p}": int(v) for p, v in sorted(consumos.items())},
        total=_num(total.group(1)),
        bonificados=int(bonificados.group(1)) if bonificados else None,
        rectificativa=bool(re.search(r"rectificativa|rectifica a", texto, re.I)),
    )
