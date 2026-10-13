"""Comparativa de tarifas con lo pagado en los últimos 12 meses (DISENO §8 bis, F8).

Funciones puras (sin Home Assistant):

1. `ventana_12_meses`: elige los periodos de factura más recientes que cubren un año
   (facturas conciliadas o estimadas al cierre) y suma lo pagado y los kWh por periodo.
2. `consulta_anual`: los kWh por periodo llevados a 365 días, que se mandan a la CNMC.
3. `comparar`: lo pagado (llevado a 365 días) frente a cada oferta, ordenadas por el importe
   del primer año, con los avisos de bono social y de cobertura.

La CNMC calcula el importe de cada oferta con el consumo real por periodo que se le manda,
con sus precios, impuestos y alquiler del contador vigentes. Lo pagado lleva los impuestos
de cada factura; por eso se da también la estimación de la CNMC para el PVPC sin bono, que
está calculada igual que las ofertas.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from .cnmc import OfertaCnmc, grandes_ausentes

PERIODOS = ("P1", "P2", "P3")
DIAS_ANIO = 365
DIAS_MINIMOS_ANIO = 351  # 12 facturas cubren 351–380 días; menos, se extrapola
MAX_OFERTAS = 5
CENTIMO = Decimal("0.01")

# Avisos (claves de traducción y de atributos).
AVISO_PIERDE_BONO = "pierde_bono"
AVISO_COBERTURA = "cobertura_incompleta"
AVISO_EXTRAPOLADO = "datos_extrapolados"
AVISO_ESTIMADAS = "facturas_estimadas"
AVISO_SIN_OFERTAS = "sin_ofertas"

# Conclusión de la comparativa.
VEREDICTO_QUEDARSE_CON_BONO = "quedarse_con_bono"  # con bono, ninguna oferta libre mejora lo pagado
VEREDICTO_LIBRE_PIERDE_BONO = (
    "libre_aunque_pierde_bono"  # hay una oferta libre más barata pese a perder el bono
)
VEREDICTO_LIBRE = "mercado_libre"  # sin bono: hay una oferta más barata que lo pagado
VEREDICTO_QUEDARSE = "quedarse"  # sin bono: ninguna oferta mejora lo pagado


@dataclass(frozen=True)
class PeriodoPagado:
    inicio: date
    fin: date
    total: Decimal  # lo pagado (conciliada) o la estimación al cierre
    kwh: dict[str, Decimal]
    conciliada: bool
    total_sin_bono: Decimal | None = None  # el mismo periodo en el PVPC sin bono

    @property
    def dias(self) -> int:
        return (self.fin - self.inicio).days


@dataclass(frozen=True)
class Ventana:
    periodos: tuple[PeriodoPagado, ...]
    inicio: date
    fin: date
    dias: int
    pagado: Decimal
    pagado_sin_bono: Decimal | None
    kwh: dict[str, Decimal]
    conciliadas: int
    estimadas: int

    @property
    def factor_anual(self) -> Decimal:
        return Decimal(DIAS_ANIO) / Decimal(self.dias)

    @property
    def completa(self) -> bool:
        return self.dias >= DIAS_MINIMOS_ANIO

    @property
    def pagado_anual(self) -> Decimal:
        return _euros(self.pagado * self.factor_anual)

    @property
    def pagado_sin_bono_anual(self) -> Decimal | None:
        if self.pagado_sin_bono is None:
            return None
        return _euros(self.pagado_sin_bono * self.factor_anual)

    @property
    def con_bono(self) -> bool:
        return self.pagado_sin_bono is not None and self.pagado_sin_bono > self.pagado


@dataclass(frozen=True)
class Alternativa:
    oferta: OfertaCnmc
    ahorro_primer_anio: Decimal  # positivo: la oferta sale más barata que lo pagado
    ahorro_segundo_anio: Decimal


@dataclass(frozen=True)
class Comparativa:
    ventana: Ventana
    kwh_anuales: dict[str, int]
    alternativas: tuple[Alternativa, ...]  # mercado libre, de la más barata a la más cara
    pvpc_cnmc: Decimal | None  # estimación de la CNMC para el PVPC (sin bono)
    total_ofertas: int
    grandes_ausentes: tuple[str, ...]
    avisos: tuple[str, ...] = field(default_factory=tuple)
    veredicto: str | None = None

    @property
    def mejor(self) -> Alternativa | None:
        return self.alternativas[0] if self.alternativas else None


def _euros(x: Decimal) -> Decimal:
    return x.quantize(CENTIMO, ROUND_HALF_UP)


def ventana_12_meses(periodos: Sequence[PeriodoPagado]) -> Ventana | None:
    """Los periodos más recientes (sin solapes) hasta cubrir un año, o todos si no llegan."""
    elegidos: list[PeriodoPagado] = []
    dias = 0
    for p in sorted(periodos, key=lambda x: x.fin, reverse=True):
        if dias >= DIAS_MINIMOS_ANIO:
            break
        if elegidos and p.fin > elegidos[-1].inicio:
            continue  # se solapa con uno más reciente (rectificativa ya sustituida)
        if p.dias <= 0:
            continue
        elegidos.append(p)
        dias += p.dias
    if not elegidos:
        return None
    elegidos.reverse()
    kwh = {k: sum((p.kwh.get(k, Decimal(0)) for p in elegidos), Decimal(0)) for k in PERIODOS}
    sin_bono: Decimal | None = Decimal(0)
    for p in elegidos:
        if p.total_sin_bono is None or sin_bono is None:
            sin_bono = None
        else:
            sin_bono += p.total_sin_bono
    return Ventana(
        periodos=tuple(elegidos),
        inicio=elegidos[0].inicio,
        fin=elegidos[-1].fin,
        dias=dias,
        pagado=sum((p.total for p in elegidos), Decimal(0)),
        pagado_sin_bono=sin_bono,
        kwh=kwh,
        conciliadas=sum(1 for p in elegidos if p.conciliada),
        estimadas=sum(1 for p in elegidos if not p.conciliada),
    )


def consulta_anual(ventana: Ventana) -> dict[str, int]:
    """kWh por periodo en 365 días, enteros; el redondeo lo absorbe P3 (la API no admite decimales)."""
    f = ventana.factor_anual
    total = int((sum(ventana.kwh.values(), Decimal(0)) * f).quantize(Decimal(1), ROUND_HALF_UP))
    p1 = int((ventana.kwh["P1"] * f).quantize(Decimal(1), ROUND_HALF_UP))
    p2 = int((ventana.kwh["P2"] * f).quantize(Decimal(1), ROUND_HALF_UP))
    return {"P1": p1, "P2": p2, "P3": max(0, total - p1 - p2)}


def comparar(ventana: Ventana, ofertas: Sequence[OfertaCnmc]) -> Comparativa:
    pagado = ventana.pagado_anual
    libres = [o for o in ofertas if not o.es_pvpc]
    pvpc = next((o for o in ofertas if o.es_pvpc), None)
    alternativas = tuple(
        Alternativa(o, _euros(pagado - o.importe_primer_anio), _euros(pagado - o.importe_segundo_anio))
        for o in sorted(libres, key=lambda o: (o.importe_primer_anio, o.id))
    )
    ausentes = tuple(grandes_ausentes(list(ofertas)))
    avisos = []
    if ventana.con_bono:
        avisos.append(AVISO_PIERDE_BONO)
    if ausentes:
        avisos.append(AVISO_COBERTURA)
    if not ventana.completa:
        avisos.append(AVISO_EXTRAPOLADO)
    if ventana.estimadas:
        avisos.append(AVISO_ESTIMADAS)
    if not alternativas:
        avisos.append(AVISO_SIN_OFERTAS)
    veredicto = None
    if alternativas:
        mejora = alternativas[0].ahorro_primer_anio > 0
        if ventana.con_bono:
            veredicto = VEREDICTO_LIBRE_PIERDE_BONO if mejora else VEREDICTO_QUEDARSE_CON_BONO
        else:
            veredicto = VEREDICTO_LIBRE if mejora else VEREDICTO_QUEDARSE
    return Comparativa(
        ventana=ventana,
        kwh_anuales=consulta_anual(ventana),
        alternativas=alternativas,
        pvpc_cnmc=pvpc.importe_primer_anio if pvpc else None,
        total_ofertas=len(libres),
        grandes_ausentes=ausentes,
        avisos=tuple(avisos),
        veredicto=veredicto,
    )
