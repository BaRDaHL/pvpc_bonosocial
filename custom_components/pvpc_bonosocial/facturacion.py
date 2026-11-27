"""Facturación de un suministro: periodo en curso, cierre y factura anterior (DISENO §5.2).

Cada suministro (subentrada) tiene un coordinador que, cada 15 minutos:

1. Fija el periodo: desde el último corte (la fecha de fin de la última factura y, después,
   cada corte previsto) hasta el siguiente, el mismo día del mes siguiente. Al pasar un
   corte, guarda la factura cerrada estimada y empieza el periodo nuevo.
2. Lee el consumo horario de su fuente (consumo.py) y los precios del histórico (PCB y TEU
   de cada hora; el periodo, por el TEU).
3. Calcula con engine/vivo.py el acumulado, la previsión al cierre y su rango, el coste de
   cada hora (para «coste de hoy» y la estadística de coste) y el precio real de cada hora.

Para que pese poco: el consumo horario se guarda en memoria y de cada lectura solo se pide al
recorder lo último (consumo.ConsumoEnMemoria), una estimación no se rehace si sus datos de entrada
no han cambiado (casi siempre, una vez por hora) y de la estadística de coste solo se escriben las
horas que cambian.
"""

from __future__ import annotations

import asyncio
import calendar
import logging
from dataclasses import dataclass, field, replace
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from itertools import pairwise
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .cnmc import CnmcNoResponde
from .combinado import calibrar, combinar
from .comparativa import PeriodoPagado
from .const import (
    CONF_ALQUILER,
    CONF_ARRASTRE_INICIAL,
    CONF_BONO,
    CONF_CATEGORIA,
    CONF_CODIGO_POSTAL,
    CONF_CONTRATOS_ANTERIORES,
    CONF_DIAS_EMISION,
    CONF_FACTURA_EN_CURSO,
    CONF_FIN_ULTIMA_FACTURA,
    CONF_FUENTE,
    CONF_FUENTE_OFICIAL,
    CONF_FUENTE_REGISTRO,
    CONF_IDS_HEREDADOS,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    CONF_SEGUNDA_OPINION,
    CONF_SHELLY_CANAL,
    CONF_SHELLY_FRECUENCIA,
    CONF_SHELLY_IP,
    CONF_TIPO_FUENTE,
    DEFAULT_DIAS_EMISION,
    DEFAULT_EN_CURSO,
    DOMAIN,
    FUENTE_AMBOS,
    FUENTE_DATADIS,
    FUENTE_ESTADISTICA,
    FUENTE_NINGUNA,
    FUENTE_SENSOR,
    FUENTES_EXTERNAS,
)
from .consumo import ConsumoEnMemoria
from .engine import (
    LIMITES_ANUALES_KWH,
    Ajuste,
    Bono,
    Estimacion,
    HoraFutura,
    HoraMedida,
    Suministro,
    estimar_periodo,
)
from .engine.arrastre import PeriodoBono, prorrata, saldo_arrastre
from .engine.calibracion import ALFA_VALIDO, PeriodoCalibracion, ajustar
from .engine.marginal import precio_marginal
from .estadistica import (
    async_escribir,
    async_escribir_facturas,
    async_reescribir_periodo,
    async_revisar_panel,
    id_estadistica,
)
from .idiomas import fecha, idioma, numero
from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.aiopvpc.pvpc_tariff import _price_period_key
from .prices.festivos import es_festivo_p3
from .prices.historico import HistoricoPrecios
from .prices.periodos import peajes_mwh
from .shelly import DIAS_CONSERVADOS as SHELLY_DIAS_CONSERVADOS
from .shelly import (
    UMBRAL_DESACUERDO,
    async_descargar,
    corregir,
    desacuerdo,
    horas_completas,
    recortar,
)
from .simulador_cnmc import async_simular, periodo_curva

_LOGGER = logging.getLogger(__name__)

STORE_VERSION = 1
INTERVALO = timedelta(minutes=15)
DIAS_HISTORIAL = 28
MAX_CERRADAS = 13
# Periodos anteriores a la primera factura conocida que se calculan con el consumo y los
# precios guardados (para la gráfica de facturas y el comparador), por ciclo de actualización.
MAX_CALCULADAS_POR_CICLO = 2
DIAS_PRECIOS = 395  # algo menos que los que guarda el histórico de precios (400)
MARGEN_POR_DEFECTO = Decimal(100)  # €/MWh (PCB − TEU) si aún no hay ningún precio
ISSUE_SIN_FECHA = "falta_fecha_factura"
ISSUE_HUECO = "dias_sin_factura"
ISSUE_CNMC = "factura_no_cuadra"
# € de diferencia con la CNMC que se dan por buenos: por debajo casi siempre es el reparto horario
# de la curva (la del medidor frente a la de la distribuidora), no un error de la factura.
TOLERANCIA_CNMC = Decimal("0.99")
ISSUE_SHELLY = "shelly_no_coincide"
ISSUE_INCOMPLETO = "periodo_cerrado_incompleto"
ISSUE_CALIBRACION = "factura_no_cuadra_medidor"
# Días tras el cierre en los que un periodo cerrado con horas sin consumo se sigue recalculando
# (Datadis puede llegar con días de retraso). Después se deja como está, marcado «incompleta».
DIAS_RECALCULO_INCOMPLETA = 30
# Con un medidor de HA (una entidad), las horas sin dato son casi siempre horas con HA parado: no
# van a llegar nunca y su consumo cae en la hora siguiente. Solo se marca «incompleta» (con aviso)
# si faltan más de estas. Con una estadística externa (Datadis u otra importación, que llega con
# retraso) basta con que falte una.
UMBRAL_HORAS_INCOMPLETA = 24
# Días que puede adelantarse la lectura real respecto al corte supuesto del periodo.
MARGEN_LECTURA_DIAS = 7
# Horas posteriores a la última publicada por la fuente («pendientes», v1.4): no son consumo 0, la fuente
# aún no las ha dado. Se estiman (provisionales) mientras el retraso sea el normal de la fuente; pasado
# ese retraso ya no se espera que lleguen pronto y cuentan como huecos (0 kWh, «consumo incompleto»).
RETRASO_NORMAL_MEDIDOR = timedelta(hours=24)
RETRASO_NORMAL_EXTERNA = timedelta(days=5)  # Datadis publica con 1-5 días de retraso
# Con un medidor de HA, la última hora tarda unos minutos en tener estadística: unas pocas horas
# pendientes no hacen la factura «provisional».
TOLERANCIA_PENDIENTES_MEDIDOR = 3
# Sin ningún dato de la fuente durante esto, aviso en Reparaciones (¿renombrada, borrada, caída?).
ISSUE_FUENTE_SIN_DATOS = "fuente_sin_datos"
# Con Datadis el aviso no tiene «Reparar»: la cuenta va con su CUPS y no hay otra fuente que elegir en el
# mismo perfil (lo que falla es la cuenta, o Datadis). Con medidor, «ambos» o estadística, sí (repairs.py).
ISSUE_FUENTE_SIN_DATOS_DATADIS = "fuente_sin_datos_datadis"
SIN_DATOS_MEDIDOR = timedelta(hours=24)
SIN_DATOS_EXTERNA = timedelta(days=7)
# Medidor + Datadis: el medidor no cuadra con Datadis en los días comunes.
ISSUE_MEDIDOR_DATADIS = "medidor_no_coincide_datadis"
# Mismo aviso cuando la diferencia es tan grande que el medidor se usa sin calibrar (otro texto).
ISSUE_MEDIDOR_DATADIS_SIN_CALIBRAR = "medidor_no_coincide_datadis_sin_calibrar"
# Cambio de fuente al reconfigurar (p. ej. de «ninguna» a un medidor, o añadir Datadis): los periodos
# cerrados que no son facturas reales se recalculan con la fuente nueva cuando tenga datos de ellos (Datadis
# rellena 13 meses hacia atrás en su primera descarga), y las facturas reales recalculan lo medido (para la
# calibración). Como mucho `MAX_REVISADAS_POR_HORA` periodos por hora y durante `DIAS_REVISION_FUENTE` días.
MAX_REVISADAS_POR_HORA = 3
DIAS_REVISION_FUENTE = 14
# Suministro sin fuente de consumo (solo facturas): `problema` y `estado_datos`.
FUENTE_NINGUNA_PROBLEMA = "sin_fuente"
# Estimaciones guardadas con sus datos de entrada (periodo en curso, cerrados que se recalculan…).
MAX_ESTIMACIONES_GUARDADAS = 8


def corte_siguiente(inicio: date) -> date:
    """Corte previsto: el mismo día del mes siguiente (o el último día de ese mes)."""
    anio, mes = (inicio.year + 1, 1) if inicio.month == 12 else (inicio.year, inicio.month + 1)
    return date(anio, mes, min(inicio.day, calendar.monthrange(anio, mes)[1]))


def corte_anterior(fin: date) -> date:
    """Inicio del periodo que acaba en `fin`: el mismo día del mes anterior (o el último de ese mes)."""
    anio, mes = (fin.year - 1, 12) if fin.month == 1 else (fin.year, fin.month - 1)
    return date(anio, mes, min(fin.day, calendar.monthrange(anio, mes)[1]))


def _inicio_local(dia: date) -> datetime:
    return datetime.combine(dia, time(0), REFERENCE_TZ)


def _fechas(c: dict[str, Any]) -> tuple[date, date]:
    """(inicio, fin) de un periodo cerrado tal como se guarda."""
    return date.fromisoformat(c["inicio"]), date.fromisoformat(c["fin"])


def _fila_periodo(
    inicio: date, fin: date, est: Estimacion, estado: str, *, previstos: bool = False
) -> dict[str, Any]:
    """Lo común a toda fila de periodo cerrado: fechas, total, kWh por periodo y consumo entero.

    `previstos`: los kWh son los previstos (suministro sin fuente: no hay nada medido)."""
    kwh = est.kwh_previstos if previstos else est.kwh_medidos
    return {
        "inicio": inicio.isoformat(),
        "fin": fin.isoformat(),
        "total": str(est.prevision.total),
        "kwh": {p: str(v.quantize(Decimal("0.001"))) for p, v in kwh.items()},
        "estado": estado,
        "consumo": int(sum(kwh.values(), Decimal(0)).quantize(Decimal(1))),
    }


def tipo_fuente_de(datos: dict[str, Any]) -> str:
    """sensor · datadis · ambos · ninguna · estadistica (las subentradas viejas, por la fuente)."""
    tipo = datos.get(CONF_TIPO_FUENTE)
    if tipo:
        return tipo
    fuente = datos.get(CONF_FUENTE) or ""
    return FUENTE_ESTADISTICA if ":" in fuente else FUENTE_SENSOR


def _es_externa(datos: dict[str, Any]) -> bool:
    """La fuente es una estadística externa (`dominio:objeto`), que llega con retraso."""
    if datos.get(CONF_TIPO_FUENTE) == FUENTE_AMBOS:
        return False  # la fuente principal es el medidor
    return datos.get(CONF_TIPO_FUENTE) in FUENTES_EXTERNAS or ":" in (datos.get(CONF_FUENTE) or "")


def suministro_de(datos: dict[str, Any]) -> Suministro:
    bono = Bono(datos.get(CONF_BONO, Bono.NINGUNO))
    categoria = datos.get(CONF_CATEGORIA)
    return Suministro(
        Decimal(str(datos[CONF_POTENCIA_P1])),
        Decimal(str(datos[CONF_POTENCIA_P2])),
        bono,
        LIMITES_ANUALES_KWH[categoria] if bono is not Bono.NINGUNO and categoria else None,
        Decimal(str(alquiler)) if (alquiler := datos.get(CONF_ALQUILER)) is not None else None,
    )


