"""Servicios: `conciliar_factura` (F4), `enviar_resumen` (F5) y `comparar_tarifas` (F8)."""

from __future__ import annotations

from decimal import Decimal

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr

from .const import CONF_DESTINO, DOMAIN, SUBENTRY_RESUMEN

SERVICIO_CONCILIAR = "conciliar_factura"
ESQUEMA_CONCILIAR = vol.Schema(
    {
        vol.Required("suministro"): cv.string,
        vol.Required("inicio"): cv.date,
        vol.Required("fin"): cv.date,
        vol.Optional("emision"): cv.date,
        vol.Required("kwh_p1"): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Required("kwh_p2"): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Required("kwh_p3"): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Required("total"): vol.All(vol.Coerce(float), vol.Range(min=0)),
        vol.Optional("kwh_bonificados"): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)


def _subentrada_de(hass: HomeAssistant, device_id: str, atributo: str):
    dispositivo = dr.async_get(hass).async_get(device_id)
    if dispositivo is None:
        raise HomeAssistantError(f"No existe el dispositivo {device_id}")
    ids = {ident for dominio, ident in dispositivo.identifiers if dominio == DOMAIN}
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        for subentry_id, objeto in getattr(entry.runtime_data, atributo, {}).items():
            if subentry_id in ids:
                return objeto
    raise HomeAssistantError("Ese dispositivo no es un suministro de PVPC + Bono Social")


def _facturacion(hass: HomeAssistant, device_id: str):
    dispositivo = dr.async_get(hass).async_get(device_id)
    if dispositivo is None:
        raise HomeAssistantError(f"No existe el dispositivo {device_id}")
    ids = {ident for dominio, ident in dispositivo.identifiers if dominio == DOMAIN}
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        for subentry_id, facturacion in getattr(entry.runtime_data, "suministros", {}).items():
            if subentry_id in ids:
                return facturacion
    raise HomeAssistantError("Ese dispositivo no es un suministro de PVPC + Bono Social")


async def _async_conciliar(call: ServiceCall) -> None:
    d = call.data
    facturacion = _facturacion(call.hass, d["suministro"])
    try:
        await facturacion.async_conciliar(
            inicio=d["inicio"],
            fin=d["fin"],
            emision=d.get("emision"),
            kwh={"P1": d["kwh_p1"], "P2": d["kwh_p2"], "P3": d["kwh_p3"]},
            total=Decimal(str(d["total"])),
            bonificados=d.get("kwh_bonificados"),
        )
    except ValueError as exc:
        raise HomeAssistantError(str(exc)) from exc


SERVICIO_RESUMEN = "enviar_resumen"
ESQUEMA_RESUMEN = vol.Schema(
    {
        vol.Optional("manana", default=False): cv.boolean,
        vol.Optional("destino"): cv.entity_domain("notify"),
        vol.Optional("dry_run", default=False): cv.boolean,
    }
)


async def _async_resumen(call: ServiceCall) -> ServiceResponse:
    """Envía el resumen (a un destino o a todos los configurados) o, con dry_run, lo devuelve."""
    from .notificacion import async_enviar, destino_telegram, texto

    hass = call.hass
    entradas = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entradas:
        raise HomeAssistantError("PVPC + Bono Social no está cargada")
    entry = entradas[0]
    resumenes = [dict(s.data) for s in entry.subentries.values() if s.subentry_type == SUBENTRY_RESUMEN]
    destino = call.data.get("destino")
    if destino:
        datos = next((r for r in resumenes if r[CONF_DESTINO] == destino), resumenes[0] if resumenes else {})
        resumenes = [{**datos, CONF_DESTINO: destino}]
    manana = call.data["manana"]
    if call.data["dry_run"]:
        datos = resumenes[0] if resumenes else {}
        markdown = not datos.get(CONF_DESTINO) or destino_telegram(hass, datos[CONF_DESTINO]) is not None
        mensaje = texto(hass, entry, datos, manana, markdown)
        if mensaje is None:  # mañana aún sin precios
            return {"titulo": None, "texto": None}
        return {"titulo": mensaje.titulo, "texto": mensaje.texto}
    if not resumenes:
        raise HomeAssistantError("No hay ningún resumen configurado: añade uno o indica el destino")
    enviados = 0
    for datos in resumenes:
        if await async_enviar(hass, entry, datos, manana):
            enviados += 1
    if not enviados:
        raise HomeAssistantError("Mañana aún no tiene precios publicados")
    return {"enviados": enviados} if call.return_response else None


SERVICIO_COMPARAR = "comparar_tarifas"
ESQUEMA_COMPARAR = vol.Schema(
    {
        vol.Required("suministro"): cv.string,
        vol.Optional("destino"): cv.entity_domain("notify"),
        vol.Optional("notificacion", default=True): cv.boolean,
    }
)


async def _async_comparar(call: ServiceCall) -> ServiceResponse:
    """Comparativa de tarifas del suministro (DISENO §8 bis)."""
    comparador = _subentrada_de(call.hass, call.data["suministro"], "comparadores")
    resultado = await comparador.async_comparar(
        destino=call.data.get("destino"), notificar=call.data["notificacion"]
    )
    return resultado if call.return_response else None


def registrar(hass: HomeAssistant) -> None:
    hass.services.async_register(
        DOMAIN,
        SERVICIO_COMPARAR,
        _async_comparar,
        schema=ESQUEMA_COMPARAR,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(DOMAIN, SERVICIO_CONCILIAR, _async_conciliar, schema=ESQUEMA_CONCILIAR)
    hass.services.async_register(
        DOMAIN,
        SERVICIO_RESUMEN,
        _async_resumen,
        schema=ESQUEMA_RESUMEN,
        supports_response=SupportsResponse.OPTIONAL,
    )
