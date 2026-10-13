"""Resumen de precios por notificación (DISENO §8.3): datos, envío y programación.

El texto lo genera `resumen.py` (Python puro). Aquí se sacan los precios del histórico
(con el TEU para saber qué días son valle completo), el consumo y la factura del
suministro elegido, y se envía:

- a un chat de Telegram (entidad `notify` de `telegram_bot`): `telegram_bot.send_message`
  en Markdown, con el bot y el chat de la configuración de Telegram;
- a cualquier otra entidad `notify`: `notify.send_message`, en texto plano.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import UTC, date, datetime, time, timedelta
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later, async_track_time_change
from homeassistant.util import dt as dt_util

from .const import (
    CONF_COLOR_VALLE,
    CONF_DESTINO,
    CONF_DURACION_FRANJA,
    CONF_FRANJAS_HOY,
    CONF_FRANJAS_MANANA,
    CONF_HOY_ACTIVO,
    CONF_HOY_HORA,
    CONF_INCLUIR_CONSUMO,
    CONF_INCLUIR_FACTURA,
    CONF_MANANA_ACTIVO,
    CONF_MANANA_HORA,
    CONF_MOSTRAR_PERIODO,
    CONF_SUMINISTRO,
    DOMAIN,
    SUBENTRY_RESUMEN,
)
from .flujo_resumen import POR_DEFECTO
from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.aiopvpc.pvpc_tariff import _price_period_key
from .prices.festivos import es_festivo_p3
from .prices.historico import HistoricoPrecios
from .prices.periodos import periodos_del_dia
from .resumen import COLORES, DiaPrecios, Mensaje, Opciones, colores, texto_hoy, texto_manana

_LOGGER = logging.getLogger(__name__)
LABORABLES_REFERENCIA = 5
REINTENTO_MANANA = timedelta(minutes=10)
ULTIMO_REINTENTO = time(23, 0)


# --- datos ------------------------------------------------------------------------------


def dia_precios(historico: HistoricoPrecios, dia: date) -> DiaPrecios | None:
    """Precios de un día en €/kWh y si es valle completo (todas las horas en P3 por el TEU)."""
    precios = historico.dia(dia)
    if precios is None:
        return None
    inicios = [t.astimezone(REFERENCE_TZ) for t in precios.inicios_utc()]
    teu = (
        periodos_del_dia(dia, precios.teu, historico.tarifas) if historico.tarifas else [None] * len(inicios)
    )
    # Por el TEU publicado; si alguna hora no se puede interpretar, la regla de la tarifa.
    periodos = tuple(p or _price_period_key(local, False) for p, local in zip(teu, inicios, strict=True))
    valle = all(p == "P3" for p in periodos) if all(teu) else dia.isoweekday() >= 6 or es_festivo_p3(dia)
    return DiaPrecios(
        dia=dia,
        precios=tuple(p / 1000 for p in precios.pcb),
        horas=tuple(local.hour for local in inicios),
        valle=valle,
        periodos=periodos,
    )


def laborables_anteriores(historico: HistoricoPrecios, dia: date) -> list[DiaPrecios]:
    """Los 5 días más recientes antes de `dia` que no son valle completo (DISENO §8.2)."""
    out: list[DiaPrecios] = []
    d = dia
    for _ in range(31):
        d -= timedelta(days=1)
        previo = dia_precios(historico, d)
        if previo is not None and not previo.valle:
            out.append(previo)
            if len(out) == LABORABLES_REFERENCIA:
                break
    return out


def periodos_de(historico: HistoricoPrecios, dia: date) -> list[str] | None:
    """Periodo (P1/P2/P3) de cada hora del día para la tarjeta."""
    precios = dia_precios(historico, dia)
    return list(precios.periodos) if precios is not None else None


def codigos_de_color(historico: HistoricoPrecios, dia: date, regla: str = "laborables") -> list[int] | None:
    """Color de cada hora del día para la tarjeta (0 verde … 3 rojo), con la regla del resumen."""
    precios = dia_precios(historico, dia)
    if precios is None:
        return None
    referencias = {dia: laborables_anteriores(historico, dia)} if precios.valle else {}
    return [COLORES.index(c) for c in colores(precios, Opciones(color_valle=regla, referencias=referencias))]


def _posicion(dia: DiaPrecios | None, ahora: datetime) -> int:
    """Posición de la hora en curso dentro del día (en los días de 25 h cuenta la hora repetida)."""
    if dia is None:
        return 0
    inicio = datetime.combine(dia.dia, time(0), REFERENCE_TZ).astimezone(UTC)
    transcurrido = ahora.astimezone(UTC) - inicio  # en UTC: cuenta bien los cambios de hora
    return max(0, min(len(dia.precios) - 1, int(transcurrido.total_seconds()) // 3600))


def _opciones(datos: Mapping[str, Any], markdown: bool, idioma: str, historico, dias) -> Opciones:
    referencias = {d.dia: laborables_anteriores(historico, d.dia) for d in dias if d is not None and d.valle}
    return Opciones(
        franjas_hoy=int(datos[CONF_FRANJAS_HOY]),
        franjas_manana=int(datos[CONF_FRANJAS_MANANA]),
        duracion=int(datos[CONF_DURACION_FRANJA]),
        color_valle=datos[CONF_COLOR_VALLE],
        mostrar_periodo=bool(datos[CONF_MOSTRAR_PERIODO]),
        markdown=markdown,
        idioma="es" if idioma.startswith("es") else "en",
        referencias=referencias,
    )


def texto(
    hass: HomeAssistant, entry: ConfigEntry, datos: Mapping[str, Any], manana: bool, markdown: bool
) -> Mensaje | None:
    """Título y texto del resumen de hoy o de mañana (None si mañana aún no tiene precios)."""
    datos = {**POR_DEFECTO, **datos}
    coordinador = entry.runtime_data
    historico: HistoricoPrecios | None = getattr(coordinador, "historico", None)
    if historico is None:
        raise HomeAssistantError("Todavía no hay histórico de precios")
    ahora = dt_util.now(REFERENCE_TZ)
    hoy = dia_precios(historico, ahora.date())
    if not manana:
        opciones = _opciones(datos, markdown, hass.config.language, historico, [hoy])
        return texto_hoy(hoy, _posicion(hoy, ahora), opciones)
    siguiente = dia_precios(historico, ahora.date() + timedelta(days=1))
    opciones = _opciones(datos, markdown, hass.config.language, historico, [hoy, siguiente])
    consumo = factura = None
    facturacion = getattr(coordinador, "suministros", {}).get(datos.get(CONF_SUMINISTRO))
    if facturacion is not None and facturacion.data is not None:
        d = facturacion.data
        if datos[CONF_INCLUIR_CONSUMO]:
            consumo = (d.kwh_hoy, d.coste_hoy)
        if datos[CONF_INCLUIR_FACTURA] and d.estimacion is not None and d.estimacion.acumulado is not None:
            factura = (d.estimacion.acumulado.total, d.estimacion.prevision.total)
    return texto_manana(hoy, siguiente, _posicion(hoy, ahora), opciones, consumo, factura)


# --- envío ------------------------------------------------------------------------------


def destino_telegram(hass: HomeAssistant, entity_id: str) -> tuple[str, Any] | None:
    """(entrada del bot, ID del chat) si la entidad `notify` es un chat de Telegram."""
    registro = er.async_get(hass).async_get(entity_id)
    if registro is None or registro.platform != "telegram_bot" or not registro.config_entry_id:
        return None
    bot = hass.config_entries.async_get_entry(registro.config_entry_id)
    subentrada = bot.subentries.get(registro.config_subentry_id or "") if bot else None
    chat = subentrada.data.get("chat_id") if subentrada else None
    return (bot.entry_id, chat) if bot and chat is not None else None


async def async_mandar(
    hass: HomeAssistant,
    destino: str,
    titulo: str,
    cuerpo: str,
    telegram: tuple[str, Any] | None,
) -> None:
    """Envía un texto a una entidad `notify` (Markdown si es un chat de Telegram)."""
    if telegram is not None:
        bot, chat = telegram
        datos_envio = {
            "config_entry_id": bot,
            "chat_id": [chat],
            "title": titulo,
            "message": cuerpo,
            "parse_mode": "markdown",
        }
        try:
            await hass.services.async_call("telegram_bot", "send_message", datos_envio, blocking=True)
        except vol.Invalid:
            # Hasta que HA renombró `target` a `chat_id` (core#154868), solo vale `target`; desde la
            # 2026.9, solo `chat_id`.
            datos_envio["target"] = datos_envio.pop("chat_id")
            await hass.services.async_call("telegram_bot", "send_message", datos_envio, blocking=True)
    else:
        await hass.services.async_call(
            "notify",
            "send_message",
            {"entity_id": destino, "title": titulo, "message": cuerpo},
            blocking=True,
        )


async def async_enviar(
    hass: HomeAssistant, entry: ConfigEntry, datos: Mapping[str, Any], manana: bool
) -> bool:
    """Envía el resumen al destino. False si mañana aún no tiene precios."""
    destino = datos[CONF_DESTINO]
    telegram = destino_telegram(hass, destino)
    mensaje = texto(hass, entry, datos, manana, markdown=telegram is not None)
    if mensaje is None:
        return False
    await async_mandar(hass, destino, mensaje.titulo, mensaje.texto, telegram)
    return True


# --- programación -----------------------------------------------------------------------


def _hora(texto_hora: str) -> time:
    return time.fromisoformat(texto_hora)


@callback
def programar(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Envíos programados de cada resumen (07:00 y 21:05 por defecto)."""
    for sub in entry.subentries.values():
        if sub.subentry_type == SUBENTRY_RESUMEN:
            _programar_resumen(hass, entry, sub)


