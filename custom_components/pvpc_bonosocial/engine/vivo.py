"""Factura en tiempo real de un periodo abierto: acumulado y previsión al cierre (DISENO §5.2).

Python puro, sin HA. Recibe las horas ya medidas (kWh, periodo y precio de cada hora) y las
horas que faltan hasta el corte (periodo y, si ya se conoce, su precio), y devuelve:

- **acumulado**: la factura del periodo hasta hoy (fijos de los días transcurridos, con el
  día en curso entero) con el consumo medido;
- **previsión**: la factura completa al corte, sumando a lo medido una estimación de las
  horas que faltan (perfil reciente por hora del día y tipo de día) a su precio conocido o,
  si aún no se ha publicado, a la media reciente de su periodo.

El IVA y el IEE son los de la fecha de emisión prevista (corte + días hasta la emisión).
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal

from .factura import ConsumoTramo, Factura, Suministro, calcular_factura, tramos_de_periodo
from .tarifas import Tarifas

PERIODOS = ("P1", "P2", "P3")
DIAS_PERFIL = 28  # días recientes para estimar el consumo que falta (incluye el periodo anterior)
PERCENTILES_RANGO = (Decimal("0.2"), Decimal("0.8"))  # previsión baja y alta
DIAS_PRECIO = 7  # días recientes para estimar el precio que falta


@dataclass(frozen=True)
class HoraMedida:
    """Una hora ya consumida. Precios en €/MWh (archivo 70: PCB y TEU)."""

    inicio: datetime  # con zona horaria local (Europe/Madrid)
    kwh: Decimal
    periodo: str
    pcb_mwh: Decimal
    teu_mwh: Decimal

    @property
    def coste_energia(self) -> Decimal:
        """«Coste de la energía» de la hora: kWh · (PVPC − peajes)."""
        return self.kwh * (self.pcb_mwh - self.teu_mwh) / 1000


@dataclass(frozen=True)
class HoraFutura:
    """Una hora que falta hasta el corte; el precio es None si aún no está publicado."""

    inicio: datetime
    periodo: str
    valle_todo_el_dia: bool  # sábado, domingo o festivo P3: otro perfil de consumo
    pcb_mwh: Decimal | None = None
    teu_mwh: Decimal | None = None


@dataclass(frozen=True)
class Ajuste:
    """Calibración del medidor (F4): kWh reales = alfa · medidos + gamma por hora."""

    alfa: Decimal = Decimal(1)
    gamma_kwh_hora: Decimal = Decimal(0)

    def aplicar(self, kwh: Decimal) -> Decimal:
        return self.alfa * kwh + self.gamma_kwh_hora


@dataclass(frozen=True)
class Estimacion:
    inicio: date  # día inicial del periodo (excluido, como en la factura)
    corte: date  # día final previsto (incluido)
    emision: date
    hoy: date
    acumulado: Factura | None
    prevision: Factura
    kwh_medidos: dict[str, Decimal] = field(default_factory=dict)
    kwh_previstos: dict[str, Decimal] = field(default_factory=dict)  # periodo completo
    # Si lo que falta se consumiera como un día bajo o alto de los recientes (percentiles 20 y 80)
    prevision_baja: Decimal | None = None
    prevision_alta: Decimal | None = None

    @property
    def dias_transcurridos(self) -> int:
        return max(0, min((self.hoy - self.inicio).days, self.dias_totales))

    @property
    def dias_totales(self) -> int:
        return (self.corte - self.inicio).days

    @property
    def limite_kwh(self) -> int:
        return sum(self.prevision.limite_kwh)

    @property
    def kwh_bonificables_restantes(self) -> Decimal:
        if not self.prevision.limite_kwh:
            return Decimal(0)
        return max(Decimal(0), Decimal(self.limite_kwh) - sum(self.kwh_medidos.values(), Decimal(0)))


def _tipo(inicio: datetime, valle: bool) -> tuple[bool, int]:
    return (valle, inicio.hour)


def perfil_reciente(
    medidas: Sequence[HoraMedida], valle_todo_el_dia: dict[date, bool], dias: int = DIAS_PERFIL
) -> dict[tuple[bool, int], Decimal]:
    """kWh medios por (tipo de día, hora del día) en los últimos `dias` días medidos."""
    if not medidas:
        return {}
    ultimo = max(m.inicio.date() for m in medidas)
    desde = ultimo - timedelta(days=dias - 1)
    sumas: dict[tuple[bool, int], list[Decimal]] = {}
    for m in medidas:
        if m.inicio.date() < desde:
            continue
        clave = _tipo(m.inicio, valle_todo_el_dia.get(m.inicio.date(), False))
        sumas.setdefault(clave, []).append(m.kwh)
    return {k: sum(v, Decimal(0)) / len(v) for k, v in sumas.items()}


def _kwh_previsto(perfil: dict[tuple[bool, int], Decimal], hora: HoraFutura) -> Decimal:
    clave = _tipo(hora.inicio, hora.valle_todo_el_dia)
    if clave in perfil:
        return perfil[clave]
    mismas_horas = [v for (valle, h), v in perfil.items() if h == hora.inicio.hour]
    if mismas_horas:
        return sum(mismas_horas, Decimal(0)) / len(mismas_horas)
    return sum(perfil.values(), Decimal(0)) / len(perfil) if perfil else Decimal(0)


def _margen_reciente(medidas: Sequence[HoraMedida], dias: int = DIAS_PRECIO) -> dict[str, Decimal]:
    """(PCB − TEU) medio por periodo en los últimos días, en €/MWh."""
    if not medidas:
        return {}
    ultimo = max(m.inicio.date() for m in medidas)
    desde = ultimo - timedelta(days=dias - 1)
    por_periodo: dict[str, list[Decimal]] = {}
    for m in medidas:
        if m.inicio.date() >= desde:
            por_periodo.setdefault(m.periodo, []).append(m.pcb_mwh - m.teu_mwh)
    return {p: sum(v, Decimal(0)) / len(v) for p, v in por_periodo.items()}


def _a_tramos(
    inicio: date,
    fin: date,
    kwh_por_dia: dict[date, dict[str, Decimal]],
    tarifas: Tarifas,
    cambios_contrato: Mapping[date, Suministro] | None = None,
) -> list[ConsumoTramo]:
    out = []
    for tramo in tramos_de_periodo(inicio, fin, tarifas, cambios_contrato or {}):
        kwh = dict.fromkeys(PERIODOS, Decimal(0))
        for dia in tramo.dias_facturados():
            for p, v in kwh_por_dia.get(dia, {}).items():
                kwh[p] += v
        out.append(ConsumoTramo(tramo, kwh))
    return out


def estimar_periodo(
    *,
    inicio: date,
    corte: date,
    hoy: date,
    dias_hasta_emision: int,
    suministro: Suministro,
    medidas: Sequence[HoraMedida],
    futuras: Sequence[HoraFutura],
    valle_todo_el_dia: dict[date, bool],
    arrastre_kwh: int = 0,
    ajuste: Ajuste | None = None,
    tarifas: Tarifas | None = None,
    historial: Sequence[HoraMedida] = (),
    dias_perfil: int = DIAS_PERFIL,
    cambios_suministro: Mapping[date, Suministro] | None = None,
) -> Estimacion:
    """Acumulado hasta hoy y previsión al corte de un periodo (`inicio` excluido).

    `historial` son horas medidas anteriores al periodo: solo sirven para el perfil de
    consumo (al principio del periodo hay pocos días propios).
    """
    if corte <= inicio:
        raise ValueError(f"Periodo vacío: {inicio} → {corte}")
    tarifas = tarifas or Tarifas.empaquetadas()
    ajuste = ajuste or Ajuste()
    emision = corte + timedelta(days=dias_hasta_emision)
    cambios = dict(cambios_suministro or {})

    kwh_dia: dict[date, dict[str, Decimal]] = {}
    coste: dict[str, Decimal] = dict.fromkeys(PERIODOS, Decimal(0))
    medidos = dict.fromkeys(PERIODOS, Decimal(0))
    for m in medidas:
        kwh = ajuste.aplicar(m.kwh)
        dia = kwh_dia.setdefault(m.inicio.date(), dict.fromkeys(PERIODOS, Decimal(0)))
        dia[m.periodo] += kwh
        medidos[m.periodo] += kwh
        coste[m.periodo] += kwh * (m.pcb_mwh - m.teu_mwh) / 1000

    fin_acumulado = min(hoy, corte)
    acumulado = None
    if fin_acumulado > inicio:
        acumulado = calcular_factura(
            inicio=inicio,
            fin=fin_acumulado,
            emision=emision,
            suministro=suministro,
            consumo=_a_tramos(inicio, fin_acumulado, kwh_dia, tarifas, cambios),
            coste_energia=dict(coste),
            arrastre_kwh=arrastre_kwh,
            tarifas=tarifas,
            cambios_suministro=cambios,
        )

    # Lo que falta: perfil reciente y precio conocido o medio del periodo.
    recientes = [*historial, *medidas]
    perfil = perfil_reciente(recientes, valle_todo_el_dia, dias_perfil)
    margen = _margen_reciente(recientes)
    margen_global = sum(margen.values(), Decimal(0)) / len(margen) if margen else Decimal(0)

    def _prevision(escala: Decimal) -> tuple[Factura, dict[str, Decimal]]:
        kwh_dia_total = {d: dict(v) for d, v in kwh_dia.items()}
        coste_total = dict(coste)
        for h in futuras:
            kwh = ajuste.aplicar(_kwh_previsto(perfil, h) * escala)
            dia = kwh_dia_total.setdefault(h.inicio.date(), dict.fromkeys(PERIODOS, Decimal(0)))
            dia[h.periodo] += kwh
            if h.pcb_mwh is not None and h.teu_mwh is not None:
                diferencial = h.pcb_mwh - h.teu_mwh
            else:
                diferencial = margen.get(h.periodo, margen_global)
            coste_total[h.periodo] += kwh * diferencial / 1000
        previstos = dict.fromkeys(PERIODOS, Decimal(0))
        for dia in kwh_dia_total.values():
            for p, v in dia.items():
                previstos[p] += v
        factura = calcular_factura(
            inicio=inicio,
            fin=corte,
            emision=emision,
            suministro=suministro,
            consumo=_a_tramos(inicio, corte, kwh_dia_total, tarifas, cambios),
            coste_energia=coste_total,
            arrastre_kwh=arrastre_kwh,
            tarifas=tarifas,
            cambios_suministro=cambios,
        )
        return factura, previstos

    prevision, previstos = _prevision(Decimal(1))
    baja = alta = None
    if futuras:
        bajo, alto = _escalas_rango(recientes, dias_perfil)
        baja = _prevision(bajo)[0].total
        alta = _prevision(alto)[0].total
    return Estimacion(
        inicio=inicio,
        corte=corte,
        emision=emision,
        hoy=hoy,
        acumulado=acumulado,
        prevision=prevision,
        kwh_medidos=medidos,
        kwh_previstos=previstos,
        prevision_baja=baja,
        prevision_alta=alta,
    )


def _escalas_rango(recientes: Sequence[HoraMedida], dias: int) -> tuple[Decimal, Decimal]:
    """Consumo diario de un día bajo y uno alto (percentiles 20 y 80) frente a la media."""
    if not recientes:
        return Decimal(1), Decimal(1)
    ultimo = max(m.inicio.date() for m in recientes)
    desde = ultimo - timedelta(days=dias - 1)
    por_dia: dict[date, Decimal] = {}
    horas: dict[date, int] = {}
    for m in recientes:
        dia = m.inicio.date()
        if dia >= desde:
            por_dia[dia] = por_dia.get(dia, Decimal(0)) + m.kwh
            horas[dia] = horas.get(dia, 0) + 1
    # Solo días completos (23, 24 o 25 horas): el día en curso falsearía el rango.
    valores = sorted(v for d, v in por_dia.items() if horas[d] >= 23)
    if not valores:
        return Decimal(1), Decimal(1)
    media = sum(valores, Decimal(0)) / len(valores)
    if not media:
        return Decimal(1), Decimal(1)

    def _percentil(q: Decimal) -> Decimal:
        return valores[min(len(valores) - 1, int(q * (len(valores) - 1)))]

    return _percentil(PERCENTILES_RANGO[0]) / media, _percentil(PERCENTILES_RANGO[1]) / media
