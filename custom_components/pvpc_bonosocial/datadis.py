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
- Cada registro: `date` `YYYY/MM/DD`, `time` `HH:MM` con la **hora de fin** (`01:00`…`24:00`),
  `consumptionKWh` y `obtainMethod` (`Real`/`Estimada`).
- Días de cambio de hora (sin documentación oficial accesible): se aceptan los dos formatos.
  Secuencial (`01:00`…`23:00` el día de 23 h y `01:00`…`25:00` el de 25 h) y **hora de reloj**
  (`01:00`, `03:00`…`24:00` el de 23 h, como la API de UFD según pvpc_energy; y una etiqueta
  repetida el de 25 h, que es lo que rechazó la instalación real el 25-oct-2026). En hora de reloj
  las horas se asignan por orden: de las dos repetidas, la primera en llegar es la de verano. Un día
  de 23 h con 24 valores (relleno en la hora que no existe) se acepta si el relleno vale 0; uno de
  25 h con las 24 etiquetas 01…24 trae las dos horas repetidas sumadas en la 02 (UFD, curva real de
  oct-2025 y oct-2026 bajada el 24-nov-2026: la 02 vale el doble que cualquier otra madrugada); se
  reparte a medias entre las dos y el día queda completo. Con menos valores se guarda sin la hora
  ambigua (queda un hueco, no se pierde el día).
- La fila suelta `00:00` a 0 que manda alguna distribuidora se descarta (no el día).
- Comprobaciones antes de usar nada: horas duplicadas, horas fuera del día y días copiados de
  otro (el export de sep-2026 del titular traía el 1-sep repetido 30 veces). El motivo de un día
  rechazado se guarda como código («horas_repetidas:1,2,2,3..23», con el patrón de etiquetas sin kWh
  para ver en el diagnóstico qué llegó) y se enseña en el idioma de HA con `texto_motivo`.
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


# Motivos de un día rechazado, por idioma. Se guardan como «código[:dato[:dato]]» (los datos son el
# número de horas del día o el patrón de etiquetas, sin texto) y se traducen al enseñarlos.
MOTIVOS_RECHAZO = {
    "es": {
        "fila_00_con_consumo": "fila 00:00 con consumo (etiquetas {0})",
        "consumo_negativo": "consumo negativo",
        "23h_con_24_valores": "23 h con 24 valores (etiquetas {0})",
        "horas_repetidas": "horas repetidas (etiquetas {0})",
        "fuera_de_dia": "horas fuera de un día de {0} h (etiquetas {1})",
        "dia_identico": "día idéntico a otro",
        "no_valido": "no válido",
    },
    "en": {
        "fila_00_con_consumo": "00:00 row with consumption (labels {0})",
        "consumo_negativo": "negative consumption",
        "23h_con_24_valores": "23 h day with 24 values (labels {0})",
        "horas_repetidas": "repeated hours (labels {0})",
        "fuera_de_dia": "hours outside a {0} h day (labels {1})",
        "dia_identico": "identical to another day",
        "no_valido": "not valid",
    },
    "ca": {
        "fila_00_con_consumo": "fila 00:00 amb consum (etiquetes {0})",
        "consumo_negativo": "consum negatiu",
        "23h_con_24_valores": "23 h amb 24 valors (etiquetes {0})",
        "horas_repetidas": "hores repetides (etiquetes {0})",
        "fuera_de_dia": "hores fora d'un dia de {0} h (etiquetes {1})",
        "dia_identico": "dia idèntic a un altre",
        "no_valido": "no vàlid",
    },
    "gl": {
        "fila_00_con_consumo": "fila 00:00 con consumo (etiquetas {0})",
        "consumo_negativo": "consumo negativo",
        "23h_con_24_valores": "23 h con 24 valores (etiquetas {0})",
        "horas_repetidas": "horas repetidas (etiquetas {0})",
        "fuera_de_dia": "horas fóra dun día de {0} h (etiquetas {1})",
        "dia_identico": "día idéntico a outro",
        "no_valido": "non válido",
    },
    "eu": {
        "fila_00_con_consumo": "00:00 errenkada kontsumoarekin (etiketak {0})",
        "consumo_negativo": "kontsumo negatiboa",
        "23h_con_24_valores": "23 orduko eguna 24 baliorekin (etiketak {0})",
        "horas_repetidas": "ordu errepikatuak (etiketak {0})",
        "fuera_de_dia": "{0} orduko egunetik kanpoko orduak (etiketak {1})",
        "dia_identico": "beste egun baten berdina",
        "no_valido": "ez da baliozkoa",
    },
}


def motivo(codigo: str, *datos: object) -> str:
    """Motivo de rechazo tal como se guarda: «código» o «código:dato:dato»."""
    return ":".join([codigo, *(str(d) for d in datos)])