def _programar_resumen(hass: HomeAssistant, entry: ConfigEntry, sub: ConfigSubentry) -> None:
    datos = {**POR_DEFECTO, **sub.data}

    async def _enviar(manana: bool) -> bool:
        try:
            return await async_enviar(hass, entry, datos, manana)
        except Exception:
            _LOGGER.exception("%s: no se pudo enviar el resumen a %s", DOMAIN, datos[CONF_DESTINO])
            return True  # un fallo de envío no se reintenta

    async def _hoy(_ahora: datetime) -> None:
        await _enviar(False)

    async def _manana(_ahora: datetime) -> None:
        if await _enviar(True):
            return
        # ESIOS publica hacia las 20:20; si aún no está, otro intento en 10 minutos.
        if dt_util.now(REFERENCE_TZ).time() < ULTIMO_REINTENTO:
            entry.async_on_unload(async_call_later(hass, REINTENTO_MANANA, _manana))

    for activo, clave, funcion in (
        (CONF_HOY_ACTIVO, CONF_HOY_HORA, _hoy),
        (CONF_MANANA_ACTIVO, CONF_MANANA_HORA, _manana),
    ):
        if datos[activo]:
            h = _hora(datos[clave])
            entry.async_on_unload(
                async_track_time_change(hass, funcion, hour=h.hour, minute=h.minute, second=h.second)
            )
