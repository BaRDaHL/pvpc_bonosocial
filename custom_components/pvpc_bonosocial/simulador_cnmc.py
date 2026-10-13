"""Segunda opinión de la factura con el simulador oficial de la CNMC (`facturaluz`).

El simulador de facturas PVPC de la CNMC (`comparador.cnmc.gob.es/facturaluz`) tiene por debajo
dos llamadas públicas sin autenticación, sin documentar (las mismas que usa su web y la
integración Enchufado, MIT):

1. `POST /api/publico/facturaluz/cargar/curvaConsumo` con la curva horaria en CSV (base64),
   el mismo formato que se descarga de las distribuidoras. Devuelve un identificador
   («curva-consumo-14-0-false-false» → «curva-consumo-14»).
2. `GET /api/publico/ofertas/pvpc` con ese identificador, el periodo, las potencias, el
   código postal y el bono social (tipo y categoría). Devuelve la factura con su desglose
   (`resultadoPVPC`).

Privacidad: el CSV lleva un CUPS de ejemplo, no el del titular (la CNMC no lo comprueba;
probado el 13-oct-2026). Se envían el consumo hora a hora del periodo, las potencias, el
código postal y el tipo de bono; por eso es una opción que se activa a mano.

La CNMC no aplica el arrastre de kWh bonificables de periodos anteriores (lo dice en su
propia nota) y calcula con la curva que se le da (la del medidor de HA), así que su importe
puede diferir algo del de la factura real.
"""

from __future__ import annotations

import base64
import json
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

import aiohttp

from .cnmc import CnmcNoResponde
from .engine.factura import Bono

URL_CURVA = "https://comparador.cnmc.gob.es/api/publico/facturaluz/cargar/curvaConsumo"
URL_FACTURA = "https://comparador.cnmc.gob.es/api/publico/ofertas/pvpc"
TIMEOUT = aiohttp.ClientTimeout(total=90)
CUPS_EJEMPLO = "ES0000000000000000TE"
TARIFA_20TD = 4

# Bono social → `tipoConsumidor` de la CNMC (1 vulnerable, 2 vulnerable severo). La CNMC no
# distingue el severo en riesgo de exclusión (su factura la paga la Administración).
TIPO_CONSUMIDOR = {Bono.VULNERABLE: 1, Bono.SEVERO: 2, Bono.SEVERO_EXCLUSION: 2}
# Categoría del límite de kWh con descuento (RD 897/2017 desde 2023) → `categoria` de la CNMC.
CATEGORIA = {
    "individual_o_dos": 1,
    "tres_o_pensionista_o_dos_con_menor": 2,
    "cuatro_o_tres_con_dos_menores": 3,
    "cinco_o_mas_o_familia_numerosa": 4,
}
# Líneas del desglose (`resultadoPVPC`): comienzo de la cabecera → clave.
LINEAS = {
    "Término Fijo": "potencia",
    "Término variable": "energia",
    "Financiación del bono social": "financiacion_bono",
    "Descuento Bono Social": "descuento",
    "Impuesto eléctrico": "iee",
    "Equipo de medida": "alquiler",
    "IVA": "iva",
    "TOTAL FACTURA": "total",
}
_AVISO = re.compile(r"^Aviso:")
_ID_CURVA = re.compile(r"^(\D+\d+)-")


@dataclass(frozen=True)
class SimulacionCnmc:
    total: Decimal
    desglose: dict[str, Decimal] = field(default_factory=dict)
    kwh: dict[str, Decimal] = field(default_factory=dict)

    def a_dict(self) -> dict[str, Any]:
        return {
            "total": float(self.total),
            "desglose": {k: float(v) for k, v in self.desglose.items()},
            "kwh": {k: float(v) for k, v in self.kwh.items()},
        }


def curva_csv(horas: Mapping[datetime, Decimal], zona) -> str:
    """CSV de la curva horaria (hora local 1–24, kWh con coma), con el CUPS de ejemplo."""
    lineas = ["CUPS;Fecha;Hora;Consumo;Metodo_obtencion\r\n"]
    resto = Decimal(0)  # redondeo a Wh arrastrado, para que el total no pierda kWh
    for t in sorted(horas):
        local = t.astimezone(zona)
        valor = (Decimal(horas[t]) + resto).quantize(Decimal("0.001"))
        resto += Decimal(horas[t]) - valor
        kwh = f"{max(valor, Decimal(0)):.3f}".replace(".", ",")
        lineas.append(f"{CUPS_EJEMPLO};{local:%d/%m/%Y};{local.hour + 1};{kwh};R\r\n")
    return "".join(lineas)