def texto_motivo(guardado: str, idioma_: str) -> str:
    """El motivo guardado, en el idioma («es», «en», «ca», «gl» o «eu»).

    Un código desconocido (de otra versión) o un texto guardado por una versión anterior, que ya iba
    en castellano, se devuelve tal cual: nunca falla."""
    codigo, *datos = guardado.split(":")
    plantilla = MOTIVOS_RECHAZO.get(idioma_, MOTIVOS_RECHAZO["en"]).get(codigo)
    if plantilla is None:
        return guardado
    try:
        return plantilla.format(*datos)
    except (IndexError, KeyError):
        return guardado


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
    # Días de cambio de hora guardados sin alguna hora (la ambigua): quedan con un hueco.
    incompletos: dict[date, str] = field(default_factory=dict)
    horas_estimadas: set[datetime] = field(default_factory=set)  # marcadas «Estimada» por Datadis

    @property
    def estimadas(self) -> int:
        """Horas que Datadis marca como estimadas (no lecturas reales)."""
        return len(self.horas_estimadas)

    @property
    def ultimo_dia(self) -> date | None:
        return max(self.horas).astimezone(REFERENCE_TZ).date() if self.horas else None

    def horas_por_dia(self, horas: Iterable[datetime] | None = None) -> dict[date, int]:
        """Horas con dato de cada día (local)."""
        out: dict[date, int] = defaultdict(int)
        for t in self.horas if horas is None else horas:
            out[t.astimezone(REFERENCE_TZ).date()] += 1
        return dict(out)