def contratos_del_periodo(
    datos: dict[str, Any], inicio: date, fin: date
) -> tuple[Suministro, dict[date, Suministro]]:
    """Contrato del primer día del periodo y cambios dentro de él (día desde el que rige cada uno).

    `contratos_anteriores` guarda los contratos ya sustituidos con su último día («hasta»);
    el actual rige desde el día siguiente al último «hasta».
    """
    anteriores = sorted(datos.get(CONF_CONTRATOS_ANTERIORES) or [], key=lambda c: c["hasta"])
    contratos = [(date.fromisoformat(c["hasta"]), suministro_de({**datos, **c})) for c in anteriores]
    actual = suministro_de(datos)

    def vigente(dia: date) -> Suministro:
        return next((s for hasta, s in contratos if dia <= hasta), actual)

    primer_dia = inicio + timedelta(days=1)
    cambios = {
        hasta + timedelta(days=1): vigente(hasta + timedelta(days=1))
        for hasta, _ in contratos
        if primer_dia <= hasta < fin
    }
    return vigente(primer_dia), cambios


class FacturaFutura(ValueError):
    """Factura real con la fecha de fin después de hoy."""


@dataclass
class Lectura:
    """Consumo horario leído de la fuente del suministro (UTC → kWh) y lo que se sabe de él."""

    kwh: dict[datetime, Decimal] = field(default_factory=dict)
    corregidas: int = 0  # horas corregidas con la memoria del Shelly
    ultima_fuente: datetime | None = None  # última hora con dato de la fuente (el medidor con «ambos»)
    oficial_hasta: datetime | None = None  # «ambos»: última hora publicada por Datadis
    horas_medidor: set[datetime] = field(default_factory=set)  # «ambos»: horas que pone el medidor
    calibracion_datadis: Ajuste | None = None
    cociente_datadis: Decimal | None = None
    desacuerdo_datadis: bool = False


@dataclass
class DatosFacturacion:
    estimacion: Estimacion | None = None
    anterior: dict[str, Any] | None = None
    problema: str | None = None  # «sin_fecha», «sin_consumo», «sin_fuente»
    coste_horas: dict[datetime, Decimal] = field(default_factory=dict)  # UTC → €
    precio_real: dict[datetime, Decimal] = field(default_factory=dict)  # UTC → €/kWh
    horas_sin_precio: int = 0
    horas_sin_consumo: int = 0
    horas_corregidas_shelly: int = 0
    ultima_hora_medida: datetime | None = None
    arrastre_kwh: int = 0
    ajuste: Ajuste | None = None
    kwh_medido_bruto: Decimal = Decimal(0)  # sin calibrar, para la calibración
    horas_medidas: int = 0
    kwh_hoy: Decimal = Decimal(0)  # medido hoy hasta la última hora completa (resumen §8)
    # v1.4: horas que la fuente aún no ha publicado (incluidas en horas_sin_consumo) y hasta cuándo hay.
    horas_pendientes: int = 0
    datos_hasta: datetime | None = None  # fin (local) de la última hora con dato de la fuente
    provisional: bool = False  # hay horas estimadas (pendientes) o del medidor sin confirmar por Datadis
    estado_consumo: str = "ok"  # ok · datos_pendientes · consumo_incompleto
    dias_con_huecos: list[date] = field(default_factory=list)
    modo_en_curso: str = DEFAULT_EN_CURSO  # estimar · recibido
    kwh_hoy_estimado: Decimal | None = None  # lo medido hoy más lo pendiente estimado (si hay pendientes)
    horas_medidor: int = 0  # «ambos»: horas del periodo que pone el medidor (aún no las da Datadis)
    oficial_hasta: datetime | None = None  # «ambos»: fin (local) de la última hora de Datadis
    lectura: Lectura | None = None

    @property
    def huecos(self) -> int:
        """Horas sin dato anteriores a la última publicada (o pendientes de más de lo normal)."""
        return self.horas_sin_consumo - self.horas_pendientes

    @property
    def acumulado_mostrado(self) -> Any:
        """La factura hasta hoy que se enseña: con lo pendiente estimado o solo lo recibido (opción)."""
        est = self.estimacion
        if est is None:
            return None
        if self.modo_en_curso == "estimar" and est.acumulado_estimado is not None:
            return est.acumulado_estimado
        return est.acumulado

    @property
    def coste_hoy(self) -> Decimal:
        hoy = dt_util.now(REFERENCE_TZ).date()
        return sum(
            (v for t, v in self.coste_horas.items() if t.astimezone(REFERENCE_TZ).date() == hoy), Decimal(0)
        )


