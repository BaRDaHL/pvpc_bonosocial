"""Entidades de factura de cada suministro (DISENO §6).

entity_id: `sensor.pvpc_bs_<clave>` en el primer suministro y
`sensor.pvpc_bs_<nombre del suministro>_<clave>` en los demás.
"""

from __future__ import annotations

from datetime import UTC, datetime, time
from decimal import Decimal
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry, ConfigSubentry
from homeassistant.const import EntityCategory, UnitOfEnergy
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util
from homeassistant.util import slugify

from .const import CONF_IDS_HEREDADOS, DOMAIN, PREFIJO_ENTIDADES
from .facturacion import DatosFacturacion, FacturacionSuministro
from .prices.aiopvpc.const import REFERENCE_TZ

EUR = "EUR"
EUR_KWH = "EUR/kWh"


def entity_id_suministro(
    subentrada: ConfigSubentry, primero: bool, clave: str, dominio: str = "sensor"
) -> str:
    if primero:
        return f"{dominio}.{PREFIJO_ENTIDADES}{clave}"
    return f"{dominio}.{PREFIJO_ENTIDADES}{slugify(subentrada.title)}_{clave}"


def dispositivo(sub: ConfigSubentry) -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, sub.subentry_id)},
        name=sub.title,
        manufacturer="PVPC + Bono Social",
        model="Suministro PVPC",
        entry_type=DeviceEntryType.SERVICE,
    )


def _euros(x: Decimal | None) -> float | None:
    return None if x is None else float(x.quantize(Decimal("0.01")))


class _Base(CoordinatorEntity[FacturacionSuministro], SensorEntity):
    _attr_has_entity_name = True
    clave: str = ""

    def __init__(self, coordinador: FacturacionSuministro, primero: bool) -> None:
        super().__init__(coordinador)
        sub = coordinador.subentrada
        heredados = sub.data.get(CONF_IDS_HEREDADOS) or {}
        self._attr_unique_id = heredados.get(self.clave, f"{sub.subentry_id}_{self.clave}")
        self._attr_translation_key = self.clave
        self.entity_id = entity_id_suministro(sub, primero, self.clave)
        self._attr_device_info = dispositivo(sub)

    @property
    def d(self) -> DatosFacturacion:
        return self.coordinator.data

    @property
    def available(self) -> bool:
        return super().available and self.coordinator.data is not None and self.d.estimacion is not None


class FacturaActual(_Base):
    clave = "factura_actual"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_native_unit_of_measurement = EUR
    _attr_suggested_display_precision = 2
    _unrecorded_attributes = frozenset({"desglose", "kwh_medidos", "kwh_previstos", "facturas"})

    @property
    def native_value(self) -> float | None:
        return _euros(self.d.estimacion.prevision.total)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        e = self.d.estimacion
        f = e.prevision
        return {
            "acumulado": _euros(e.acumulado.total) if e.acumulado else 0.0,
            "prevision_baja": _euros(e.prevision_baja),
            "prevision_alta": _euros(e.prevision_alta),
            "inicio": e.inicio.isoformat(),
            "fin_previsto": e.corte.isoformat(),
            "emision_prevista": e.emision.isoformat(),
            "dia": e.dias_transcurridos,
            "dias_periodo": e.dias_totales,
            "kwh_medidos": {p: round(float(v), 2) for p, v in e.kwh_medidos.items()},
            "kwh_previstos": {p: round(float(v), 2) for p, v in e.kwh_previstos.items()},
            "desglose": {
                "potencia": _euros(f.potencia),
                "energia": _euros(f.energia),
                "financiacion_bono": _euros(f.financiacion_bono),
                "descuento_bono": _euros(f.descuento),
                "impuesto_electricidad": _euros(f.iee),
                "alquiler_contador": _euros(sum(f.alquiler, Decimal(0))),
                "iva": _euros(f.iva),
            },
            "horas_sin_consumo": self.d.horas_sin_consumo,
            "horas_sin_precio": self.d.horas_sin_precio,
            # Periodos cerrados para la gráfica de facturas de la tarjeta: real = factura introducida.
            "facturas": [
                {
                    "inicio": c["inicio"],
                    "fin": c["fin"],
                    "total": _euros(Decimal(c["total"])),
                    "real": c.get("estado") == "conciliada",
                }
                for c in self.coordinator.cerradas
            ],
        }


class FacturaAnterior(_Base):
    clave = "factura_anterior"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_native_unit_of_measurement = EUR
    _attr_suggested_display_precision = 2

    @property
    def available(self) -> bool:
        return super(_Base, self).available and self.coordinator.data is not None and bool(self.d.anterior)

    @property
    def native_value(self) -> float | None:
        return float(Decimal(self.d.anterior["total"]))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        a = self.d.anterior
        out = {
            "inicio": a["inicio"],
            "fin": a["fin"],
            "emision_prevista": a.get("emision"),
            "estado": a.get("estado", "estimada"),
            "kwh": a.get("kwh"),
        }
        if a.get("estado") == "conciliada" and a.get("total_estimado"):
            out["estimada"] = float(Decimal(a["total_estimado"]))
            out["desviacion"] = float(Decimal(a["total_estimado"]) - Decimal(a["total"]))
        return out


