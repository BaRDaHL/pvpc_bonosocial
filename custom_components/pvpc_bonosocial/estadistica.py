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

import asyncio
import logging
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from homeassistant.core import CoreState, HomeAssistant
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


# Lo más que se espera al recorder antes de leer una estadística recién escrita.
ESPERA_RECORDER = 30
# Clave en hass.data: hay escrituras de estadísticas encoladas desde la última espera.
_PENDIENTE = f"{DOMAIN}_estadisticas_pendientes"
# Clave en hass.data: la sincronización con el recorder en curso (un futuro que comparten todos).
_ESPERA = f"{DOMAIN}_espera_recorder"
# Clave en hass.data: cuántas veces ha escrito esta integración cada estadística (la curva de
# Datadis, sobre todo). La caché del consumo horario (consumo.py) la vuelve a leer entera si cambia.
_GENERACIONES = f"{DOMAIN}_generacion_estadisticas"
# `sum` previo: primero se mira solo esta ventana; casi siempre la hora anterior está ahí.
VENTANA_SUMA_PREVIA = timedelta(days=2)


def generacion(hass: HomeAssistant, statistic_id: str) -> int:
    return hass.data.get(_GENERACIONES, {}).get(statistic_id, 0)


def marcar_cambiada(hass: HomeAssistant, statistic_id: str) -> None:
    """Apunta que la estadística ha cambiado (puede que en horas antiguas)."""
    generaciones = hass.data.setdefault(_GENERACIONES, {})
    generaciones[statistic_id] = generaciones.get(statistic_id, 0) + 1


def _encolar(hass: HomeAssistant, metadatos: dict, filas: list) -> None:
    """`async_add_external_statistics` apuntando que hay escrituras pendientes de guardar."""
    from homeassistant.components.recorder.statistics import async_add_external_statistics

    hass.data[_PENDIENTE] = True
    marcar_cambiada(hass, metadatos["statistic_id"])
    async_add_external_statistics(hass, metadatos, filas)


async def async_esperar_recorder(hass: HomeAssistant) -> None:
    """Espera a que el recorder guarde lo que tiene en cola antes de leer de la BD.

    `async_add_external_statistics` solo encola la importación: si justo después se lee el `sum`
    de la BD (p. ej. al cerrar un periodo y escribir el siguiente, o al reescribir uno cerrado y
    después el periodo en curso) se lee el de antes y la suma da un salto en el panel de Energía.

    Se encola una sincronización detrás de lo pendiente: el recorder procesa la cola en orden y la
    resuelve tras confirmar (commit) lo anterior. `Recorder.async_block_till_done` no basta: si la
    importación ya ha salido de la cola pero aún se está guardando, la cola está vacía y vuelve sin
    esperar. Con el recorder parado o atascado no se bloquea la actualización: tras
    `ESPERA_RECORDER` s se lee lo que haya.

    Todos los que llegan mientras esa sincronización sigue en marcha la esperan también (comparten el
    mismo futuro): si no, el segundo (p. ej. la caché del consumo de otro suministro) volvía sin
    esperar y leía de la BD antes del commit.
    """
    from homeassistant.components.recorder import get_instance

    # Solo hace falta esperar si esta integración ha encolado escrituras desde la última espera.
    # Sin esto, al arrancar HA (el recorder aún no procesa la cola) cada lectura esperaba los
    # 30 s enteros y el alta de la integración tardaba más de un minuto.
    if hass.state is not CoreState.running:
        return
    if hass.data.get(_PENDIENTE):
        instancia = get_instance(hass)
        if not instancia.is_alive():
            return
        hass.data[_PENDIENTE] = False
        try:
            from homeassistant.components.recorder.tasks import SynchronizeTask

            futuro: asyncio.Future[None] = hass.loop.create_future()
            instancia.queue_task(SynchronizeTask(futuro))
        except Exception:  # API interna del recorder: si cambia, lo público
            futuro = asyncio.ensure_future(instancia.async_block_till_done())
        hass.data[_ESPERA] = futuro
    espera: asyncio.Future[None] | None = hass.data.get(_ESPERA)
    if espera is None or espera.done():
        return
    try:
        async with asyncio.timeout(ESPERA_RECORDER):
            # `shield`: si a uno se le acaba el tiempo (o lo cancelan), los demás siguen esperando.
            await asyncio.shield(espera)
    except TimeoutError:
        _LOGGER.warning("El recorder no ha guardado la cola en %d s; se lee lo que haya", ESPERA_RECORDER)
        # Recorder atascado: los siguientes no vuelven a esperar a esta misma sincronización.
        if hass.data.get(_ESPERA) is espera:
            hass.data.pop(_ESPERA)


