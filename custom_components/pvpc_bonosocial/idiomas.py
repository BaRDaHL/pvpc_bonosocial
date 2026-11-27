"""Idioma de los textos que genera la integración (notificaciones, Telegram, avisos).

Los flujos, entidades y avisos de Reparaciones van por `translations/`; esto es para lo que se
escribe en Python: español, inglés, catalán, gallego y euskera, según el idioma de Home Assistant.
Cualquier otro idioma cae al inglés, como hace HA con las traducciones que faltan.
"""

from __future__ import annotations

from contextlib import suppress
from datetime import date, datetime

from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import translation

from .const import DOMAIN

IDIOMAS = ("es", "en", "ca", "gl", "eu")
POR_DEFECTO = "en"


def idioma(lenguaje: str | None) -> str:
    """«es», «en», «ca», «gl» o «eu» a partir del idioma de HA («es», «ca-ES», «en-GB»…)."""
    base = (lenguaje or "").replace("_", "-").split("-")[0].lower()
    return base if base in IDIOMAS else POR_DEFECTO


def coma_decimal(idioma_: str) -> bool:
    """Si los números llevan coma decimal y punto de miles («1.234,56 €»): todos menos el inglés."""
    return idioma_ != "en"


def numero(valor: object, cifras: str, idioma_: str) -> str:
    """Número con el separador decimal del idioma, sin separador de miles («12,34» o «12.34»).

    `cifras` es el formato de Python («.2f», «+.0f»…). Para los datos de los avisos de Reparaciones."""
    texto = f"{valor:{cifras}}"
    return texto.replace(".", ",") if coma_decimal(idioma_) else texto


# Fechas en cifras con el orden de cada idioma, para los avisos de Reparaciones y las notificaciones.
# Inglés, ISO: «02/12» no se lee igual en EE. UU. que en el Reino Unido. Euskera, año/mes/día.
_FECHA = {"es": "%d/%m/%Y", "en": "%Y-%m-%d", "ca": "%d/%m/%Y", "gl": "%d/%m/%Y", "eu": "%Y/%m/%d"}
_MES = {"es": "%m/%Y", "en": "%Y-%m", "ca": "%m/%Y", "gl": "%m/%Y", "eu": "%Y/%m"}


def fecha(valor: date | str, idioma_: str, *, hora: bool = False) -> str:
    """Fecha («25/11/2026», «2026-11-25», «2026/11/25») de un `date`, `datetime` o texto ISO.

    `hora` añade « HH:MM» (solo con `datetime`)."""
    if isinstance(valor, str):
        valor = date.fromisoformat(valor)
    formato = _FECHA[idioma(idioma_)]
    if hora and isinstance(valor, datetime):
        formato += " %H:%M"
    return valor.strftime(formato)


def fecha_mes(valor: date | str, idioma_: str) -> str:
    """Mes y año en cifras («11/2026», «2026-11», «2026/11») de un `date` o de «AAAA-MM»."""
    if isinstance(valor, str):
        valor = date.fromisoformat(f"{valor[:7]}-01")
    return valor.strftime(_MES[idioma(idioma_)])


def _cacheadas(hass: HomeAssistant, lenguaje: str) -> dict[str, str]:
    return translation.async_get_cached_translations(hass, lenguaje, "exceptions", DOMAIN)


@callback
def texto_error(hass: HomeAssistant, clave: str, **datos: str) -> str:
    """El mensaje `exceptions.<clave>` de translations/ en el idioma de HA (ya cargado al arrancar).

    Para lo que no puede llevar `translation_key` (las notificaciones persistentes) y para que el
    texto de la excepción (registro, trazas) salga en el idioma de HA y no siempre en inglés.
    """
    ruta = f"component.{DOMAIN}.exceptions.{clave}.message"
    texto = next(
        (t for lenguaje in (hass.config.language, "en") if (t := _cacheadas(hass, lenguaje).get(ruta))),
        None,
    )
    if not texto:
        return clave
    with suppress(KeyError, IndexError):
        texto = texto.format(**datos)
    return texto


@callback
def error(hass: HomeAssistant, clave: str, **datos: str) -> HomeAssistantError:
    """HomeAssistantError traducible: el frontend la enseña en el idioma de cada usuario."""
    return HomeAssistantError(
        texto_error(hass, clave, **datos),
        translation_domain=DOMAIN,
        translation_key=clave,
        translation_placeholders=datos or None,
    )
