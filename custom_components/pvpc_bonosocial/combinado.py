"""Medidor + Datadis (fuente «ambos», v1.4): la curva oficial y el medidor para lo que aún no ha llegado.

Python puro, sin HA.

- En las horas que Datadis ya ha publicado manda Datadis (es el dato del contador, el de la factura).
- En las demás (la cola de 1-5 días que Datadis tarda en publicar, o un día que Datadis rechazó) se usa
  el medidor **calibrado contra Datadis**: kWh = α · medidor + γ, con α y γ ajustados por mínimos
  cuadrados (engine/calibracion.ajustar) con los días completos comunes más recientes. Es una base
  mucho más rica que una factura al mes.
- Si en esos días comunes Datadis y el medidor no cuadran (más de un `UMBRAL_DESACUERDO` de diferencia
  en total), se avisa; si la diferencia es tan grande que el ajuste no es creíble (fuera de
  `ALFA_VALIDO`), el medidor se usa sin calibrar.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import date, datetime, tzinfo
from decimal import Decimal

from .engine.calibracion import ALFA_VALIDO, PeriodoCalibracion, ajustar
from .engine.vivo import Ajuste

DIAS_CALIBRACION = 28  # días completos comunes que se usan como mucho (los más recientes)
MIN_DIAS_CALIBRACION = 3
UMBRAL_DESACUERDO = Decimal("0.10")  # ±10 % (DISENO §5.1: comprobación diaria con Datadis)


@dataclass
class Combinado:
    kwh: dict[datetime, Decimal]
    oficial_hasta: datetime | None  # inicio (UTC) de la última hora publicada por Datadis
    horas_medidor: set[datetime] = field(default_factory=set)  # horas que vienen del medidor
    ajuste: Ajuste | None = None  # calibración del medidor contra Datadis (None: sin calibrar)
    cociente: Decimal | None = None  # Datadis / medidor en los días comunes (None: sin días bastantes)
    dias_comunes: int = 0

    @property
    def desacuerdo(self) -> bool:
        return self.cociente is not None and abs(self.cociente - 1) > UMBRAL_DESACUERDO


def calibrar(
    oficial: Mapping[datetime, Decimal], medidor: Mapping[datetime, Decimal], zona: tzinfo
) -> tuple[Ajuste | None, Decimal | None, int]:
    """(ajuste, cociente Datadis/medidor, días usados) con los días en que las dos fuentes tienen
    las mismas horas (al menos 23). Sin `MIN_DIAS_CALIBRACION` días: (None, None, n)."""
    por_dia: dict[date, list[datetime]] = {}
    for t in oficial:
        por_dia.setdefault(t.astimezone(zona).date(), []).append(t)
    periodos: list[PeriodoCalibracion] = []
    for _dia, horas in sorted(por_dia.items()):
        if len(horas) < 23 or any(t not in medidor for t in horas):
            continue
        periodos.append(
            PeriodoCalibracion(
                sum((oficial[t] for t in horas), Decimal(0)),
                sum((medidor[t] for t in horas), Decimal(0)),
                len(horas),
            )
        )
    periodos = periodos[-DIAS_CALIBRACION:]
    if len(periodos) < MIN_DIAS_CALIBRACION:
        return None, None, len(periodos)
    medido = sum((p.kwh_medido for p in periodos), Decimal(0))
    if not medido:
        return None, None, len(periodos)
    cociente = sum((p.kwh_real for p in periodos), Decimal(0)) / medido
    if not ALFA_VALIDO[0] <= cociente <= ALFA_VALIDO[1]:
        return None, cociente, len(periodos)
    return ajustar(periodos), cociente, len(periodos)


def combinar(
    oficial: Mapping[datetime, Decimal],
    medidor: Mapping[datetime, Decimal],
    zona: tzinfo,
    calibracion: tuple[Ajuste | None, Decimal | None, int] | None = None,
) -> Combinado:
    """Curva fusionada: Datadis donde lo hay; el medidor calibrado en el resto.

    `calibracion`: la de `calibrar` ya calculada (solo cambia cuando Datadis publica días nuevos)."""
    ajuste, cociente, dias = calibracion if calibracion is not None else calibrar(oficial, medidor, zona)
    kwh = dict(oficial)
    del_medidor: set[datetime] = set()
    for t, v in medidor.items():
        if t in kwh:
            continue
        kwh[t] = max(Decimal(0), ajuste.aplicar(v)) if ajuste else v
        del_medidor.add(t)
    return Combinado(
        kwh=dict(sorted(kwh.items())),
        oficial_hasta=max(oficial) if oficial else None,
        horas_medidor=del_medidor,
        ajuste=ajuste,
        cociente=cociente,
        dias_comunes=dias,
    )
