"""Consumo horario de un suministro leído de las estadísticas del recorder (DISENO §5.1).

- Fuente A, «sensor»: un sensor de energía de HA. Sus estadísticas largas tienen el mismo
  identificador que la entidad.
- Fuente B, «estadística»: una estadística externa (`dominio:objeto`) que otra integración
  importa con la curva horaria (por ejemplo, de Datadis).

En los dos casos se usa el tipo `change` de las estadísticas horarias: el consumo de cada
hora, ya con los reinicios del contador resueltos por HA.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
CUATRO_DECIMALES = Decimal("0.0001")


async def async_kwh_horarios(
    hass: HomeAssistant, statistic_id: str, desde: datetime, hasta: datetime
) -> dict[datetime, Decimal]:
    """kWh de cada hora [desde, hasta) por su inicio en UTC. Las horas sin dato no aparecen."""
    if "recorder" not in hass.config.components:
        return {}
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import statistics_during_period

    filas = await get_instance(hass).async_add_executor_job(
        statistics_during_period,
        hass,
        desde,
        hasta,
        {statistic_id},
        "hour",
        {"energy": "kWh"},
        {"change"},
    )
    out: dict[datetime, Decimal] = {}
    for fila in filas.get(statistic_id, []):
        cambio = fila.get("change")
        if cambio is None:
            continue
        inicio = datetime.fromtimestamp(fila["start"], UTC)
        kwh = Decimal(str(cambio)).quantize(CUATRO_DECIMALES)
        if kwh < 0:
            _LOGGER.debug("%s: consumo negativo a las %s (%s kWh); se toma 0", statistic_id, inicio, kwh)
            kwh = Decimal(0)
        out[inicio] = kwh
    return out
