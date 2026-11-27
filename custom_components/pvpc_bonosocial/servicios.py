"""Servicios: `conciliar_factura` y `leer_facturas` (F4), `enviar_resumen` (F5) y `comparar_tarifas` (F8)."""

from __future__ import annotations

import logging
from decimal import Decimal

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.service import async_register_admin_service
from homeassistant.util import dt as dt_util

from .const import CONF_DESTINO, DOMAIN, SUBENTRY_RESUMEN
from .idiomas import error, idioma
from .prices.aiopvpc.const import REFERENCE_TZ
from .validacion import MAX_KWH_FACTURA, MAX_TOTAL_FACTURA, errores_factura

_LOGGER = logging.getLogger(__name__)

SERVICIO_CONCILIAR = "conciliar_factura"
_KWH = vol.All(vol.Coerce(int), vol.Range(min=0, max=MAX_KWH_FACTURA))
ESQUEMA_CONCILIAR = vol.Schema(
    {
        vol.Required("suministro"): cv.string,
        vol.Required("inicio"): cv.date,
        vol.Required("fin"): cv.date,
        vol.Optional("emision"): cv.date,
        vol.Required("kwh_p1"): _KWH,
        vol.Required("kwh_p2"): _KWH,
        vol.Required("kwh_p3"): _KWH,
        vol.Required("total"): vol.All(vol.Coerce(float), vol.Range(min=0, max=MAX_TOTAL_FACTURA)),
        vol.Optional("kwh_bonificados"): _KWH,
        # Varias seguidas (la tarjeta): solo la última consulta a la CNMC, como el lote ZIP del flujo.
        vol.Optional("comprobar", default=True): cv.boolean,
    }
)


def _subentrada_de(hass: HomeAssistant, device_id: str, atributo: str):
    dispositivo = dr.async_get(hass).async_get(device_id)
    if dispositivo is None:
        raise error(hass, "dispositivo_no_existe", device_id=device_id)
    ids = {ident for dominio, ident in dispositivo.identifiers if dominio == DOMAIN}
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        for subentry_id, objeto in getattr(entry.runtime_data, atributo, {}).items():
            if subentry_id in ids:
                return objeto
    raise error(hass, "no_es_suministro")


async def _async_conciliar(call: ServiceCall) -> None:
    from .facturacion import FacturaFutura

    d = call.data
    facturacion = _subentrada_de(call.hass, d["suministro"], "suministros")
    kwh = {"P1": d["kwh_p1"], "P2": d["kwh_p2"], "P3": d["kwh_p3"]}
    if errores := errores_factura(kwh, d["total"], d.get("kwh_bonificados")):
        raise error(call.hass, next(iter(errores.values())))  # el primero; el otro, al corregirlo
    if not 0 < (d["fin"] - d["inicio"]).days <= 62:
        raise error(call.hass, "periodo_factura_no_valido")
    try:
        await facturacion.async_conciliar(
            inicio=d["inicio"],
            fin=d["fin"],
            emision=d.get("emision"),
            kwh=kwh,
            total=Decimal(str(d["total"])),
            bonificados=d.get("kwh_bonificados"),
            comprobar=d["comprobar"],
        )
    except FacturaFutura as exc:
        raise error(call.hass, "factura_futura") from exc
    except ValueError as exc:
        raise error(call.hass, "factura_no_guardada", error=str(exc)) from exc


SERVICIO_LEER = "leer_facturas"
ESQUEMA_LEER = vol.Schema(
    {
        vol.Required("suministro"): cv.string,
        # Ids de /api/file_upload (lo que sube el selector de archivos): PDF o ZIP de PDF. Como
        # mucho 12 archivos, igual que los PDF de un ZIP (MAX_FACTURAS_ZIP).
        vol.Required("archivos"): vol.All(cv.ensure_list, [cv.string], vol.Length(min=1, max=12)),
    }
)


async def _async_leer_facturas(call: ServiceCall) -> ServiceResponse:
    """Lee los PDF (o ZIP) subidos con el mismo lector que «Factura real»; no concilia nada.

    Devuelve las facturas con los campos de `conciliar_factura` y las que se quedan fuera con el
    motivo del lote ZIP. Como en el lote, se apartan las que el motor rechazaría al introducirlas.
    """
    from .flujo_suministro import MOTIVOS_ZIP, _leer_subida, campos_factura

    hass = call.hass
    _subentrada_de(hass, call.data["suministro"], "suministros")
    hoy = dt_util.now(REFERENCE_TZ).date()
    motivos = MOTIVOS_ZIP[idioma(hass.config.language)]
    facturas: list[dict] = []
    rechazadas: list[dict] = []
    for archivo in call.data["archivos"]:
        try:
            subida = await hass.async_add_executor_job(_leer_subida, hass, archivo)
        except ValueError:  # id caducado o inexistente, o ZIP no válido (como en el flujo)
            rechazadas.append({"id": archivo, "archivo": None, "motivo": "pdf_no_subido"})
            continue
        subida.apartar_no_validas(hoy)
        facturas += [{"id": archivo, "archivo": nombre, **campos_factura(f)} for nombre, f in subida.buenas]
        rechazadas += [{"id": archivo, "archivo": nombre, "motivo": m} for nombre, m in subida.malas]
    for r in rechazadas:
        r["texto"] = motivos.get(r["motivo"], r["motivo"])
    facturas.sort(key=lambda f: f["inicio"])
    return {"facturas": facturas, "rechazadas": rechazadas}


