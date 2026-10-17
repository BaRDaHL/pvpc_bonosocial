"""Cliente mínimo de Datadis y lectura de su curva horaria (DISENO §5.1 C, F7).

Datadis da el consumo horario oficial del contador con el usuario y la contraseña del
titular. Es **opcional**: si no da datos o los da mal, todo sigue funcionando con el medidor.

- API privada de consumidores: `POST /nikola-auth/tokens/login` (formulario `username`,
  `password`; responde el token en texto) y `GET /api-private/api/get-supplies-v2` y
  `get-consumption-data-v2` con `Authorization: Bearer`. Fechas en `YYYY/MM`. Según la
  experiencia de otros clientes, una misma consulta solo una vez cada 24 h (429 si no).
- La respuesta trae `distributorError` con los avisos de la distribuidora; se enseñan en el
  detalle del error. Si un rango de varios meses llega vacío, se pide mes a mes (algunas
  distribuidoras fallan el rango entero por un mes roto, según e-data).
- Cada registro: `date` `YYYY/MM/DD`, `time` `HH:MM` con la **hora de fin** (`01:00`…`24:00`,
  `25:00` el día de 25 h), `consumptionKWh` y `obtainMethod` (`Real`/`Estimada`).
- Comprobaciones antes de usar nada: horas duplicadas, horas fuera del día y días copiados de
  otro (el export de sep-2026 del titular traía el 1-sep repetido 30 veces).
"""

from __future__ import annotations

import csv
import io
import logging
from collections import defaultdict
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any

import aiohttp

from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.historico import horas_del_dia, medianoche_utc

_LOGGER = logging.getLogger(__name__)
URL_LOGIN = "https://datadis.es/nikola-auth/tokens/login"
URL_API = "https://datadis.es/api-private/api"
TIMEOUT = aiohttp.ClientTimeout(total=180)  # Datadis tarda mucho a veces


class DatadisError(Exception):
    """Datadis no ha dado una respuesta útil."""


class CredencialesInvalidas(DatadisError):
    """Usuario o contraseña incorrectos."""


class DatadisNoResponde(DatadisError):
    """Caído, lento o con el límite de consultas agotado: se reintenta más tarde."""


# --- API --------------------------------------------------------------------------------


async def async_login(session: aiohttp.ClientSession, usuario: str, clave: str) -> str:
    try:
        async with session.post(
            URL_LOGIN, data={"username": usuario, "password": clave}, timeout=TIMEOUT
        ) as resp:
            texto = await resp.text()
            if resp.status == 200 and texto.strip():
                return texto.strip()
            if resp.status in (401, 403) or "credentials" in texto.lower():
                raise CredencialesInvalidas("Usuario o contraseña de Datadis incorrectos")
            raise DatadisNoResponde(f"Login: HTTP {resp.status}")
    except (TimeoutError, aiohttp.ClientError) as exc:
        raise DatadisNoResponde(f"Login: {exc}") from exc


async def _get(session: aiohttp.ClientSession, token: str, ruta: str, params: Mapping[str, Any]) -> Any:
    try:
        async with session.get(
            f"{URL_API}/{ruta}",
            params=dict(params),
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT,
        ) as resp:
            if resp.status == 401:
                raise CredencialesInvalidas("Token de Datadis rechazado")
            if resp.status != 200:
                raise DatadisNoResponde(f"{ruta}: HTTP {resp.status}")
            return await resp.json(content_type=None)
    except (TimeoutError, aiohttp.ClientError, ValueError) as exc:
        raise DatadisNoResponde(f"{ruta}: {exc}") from exc


def _lista(respuesta: Any, clave: str) -> list[dict]:
    """La v2 devuelve un objeto con la lista dentro; la v1, la lista directamente."""
    if isinstance(respuesta, list):
        return respuesta
    if isinstance(respuesta, dict):
        return list(respuesta.get(clave) or [])
    return []


async def async_suministros(session: aiohttp.ClientSession, token: str) -> list[dict]:
    return _lista(await _get(session, token, "get-supplies-v2", {}), "supplies")


@dataclass
class Respuesta:
    """Registros de una consulta de consumo y los avisos de la distribuidora (`distributorError`)."""

    registros: list[dict] = field(default_factory=list)
    errores: list[str] = field(default_factory=list)


def params_consumo(suministro: Mapping[str, Any], desde: date, hasta: date) -> dict[str, Any]:
    """Parámetros de la consulta: Datadis no deja repetir unos idénticos antes de 24 h."""
    return {
        "cups": suministro["cups"],
        "distributorCode": suministro["distributorCode"],
        "startDate": desde.strftime("%Y/%m"),
        "endDate": hasta.strftime("%Y/%m"),
        "measurementType": 0,
        "pointType": suministro.get("pointType", 5),
    }


def _errores_distribuidora(respuesta: Any) -> list[str]:
    if not isinstance(respuesta, dict):
        return []
    out = []
    for e in respuesta.get("distributorError") or []:
        if isinstance(e, dict):
            texto = e.get("errorDescription") or e.get("errorCode")
            if texto:
                nombre = e.get("distributorName")
                out.append(f"{nombre}: {texto}" if nombre else str(texto))
        elif e:
            out.append(str(e))
    return out


