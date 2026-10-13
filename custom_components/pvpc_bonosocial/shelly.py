"""Comprobación del consumo de HA con la memoria interna de un Shelly EM (opción C, F3).

El Shelly EM de 1.ª generación guarda en su memoria la energía de cada 10 minutos de casi
un año (`/emeter/<canal>/em_data.csv`, hora UTC de inicio de cada intervalo). Una vez al
día (o a la semana) se descarga, se agrupa por horas completas (6 intervalos) y se usa para
corregir las horas que a las estadísticas de HA les faltan o tienen mal (por ejemplo, si
HA estuvo parado y metió en una hora el consumo de varias).

Las estadísticas del sensor del Shelly en HA no se tocan: la corrección solo afecta a la
factura, al coste y a la estadística de coste de esta integración.
"""

from __future__ import annotations

import csv
import io
import logging
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation

import aiohttp

_LOGGER = logging.getLogger(__name__)

TIMEOUT_INFO = aiohttp.ClientTimeout(total=15)
TIMEOUT_CSV = aiohttp.ClientTimeout(total=600)  # el Shelly genera el CSV muy despacio
UMBRAL_HORA_KWH = Decimal("0.05")  # diferencia por hora a partir de la que se corrige
UMBRAL_DESACUERDO = Decimal("0.15")  # si difieren más de un 15 % en una semana, no se corrige
DIAS_CONSERVADOS = 70


class ShellyNoCompatible(Exception):
    """El aparato no es un Shelly EM de 1.ª generación."""


async def async_descargar(session: aiohttp.ClientSession, ip: str, canal: int) -> str:
    """CSV de energía del canal (0 o 1) de un Shelly EM de 1.ª generación."""
    base = f"http://{ip}"
    async with session.get(f"{base}/shelly", timeout=TIMEOUT_INFO) as resp:
        resp.raise_for_status()
        info = await resp.json(content_type=None)
    if info.get("gen") or info.get("type") not in ("SHEM", "SHEM-3"):
        raise ShellyNoCompatible(f"Modelo {info.get('type') or info.get('model')} (gen {info.get('gen', 1)})")
    async with session.get(f"{base}/emeter/{canal}/em_data.csv", timeout=TIMEOUT_CSV) as resp:
        resp.raise_for_status()
        return await resp.text()


def horas_completas(texto: str) -> dict[datetime, Decimal]:
    """kWh de cada hora UTC con sus 6 intervalos de 10 minutos (las demás se descartan)."""
    suma: dict[datetime, Decimal] = {}
    cuenta: dict[datetime, int] = {}
    vistos: set[datetime] = set()
    for fila in csv.reader(io.StringIO(texto)):
        if len(fila) < 2 or not fila[0][:2].isdigit():
            continue
        try:
            t = datetime.strptime(fila[0].strip(), "%Y-%m-%d %H:%M").replace(tzinfo=UTC)
            wh = Decimal(fila[1])
        except (ValueError, InvalidOperation):
            continue
        if t in vistos:  # la memoria es circular: no contar dos veces
            continue
        vistos.add(t)
        h = t.replace(minute=0)
        suma[h] = suma.get(h, Decimal(0)) + wh
        cuenta[h] = cuenta.get(h, 0) + 1
    return {h: (v / 1000).quantize(Decimal("0.0001")) for h, v in suma.items() if cuenta[h] == 6}


def recortar(horas: Mapping[datetime, Decimal], ahora: datetime) -> dict[datetime, Decimal]:
    limite = ahora - timedelta(days=DIAS_CONSERVADOS)
    return {h: v for h, v in horas.items() if h >= limite}


def desacuerdo(
    ha: Mapping[datetime, Decimal], shelly: Mapping[datetime, Decimal], ahora: datetime
) -> Decimal:
    """Diferencia relativa entre HA y el Shelly en los últimos 7 días comunes."""
    desde = ahora - timedelta(days=7)
    comunes = [h for h in shelly if h >= desde and h in ha]
    total = sum((shelly[h] for h in comunes), Decimal(0))
    if not total:
        return Decimal(0)
    return abs(sum((ha[h] for h in comunes), Decimal(0)) - total) / total


def corregir(
    ha: Mapping[datetime, Decimal], shelly: Mapping[datetime, Decimal]
) -> tuple[dict[datetime, Decimal], int]:
    """Consumo de HA con las horas que faltan o no cuadran sustituidas por las del Shelly."""
    out = dict(ha)
    cambiadas = 0
    for h, v in shelly.items():
        actual = out.get(h)
        if actual is None or abs(actual - v) > UMBRAL_HORA_KWH:
            out[h] = v
            cambiadas += 1
    return out, cambiadas