async def async_hay_datos(hass: HomeAssistant, statistic_id: str) -> bool:
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import get_last_statistics

    await async_esperar_recorder(hass)
    filas = await get_instance(hass).async_add_executor_job(
        get_last_statistics, hass, 1, statistic_id, False, {"sum"}
    )
    return bool(filas.get(statistic_id))


async def async_suma_previa(hass: HomeAssistant, statistic_id: str, antes_de: datetime) -> Decimal:
    """`sum` de la última hora anterior a `antes_de` (0 si no hay).

    Se mira primero en los últimos `VENTANA_SUMA_PREVIA` (unas 48 filas) y solo si ahí no hay
    ninguna, en los 400 días de antes (hasta 9.600 filas): el resultado es el mismo."""
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import statistics_during_period

    await async_esperar_recorder(hass)
    for ventana in (VENTANA_SUMA_PREVIA, timedelta(days=400)):
        filas = await get_instance(hass).async_add_executor_job(
            statistics_during_period,
            hass,
            antes_de - ventana,
            antes_de,
            {statistic_id},
            "hour",
            None,
            {"sum"},
        )
        previas = [f for f in filas.get(statistic_id, []) if f.get("sum") is not None]
        if previas:
            return Decimal(str(previas[-1]["sum"]))
    return Decimal(0)