class ComprobacionFactura(_Base):
    """Si la última factura real cuadra con la que calcula el simulador de la CNMC."""

    clave = "comprobacion_factura"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["correcta", "no_cuadra", "arrastre", "sin_comprobar", "cnmc_no_responde", "desactivada"]  # noqa: RUF012

    @property
    def available(self) -> bool:
        return super(_Base, self).available and self.coordinator.data is not None

    @property
    def native_value(self) -> str:
        if not self.coordinator.usa_segunda_opinion:
            return "desactivada"
        c = self.coordinator.ultima_conciliada()
        if c is None:
            return "sin_comprobar"
        if c.get("cnmc"):
            return c["cnmc"]["estado"]
        return "cnmc_no_responde" if c.get("cnmc_error") else "sin_comprobar"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        c = self.coordinator.ultima_conciliada()
        if c is None:
            return {}
        out: dict[str, Any] = {"inicio": c["inicio"], "fin": c["fin"], "factura": float(Decimal(c["total"]))}
        if cnmc := c.get("cnmc"):
            out |= {
                "cnmc": cnmc["total"],
                "diferencia": cnmc.get("diferencia"),
                "desglose_cnmc": cnmc.get("desglose"),
                "kwh_contador": c.get("kwh"),
                "comprobada": cnmc.get("fecha"),
            }
        elif c.get("cnmc_error"):
            out["error"] = c["cnmc_error"]
        return out


class CosteHoy(_Base):
    """Coste de hoy (compatible con el «coste hoy» de la v0.2 y el panel de Energía)."""

    clave = "coste_hoy"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_state_class = SensorStateClass.TOTAL
    _attr_native_unit_of_measurement = EUR
    _attr_suggested_display_precision = 2

    @property
    def native_value(self) -> float | None:
        return round(float(self.d.coste_hoy), 4)

    @property
    def last_reset(self) -> datetime:
        return datetime.combine(dt_util.now(REFERENCE_TZ).date(), time(0), REFERENCE_TZ)


class PrecioReal(_Base):
    """Lo que cuesta de verdad 1 kWh más en cada hora, con bono e impuestos."""

    clave = "precio_real"
    _attr_native_unit_of_measurement = EUR_KWH
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 4
    _unrecorded_attributes = frozenset(
        {f"price_{h:02d}h" for h in range(24)} | {f"price_next_day_{h:02d}h" for h in range(24)}
    )

    @property
    def native_value(self) -> float | None:
        ahora = dt_util.utcnow().replace(minute=0, second=0, microsecond=0).astimezone(UTC)
        precio = self.d.precio_real.get(ahora)
        return None if precio is None else round(float(precio), 5)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        hoy = dt_util.now(REFERENCE_TZ).date()
        out: dict[str, Any] = {}
        for t, precio in self.d.precio_real.items():
            local = t.astimezone(REFERENCE_TZ)
            if local.date() == hoy:
                out.setdefault(f"price_{local.hour:02d}h", round(float(precio), 5))
            elif (local.date() - hoy).days == 1:
                out.setdefault(f"price_next_day_{local.hour:02d}h", round(float(precio), 5))
        return out


class KwhBonificables(_Base):
    clave = "kwh_bonificables"
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 0

    @property
    def native_value(self) -> float | None:
        return round(float(self.d.estimacion.kwh_bonificables_restantes), 1)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"limite_periodo": self.d.estimacion.limite_kwh, "arrastre_kwh": self.d.arrastre_kwh}


class EstadoDatos(_Base):
    clave = "estado_datos"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["ok", "sin_fecha", "sin_consumo", "precios_incompletos", "consumo_incompleto"]  # noqa: RUF012

    @property
    def available(self) -> bool:
        return super(_Base, self).available and self.coordinator.data is not None

    @property
    def native_value(self) -> str:
        d = self.d
        if d.problema:
            return d.problema
        if d.horas_sin_precio:
            return "precios_incompletos"
        if d.horas_sin_consumo:
            return "consumo_incompleto"
        return "ok"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        d = self.d
        historico = self.coordinator.historico
        dias = historico.dias()
        return {
            "fuente": self.coordinator.datos.get("fuente"),
            "ultima_hora_medida": d.ultima_hora_medida.isoformat() if d.ultima_hora_medida else None,
            "precios_hasta": dias[-1].isoformat() if dias else None,
            "tarifas": historico.tarifas.version if historico.tarifas else None,
            "horas_sin_consumo": d.horas_sin_consumo,
            "horas_sin_precio": d.horas_sin_precio,
            "calibracion": (
                {
                    "alfa": round(float(d.ajuste.alfa), 4),
                    "consumo_no_medido_w": round(float(d.ajuste.gamma_kwh_hora) * 1000, 1),
                }
                if d.ajuste
                else "sin calibrar"
            ),
            "precision": self.coordinator.precision or None,
            "arrastre_kwh": d.arrastre_kwh,
            "horas_corregidas_shelly": d.horas_corregidas_shelly,
            "shelly": self.coordinator.estado_shelly if self.coordinator.usa_shelly else None,
        }


TIPOS = (
    FacturaActual,
    FacturaAnterior,
    CosteHoy,
    PrecioReal,
    KwhBonificables,
    EstadoDatos,
    ComprobacionFactura,
)
CLAVES = tuple(t.clave for t in TIPOS)


def entidades_de(entry: ConfigEntry, coordinadores: dict[str, FacturacionSuministro]):
    """(subentry_id, entidades) de cada suministro, el primero sin nombre en el entity_id."""
    primero = next(iter(coordinadores), None)
    for subentry_id, coord in coordinadores.items():
        yield subentry_id, [tipo(coord, subentry_id == primero) for tipo in TIPOS]