SERVICIO_RESUMEN = "enviar_resumen"
ESQUEMA_RESUMEN = vol.Schema(
    {
        vol.Optional("manana", default=False): cv.boolean,
        vol.Optional("destino"): cv.entity_domain("notify"),
        vol.Optional("dry_run", default=False): cv.boolean,
    }
)


async def _async_resumen(call: ServiceCall) -> ServiceResponse:
    """Envía el resumen (a un destino o a todos los configurados) o, con dry_run, lo devuelve.

    Recorre todas las entradas cargadas (una por tarifa: Península y Ceuta/Melilla), cada
    resumen con el histórico de su entrada. Un destino que falla no corta a los demás.
    """
    from .notificacion import async_enviar, destino_telegram, texto

    hass = call.hass
    entradas = hass.config_entries.async_loaded_entries(DOMAIN)
    if not entradas:
        raise error(hass, "no_cargada")
    # (entrada, datos del resumen) de todos los resúmenes configurados
    resumenes = [
        (entry, dict(s.data))
        for entry in entradas
        for s in entry.subentries.values()
        if s.subentry_type == SUBENTRY_RESUMEN
    ]
    destino = call.data.get("destino")
    if destino:
        # Los resúmenes con ese destino (en la entrada a la que pertenecen) o, si no hay
        # ninguno, el primer resumen configurado (con sus opciones) enviado a ese destino.
        con_destino = [(e, r) for e, r in resumenes if r[CONF_DESTINO] == destino]
        if not con_destino:
            con_destino = [resumenes[0] if resumenes else (entradas[0], {})]
        resumenes = [(e, {**r, CONF_DESTINO: destino}) for e, r in con_destino]
    manana = call.data["manana"]
    if call.data["dry_run"]:
        entry, datos = resumenes[0] if resumenes else (entradas[0], {})
        markdown = not datos.get(CONF_DESTINO) or destino_telegram(hass, datos[CONF_DESTINO]) is not None
        mensaje = texto(hass, entry, datos, manana, markdown)
        if mensaje is None:  # mañana aún sin precios
            return {"titulo": None, "texto": None}
        return {"titulo": mensaje.titulo, "texto": mensaje.texto}
    if not resumenes:
        raise error(hass, "sin_resumen")
    enviados = 0
    fallidos: list[str] = []
    sin_precios: list[str] = []
    for entry, datos in resumenes:
        try:
            if await async_enviar(hass, entry, datos, manana):
                enviados += 1
            else:  # mañana aún sin precios para esa entrada
                sin_precios.append(datos[CONF_DESTINO])
        except Exception as exc:  # cualquier fallo de un destino no corta a los demás
            _LOGGER.error("%s: no se pudo enviar el resumen a %s: %s", DOMAIN, datos[CONF_DESTINO], exc)
            fallidos.append(datos[CONF_DESTINO])
    if not enviados:
        if fallidos:
            raise error(hass, "resumen_no_enviado", destinos=", ".join(fallidos))
        raise error(hass, "manana_sin_precios")
    if not call.return_response:
        return None
    return {"enviados": enviados, "fallidos": fallidos, "sin_precios": sin_precios}


SERVICIO_COMPARAR = "comparar_tarifas"
ESQUEMA_COMPARAR = vol.Schema(
    {
        vol.Required("suministro"): cv.string,
        vol.Optional("destino"): cv.entity_domain("notify"),
        vol.Optional("notificacion", default=True): cv.boolean,
        vol.Optional("enviar", default=True): cv.boolean,
    }
)


async def _async_comparar(call: ServiceCall) -> ServiceResponse:
    """Comparativa de tarifas del suministro (DISENO §8 bis)."""
    comparador = _subentrada_de(call.hass, call.data["suministro"], "comparadores")
    resultado = await comparador.async_comparar(
        destino=call.data.get("destino"), notificar=call.data["notificacion"], enviar=call.data["enviar"]
    )
    return resultado if call.return_response else None


SERVICIO_ENVIAR_COMPARATIVA = "enviar_comparativa"
ESQUEMA_ENVIAR_COMPARATIVA = vol.Schema(
    {
        vol.Required("suministro"): cv.string,
        vol.Optional("destino"): cv.entity_domain("notify"),
    }
)


async def _async_enviar_comparativa(call: ServiceCall) -> None:
    """Reenvía la última comparativa del suministro (sin volver a consultar a la CNMC)."""
    comparador = _subentrada_de(call.hass, call.data["suministro"], "comparadores")
    await comparador.async_enviar(call.data.get("destino"))


def registrar(hass: HomeAssistant) -> None:
    # Solo administradores (y automatizaciones): conciliar reescribe la factura, la calibración y el
    # coste del panel de Energía sin forma de deshacerlo, y comparar envía datos a la CNMC.
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICIO_COMPARAR,
        _async_comparar,
        schema=ESQUEMA_COMPARAR,
        supports_response=SupportsResponse.OPTIONAL,
    )
    async_register_admin_service(hass, DOMAIN, SERVICIO_CONCILIAR, _async_conciliar, schema=ESQUEMA_CONCILIAR)
    # Lee lo subido para la tarjeta («Subir factura»), que luego concilia con conciliar_factura.
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICIO_LEER,
        _async_leer_facturas,
        schema=ESQUEMA_LEER,
        supports_response=SupportsResponse.ONLY,
    )
    async_register_admin_service(
        hass,
        DOMAIN,
        SERVICIO_ENVIAR_COMPARATIVA,
        _async_enviar_comparativa,
        schema=ESQUEMA_ENVIAR_COMPARATIVA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICIO_RESUMEN,
        _async_resumen,
        schema=ESQUEMA_RESUMEN,
        supports_response=SupportsResponse.OPTIONAL,
    )
