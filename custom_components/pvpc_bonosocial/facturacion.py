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

import calendar
import logging
from dataclasses import dataclass, field, replace
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
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
from .engine.calibracion import PeriodoCalibracion, ajustar
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
MARGEN_POR_DEFECTO = Decimal(100)  # €/MWh (PCB − TEU) si aún no hay ningún precio
ISSUE_SIN_FECHA = "falta_fecha_factura"
ISSUE_SHELLY = "shelly_no_coincide"


def corte_siguiente(inicio: date) -> date:
    """Corte previsto: el mismo día del mes siguiente (o el último día de ese mes)."""
    anio, mes = (inicio.year + 1, 1) if inicio.month == 12 else (inicio.year, inicio.month + 1)
    return date(anio, mes, min(inicio.day, calendar.monthrange(anio, mes)[1]))


def _inicio_local(dia: date) -> datetime:
    return datetime.combine(dia, time(0), REFERENCE_TZ)


def suministro_de(datos: dict[str, Any]) -> Suministro:
    bono = Bono(datos.get(CONF_BONO, Bono.NINGUNO))
    categoria = datos.get(CONF_CATEGORIA)
    return Suministro(
        Decimal(str(datos[CONF_POTENCIA_P1])),
        Decimal(str(datos[CONF_POTENCIA_P2])),
        bono,
        LIMITES_ANUALES_KWH[categoria] if bono is not Bono.NINGUNO and categoria else None,
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

    @property
    def datos(self) -> dict[str, Any]:
        return dict(self.subentrada.data)

    async def async_cargar(self) -> None:
        self._estado = await self._store.async_load() or {}
        if "estadistica_id" not in self._estado:
            # Se fija al crear el suministro: renombrarlo no cambia su estadística.
            self._estado["estadistica_id"] = id_estadistica(self.subentrada.title)
            self._store.async_delay_save(lambda: self._estado, 5)

    # --- Shelly (opción C) -----------------------------------------------------------

    @property
    def usa_shelly(self) -> bool:
        return (
            bool(self.datos.get(CONF_SHELLY_IP)) and self.datos.get(CONF_SHELLY_FRECUENCIA) != "desactivada"
        )

    def horas_shelly(self) -> dict[datetime, Decimal]:
        return {
            datetime.fromisoformat(k): Decimal(v) for k, v in (self._estado.get("shelly_horas") or {}).items()
        }

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
            self._store.async_delay_save(lambda: self._estado, 5)
            return
        horas = {**self.horas_shelly(), **horas_completas(texto)}
        self._estado["shelly_horas"] = {
            h.isoformat(): str(v) for h, v in sorted(recortar(horas, ahora).items())
        }
        self._estado["shelly_ultima"] = ahora.isoformat()
        self._estado["shelly_error"] = None
        self._store.async_delay_save(lambda: self._estado, 5)
        await self.async_request_refresh()

    def _corregir_con_shelly(
        self, consumo: dict[datetime, Decimal], desde: datetime, hasta: datetime
    ) -> tuple[dict[datetime, Decimal], int]:
        if not self.usa_shelly:
            return consumo, 0
        shelly = {h: v for h, v in self.horas_shelly().items() if desde <= h < hasta}
        if not shelly:
            return consumo, 0
        issue_id = f"{ISSUE_SHELLY}_{self.subentrada.subentry_id}"
        diferencia = desacuerdo(consumo, shelly, hasta)
        if diferencia > UMBRAL_DESACUERDO:
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                issue_id,
                is_fixable=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=ISSUE_SHELLY,
                translation_placeholders={
                    "suministro": self.subentrada.title,
                    "ip": self.datos[CONF_SHELLY_IP],
                    "diferencia": f"{diferencia * 100:.0f}",
                },
            )
            return consumo, 0
        ir.async_delete_issue(self.hass, DOMAIN, issue_id)
        return corregir(consumo, shelly)

    # --- segunda opinión de la CNMC ---------------------------------------------------

    @property
    def usa_segunda_opinion(self) -> bool:
        return bool(self.datos.get(CONF_SEGUNDA_OPINION)) and bool(self.datos.get(CONF_CODIGO_POSTAL))

    async def async_segunda_opinion(self, *, forzar: bool = False) -> dict[str, Any] | None:
        """Pide a la CNMC la factura del último periodo cerrado (una vez; `forzar` la repite).

        Se guarda en el periodo («cnmc» o «cnmc_error») y sale en `sensor.*_factura_anterior`.
        Un fallo no afecta a nada más.
        """
        c = self._anterior()
        if not self.usa_segunda_opinion or c is None or (c.get("cnmc") and not forzar):
            return c.get("cnmc") if c else None
        inicio, fin = date.fromisoformat(c["inicio"]), date.fromisoformat(c["fin"])
        desde, hasta = periodo_curva(inicio, fin, REFERENCE_TZ)
        desde, hasta = desde.astimezone(UTC), hasta.astimezone(UTC)
        consumo = await async_kwh_horarios(self.hass, self.datos[CONF_FUENTE], desde, hasta)
        consumo, _ = self._corregir_con_shelly(consumo, desde, hasta)
        horas = {t: v for t, v in consumo.items() if desde <= t < hasta}
        contrato, _ = contratos_del_periodo(self.datos, inicio, fin)
        try:
            simulacion = await async_simular(
                async_get_clientsession(self.hass),
                horas=horas,
                inicio=inicio,
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
            self._store.async_delay_save(lambda: self._estado, 5)
            return None
        c["cnmc"] = {
            **simulacion.a_dict(),
            "fecha": dt_util.utcnow().isoformat(),
            "horas": len(horas),
            "horas_periodo": int((hasta - desde).total_seconds()) // 3600,
        }
        c.pop("cnmc_error", None)
        self._store.async_delay_save(lambda: self._estado, 5)
        self.async_update_listeners()
        return c["cnmc"]

    @property
    def estadistica_id(self) -> str:
        return self._estado.get("estadistica_id") or id_estadistica(self.subentrada.title)

    async def async_borrar(self) -> None:
        await self._store.async_remove()

    # --- periodo --------------------------------------------------------------------

    def _inicio_periodo(self) -> date | None:
        guardado = self._estado.get("corte_actual")
        if guardado:
            return date.fromisoformat(guardado)
        fin = self.datos.get(CONF_FIN_ULTIMA_FACTURA)
        return date.fromisoformat(fin) if fin else None

    # --- actualización --------------------------------------------------------------

    async def _async_update_data(self) -> DatosFacturacion:
        inicio = self._inicio_periodo()
        if inicio is None:
            self._avisar_sin_fecha(True)
            return DatosFacturacion(problema="sin_fecha", anterior=self._anterior())
        self._avisar_sin_fecha(False)
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
        corte = self._corte(inicio)
        datos = await self._async_estimar(inicio, corte, ahora, cerrar=False)
        datos.anterior = self._anterior_de(inicio)
        await self._async_escribir_coste(datos)
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
        if not cerradas or firma == self._estado.get("facturas_escritas"):
            return
        try:
            await async_escribir_facturas(
                self.hass, self.estadistica_id, self.subentrada.title, cerradas, REFERENCE_TZ
            )
        except Exception:
            _LOGGER.exception("%s: no se pudo escribir la estadística de facturas", self.subentrada.title)
            return
        self._estado["facturas_escritas"] = firma
        self._store.async_delay_save(lambda: self._estado, 5)

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
        inicio = self._inicio_periodo()
        if inicio is None or not inicio < corte <= inicio + timedelta(days=62):
            raise ValueError(
                f"El fin del periodo debe estar entre {inicio} y {inicio and inicio + timedelta(days=62)}"
            )
        self._estado["corte_manual"] = corte.isoformat()
        self._store.async_delay_save(lambda: self._estado, 5)
        await self.async_request_refresh()

    @property
    def cerradas(self) -> list[dict[str, Any]]:
        """Periodos cerrados (estimados o conciliados), del más antiguo al más reciente."""
        return list(self._estado.get("cerradas") or [])

    @property
    def inicio_periodo(self) -> date | None:
        return self._inicio_periodo()

    def periodo_pendiente(self) -> tuple[date, date] | None:
        """Periodo que más probablemente falta por conciliar: el último cerrado sin factura real."""
        c = self._anterior()
        if c is None or c.get("estado") == "conciliada":
            return None
        return date.fromisoformat(c["inicio"]), date.fromisoformat(c["fin"])

    def _anterior_de(self, inicio: date) -> dict[str, Any] | None:
        """El periodo inmediatamente anterior al que empieza en `inicio` (el que acaba ese día).

        Si falta (por ejemplo, se ha introducido una factura más antigua), no se muestra otra."""
        c = self._anterior()
        return c if c is not None and c["fin"] == inicio.isoformat() else None

    def _anterior(self) -> dict[str, Any] | None:
        cerradas = self._estado.get("cerradas") or []
        return cerradas[-1] if cerradas else None

    def _guardar_cerrada(self, inicio: date, corte: date, datos: DatosFacturacion) -> None:
        est = datos.estimacion
        if est is None:
            return
        f = est.prevision
        cerradas = [c for c in self._estado.get("cerradas", []) if c["fin"] != corte.isoformat()]
        cerradas.append(
            {
                "inicio": inicio.isoformat(),
                "fin": corte.isoformat(),
                "emision": est.emision.isoformat(),
                "total": str(f.total),
                "kwh": {p: str(v.quantize(Decimal("0.001"))) for p, v in est.kwh_medidos.items()},
                "estado": "estimada",
                "horas_sin_consumo": datos.horas_sin_consumo,
                "prorrata": self._prorrata(inicio, corte),
                "consumo": int(sum(est.kwh_medidos.values(), Decimal(0)).quantize(Decimal(1))),
                "bonificados": None,
                "total_estimado": str(f.total),
                "kwh_medido_bruto": str(datos.kwh_medido_bruto.quantize(Decimal("0.001"))),
                "horas": datos.horas_medidas,
            }
        )
        self._estado["cerradas"] = cerradas[-MAX_CERRADAS:]
        self._estado["corte_actual"] = corte.isoformat()
        if self._estado.get("corte_manual") and date.fromisoformat(self._estado["corte_manual"]) <= corte:
            self._estado.pop("corte_manual")
        self._store.async_delay_save(lambda: self._estado, 5)

    # --- bono y calibración (F4) -------------------------------------------------------

    def _dias_emision(self) -> int:
        return int(self.datos.get(CONF_DIAS_EMISION, DEFAULT_DIAS_EMISION))

    def _limite_anual(self) -> int | None:
        return suministro_de(self.datos).limite_anual_kwh

    def _con_bono_alguna_vez(self) -> bool:
        anteriores = self.datos.get(CONF_CONTRATOS_ANTERIORES) or []
        return bool(self._limite_anual()) or any(c.get(CONF_BONO, "ninguno") != "ninguno" for c in anteriores)

    def _prorrata(self, inicio: date, fin: date) -> int:
        inicial, cambios = contratos_del_periodo(self.datos, inicio, fin)
        limites = {d: s.limite_anual_kwh for d, s in cambios.items()}
        return prorrata(inicio, fin, inicial.limite_anual_kwh, self.historico.tarifas, limites)

    def _arrastre(self, inicio: date) -> int:
        if not self._con_bono_alguna_vez():
            return 0
        periodos = [
            PeriodoBono(
                date.fromisoformat(c["inicio"]),
                date.fromisoformat(c["fin"]),
                int(c.get("prorrata", 0)),
                int(c.get("consumo", 0)),
                c.get("bonificados"),
            )
            for c in self._estado.get("cerradas", [])
            if "prorrata" in c
        ]
        return saldo_arrastre(periodos, inicio, int(self.datos.get(CONF_ARRASTRE_INICIAL) or 0))

    def ajuste(self) -> Ajuste | None:
        """Calibración del medidor con las facturas conciliadas."""
        periodos = [
            PeriodoCalibracion(Decimal(c["consumo"]), Decimal(c["kwh_medido_bruto"]), int(c["horas"]))
            for c in self._estado.get("cerradas", [])
            if c.get("estado") == "conciliada" and c.get("kwh_medido_bruto") and c.get("horas")
        ]
        return ajustar(periodos)

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
            inicio, fin = date.fromisoformat(c["inicio"]), date.fromisoformat(c["fin"])
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
    ) -> None:
        """Factura real de un periodo: corte real, calibración, arrastre y estadística de coste."""
        if fin <= inicio or (fin - inicio).days > 62:
            raise ValueError("El periodo de la factura debe tener entre 1 y 62 días")
        desde = _inicio_local(inicio + timedelta(days=1)).astimezone(UTC)
        hasta = _inicio_local(fin + timedelta(days=1)).astimezone(UTC)
        consumo = await async_kwh_horarios(self.hass, self.datos[CONF_FUENTE], desde, hasta)
        consumo, _ = self._corregir_con_shelly(consumo, desde, hasta)
        horas = int((hasta - desde).total_seconds()) // 3600

        cerradas = self._estado.get("cerradas", [])
        previa = next((c for c in cerradas if c["fin"] == fin.isoformat()), None)
        # Una factura nueva sustituye a las que se solapan con ella (rectificativas incluidas).
        cerradas = [
            c
            for c in cerradas
            if date.fromisoformat(c["fin"]) <= inicio or date.fromisoformat(c["inicio"]) >= fin
        ]
        cerradas.append(
            {
                "inicio": inicio.isoformat(),
                "fin": fin.isoformat(),
                "emision": (
                    emision or fin + timedelta(days=int(self.datos.get(CONF_DIAS_EMISION, 5)))
                ).isoformat(),
                "total": str(total),
                "kwh": {p: str(v) for p, v in kwh.items()},
                "estado": "conciliada",
                "prorrata": self._prorrata(inicio, fin),
                "consumo": sum(kwh.values()),
                "bonificados": bonificados,
                "total_estimado": previa.get("total_estimado") if previa else None,
                # la segunda opinión de la CNMC no depende del importe real: se conserva
                "cnmc": previa.get("cnmc") if previa and previa["inicio"] == inicio.isoformat() else None,
                "kwh_medido_bruto": str(sum(consumo.values(), Decimal(0))),
                "horas": horas if consumo else 0,
            }
        )
        cerradas.sort(key=lambda c: c["fin"])
        self._estado["cerradas"] = cerradas[-MAX_CERRADAS:]
        actual = self._inicio_periodo()
        if actual is None or fin > actual:
            self._estado["corte_actual"] = fin.isoformat()
            if self._estado.get("corte_manual") and date.fromisoformat(self._estado["corte_manual"]) <= fin:
                self._estado.pop("corte_manual")
        await self._store.async_save(self._estado)
        await self._async_reescribir_periodo(desde, hasta, consumo, total)
        self._escrito = None
        await self.async_request_refresh()

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

    def _avisar_sin_fecha(self, falta: bool) -> None:
        issue_id = f"{ISSUE_SIN_FECHA}_{self.subentrada.subentry_id}"
        if not falta:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
            return
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            issue_id,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_SIN_FECHA,
            translation_placeholders={"suministro": self.subentrada.title},
        )

    async def _async_estimar(
        self, inicio: date, corte: date, ahora: datetime, *, cerrar: bool, sin_bono: bool = False
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
                dias_hasta_emision=int(self.datos.get(CONF_DIAS_EMISION, DEFAULT_DIAS_EMISION)),
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
