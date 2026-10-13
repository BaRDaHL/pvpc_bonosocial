"""Sirve la tarjeta «PVPC + Bono Social» y la carga en el frontend (DISENO §7).

El `.js` va empaquetado con Lit de versión fija (código fuente en `frontend/` del
repositorio): no se descarga nada. No hay que añadir el recurso a mano:

- Con los paneles en modo almacenamiento (lo normal), se registra como **recurso de
  Lovelace** (`/pvpc_bonosocial/pvpc-bono-social-card.js?v=<versión>`), que el frontend carga
  en orden con el resto de tarjetas. La v1.0/1.1 usaba `frontend.add_extra_js_url`, que se
  carga en paralelo con la app: tras un Ctrl+F5 o en la app del móvil la tarjeta se quedaba a
  veces en «Error de configuración» (13-oct-2026).
- En modo YAML no se pueden tocar los recursos: se sigue usando `add_extra_js_url`.

Al eliminar la integración se quita el recurso.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
ARCHIVO = Path(__file__).parent / "frontend" / "pvpc-bono-social-card.js"
URL = "/pvpc_bonosocial/pvpc-bono-social-card.js"


def _version() -> str:
    return json.loads((Path(__file__).parent / "manifest.json").read_text(encoding="utf-8"))["version"]


async def async_registrar(hass: HomeAssistant) -> bool:
    """Registra la tarjeta. False si no hay frontend (por ejemplo, en pruebas sin HTTP)."""
    if getattr(hass, "http", None) is None or "frontend" not in hass.config.components:
        return False
    from homeassistant.components.frontend import add_extra_js_url
    from homeassistant.components.http import StaticPathConfig

    version = await hass.async_add_executor_job(_version)
    await hass.http.async_register_static_paths([StaticPathConfig(URL, str(ARCHIVO), cache_headers=False)])
    url = f"{URL}?v={version}"
    if await _async_recurso(hass, url):
        _LOGGER.debug("Tarjeta registrada como recurso de Lovelace: %s", url)
    else:
        add_extra_js_url(hass, url)
        _LOGGER.debug("Tarjeta registrada como módulo extra del frontend: %s", url)
    return True


def _recursos(hass: HomeAssistant) -> Any:
    """La colección de recursos de Lovelace si está en modo almacenamiento; si no, None."""
    datos = hass.data.get("lovelace")
    recursos = getattr(datos, "resources", None)
    # `resource_mode` desde HA 2026.x; antes, `mode`
    modo = getattr(datos, "resource_mode", None) or getattr(datos, "mode", None)
    if modo != "storage" or not hasattr(recursos, "async_create_item"):
        return None
    return recursos


async def _async_propios(recursos: Any) -> list[dict[str, Any]]:
    if not recursos.loaded:
        await recursos.async_load()
        recursos.loaded = True
    return [r for r in recursos.async_items() if str(r.get("url", "")).split("?")[0] == URL]


async def _async_recurso(hass: HomeAssistant, url: str) -> bool:
    """Crea o actualiza (con la versión nueva) el recurso de la tarjeta. False en modo YAML."""
    recursos = _recursos(hass)
    if recursos is None:
        return False
    propios = await _async_propios(recursos)
    if not propios:
        await recursos.async_create_item({"res_type": "module", "url": url})
        return True
    if propios[0].get("url") != url or propios[0].get("type") != "module":
        await recursos.async_update_item(propios[0]["id"], {"res_type": "module", "url": url})
    for sobrante in propios[1:]:
        await recursos.async_delete_item(sobrante["id"])
    return True


async def async_quitar(hass: HomeAssistant) -> None:
    """Quita el recurso de la tarjeta (al eliminar la integración)."""
    recursos = _recursos(hass)
    if recursos is None:
        return
    for propio in await _async_propios(recursos):
        await recursos.async_delete_item(propio["id"])
