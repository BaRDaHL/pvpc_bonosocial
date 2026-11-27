"""Cuenta de Datadis (subentrada «Datadis», F7): descarga diaria y estadística de energía.

Una vez al día (Datadis no deja repetir la misma consulta antes de 24 h: se pide cada 24 h 10 min y un
registro común, que sobrevive a recrear la subentrada, impide repetir una idéntica) se descarga la curva
horaria desde unos días antes del último con datos y se escribe en la estadística externa
`pvpc_bonosocial:energia_datadis_<nombre>` (kWh, con `sum`). Esa estadística se puede elegir
como fuente de consumo de un suministro («estadística externa») o usar como referencia. Si
Datadis no da datos, no pasa nada: el sensor de estado lo dice y se sigue intentando cada día;
cuando vuelva, se rellena hacia atrás. También se pueden importar los CSV de datadis.es.

«Descargar histórico completo» (al reconfigurar la cuenta) pide en segundo plano lo que queda por detrás
de la ventana diaria, hasta donde Datadis deja (dos años: el mes actual − 23). Primero el rango entero; si
falla o llega vacío, mes a mes. El estado va en el Store de la cuenta (`historico`): un reinicio, un 429 o
Datadis caído lo dejan pendiente y la comprobación de cada 10 min lo retoma cuando toca, sin repetir nunca
una consulta idéntica antes de 24 h.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from collections.abc import Iterable, Mapping
from datetime import UTC, date, datetime, timedelta
from typing import Any

from homeassistant.components import persistent_notification
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util
from homeassistant.util import slugify

from .const import (
    CONF_DATADIS_CLAVE,
    CONF_DATADIS_ESTADISTICA,
    CONF_DATADIS_SUMINISTRO,
    CONF_DATADIS_USUARIO,
    DOMAIN,
)
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
    texto_motivo,
)
from .estadistica import async_reescribir_periodo, metadatos_energia
from .idiomas import fecha, fecha_mes, idioma
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
# Con más registros que esto (unos 3 meses: la primera descarga o un CSV grande), la curva se analiza en
# el ejecutor para no bloquear el bucle de eventos. La consulta diaria (1-3 meses) se queda en el bucle.
MAX_REGISTROS_EN_BUCLE = 24 * 31 * 3
DIAS_SIN_DATOS = 7  # más días sin datos que esto: estado «sin datos recientes»
MAX_RECHAZADOS = 31
# Días rechazados (o de cambio de hora guardados a medias) fuera de la ventana diaria: se vuelve a pedir
# su mes, como mucho un mes por consulta diaria, cada mes cada `ENTRE_REINTENTOS` y hasta `MAX_REINTENTOS`
# veces. Cada mes es una consulta distinta, así que no choca con la de 24 h ni con el registro común.
ENTRE_REINTENTOS = timedelta(days=7)
MAX_REINTENTOS = 8
# Histórico completo. Datadis rechaza (HTTP 400 «La fecha inicio no puede ser superior a dos años») un
# `startDate` del mes actual − 24 y acepta el − 23 (comprobado con la API real en nov-2026).
MESES_ATRAS = 23
PENDIENTE, EN_CURSO, HECHO = "pendiente", "en_curso", "hecho"
AVISO_HISTORICO = {
    "es": (
        "Histórico de Datadis descargado",
        "«{nombre}»: importadas {horas} horas de {desde} a {hasta}. Días descartados: {rechazados}. "
        "Meses sin datos: {sin_datos}.",
    ),
    "en": (
        "Datadis history downloaded",
        "“{nombre}”: {horas} hours imported from {desde} to {hasta}. Discarded days: {rechazados}. "
        "Months without data: {sin_datos}.",
    ),
    "ca": (
        "Històric de Datadis descarregat",
        "«{nombre}»: s'han importat {horas} hores de {desde} a {hasta}. Dies descartats: {rechazados}. "
        "Mesos sense dades: {sin_datos}.",
    ),
    "gl": (
        "Histórico de Datadis descargado",
        "«{nombre}»: importáronse {horas} horas de {desde} a {hasta}. Días descartados: {rechazados}. "
        "Meses sen datos: {sin_datos}.",
    ),
    "eu": (
        "Datadis-eko historikoa deskargatuta",
        "«{nombre}»: {horas} ordu inportatu dira ({desde} - {hasta}). Baztertutako egunak: {rechazados}. "
        "Daturik gabeko hilabeteak: {sin_datos}.",
    ),
}


def _mes_menos(mes: date, n: int) -> date:
    """Primer día del mes `n` meses antes que el de `mes`."""
    total = mes.year * 12 + mes.month - 1 - n
    return date(total // 12, total % 12 + 1, 1)


def desde_diaria(hoy: date, ultimo: str | None) -> date:
    """Primer día de la consulta diaria: una semana antes del último con datos o, sin datos, 13 meses."""
    if ultimo:
        return date.fromisoformat(ultimo) - timedelta(days=DIAS_SOLAPE)
    return hoy - timedelta(days=DIAS_PRIMERA_VEZ)


def rango_historico(hoy: date, ultimo: str | None) -> tuple[date, date] | None:
    """(primer mes, último mes) del histórico completo: desde el más antiguo que admite Datadis hasta el
    anterior al primero de la consulta diaria (no se solapan). None si la diaria ya lo cubre todo."""
    desde = _mes_menos(hoy, MESES_ATRAS)
    hasta = _mes_menos(desde_diaria(hoy, ultimo), 1)
    return (desde, hasta) if hasta >= desde else None


def _mes(texto: str) -> date:
    return date.fromisoformat(f"{texto}-01")


def id_estadistica_energia(nombre: str) -> str:
    """Id de la estadística de una cuenta nueva. Se fija en la subentrada al crearla
    (`CONF_DATADIS_ESTADISTICA`): renombrar la cuenta no la cambia."""
    return f"{DOMAIN}:energia_datadis_{slugify(nombre) or 'datadis'}"


def estadistica_de(subentrada: ConfigSubentry) -> str:
    """Estadística de energía de una cuenta: la fijada en la subentrada (desde la v1.4) o, en una
    subentrada anterior aún sin migrar, la que sale de su título."""
    return subentrada.data.get(CONF_DATADIS_ESTADISTICA) or id_estadistica_energia(subentrada.title)


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
        # Una sola descarga a la vez (la diaria o el histórico): las dos reescriben la estadística.
        self._bloqueo = asyncio.Lock()
        self._tarea_historico: asyncio.Task | None = None

    @property
    def estadistica_id(self) -> str:
        return estadistica_de(self.subentrada)

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
            "horas_importadas": sum((self._estado.get("horas_por_dia") or {}).values())
            if "horas_por_dia" in self._estado
            else self._estado.get("horas_importadas", 0),
            "horas_estimadas": sum((self._estado.get("estimadas_por_dia") or {}).values())
            if "estimadas_por_dia" in self._estado
            else self._estado.get("horas_estimadas", 0),
            "dias_rechazados": dict(self._estado.get("rechazados") or {}),
            "dias_incompletos": dict(self._estado.get("incompletos") or {}),
            "estadistica": self.estadistica_id,
            "detalle_error": self._estado.get("detalle_error"),
            "historico": self._resumen_historico(),
        }

    def _resumen_historico(self) -> dict[str, Any] | None:
        h = self._estado.get("historico")
        if not h:
            return None
        pendientes = h.get("pendientes")
        return {
            "estado": h["estado"],
            "desde": h["desde"],
            "hasta": h["hasta"],
            # None: falta la consulta del rango entero; si no, los meses que quedan por pedir uno a uno.
            "meses_pendientes": None if pendientes is None else len(pendientes),
            "horas": h.get("horas", 0),
            "dias_descartados": h.get("descartados", 0),
            "meses_sin_datos": list(h.get("sin_datos") or []),
            "proximo_intento": h.get("proximo"),
            "detalle": h.get("detalle"),
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
            if (h := self._estado.get("historico")) and h["estado"] != HECHO:
                h.pop("proximo", None)  # el histórico pendiente, también ya
        if "horas_por_dia" not in self._estado:
            await self._async_contar_horas()
        # Con el histórico descargándose, la diaria espera a la siguiente comprobación (10 min).
        if self._toca_consultar(ahora) and not self._bloqueo.locked():
            async with self._bloqueo:
                await self._async_consulta_diaria(ahora)
            self._store.async_delay_save(lambda: self._estado, 5)
        self._lanzar_historico(ahora)
        return self.resumen()

    async def _async_consulta_diaria(self, ahora: datetime) -> None:
        datos = self.subentrada.data
        hoy = dt_util.now(REFERENCE_TZ).date()
        desde = desde_diaria(hoy, self._estado.get("ultimo_dia"))
        session = async_get_clientsession(self.hass)
        try:
            token = await async_login(session, datos[CONF_DATADIS_USUARIO], datos[CONF_DATADIS_CLAVE])
            respuesta = await self._async_pedir(session, token, desde, hoy, ahora)
            if not respuesta.registros and self._toca_mes_a_mes(desde, hoy, ahora):
                respuesta = await self._async_mes_a_mes(session, token, desde, hoy, ahora)
            elif respuesta.registros:
                extra = await self._async_reintentar(session, token, desde, hoy, ahora)
                respuesta = Respuesta(
                    respuesta.registros + extra.registros, respuesta.errores + extra.errores
                )
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
            await self._async_guardar_curva(await self._async_curva(respuesta.registros))

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

    async def _async_reintentar(
        self, session: Any, token: str, desde: date, hoy: date, ahora: datetime
    ) -> Respuesta:
        """Vuelve a pedir el mes de un día rechazado o incompleto que ya no entra en la consulta diaria.

        Un mes por día como mucho (el más reciente pendiente), solo dentro de los 13 meses que se guardan.
        Un fallo aquí no estropea la consulta diaria: se deja para otro día.
        """
        limite = hoy - timedelta(days=DIAS_PRIMERA_VEZ)
        dias = {
            date.fromisoformat(d)
            for d in [*(self._estado.get("rechazados") or {}), *(self._estado.get("incompletos") or {})]
        }
        reintentos: dict[str, dict[str, Any]] = self._estado.setdefault("reintentos", {})
        for mes in sorted(
            {d.replace(day=1) for d in dias if limite <= d < desde.replace(day=1)}, reverse=True
        ):
            previo = reintentos.get(mes.isoformat()) or {}
            if previo.get("veces", 0) >= MAX_REINTENTOS:
                continue
            if previo.get("ultimo") and ahora < datetime.fromisoformat(previo["ultimo"]) + ENTRE_REINTENTOS:
                continue
            reintentos[mes.isoformat()] = {"ultimo": ahora.isoformat(), "veces": previo.get("veces", 0) + 1}
            fin = (mes + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            try:
                return await self._async_pedir(session, token, mes, fin, ahora)
            except (ConsultaRepetida, DatadisNoResponde) as exc:
                _LOGGER.debug("%s: reintento de %s aplazado (%s)", self.subentrada.title, mes, exc)
                return Respuesta()
        return Respuesta()

    async def _async_contar_horas(self) -> None:
        """Store de antes de la v1.4: `horas_importadas` sumaba las horas de cada consulta (con el solape,
        muchas veces la misma). Se cuentan una vez las horas que hay de verdad en la estadística."""
        por_dia: dict[str, int] = {}
        if "recorder" in self.hass.config.components:
            from homeassistant.components.recorder import get_instance
            from homeassistant.components.recorder.statistics import statistics_during_period

            ahora = dt_util.utcnow()
            try:
                filas = await get_instance(self.hass).async_add_executor_job(
                    statistics_during_period,
                    self.hass,
                    ahora - timedelta(days=DIAS_PRIMERA_VEZ + 30),
                    ahora,
                    {self.estadistica_id},
                    "hour",
                    None,
                    {"change"},
                )
            except Exception:
                _LOGGER.debug("%s: no se han podido contar las horas importadas", self.subentrada.title)
                return
            for f in filas.get(self.estadistica_id, []):
                dia = datetime.fromtimestamp(f["start"], UTC).astimezone(REFERENCE_TZ).date().isoformat()
                por_dia[dia] = por_dia.get(dia, 0) + 1
        self._estado["horas_por_dia"] = por_dia
        self._estado.pop("horas_importadas", None)

    def _fallo(self, error: str, detalle: str, proxima: datetime) -> None:
        _LOGGER.info("%s: Datadis no disponible (%s)", self.subentrada.title, detalle)
        self._estado.update(error=error, detalle_error=detalle, proxima_consulta=proxima.isoformat())

    async def async_forzar(self) -> None:
        """Consulta ya, aunque no toque (tras cambiar las credenciales); nunca repite una
        consulta idéntica de hace menos de 24 h."""
        self._estado.pop("proxima_consulta", None)
        await self.async_refresh()

    # --- histórico completo ------------------------------------------------------------

    def rango_del_historico(self) -> tuple[date, date] | None:
        """El del histórico pedido y aún sin terminar o, si no hay ninguno, el que se pediría hoy."""
        h = self._estado.get("historico")
        if h and h["estado"] != HECHO:
            return _mes(h["desde"]), _mes(h["hasta"])
        return rango_historico(dt_util.now(REFERENCE_TZ).date(), self._estado.get("ultimo_dia"))

    @callback
    def async_pedir_historico(self) -> tuple[date, date] | None:
        """Apunta la descarga del histórico completo y la lanza en segundo plano si se puede ya.

        Si ya hay uno pedido sin terminar, sigue con ese (no se adelanta a un aplazamiento por 429).
        """
        rango = self.rango_del_historico()
        if rango is None:
            return None
        h = self._estado.get("historico")
        if not h or h["estado"] == HECHO:
            self._estado["historico"] = {
                "estado": PENDIENTE,
                "desde": rango[0].strftime("%Y-%m"),
                "hasta": rango[1].strftime("%Y-%m"),
                "pendientes": None,
                "pedido": dt_util.utcnow().isoformat(),
                "horas": 0,
                "descartados": 0,
                "rechazados": {},
                "sin_datos": [],
                "intentos": 0,
            }
        self._store.async_delay_save(lambda: self._estado, 5)
        self.async_set_updated_data(self.resumen())
        self._lanzar_historico(dt_util.utcnow())
        return rango

    def _lanzar_historico(self, ahora: datetime) -> None:
        """Con un histórico pendiente y cuando toca, lo descarga en segundo plano (nunca con la diaria)."""
        h = self._estado.get("historico")
        if not h or h["estado"] == HECHO or self._bloqueo.locked():
            return
        if self._tarea_historico is not None and not self._tarea_historico.done():
            return
        if h.get("proximo") and ahora < datetime.fromisoformat(h["proximo"]):
            return
        assert self.config_entry is not None
        self._tarea_historico = self.config_entry.async_create_background_task(
            self.hass,
            self._async_historico(),
            f"{DOMAIN} Datadis histórico {self.subentrada.title}",
            eager_start=False,  # fuera de la actualización en curso del coordinador
        )

    async def _async_historico(self) -> None:
        h = self._estado.get("historico")
        if not h or h["estado"] == HECHO or self._bloqueo.locked():
            return
        async with self._bloqueo:
            ahora = dt_util.utcnow()
            h.update(estado=EN_CURSO, proximo=None, detalle=None)
            self.async_set_updated_data(self.resumen())
            try:
                await self._async_paso_historico(h, ahora)
            finally:
                if h["estado"] == EN_CURSO:  # error inesperado o HA parándose: se retoma más tarde
                    h.update(estado=PENDIENTE, proximo=(ahora + TRAS_FALLO).isoformat())
                self._store.async_delay_save(lambda: self._estado, 5)
        self.async_set_updated_data(self.resumen())

    async def _async_paso_historico(self, h: dict[str, Any], ahora: datetime) -> None:
        """Una pasada: el rango entero (la primera vez) y, si falla o llega vacío, los meses pendientes.

        Lo que llega se guarda igual que la consulta diaria o un CSV (mismas comprobaciones; las horas
        guardadas de esos días se sustituyen). Un 429, Datadis caído o una consulta idéntica de hace
        menos de 24 h dejan el resto pendiente para más tarde.
        """
        datos = self.subentrada.data
        session = async_get_clientsession(self.hass)
        registros: list[Mapping[str, Any]] = []
        hechos: set[str] = set()
        aplazar: datetime | None = None
        fallo: str | None = None
        try:
            token = await async_login(session, datos[CONF_DATADIS_USUARIO], datos[CONF_DATADIS_CLAVE])
            if h.get("pendientes") is None:
                desde, hasta = _mes(h["desde"]), _mes(h["hasta"])
                try:
                    respuesta = await self._async_pedir(session, token, desde, hasta, ahora)
                except DatadisNoResponde as exc:
                    if "429" in str(exc):
                        raise
                    _LOGGER.info(
                        "%s: histórico, el rango entero falla (%s): mes a mes", self.subentrada.title, exc
                    )
                    respuesta = Respuesta()
                if respuesta.registros:
                    registros.extend(respuesta.registros)
                    h["pendientes"] = []
                else:
                    h["pendientes"] = [m.strftime("%Y-%m") for m in meses(desde, hasta)]
                    self.async_set_updated_data(self.resumen())  # que se vea que pasa a mes a mes
            for clave in list(h["pendientes"]):
                mes = _mes(clave)
                try:
                    respuesta = await self._async_pedir(session, token, mes, mes, ahora)
                except ConsultaRepetida as exc:
                    aplazar = max(aplazar or exc.cuando, exc.cuando)
                    continue
                except DatadisNoResponde as exc:
                    if "HTTP 400" not in str(exc):
                        raise
                    respuesta = Respuesta()  # Datadis no admite ese mes (p. ej. pasa de los dos años)
                hechos.add(clave)
                if respuesta.registros:
                    registros.extend(respuesta.registros)
                else:
                    h["sin_datos"] = sorted({*h.get("sin_datos", []), clave})
                # Progreso visible mes a mes (el atributo «historico» baja `meses_pendientes`).
                h["pendientes"] = [m for m in h["pendientes"] if m != clave]
                self.async_set_updated_data(self.resumen())
        except ConsultaRepetida as exc:
            aplazar = exc.cuando
        except (CredencialesInvalidas, DatadisNoResponde) as exc:
            fallo = str(exc)
            limite = isinstance(exc, CredencialesInvalidas) or "429" in fallo
            aplazar = ahora + (TRAS_LIMITE if limite else TRAS_FALLO)
            _LOGGER.info("%s: histórico de Datadis aplazado (%s)", self.subentrada.title, fallo)
        if registros:
            c = await self._async_curva(registros)
            await self._async_guardar_curva(c)
            h["horas"] = h.get("horas", 0) + len(c.horas)
            h["descartados"] = h.get("descartados", 0) + len(c.rechazados)
            rechazados = {**h.get("rechazados", {}), **{d.isoformat(): m for d, m in c.rechazados.items()}}
            h["rechazados"] = dict(sorted(rechazados.items())[-MAX_RECHAZADOS:])
        if h.get("pendientes") is not None:
            h["pendientes"] = [m for m in h["pendientes"] if m not in hechos]
        if fallo:
            h["intentos"] = h.get("intentos", 0) + 1
            h["detalle"] = fallo[:300]
        if h.get("pendientes") == [] or h.get("intentos", 0) >= MAX_REINTENTOS:
            # Terminado (o abandonado tras muchos fallos: lo que falte queda como «sin datos»).
            h["sin_datos"] = sorted({*h.get("sin_datos", []), *(h.get("pendientes") or [])})
            h.update(estado=HECHO, pendientes=[], proximo=None, terminado=ahora.isoformat())
            self._avisar_historico(h)
        else:
            espera = aplazar + timedelta(minutes=5) if aplazar and not fallo else aplazar
            h.update(estado=PENDIENTE, proximo=(espera or ahora + TRAS_FALLO).isoformat())

    def _avisar_historico(self, h: dict[str, Any]) -> None:
        lengua = idioma(self.hass.config.language)
        titulo, texto = AVISO_HISTORICO[lengua]
        rechazados = h.get("rechazados") or {}
        lista = ", ".join(f"{fecha(d, lengua)} ({texto_motivo(m, lengua)})" for d, m in rechazados.items())
        if h.get("descartados", 0) > len(rechazados):
            lista += f" … ({h['descartados']})"
        persistent_notification.async_create(
            self.hass,
            texto.format(
                nombre=self.subentrada.title,
                horas=h.get("horas", 0),
                desde=fecha_mes(h["desde"], lengua),
                hasta=fecha_mes(h["hasta"], lengua),
                rechazados=lista or "—",
                sin_datos=", ".join(fecha_mes(m, lengua) for m in h.get("sin_datos") or []) or "—",
            ),
            title=titulo,
            notification_id=f"{DOMAIN}_historico_datadis_{self.subentrada.subentry_id}",
        )

    # --- curva --------------------------------------------------------------------------

    async def async_importar(self, registros: Iterable[Mapping[str, Any]]) -> Curva:
        """Importa registros (de un CSV de datadis.es) con las mismas comprobaciones."""
        c = await self._async_curva(list(registros))
        await self._async_guardar_curva(c)
        await self._store.async_save(self._estado)
        self.async_set_updated_data(self.resumen())
        return c

    async def _async_curva(self, registros: list[Mapping[str, Any]]) -> Curva:
        """`datadis.curva`, en el ejecutor si son muchos meses (13 meses: unos 80 ms de CPU)."""
        if len(registros) > MAX_REGISTROS_EN_BUCLE:
            return await self.hass.async_add_executor_job(curva, registros)
        return curva(registros)

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
        # Horas distintas por día: al volver a pedir un día se sustituye su cuenta, no se suma.
        nuevos = {d.isoformat(): n for d, n in c.horas_por_dia().items()}
        self._estado["horas_por_dia"] = dict(
            sorted({**(self._estado.get("horas_por_dia") or {}), **nuevos}.items())
        )
        estimadas = {d.isoformat(): n for d, n in c.horas_por_dia(c.horas_estimadas).items()}
        previas = {k: v for k, v in (self._estado.get("estimadas_por_dia") or {}).items() if k not in nuevos}
        self._estado["estimadas_por_dia"] = dict(sorted({**previas, **estimadas}.items()))
        self._estado.pop("horas_importadas", None)
        self._estado.pop("horas_estimadas", None)
        # Un día rechazado antes que ahora llega bien deja de figurar como rechazado (y como incompleto,
        # si ahora llega entero).
        rechazados = {
            **{k: v for k, v in (self._estado.get("rechazados") or {}).items() if k not in nuevos},
            **{d.isoformat(): m for d, m in c.rechazados.items()},
        }
        self._estado["rechazados"] = dict(sorted(rechazados.items())[-MAX_RECHAZADOS:])
        incompletos = {
            **{k: v for k, v in (self._estado.get("incompletos") or {}).items() if k not in nuevos},
            **{d.isoformat(): m for d, m in c.incompletos.items()},
        }
        self._estado["incompletos"] = dict(sorted(incompletos.items())[-MAX_RECHAZADOS:])
