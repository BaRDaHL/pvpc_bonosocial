"""Comparativa de tarifas con lo pagado en los últimos 12 meses (DISENO §8 bis, F8).

Funciones puras (sin Home Assistant):

1. `ventana_12_meses`: elige los periodos de factura más recientes que cubren un año
   (facturas conciliadas o estimadas al cierre) y suma lo pagado y los kWh por periodo.
2. `consulta_anual`: los kWh por periodo llevados a 365 días, que se mandan a la CNMC.
3. `comparar`: lo pagado (llevado a 365 días; sin bono si hoy ya no se tiene) frente a cada
   oferta, ordenadas por el importe del primer año, con los avisos de bono social y de cobertura.

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
AVISO_BONO_PERDIDO = "bono_perdido"  # hoy sin bono y la ventana se pagó con él
AVISO_BONO_NUEVO = "bono_nuevo"  # hoy con bono y parte de la ventana se pagó sin él
AVISO_COBERTURA = "cobertura_incompleta"
AVISO_EXTRAPOLADO = "datos_extrapolados"
AVISO_ESTIMADAS = "facturas_estimadas"
AVISO_SIN_OFERTAS = "sin_ofertas"
AVISO_BONO_TERMICO = "bono_termico"  # con bono: cambiar antes del 31-dic pierde el térmico del año siguiente
AVISO_PREVISION_VOLATIL = "prevision_volatil"  # la previsión de la CNMC sale de los futuros
AVISO_REVISION_PRECIOS = "revision_precios"  # la mejor oferta revisa su precio cada cierto tiempo

# Orden en que se muestran (José, 9-nov): bono, térmico, previsión, cobertura, días, revisión.
ORDEN_AVISOS = (
    AVISO_PIERDE_BONO,
    AVISO_BONO_PERDIDO,
    AVISO_BONO_NUEVO,
    AVISO_BONO_TERMICO,
    AVISO_PREVISION_VOLATIL,
    AVISO_COBERTURA,
    AVISO_EXTRAPOLADO,
    AVISO_ESTIMADAS,
    AVISO_REVISION_PRECIOS,
    AVISO_SIN_OFERTAS,
)
# El del térmico solo de agosto a diciembre: es cuando cambiar de comercializadora lo hace perder.
MES_DESDE_BONO_TERMICO = 8


def bono_termico_en_plazo(hoy: date | None) -> bool:
    """Si toca avisar del bono térmico: de agosto a diciembre (sin fecha, siempre)."""
    return hoy is None or hoy.month >= MES_DESDE_BONO_TERMICO


def ordenar_avisos(avisos: Sequence[str]) -> list[str]:
    """Los avisos en el orden de ORDEN_AVISOS; los desconocidos, al final en su orden."""
    return sorted(avisos, key=lambda a: ORDEN_AVISOS.index(a) if a in ORDEN_AVISOS else len(ORDEN_AVISOS))

# Conclusión de la comparativa.
VEREDICTO_QUEDARSE_CON_BONO = "quedarse_con_bono"  # con bono, ninguna oferta libre mejora lo pagado
VEREDICTO_LIBRE_PIERDE_BONO = (
    "libre_aunque_pierde_bono"  # hay una oferta libre más barata pese a perder el bono
)
VEREDICTO_LIBRE = "mercado_libre"  # sin bono: hay una oferta más barata que lo pagado
VEREDICTO_QUEDARSE = "quedarse"  # sin bono: ninguna oferta mejora lo pagado
# Con los precios del último año sale una cosa y con la previsión de la CNMC la contraria.
VEREDICTO_DEPENDE_PRECIOS = "depende_precios"


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
    bono: bool | None = None  # el contrato de hoy tiene bono (lo fija el comparador)

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
        # Por el contrato de hoy, no por la estimación: un periodo sin curva horaria deja
        # `pagado_sin_bono` en None y no por eso se puede callar que el bono se pierde; y quien
        # ya no lo tiene no lo pierde aunque lo tuviera antes.
        if self.bono is not None:
            return self.bono
        return self.pagada_con_bono

    @property
    def pagada_con_bono(self) -> bool:
        """Lo pagado en la ventana lleva bono (sale más barato que el PVPC sin bono)."""
        return self.pagado_sin_bono is not None and self.pagado_sin_bono > self.pagado

    @property
    def periodos_sin_bono(self) -> int:
        """Periodos de la ventana que se pagaron sin bono (con estimación sin bono igual)."""
        return sum(1 for p in self.periodos if p.total_sin_bono is not None and p.total_sin_bono <= p.total)

    @property
    def referencia_anual(self) -> Decimal:
        """Con qué se comparan las ofertas: lo pagado o, si hoy ya no hay bono, lo que se habría
        pagado sin él (es lo que se pagará desde ahora en el PVPC)."""
        if not self.con_bono and self.pagada_con_bono:
            return self.pagado_sin_bono_anual  # type: ignore[return-value]
        return self.pagado_anual


@dataclass(frozen=True)
class Alternativa:
    oferta: OfertaCnmc
    ahorro_primer_anio: Decimal  # positivo: la oferta sale más barata que lo pagado
    ahorro_segundo_anio: Decimal
    # Frente a la previsión de la CNMC para los próximos 12 meses (con bono si hoy se tiene).
    ahorro_prevision: Decimal | None = None


@dataclass(frozen=True)
class Comparativa:
    ventana: Ventana
    kwh_anuales: dict[str, int]
    alternativas: tuple[Alternativa, ...]  # mercado libre, de la más barata a la más cara
    pvpc_cnmc: Decimal | None  # la CNMC: el PVPC (sin bono) con los precios del último año
    total_ofertas: int
    grandes_ausentes: tuple[str, ...]
    avisos: tuple[str, ...] = field(default_factory=tuple)
    # La CNMC da dos PVPC: el «Histórico» (último año, tipo PVPC) y su previsión para el año que
    # viene (tipo COR), que es la que encabeza su web.
    pvpc_cnmc_prevision: Decimal | None = None
    # Esa previsión con el bono de hoy, al % de bono que regirá en esos 12 meses.
    pvpc_cnmc_prevision_bono: Decimal | None = None
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


def prevision_con_bono(
    ventana: Ventana, prevision: Decimal, pct_ventana: Decimal | None, pct_prevision: Decimal | None
) -> Decimal | None:
    """La previsión del PVPC (sin bono) con el bono de hoy.

    El bono rebaja un % de la parte con derecho (potencia y kWh hasta el tope): en la ventana, lo
    pagado frente a lo que se habría pagado sin bono da el descuento efectivo, que ya lleva el tope.
    Ese descuento se escala al % que regirá en los próximos 12 meses (prorrateado por días: el
    42,5 % de 2026 baja al 35 % en 2027 si no se prorroga). Sin los % del bono, el de la ventana.
    """
    if not ventana.con_bono or not ventana.pagada_con_bono or not ventana.pagado_sin_bono_anual:
        return None
    efectivo = 1 - ventana.pagado_anual / ventana.pagado_sin_bono_anual
    if pct_ventana and pct_prevision:
        efectivo = efectivo * pct_prevision / pct_ventana
    return _euros(prevision * (1 - efectivo))


def comparar(
    ventana: Ventana,
    ofertas: Sequence[OfertaCnmc],
    *,
    pct_bono_ventana: Decimal | None = None,
    pct_bono_prevision: Decimal | None = None,
    hoy: date | None = None,
) -> Comparativa:
    pagado = ventana.referencia_anual
    libres = [o for o in ofertas if not o.es_pvpc]
    # La CNMC da el PVPC del último año (tipo «PVPC», «PVPC Histórico») y su previsión para los
    # próximos 12 meses (tipo «COR»). Cada uno por su tipo: si falta uno, no se toma el otro por él.
    pvpc = next((o for o in ofertas if o.es_pvpc and o.tipo == "PVPC"), None)
    prevision = next((o for o in ofertas if o.es_pvpc and o.tipo != "PVPC"), None)
    prevision_bono = (
        prevision_con_bono(ventana, prevision.importe_primer_anio, pct_bono_ventana, pct_bono_prevision)
        if prevision
        else None
    )
    # Lo que costaría seguir en el PVPC los próximos 12 meses según la CNMC: con el bono si hoy se
    # tiene (y se puede calcular); sin él, la previsión tal cual.
    futuro = prevision_bono if ventana.con_bono else (prevision.importe_primer_anio if prevision else None)
    alternativas = tuple(
        Alternativa(
            o,
            _euros(pagado - o.importe_primer_anio),
            _euros(pagado - o.importe_segundo_anio),
            _euros(futuro - o.importe_primer_anio) if futuro is not None else None,
        )
        for o in sorted(libres, key=lambda o: (o.importe_primer_anio, o.id))
    )
    ausentes = tuple(grandes_ausentes(list(ofertas)))
    avisos = []
    if ventana.con_bono:
        avisos.append(AVISO_PIERDE_BONO)
        if ventana.periodos_sin_bono:
            avisos.append(AVISO_BONO_NUEVO)
    elif ventana.pagada_con_bono:
        avisos.append(AVISO_BONO_PERDIDO)
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
        mejor = alternativas[0]
        mejora = mejor.ahorro_primer_anio > 0
        if ventana.con_bono:
            veredicto = VEREDICTO_LIBRE_PIERDE_BONO if mejora else VEREDICTO_QUEDARSE_CON_BONO
        else:
            veredicto = VEREDICTO_LIBRE if mejora else VEREDICTO_QUEDARSE
        # Si la previsión de la CNMC dice lo contrario que el último año, no hay veredicto firme.
        if mejor.ahorro_prevision is not None and (mejor.ahorro_prevision > 0) != mejora:
            veredicto = VEREDICTO_DEPENDE_PRECIOS
        if mejor.oferta.revision:
            avisos.append(AVISO_REVISION_PRECIOS)
    if futuro is not None:
        avisos.append(AVISO_PREVISION_VOLATIL)
    if ventana.con_bono and bono_termico_en_plazo(hoy):
        avisos.append(AVISO_BONO_TERMICO)
    return Comparativa(
        ventana=ventana,
        kwh_anuales=consulta_anual(ventana),
        alternativas=alternativas,
        pvpc_cnmc=pvpc.importe_primer_anio if pvpc else None,
        pvpc_cnmc_prevision=prevision.importe_primer_anio if prevision else None,
        pvpc_cnmc_prevision_bono=prevision_bono,
        total_ofertas=len(libres),
        grandes_ausentes=ausentes,
        avisos=tuple(ordenar_avisos(avisos)),
        veredicto=veredicto,
    )
