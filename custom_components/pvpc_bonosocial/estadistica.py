"""Estadística externa de coste de cada suministro para el panel de Energía (DISENO §6.1).

`pvpc_bonosocial:coste_<suministro>` (EUR, con `sum`): una fila por hora con el coste
repartido de la factura (facturacion.repartir_coste). En cada actualización se reescribe
el periodo en curso desde su primera hora, así que cuando cambia la estimación (fracción
bonificada, precios publicados, horas que faltaban) el coste se corrige hacia atrás. Al
cerrarse el periodo, sus horas suman exactamente la factura cerrada.

El panel de Energía se cambia a esta estadística solo si el usuario acepta el aviso de
Repairs (`usar_estadistica_coste`): nunca automáticamente.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import slugify

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
ISSUE_PANEL = "usar_estadistica_coste"


def id_estadistica(nombre: str) -> str:
    return f"{DOMAIN}:coste_{slugify(nombre) or 'suministro'}"


def _metadatos(statistic_id: str, nombre: str) -> dict:
    from homeassistant.components.recorder.models import StatisticMeanType

    return {
        "source": DOMAIN,
        "statistic_id": statistic_id,
        "name": f"Coste PVPC + Bono Social ({nombre})",
        "unit_of_measurement": "EUR",
        "unit_class": None,
        "mean_type": StatisticMeanType.NONE,
        "has_sum": True,
    }


def metadatos_energia(statistic_id: str, nombre: str) -> dict:
    """Metadatos de una estadística externa de energía (kWh, con `sum`), p. ej. la de Datadis."""
    from homeassistant.components.recorder.models import StatisticMeanType

    return {
        "source": DOMAIN,
        "statistic_id": statistic_id,
        "name": nombre,
        "unit_of_measurement": "kWh",
        "unit_class": "energy",
        "mean_type": StatisticMeanType.NONE,
        "has_sum": True,
    }


async def async_hay_datos(hass: HomeAssistant, statistic_id: str) -> bool:
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import get_last_statistics

    filas = await get_instance(hass).async_add_executor_job(
        get_last_statistics, hass, 1, statistic_id, False, {"sum"}
    )
    return bool(filas.get(statistic_id))


async def async_suma_previa(hass: HomeAssistant, statistic_id: str, antes_de: datetime) -> Decimal:
    """`sum` de la última hora anterior a `antes_de` (0 si no hay)."""
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import statistics_during_period

    filas = await get_instance(hass).async_add_executor_job(
        statistics_during_period,
        hass,
        antes_de - timedelta(days=400),
        antes_de,
        {statistic_id},
        "hour",
        None,
        {"sum"},
    )
    previas = [f for f in filas.get(statistic_id, []) if f.get("sum") is not None]
    return Decimal(str(previas[-1]["sum"])) if previas else Decimal(0)


async def async_copiar_pasado(
    hass: HomeAssistant, statistic_id: str, nombre: str, origen: str, hasta: datetime
) -> Decimal | None:
    """Copia el coste horario de una entidad (el «coste hoy» de la v0.2) antes de `hasta`.

    Así, al cambiar el panel de Energía a la estadística nueva, no se pierde el pasado.
    """
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import (
        async_add_external_statistics,
        statistics_during_period,
    )

    filas = await get_instance(hass).async_add_executor_job(
        statistics_during_period, hass, hasta - timedelta(days=800), hasta, {origen}, "hour", None, {"change"}
    )
    suma = Decimal(0)
    nuevas = []
    for f in filas.get(origen, []):
        cambio = Decimal(str(f.get("change") or 0))
        if cambio < 0:  # reinicio diario mal resuelto: no resta
            cambio = Decimal(0)
        suma += cambio
        nuevas.append(
            {"start": datetime.fromtimestamp(f["start"], UTC), "state": float(cambio), "sum": float(suma)}
        )
    if not nuevas:
        return None
    async_add_external_statistics(hass, _metadatos(statistic_id, nombre), nuevas)
    return suma


async def async_escribir(
    hass: HomeAssistant,
    statistic_id: str,
    nombre: str,
    coste_horas: Mapping[datetime, Decimal],
    copiar_de: str | None = None,
) -> int:
    """Reescribe las horas del periodo en curso. Devuelve cuántas filas ha escrito.

    `copiar_de`: entidad cuyo coste horario se copia antes, si la estadística está vacía.
    """
    if not coste_horas or "recorder" not in hass.config.components:
        return 0
    from homeassistant.components.recorder.statistics import async_add_external_statistics

    horas = sorted(coste_horas)
    copiado = None
    if copiar_de and not await async_hay_datos(hass, statistic_id):
        # La suma copiada se usa tal cual: el recorder aún puede no haberla guardado.
        copiado = await async_copiar_pasado(hass, statistic_id, nombre, copiar_de, horas[0])
    suma = copiado if copiado is not None else await async_suma_previa(hass, statistic_id, horas[0])
    filas = []
    for t in horas:
        suma += coste_horas[t]
        filas.append({"start": t, "state": float(coste_horas[t]), "sum": float(suma)})
    async_add_external_statistics(hass, _metadatos(statistic_id, nombre), filas)
    return len(filas)


async def async_reescribir_periodo(
    hass: HomeAssistant,
    statistic_id: str,
    nombre: str,
    coste_horas: Mapping[datetime, Decimal],
    metadatos: dict | None = None,
) -> Decimal:
    """Reescribe un periodo ya pasado y desplaza el `sum` de todas las horas posteriores.

    Devuelve la diferencia aplicada a las horas posteriores.
    """
    if not coste_horas or "recorder" not in hass.config.components:
        return Decimal(0)
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import (
        async_add_external_statistics,
        statistics_during_period,
    )

    horas = sorted(coste_horas)
    ultima = horas[-1]
    # sum al final del periodo antes de reescribirlo
    filas = await get_instance(hass).async_add_executor_job(
        statistics_during_period, hass, horas[0], None, {statistic_id}, "hour", None, {"sum", "state"}
    )
    existentes = {datetime.fromtimestamp(f["start"], UTC): f for f in filas.get(statistic_id, [])}
    suma_previa = await async_suma_previa(hass, statistic_id, horas[0])
    antes = existentes.get(ultima, {}).get("sum")
    nuevas = []
    suma = suma_previa
    for t in horas:
        suma += coste_horas[t]
        nuevas.append({"start": t, "state": float(coste_horas[t]), "sum": float(suma)})
    delta = suma - Decimal(str(antes)) if antes is not None else Decimal(0)
    for t, f in sorted(existentes.items()):
        if t > ultima and f.get("sum") is not None:
            nuevas.append(
                {"start": t, "state": f.get("state") or 0.0, "sum": float(Decimal(str(f["sum"])) + delta)}
            )
    async_add_external_statistics(hass, metadatos or _metadatos(statistic_id, nombre), nuevas)
    return delta


async def async_revisar_panel(
    hass: HomeAssistant, subentry_id: str, nombre: str, fuente: str, statistic_id: str
) -> None:
    """Aviso de Repairs si el panel de Energía usa la fuente del suministro con otro coste."""
    try:
        from homeassistant.components.energy.data import async_get_manager

        gestor = await async_get_manager(hass)
    except Exception:
        return
    issue_id = f"{ISSUE_PANEL}_{subentry_id}"
    actual = coste_en_panel(gestor.data or {}, fuente)
    if actual is None or actual == statistic_id:
        ir.async_delete_issue(hass, DOMAIN, issue_id)
        return
    ir.async_create_issue(
        hass,
        DOMAIN,
        issue_id,
        is_fixable=True,
        severity=ir.IssueSeverity.WARNING,
        translation_key=ISSUE_PANEL,
        translation_placeholders={"suministro": nombre, "actual": actual or "—", "nueva": statistic_id},
        data={"subentry_id": subentry_id, "fuente": fuente, "estadistica": statistic_id},
    )


def _flujos_red(datos: Mapping) -> list[dict]:
    """Entradas de la red con medidor y coste, en el formato antiguo y en el de HA 2026."""
    out = []
    for fuente in datos.get("energy_sources", []):
        if fuente.get("type") != "grid":
            continue
        if "flow_from" in fuente:
            out += list(fuente["flow_from"])
        elif "stat_energy_from" in fuente:
            out.append(fuente)
    return out


def coste_en_panel(datos: Mapping, fuente: str) -> str | None:
    """Coste que usa el panel para el medidor `fuente`; None si el medidor no está en el panel."""
    for flujo in _flujos_red(datos):
        if flujo.get("stat_energy_from") == fuente:
            return flujo.get("stat_cost") or ""
    return None


async def async_usar_en_panel(hass: HomeAssistant, fuente: str, statistic_id: str) -> bool:
    """Pone la estadística como coste del medidor en el panel de Energía (lo pide el usuario)."""
    from homeassistant.components.energy.data import async_get_manager

    gestor = await async_get_manager(hass)
    fuentes = []
    cambiado = False
    for f in (gestor.data or {}).get("energy_sources", []):
        f = dict(f)
        if f.get("type") == "grid":
            if "flow_from" in f:
                flujos = []
                for flujo in f["flow_from"]:
                    flujo = dict(flujo)
                    if flujo.get("stat_energy_from") == fuente:
                        flujo.update(
                            stat_cost=statistic_id, entity_energy_price=None, number_energy_price=None
                        )
                        cambiado = True
                    flujos.append(flujo)
                f["flow_from"] = flujos
            elif f.get("stat_energy_from") == fuente:
                f.update(stat_cost=statistic_id, entity_energy_price=None, number_energy_price=None)
                cambiado = True
        fuentes.append(f)
    if cambiado:
        await gestor.async_update({"energy_sources": fuentes})
    return cambiado
