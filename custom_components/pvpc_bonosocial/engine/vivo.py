"""Factura en tiempo real de un periodo abierto: acumulado y previsión al cierre (DISENO §5.2).

Python puro, sin HA. Recibe las horas ya medidas (kWh, periodo y precio de cada hora) y las
horas que faltan hasta el corte (periodo y, si ya se conoce, su precio), y devuelve:

- **acumulado**: la factura del periodo hasta hoy (fijos de los días transcurridos, con el
  día en curso entero) con el consumo medido;
- **previsión**: la factura completa al corte, sumando a lo medido una estimación de las
  horas que faltan (perfil reciente por hora del día y tipo de día) a su precio conocido o,
  si aún no se ha publicado, a la media reciente de su periodo.
- **pendientes** (v1.4): horas ya pasadas que la fuente aún no ha publicado (Datadis llega con
  1-5 días de retraso). No son 0 kWh: se estiman (mismo día de la semana y hora de las últimas
  semanas o, si no hay bastantes, el perfil) y entran en la previsión, en un acumulado
  provisional (`acumulado_estimado`) y en los kWh bonificables que quedan. El `acumulado` sigue
  siendo solo lo medido.

El IVA y el IEE son los de la fecha de emisión prevista (corte + días hasta la emisión).
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
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
    # Horas pendientes de publicar: acumulado con ellas estimadas y sus kWh (por periodo y por hora).
    acumulado_estimado: Factura | None = None
    kwh_pendientes: dict[str, Decimal] = field(default_factory=dict)
    kwh_pendientes_horas: dict[datetime, Decimal] = field(default_factory=dict)  # por inicio en UTC

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
        """Límite del periodo menos lo consumido; lo pendiente de publicar cuenta como consumido
        (estimado): si no, faltarían kWh y quedarían más bonificables de los que hay."""
        if not self.prevision.limite_kwh:
            return Decimal(0)
        usados = sum(self.kwh_medidos.values(), Decimal(0)) + sum(self.kwh_pendientes.values(), Decimal(0))
        return max(Decimal(0), Decimal(self.limite_kwh) - usados)


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


SEMANAS_PENDIENTE = 4  # mismo día de la semana y hora de las últimas semanas
MIN_MUESTRAS_PENDIENTE = 2


def estimar_pendientes(
    recientes: Sequence[HoraMedida],
    pendientes: Sequence[HoraFutura],
    perfil: dict[tuple[bool, int], Decimal],
    valle_todo_el_dia: dict[date, bool],
) -> dict[datetime, Decimal]:
    """kWh de cada hora pendiente de publicar (sin calibrar), por su inicio en UTC.

    La clave va en UTC: en el día de 25 h, las dos 02:00 locales (+02:00 y +01:00) son iguales como
    clave de diccionario (Python compara las horas de la misma zona sin mirar `fold`).

    Un día laborable: la media de la misma hora del mismo día de la semana en las últimas
    `SEMANAS_PENDIENTE` semanas (laborables), si hay al menos `MIN_MUESTRAS_PENDIENTE`. Si no (o si
    es sábado, domingo o festivo), el perfil por tipo de día y hora, como las horas futuras.
    """
    por_hora: dict[tuple[date, int], list[Decimal]] = {}
    for m in recientes:
        por_hora.setdefault((m.inicio.date(), m.inicio.hour), []).append(m.kwh)
    out: dict[datetime, Decimal] = {}
    for h in pendientes:
        muestras: list[Decimal] = []
        if not h.valle_todo_el_dia:
            for semanas in range(1, SEMANAS_PENDIENTE + 1):
                dia = h.inicio.date() - timedelta(days=7 * semanas)
                if not valle_todo_el_dia.get(dia, False):
                    muestras += por_hora.get((dia, h.inicio.hour), [])
        clave = h.inicio.astimezone(UTC)
        if len(muestras) >= MIN_MUESTRAS_PENDIENTE:
            out[clave] = sum(muestras, Decimal(0)) / len(muestras)
        else:
            out[clave] = _kwh_previsto(perfil, h)
    return out


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
    pendientes: Sequence[HoraFutura] = (),
) -> Estimacion:
    """Acumulado hasta hoy y previsión al corte de un periodo (`inicio` excluido).

    `historial` son horas medidas anteriores al periodo: solo sirven para el perfil de
    consumo (al principio del periodo hay pocos días propios). `pendientes` son horas ya
    pasadas del periodo sin dato todavía (posteriores a la última publicada): se estiman.
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

    base_pendientes = estimar_pendientes(recientes, pendientes, perfil, valle_todo_el_dia)

    # Lo que no depende de la escala se calcula una sola vez por hora (la previsión se suma tres veces:
    # media, baja y alta): (inicio en UTC, día, periodo, kWh base, diferencial PCB − TEU).
    def _preparar(horas: Sequence[HoraFutura]) -> list[tuple[datetime, date, str, Decimal, Decimal]]:
        out = []
        for h in horas:
            clave = h.inicio.astimezone(UTC)
            base = base_pendientes[clave] if clave in base_pendientes else _kwh_previsto(perfil, h)
            if h.pcb_mwh is not None and h.teu_mwh is not None:
                diferencial = h.pcb_mwh - h.teu_mwh
            else:
                diferencial = margen.get(h.periodo, margen_global)
            out.append((clave, h.inicio.date(), h.periodo, base, diferencial))
        return out

    horas_pendientes = _preparar(pendientes)
    horas_que_faltan = [*horas_pendientes, *_preparar(futuras)]

    def _sumar(
        horas: Sequence[tuple[datetime, date, str, Decimal, Decimal]],
        escala: Decimal,
        kwh_dia_total: dict[date, dict[str, Decimal]],
        coste_total: dict[str, Decimal],
        por_hora: dict[datetime, Decimal] | None = None,
    ) -> None:
        for inicio_h, dia_h, periodo, base, diferencial in horas:
            kwh = ajuste.aplicar(base * escala)
            if por_hora is not None:
                por_hora[inicio_h] = kwh
            dia = kwh_dia_total.get(dia_h)
            if dia is None:
                dia = kwh_dia_total[dia_h] = dict.fromkeys(PERIODOS, Decimal(0))
            dia[periodo] += kwh
            coste_total[periodo] += kwh * diferencial / 1000

    def _prevision(escala: Decimal) -> tuple[Factura, dict[str, Decimal]]:
        kwh_dia_total = {d: dict(v) for d, v in kwh_dia.items()}
        coste_total = dict(coste)
        _sumar(horas_que_faltan, escala, kwh_dia_total, coste_total)
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
    acumulado_estimado = None
    kwh_pendientes = dict.fromkeys(PERIODOS, Decimal(0)) if pendientes else {}
    kwh_pendientes_horas: dict[datetime, Decimal] = {}
    if pendientes:
        kwh_dia_est = {d: dict(v) for d, v in kwh_dia.items()}
        coste_est = dict(coste)
        _sumar(horas_pendientes, Decimal(1), kwh_dia_est, coste_est, kwh_pendientes_horas)
        for clave, _dia, periodo, _base, _diferencial in horas_pendientes:
            kwh_pendientes[periodo] += kwh_pendientes_horas[clave]
        if fin_acumulado > inicio:
            acumulado_estimado = calcular_factura(
                inicio=inicio,
                fin=fin_acumulado,
                emision=emision,
                suministro=suministro,
                consumo=_a_tramos(inicio, fin_acumulado, kwh_dia_est, tarifas, cambios),
                coste_energia=coste_est,
                arrastre_kwh=arrastre_kwh,
                tarifas=tarifas,
                cambios_suministro=cambios,
            )
    baja = alta = None
    if futuras or pendientes:
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
        acumulado_estimado=acumulado_estimado,
        kwh_pendientes=kwh_pendientes,
        kwh_pendientes_horas=kwh_pendientes_horas,
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
