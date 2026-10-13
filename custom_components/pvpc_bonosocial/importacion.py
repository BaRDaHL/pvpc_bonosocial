"""Importación desde PVPC Next, siempre con confirmación y copia de seguridad (DISENO §9.2).

Las entidades `sensor.esios_*` de PVPC Next pasan a esta integración con su historial y
sus estadísticas y se renombran a `sensor.pvpc_bs_*` (renombrado.py): se desactiva la
entrada de PVPC Next y se cambia la plataforma de cada entidad en el registro, dentro de
`async_setup_entry` y antes de cargar las plataformas. Idempotente.

Dos caminos llevan aquí: el alta («Importar de PVPC Next») y el aviso de Repairs cuando la
integración ya está cargada. Los dos dejan en los datos de la entrada la marca
`CONF_IMPORTAR` con el entry_id de PVPC Next; la mueve el siguiente arranque.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry, ConfigEntryDisabler
from homeassistant.const import CONF_API_TOKEN, CONF_NAME, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.typing import UNDEFINED

from .const import (
    ATTR_BETTER_PRICE_TARGET,
    ATTR_ENABLE_PRIVATE_API,
    ATTR_NEXT_BEST_IN_UPDATE,
    ATTR_NEXT_PERIOD_IN_UPDATE,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ATTR_NEXT_PRICE_IN_UPDATE,
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    ATTR_PRICE_MODE,
    ATTR_SHOW_REFERENCE_PRICE,
    ATTR_TARIFF,
    DEFAULT_NAME,
    DEFAULT_TARIFF,
    DOMAIN,
    PREFIJO_ENTIDADES,
    SUFIJOS_ENTIDADES,
    normalize_better_price_target,
    normalize_price_mode,
)
from .migracion import normalizar_config_pvpc_next, unique_id_actual_pvpc_next
from .prices.aiopvpc.const import KEY_PVPC, TARIFFS
from .renombrado import async_actualizar_panel_energia, avisar_nombres, renombrar

_LOGGER = logging.getLogger(__name__)

DOMINIO_PVPC_NEXT = "pvpc_next"
CONF_IMPORTAR = "importar_pvpc_next"
ISSUE_IMPORTAR = "importar_pvpc_next"
ISSUE_PVPC_NEXT_VACIA = "pvpc_next_vacia"
CONF_COPIA = "copia_seguridad"

# Configuración de PVPC Next que se importa (el resto se ignora)
CLAVES_IMPORTADAS = (
    CONF_NAME,
    ATTR_TARIFF,
    ATTR_POWER_P1,
    ATTR_POWER_P3,
    ATTR_BETTER_PRICE_TARGET,
    ATTR_NEXT_PRICE_IN_UPDATE,
    ATTR_NEXT_BEST_IN_UPDATE,
    ATTR_NEXT_PERIOD_IN_UPDATE,
    ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
    ATTR_ENABLE_PRIVATE_API,
    ATTR_PRICE_MODE,
    ATTR_SHOW_REFERENCE_PRICE,
    CONF_API_TOKEN,
)


def entidades_de(hass: HomeAssistant, origen_id: str) -> list[er.RegistryEntry]:
    registro = er.async_get(hass)
    return [
        e for e in er.async_entries_for_config_entry(registro, origen_id) if e.platform == DOMINIO_PVPC_NEXT
    ]


def entrada_a_importar(hass: HomeAssistant) -> ConfigEntry | None:
    """La entrada de PVPC Next con entidades (la de la Península primero)."""
    candidatas = [
        e for e in hass.config_entries.async_entries(DOMINIO_PVPC_NEXT) if entidades_de(hass, e.entry_id)
    ]
    candidatas.sort(
        key=lambda e: normalizar_config_pvpc_next(e.data, {})[0].get(ATTR_TARIFF) != DEFAULT_TARIFF
    )
    return candidatas[0] if candidatas else None


def config_importada(origen: ConfigEntry) -> dict[str, Any]:
    """Datos de la entrada principal a partir de los de PVPC Next (datos + opciones)."""
    data, options = normalizar_config_pvpc_next(origen.data, origen.options)
    config = {**data, **options}
    out = {k: config[k] for k in CLAVES_IMPORTADAS if k in config}
    out.setdefault(CONF_NAME, DEFAULT_NAME)
    out.setdefault(ATTR_TARIFF, DEFAULT_TARIFF)
    out[ATTR_BETTER_PRICE_TARGET] = normalize_better_price_target(out.get(ATTR_BETTER_PRICE_TARGET))
    out[ATTR_PRICE_MODE] = normalize_price_mode(out.get(ATTR_PRICE_MODE))
    return out


def resumen(hass: HomeAssistant, origen: ConfigEntry) -> dict[str, str]:
    """Textos para la confirmación: qué se va a mover y con qué opciones."""
    config = config_importada(origen)
    entidades = sorted(e.entity_id for e in entidades_de(hass, origen.entry_id))
    return {
        "titulo": origen.title,
        "total": str(len(entidades)),
        "entidades": ", ".join(entidades[:8]) + (" …" if len(entidades) > 8 else ""),
        "tarifa": config[ATTR_TARIFF],
        "token": "✔" if config.get(CONF_API_TOKEN) else "✘",
    }


async def async_importar(hass: HomeAssistant, entry: ConfigEntry, origen_id: str) -> int:
    """Mueve las entidades de PVPC Next a `entry`. Devuelve cuántas ha movido."""
    origen = hass.config_entries.async_get_entry(origen_id)
    if origen is not None and origen.disabled_by is None:
        # Descarga PVPC Next: sus entidades dejan de tener estado y se pueden mover.
        await hass.config_entries.async_set_disabled_by(origen_id, ConfigEntryDisabler.USER)

    dispositivo = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        name=DEFAULT_NAME,
        manufacturer="REE",
        entry_type=dr.DeviceEntryType.SERVICE,
        configuration_url="https://api.esios.ree.es",
    )
    registro = er.async_get(hass)
    movidas = 0
    renombres: dict[str, str] = {}
    for entidad in entidades_de(hass, origen_id):
        nuevo = unique_id_actual_pvpc_next(entidad.unique_id)
        # Si esta integración ya creó su propia copia (prefijo pvpc_bono_social_), sobra.
        propia = registro.async_get_entity_id(entidad.domain, DOMAIN, nuevo)
        if propia is not None:
            registro.async_remove(_apartar(registro, propia))
        estado = hass.states.get(entidad.entity_id)
        if estado is not None and estado.state != STATE_UNKNOWN:
            hass.states.async_remove(entidad.entity_id)  # estado «unavailable» restaurado
        registro.async_update_entity_platform(
            entidad.entity_id,
            DOMAIN,
            new_config_entry_id=entry.entry_id,
            # HA busca conflictos de unique_id en la plataforma antigua: si no cambia,
            # pasarlo choca con la propia entidad.
            new_unique_id=nuevo if nuevo != entidad.unique_id else UNDEFINED,
            new_device_id=dispositivo.id,
        )
        if entidad.disabled_by is er.RegistryEntryDisabler.CONFIG_ENTRY:
            # La desactivó HA al desactivar PVPC Next, no el usuario.
            registro.async_update_entity(entidad.entity_id, disabled_by=None)
        clave = clave_de_unique_id(nuevo)
        if clave in SUFIJOS_ENTIDADES:
            nombre = f"{entidad.domain}.{PREFIJO_ENTIDADES}{SUFIJOS_ENTIDADES[clave]}"
            if renombrar(hass, entidad.entity_id, nombre):
                renombres[entidad.entity_id] = nombre
        movidas += 1
    await async_actualizar_panel_energia(hass, renombres)
    avisar_nombres(hass, renombres)
    _LOGGER.info("Importadas %d entidades de PVPC Next (%d renombradas)", movidas, len(renombres))
    return movidas


def _apartar(registro: er.EntityRegistry, entity_id: str) -> str:
    """Cambia el entity_id de la copia propia antes de borrarla y devuelve el nuevo.

    El recorder no pasa el historial de PVPC Next a un entity_id que ya tiene historial
    («the new entity_id is already in use»): la copia propia lleva el suyo (aunque sean
    minutos) a otro nombre y deja libre el `sensor.pvpc_bs_*` para el de PVPC Next. El
    recorder atiende los cambios de nombre en orden, así que este va antes que el de la
    entidad importada.
    """
    dominio, objeto = entity_id.split(".", 1)
    apartado = registro.async_generate_entity_id(dominio, f"{objeto}_sustituida")
    registro.async_update_entity(entity_id, new_entity_id=apartado)
    return apartado


def clave_de_unique_id(unique_id: str) -> str | None:
    """Clave del sensor a partir de su unique_id («tarifa» o «tarifa_clave»)."""
    for tarifa in TARIFFS:
        if unique_id == tarifa:
            return KEY_PVPC
        if unique_id.startswith(f"{tarifa}_"):
            return unique_id[len(tarifa) + 1 :]
    return None


def async_revisar_pvpc_next(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Avisos de Repairs: importar PVPC Next o eliminar su entrada vacía."""
    origen = entrada_a_importar(hass)
    if origen is not None:
        ir.async_create_issue(
            hass,
            DOMAIN,
            ISSUE_IMPORTAR,
            is_fixable=True,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_IMPORTAR,
            translation_placeholders=resumen(hass, origen),
            data={"entry_id": entry.entry_id, "origen": origen.entry_id},
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, ISSUE_IMPORTAR)
    vacias = [
        e for e in hass.config_entries.async_entries(DOMINIO_PVPC_NEXT) if not entidades_de(hass, e.entry_id)
    ]
    if vacias:
        ir.async_create_issue(
            hass,
            DOMAIN,
            ISSUE_PVPC_NEXT_VACIA,
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key=ISSUE_PVPC_NEXT_VACIA,
            translation_placeholders={"titulo": vacias[0].title},
        )
    else:
        ir.async_delete_issue(hass, DOMAIN, ISSUE_PVPC_NEXT_VACIA)
