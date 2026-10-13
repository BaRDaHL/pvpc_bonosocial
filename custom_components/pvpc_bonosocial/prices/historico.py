"""Histórico propio de precios horarios: PCB y TEU de cada hora (archivo 70 de ESIOS).

Sirve para recalcular facturas (el «coste de la energía» es Σ kWh·(PCB − TEU)), para
saber el periodo real de cada hora y para la regla de colores (DISENO §3.4). Se descarga
siempre del archivo 70 público, con token o sin él, y se guarda en un Store (~400 días,
unos 100 KB). Los valores se guardan como texto para no perder decimales.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from ..const import DOMAIN
from ..engine import Tarifas
from .aiopvpc.const import REFERENCE_TZ, URL_PUBLIC_PVPC_RESOURCE, UTC_TZ
from .periodos import periodos_del_dia

_LOGGER = logging.getLogger(__name__)

STORE_VERSION = 1
DIAS_CONSERVADOS = 400
# Descargas de días pasados por ciclo de actualización (cada 30 min): el relleno inicial
# de 400 días se completa en unas 15 horas sin cargar a ESIOS.
MAX_RELLENO_POR_CICLO = 14
# REE publica los precios del día siguiente hacia las 20:15.
HORA_PUBLICACION = time(20, 15)
TIMEOUT = aiohttp.ClientTimeout(total=20)

# Clave del precio y claves aceptadas del TEU por zona (el formato antiguo usaba «TEU»).
CLAVES_ZONA: dict[str, tuple[str, tuple[str, ...]]] = {
    "PCB": ("PCB", ("TEUPCB", "TEU")),
    "CYM": ("CYM", ("TEUCYM", "TEU")),
}


class FormatoInesperado(ValueError):
    """El archivo 70 no tiene la forma esperada."""


@dataclass(frozen=True)
class PreciosDia:
    """Precios de un día en €/MWh, en orden de hora (23, 24 o 25 valores)."""

    dia: date
    pcb: tuple[Decimal, ...]
    teu: tuple[Decimal, ...]

    def inicios_utc(self) -> list[datetime]:
        inicio = medianoche_utc(self.dia)
        return [inicio + timedelta(hours=i) for i in range(len(self.pcb))]


def medianoche_utc(dia: date) -> datetime:
    return datetime.combine(dia, time(0), REFERENCE_TZ).astimezone(UTC_TZ)


def horas_del_dia(dia: date) -> int:
    return int((medianoche_utc(dia + timedelta(days=1)) - medianoche_utc(dia)).total_seconds()) // 3600


def _decimal(texto: str) -> Decimal:
    texto = texto.strip()
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return Decimal(texto)
    except InvalidOperation as exc:
        raise FormatoInesperado(f"Valor no numérico: {texto!r}") from exc


def parsear_archivo70(datos: Mapping[str, Any], dia: date, zona: str = "PCB") -> PreciosDia | None:
    """Precios de un día del archivo 70, o None si todavía no está publicado."""
    filas = datos.get("PVPC") if isinstance(datos, Mapping) else None
    if not filas:
        return None
    clave_precio, claves_teu = CLAVES_ZONA[zona]
    primera = filas[0]
    clave_teu = next((c for c in claves_teu if c in primera), None)
    if clave_precio not in primera or clave_teu is None:
        raise FormatoInesperado(f"Faltan las claves {clave_precio}/{claves_teu[0]}: {sorted(primera)}")
    fecha = primera.get("Dia")
    if fecha and datetime.strptime(fecha, "%d/%m/%Y").date() != dia:
        raise FormatoInesperado(f"Archivo del {fecha} al pedir el {dia.isoformat()}")
    esperadas = horas_del_dia(dia)
    if len(filas) != esperadas:
        raise FormatoInesperado(f"{dia.isoformat()}: {len(filas)} horas y se esperaban {esperadas}")
    return PreciosDia(
        dia=dia,
        pcb=tuple(_decimal(f[clave_precio]) for f in filas),
        teu=tuple(_decimal(f[clave_teu]) for f in filas),
    )


class HistoricoPrecios:
    """Histórico de PCB y TEU por hora, persistido en un Store."""

    def __init__(self, hass: HomeAssistant, zona: str, tarifas: Tarifas | None) -> None:
        self.hass = hass
        self.zona = zona
        self.tarifas = tarifas
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{DOMAIN}.historico_precios_{zona.lower()}"
        )
        self._dias: dict[date, PreciosDia] = {}
        self._periodos: dict[datetime, str | None] = {}
        self._oyentes: list[Callable[[Sequence[date]], None]] = []
        # Días pasados que ESIOS no tiene o que no se pudieron leer: no se reintentan
        # hasta el siguiente arranque, para que el relleno no se atasque en ellos.
        self._sin_datos: set[date] = set()

    # --- consulta -------------------------------------------------------------------

    def dia(self, dia: date) -> PreciosDia | None:
        return self._dias.get(dia)

    def dias(self) -> list[date]:
        return sorted(self._dias)

    def periodo_publicado(self, inicio: datetime) -> str | None:
        """Periodo por el TEU de la hora que empieza en `inicio`, o None sin dato."""
        if inicio.tzinfo is None:
            return None
        clave = inicio.astimezone(UTC_TZ).replace(minute=0, second=0, microsecond=0)
        return self._periodos.get(clave)

    def al_actualizar(self, oyente: Callable[[Sequence[date]], None]) -> Callable[[], None]:
        """Avisa con los días nuevos tras cada actualización. Devuelve la baja."""
        self._oyentes.append(oyente)
        return lambda: self._oyentes.remove(oyente)

    # --- persistencia ---------------------------------------------------------------

    async def async_cargar(self) -> None:
        datos = await self._store.async_load() or {}
        for clave, valores in datos.get("dias", {}).items():
            try:
                dia = date.fromisoformat(clave)
                precios = PreciosDia(
                    dia=dia,
                    pcb=tuple(Decimal(v) for v in valores["pcb"]),
                    teu=tuple(Decimal(v) for v in valores["teu"]),
                )
            except (KeyError, TypeError, ValueError, InvalidOperation):
                _LOGGER.warning("Histórico de precios: día %s ilegible, se descarta", clave)
                continue
            if len(precios.pcb) == len(precios.teu) == horas_del_dia(dia):
                self._incorporar(precios)

    async def async_guardar(self) -> None:
        """Guarda ya (normalmente se guarda con 10 s de retraso tras cada actualización)."""
        await self._store.async_save(self._datos_store())

    async def async_borrar(self) -> None:
        await self._store.async_remove()

    def _datos_store(self) -> dict[str, Any]:
        return {
            "dias": {
                d.isoformat(): {"pcb": [str(v) for v in p.pcb], "teu": [str(v) for v in p.teu]}
                for d, p in sorted(self._dias.items())
            }
        }

    def _incorporar(self, precios: PreciosDia) -> None:
        self._dias[precios.dia] = precios
        if self.tarifas is None:
            return
        periodos = periodos_del_dia(precios.dia, precios.teu, self.tarifas)
        for inicio, periodo in zip(precios.inicios_utc(), periodos, strict=True):
            self._periodos[inicio] = periodo

    def _purgar(self, hoy: date) -> None:
        limite = hoy - timedelta(days=DIAS_CONSERVADOS)
        for dia in [d for d in self._dias if d < limite]:
            for inicio in self._dias.pop(dia).inicios_utc():
                self._periodos.pop(inicio, None)

    # --- descarga -------------------------------------------------------------------

    def pendientes(self, ahora: datetime) -> list[date]:
        """Días que faltan, por orden de interés: mañana (si ya se publicó), hoy y hacia atrás."""
        local = ahora.astimezone(REFERENCE_TZ)
        hoy = local.date()
        out = []
        manana = hoy + timedelta(days=1)
        if local.time() >= HORA_PUBLICACION and manana not in self._dias:
            out.append(manana)
        if hoy not in self._dias:
            out.append(hoy)
        pasados = [
            dia
            for dia in (hoy - timedelta(days=n) for n in range(1, DIAS_CONSERVADOS))
            if dia not in self._dias and dia not in self._sin_datos
        ]
        return out + pasados[:MAX_RELLENO_POR_CICLO]

    async def async_actualizar(self, session: aiohttp.ClientSession, ahora: datetime) -> list[date]:
        """Descarga los días pendientes. Devuelve los añadidos.

        Si ESIOS falla (red, bloqueo, 5xx) se para el ciclo: se reintenta en el siguiente.
        """
        hoy = ahora.astimezone(REFERENCE_TZ).date()
        nuevos: list[date] = []
        for dia in self.pendientes(ahora):
            try:
                datos = await self._descargar(session, dia)
            except (TimeoutError, aiohttp.ClientError) as exc:
                _LOGGER.debug("Histórico de precios: ESIOS no responde (%s); se reintentará", exc)
                break
            try:
                precios = parsear_archivo70(datos, dia, self.zona) if datos else None
            except FormatoInesperado as exc:
                _LOGGER.warning("Histórico de precios: archivo 70 inesperado (%s)", exc)
                precios = None
            if precios is None:
                if dia < hoy:
                    self._sin_datos.add(dia)
                continue  # hoy o mañana: se reintenta en el siguiente ciclo
            self._incorporar(precios)
            nuevos.append(dia)
        self._purgar(hoy)
        if nuevos:
            self._store.async_delay_save(self._datos_store, 10)
            for oyente in list(self._oyentes):
                oyente(nuevos)
        return nuevos

    async def _descargar(self, session: aiohttp.ClientSession, dia: date) -> dict[str, Any] | None:
        url = URL_PUBLIC_PVPC_RESOURCE.format(day=dia)
        async with session.get(url, timeout=TIMEOUT) as resp:
            if resp.status == 404:
                return None
            resp.raise_for_status()
            try:
                datos = await resp.json(content_type=None)
            except (ValueError, aiohttp.ContentTypeError):
                # Incapsula responde con HTML cuando bloquea: se trata como fallo de red.
                raise aiohttp.ClientPayloadError("Respuesta no JSON") from None
        return datos if isinstance(datos, dict) else None
