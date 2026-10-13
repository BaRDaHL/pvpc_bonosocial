"""Sirve la tarjeta «PVPC + Bono Social» y la carga en el frontend (DISENO §7).

El `.js` va empaquetado con Lit de versión fija (código fuente en `frontend/` del
repositorio): no se descarga nada. Se carga con `frontend.add_extra_js_url`, así que no hay
que añadir el recurso a mano en los paneles.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

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
    add_extra_js_url(hass, f"{URL}?v={version}")
    _LOGGER.debug("Tarjeta registrada en %s (versión %s)", URL, version)
    return True
