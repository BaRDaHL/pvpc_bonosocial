"""Cuenta de Datadis (subentrada «Datadis», F7): descarga diaria y estadística de energía.

Una vez al día (Datadis no deja repetir la misma consulta antes de 24 h: se pide cada 24 h 10 min y un
registro común, que sobrevive a recrear la subentrada, impide repetir una idéntica) se descarga la curva
horaria desde unos días antes del último con datos y se escribe en la estadística externa
`pvpc_bonosocial:energia_datadis_<nombre>` (kWh, con `sum`). Esa estadística se puede elegir
como fuente de consumo de un suministro («estadística externa») o usar como referencia. Si
Datadis no da datos, no pasa nada: el sensor de estado lo dice y se sigue intentando cada día;
cuando vuelva, se rellena hacia atrás. También se pueden importar los CSV de datadis.es.
"""

from __future__ import annotations

import hashlib
import logging
from collections.abc import Iterable, Mapping
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util
from homeassistant.util import slugify

from .const import CONF_DATADIS_CLAVE, CONF_DATADIS_SUMINISTRO, CONF_DATADIS_USUARIO, DOMAIN
from .datadis import (
    CredencialesInvalidas,
    Curva,
    DatadisNoResponde,
    Respuesta,
    async_consumo,
    async_login,
    curva,
    meses,
    params_consumo,
)
from .estadistica import async_reescribir_periodo, metadatos_energia
from .prices.aiopvpc.const import REFERENCE_TZ

_LOGGER = logging.getLogger(__name__)
STORE_VERSION = 1
INTERVALO = timedelta(minutes=10)  # comprueba a menudo si toca (solo mira la hora); consulta una vez al día
ENTRE_CONSULTAS = timedelta(hours=24, minutes=10)  # Datadis exige 24 h entre consultas idénticas
TRAS_FALLO = timedelta(hours=3)
TRAS_LIMITE = timedelta(hours=24, minutes=10)
MISMA_CONSULTA = timedelta(hours=24)
ENTRE_MES_A_MES = timedelta(days=7)  # rango vacío: mes a mes como mucho una vez por semana
DIAS_SOLAPE = 7  # se vuelve a pedir la última semana por si Datadis la corrige
DIAS_PRIMERA_VEZ = 395  # 13 meses: el arrastre del bono mira 12
DIAS_SIN_DATOS = 7  # más días sin datos que esto: estado «sin datos recientes»
MAX_RECHAZADOS = 31


def id_estadistica_energia(nombre: str) -> str:
    return f"{DOMAIN}:energia_datadis_{slugify(nombre) or 'datadis'}"


class ConsultaRepetida(Exception):
    """La misma consulta se hizo hace menos de 24 h: Datadis respondería 429."""

    def __init__(self, cuando: datetime) -> None:
        super().__init__(cuando.isoformat())
        self.cuando = cuando


