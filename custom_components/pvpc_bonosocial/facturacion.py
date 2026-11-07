"""Facturación de un suministro: periodo en curso, cierre y factura anterior (DISENO §5.2).

Cada suministro (subentrada) tiene un coordinador que, cada 15 minutos:

1. Fija el periodo: desde el último corte (la fecha de fin de la última factura y, después,
   cada corte previsto) hasta el siguiente, el mismo día del mes siguiente. Al pasar un
   corte, guarda la factura cerrada estimada y empieza el periodo nuevo.
2. Lee el consumo horario de su fuente (consumo.py) y los precios del histórico (PCB y TEU
   de cada hora; el periodo, por el TEU).
3. Calcula con engine/vivo.py el acumulado, la previsión al cierre y su rango, el coste de
   cada hora (para «coste de hoy» y la estadística de coste) y el precio real de cada hora.
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
from .comparativa import PeriodoPagado
from .const import (
    CONF_ALQUILER,
    CONF_ARRASTRE_INICIAL,
    CONF_BONO,
    CONF_CATEGORIA,
    CONF_CODIGO_POSTAL,
    CONF_CONTRATOS_ANTERIORES,
    CONF_DIAS_EMISION,
    CONF_FIN_ULTIMA_FACTURA,
    CONF_FUENTE,
    CONF_IDS_HEREDADOS,
    CONF_POTENCIA_P1,
    CONF_POTENCIA_P2,
    CONF_SEGUNDA_OPINION,
    CONF_SHELLY_CANAL,
    CONF_SHELLY_FRECUENCIA,
    CONF_SHELLY_IP,
    DEFAULT_DIAS_EMISION,
    DOMAIN,
)
from .consumo import async_kwh_horarios
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
from .prices.aiopvpc.const import REFERENCE_TZ
from .prices.aiopvpc.pvpc_tariff import _price_period_key
from .prices.festivos import es_festivo_p3
from .prices.historico import HistoricoPrecios
from .prices.periodos import peajes_mwh
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
TOLERANCIA_CNMC = Decimal("0.10")  # € de diferencia que se dan por buenos (redondeos)
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


def _fila_periodo(inicio: date, fin: date, est: Estimacion, estado: str) -> dict[str, Any]:
    """Lo común a toda fila de periodo cerrado: fechas, total, kWh por periodo y consumo entero."""
    kwh = est.kwh_medidos
    return {
        "inicio": inicio.isoformat(),
        "fin": fin.isoformat(),
        "total": str(est.prevision.total),
        "kwh": {p: str(v.quantize(Decimal("0.001"))) for p, v in kwh.items()},
        "estado": estado,
        "consumo": int(sum(kwh.values(), Decimal(0)).quantize(Decimal(1))),
    }


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
class DatosFacturacion:
    estimacion: Estimacion | None = None
    anterior: dict[str, Any] | None = None
    problema: str | None = None  # «sin_fecha», «sin_consumo»
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
        self._escrito: tuple | None = None  # (primera hora, última hora, acumulado) ya escritos
        # Cierre de periodos (actualización) frente a conciliar o fijar el corte: los dos leen
        # `corte_actual` y `cerradas`, esperan al recorder y luego escriben; sin candado una
        # factura introducida a mitad de un cierre dejaba periodos solapados (auditoría 20-oct M2).
        self._candado = asyncio.Lock()
        # Una sola consulta a la CNMC a la vez (arranque, 04:10, factura nueva, lote ZIP).
        self._candado_cnmc = asyncio.Lock()

    @property
    def datos(self) -> dict[str, Any]:
        return dict(self.subentrada.data)

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
    ) -> None:
        """Crea (con `placeholders`) o quita (`None`) un aviso de Reparaciones de este suministro."""
        issue_id = f"{clave}_{self.subentrada.subentry_id}{sufijo}"
        if placeholders is None:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
            return
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            issue_id,
            is_fixable=False,
            is_persistent=persistente,
            severity=ir.IssueSeverity.WARNING,
            translation_key=clave,
            translation_placeholders={"suministro": self.subentrada.title, **placeholders},
        )

    async def async_cargar(self) -> None:
        self._estado = await self._store.async_load() or {}
        if "estadistica_id" not in self._estado:
            # Se fija al crear el suministro: renombrarlo no cambia su estadística.
            self._estado["estadistica_id"] = id_estadistica(self.subentrada.title)
            self._guardar()
        self._aplicar_fin_ultima_factura()

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

    def horas_shelly(self) -> dict[datetime, Decimal]:
        # Un valor no finito (NaN guardado por una versión anterior) no entra en la factura.
        horas = {
            datetime.fromisoformat(k): Decimal(v) for k, v in (self._estado.get("shelly_horas") or {}).items()
        }
        return {h: v for h, v in horas.items() if v.is_finite()}

    @property
    def estado_shelly(self) -> dict[str, Any]:
        return {
            "ultima": self._estado.get("shelly_ultima"),
            "error": self._estado.get("shelly_error"),
            "horas": len(self._estado.get("shelly_horas") or {}),
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
        horas = {**self.horas_shelly(), **await self.hass.async_add_executor_job(horas_completas, texto)}
        self._estado["shelly_horas"] = {
            h.isoformat(): str(v) for h, v in sorted(recortar(horas, ahora).items())
        }
        self._estado["shelly_ultima"] = ahora.isoformat()
        self._estado["shelly_error"] = None
        self._guardar()
        await self.async_request_refresh()

    def _corregir_con_shelly(
        self, consumo: dict[datetime, Decimal], desde: datetime, hasta: datetime
    ) -> tuple[dict[datetime, Decimal], int]:
        if not self.usa_shelly:
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
        consumo = await async_kwh_horarios(self.hass, self.datos[CONF_FUENTE], desde, hasta)
        consumo, _ = self._corregir_con_shelly(consumo, desde, hasta)
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
        # La CNMC no aplica el saldo de kWh con descuento de periodos anteriores (arrastre).
        con_arrastre = (c.get("bonificados") or 0) > (c.get("prorrata") or 0)
        if abs(diferencia) <= TOLERANCIA_CNMC:
            estado = "correcta"
        elif len(horas) < horas_periodo:
            # Faltan horas de la curva: la energía cuadra (se ajusta al contador por periodo),
            # pero repartida en menos horas y a otros precios. No es un «no cuadra» de la factura.
            estado = "incompleta"
        else:
            estado = "arrastre" if con_arrastre else "no_cuadra"
        c["cnmc"] = {
            **simulacion.a_dict(),
            "diferencia": float(diferencia),
            "estado": estado,
            "fecha": dt_util.utcnow().isoformat(),
            "horas": len(horas),
            "horas_periodo": horas_periodo,
        }
        c.pop("cnmc_error", None)
        self._guardar()
        self._avisar_cnmc(c)
        self.async_update_listeners()
        return c["cnmc"]

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
        self._aviso(
            ISSUE_CNMC,
            {
                "inicio": inicio.strftime("%d/%m/%Y"),
                "fin": fin.strftime("%d/%m/%Y"),
                "factura": f"{Decimal(c['total']):.2f}".replace(".", ","),
                "cnmc": f"{cnmc['total']:.2f}".replace(".", ","),
                "diferencia": f"{abs(cnmc['diferencia']):.2f}".replace(".", ","),
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
            cerrada = await self._async_estimar(inicio, corte, ahora, cerrar=True)
            await self._async_escribir_coste(cerrada)
            self._guardar_cerrada(inicio, corte, cerrada)
            inicio = corte
        await self._async_recalcular_incompletas(ahora)
        corte = self._corte(inicio)
        datos = await self._async_estimar(inicio, corte, ahora, cerrar=False)
        datos.anterior = self._anterior_de(inicio)
        await self._async_escribir_coste(datos)
        await self._async_calcular_anteriores(ahora)
        self._avisar_huecos()
        self._avisar_calibracion()
        await self._async_escribir_facturas()
        await async_revisar_panel(
            self.hass,
            self.subentrada.subentry_id,
            self.subentrada.title,
            self.datos[CONF_FUENTE],
            self.estadistica_id,
        )
        return datos

    async def _async_escribir_coste(self, datos: DatosFacturacion) -> None:
        """Reescribe la estadística de coste del periodo si ha cambiado algo."""
        horas = datos.coste_horas
        if not horas or datos.estimacion is None or datos.estimacion.acumulado is None:
            return
        firma = (min(horas), max(horas), datos.estimacion.acumulado.total)
        if firma == self._escrito:
            return
        try:
            await async_escribir(
                self.hass,
                self.estadistica_id,
                self.subentrada.title,
                horas,
                copiar_de=self._coste_hoy_heredado(),
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo escribir la estadística de coste", self.subentrada.title)
            return
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
        if self._estado.get("calculadas_revisadas") == ahora.date().isoformat():
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
            return
        cerradas = [c for c in self._estado.get("cerradas", []) if c["fin"] != corte.isoformat()]
        cerradas.append(fila)
        self._estado["cerradas"] = cerradas[-MAX_CERRADAS:]
        self._estado["corte_actual"] = corte.isoformat()
        if self._estado.get("corte_manual") and date.fromisoformat(self._estado["corte_manual"]) <= corte:
            self._estado.pop("corte_manual")
        self._guardar()
        if fila.get("incompleta"):
            # Recién estimada: no se vuelve a calcular hasta la hora siguiente.
            self._estado["incompletas_revisadas"] = (
                dt_util.now(REFERENCE_TZ).replace(minute=0, second=0, microsecond=0).isoformat()
            )
            _LOGGER.warning(
                "%s: periodo %s – %s cerrado con %d horas sin consumo; se recalculará cuando lleguen",
                self.subentrada.title,
                inicio,
                corte,
                datos.horas_sin_consumo,
            )

    def _fila_estimada(self, inicio: date, corte: date, datos: DatosFacturacion) -> dict[str, Any] | None:
        """Periodo cerrado con la estimación. Si faltan horas de consumo (cuentan como 0 kWh),
        queda marcado «incompleta» (según `_incompleta`) y se recalcula cuando lleguen
        (`_async_recalcular_incompletas`)."""
        est = datos.estimacion
        if est is None:
            return None
        fila: dict[str, Any] = {
            **_fila_periodo(inicio, corte, est, "estimada"),
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
        return fila

    def _incompleta(self, horas_sin_consumo: int) -> bool:
        """Si un periodo cerrado con esas horas sin consumo se marca «incompleta» (y se avisa)."""
        if not horas_sin_consumo:
            return False
        if ":" in self.datos[CONF_FUENTE]:  # estadística externa: las horas que faltan llegarán
            return True
        return horas_sin_consumo > UMBRAL_HORAS_INCOMPLETA

    def _a_medias(self, c: dict[str, Any]) -> bool:
        """Periodo estimado cerrado al que faltan horas de consumo (su consumo real es mayor)."""
        # Las guardadas antes del umbral (p. ej. 1 h con HA parado) se dan por enteras.
        return bool(c.get("incompleta")) and self._incompleta(c.get("horas_sin_consumo", 0))

    def _incompletas(self, hoy: date) -> list[dict[str, Any]]:
        """Periodos estimados cerrados con horas sin consumo que aún se recalculan."""
        limite = (hoy - timedelta(days=DIAS_RECALCULO_INCOMPLETA)).isoformat()
        return [
            c
            for c in self.cerradas
            if c.get("estado") == "estimada" and self._a_medias(c) and c["fin"] >= limite
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
                if datos.horas_sin_consumo >= c.get("horas_sin_consumo", 0):
                    continue  # no ha llegado nada nuevo
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
        pendientes = self._incompletas(hoy)
        if not pendientes:
            self._aviso(ISSUE_INCOMPLETO, None)
            return
        self._aviso(
            ISSUE_INCOMPLETO,
            {
                "periodos": ", ".join(
                    f"{c['inicio']} → {c['fin']} ({c.get('horas_sin_consumo', 0)} h)" for c in pendientes
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
        """Calibración del medidor con las facturas conciliadas que cuadran con él."""
        return ajustar(self._facturas_calibracion()[0])

    def _avisar_calibracion(self) -> None:
        """Aviso (uno por suministro, mientras dure) con las facturas que no cuadran con el medidor."""
        descartadas = self._facturas_calibracion()[1]
        if not descartadas:
            self._aviso(ISSUE_CALIBRACION, None)
            return

        def _coma(v: Decimal, cifras: str) -> str:
            return f"{v:{cifras}}".replace(".", ",")

        self._aviso(
            ISSUE_CALIBRACION,
            {
                "facturas": ", ".join(
                    f"{_fechas(c)[0]:%d/%m/%Y} → {_fechas(c)[1]:%d/%m/%Y} (×{_coma(q, '.2f')})"
                    for c, q in descartadas
                ),
                "minimo": _coma(ALFA_VALIDO[0], ".1f"),
                "maximo": _coma(ALFA_VALIDO[1], ".1f"),
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
        consumo = await async_kwh_horarios(self.hass, self.datos[CONF_FUENTE], desde, hasta)
        consumo, _ = self._corregir_con_shelly(consumo, desde, hasta)
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
        texto = ", ".join(f"{a.isoformat()} → {b.isoformat()}" for a, b in huecos)
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
        consumo = await async_kwh_horarios(self.hass, self.datos[CONF_FUENTE], desde, hasta_medidas)
        consumo, corregidas = self._corregir_con_shelly(consumo, desde, hasta_medidas)

        primer = _inicio_local(inicio + timedelta(days=1)).astimezone(UTC)
        margen = self._margen_medio()
        medidas: list[HoraMedida] = []
        historial: list[HoraMedida] = []
        futuras: list[HoraFutura] = []
        sin_precio = sin_consumo = 0
        t = desde
        while t < hasta_periodo:
            local = t.astimezone(REFERENCE_TZ)
            periodo, pcb, teu = self._precio(t, local, margen)
            if t < hasta_medidas:
                if t >= primer and pcb is None:
                    sin_precio += 1
                kwh = consumo.get(t)
                if kwh is None and t >= primer:
                    sin_consumo += 1
                if pcb is None:
                    teu = self._teu_tabla(local, periodo)
                    pcb = teu + margen
                hora = HoraMedida(local, kwh or Decimal(0), periodo, pcb, teu)
                (medidas if t >= primer else historial).append(hora)
            else:
                futuras.append(HoraFutura(local, periodo, self._valle(local.date()), pcb, teu))
            t += timedelta(hours=1)

        dias_valle = {}
        d = inicio - timedelta(days=DIAS_HISTORIAL)
        while d <= corte:
            dias_valle[d] = self._valle(d)
            d += timedelta(days=1)
        if arrastre is None:
            arrastre = self._arrastre(inicio)
        ajuste = self.ajuste()
        inicial, cambios = contratos_del_periodo(self.datos, inicio, corte)
        if sin_bono:  # el mismo periodo en el PVPC sin bono social (comparador, §8 bis)
            arrastre = 0
            inicial = replace(inicial, bono=Bono.NINGUNO, limite_anual_kwh=None)
            cambios = {d: replace(s, bono=Bono.NINGUNO, limite_anual_kwh=None) for d, s in cambios.items()}
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
                valle_todo_el_dia=dias_valle,
                historial=historial,
                tarifas=self.historico.tarifas,
                arrastre_kwh=arrastre,
                ajuste=ajuste,
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo estimar la factura", self.subentrada.title)
            raise
        datos = DatosFacturacion(
            estimacion=est,
            horas_sin_precio=sin_precio,
            horas_sin_consumo=sin_consumo,
            horas_corregidas_shelly=corregidas,
            arrastre_kwh=arrastre,
            ajuste=ajuste,
            kwh_medido_bruto=sum((m.kwh for m in medidas), Decimal(0)),
            horas_medidas=len(medidas),
            kwh_hoy=sum((m.kwh for m in medidas if m.inicio.date() == ahora.date()), Decimal(0)),
            ultima_hora_medida=max((m.inicio for m in medidas if m.kwh), default=None),
            problema="sin_consumo" if medidas and not consumo else None,
        )
        datos.coste_horas = repartir_coste(est, medidas)
        datos.precio_real = precios_reales(est, futuras, medidas)
        return datos

    # --- precios ----------------------------------------------------------------------

    def _precio(
        self, t: datetime, local: datetime, margen: Decimal
    ) -> tuple[str, Decimal | None, Decimal | None]:
        """(periodo, PCB, TEU) de una hora; precios None si aún no están publicados."""
        precios = self.historico.dia(local.date())
        if precios is not None:
            inicios = precios.inicios_utc()
            if t in inicios:
                i = inicios.index(t)
                periodo = self.historico.periodo_publicado(t) or _price_period_key(local, False)
                return periodo, precios.pcb[i], precios.teu[i]
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