class FacturacionSuministro(DataUpdateCoordinator[DatosFacturacion]):
    """Factura en tiempo real de un suministro."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        subentrada: ConfigSubentry,
        historico: HistoricoPrecios,
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {subentrada.title}",
            update_interval=INTERVALO,
        )
        self.subentrada = subentrada
        self.historico = historico
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{DOMAIN}.suministro_{subentrada.subentry_id}"
        )
        self._estado: dict[str, Any] = {}
        # Las horas del Shelly (hasta 70 días) van en su propio Store: el del suministro se guarda cada
        # hora (fuente vista, revisiones) y este solo al leer el Shelly (una vez al día o a la semana).
        self._store_shelly: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{DOMAIN}.shelly_{subentrada.subentry_id}"
        )
        self._shelly_horas: dict[str, str] = {}
        self._escrito: tuple | None = None  # (primera hora, última hora, acumulado) ya escritos
        # Cierre de periodos (actualización) frente a conciliar o fijar el corte: los dos leen
        # `corte_actual` y `cerradas`, esperan al recorder y luego escriben; sin candado una
        # factura introducida a mitad de un cierre dejaba periodos solapados (auditoría 20-oct M2).
        self._candado = asyncio.Lock()
        # Una sola consulta a la CNMC a la vez (arranque, 04:10, factura nueva, lote ZIP).
        self._candado_cnmc = asyncio.Lock()
        # «ambos»: (clave, calibración del medidor contra Datadis) de la última lectura.
        self._calibracion_datadis: tuple[Any, Any] | None = None
        # Ligereza: consumo horario en memoria por estadística, estimaciones ya hechas con sus datos de
        # entrada (si no ha cambiado nada no se rehacen), horas del Shelly ya convertidas y filas de la
        # estadística de coste ya escritas.
        self._lecturas: dict[str, ConsumoEnMemoria] = {}
        self._estimaciones: dict[tuple, tuple[tuple, DatosFacturacion]] = {}
        self._shelly: tuple[Any, dict[datetime, Decimal]] | None = None
        self._coste_escrito: dict[datetime, tuple[float, float]] = {}
        self._coste_escrito_dia: date | None = None

    @property
    def datos(self) -> dict[str, Any]:
        return dict(self.subentrada.data)

    # --- fuente del consumo (v1.4) -----------------------------------------------------

    @property
    def tipo_fuente(self) -> str:
        return tipo_fuente_de(self.datos)

    @property
    def sin_fuente(self) -> bool:
        return self.tipo_fuente == FUENTE_NINGUNA or not self.datos.get(CONF_FUENTE)

    @property
    def fuente_externa(self) -> bool:
        """La fuente es una estadística externa que llega con retraso (Datadis u otra importación)."""
        return _es_externa(self.datos)

    @property
    def retraso_normal(self) -> timedelta:
        return RETRASO_NORMAL_EXTERNA if self.fuente_externa else RETRASO_NORMAL_MEDIDOR

    @property
    def modo_en_curso(self) -> str:
        return self.datos.get(CONF_FACTURA_EN_CURSO) or DEFAULT_EN_CURSO

    async def _async_leer(self, desde: datetime, hasta: datetime) -> Lectura:
        """Consumo horario de la fuente en [desde, hasta): el medidor (corregido con el Shelly), la
        estadística externa o, con «ambos», Datadis y el medidor calibrado donde Datadis no llega."""
        if self.sin_fuente:
            self._aviso(ISSUE_SHELLY, None)  # sin fuente no hay medidor que comparar con el Shelly
            return Lectura()
        consumo = await self._async_kwh(self.datos[CONF_FUENTE], desde, hasta)
        consumo, corregidas = self._corregir_con_shelly(consumo, desde, hasta)
        ultima = max(consumo) if consumo else None
        oficial_id = self.datos.get(CONF_FUENTE_OFICIAL)
        if self.tipo_fuente != FUENTE_AMBOS or not oficial_id:
            return Lectura(consumo, corregidas, ultima)
        oficial = await self._async_kwh(oficial_id, desde, hasta)
        # La calibración contra Datadis solo cambia cuando Datadis publica horas nuevas: se guarda en
        # memoria con la última hora oficial y el inicio de la ventana, y no se recalcula cada 15 min.
        clave = (max(oficial) if oficial else None, desde)
        if self._calibracion_datadis is None or self._calibracion_datadis[0] != clave:
            self._calibracion_datadis = (clave, calibrar(oficial, consumo, REFERENCE_TZ))
        c = combinar(oficial, consumo, REFERENCE_TZ, self._calibracion_datadis[1])
        return Lectura(
            kwh=c.kwh,
            corregidas=corregidas,
            ultima_fuente=ultima,
            oficial_hasta=c.oficial_hasta,
            horas_medidor=c.horas_medidor,
            calibracion_datadis=c.ajuste,
            cociente_datadis=c.cociente,
            desacuerdo_datadis=c.desacuerdo,
        )

    async def _async_kwh(
        self, statistic_id: str, desde: datetime, hasta: datetime
    ) -> dict[datetime, Decimal]:
        """kWh horarios de una estadística, con la caché en memoria (consumo.ConsumoEnMemoria)."""
        cache = self._lecturas.get(statistic_id)
        if cache is None:
            cache = self._lecturas[statistic_id] = ConsumoEnMemoria(self.hass, statistic_id)
        return await cache.async_leer(desde, hasta, dt_util.now(REFERENCE_TZ).date())

    def _releer_todo(self) -> None:
        """La próxima lectura del consumo, entera (al cerrar un periodo)."""
        for cache in self._lecturas.values():
            cache.invalidar()

    def _guardar(self) -> None:
        """Escribe el estado en disco en 5 s (varios cambios seguidos van en una escritura)."""
        self._store.async_delay_save(lambda: self._estado, 5)

    def _aviso(
        self,
        clave: str,
        placeholders: dict[str, str] | None,
        *,
        sufijo: str = "",
        persistente: bool = False,
        reparable: bool = False,
        traduccion: str | None = None,
    ) -> None:
        """Crea (con `placeholders`) o quita (`None`) un aviso de Reparaciones de este suministro.

        `reparable`: con botón «Reparar» (repairs.py), que recibe la entrada y la subentrada."""
        issue_id = f"{clave}_{self.subentrada.subentry_id}{sufijo}"
        if placeholders is None:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
            return
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            issue_id,
            data={"entry_id": self.config_entry.entry_id, "subentry_id": self.subentrada.subentry_id}
            if reparable
            else None,
            is_fixable=reparable,
            is_persistent=persistente,
            severity=ir.IssueSeverity.WARNING,
            translation_key=traduccion or clave,
            translation_placeholders={"suministro": self.subentrada.title, **placeholders},
        )

    async def async_cargar(self) -> None:
        self._estado = await self._store.async_load() or {}
        await self._async_cargar_shelly()
        if "estadistica_id" not in self._estado:
            # Se fija al crear el suministro: renombrarlo no cambia su estadística.
            self._estado["estadistica_id"] = id_estadistica(self.subentrada.title)
            self._guardar()
        self._aplicar_fin_ultima_factura()
        self._aplicar_cambio_de_fuente()
        self._revisar_prorratas()
        self._revisar_comprobaciones_cnmc()

    def _revisar_prorratas(self) -> None:
        """Al arrancar, el límite del bono de cada periodo cerrado se recalcula con las reglas vigentes.

        Se guarda al cerrar el periodo o al subir la factura; con otra tabla de tarifas (otros tramos),
        otro límite anual o un contrato corregido sin fecha («vale para todo») se quedaba el de entonces,
        y con él el arrastre y el estado de la comprobación con la CNMC. Solo fechas y contrato: sin
        consumo ni red. Las «calculada» no lo llevan (no cuentan para el bono)."""
        cambiadas = False
        for c in self._estado.get("cerradas") or []:
            if "prorrata" in c and c["prorrata"] != (vigente := self._prorrata(*_fechas(c))):
                c["prorrata"] = vigente
                cambiadas = True
        if cambiadas:
            self._guardar()

    def _firma_fuente(self) -> list[Any]:
        """Qué fuente se usa. El medidor va por su UUID del registro: renombrarlo no es cambiar de fuente."""
        medidor = self.datos.get(CONF_FUENTE_REGISTRO) or self.datos.get(CONF_FUENTE)
        return [self.tipo_fuente, medidor, self.datos.get(CONF_FUENTE_OFICIAL)]

    def _aplicar_cambio_de_fuente(self) -> None:
        """Al reconfigurar el perfil de datos (ninguna → medidor, medidor → ambos, añadir Datadis…) se
        conserva todo (facturas reales, arrastre, estadísticas) y se marca lo calculado con la fuente
        anterior para revisarlo con la nueva (`_async_revisar_por_fuente`)."""
        firma = self._firma_fuente()
        previa = self._estado.get("fuente_aplicada")
        if previa == firma:
            return
        self._estado["fuente_aplicada"] = firma
        if previa is None:  # primera carga (o Store de antes de la v1.4): nada que revisar
            self._guardar()
            return
        _LOGGER.info(
            "%s: fuente cambiada (%s → %s); se revisan los periodos cerrados",
            self.subentrada.title,
            previa,
            firma,
        )
        for c in self._estado.get("cerradas") or []:
            c["revisar_fuente"] = True
        self._estado["revision_fuente_desde"] = dt_util.utcnow().isoformat()
        self._estado.pop("calculadas_revisadas", None)  # rellenar hacia atrás con la fuente nueva
        for clave in ("fuente_vista", "creado"):  # el aviso de fuente sin datos empieza de cero
            self._estado.pop(clave, None)
        self._escrito = None
        self._guardar()

    def _aplicar_fin_ultima_factura(self) -> None:
        """Si el usuario ha cambiado «fin de la última factura» al reconfigurar, el periodo en curso
        pasa a empezar ese día, también hacia atrás.

        `corte_actual` (lo que rige tras el primer cierre o la primera factura) manda sobre el dato
        de la subentrada, así que antes un cambio se guardaba y se ignoraba. Ahora se recuerda qué
        fecha de la subentrada se aplicó (`fin_aplicado`) y, si cambia, se aplica: se descartan los
        periodos *estimados* que acaban después y el corte manual que ya no cabe. Las facturas
        reales no se tocan (el formulario no deja poner una fecha anterior a la última).
        """
        fin = self.datos.get(CONF_FIN_ULTIMA_FACTURA)
        if "fin_aplicado" not in self._estado:  # Store de antes de este cambio: nada que aplicar
            self._estado["fin_aplicado"] = fin
            self._guardar()
            return
        if fin == self._estado["fin_aplicado"]:
            return
        self._estado["fin_aplicado"] = fin
        if fin:  # vaciar el campo no borra el periodo en curso
            nuevo = date.fromisoformat(fin)
            reales = [date.fromisoformat(c["fin"]) for c in self.cerradas if c.get("estado") == "conciliada"]
            if reales and max(reales) > nuevo:
                _LOGGER.warning(
                    "%s: el fin de la última factura (%s) es anterior a una factura real (%s); se usa esta",
                    self.subentrada.title,
                    nuevo,
                    max(reales),
                )
                nuevo = max(reales)
            self._estado["corte_actual"] = nuevo.isoformat()
            self._estado["cerradas"] = [
                c
                for c in self.cerradas
                if c.get("estado") == "conciliada" or date.fromisoformat(c["fin"]) <= nuevo
            ]
            manual = self._estado.get("corte_manual")
            if manual and not nuevo < date.fromisoformat(manual) <= nuevo + timedelta(days=62):
                self._estado.pop("corte_manual")
            self._estado.pop("calculadas_revisadas", None)  # rellenar los huecos que queden antes
            self._escrito = None
        self._guardar()

    # --- Shelly (opción C) -----------------------------------------------------------

    @property
    def usa_shelly(self) -> bool:
        return (
            bool(self.datos.get(CONF_SHELLY_IP)) and self.datos.get(CONF_SHELLY_FRECUENCIA) != "desactivada"
        )

    async def _async_cargar_shelly(self) -> None:
        """Horas del Shelly de su Store. Las de antes (dentro del Store del suministro) se pasan a él."""
        viejas = self._estado.pop("shelly_horas", None)
        if viejas is not None:
            self._shelly_horas = dict(viejas)
            # Primero el Store nuevo: si HA se para entre medias, se vuelve a migrar en el siguiente arranque.
            await self._store_shelly.async_save({"horas": self._shelly_horas})
            self._guardar()
            return
        self._shelly_horas = dict(((await self._store_shelly.async_load()) or {}).get("horas") or {})

    def horas_shelly(self) -> dict[datetime, Decimal]:
        # Hasta 70 días de horas: se convierten una vez cada vez que cambian, no en cada lectura.
        guardadas = self._shelly_horas
        if self._shelly is not None and self._shelly[0] is guardadas:
            return dict(self._shelly[1])
        # Un valor no finito (NaN guardado por una versión anterior) no entra en la factura.
        horas = {datetime.fromisoformat(k): Decimal(v) for k, v in guardadas.items()}
        horas = {h: v for h, v in horas.items() if v.is_finite()}
        self._shelly = (guardadas, horas)
        return dict(horas)

    @property
    def estado_shelly(self) -> dict[str, Any]:
        return {
            "ultima": self._estado.get("shelly_ultima"),
            "error": self._estado.get("shelly_error"),
            "horas": len(self._shelly_horas),
        }

    async def async_comprobar_shelly(self) -> None:
        """Descarga la memoria del Shelly y recalcula. Un fallo no afecta a la factura."""
        if not self.usa_shelly:
            return
        ip = self.datos[CONF_SHELLY_IP]
        ahora = dt_util.utcnow()
        try:
            texto = await async_descargar(
                async_get_clientsession(self.hass), ip, int(self.datos.get(CONF_SHELLY_CANAL, 0))
            )
        except Exception as exc:
            _LOGGER.warning("%s: no se pudo leer el Shelly %s (%s)", self.subentrada.title, ip, exc)
            self._estado["shelly_error"] = str(exc) or type(exc).__name__
            self._guardar()
            return
        # Casi un año de intervalos de 10 minutos: analizarlo en el bucle de eventos lo bloquearía.
        limite = ahora - timedelta(days=SHELLY_DIAS_CONSERVADOS)  # lo anterior lo quitaría `recortar`
        nuevas = await self.hass.async_add_executor_job(horas_completas, texto, limite)
        horas = {**self.horas_shelly(), **nuevas}
        self._shelly_horas = {h.isoformat(): str(v) for h, v in sorted(recortar(horas, ahora).items())}
        await self._store_shelly.async_save({"horas": self._shelly_horas})
        self._estado["shelly_ultima"] = ahora.isoformat()
        self._estado["shelly_error"] = None
        self._guardar()
        await self.async_request_refresh()

    def _corregir_con_shelly(
        self, consumo: dict[datetime, Decimal], desde: datetime, hasta: datetime
    ) -> tuple[dict[datetime, Decimal], int]:
        if not self.usa_shelly:
            # Perfil sin Shelly (p. ej. tras pasar a Datadis): el aviso de una configuración anterior sobra.
            self._aviso(ISSUE_SHELLY, None)
            return consumo, 0
        shelly = {h: v for h, v in self.horas_shelly().items() if desde <= h < hasta}
        if not shelly:
            return consumo, 0
        diferencia = desacuerdo(consumo, shelly, hasta)
        if diferencia > UMBRAL_DESACUERDO:
            self._aviso(
                ISSUE_SHELLY, {"ip": self.datos[CONF_SHELLY_IP], "diferencia": f"{diferencia * 100:.0f}"}
            )
            return consumo, 0
        self._aviso(ISSUE_SHELLY, None)
        return corregir(consumo, shelly)

    # --- comprobación de la factura con la CNMC ------------------------------------------

    @property
    def usa_segunda_opinion(self) -> bool:
        return bool(self.datos.get(CONF_SEGUNDA_OPINION)) and bool(self.datos.get(CONF_CODIGO_POSTAL))

    def ultima_conciliada(self) -> dict[str, Any] | None:
        """La factura real introducida más reciente (la que se comprueba con la CNMC)."""
        return next((c for c in reversed(self.cerradas) if c.get("estado") == "conciliada"), None)

    async def async_comprobar_factura(self, *, forzar: bool = False) -> dict[str, Any] | None:
        """Comprueba con el simulador de la CNMC la última factura real (una vez; `forzar` la repite).

        La curva horaria del medidor se ajusta a los kWh del contador de la factura en cada
        periodo (P1, P2, P3): la CNMC calcula con la misma energía que la comercializadora, así
        que la diferencia es de la factura, no del medidor. El resultado se guarda en el periodo
        («cnmc» o «cnmc_error»), sale en `sensor.*_comprobacion_factura` y, si no cuadra, en
        Reparaciones (un aviso por factura, que se puede ignorar).

        Si a la curva le faltan horas del periodo y la diferencia supera la tolerancia, el estado
        es «incompleta» (sin aviso), y la comprobación diaria la repite cuando haya más horas.
        """
        async with self._candado_cnmc:
            return await self._async_comprobar_factura(forzar=forzar)

    def programar_comprobacion(self) -> None:
        """Comprobación con la CNMC en segundo plano, ligada a la entrada para que se cancele en
        la recarga que sigue a la conciliación."""
        if self.usa_segunda_opinion:
            self.config_entry.async_create_background_task(
                self.hass, self.async_comprobar_factura(forzar=True), f"{DOMAIN} comprobación CNMC"
            )

    async def _async_comprobar_factura(self, *, forzar: bool) -> dict[str, Any] | None:
        c = self.ultima_conciliada()
        if not self.usa_segunda_opinion or c is None:
            return c.get("cnmc") if c else None
        previa = c.get("cnmc")
        if previa and not forzar and previa.get("estado") != "incompleta":
            return previa
        inicio, fin = _fechas(c)
        desde, hasta = periodo_curva(inicio, fin, REFERENCE_TZ)
        desde, hasta = desde.astimezone(UTC), hasta.astimezone(UTC)
        horas_periodo = int((hasta - desde).total_seconds()) // 3600
        if self.sin_fuente:
            # Sin curva: la de la factura repartida a partes iguales en cada periodo. La CNMC no puede
            # dar el mismo importe (el precio de cada hora pesa distinto), solo una comprobación aproximada.
            consumo = {
                m.inicio.astimezone(UTC): m.kwh for m in self._historial_de_factura(self._margen_medio())
            }
        else:
            consumo = (await self._async_leer(desde, hasta)).kwh
        horas = self._ajustar_al_contador(
            {t: v for t, v in consumo.items() if desde <= t < hasta}, c.get("kwh") or {}
        )
        if previa and not forzar and len(horas) <= previa.get("horas", 0):
            # Comprobada con la curva incompleta y sin horas nuevas desde entonces: repetirla
            # daría lo mismo. Se reintenta sola (a las 04:10) cuando llegan las que faltaban.
            return previa
        contrato, _ = contratos_del_periodo(self.datos, inicio, fin)
        try:
            simulacion = await async_simular(
                async_get_clientsession(self.hass),
                horas=horas,
                inicio=inicio,
                fin=fin,
                potencia_p1_kw=contrato.potencia_p1_kw,
                potencia_p2_kw=contrato.potencia_p2_kw,
                codigo_postal=self.datos[CONF_CODIGO_POSTAL],
                bono=contrato.bono,
                categoria=self.datos.get(CONF_CATEGORIA),
                zona=REFERENCE_TZ,
            )
        except CnmcNoResponde as exc:
            _LOGGER.warning("%s: el simulador de la CNMC no responde (%s)", self.subentrada.title, exc)
            c["cnmc_error"] = str(exc)[:200]
            self._guardar()
            self.async_update_listeners()
            return None
        diferencia = (Decimal(c["total"]) - simulacion.total).quantize(Decimal("0.01"))
        c["cnmc"] = {
            **simulacion.a_dict(),
            "diferencia": float(diferencia),
            "estado": self._estado_cnmc(c, diferencia, len(horas), horas_periodo),
            "fecha": dt_util.utcnow().isoformat(),
            "horas": len(horas),
            "horas_periodo": horas_periodo,
        }
        c.pop("cnmc_error", None)
        self._guardar()
        self._avisar_cnmc(c)
        self.async_update_listeners()
        return c["cnmc"]

    def _estado_cnmc(
        self,
        c: dict[str, Any],
        diferencia: Decimal,
        horas: int,
        horas_periodo: int,
        sin_fuente: bool | None = None,
    ) -> str:
        """Estado de la comprobación de la factura `c` según su diferencia con la CNMC.

        `sin_fuente`: si se comprobó sin curva horaria real (por defecto, la fuente de ahora)."""
        if abs(diferencia) <= TOLERANCIA_CNMC:
            return "correcta"
        if self.sin_fuente if sin_fuente is None else sin_fuente:
            return "aproximada"  # sin curva horaria real: informativo, sin aviso
        if horas < horas_periodo:
            # Faltan horas de la curva: la energía cuadra (se ajusta al contador por periodo),
            # pero repartida en menos horas y a otros precios. No es un «no cuadra» de la factura.
            return "incompleta"
        # La CNMC no aplica el saldo de kWh con descuento de periodos anteriores (arrastre).
        con_arrastre = (c.get("bonificados") or 0) > (c.get("prorrata") or 0)
        return "arrastre" if con_arrastre else "no_cuadra"

    def _revisar_comprobaciones_cnmc(self) -> None:
        """Al arrancar, las comprobaciones guardadas se revisan con las reglas vigentes (tolerancia,
        curva incompleta, arrastre) y los avisos se ponen de acuerdo con ellas.

        Sin volver a preguntar a la CNMC: basta lo guardado (diferencia, horas de la curva y límite
        del bono, ya revisado). Así una factura comprobada con otra versión pasa a «correcta» si ahora
        queda dentro del margen, o a «arrastre» o «incompleta» (sin aviso) si es lo que le toca hoy.
        «aproximada» e «incompleta» fuera del margen se quedan: dependían de la curva de entonces.
        """
        cambiadas = False
        for c in self._estado.get("cerradas") or []:
            cnmc = c.get("cnmc")
            if not cnmc or "diferencia" not in cnmc or "horas" not in cnmc:
                continue
            estado = cnmc.get("estado")
            diferencia = Decimal(str(cnmc["diferencia"]))
            if abs(diferencia) > TOLERANCIA_CNMC and estado in ("aproximada", "incompleta"):
                continue
            nuevo = self._estado_cnmc(
                c,
                diferencia,
                cnmc["horas"],
                cnmc.get("horas_periodo", cnmc["horas"]),
                # «arrastre» y «no cuadra» se comprobaron con curva real, sea cual sea la fuente de hoy.
                sin_fuente=False if estado in ("arrastre", "no_cuadra") else None,
            )
            if nuevo != estado:
                cnmc["estado"] = nuevo
                cambiadas = True
        if cambiadas:
            self._guardar()
        self._sincronizar_avisos_cnmc()

    def _sincronizar_avisos_cnmc(self) -> None:
        """Un aviso por cada factura guardada que no cuadra, y ninguno más.

        Los avisos son persistentes: el de una factura que ya no está (sustituida por una rectificativa
        o más antigua que las `MAX_CERRADAS` que se guardan) no lo volvería a revisar nada."""
        prefijo = f"{ISSUE_CNMC}_{self.subentrada.subentry_id}_"
        no_cuadran = [c for c in self.cerradas if (c.get("cnmc") or {}).get("estado") == "no_cuadra"]
        vigentes = {f"{prefijo}{c['fin']}" for c in no_cuadran}
        for dominio, issue_id in list(ir.async_get(self.hass).issues):
            if dominio == DOMAIN and issue_id.startswith(prefijo) and issue_id not in vigentes:
                ir.async_delete_issue(self.hass, DOMAIN, issue_id)
        for c in no_cuadran:
            self._avisar_cnmc(c)  # igual que estaba (si se ignoró, sigue ignorado)

    def _ajustar_al_contador(
        self, horas: dict[datetime, Decimal], kwh_factura: dict[str, Any]
    ) -> dict[datetime, Decimal]:
        """Escala las horas de cada periodo P1/P2/P3 para que sumen los kWh del contador."""
        if not kwh_factura:
            return horas
        margen = self._margen_medio()
        periodo = {t: self._precio(t, t.astimezone(REFERENCE_TZ), margen)[0] for t in horas}
        medido = {p: sum((v for t, v in horas.items() if periodo[t] == p), Decimal(0)) for p in kwh_factura}
        factor = {
            p: Decimal(str(kwh_factura[p])) / medido[p] if medido[p] > 0 else Decimal(1) for p in kwh_factura
        }
        return {t: v * factor.get(periodo[t], Decimal(1)) for t, v in horas.items()}

    def _avisar_cnmc(self, c: dict[str, Any]) -> None:
        """Aviso persistente (uno por factura, se puede ignorar) si la factura no cuadra con la CNMC."""
        cnmc = c.get("cnmc") or {}
        if cnmc.get("estado") != "no_cuadra":
            self._aviso(ISSUE_CNMC, None, sufijo=f"_{c['fin']}")
            return
        inicio, fin = _fechas(c)
        lengua = idioma(self.hass.config.language)
        self._aviso(
            ISSUE_CNMC,
            {
                "inicio": fecha(inicio, lengua),
                "fin": fecha(fin, lengua),
                "factura": numero(Decimal(c["total"]), ".2f", lengua),
                "cnmc": numero(cnmc["total"], ".2f", lengua),
                "diferencia": numero(abs(cnmc["diferencia"]), ".2f", lengua),
            },
            sufijo=f"_{c['fin']}",
            persistente=True,
        )

    @property
    def estadistica_id(self) -> str:
        return self._estado.get("estadistica_id") or id_estadistica(self.subentrada.title)

    async def async_guardar_ya(self) -> None:
        """Al descargar la entrada, escribe lo que async_delay_save tenía pendiente.

        Si no, una recarga en esos 5 s arrancaría con el disco atrasado, y el guardado
        pendiente de una subentrada ya borrada volvería a crear su fichero tras limpiarlo.
        """
        await self._store.async_save(self._estado)

    # --- periodo --------------------------------------------------------------------

    @property
    def inicio_periodo(self) -> date | None:
        """Primer día (excluido) del periodo en curso: el último corte o el fin de la última factura."""
        guardado = self._estado.get("corte_actual")
        if guardado:
            return date.fromisoformat(guardado)
        fin = self.datos.get(CONF_FIN_ULTIMA_FACTURA)
        return date.fromisoformat(fin) if fin else None

    # --- actualización --------------------------------------------------------------

    async def _async_update_data(self) -> DatosFacturacion:
        async with self._candado:
            return await self._async_actualizar()

    async def _async_actualizar(self) -> DatosFacturacion:
        inicio = self.inicio_periodo
        if inicio is None:
            self._aviso(ISSUE_SIN_FECHA, {})
            return DatosFacturacion(problema="sin_fecha", anterior=self._anterior())
        self._aviso(ISSUE_SIN_FECHA, None)
        ahora = dt_util.now(REFERENCE_TZ)
        hoy = ahora.date()

        # Cierra los periodos cuyo corte ya pasó (pueden ser varios si HA estuvo parado).
        for _ in range(MAX_CERRADAS):
            corte = self._corte(inicio)
            if hoy <= corte:
                break
            self._releer_todo()
            cerrada = await self._async_estimar(inicio, corte, ahora, cerrar=True)
            await self._async_escribir_coste(cerrada)
            self._guardar_cerrada(inicio, corte, cerrada)
            inicio = corte
        await self._async_recalcular_incompletas(ahora)
        await self._async_revisar_por_fuente(ahora)
        corte = self._corte(inicio)
        datos = await self._async_estimar(inicio, corte, ahora, cerrar=False)
        datos.anterior = self._anterior_de(inicio)
        await self._async_escribir_coste(datos)
        await self._async_calcular_anteriores(ahora)
        self._avisar_huecos()
        self._avisar_calibracion()
        self._avisar_fuente_sin_datos(datos.lectura, ahora)
        self._avisar_medidor_datadis(datos.lectura)
        await self._async_escribir_facturas()
        if self.datos.get(CONF_FUENTE):
            await async_revisar_panel(
                self.hass,
                self.subentrada.subentry_id,
                self.subentrada.title,
                self.datos[CONF_FUENTE],
                self.estadistica_id,
            )
        return datos

    def _avisar_fuente_sin_datos(self, lectura: Lectura | None, ahora: datetime) -> None:
        """Aviso si la fuente lleva más de lo razonable sin ningún dato (renombrada, borrada, caída).

        Se mide desde la última hora con dato vista (o, si nunca ha dado ninguna, desde que se cargó el
        suministro por primera vez), así un suministro recién creado no avisa enseguida."""
        if self.sin_fuente:
            self._aviso(ISSUE_FUENTE_SIN_DATOS, None)
            return
        ultima = lectura.ultima_fuente if lectura else None
        vista = self._estado.get("fuente_vista")
        if ultima is not None and (vista is None or ultima.isoformat() > vista):
            self._estado["fuente_vista"] = vista = ultima.isoformat()
            self._guardar()
        referencia = datetime.fromisoformat(vista) + timedelta(hours=1) if vista else None
        if referencia is None:
            if "creado" not in self._estado:
                self._estado["creado"] = ahora.isoformat()
                self._guardar()
            referencia = datetime.fromisoformat(self._estado["creado"])
        limite = SIN_DATOS_EXTERNA if self.fuente_externa else SIN_DATOS_MEDIDOR
        if ahora - referencia <= limite:
            self._aviso(ISSUE_FUENTE_SIN_DATOS, None)
            return
        datadis = self.tipo_fuente == FUENTE_DATADIS
        lengua = idioma(self.hass.config.language)
        self._aviso(
            ISSUE_FUENTE_SIN_DATOS,
            {
                "fuente": self.datos[CONF_FUENTE],
                "desde": fecha(referencia.astimezone(REFERENCE_TZ), lengua, hora=True) if vista else "—",
                "horas": str(int(limite.total_seconds() // 3600)),
            },
            reparable=not datadis,
            traduccion=ISSUE_FUENTE_SIN_DATOS_DATADIS if datadis else None,
        )

    def _avisar_medidor_datadis(self, lectura: Lectura | None) -> None:
        """Medidor + Datadis: aviso si el medidor y Datadis no cuadran en los días comunes."""
        if lectura is None or not lectura.desacuerdo_datadis or lectura.cociente_datadis is None:
            self._aviso(ISSUE_MEDIDOR_DATADIS, None)
            return
        self._aviso(
            ISSUE_MEDIDOR_DATADIS,
            {
                "medidor": self.datos[CONF_FUENTE],
                "datadis": self.datos.get(CONF_FUENTE_OFICIAL) or "—",
                "diferencia": f"{(lectura.cociente_datadis - 1) * 100:+.0f}",
            },
            # Calibrado o no, cada caso con su texto (traducible); mismo aviso.
            traduccion=(
                None if lectura.calibracion_datadis is not None else ISSUE_MEDIDOR_DATADIS_SIN_CALIBRAR
            ),
        )

    async def _async_escribir_coste(self, datos: DatosFacturacion) -> None:
        """Reescribe la estadística de coste del periodo si ha cambiado algo."""
        horas = datos.coste_horas
        if not horas or datos.estimacion is None or datos.estimacion.acumulado is None:
            return
        firma = (min(horas), max(horas), datos.estimacion.acumulado.total)
        if firma == self._escrito:
            return
        # Solo las horas que han cambiado desde la última escritura. Se reescriben todas una vez al
        # día, al cambiar de periodo y tras reescribir un periodo cerrado (`_escrito = None`).
        hoy = dt_util.now(REFERENCE_TZ).date()
        if (
            self._escrito is None
            or self._coste_escrito_dia != hoy
            or min(self._coste_escrito, default=None) != min(horas)
        ):
            self._coste_escrito = {}
            self._coste_escrito_dia = hoy
        escritas = dict(self._coste_escrito)
        try:
            await async_escribir(
                self.hass,
                self.estadistica_id,
                self.subentrada.title,
                horas,
                copiar_de=self._coste_hoy_heredado(),
                escritas=escritas,
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo escribir la estadística de coste", self.subentrada.title)
            self._coste_escrito = {}
            return
        self._coste_escrito = escritas
        self._escrito = firma

    async def _async_escribir_facturas(self) -> None:
        """Estadística de la evolución de las facturas, si han cambiado los periodos cerrados."""
        cerradas = self.cerradas
        firma = [[c["inicio"], c["fin"], c["total"]] for c in cerradas]
        previa = self._estado.get("facturas_escritas") or []
        if not cerradas or firma == previa:
            return
        # Si ha desaparecido algún periodo (una factura real sustituye a la calculada o estimada
        # con otras fechas), se rehace la estadística para que no quede su barra.
        inicios = {c["inicio"] for c in cerradas}
        rehacer = any(p[0] not in inicios and p[0] >= cerradas[0]["inicio"] for p in previa)
        try:
            await async_escribir_facturas(
                self.hass, self.estadistica_id, self.subentrada.title, cerradas, REFERENCE_TZ, rehacer=rehacer
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo escribir la estadística de facturas", self.subentrada.title)
            return
        self._estado["facturas_escritas"] = firma
        self._guardar()

    async def _async_calcular_anteriores(self, ahora: datetime) -> None:
        """Calcula hacia atrás los periodos anteriores a la primera factura conocida.

        Con el consumo de la fuente (medidor de HA o Datadis) y los precios guardados, un
        periodo por mes (mismo día de corte). Quedan como «calculada»: no cuentan para el
        arrastre del bono ni para la calibración, y una factura real del mismo periodo las
        sustituye. Se para al primer periodo sin consumo o sin precios guardados y lo vuelve
        a mirar al día siguiente (el consumo de Datadis llega con días de retraso); si faltan
        precios porque el histórico aún se está llenando, en el siguiente ciclo.
        """
        if self._estado.get("calculadas_revisadas") == ahora.date().isoformat() or self.sin_fuente:
            return
        cerradas = self.cerradas
        fin = date.fromisoformat(cerradas[0]["inicio"]) if cerradas else self.inicio_periodo
        if fin is None:
            return
        for _ in range(MAX_CALCULADAS_POR_CICLO):
            inicio = corte_anterior(fin)
            if len(self.cerradas) >= MAX_CERRADAS or inicio < ahora.date() - timedelta(days=DIAS_PRECIOS):
                self._marcar_calculadas(ahora)
                return
            try:
                datos = await self._async_estimar(inicio, fin, ahora, cerrar=True, arrastre=0)
            except Exception:
                self._marcar_calculadas(ahora)
                return
            horas = datos.horas_medidas
            if not horas or datos.estimacion is None or datos.horas_sin_consumo > horas // 20:
                self._marcar_calculadas(ahora)  # sin consumo de ese periodo
                return
            if datos.horas_sin_precio > horas // 50:
                return  # el histórico de precios aún se está llenando
            calculadas = self._estado.get("cerradas", [])
            calculadas.append(_fila_periodo(inicio, fin, datos.estimacion, "calculada"))
            calculadas.sort(key=lambda c: c["fin"])
            self._estado["cerradas"] = calculadas
            self._guardar()
            fin = inicio

    def _marcar_calculadas(self, ahora: datetime) -> None:
        self._estado["calculadas_revisadas"] = ahora.date().isoformat()
        self._guardar()

    def _coste_hoy_heredado(self) -> str | None:
        """entity_id del «coste hoy» de la v0.2 si este suministro lo heredó."""
        unique_id = (self.datos.get(CONF_IDS_HEREDADOS) or {}).get("coste_hoy")
        if not unique_id:
            return None
        return er.async_get(self.hass).async_get_entity_id("sensor", DOMAIN, unique_id)

    def _corte(self, inicio: date) -> date:
        """Corte del periodo que empieza en `inicio`: el fijado a mano o el mismo día del mes siguiente."""
        manual = self._estado.get("corte_manual")
        if manual and date.fromisoformat(manual) > inicio:
            return date.fromisoformat(manual)
        return corte_siguiente(inicio)

    async def async_fijar_corte(self, corte: date) -> None:
        """Fin del periodo en curso fijado por el usuario (fecha de lectura real de la COR)."""
        async with self._candado:
            inicio = self.inicio_periodo
            if inicio is None or not inicio < corte <= inicio + timedelta(days=62):
                raise ValueError(
                    f"El fin del periodo debe estar entre {inicio} y {inicio and inicio + timedelta(days=62)}"
                )
            self._estado["corte_manual"] = corte.isoformat()
            self._guardar()
        await self.async_request_refresh()

    @property
    def cerradas(self) -> list[dict[str, Any]]:
        """Periodos cerrados (estimados o conciliados), del más antiguo al más reciente."""
        return list(self._estado.get("cerradas") or [])

    def periodo_pendiente(self) -> tuple[date, date] | None:
        """Periodo que más probablemente falta por conciliar: el último cerrado sin factura real."""
        c = self._anterior()
        if c is None or c.get("estado") == "conciliada":
            return None
        return _fechas(c)

    def _anterior_de(self, inicio: date) -> dict[str, Any] | None:
        """El periodo inmediatamente anterior al que empieza en `inicio` (el que acaba ese día).

        Si falta (por ejemplo, se ha introducido una factura más antigua), no se muestra otra."""
        c = self._anterior()
        return c if c is not None and c["fin"] == inicio.isoformat() else None

    def _anterior(self) -> dict[str, Any] | None:
        cerradas = self._estado.get("cerradas") or []
        return cerradas[-1] if cerradas else None

    def _guardar_cerrada(self, inicio: date, corte: date, datos: DatosFacturacion) -> None:
        fila = self._fila_estimada(inicio, corte, datos)
        if fila is None:
            # Sin fuente ni factura real con la que estimar: el periodo en curso avanza igualmente.
            if self.sin_fuente:
                self._estado["corte_actual"] = corte.isoformat()
                if (
                    self._estado.get("corte_manual")
                    and date.fromisoformat(self._estado["corte_manual"]) <= corte
                ):
                    self._estado.pop("corte_manual")
                self._guardar()
            return
        cerradas = [c for c in self._estado.get("cerradas", []) if c["fin"] != corte.isoformat()]
        cerradas.append(fila)
        self._estado["cerradas"] = cerradas[-MAX_CERRADAS:]
        self._estado["corte_actual"] = corte.isoformat()
        if self._estado.get("corte_manual") and date.fromisoformat(self._estado["corte_manual"]) <= corte:
            self._estado.pop("corte_manual")
        self._guardar()
        self._sincronizar_avisos_cnmc()  # la factura más antigua puede haber salido de las guardadas
        if fila.get("incompleta"):
            # Recién estimada: no se vuelve a calcular hasta la hora siguiente.
            self._estado["incompletas_revisadas"] = (
                dt_util.now(REFERENCE_TZ).replace(minute=0, second=0, microsecond=0).isoformat()
            )
            # Lo normal con Datadis (las últimas horas aún no publicadas): sin WARNING.
            nivel = logging.INFO if self._retraso_normal(fila, dt_util.utcnow()) else logging.WARNING
            _LOGGER.log(
                nivel,
                "%s: periodo %s – %s cerrado con %d horas sin consumo (%d pendientes de publicar); "
                "se recalculará cuando lleguen",
                self.subentrada.title,
                inicio,
                corte,
                datos.horas_sin_consumo,
                datos.horas_pendientes,
            )

    def _fila_estimada(self, inicio: date, corte: date, datos: DatosFacturacion) -> dict[str, Any] | None:
        """Periodo cerrado con la estimación. Si faltan horas de consumo (cuentan como 0 kWh),
        queda marcado «incompleta» (según `_incompleta`) y se recalcula cuando lleguen
        (`_async_recalcular_incompletas`)."""
        est = datos.estimacion
        if est is None:
            return None
        fila: dict[str, Any] = {
            **_fila_periodo(inicio, corte, est, "estimada", previstos=self.sin_fuente),
            "emision": est.emision.isoformat(),
            "horas_sin_consumo": datos.horas_sin_consumo,
            "prorrata": self._prorrata(inicio, corte),
            "bonificados": None,
            "total_estimado": str(est.prevision.total),
            "kwh_medido_bruto": str(datos.kwh_medido_bruto.quantize(Decimal("0.001"))),
            "horas": datos.horas_medidas,
        }
        if self._incompleta(datos.horas_sin_consumo):
            fila["incompleta"] = True
        if datos.horas_pendientes:  # para saber si es solo el retraso normal de la fuente (_retraso_normal)
            fila["horas_pendientes"] = datos.horas_pendientes
            if datos.datos_hasta is not None:
                fila["datos_hasta"] = datos.datos_hasta.isoformat()
        if datos.horas_medidor:
            fila["horas_medidor"] = datos.horas_medidor  # «ambos»: horas del medidor, aún sin Datadis
        if datos.horas_pendientes or datos.horas_medidor:
            fila["provisional"] = True
        if self.sin_fuente:
            fila["aproximada"] = True  # sin fuente: kWh previstos con la última factura real
        return fila

    def _incompleta(self, horas_sin_consumo: int) -> bool:
        """Si un periodo cerrado con esas horas sin consumo se marca «incompleta» (y se avisa)."""
        if not horas_sin_consumo:
            return False
        if _es_externa(self.datos):  # estadística externa: las horas que faltan llegarán
            return True
        return horas_sin_consumo > UMBRAL_HORAS_INCOMPLETA

    def _a_medias(self, c: dict[str, Any]) -> bool:
        """Periodo estimado cerrado al que faltan horas de consumo (su consumo real es mayor)."""
        if c.get("aproximada"):  # sin fuente: ni se midió nada, ni deja sobrante
            return True
        # Las guardadas antes del umbral (p. ej. 1 h con HA parado) se dan por enteras.
        return bool(c.get("incompleta")) and self._incompleta(c.get("horas_sin_consumo", 0))

    def _retraso_normal(self, c: dict[str, Any], ahora: datetime) -> bool:
        """Al periodo solo le faltan horas pendientes de publicar y aún dentro del retraso normal de la
        fuente (Datadis tarda días): no es un hueco, no se avisa."""
        if c.get("horas_sin_consumo", 0) > c.get("horas_pendientes", 0) or not c.get("datos_hasta"):
            return False
        return ahora - datetime.fromisoformat(c["datos_hasta"]) <= self.retraso_normal

    def _incompletas(self, hoy: date) -> list[dict[str, Any]]:
        """Periodos estimados cerrados que aún se recalculan: los que tienen horas sin consumo, los que
        tienen horas pendientes de publicar (estimadas; con un medidor, p. ej. la última hora si se
        cerró antes de que el recorder la compilase) y, con «ambos», los que tienen horas del medidor
        que Datadis aún no ha confirmado."""
        limite = (hoy - timedelta(days=DIAS_RECALCULO_INCOMPLETA)).isoformat()
        return [
            c
            for c in self.cerradas
            if c.get("estado") == "estimada"
            and not c.get("aproximada")
            and (self._a_medias(c) or c.get("horas_medidor") or c.get("horas_pendientes"))
            and c["fin"] >= limite
        ]

    async def _async_recalcular_incompletas(self, ahora: datetime) -> None:
        """Rehace los periodos cerrados a los que les faltaban horas si han llegado (una vez por hora).

        Se sustituye la fila (total, kWh, horas que faltan) y se reescribe su estadística de coste
        desplazando las horas posteriores. Cuando ya no falta ninguna deja de estar «incompleta» y
        el aviso se quita. Va dentro del candado del cierre.
        """
        hoy = ahora.date()
        pendientes = self._incompletas(hoy)
        hora = ahora.replace(minute=0, second=0, microsecond=0).isoformat()
        if pendientes and self._estado.get("incompletas_revisadas") != hora:
            self._estado["incompletas_revisadas"] = hora
            for c in pendientes:
                inicio, fin = _fechas(c)
                try:
                    datos = await self._async_estimar(inicio, fin, ahora, cerrar=True)
                except Exception:
                    continue  # ya registrado en _async_estimar; se reintenta en la próxima hora
                if (
                    datos.horas_sin_consumo >= c.get("horas_sin_consumo", 0)
                    and datos.horas_medidor >= c.get("horas_medidor", 0)
                    and datos.horas_pendientes >= c.get("horas_pendientes", 0)
                ):
                    # No ha llegado nada nuevo (ni ha pasado el retraso normal de lo pendiente, que
                    # entonces cuenta como hueco y la fila deja de ser provisional).
                    continue
                fila = self._fila_estimada(inicio, fin, datos)
                if fila is None:
                    continue
                fila["emision"] = c.get("emision", fila["emision"])
                cerradas = [x for x in self._estado.get("cerradas", []) if x is not c]
                cerradas.append(fila)
                cerradas.sort(key=lambda x: x["fin"])
                self._estado["cerradas"] = cerradas
                _LOGGER.info(
                    "%s: periodo %s – %s recalculado (%d horas sin consumo; antes, %d)",
                    self.subentrada.title,
                    inicio,
                    fin,
                    datos.horas_sin_consumo,
                    c.get("horas_sin_consumo", 0),
                )
                await self._async_reescribir_coste_cerrado(datos)
                self._escrito = None  # el periodo en curso se reescribe sobre la suma nueva
            self._guardar()
        self._avisar_incompletas(hoy)

    async def _async_revisar_por_fuente(self, ahora: datetime) -> None:
        """Tras cambiar la fuente: rehace con la nueva los periodos cerrados marcados (una vez por hora y
        unos pocos cada vez). Las facturas reales no cambian, solo lo que midió la fuente en su periodo
        (para la calibración). Los periodos estimados o calculados se sustituyen si la fuente nueva los
        cubre casi enteros; si aún no tiene datos (Datadis rellenando), se reintenta la hora siguiente."""
        marcadas = [c for c in self.cerradas if c.get("revisar_fuente")]
        hora = ahora.replace(minute=0, second=0, microsecond=0).isoformat()
        if not marcadas or self._estado.get("fuente_revisada") == hora:
            return
        self._estado["fuente_revisada"] = hora
        desde_cambio = self._estado.get("revision_fuente_desde")
        caducada = desde_cambio is not None and dt_util.utcnow() - datetime.fromisoformat(
            desde_cambio
        ) > timedelta(days=DIAS_REVISION_FUENTE)
        for c in sorted(marcadas, key=lambda x: x["fin"], reverse=True)[:MAX_REVISADAS_POR_HORA]:
            if caducada or self.sin_fuente:
                # Sin fuente nueva (o sin datos tras dos semanas): se queda como estaba.
                c.pop("revisar_fuente", None)
                continue
            inicio, fin = _fechas(c)
            try:
                if c.get("estado") == "conciliada":
                    await self._async_revisar_conciliada(c, inicio, fin)
                    continue
                calculada = c.get("estado") == "calculada"
                datos = await self._async_estimar(
                    inicio, fin, ahora, cerrar=True, arrastre=0 if calculada else None
                )
            except Exception:
                _LOGGER.debug("%s: revisión de %s–%s aplazada", self.subentrada.title, inicio, fin)
                continue
            horas = datos.horas_medidas + datos.horas_pendientes
            if datos.estimacion is None or not horas or datos.horas_sin_consumo > horas // 20:
                continue  # la fuente nueva aún no cubre este periodo: otra hora
            if calculada:
                fila = _fila_periodo(inicio, fin, datos.estimacion, "calculada")
            else:
                fila = self._fila_estimada(inicio, fin, datos)
                if fila is None:
                    continue
                fila["emision"] = c.get("emision", fila["emision"])
            cerradas = [x for x in self._estado.get("cerradas", []) if x is not c]
            cerradas.append(fila)
            cerradas.sort(key=lambda x: x["fin"])
            self._estado["cerradas"] = cerradas
            await self._async_reescribir_coste_cerrado(datos)
            self._escrito = None
        if not any(c.get("revisar_fuente") for c in self.cerradas):
            self._estado.pop("revision_fuente_desde", None)
        self._guardar()

    async def _async_revisar_conciliada(self, c: dict[str, Any], inicio: date, fin: date) -> None:
        """Lo que midió la fuente nueva en el periodo de una factura real (para calibrar el medidor)."""
        desde = _inicio_local(inicio + timedelta(days=1)).astimezone(UTC)
        hasta = _inicio_local(fin + timedelta(days=1)).astimezone(UTC)
        consumo = (await self._async_leer(desde, hasta)).kwh
        horas = int((hasta - desde).total_seconds()) // 3600
        c["kwh_medido_bruto"] = str(sum(consumo.values(), Decimal(0)))
        c["horas"] = horas if consumo else 0
        c["horas_sin_consumo"] = horas - len(consumo)
        if len(consumo) >= horas - horas // 20:
            c.pop("revisar_fuente", None)

    async def _async_reescribir_coste_cerrado(self, datos: DatosFacturacion) -> None:
        if not datos.coste_horas:
            return
        try:
            await async_reescribir_periodo(
                self.hass, self.estadistica_id, self.subentrada.title, datos.coste_horas
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo reescribir la estadística de coste", self.subentrada.title)

    def _avisar_incompletas(self, hoy: date) -> None:
        # Sin aviso lo que solo es el retraso normal de la fuente ni lo que el medidor ya cubre («ambos»).
        ahora = dt_util.utcnow()
        pendientes = [
            c for c in self._incompletas(hoy) if self._a_medias(c) and not self._retraso_normal(c, ahora)
        ]
        if not pendientes:
            self._aviso(ISSUE_INCOMPLETO, None)
            return
        lengua = idioma(self.hass.config.language)
        self._aviso(
            ISSUE_INCOMPLETO,
            {
                "periodos": ", ".join(
                    f"{fecha(c['inicio'], lengua)} → {fecha(c['fin'], lengua)} "
                    f"({c.get('horas_sin_consumo', 0)} h)"
                    for c in pendientes
                ),
                "horas": str(sum(c.get("horas_sin_consumo", 0) for c in pendientes)),
                "dias": str(DIAS_RECALCULO_INCOMPLETA),
            },
        )

    # --- bono y calibración (F4) -------------------------------------------------------

    def _dias_emision(self) -> int:
        return int(self.datos.get(CONF_DIAS_EMISION, DEFAULT_DIAS_EMISION))

    def _limite_anual(self) -> int | None:
        return suministro_de(self.datos).limite_anual_kwh

    def _con_bono_alguna_vez(self) -> bool:
        anteriores = self.datos.get(CONF_CONTRATOS_ANTERIORES) or []
        return bool(self._limite_anual()) or any(c.get(CONF_BONO, "ninguno") != "ninguno" for c in anteriores)

    @property
    def con_bono_hoy(self) -> bool:
        """El contrato vigente tiene bono social."""
        return bool(self._limite_anual())

    def _prorrata(self, inicio: date, fin: date) -> int:
        inicial, cambios = contratos_del_periodo(self.datos, inicio, fin)
        limites = {d: s.limite_anual_kwh for d, s in cambios.items()}
        return prorrata(inicio, fin, inicial.limite_anual_kwh, self.historico.tarifas, limites)

    def _arrastre(self, inicio: date) -> int:
        """kWh con descuento no consumidos en los periodos cerrados, disponibles desde `inicio`.

        Las «calculada» (sin `prorrata`) no cuentan. De un periodo medido a medias solo se sabe que
        consumió al menos lo medido: lo que se pasó del límite se descuenta del saldo (es real), pero
        no deja sobrante (el consumo que falta no se midió, no es que no se gastara).
        """
        if not self._con_bono_alguna_vez():
            return 0
        periodos = []
        for c in self._estado.get("cerradas", []):
            if "prorrata" not in c:
                continue
            prorrata_periodo, consumo = int(c.get("prorrata", 0)), int(c.get("consumo", 0))
            if self._a_medias(c):
                consumo = max(consumo, prorrata_periodo)  # sobrante 0; lo usado, como hasta ahora
            periodos.append(PeriodoBono(*_fechas(c), prorrata_periodo, consumo, c.get("bonificados")))
        return saldo_arrastre(periodos, inicio, int(self.datos.get(CONF_ARRASTRE_INICIAL) or 0))

    def _facturas_calibracion(self) -> tuple[list[PeriodoCalibracion], list[tuple[dict[str, Any], Decimal]]]:
        """Facturas conciliadas que calibran y, aparte, las que no cuadran con el medidor.

        Fuera sin aviso: las que no tienen curva del medidor y aquellas cuyo periodo el medidor no
        vio entero (umbral de `_incompleta`): los kWh del contador son de todo el periodo y los del
        medidor no, y el cociente saldría disparado (instalación nueva con la última factura: ≈ 1,3).
        Fuera con aviso (`_avisar_calibracion`): las que, con la curva entera, dan un cociente
        contador / medidor fuera de `ALFA_VALIDO` (factura mal introducida o medidor que no mide
        todo el suministro). Así una factura mala nunca pesa en el ajuste y las buenas siguen
        calibrando; vale también para las filas guardadas por versiones anteriores.
        """
        validas: list[PeriodoCalibracion] = []
        descartadas: list[tuple[dict[str, Any], Decimal]] = []
        for c in self._estado.get("cerradas", []):
            if c.get("estado") != "conciliada" or not c.get("kwh_medido_bruto") or not c.get("horas"):
                continue
            if self._incompleta(c.get("horas_sin_consumo", 0)):
                continue
            p = PeriodoCalibracion(Decimal(c["consumo"]), Decimal(c["kwh_medido_bruto"]), int(c["horas"]))
            if p.kwh_medido <= 0:
                continue
            cociente = p.kwh_real / p.kwh_medido
            if ALFA_VALIDO[0] <= cociente <= ALFA_VALIDO[1]:
                validas.append(p)
            else:
                descartadas.append((c, cociente))
        return validas, descartadas

    def ajuste(self) -> Ajuste | None:
        """Calibración del medidor con las facturas conciliadas que cuadran con él.

        Con «ambos» no: Datadis ya es el dato del contador y el medidor se calibra contra Datadis."""
        if self.tipo_fuente in (FUENTE_AMBOS, FUENTE_NINGUNA):
            return None
        return ajustar(self._facturas_calibracion()[0])

    def _avisar_calibracion(self) -> None:
        """Aviso (uno por suministro, mientras dure) con las facturas que no cuadran con el medidor."""
        descartadas = self._facturas_calibracion()[1]
        if not descartadas:
            self._aviso(ISSUE_CALIBRACION, None)
            return

        lengua = idioma(self.hass.config.language)
        self._aviso(
            ISSUE_CALIBRACION,
            {
                "facturas": ", ".join(
                    f"{fecha(c['inicio'], lengua)} → {fecha(c['fin'], lengua)} (×{numero(q, '.2f', lengua)})"
                    for c, q in descartadas
                ),
                "minimo": numero(ALFA_VALIDO[0], ".1f", lengua),
                "maximo": numero(ALFA_VALIDO[1], ".1f", lengua),
            },
        )

    @property
    def precision(self) -> dict[str, Any]:
        """Desviación de la estimación al cierre frente a la factura real, factura a factura."""
        filas = [
            (c["fin"], Decimal(c["total_estimado"]) - Decimal(c["total"]))
            for c in self._estado.get("cerradas", [])
            if c.get("estado") == "conciliada" and c.get("total_estimado")
        ]
        if not filas:
            return {}
        return {
            "facturas": len(filas),
            "error_medio_eur": float((sum(abs(d) for _, d in filas) / len(filas)).quantize(Decimal("0.01"))),
            "ultima_desviacion_eur": float(filas[-1][1]),
        }

    async def async_periodos_pagados(self) -> list[PeriodoPagado]:
        """Periodos cerrados con lo pagado y lo que habría costado el PVPC sin bono (§8 bis).

        Sin bono: la diferencia entre las dos estimaciones del motor con el mismo consumo
        horario (sin y con bono) se suma a lo pagado, así el error del medidor se cancela.
        """
        ahora = dt_util.now(REFERENCE_TZ)
        con_bono = self._con_bono_alguna_vez()
        out = []
        for c in self.cerradas:
            inicio, fin = _fechas(c)
            total = Decimal(c["total"])
            sin_bono: Decimal | None = total
            if con_bono:
                sin_bono = await self._async_diferencia_sin_bono(inicio, fin, ahora)
                sin_bono = None if sin_bono is None else total + sin_bono
            out.append(
                PeriodoPagado(
                    inicio=inicio,
                    fin=fin,
                    total=total,
                    kwh={p: Decimal(v) for p, v in (c.get("kwh") or {}).items()},
                    conciliada=c.get("estado") == "conciliada",
                    total_sin_bono=sin_bono,
                )
            )
        return out

    async def _async_diferencia_sin_bono(self, inicio: date, fin: date, ahora: datetime) -> Decimal | None:
        try:
            con = await self._async_estimar(inicio, fin, ahora, cerrar=True)
            sin = await self._async_estimar(inicio, fin, ahora, cerrar=True, sin_bono=True)
        except Exception:
            _LOGGER.debug("%s: sin estimación sin bono de %s–%s", self.subentrada.title, inicio, fin)
            return None
        horas = con.horas_medidas or 1
        if con.estimacion is None or sin.estimacion is None or con.horas_sin_consumo > horas // 10:
            return None
        return sin.estimacion.prevision.total - con.estimacion.prevision.total

    async def async_conciliar(
        self,
        *,
        inicio: date,
        fin: date,
        emision: date | None,
        kwh: dict[str, int],
        total: Decimal,
        bonificados: int | None,
        comprobar: bool = True,
    ) -> None:
        """Factura real de un periodo: corte real, calibración, arrastre y estadística de coste.

        `comprobar=False`: sin comprobación con la CNMC (el lote ZIP la pide una vez al final).
        La actualización (fuera del candado: el refresco inmediato lo vuelve a tomar) y la
        comprobación van después de soltar el candado.
        """
        async with self._candado:
            await self._async_conciliar(
                inicio=inicio, fin=fin, emision=emision, kwh=kwh, total=total, bonificados=bonificados
            )
        await self.async_request_refresh()
        if comprobar:
            self.programar_comprobacion()

    async def _async_conciliar(
        self,
        *,
        inicio: date,
        fin: date,
        emision: date | None,
        kwh: dict[str, int],
        total: Decimal,
        bonificados: int | None,
    ) -> None:
        if fin <= inicio or (fin - inicio).days > 62:
            raise ValueError("El periodo de la factura debe tener entre 1 y 62 días")
        if fin > dt_util.now(REFERENCE_TZ).date():
            # Una factura real acaba en una lectura ya hecha; con un fin futuro el periodo en curso
            # saltaría a ese día y no habría forma de deshacerlo desde la interfaz.
            raise FacturaFutura("La factura no puede acabar después de hoy")
        desde = _inicio_local(inicio + timedelta(days=1)).astimezone(UTC)
        hasta = _inicio_local(fin + timedelta(days=1)).astimezone(UTC)
        consumo = (await self._async_leer(desde, hasta)).kwh
        horas = int((hasta - desde).total_seconds()) // 3600

        cerradas = self._estado.get("cerradas", [])
        actual = self.inicio_periodo
        # El periodo que acababa donde empieza el actual (su fin era el corte supuesto).
        ultima = next((c for c in cerradas if actual and c["fin"] == actual.isoformat()), None)
        previa = next((c for c in cerradas if c["fin"] == fin.isoformat()), None)
        # Una factura nueva sustituye a las que se solapan con ella (rectificativas incluidas).
        cerradas = [
            c
            for c in cerradas
            if date.fromisoformat(c["fin"]) <= inicio or date.fromisoformat(c["inicio"]) >= fin
        ]
        # Si es la última factura y su lectura cae unos días antes del corte supuesto, la lectura
        # real manda: si no, el actual seguiría empezando en el corte viejo y los días entre medias
        # no serían de nadie. Una factura vieja, aunque roce el último periodo, no mueve el corte.
        retrocede = (
            actual is not None
            and 0 < (actual - fin).days <= MARGEN_LECTURA_DIAS
            and not any(c["inicio"] >= fin.isoformat() for c in cerradas)
        )
        if previa is None and retrocede and ultima not in cerradas:
            previa = ultima  # su estimación es la que se compara con la factura
        cerradas.append(
            {
                "inicio": inicio.isoformat(),
                "fin": fin.isoformat(),
                "emision": (emision or fin + timedelta(days=self._dias_emision())).isoformat(),
                "total": str(total),
                "kwh": {p: str(v) for p, v in kwh.items()},
                "estado": "conciliada",
                "prorrata": self._prorrata(inicio, fin),
                "consumo": sum(kwh.values()),
                "bonificados": bonificados,
                "total_estimado": previa.get("total_estimado") if previa else None,
                "kwh_medido_bruto": str(sum(consumo.values(), Decimal(0))),
                "horas": horas if consumo else 0,
                # Horas del periodo sin dato del medidor: si son muchas (medidor más nuevo que la
                # factura, Datadis a medias), la factura no sirve para calibrar.
                "horas_sin_consumo": horas - len(consumo),
            }
        )
        cerradas.sort(key=lambda c: c["fin"])
        self._estado["cerradas"] = cerradas[-MAX_CERRADAS:]
        self._avisar_huecos()
        self._sincronizar_avisos_cnmc()  # el de la factura sustituida (rectificativa) sobra
        # Si la factura se ha llevado por delante algún periodo calculado, se rellena el hueco.
        self._estado.pop("calculadas_revisadas", None)
        if actual is None or fin > actual or retrocede:
            self._estado["corte_actual"] = fin.isoformat()
            manual = self._estado.get("corte_manual")
            # Al retroceder, el corte manual puede quedar más allá de lo que permite fijarlo a mano.
            if manual and not fin < date.fromisoformat(manual) <= fin + timedelta(days=62):
                self._estado.pop("corte_manual")
        await self._store.async_save(self._estado)
        await self._async_reescribir_periodo(desde, hasta, consumo, total)
        self._escrito = None
        self._avisar_incompletas(dt_util.now(REFERENCE_TZ).date())  # la real sustituye a la estimada
        self._avisar_calibracion()

    async def _async_reescribir_periodo(
        self, desde: datetime, hasta: datetime, consumo: dict[datetime, Decimal], total: Decimal
    ) -> None:
        """El total real repartido por horas según el perfil del medidor y el precio de cada hora."""
        margen = self._margen_medio()
        fijo = Decimal("0.5")  # €/hora orientativo para que las horas sin consumo pesen algo
        pesos: dict[datetime, Decimal] = {}
        t = desde
        while t < hasta:
            local = t.astimezone(REFERENCE_TZ)
            periodo, pcb, _teu = self._precio(t, local, margen)
            if pcb is None:
                pcb = self._teu_tabla(local, periodo) + margen
            pesos[t] = consumo.get(t, Decimal(0)) * pcb / 1000 + fijo / 24
            t += timedelta(hours=1)
        suma = sum(pesos.values(), Decimal(0))
        if not suma:
            return
        horas = {t: total * p / suma for t, p in pesos.items()}
        try:
            await async_reescribir_periodo(self.hass, self.estadistica_id, self.subentrada.title, horas)
        except Exception:
            _LOGGER.exception("%s: no se pudo reescribir la estadística de coste", self.subentrada.title)

    def huecos(self) -> list[tuple[date, date]]:
        """Días sin factura entre dos periodos cerrados consecutivos: (fin de uno, inicio del otro)."""
        cerradas = self.cerradas
        return [
            (date.fromisoformat(a["fin"]), date.fromisoformat(b["inicio"]))
            for a, b in pairwise(cerradas)
            if a["fin"] < b["inicio"]
        ]

    def _avisar_huecos(self) -> None:
        huecos = self.huecos()
        lengua = idioma(self.hass.config.language)
        texto = ", ".join(f"{fecha(a, lengua)} → {fecha(b, lengua)}" for a, b in huecos)
        self._aviso(ISSUE_HUECO, {"huecos": texto} if huecos else None)

    async def _async_estimar(
        self,
        inicio: date,
        corte: date,
        ahora: datetime,
        *,
        cerrar: bool,
        sin_bono: bool = False,
        arrastre: int | None = None,
    ) -> DatosFacturacion:
        desde = _inicio_local(inicio - timedelta(days=DIAS_HISTORIAL - 1)).astimezone(UTC)
        hasta_periodo = _inicio_local(corte + timedelta(days=1)).astimezone(UTC)
        hora_actual = ahora.replace(minute=0, second=0, microsecond=0).astimezone(UTC)
        hasta_medidas = hasta_periodo if cerrar else min(hora_actual, hasta_periodo)
        sin_fuente = self.sin_fuente
        lectura = await self._async_leer(desde, hasta_medidas)
        if arrastre is None:
            arrastre = self._arrastre(inicio)
        ajuste = self.ajuste()
        # Con los mismos datos de entrada sale lo mismo: no se rehace (las estadísticas horarias no
        # cambian entre medias de una hora, así que casi siempre solo se calcula una vez por hora).
        clave = (inicio, corte, cerrar, sin_bono, arrastre)
        firma = (
            hora_actual,
            ahora.date(),
            self.datos,
            self.historico.version,
            self.historico.tarifas,
            ajuste,
            lectura,
            self.ultima_conciliada() if sin_fuente else None,
        )
        previa = self._estimaciones.get(clave)
        if previa is not None and previa[0] == firma:
            return replace(previa[1])
        datos = self._estimar_con(
            inicio,
            corte,
            ahora,
            cerrar=cerrar,
            sin_bono=sin_bono,
            arrastre=arrastre,
            ajuste=ajuste,
            lectura=lectura,
        )
        self._estimaciones.pop(clave, None)
        self._estimaciones[clave] = (firma, datos)
        while len(self._estimaciones) > MAX_ESTIMACIONES_GUARDADAS:
            self._estimaciones.pop(next(iter(self._estimaciones)))
        return replace(datos)

    def _estimar_con(
        self,
        inicio: date,
        corte: date,
        ahora: datetime,
        *,
        cerrar: bool,
        sin_bono: bool,
        arrastre: int,
        ajuste: Ajuste | None,
        lectura: Lectura,
    ) -> DatosFacturacion:
        desde = _inicio_local(inicio - timedelta(days=DIAS_HISTORIAL - 1)).astimezone(UTC)
        hasta_periodo = _inicio_local(corte + timedelta(days=1)).astimezone(UTC)
        hora_actual = ahora.replace(minute=0, second=0, microsecond=0).astimezone(UTC)
        hasta_medidas = hasta_periodo if cerrar else min(hora_actual, hasta_periodo)
        primer = _inicio_local(inicio + timedelta(days=1)).astimezone(UTC)
        sin_fuente = self.sin_fuente
        consumo = lectura.kwh
        # Horas posteriores a la última con dato: pendientes de publicar mientras el retraso sea el normal.
        ultima = max(consumo) if consumo else None
        retraso_normal = self.retraso_normal
        pendientes_desde = (
            ultima
            if ultima is not None and hora_actual - (ultima + timedelta(hours=1)) <= retraso_normal
            else None
        )

        margen = self._margen_medio()
        dias_valle = {}
        d = inicio - timedelta(days=DIAS_HISTORIAL)
        while d <= corte:
            dias_valle[d] = self._valle(d)
            d += timedelta(days=1)

        def _valle(dia: date) -> bool:
            if dia not in dias_valle:
                dias_valle[dia] = self._valle(dia)
            return dias_valle[dia]

        medidas: list[HoraMedida] = []
        historial: list[HoraMedida] = self._historial_de_factura(margen) if sin_fuente else []
        futuras: list[HoraFutura] = []
        pendientes: list[HoraFutura] = []
        ceros_pendientes: list[HoraMedida] = []  # las pendientes a 0 kWh, para repartir el coste medido
        dias_huecos: set[date] = set()
        sin_precio = sin_consumo = n_pendientes = n_medidor = 0
        t = primer if sin_fuente else desde
        while t < hasta_periodo:
            local = t.astimezone(REFERENCE_TZ)
            periodo, pcb, teu = self._precio(t, local, margen)
            if t < hasta_medidas and not sin_fuente:
                if t >= primer and pcb is None:
                    sin_precio += 1
                kwh = consumo.get(t)
                if kwh is None and pendientes_desde is not None and t > pendientes_desde:
                    if t >= primer:  # antes del periodo solo sirven para el perfil: no se meten ceros
                        sin_consumo += 1
                        n_pendientes += 1
                        pendientes.append(HoraFutura(local, periodo, _valle(local.date()), pcb, teu))
                        if pcb is None:
                            teu = self._teu_tabla(local, periodo)
                            pcb = teu + margen
                        ceros_pendientes.append(HoraMedida(local, Decimal(0), periodo, pcb, teu))
                    t += timedelta(hours=1)
                    continue
                if kwh is None and t >= primer:
                    sin_consumo += 1
                    dias_huecos.add(local.date())
                if t >= primer and t in lectura.horas_medidor:
                    n_medidor += 1
                if pcb is None:
                    teu = self._teu_tabla(local, periodo)
                    pcb = teu + margen
                hora = HoraMedida(local, kwh or Decimal(0), periodo, pcb, teu)
                (medidas if t >= primer else historial).append(hora)
            else:
                futuras.append(HoraFutura(local, periodo, _valle(local.date()), pcb, teu))
            t += timedelta(hours=1)

        dias_valle = {
            d: v for d, v in dias_valle.items() if inicio - timedelta(days=DIAS_HISTORIAL) <= d <= corte
        }
        inicial, cambios = contratos_del_periodo(self.datos, inicio, corte)
        if sin_bono:  # el mismo periodo en el PVPC sin bono social (comparador, §8 bis)
            arrastre = 0
            inicial = replace(inicial, bono=Bono.NINGUNO, limite_anual_kwh=None)
            cambios = {d: replace(s, bono=Bono.NINGUNO, limite_anual_kwh=None) for d, s in cambios.items()}
        if sin_fuente and not historial:
            # Sin fuente y sin ninguna factura real: no hay con qué estimar el consumo.
            return DatosFacturacion(problema=FUENTE_NINGUNA_PROBLEMA, arrastre_kwh=arrastre)
        try:
            est = estimar_periodo(
                inicio=inicio,
                corte=corte,
                hoy=min(ahora.date(), corte) if not cerrar else corte + timedelta(days=1),
                dias_hasta_emision=self._dias_emision(),
                suministro=inicial,
                cambios_suministro=cambios,
                medidas=medidas,
                futuras=futuras,
                pendientes=pendientes,
                valle_todo_el_dia=dias_valle,
                historial=historial,
                tarifas=self.historico.tarifas,
                arrastre_kwh=arrastre,
                ajuste=ajuste,
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo estimar la factura", self.subentrada.title)
            raise
        tolerancia = 0 if self.fuente_externa else TOLERANCIA_PENDIENTES_MEDIDOR
        datos = DatosFacturacion(
            estimacion=est,
            horas_sin_precio=sin_precio,
            horas_sin_consumo=sin_consumo,
            horas_corregidas_shelly=lectura.corregidas,
            arrastre_kwh=arrastre,
            ajuste=ajuste,
            kwh_medido_bruto=sum((m.kwh for m in medidas), Decimal(0)),
            horas_medidas=len(medidas),
            kwh_hoy=sum((m.kwh for m in medidas if m.inicio.date() == ahora.date()), Decimal(0)),
            ultima_hora_medida=max((m.inicio for m in medidas if m.kwh), default=None),
            problema=(
                FUENTE_NINGUNA_PROBLEMA if sin_fuente else "sin_consumo" if medidas and not consumo else None
            ),
            horas_pendientes=n_pendientes,
            datos_hasta=(ultima + timedelta(hours=1)).astimezone(REFERENCE_TZ) if ultima else None,
            provisional=n_pendientes > tolerancia or n_medidor > 0,
            dias_con_huecos=sorted(dias_huecos),
            modo_en_curso=self.modo_en_curso,
            horas_medidor=n_medidor,
            oficial_hasta=(
                (lectura.oficial_hasta + timedelta(hours=1)).astimezone(REFERENCE_TZ)
                if lectura.oficial_hasta
                else None
            ),
            lectura=lectura,
        )
        if pendientes:
            hoy = ahora.date()
            datos.kwh_hoy_estimado = datos.kwh_hoy + sum(
                (v for h, v in est.kwh_pendientes_horas.items() if h.astimezone(REFERENCE_TZ).date() == hoy),
                Decimal(0),
            )
        datos.estado_consumo = self._estado_consumo(datos, hora_actual)
        datos.coste_horas = repartir_coste(est, sorted([*medidas, *ceros_pendientes], key=lambda m: m.inicio))
        datos.precio_real = precios_reales(est, [*pendientes, *futuras], medidas)
        return datos

    def _estado_consumo(self, datos: DatosFacturacion, hora_actual: datetime) -> str:
        """ok · datos_pendientes (lo normal de la fuente: Datadis tarda días) · consumo_incompleto."""
        if datos.huecos:
            return "consumo_incompleto"
        if self.tipo_fuente == FUENTE_AMBOS:
            oficial = datos.oficial_hasta
            if self.datos.get(CONF_FUENTE_OFICIAL) and (
                oficial is None or hora_actual - oficial.astimezone(UTC) > RETRASO_NORMAL_EXTERNA
            ):
                return (
                    "datos_pendientes"  # el medidor cubre, pero Datadis lleva más de lo normal sin dar datos
                )
            return "datos_pendientes" if datos.horas_pendientes > TOLERANCIA_PENDIENTES_MEDIDOR else "ok"
        if datos.provisional:
            return "datos_pendientes"
        return "ok"

    def _historial_de_factura(self, margen: Decimal) -> list[HoraMedida]:
        """Suministro sin fuente: un consumo horario sintético con la última factura real (sus kWh de
        cada periodo P1/P2/P3 repartidos a partes iguales entre las horas de ese periodo). Sirve de
        perfil para una previsión aproximada."""
        c = self.ultima_conciliada()
        if c is None or not c.get("kwh"):
            return []
        inicio, fin = _fechas(c)
        desde = _inicio_local(inicio + timedelta(days=1)).astimezone(UTC)
        hasta = _inicio_local(fin + timedelta(days=1)).astimezone(UTC)
        horas: list[tuple[datetime, str, Decimal, Decimal]] = []
        t = desde
        while t < hasta:
            local = t.astimezone(REFERENCE_TZ)
            periodo, pcb, teu = self._precio(t, local, margen)
            if pcb is None:
                teu = self._teu_tabla(local, periodo)
                pcb = teu + margen
            horas.append((local, periodo, pcb, teu))
            t += timedelta(hours=1)
        por_periodo = {p: sum(1 for h in horas if h[1] == p) for p in ("P1", "P2", "P3")}
        kwh = {p: Decimal(str(v)) for p, v in c["kwh"].items()}
        return [
            HoraMedida(local, kwh.get(periodo, Decimal(0)) / por_periodo[periodo], periodo, pcb, teu)
            for local, periodo, pcb, teu in horas
            if por_periodo.get(periodo)
        ]

    # --- precios ----------------------------------------------------------------------

    def _precio(
        self, t: datetime, local: datetime, margen: Decimal
    ) -> tuple[str, Decimal | None, Decimal | None]:
        """(periodo, PCB, TEU) de una hora; precios None si aún no están publicados."""
        hora = self.historico.hora(t)
        if hora is not None:
            periodo, pcb, teu = hora
            return periodo or _price_period_key(local, False), pcb, teu
        return _price_period_key(local, False), None, None

    def _teu_tabla(self, local: datetime, periodo: str) -> Decimal:
        tabla = peajes_mwh(local.date(), self.historico.tarifas)
        return tabla[periodo] if tabla else Decimal(0)

    def _margen_medio(self) -> Decimal:
        """(PCB − TEU) medio de los últimos 7 días con precio, para horas sin precio."""
        valores: list[Decimal] = []
        for dia in self.historico.dias()[-7:]:
            p = self.historico.dia(dia)
            if p:
                valores += [a - b for a, b in zip(p.pcb, p.teu, strict=True)]
        return sum(valores, Decimal(0)) / len(valores) if valores else MARGEN_POR_DEFECTO

    def _valle(self, dia: date) -> bool:
        precios = self.historico.dia(dia)
        if precios is not None:
            periodos = [self.historico.periodo_publicado(t) for t in precios.inicios_utc()]
            if all(periodos):
                return all(p == "P3" for p in periodos)
        return dia.isoweekday() >= 6 or es_festivo_p3(dia)


def repartir_coste(est: Estimacion, medidas: list[HoraMedida]) -> dict[datetime, Decimal]:
    """Reparte el acumulado (con impuestos) entre las horas medidas.

    Cada hora pesa su energía a precio PVPC más su parte de los fijos (potencia, margen,
    financiación y alquiler, a partes iguales por hora); la suma de las horas es el
    acumulado de la factura.
    """
    f = est.acumulado
    if f is None or not medidas:
        return {}
    fijos = f.potencia + f.financiacion_bono + sum(f.alquiler, Decimal(0))
    fijo_hora = fijos / len(medidas)
    pesos = {m.inicio.astimezone(UTC): m.kwh * m.pcb_mwh / 1000 + fijo_hora for m in medidas}
    total_pesos = sum(pesos.values(), Decimal(0))
    if not total_pesos:
        return {}
    return {t: f.total * p / total_pesos for t, p in pesos.items()}


def precios_reales(
    est: Estimacion, futuras: list[HoraFutura], medidas: list[HoraMedida]
) -> dict[datetime, Decimal]:
    """Precio real (marginal, con bono e impuestos) de las horas con precio de hoy y mañana."""
    f = est.prevision
    if not f.kwh_total:
        return {}
    limite = Decimal(sum(f.limite_kwh)) if f.limite_kwh else Decimal(0)
    fraccion = min(Decimal(1), limite / f.kwh_total) if limite else Decimal(0)
    medio = f.energia / f.kwh_total
    out = {}
    horas = [(h.inicio, h.pcb_mwh) for h in futuras if h.pcb_mwh is not None]
    hoy = est.hoy
    horas += [(m.inicio, m.pcb_mwh) for m in medidas if m.inicio.date() >= hoy]
    for inicio, pcb in horas:
        out[inicio.astimezone(UTC)] = precio_marginal(
            precio_kwh=pcb / 1000,
            descuento=f.porcentaje_bono,
            fraccion_bonificada=fraccion if f.porcentaje_bono else Decimal(1),
            precio_medio_kwh=medio,
            iee_tipo=f.iee_tipo,
            iee_minimo_activo=f.iee_minimo_aplicado,
            iva=f.iva_tipo,
        )
    return dict(sorted(out.items()))
