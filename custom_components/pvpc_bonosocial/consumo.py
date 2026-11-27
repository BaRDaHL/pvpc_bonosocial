"""Consumo horario de un suministro leído de las estadísticas del recorder (DISENO §5.1).

- Fuente A, «sensor»: un sensor de energía de HA. Sus estadísticas largas tienen el mismo
  identificador que la entidad.
- Fuente B, «estadística»: una estadística externa (`dominio:objeto`) que otra integración
  importa con la curva horaria (por ejemplo, de Datadis).

En los dos casos se usa el tipo `change` de las estadísticas horarias: el consumo de cada
hora, ya con los reinicios del contador resueltos por HA.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
CUATRO_DECIMALES = Decimal("0.0001")
HORA = timedelta(hours=1)


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
        kwh = Decimal(str(cambio))
        if not kwh.is_finite():
            _LOGGER.debug("%s: consumo no finito a las %s (%s); se descarta", statistic_id, inicio, cambio)
            continue
        kwh = kwh.quantize(CUATRO_DECIMALES)
        if kwh < 0:
            _LOGGER.debug("%s: consumo negativo a las %s (%s kWh); se toma 0", statistic_id, inicio, kwh)
            kwh = Decimal(0)
        out[inicio] = kwh
    return out


# --- caché del consumo horario (ligereza) ------------------------------------------------------

# Horas ya leídas que se vuelven a pedir en cada lectura, por detrás de la última con dato: por si la
# fuente corrige lo último que publicó.
SOLAPE = timedelta(hours=24)
# Lo más atrás que se amplía la caché (desde el final de lo que cubre). Lo anterior (periodos viejos,
# una vez al día) se lee directamente, sin guardarlo en memoria.
MAX_COBERTURA = timedelta(days=100)


class ConsumoEnMemoria:
    """Consumo horario de una estadística, guardado en memoria entre actualizaciones.

    La factura en curso necesita el periodo entero más 27 días (unas 1.400 horas) cada 15 minutos,
    pero de una vez a otra solo cambia lo último. Cada lectura pide al recorder solo desde la última
    hora con dato menos `SOLAPE` (unas pocas filas) y el resto sale de la memoria. Se vuelve a leer
    todo:

    - una vez al día (la primera lectura de cada día);
    - si esta integración ha vuelto a escribir la estadística (la curva de Datadis rellena días
      antiguos): `estadistica.marcar_cambiada`;
    - al cerrar un periodo (`invalidar`).

    El resultado es el mismo que leerlo todo cada vez [el `change` de cada hora no depende de la
    ventana: HA lo calcula con el `sum` de la hora anterior aunque quede fuera]. Lo único que no ve al
    momento es otra integración corrigiendo horas antiguas de su estadística: lo ve al día siguiente.
    """

    def __init__(self, hass: HomeAssistant, statistic_id: str) -> None:
        self.hass = hass
        self.statistic_id = statistic_id
        self._kwh: dict[datetime, Decimal] = {}
        self._desde: datetime | None = None  # [desde, hasta) que cubre la memoria
        self._hasta: datetime | None = None
        self._generacion = -1
        self._dia: date | None = None  # día de la última lectura completa
        # `invalidar` solo sube este contador; la lectura lo compara dentro del candado. Así un cierre de
        # periodo a mitad de una lectura de otro (comparador, CNMC) no le deja la memoria a medias.
        self._invalidaciones = 0
        self._invalidaciones_leidas = 0
        self.lecturas_completas = 0
        # Una lectura a la vez: la factura y el comparador pueden leer a la vez fuera del candado del cierre.
        self._candado = asyncio.Lock()

    def invalidar(self) -> None:
        """La próxima lectura, entera. Se puede llamar con una lectura en curso (no toma el candado)."""
        self._invalidaciones += 1

    async def async_leer(self, desde: datetime, hasta: datetime, hoy: date) -> dict[datetime, Decimal]:
        """Lo mismo que `async_kwh_horarios(desde, hasta)`."""
        async with self._candado:
            return await self._async_leer(desde, hasta, hoy)

    async def _async_leer(self, desde: datetime, hasta: datetime, hoy: date) -> dict[datetime, Decimal]:
        from .estadistica import async_esperar_recorder, generacion

        generacion_actual = generacion(self.hass, self.statistic_id)
        invalidaciones = self._invalidaciones
        valida = (
            self._desde is not None
            and self._hasta is not None
            and self._invalidaciones_leidas == invalidaciones
            and self._generacion == generacion_actual
            and self._dia == hoy
        )
        if valida and desde < self._desde and desde < self._hasta - MAX_COBERTURA:
            return await async_kwh_horarios(self.hass, self.statistic_id, desde, hasta)
        if not valida:
            if self._generacion != generacion_actual:
                # Lo recién escrito por esta integración tiene que estar ya en la base de datos.
                await async_esperar_recorder(self.hass)
            self._kwh = await async_kwh_horarios(self.hass, self.statistic_id, desde, hasta)
            self._desde, self._hasta = desde, hasta
            self._generacion, self._dia = generacion_actual, hoy
            self._invalidaciones_leidas = invalidaciones
            self.lecturas_completas += 1
            return dict(self._kwh)
        if desde < self._desde:
            self._kwh.update(await async_kwh_horarios(self.hass, self.statistic_id, desde, self._desde))
            self._desde = desde
        ultima = max(self._kwh) if self._kwh else None
        cola = max(self._desde, min(self._hasta, ultima + HORA if ultima else self._desde) - SOLAPE)
        if hasta > cola:
            nuevos = await async_kwh_horarios(self.hass, self.statistic_id, cola, hasta)
            for t in [t for t in self._kwh if cola <= t < hasta]:
                if t not in nuevos:
                    del self._kwh[t]
            self._kwh.update(nuevos)
            self._hasta = max(self._hasta, hasta)
        return {t: self._kwh[t] for t in sorted(self._kwh) if desde <= t < hasta}