def _fecha(texto: str) -> date:
    texto = texto.strip()
    for formato in ("%Y/%m/%d", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(texto, formato).date()
        except ValueError:
            continue
    raise ValueError(f"Fecha no reconocida: {texto!r}")


def _kwh(valor: Any) -> Decimal:
    if isinstance(valor, bool):  # bool es int: Decimal("True") lanzaría InvalidOperation
        raise ValueError(f"Consumo no numérico: {valor!r}")
    if isinstance(valor, int | float):
        texto = str(valor)
    else:
        texto = str(valor).strip()
        if "," in texto:  # coma decimal del CSV
            texto = texto.replace(".", "").replace(",", ".")
    try:
        numero = Decimal(texto)
    except (InvalidOperation, ArithmeticError) as exc:
        raise ValueError(f"Consumo no numérico: {valor!r}") from exc
    if not numero.is_finite():  # NaN/Infinity: rompería la curva y la estadística
        raise ValueError(f"Consumo no finito: {valor!r}")
    return numero


_Fila = tuple[int, int, Decimal, bool]  # (etiqueta, orden de llegada, kWh, real)


def _patron(etiquetas: list[int]) -> str:
    """Etiquetas ordenadas y compactadas («1,2,2,3..24») para el motivo de un rechazo."""
    cuenta: dict[int, int] = {}
    for e in etiquetas:
        cuenta[e] = cuenta.get(e, 0) + 1
    trozos: list[str] = []
    tramo: list[int] = []

    def cerrar() -> None:
        if len(tramo) > 2:
            trozos.append(f"{tramo[0]}..{tramo[-1]}")
        else:
            trozos.extend(str(e) for e in tramo)
        tramo.clear()

    for e in sorted(cuenta):
        if cuenta[e] > 1:
            cerrar()
            trozos.extend([str(e)] * cuenta[e])
            continue
        if tramo and e != tramo[-1] + 1:
            cerrar()
        tramo.append(e)
    cerrar()
    return ",".join(trozos)


def _por_posicion(filas: list[_Fila]) -> list[tuple[int, _Fila]]:
    """Desplazamiento (horas desde la medianoche) de cada fila en el orden (etiqueta, llegada)."""
    return list(enumerate(sorted(filas, key=lambda f: (f[0], f[1]))))


def _asignar(dia: date, filas: list[_Fila]) -> tuple[list[tuple[int, _Fila]] | None, str | None, bool]:
    """(desplazamiento de cada fila, motivo de rechazo, se ha reinterpretado un cambio de hora).

    Con un desplazamiento por fila, el día vale; con None, se rechaza por `motivo`.
    """
    n = horas_del_dia(dia)
    # Fila «00:00» suelta (i-DE, e-data #335): fuera si está a 0; con consumo, el día no se entiende.
    ceros = [f for f in filas if f[0] == 0]
    if ceros:
        if any(f[2] for f in ceros) or len(ceros) == len(filas):
            return None, motivo("fila_00_con_consumo", _patron([f[0] for f in filas])), False
        filas = [f for f in filas if f[0] != 0]
    etiquetas = [f[0] for f in filas]
    unicas = set(etiquetas)
    if any(f[2] < 0 for f in filas):
        return None, motivo("consumo_negativo"), False
    repetidas = len(unicas) != len(etiquetas)
    # Secuencial (01:00 … n:00): lo de siempre. Los días de cambio de hora que no lo son claramente
    # (23 h sin la etiqueta 2; 25 h sin la 25 pasada la hora repetida) se miran abajo.
    secuencial = not repetidas and all(1 <= e <= n for e in etiquetas)
    if n == 23 and 2 not in unicas and unicas - {1}:
        secuencial = False
    if n == 25 and 25 not in unicas and max(unicas) > 2:
        secuencial = False
    if secuencial:
        return [(e - 1, f) for e, f in zip(etiquetas, filas, strict=True)], None, False
    if n == 23 and not repetidas and all(1 <= e <= 24 for e in etiquetas):
        if 2 not in unicas:  # hora de reloj: 1, 3 … 24 (la de 02:00 a 03:00 no existe)
            return (
                [(e - 1 if e == 1 else e - 2, f) for e, f in zip(etiquetas, filas, strict=True)],
                None,
                True,
            )
        if len(filas) == 23 and set(range(1, 25)) - unicas <= {2, 3}:  # 1, 2, 4 … 24: por orden
            return _por_posicion(filas), None, True
        if len(filas) == 24:  # 1 … 24 con un relleno en la hora que no existe
            for relleno in (3, 2):
                fila = next(f for f in filas if f[0] == relleno)
                if not fila[2]:
                    return _por_posicion([f for f in filas if f is not fila]), None, True
            return None, motivo("23h_con_24_valores", _patron(etiquetas)), False
    if n == 25 and all(1 <= e <= 24 for e in etiquetas):
        dobles = [e for e in unicas if etiquetas.count(e) > 1]
        if len(dobles) == 1 and dobles[0] in (2, 3) and etiquetas.count(dobles[0]) == 2:
            # Hora de reloj con la hora repetida: por orden de etiqueta y de llegada.
            doble = dobles[0]
            out = []
            vista = False
            for f in sorted(filas, key=lambda x: (x[0], x[1])):
                if f[0] < doble:
                    out.append((f[0] - 1, f))
                elif f[0] == doble:
                    out.append((doble if vista else doble - 1, f))
                    vista = True
                else:
                    out.append((f[0], f))
            return out, None, True
        if not repetidas and unicas == set(range(1, 25)):
            # Hora de reloj con las dos horas repetidas sumadas en la 02 (lo que manda UFD): se reparte a
            # medias entre la de verano y la de invierno; el total del día no cambia.
            out = []
            for e, f in zip(etiquetas, filas, strict=True):
                if e == 2:
                    mitad = f[2] / 2
                    out += [(1, (e, f[1], mitad, f[3])), (2, (e, f[1], f[2] - mitad, f[3]))]
                else:
                    out.append((e - 1 if e < 2 else e, f))
            return out, None, True
        if not repetidas and 25 not in unicas and max(unicas) > 2:
            # Hora de reloj sin la repetida (menos de 24 valores): la hora de las 03:00 no se sabe si es
            # la de verano o la de invierno. Se guarda el resto y esa queda como hueco.
            out = [(e - 1 if e < 3 else e, f) for e, f in zip(etiquetas, filas, strict=True) if e != 3]
            return out, None, True
    if repetidas:
        return None, motivo("horas_repetidas", _patron(etiquetas)), False
    return None, motivo("fuera_de_dia", n, _patron(etiquetas)), False


def curva(registros: Iterable[Mapping[str, Any]]) -> Curva:
    """Curva horaria a partir de registros de la API o del CSV, con las comprobaciones."""
    por_dia: dict[date, list[_Fila]] = defaultdict(list)
    out = Curva()
    for orden, r in enumerate(registros):
        try:
            dia = _fecha(r["date"])
            hora = int(str(r["time"]).split(":")[0])
            kwh = _kwh(r.get("consumptionKWh", 0))
        except (KeyError, ValueError, TypeError) as exc:  # TypeError: registro que no es un objeto
            _LOGGER.debug("Datadis: registro descartado (%s): %s", exc, r)
            continue
        real = str(r.get("obtainMethod", "Real")).lower().startswith("real")
        por_dia[dia].append((hora, orden, kwh, real))

    validos: dict[date, list[tuple[int, Decimal, bool]]] = {}
    for dia, filas in sorted(por_dia.items()):
        asignadas, razon, reinterpretado = _asignar(dia, filas)
        if asignadas is None:
            out.rechazados[dia] = razon or motivo("no_valido")
            continue
        if reinterpretado:
            _LOGGER.info(
                "Datadis: día de cambio de hora %s leído como hora de reloj (%s)",
                dia,
                _patron([f[0] for f in filas]),
            )
        if len(asignadas) < horas_del_dia(dia) and reinterpretado:
            out.incompletos[dia] = _patron([f[0] for f in filas])
        validos[dia] = sorted((d, f[2], f[3]) for d, f in asignadas)

    # Días completos idénticos a otro: export corrupto (se descartan todas las copias).
    firmas: dict[tuple, list[date]] = defaultdict(list)
    for dia, horas in validos.items():
        if len(horas) == horas_del_dia(dia) and any(kwh for _, kwh, _ in horas):
            firmas[tuple(kwh for _, kwh, _ in horas)].append(dia)
    for dias in firmas.values():
        if len(dias) > 1:
            for dia in dias:
                out.rechazados[dia] = motivo("dia_identico")
                validos.pop(dia, None)

    for dia, horas in validos.items():
        inicio = medianoche_utc(dia)
        for desplazamiento, kwh, real in horas:
            t = inicio + timedelta(hours=desplazamiento)
            out.horas[t] = kwh
            if not real:
                out.horas_estimadas.add(t)
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
