"""Factura del PVPC de la Comercializadora de Referencia (2.0TD), con o sin bono social.

Reproduce línea a línea las facturas reales: cada línea se redondea a céntimos
(mitad hacia arriba) y el total es la suma de líneas. Python puro, sin Home Assistant.

Convenciones (verificadas con facturas reales, ver docs/DISENO.md §4):
- Periodo «X a Y»: el día X está excluido y el Y incluido.
- Potencia y energía se parten en tramos en cada 1 de enero y en cada cambio de
  peajes; cada tramo prorratea por días con su año (365 o 366).
- Límite del bono por tramo: round(límite_anual · días / días_año) + arrastre.
- kWh bonificados por periodo, enteros: P1 y P2 redondeados, P3 = resto.
- IVA e IEE: tipo de la fecha de emisión. % del bono: el del primer día facturado.
- Cambios de contrato a mitad de periodo (potencia, bono, categoría): un tramo más en la
  fecha del cambio, cada uno con su contrato. Si el bono no es el mismo en todo el periodo,
  el descuento se calcula por grupos de días con el mismo porcentaje (estimación: no hay
  facturas reales de ese caso; la conciliación lo corrige).
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from enum import StrEnum

from .calendario import SEIS_DECIMALES, Tramo, dias_anio, entero, euros, partir, repartir_entero
from .tarifas import Tarifas

PERIODOS = ("P1", "P2", "P3")
CONCEPTOS_TRAMO = (
    "peaje_potencia_p1",
    "peaje_potencia_p2",
    "peaje_energia_p1",
    "peaje_energia_p2",
    "peaje_energia_p3",
)


class Bono(StrEnum):
    NINGUNO = "ninguno"
    VULNERABLE = "vulnerable"
    SEVERO = "severo"
    SEVERO_EXCLUSION = "severo_exclusion"


# RD 897/2017, anexo I: límite anual de energía con descuento.
LIMITES_ANUALES_KWH = {
    "individual_o_dos": 1587,
    "tres_o_pensionista_o_dos_con_menor": 2222,
    "cuatro_o_tres_con_dos_menores": 2698,
    "cinco_o_mas_o_familia_numerosa": 4761,
}


@dataclass(frozen=True)
class Suministro:
    potencia_p1_kw: Decimal
    potencia_p2_kw: Decimal
    bono: Bono = Bono.NINGUNO
    limite_anual_kwh: int | None = None

    def __post_init__(self) -> None:
        if self.bono is not Bono.NINGUNO and self.limite_anual_kwh is None:
            raise ValueError("Con bono social hace falta el límite anual de kWh")


@dataclass(frozen=True)
class ConsumoTramo:
    """kWh por periodo de un tramo (los tramos los define `tramos_de_periodo`)."""

    tramo: Tramo
    kwh: Mapping[str, Decimal]


@dataclass(frozen=True)
class LineaPotencia:
    tramo: Tramo
    periodo: str
    kw: Decimal
    precio: Decimal
    importe: Decimal


@dataclass(frozen=True)
class LineaEnergia:
    tramo: Tramo
    periodo: str
    kwh: Decimal
    precio: Decimal
    importe: Decimal
    bonificada: bool


@dataclass(frozen=True)
class Factura:
    inicio: date
    fin: date
    emision: date
    tramos: tuple[Tramo, ...]
    lineas_potencia: tuple[LineaPotencia, ...]
    margen: Decimal
    potencia: Decimal
    lineas_energia: tuple[LineaEnergia, ...]
    coste_energia_bonificada: Decimal
    coste_energia_excede: Decimal
    energia: Decimal
    energia_bonificada: Decimal
    financiacion_bono: Decimal
    base_descuento: Decimal
    porcentaje_bono: Decimal
    descuento: Decimal
    base_iee: Decimal
    iee_tipo: Decimal
    iee_minimo_aplicado: bool
    iee: Decimal
    alquiler: tuple[Decimal, ...]
    base_iva: Decimal
    iva_tipo: Decimal
    iva: Decimal
    total: Decimal
    kwh_total: Decimal
    kwh_bonificados: Decimal
    limite_kwh: tuple[int, ...] = field(default_factory=tuple)

    @property
    def dias(self) -> int:
        return (self.fin - self.inicio).days


def tramos_de_periodo(
    inicio: date, fin: date, tarifas: Tarifas, cambios_contrato: Iterable[date] = ()
) -> list[Tramo]:
    """Tramos de potencia y energía: cortes en cada 1 de enero, en cada cambio de peajes y en
    cada cambio de contrato (primer día con el contrato nuevo)."""
    cambios = {d for c in CONCEPTOS_TRAMO for d in tarifas.cambios(c)} | set(cambios_contrato)
    return partir(inicio, fin, cambios)


def contrato_del_tramo(tramo: Tramo, inicial: Suministro, cambios: Mapping[date, Suministro]) -> Suministro:
    """Contrato vigente el primer día del tramo."""
    vigente = inicial
    for desde in sorted(cambios):
        if desde <= tramo.primer_dia:
            vigente = cambios[desde]
    return vigente


def calcular_factura(
    *,
    inicio: date,
    fin: date,
    emision: date,
    suministro: Suministro,
    consumo: Sequence[ConsumoTramo],
    coste_energia: Decimal | Mapping[str, Decimal],
    arrastre_kwh: int = 0,
    coste_energia_bonificada: Decimal | None = None,
    tarifas: Tarifas | None = None,
    cambios_suministro: Mapping[date, Suministro] | None = None,
) -> Factura:
    """Calcula la factura de un periodo.

    `suministro` es el contrato del primer día; `cambios_suministro[d]`, el que rige desde el
    día `d` (incluido) si cambia a mitad de periodo.

    `coste_energia` es el «coste de la energía» del periodo: Σ kWh_h · (PVPC_h − peajes_h),
    en total o por periodo (P1/P2/P3). Por periodo, la parte bonificada se reparte periodo a
    periodo con sus kWh bonificados; con el total, en proporción a todos los kWh bonificados
    (las facturas reales difieren como mucho 1 céntimo en esa línea).
    `coste_energia_bonificada` fija la parte bonificada tal como la trae una factura.
    """
    tarifas = tarifas or Tarifas.empaquetadas()
    cambios = dict(cambios_suministro or {})
    tramos = tramos_de_periodo(inicio, fin, tarifas, cambios)
    if [c.tramo for c in consumo] != tramos:
        raise ValueError(f"Los tramos del consumo no coinciden con los del periodo: {tramos}")
    contratos = [contrato_del_tramo(t, suministro, cambios) for t in tramos]
    bono_tramo = [c.bono is not Bono.NINGUNO for c in contratos]
    con_bono = any(bono_tramo)
    final = contratos[-1]  # el contrato al cierre fija el IVA (potencia y bono)
    pot_max = max(final.potencia_p1_kw, final.potencia_p2_kw)

    # Potencia por tramo y periodo, y margen de comercialización en una sola línea.
    lineas_pot: list[LineaPotencia] = []
    margen_tramo: list[Decimal] = []
    for t, contrato in zip(tramos, contratos, strict=True):
        n = dias_anio(t.anio)
        for periodo, kw in (("P1", contrato.potencia_p1_kw), ("P2", contrato.potencia_p2_kw)):
            precio = tarifas.valor(f"peaje_potencia_{periodo.lower()}", t.primer_dia)
            lineas_pot.append(LineaPotencia(t, periodo, kw, precio, euros(kw * precio * t.dias / n)))
        margen_tramo.append(
            contrato.potencia_p1_kw * tarifas.valor("margen_comercializacion", t.primer_dia) * t.dias / n
        )
    margen = euros(sum(margen_tramo, Decimal(0)))
    potencia = sum((lp.importe for lp in lineas_pot), Decimal(0)) + margen

    # Límite del bono por tramo (solo los tramos con bono; el arrastre se reparte entre ellos).
    limites: list[int] = []
    if con_bono:
        dias_con_bono = [t.dias if b else 0 for t, b in zip(tramos, bono_tramo, strict=True)]
        arrastres = repartir_entero(arrastre_kwh, dias_con_bono)
        for t, contrato, b, a in zip(tramos, contratos, bono_tramo, arrastres, strict=True):
            if not b:
                limites.append(0)
                continue
            assert contrato.limite_anual_kwh is not None
            limites.append(entero(Decimal(contrato.limite_anual_kwh) * t.dias / dias_anio(t.anio)) + a)

    lineas_en: list[LineaEnergia] = []
    kwh_total = Decimal(0)
    kwh_bonif_total = Decimal(0)
    for i, c in enumerate(consumo):
        t = c.tramo
        kwh = {p: Decimal(c.kwh.get(p, 0)) for p in PERIODOS}
        total_tramo = sum(kwh.values(), Decimal(0))
        kwh_total += total_tramo
        bonif = (
            _bonificados(kwh, total_tramo, limites[i])
            if bono_tramo[i]
            else dict.fromkeys(PERIODOS, Decimal(0))
        )
        kwh_bonif_total += sum(bonif.values(), Decimal(0))
        for periodo in PERIODOS:
            precio = tarifas.valor(f"peaje_energia_{periodo.lower()}", t.primer_dia)
            if bono_tramo[i]:
                lineas_en.append(
                    LineaEnergia(t, periodo, bonif[periodo], precio, euros(bonif[periodo] * precio), True)
                )
            exc = kwh[periodo] - bonif[periodo]
            lineas_en.append(LineaEnergia(t, periodo, exc, precio, euros(exc * precio), False))

    por_periodo = isinstance(coste_energia, Mapping)
    coste_total = euros(sum(coste_energia.values(), Decimal(0)) if por_periodo else coste_energia)
    if not con_bono:
        coste_bonif = Decimal(0)
    elif coste_energia_bonificada is not None:
        coste_bonif = euros(coste_energia_bonificada)
    elif por_periodo:
        kwh_p = {p: sum((le.kwh for le in lineas_en if le.periodo == p), Decimal(0)) for p in PERIODOS}
        bonif_p = {
            p: sum((le.kwh for le in lineas_en if le.periodo == p and le.bonificada), Decimal(0))
            for p in PERIODOS
        }
        coste_bonif = euros(
            sum(
                (Decimal(coste_energia.get(p, 0)) * bonif_p[p] / kwh_p[p] for p in PERIODOS if kwh_p[p]),
                Decimal(0),
            )
        )
    else:
        coste_bonif = euros(coste_total * kwh_bonif_total / kwh_total) if kwh_total else Decimal(0)
    coste_exc = coste_total - coste_bonif

    peajes_bonif = sum((le.importe for le in lineas_en if le.bonificada), Decimal(0))
    peajes_exc = sum((le.importe for le in lineas_en if not le.bonificada), Decimal(0))
    energia_bonificada = peajes_bonif + coste_bonif
    energia = energia_bonificada + peajes_exc + coste_exc

    financiacion = euros(_por_dias(tramos, lambda dia, n: tarifas.valor("financiacion_bono_social", dia) / n))

    # Descuento del bono: % del primer día facturado, sin prorratear.
    porcentaje = Decimal(0)
    base_descuento = Decimal(0)
    descuento = Decimal(0)
    if con_bono:

        def _pct(contrato: Suministro, dia: date) -> Decimal:
            concepto = (
                "descuento_bono_vulnerable" if contrato.bono is Bono.VULNERABLE else "descuento_bono_severo"
            )
            return tarifas.valor(concepto, dia)

        primer = next(i for i, b in enumerate(bono_tramo) if b)
        porcentaje = _pct(contratos[primer], tramos[0].primer_dia)
        if all(bono_tramo) and len({c.bono for c in contratos}) == 1:
            base_descuento = potencia + energia_bonificada + financiacion
            descuento = -euros(base_descuento * porcentaje)
        else:
            # Bono solo parte del periodo o de distinto tipo: base de los días con bono.
            grupos: dict[Decimal, Decimal] = {}
            for i, (t, contrato) in enumerate(zip(tramos, contratos, strict=True)):
                if not bono_tramo[i]:
                    continue
                pot_t = sum((lp.importe for lp in lineas_pot if lp.tramo == t), Decimal(0))
                bonif_t = [le for le in lineas_en if le.tramo == t and le.bonificada]
                kwh_b = sum((le.kwh for le in bonif_t), Decimal(0))
                base_t = (
                    pot_t
                    + euros(margen_tramo[i])
                    + sum((le.importe for le in bonif_t), Decimal(0))
                    + (coste_bonif * kwh_b / kwh_bonif_total if kwh_bonif_total else Decimal(0))
                    + euros(_por_dias([t], lambda dia, n: tarifas.valor("financiacion_bono_social", dia) / n))
                )
                pct = _pct(contrato, t.primer_dia)
                grupos[pct] = grupos.get(pct, Decimal(0)) + base_t
            base_descuento = euros(sum(grupos.values(), Decimal(0)))
            descuento = -sum((euros(b * p) for p, b in grupos.items()), Decimal(0))

    # Impuesto especial sobre la electricidad (fecha de emisión), con cuota mínima por kWh.
    base_iee = potencia + energia + financiacion + descuento
    iee_tipo = tarifas.valor("iee_tipo", emision)
    iee_pct = euros(base_iee * iee_tipo)
    iee_min = euros(kwh_total * tarifas.valor("iee_minimo", emision))
    iee_minimo_aplicado = iee_min > iee_pct
    iee = max(iee_pct, iee_min)

    # Alquiler del contador: una línea por precio diario distinto (mensual · 12 / días del año,
    # a 6 decimales). Dos años de 365 días comparten precio y van en la misma línea.
    dias_por_precio: dict[Decimal, int] = {}
    for t in tramos:
        mensual = tarifas.valor("alquiler_contador", t.primer_dia)
        diario = (mensual * 12 / dias_anio(t.anio)).quantize(SEIS_DECIMALES)
        dias_por_precio[diario] = dias_por_precio.get(diario, 0) + t.dias
    alquiler = [euros(dias * diario) for diario, dias in dias_por_precio.items()]

    base_iva = base_iee + iee + sum(alquiler, Decimal(0))
    iva_tipo = tarifas.valor("iva", emision, potencia_kw=pot_max, bono=final.bono.value)
    iva = euros(base_iva * iva_tipo)

    return Factura(
        inicio=inicio,
        fin=fin,
        emision=emision,
        tramos=tuple(tramos),
        lineas_potencia=tuple(lineas_pot),
        margen=margen,
        potencia=potencia,
        lineas_energia=tuple(lineas_en),
        coste_energia_bonificada=coste_bonif,
        coste_energia_excede=coste_exc,
        energia=energia,
        energia_bonificada=energia_bonificada,
        financiacion_bono=financiacion,
        base_descuento=base_descuento,
        porcentaje_bono=porcentaje,
        descuento=descuento,
        base_iee=base_iee,
        iee_tipo=iee_tipo,
        iee_minimo_aplicado=iee_minimo_aplicado,
        iee=iee,
        alquiler=tuple(alquiler),
        base_iva=base_iva,
        iva_tipo=iva_tipo,
        iva=iva,
        total=base_iva + iva,
        kwh_total=kwh_total,
        kwh_bonificados=kwh_bonif_total,
        limite_kwh=tuple(limites),
    )


def _bonificados(kwh: Mapping[str, Decimal], total: Decimal, limite: int) -> dict[str, Decimal]:
    """kWh con descuento de un tramo.

    Todo si no se pasa del límite; si no, P1 y P2 redondeados y P3 el resto.
    """
    if total <= limite:
        return dict(kwh)
    p1 = Decimal(entero(kwh["P1"] * limite / total))
    p2 = Decimal(entero(kwh["P2"] * limite / total))
    return {"P1": p1, "P2": p2, "P3": Decimal(limite) - p1 - p2}


def _por_dias(tramos: Sequence[Tramo], valor_diario) -> Decimal:
    """Σ días · valor diario (redondeado a 6 decimales, como en la factura)."""
    total = Decimal(0)
    for t in tramos:
        n = dias_anio(t.anio)
        for dia in t.dias_facturados():
            total += valor_diario(dia, n).quantize(SEIS_DECIMALES)
    return total