async def async_copiar_pasado(
    hass: HomeAssistant, statistic_id: str, nombre: str, origen: str, hasta: datetime
) -> Decimal | None:
    """Copia el coste horario de una entidad (el «coste hoy» de la v0.2) antes de `hasta`.

    Así, al cambiar el panel de Energía a la estadística nueva, no se pierde el pasado.
    """
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import (
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
    _encolar(hass, _metadatos(statistic_id, nombre), nuevas)
    return suma


async def async_escribir(
    hass: HomeAssistant,
    statistic_id: str,
    nombre: str,
    coste_horas: Mapping[datetime, Decimal],
    copiar_de: str | None = None,
    escritas: dict[datetime, tuple[float, float]] | None = None,
) -> int:
    """Reescribe las horas del periodo en curso. Devuelve cuántas filas ha escrito.

    `copiar_de`: entidad cuyo coste horario se copia antes, si la estadística está vacía.
    `escritas`: lo que se escribió la vez anterior (hora → (state, sum)). Solo se escriben las horas
    que han cambiado, y se actualiza con lo escrito. La estadística queda igual que reescribiéndolas
    todas.
    """
    if not coste_horas or "recorder" not in hass.config.components:
        return 0

    horas = sorted(coste_horas)
    copiado = None
    if copiar_de and not await async_hay_datos(hass, statistic_id):
        # La suma copiada se usa tal cual: el recorder aún puede no haberla guardado.
        copiado = await async_copiar_pasado(hass, statistic_id, nombre, copiar_de, horas[0])
    suma = copiado if copiado is not None else await async_suma_previa(hass, statistic_id, horas[0])
    filas = []
    for t in horas:
        suma += coste_horas[t]
        fila = (float(coste_horas[t]), float(suma))
        if escritas is not None:
            if escritas.get(t) == fila:
                continue
            escritas[t] = fila
        filas.append({"start": t, "state": fila[0], "sum": fila[1]})
    if filas:
        _encolar(hass, _metadatos(statistic_id, nombre), filas)
    return len(filas)


async def async_reescribir_periodo(
    hass: HomeAssistant,
    statistic_id: str,
    nombre: str,
    coste_horas: Mapping[datetime, Decimal],
    metadatos: dict | None = None,
) -> Decimal:
    """Reescribe un periodo ya pasado y desplaza el `sum` de todas las horas posteriores.

    Solo se encolan las filas cuyo `state` o `sum` cambian respecto a lo que ya hay en la BD (la curva de
    Datadis se vuelve a pedir por meses enteros cada día y casi todo llega igual). Si no cambia ninguna,
    no se escribe nada (ni se marca la estadística como cambiada). La estadística queda igual que
    reescribiéndolas todas.

    Devuelve la diferencia aplicada a las horas posteriores.
    """
    if not coste_horas or "recorder" not in hass.config.components:
        return Decimal(0)
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import (
        statistics_during_period,
    )

    horas = sorted(coste_horas)
    ultima = horas[-1]
    # sum al final del periodo antes de reescribirlo
    await async_esperar_recorder(hass)
    filas = await get_instance(hass).async_add_executor_job(
        statistics_during_period, hass, horas[0], None, {statistic_id}, "hour", None, {"sum", "state"}
    )
    existentes = {datetime.fromtimestamp(f["start"], UTC): f for f in filas.get(statistic_id, [])}
    suma_previa = await async_suma_previa(hass, statistic_id, horas[0])
    # sum que tenían las horas posteriores como base: el de la última hora existente del periodo
    # (o el previo si el periodo no tenía ninguna, p. ej. datos importados de antes)
    antes = suma_previa
    for t, f in sorted(existentes.items()):
        if t <= ultima and f.get("sum") is not None:
            antes = Decimal(str(f["sum"]))
    # Las horas del periodo que no se reescriben (huecos, p. ej. días que Datadis rechazó) conservan
    # su valor, pero su `sum` se rehace: si no, la suma bajaría al llegar a ellas.
    huecos = {
        t: Decimal(str(f.get("state") or 0))
        for t, f in existentes.items()
        if horas[0] <= t <= ultima and t not in coste_horas and f.get("sum") is not None
    }
    nuevas = []
    suma = suma_previa
    for t in sorted({*horas, *huecos}):
        valor = coste_horas[t] if t in coste_horas else huecos[t]
        suma += valor
        nuevas.append({"start": t, "state": float(valor), "sum": float(suma)})
    delta = suma - antes
    for t, f in sorted(existentes.items()):
        if t > ultima and f.get("sum") is not None:
            nuevas.append(
                {"start": t, "state": f.get("state") or 0.0, "sum": float(Decimal(str(f["sum"])) + delta)}
            )
    cambiadas = [f for f in nuevas if not _igual(existentes.get(f["start"]), f)]
    if cambiadas:
        _encolar(hass, metadatos or _metadatos(statistic_id, nombre), cambiadas)
    return delta


def _igual(existente: Mapping | None, nueva: Mapping) -> bool:
    """La fila ya está en la BD con el mismo `state` y `sum` (escribirla no cambiaría nada)."""
    return (
        existente is not None
        and existente.get("state") == nueva["state"]
        and existente.get("sum") == nueva["sum"]
    )


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


# --- evolución de las facturas -----------------------------------------------------------


def id_facturas(estadistica_id: str) -> str:
    """`pvpc_bonosocial:facturas_<suministro>`, hermana de la de coste."""
    return estadistica_id.replace(":coste_", ":facturas_", 1)


def filas_facturas(cerradas: list[dict], zona) -> list[dict]:
    """Una fila por factura, en la primera hora de su periodo, con su importe (media = mín = máx).

    Con un gráfico de estadísticas en barras por mes sale una barra por factura con su importe
    real. Si dos periodos empiezan el mismo día (rectificativa), manda el más reciente.
    """
    filas: dict[datetime, float] = {}
    for c in sorted(cerradas, key=lambda x: x["fin"]):
        inicio = datetime.fromisoformat(c["inicio"]).date() + timedelta(days=1)
        t = datetime(inicio.year, inicio.month, inicio.day, tzinfo=zona).astimezone(UTC)
        filas[t] = float(Decimal(c["total"]))
    return [{"start": t, "mean": v, "min": v, "max": v} for t, v in sorted(filas.items())]


async def async_escribir_facturas(
    hass: HomeAssistant,
    estadistica_id: str,
    nombre: str,
    cerradas: list[dict],
    zona,
    *,
    rehacer: bool = False,
) -> None:
    """Escribe (o reescribe) las horas de los periodos cerrados. No borra los anteriores que ya
    no se guardan, para que el gráfico conserve toda la evolución, salvo con `rehacer`: entonces
    se borra entera y se escribe de nuevo (un periodo sustituido por otro con otras fechas)."""
    from homeassistant.components.recorder.models import StatisticMeanType

    filas = filas_facturas(cerradas, zona)
    if not filas:
        return
    metadatos = {
        "source": DOMAIN,
        "statistic_id": id_facturas(estadistica_id),
        "name": f"Facturas ({nombre})",
        "unit_of_measurement": "EUR",
        "unit_class": None,
        "mean_type": StatisticMeanType.ARITHMETIC,
        "has_sum": False,
    }
    if rehacer:
        from homeassistant.components.recorder import get_instance

        get_instance(hass).async_clear_statistics([metadatos["statistic_id"]])
    _encolar(hass, metadatos, filas)