async def async_consumo(session: aiohttp.ClientSession, token: str, params: Mapping[str, Any]) -> Respuesta:
    datos = await _get(session, token, "get-consumption-data-v2", params)
    return Respuesta(_lista(datos, "timeCurve"), _errores_distribuidora(datos))


def meses(desde: date, hasta: date) -> list[date]:
    """Primer día de cada mes de `desde` a `hasta`, del más reciente al más antiguo."""
    mes, primero, out = hasta.replace(day=1), desde.replace(day=1), []
    while mes >= primero:
        out.append(mes)
        mes = (mes - timedelta(days=1)).replace(day=1)
    return out


# --- curva horaria ----------------------------------------------------------------------


@dataclass
class Curva:
    """kWh por hora (inicio en UTC) y los días descartados con su motivo."""

    horas: dict[datetime, Decimal] = field(default_factory=dict)
    rechazados: dict[date, str] = field(default_factory=dict)
    estimadas: int = 0  # horas que Datadis marca como estimadas (no lecturas reales)

    @property
    def ultimo_dia(self) -> date | None:
        return max(self.horas).astimezone(REFERENCE_TZ).date() if self.horas else None


def _fecha(texto: str) -> date:
    texto = texto.strip()
    for formato in ("%Y/%m/%d", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(texto, formato).date()
        except ValueError:
            continue
    raise ValueError(f"Fecha no reconocida: {texto!r}")


def _kwh(valor: Any) -> Decimal:
    if isinstance(valor, int | float):
        return Decimal(str(valor))
    texto = str(valor).strip()
    if "," in texto:  # coma decimal del CSV
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return Decimal(texto)
    except InvalidOperation as exc:
        raise ValueError(f"Consumo no numérico: {valor!r}") from exc


def curva(registros: Iterable[Mapping[str, Any]]) -> Curva:
    """Curva horaria a partir de registros de la API o del CSV, con las comprobaciones."""
    por_dia: dict[date, list[tuple[int, Decimal, bool]]] = defaultdict(list)
    out = Curva()
    for r in registros:
        try:
            dia = _fecha(r["date"])
            hora = int(str(r["time"]).split(":")[0])
            kwh = _kwh(r.get("consumptionKWh", 0))
        except (KeyError, ValueError) as exc:
            _LOGGER.debug("Datadis: registro descartado (%s): %s", exc, r)
            continue
        real = str(r.get("obtainMethod", "Real")).lower().startswith("real")
        por_dia[dia].append((hora, kwh, real))

    validos: dict[date, list[tuple[int, Decimal, bool]]] = {}
    for dia, horas in sorted(por_dia.items()):
        n = horas_del_dia(dia)
        numeros = [h for h, _, _ in horas]
        if len(set(numeros)) != len(numeros):
            out.rechazados[dia] = "horas repetidas"
        elif any(not 1 <= h <= n for h in numeros):
            out.rechazados[dia] = f"horas fuera de un día de {n} h"
        elif any(kwh < 0 for _, kwh, _ in horas):
            out.rechazados[dia] = "consumo negativo"
        else:
            validos[dia] = sorted(horas)

    # Días completos idénticos a otro: export corrupto (se descartan todas las copias).
    firmas: dict[tuple, list[date]] = defaultdict(list)
    for dia, horas in validos.items():
        if len(horas) == horas_del_dia(dia) and any(kwh for _, kwh, _ in horas):
            firmas[tuple(kwh for _, kwh, _ in horas)].append(dia)
    for dias in firmas.values():
        if len(dias) > 1:
            for dia in dias:
                out.rechazados[dia] = "día idéntico a otro"
                validos.pop(dia, None)

    for dia, horas in validos.items():
        inicio = medianoche_utc(dia)
        for hora, kwh, real in horas:
            out.horas[inicio + timedelta(hours=hora - 1)] = kwh
            out.estimadas += not real
    return out


def registros_csv(texto: str) -> list[dict[str, Any]]:
    """Registros del CSV que se descarga de datadis.es (`cups;fecha;hora;consumo_kWh;…`)."""
    lector = csv.reader(io.StringIO(texto.lstrip("﻿")), delimiter=";")
    filas = [f for f in lector if f and any(c.strip() for c in f)]
    if not filas:
        return []
    cabecera = [c.strip().lower() for c in filas[0]]

    def columna(*nombres: str) -> int | None:
        for nombre in nombres:
            for i, c in enumerate(cabecera):
                if c.startswith(nombre):
                    return i
        return None

    i_fecha, i_hora = columna("fecha", "date"), columna("hora", "time")
    i_kwh, i_metodo = columna("consumo", "ae_kwh", "consumptionkwh"), columna("metodo", "obtainmethod")
    if i_fecha is None or i_hora is None or i_kwh is None:
        raise ValueError("El CSV no tiene las columnas de fecha, hora y consumo de Datadis")
    return [
        {
            "date": f[i_fecha],
            "time": f[i_hora],
            "consumptionKWh": f[i_kwh],
            "obtainMethod": f[i_metodo] if i_metodo is not None and i_metodo < len(f) else "Real",
        }
        for f in filas[1:]
        if len(f) > max(i_fecha, i_hora, i_kwh)
    ]