class RegistroConsultas:
    """Cuándo se hizo cada consulta de consumo, común a todas las cuentas de Datadis.

    Vive fuera de la subentrada para que recrearla (o cambiar su nombre) no la deje repetir una
    consulta del mismo usuario y CUPS antes de 24 h. Se guarda solo un resumen (hash) de
    usuario y parámetros, sin el CUPS ni el NIF en claro.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        self._store: Store[dict[str, str]] = Store(hass, STORE_VERSION, f"{DOMAIN}.datadis_consultas")
        self._hechas: dict[str, str] | None = None

    @staticmethod
    def clave(usuario: str, params: Mapping[str, Any]) -> str:
        texto = usuario + "|" + "|".join(f"{k}={params[k]}" for k in sorted(params))
        return hashlib.sha256(texto.encode()).hexdigest()[:32]

    async def async_libre(self, clave: str, ahora: datetime) -> datetime | None:
        """None si se puede consultar ya; si no, cuándo."""
        if self._hechas is None:
            self._hechas = await self._store.async_load() or {}
        hecha = self._hechas.get(clave)
        if hecha and ahora < (libre := datetime.fromisoformat(hecha) + MISMA_CONSULTA):
            return libre
        return None

    def apuntar(self, clave: str, ahora: datetime) -> None:
        assert self._hechas is not None
        limite = ahora - 2 * MISMA_CONSULTA
        self._hechas = {k: v for k, v in self._hechas.items() if datetime.fromisoformat(v) >= limite} | {
            clave: ahora.isoformat()
        }
        self._store.async_delay_save(lambda: self._hechas or {}, 5)


def registro_consultas(hass: HomeAssistant) -> RegistroConsultas:
    return hass.data.setdefault(f"{DOMAIN}_datadis_consultas", RegistroConsultas(hass))


class CuentaDatadis(DataUpdateCoordinator[dict[str, Any]]):
    """Consulta diaria a Datadis de un suministro."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, subentrada: ConfigSubentry) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {subentrada.title}",
            update_interval=INTERVALO,
            always_update=False,  # cada 10 min sin cambios no reescribe el sensor
        )
        self.subentrada = subentrada
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{DOMAIN}.datadis_{subentrada.subentry_id}"
        )
        self._estado: dict[str, Any] = {}

    @property
    def estadistica_id(self) -> str:
        return id_estadistica_energia(self.subentrada.title)

    @property
    def nombre_estadistica(self) -> str:
        return f"Consumo Datadis ({self.subentrada.title})"

    async def async_cargar(self) -> None:
        self._estado = await self._store.async_load() or {}

    async def async_guardar_ya(self) -> None:
        """Al descargar la entrada, escribe lo que async_delay_save tenía pendiente."""
        await self._store.async_save(self._estado)

    # --- estado -----------------------------------------------------------------------

    def resumen(self) -> dict[str, Any]:
        ultimo = self._estado.get("ultimo_dia")
        hoy = dt_util.now(REFERENCE_TZ).date()
        if self._estado.get("error"):
            estado = self._estado["error"]
        elif not ultimo:
            estado = "sin_datos" if self._estado.get("ultima_consulta") else "esperando"
        elif date.fromisoformat(ultimo) < hoy - timedelta(days=DIAS_SIN_DATOS):
            estado = "sin_datos_recientes"
        else:
            estado = "ok"
        return {
            "estado": estado,
            "ultimo_dia": ultimo,
            "ultima_consulta": self._estado.get("ultima_consulta"),
            "proxima_consulta": self._estado.get("proxima_consulta"),
            "horas_importadas": self._estado.get("horas_importadas", 0),
            "horas_estimadas": self._estado.get("horas_estimadas", 0),
            "dias_rechazados": dict(self._estado.get("rechazados") or {}),
            "estadistica": self.estadistica_id,
            "detalle_error": self._estado.get("detalle_error"),
        }

    # --- descarga ---------------------------------------------------------------------

    def _toca_consultar(self, ahora: datetime) -> bool:
        proxima = self._estado.get("proxima_consulta")
        return not proxima or ahora >= datetime.fromisoformat(proxima)

    async def _async_update_data(self) -> dict[str, Any]:
        ahora = dt_util.utcnow()
        revision = self.subentrada.data.get("revision", 1)
        if self._estado.get("revision") != revision:  # credenciales nuevas: se consulta ya
            self._estado.update(revision=revision, error=None, detalle_error=None)
            self._estado.pop("proxima_consulta", None)
        if not self._toca_consultar(ahora):
            return self.resumen()
        datos = self.subentrada.data
        hoy = dt_util.now(REFERENCE_TZ).date()
        ultimo = self._estado.get("ultimo_dia")
        desde = (
            date.fromisoformat(ultimo) - timedelta(days=DIAS_SOLAPE)
            if ultimo
            else hoy - timedelta(days=DIAS_PRIMERA_VEZ)
        )
        session = async_get_clientsession(self.hass)
        try:
            token = await async_login(session, datos[CONF_DATADIS_USUARIO], datos[CONF_DATADIS_CLAVE])
            respuesta = await self._async_pedir(session, token, desde, hoy, ahora)
            if not respuesta.registros and self._toca_mes_a_mes(desde, hoy, ahora):
                respuesta = await self._async_mes_a_mes(session, token, desde, hoy, ahora)
        except ConsultaRepetida as exc:  # se hizo hace menos de 24 h (p. ej. al recrear la cuenta)
            self._estado["proxima_consulta"] = (exc.cuando + timedelta(minutes=5)).isoformat()
        except CredencialesInvalidas as exc:
            self._fallo("credenciales", str(exc), ahora + TRAS_LIMITE)
        except DatadisNoResponde as exc:
            espera = TRAS_LIMITE if "429" in str(exc) else TRAS_FALLO
            self._fallo("no_responde", str(exc), ahora + espera)
        else:
            self._estado.update(
                ultima_consulta=ahora.isoformat(),
                proxima_consulta=(ahora + ENTRE_CONSULTAS).isoformat(),
                error=None,
                detalle_error="; ".join(dict.fromkeys(respuesta.errores))[:300] or None,
            )
            await self._async_guardar_curva(curva(respuesta.registros))
        self._store.async_delay_save(lambda: self._estado, 5)
        return self.resumen()

    async def _async_pedir(
        self, session: Any, token: str, desde: date, hasta: date, ahora: datetime
    ) -> Respuesta:
        """Una consulta de consumo, si no se hizo la misma en las últimas 24 h."""
        params = params_consumo(self.subentrada.data[CONF_DATADIS_SUMINISTRO], desde, hasta)
        registro = registro_consultas(self.hass)
        clave = registro.clave(self.subentrada.data[CONF_DATADIS_USUARIO], params)
        if libre := await registro.async_libre(clave, ahora):
            raise ConsultaRepetida(libre)
        try:
            respuesta = await async_consumo(session, token, params)
        except DatadisNoResponde as exc:
            if "HTTP" in str(exc):  # llegó a Datadis: cuenta como consulta hecha
                registro.apuntar(clave, ahora)
            raise
        registro.apuntar(clave, ahora)
        return respuesta

    def _toca_mes_a_mes(self, desde: date, hasta: date, ahora: datetime) -> bool:
        if desde.replace(day=1) == hasta.replace(day=1):
            return False
        previo = self._estado.get("mes_a_mes")
        return not previo or ahora >= datetime.fromisoformat(previo) + ENTRE_MES_A_MES

    async def _async_mes_a_mes(
        self, session: Any, token: str, desde: date, hasta: date, ahora: datetime
    ) -> Respuesta:
        """El rango llegó vacío: se pide cada mes por separado (son consultas distintas)."""
        self._estado["mes_a_mes"] = ahora.isoformat()
        total = Respuesta()
        for mes in meses(desde, hasta):
            try:
                parte = await self._async_pedir(session, token, mes, mes, ahora)
            except ConsultaRepetida:
                continue
            except DatadisNoResponde:
                if total.registros:
                    break  # se guarda lo que haya llegado; el resto, otro día
                raise
            total.registros.extend(parte.registros)
            total.errores.extend(parte.errores)
        return total

    def _fallo(self, error: str, detalle: str, proxima: datetime) -> None:
        _LOGGER.info("%s: Datadis no disponible (%s)", self.subentrada.title, detalle)
        self._estado.update(error=error, detalle_error=detalle, proxima_consulta=proxima.isoformat())

    async def async_forzar(self) -> None:
        """Consulta ya, aunque no toque (tras cambiar las credenciales); nunca repite una
        consulta idéntica de hace menos de 24 h."""
        self._estado.pop("proxima_consulta", None)
        await self.async_refresh()

    # --- curva --------------------------------------------------------------------------

    async def async_importar(self, registros: Iterable[Mapping[str, Any]]) -> Curva:
        """Importa registros (de un CSV de datadis.es) con las mismas comprobaciones."""
        c = curva(registros)
        await self._async_guardar_curva(c)
        await self._store.async_save(self._estado)
        self.async_set_updated_data(self.resumen())
        return c

    async def _async_guardar_curva(self, c: Curva) -> None:
        if c.horas and "recorder" in self.hass.config.components:
            await async_reescribir_periodo(
                self.hass,
                self.estadistica_id,
                self.nombre_estadistica,
                c.horas,
                metadatos_energia(self.estadistica_id, self.nombre_estadistica),
            )
        if c.ultimo_dia:
            previo = self._estado.get("ultimo_dia")
            self._estado["ultimo_dia"] = max(c.ultimo_dia.isoformat(), previo or "")
        self._estado["horas_importadas"] = self._estado.get("horas_importadas", 0) + len(c.horas)
        self._estado["horas_estimadas"] = self._estado.get("horas_estimadas", 0) + c.estimadas
        rechazados = {
            **(self._estado.get("rechazados") or {}),
            **{d.isoformat(): m for d, m in c.rechazados.items()},
        }
        self._estado["rechazados"] = dict(sorted(rechazados.items())[-MAX_RECHAZADOS:])
