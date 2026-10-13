"""Cliente mínimo del comparador de ofertas de la CNMC (DISENO §8 bis, F8).

El comparador oficial (`comparador.cnmc.gob.es`) tiene por debajo una API pública sin
autenticación, `GET /api/publico/ofertas/electricidad`, que no está documentada. Los nombres
de los parámetros son los que manda su propio formulario; la lista de los que el servidor
exige y el formato de la respuesta se tomaron del cliente `comparador-luz-gas` de
nuncaeslupus (MIT), que la usa desde sep-2026 y cuya respuesta grabada sirve para las pruebas.

- Se manda el consumo anual **real** por periodo (P1/P2/P3) en lugar del reparto por perfil
  que usa el formulario: la CNMC calcula con él el importe de cada oferta con sus precios.
- Cada oferta trae `importePrimerAnio` (con descuentos de bienvenida) e `importeSegundoAnio`
  (sin ellos), con impuestos y alquiler del contador.
- El PVPC aparece como una oferta más de la «Comercializadora de referencia»; se separa.
- La API puede cambiar o caerse (el 10 y el 13-oct-2026 respondía 404 a todo, también a la
  propia web): un fallo se convierte en `CnmcNoResponde`, sin reintentos.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Mapping
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)
URL = "https://comparador.cnmc.gob.es/api/publico/ofertas/electricidad"
TIMEOUT = aiohttp.ClientTimeout(total=90)
CLAVE_RESULTADO = "resultadoComparador"
TARIFA_20TD = 4

# Comercializadoras con cuota relevante, para avisar de las que no están en el resultado
# (subcadena en mayúsculas del nombre que da la CNMC).
GRANDES = (
    "ENDESA",
    "IBERDROLA",
    "NATURGY",
    "REPSOL",
    "TOTALENERGIES",
    "PLENITUDE",
    "HOLALUZ",
    "EDP",
    "OCTOPUS",
    "GALP",
)

# Campos que el servidor exige presentes aunque solo se usan con una factura escaneada (QR),
# con autoconsumo o con el mecanismo de ajuste. A cero: «no aplica».
_CAMPOS_A_CERO = (
    "consumoAnualEQr",
    "consumoPrimeraFranjaQr",
    "consumoSegundaFranjaQr",
    "consumoTerceraFranjaQr",
    "consumoCuartaFranjaQr",
    "consumoQuintaFranjaQr",
    "consumoSextaFranjaQr",
    "consumoAnualEPQr",
    "consumoPrimeraFranjaPQr",
    "consumoSegundaFranjaPQr",
    "consumoTerceraFranjaPQr",
    "consumoCuartaFranjaPQr",
    "consumoQuintaFranjaPQr",
    "consumoSextaFranjaPQr",
    "energiaAutoconsumo",
    "idAuditoriaQR",
    "importe",
    "mecanismoAjuste",
    "mecanismoAjusteIVA",
    "importeMecanismoAjustePunta",
    "importeMecanismoAjusteLlano",
    "importeMecanismoAjusteValle",
    "precioConsumoMecanismoAjusteTotal",
    "precioConsumoMecanismoAjustePunta",
    "precioConsumoMecanismoAjusteLlano",
    "precioConsumoMecanismoAjusteValle",
    "tc",
    "bs",
    "impSA",
    "impOtros",
    "exc",
    "reg",
    "impOtrosConIE",
    "impOtrosSinIE",
    "pmaxP1",
    "pmaxP2",
    "dtoBS",
    "finBS",
    "ajuste",
    "impPot",
    "impEner",
    "dto",
    "prP1",
    "prP2",
    "prE1",
    "prE2",
    "prE3",
    "cfP1flex",
    "cfP2flex",
    "cambio",
    "promo",
    "verde",
    "rev",
    "trampeo",
)
_FRANJAS = ("Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta")


class CnmcNoResponde(Exception):
    """El comparador de la CNMC no ha dado una respuesta útil."""


@dataclass(frozen=True)
class ConsultaCnmc:
    """Datos que se envían a la CNMC: nada más que esto (DISENO §8 bis, «Privacidad»)."""

    codigo_postal: str
    potencia_p1_kw: Decimal
    potencia_p2_kw: Decimal
    kwh: Mapping[str, int]  # consumo anual por periodo P1/P2/P3, en kWh enteros

    def __post_init__(self) -> None:
        if not (len(self.codigo_postal) == 5 and self.codigo_postal.isdigit()):
            raise ValueError("El código postal debe tener 5 cifras")


@dataclass(frozen=True)
class OfertaCnmc:
    id: int
    comercializadora: str
    oferta: str
    importe_primer_anio: Decimal
    importe_segundo_anio: Decimal
    tipo: str | None  # «TE» precio fijo por periodo, «PVPC», otros (indexadas…)
    precio_unico: bool  # mismo precio en P1, P2 y P3
    permanencia: bool
    penalizacion_eur: Decimal
    servicios_adicionales: bool
    verde: bool
    validez: str | None
    solo_nuevos_clientes: bool

    @property
    def es_pvpc(self) -> bool:
        return self.tipo == "PVPC" or "referencia" in self.comercializadora.lower()


def parametros(c: ConsultaCnmc) -> dict[str, str]:
    """Parámetros de la petición: modo anual, vivienda, 2.0TD, sin filtros."""
    p1, p2, p3 = (int(c.kwh.get(k, 0)) for k in ("P1", "P2", "P3"))
    total = p1 + p2 + p3
    p: dict[str, Any] = {
        "tipoSuministro": "E",
        "codigoPostal": c.codigo_postal,
        "potencia": c.potencia_p1_kw,
        "consumoAnualE": total,
        "consumoAnualEOrig": total,
        "consumoAnualG": 0,
        "consumoAnualGOrig": 0,
        "tarifa": TARIFA_20TD,
        "vivienda": "true",
        # Filtros del formulario: 2 = indiferente (la API responde 400 a otros valores).
        "permanencia": 2,
        "serviciosAdicionales": 2,
        "revisionPrecios": 2,
        "perfilConsumo": 13,
        "autoconsumo": "false",
        "factura": "false",
        "potenciaAutoconsumo": c.potencia_p1_kw,
        "cups": "0000",
    }
    for n in _FRANJAS:
        p[f"potencia{n}Franja"] = c.potencia_p1_kw
        p[f"consumo{n}Franja"] = 0
    p["potenciaSegundaFranja"] = c.potencia_p2_kw
    p |= {"consumoPrimeraFranja": p1, "consumoSegundaFranja": p2, "consumoTerceraFranja": p3}
    p |= dict.fromkeys(_CAMPOS_A_CERO, 0)
    return {k: str(v) for k, v in p.items()}


def _decimal(valor: Any) -> Decimal:
    return Decimal(str(valor if valor is not None else 0)).quantize(Decimal("0.01"))


def parsear(datos: Mapping[str, Any]) -> list[OfertaCnmc]:
    """Ofertas de la respuesta, de la más barata a la más cara el primer año."""
    crudas = datos.get(CLAVE_RESULTADO)
    if crudas is None:
        return []
    if not isinstance(crudas, list):
        raise CnmcNoResponde(f"Formato inesperado: «{CLAVE_RESULTADO}» no es una lista")
    ofertas = []
    for o in crudas:
        try:
            validez = o.get("validez")
            ofertas.append(
                OfertaCnmc(
                    id=int(o["id"]),
                    comercializadora=str(o["comercializadora"]).strip(),
                    oferta=str(o["oferta"]).strip(),
                    importe_primer_anio=_decimal(o["importePrimerAnio"]),
                    importe_segundo_anio=_decimal(o.get("importeSegundoAnio")),
                    tipo=o.get("tipoElectricidad"),
                    precio_unico=o.get("tienePrecioUnico") == "S",
                    permanencia=bool(o.get("penalizacion")),
                    penalizacion_eur=_decimal(o.get("importeEstimadoPenalizacion")),
                    servicios_adicionales=bool(o.get("serviciosAdicionales")),
                    verde=bool(o.get("verde")),
                    validez=validez.strip() if isinstance(validez, str) else None,
                    solo_nuevos_clientes="nuevos clientes" in (validez or "").lower(),
                )
            )
        except (KeyError, TypeError, ValueError, ArithmeticError) as exc:
            _LOGGER.debug("Oferta de la CNMC descartada (%s): %s", exc, o)
    return sorted(ofertas, key=lambda x: (x.importe_primer_anio, x.id))


def grandes_ausentes(ofertas: list[OfertaCnmc]) -> list[str]:
    """Comercializadoras grandes sin ninguna oferta de mercado libre en el resultado."""
    nombres = " | ".join(o.comercializadora for o in ofertas if not o.es_pvpc).upper()
    return [g for g in GRANDES if g not in nombres]


async def async_consultar(session: aiohttp.ClientSession, consulta: ConsultaCnmc) -> list[OfertaCnmc]:
    """Una sola petición; cualquier fallo es `CnmcNoResponde`."""
    try:
        async with session.get(
            URL,
            params=parametros(consulta),
            headers={"Accept": "application/json"},
            timeout=TIMEOUT,
        ) as resp:
            if resp.status != 200:
                raise CnmcNoResponde(f"HTTP {resp.status}")
            texto = await resp.text()
    except (aiohttp.ClientError, TimeoutError) as exc:
        raise CnmcNoResponde(str(exc) or type(exc).__name__) from exc
    try:
        datos = json.loads(texto)
    except ValueError as exc:
        raise CnmcNoResponde("La respuesta no es JSON") from exc
    if not isinstance(datos, dict):
        raise CnmcNoResponde("Formato inesperado")
    return parsear(datos)