def parametros(
    *,
    inicio: date,
    fin: date,
    potencia_p1_kw: Decimal,
    potencia_p2_kw: Decimal,
    codigo_postal: str,
    bono: Bono,
    categoria: str | None,
    id_curva: str,
    zona,
) -> dict[str, str]:
    """`inicio` es el día de la lectura anterior (no se factura) y `fin` el último día facturado."""
    con_bono = bono is not Bono.NINGUNO

    def ms(d: date) -> str:
        return str(int(datetime(d.year, d.month, d.day, tzinfo=zona).timestamp()) * 1000)

    return {
        "tipoContador": "I",
        "periodoFacturacion": f"{inicio.isoformat()},{fin.isoformat()}",
        "codigoPostal": codigo_postal,
        "bonoSocial": "true" if con_bono else "false",
        "tipoConsumidor": str(TIPO_CONSUMIDOR.get(bono, 1)),
        "categoria": str(CATEGORIA.get(categoria or "", 1)),
        "contador": "1",
        "potenciaPrimeraFranja": str(potencia_p1_kw),
        "potenciaSegundaFranja": str(potencia_p2_kw),
        "consumo1": "0",
        "consumo2": "0",
        "consumo3": "0",
        "curvaConsumo": id_curva,
        "vivienda": "false",
        "tarifa": str(TARIFA_20TD),
        "calculoAntiguo": "false",
        "autoconsumo": "false",
        "perfilConsumo": "0",
        "fechaInicio": inicio.isoformat(),
        "fechaFin": fin.isoformat(),
        "potenciaAutoconsumo": "0",
        "inicioPFacturacion": ms(inicio),
        "finPFacturacion": ms(fin),
    }


def _decimal(valor: Any) -> Decimal:
    return Decimal(str(valor)).quantize(Decimal("0.01"))


def parsear(datos: Mapping[str, Any]) -> SimulacionCnmc:
    desglose: dict[str, Decimal] = {}
    for linea in datos.get("resultadoPVPC") or []:
        cabecera = str(linea.get("cabecera") or "")
        clave = next((v for k, v in LINEAS.items() if cabecera.startswith(k)), None)
        if clave and linea.get("valor") is not None:
            desglose[clave] = _decimal(linea["valor"])
    total = desglose.pop("total", None)
    if total is None:
        importe = (datos.get("graficoGastoTotalActual") or {}).get("importeTotal")
        if importe is None:
            raise CnmcNoResponde("La respuesta no trae el total de la factura")
        total = _decimal(importe)
    kwh = {
        f"P{i}": Decimal(str(datos[f"consumo{i}"])) for i in (1, 2, 3) if datos.get(f"consumo{i}") is not None
    }
    return SimulacionCnmc(total, desglose, kwh)


async def async_simular(
    session: aiohttp.ClientSession,
    *,
    horas: Mapping[datetime, Decimal],
    inicio: date,
    potencia_p1_kw: Decimal,
    potencia_p2_kw: Decimal,
    codigo_postal: str,
    bono: Bono,
    categoria: str | None,
    zona,
) -> SimulacionCnmc:
    """Factura de la CNMC con la curva `horas` (UTC → kWh) del día siguiente a `inicio` en adelante.

    Cualquier fallo es `CnmcNoResponde`.
    """
    if len(horas) <= 24:
        raise CnmcNoResponde("Hace falta más de un día de consumo")
    fin = max(horas).astimezone(zona).date()
    archivo = base64.b64encode(curva_csv(horas, zona).encode()).decode()
    try:
        async with session.post(
            URL_CURVA, json={"file": f"data:text/csv;base64,{archivo}"}, timeout=TIMEOUT
        ) as resp:
            texto = await resp.text()
            if resp.status != 200 or texto.lstrip().startswith("<"):
                raise CnmcNoResponde(f"Curva: HTTP {resp.status}")
        if _AVISO.match(texto):
            raise CnmcNoResponde(texto[:200])
        encontrado = _ID_CURVA.match(texto)
        if not encontrado:
            raise CnmcNoResponde(f"Curva: respuesta inesperada «{texto[:60]}»")
        params = parametros(
            inicio=inicio,
            fin=fin,
            potencia_p1_kw=potencia_p1_kw,
            potencia_p2_kw=potencia_p2_kw,
            codigo_postal=codigo_postal,
            bono=bono,
            categoria=categoria,
            id_curva=encontrado.group(1),
            zona=zona,
        )
        async with session.get(
            URL_FACTURA, params=params, headers={"Accept": "application/json"}, timeout=TIMEOUT
        ) as resp:
            if resp.status != 200:
                raise CnmcNoResponde(f"Factura: HTTP {resp.status}")
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


def periodo_curva(inicio: date, fin: date, zona) -> tuple[datetime, datetime]:
    """Horas que entran en la factura: del día siguiente a `inicio` hasta el final de `fin`."""
    desde = datetime(inicio.year, inicio.month, inicio.day, tzinfo=zona) + timedelta(days=1)
    hasta = datetime(fin.year, fin.month, fin.day, tzinfo=zona) + timedelta(days=1)
    return desde, hasta
