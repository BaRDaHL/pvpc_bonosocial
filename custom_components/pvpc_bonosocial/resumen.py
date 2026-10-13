"""Texto del resumen de precios por notificación (DISENO §8), en Python puro.

Reproduce el script del titular «PVPC Gráfico Telegram» (plantilla Jinja de HA):

- filas `🕖07 🟧🟧🟧🟧🟧🟧🟧🟧🟧 0,242`: reloj de la hora, barra de 1 a 10 cuadrados
  (precio / máximo del día, redondeo de Jinja) del color de su posición en el rango del día y
  el precio con tres decimales; marcas `⬅️ 🤑 barata` / `⬅️ 💸 cara` en todas las horas
  que igualan el mínimo o el máximo y `👈 ahora` (solo en el mensaje de hoy);
- el mensaje de la noche empieza por las horas que quedan de hoy (escaladas con el máximo de
  mañana), el separador `──── mañana ────` y las 24 de mañana con 🔺/🔻/🟰 frente a hoy;
  debajo, la media con el % de cambio, el consumo del día en negrita y las mejores franjas;
- todo dentro de un bloque de código salvo el título (va como título de Telegram), la media,
  el consumo y las franjas.

Cambio respecto al script, decidido por el titular (DISENO §8.2): los días valle completos
se colorean frente a los 5 laborables anteriores y cada hora con la regla de su día. Además,
en los laborables cada hora lleva su periodo tras la hora (🔴 punta, 🟡 llano, 🟢 valle).
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date
from decimal import ROUND_HALF_EVEN, Decimal

COLORES = ("🟩", "🟨", "🟧", "🟥")
RELOJES = ("🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚")
MEDALLAS = ("🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣")
PERIODOS = {"P1": "🔴", "P2": "🟡", "P3": "🟢"}  # punta, llano, valle
UMBRAL_FLECHA = Decimal("0.005")  # €/kWh: por debajo, 🟰

TEXTOS = {
    "es": {
        "titulo_hoy": "⚡ Precios de la luz hoy (€/kWh)",
        "titulo_manana": "🌙 Precios de la luz mañana vs hoy (€/kWh)",
        "barata": " ⬅️ 🤑 barata",
        "cara": " ⬅️ 💸 cara",
        "ahora": " 👈 ahora",
        "separador": "──── mañana ────",
        "franjas": "🧺 Mejores franjas de {horas} h:",
        "franjas_manana": "🧺 Mejores franjas de {horas} h mañana:",
        "media": "Media: hoy {hoy} → mañana {manana} ({cambio} %)",
        "consumo": "⚡ Consumido hasta ahora: {negrita}{kwh} kWh · {eur} €{negrita}",
        "factura": "🧾 Factura en curso: {acumulado} € (previsión {prevision} €)",
        "sin_datos": "Sin datos de precios todavía.",
        "periodos": PERIODOS,
        "leyenda": "🟢 valle · 🟡 llano · 🔴 punta",
        "decimal": ",",
    },
    "en": {
        "titulo_hoy": "⚡ Electricity prices today (€/kWh)",
        "titulo_manana": "🌙 Electricity prices tomorrow vs today (€/kWh)",
        "barata": " ⬅️ 🤑 cheap",
        "cara": " ⬅️ 💸 expensive",
        "ahora": " 👈 now",
        "separador": "──── tomorrow ────",
        "franjas": "🧺 Best {horas} h slots:",
        "franjas_manana": "🧺 Best {horas} h slots tomorrow:",
        "media": "Average: today {hoy} → tomorrow {manana} ({cambio} %)",
        "consumo": "⚡ Used so far: {negrita}{kwh} kWh · {eur} €{negrita}",
        "factura": "🧾 Current bill: {acumulado} € (forecast {prevision} €)",
        "sin_datos": "No price data yet.",
        "periodos": PERIODOS,
        "leyenda": "🟢 off-peak · 🟡 standard · 🔴 peak",
        "decimal": ".",
    },
}


@dataclass(frozen=True)
class DiaPrecios:
    """Precios de un día en €/kWh, uno por hora local (23, 24 o 25)."""

    dia: date
    precios: tuple[Decimal, ...]
    horas: tuple[int, ...]  # hora local de inicio de cada posición
    valle: bool = False  # todas las horas en P3 según el TEU (fin de semana, festivo)
    periodos: tuple[str | None, ...] = ()  # P1/P2/P3 de cada hora


@dataclass(frozen=True)
class Opciones:
    franjas_hoy: int = 4
    franjas_manana: int = 3
    duracion: int = 3  # horas de cada franja
    color_valle: str = "laborables"  # «laborables» (DISENO §8.2) o «dia»
    markdown: bool = True  # bloque de código y negrita (Telegram); si no, texto plano
    mostrar_periodo: bool = True  # letra del periodo en los laborables
    idioma: str = "es"
    # Laborables anteriores para colorear los días valle, por día (los da quien llama).
    referencias: dict[date, Sequence[DiaPrecios]] = field(default_factory=dict)


@dataclass(frozen=True)
class Mensaje:
    titulo: str
    texto: str


def _num(x: Decimal, decimales: int, separador: str) -> str:
    """Como `'%.3f'|format(v)|replace('.', ',')` en Jinja (el precio llega como float)."""
    return f"{float(x):.{decimales}f}".replace(".", separador)


def _media(precios: Sequence[Decimal]) -> Decimal:
    return sum(precios, Decimal(0)) / len(precios)


def _cuartiles(valores: Sequence[Decimal]) -> tuple[Decimal, Decimal, Decimal]:
    """P25, P50 y P75 con interpolación lineal (como `statistics.quantiles`, método inclusivo)."""
    v = sorted(valores)
    out = []
    for q in (Decimal("0.25"), Decimal("0.5"), Decimal("0.75")):
        pos = q * (len(v) - 1)
        i = int(pos)
        out.append(v[i] + (v[min(i + 1, len(v) - 1)] - v[i]) * (pos - i))
    return out[0], out[1], out[2]


def colores(dia: DiaPrecios, opciones: Opciones) -> list[str]:
    """Color de cada hora (DISENO §8.2)."""
    referencia = opciones.referencias.get(dia.dia) or []
    if dia.valle and opciones.color_valle == "laborables" and referencia:
        p25, p50, p75 = _cuartiles([p for d in referencia for p in d.precios])
        return [
            COLORES[0] if p < p25 else COLORES[1] if p < p50 else COLORES[2] if p < p75 else COLORES[3]
            for p in dia.precios
        ]
    minimo, maximo = min(dia.precios), max(dia.precios)
    rango = maximo - minimo
    return [COLORES[min(3, int((p - minimo) / rango * 4)) if rango else 0] for p in dia.precios]


def _cuadrados(precio: Decimal, maximo: Decimal) -> int:
    """`[1, (v / hi * 10) | round(0) | int] | max`: puede pasar de 10 si la escala es otra."""
    if maximo <= 0:
        return 1
    return max(1, int((precio / maximo * 10).quantize(Decimal(1), rounding=ROUND_HALF_EVEN)))


def mejores_franjas(dia: DiaPrecios, desde: int, n: int, duracion: int) -> list[tuple[int, Decimal]]:
    """Las `n` franjas de `duracion` horas más baratas desde la posición `desde`, sin solaparse.

    Como el script: ordena todas las franjas por precio medio y va cogiendo las que no se
    solapan con las ya elegidas. Devuelve (posición inicial, precio medio).
    """
    candidatas = sorted(
        (_media(dia.precios[i : i + duracion]), i) for i in range(desde, len(dia.precios) - duracion + 1)
    )
    elegidas: list[tuple[int, Decimal]] = []
    for media, i in candidatas:
        if len(elegidas) >= n:
            break
        if all(not (i - duracion < j < i + duracion) for j, _ in elegidas):
            elegidas.append((i, media))
    return elegidas


def _con_periodo(dia: DiaPrecios, opciones: Opciones) -> bool:
    return opciones.mostrar_periodo and not dia.valle and len(dia.periodos) == len(dia.precios)


def _fila(
    dia: DiaPrecios, i: int, color: str, escala: Decimal, t: dict, opciones: Opciones, marcas: str = ""
) -> str:
    hora = dia.horas[i]
    barra = color * _cuadrados(dia.precios[i], escala)
    periodo = f" {t['periodos'].get(dia.periodos[i] or '', '·')}" if _con_periodo(dia, opciones) else ""
    return f"{RELOJES[hora % 12]}{hora:02d}{periodo} {barra} {_num(dia.precios[i], 3, t['decimal'])}{marcas}"


def _marcas_extremos(dia: DiaPrecios, i: int, t: dict[str, str]) -> str:
    if dia.precios[i] == min(dia.precios):
        return t["barata"]
    if dia.precios[i] == max(dia.precios):
        return t["cara"]
    return ""


def _franjas(dia: DiaPrecios, desde: int, n: int, duracion: int, cabecera: str, sep: str) -> str:
    franjas = mejores_franjas(dia, desde, n, duracion)
    if not franjas:
        return ""
    lineas = [cabecera.format(horas=duracion)]
    for k, (i, media) in enumerate(franjas):
        inicio = dia.horas[i]
        lineas.append(f"{MEDALLAS[k]} {inicio:02d}–{inicio + duracion:02d} h · {_num(media, 3, sep)}")
    return "\n".join(lineas)


def _bloque(filas: list[str], opciones: Opciones) -> str:
    cuerpo = "".join(f"{f}\n" for f in filas)
    return f"```\n{cuerpo}```\n" if opciones.markdown else cuerpo


def _valido(dia: DiaPrecios | None) -> bool:
    return dia is not None and len(dia.precios) >= 23 and max(dia.precios) > 0


def texto_hoy(hoy: DiaPrecios | None, ahora: int, opciones: Opciones) -> Mensaje:
    """Mensaje de la mañana: las horas de hoy y las mejores franjas que quedan."""
    t = TEXTOS[opciones.idioma]
    sep = t["decimal"]
    if not _valido(hoy):
        return Mensaje(t["titulo_hoy"], t["sin_datos"])
    color = colores(hoy, opciones)
    maximo = max(hoy.precios)
    filas = [
        _fila(
            hoy,
            i,
            color[i],
            maximo,
            t,
            opciones,
            _marcas_extremos(hoy, i, t) + (t["ahora"] if i == ahora else ""),
        )
        for i in range(len(hoy.precios))
    ]
    texto = _bloque(filas, opciones)
    if _con_periodo(hoy, opciones):
        texto += t["leyenda"] + "\n"
    texto += _franjas(hoy, ahora, opciones.franjas_hoy, opciones.duracion, t["franjas"], sep)
    return Mensaje(t["titulo_hoy"], texto.rstrip("\n"))


def texto_manana(
    hoy: DiaPrecios | None,
    manana: DiaPrecios | None,
    ahora: int,
    opciones: Opciones,
    consumo: tuple[Decimal, Decimal] | None = None,
    factura: tuple[Decimal, Decimal] | None = None,
) -> Mensaje | None:
    """Mensaje de la noche. None si mañana aún no tiene precios (para reintentar)."""
    t = TEXTOS[opciones.idioma]
    sep = t["decimal"]
    if not _valido(manana):
        return None
    maximo = max(manana.precios)
    comparar = _valido(hoy)
    filas = []
    if comparar:
        color_hoy = colores(hoy, opciones)
        filas += [_fila(hoy, i, color_hoy[i], maximo, t, opciones) for i in range(ahora, len(hoy.precios))]
        filas.append(t["separador"])
    color = colores(manana, opciones)
    hoy_por_hora = dict(zip(hoy.horas, hoy.precios, strict=True)) if comparar else {}
    for i, precio in enumerate(manana.precios):
        marcas = ""
        anterior = hoy_por_hora.get(manana.horas[i])
        if anterior is not None:
            diferencia = precio - anterior
            marcas = " 🔺" if diferencia > UMBRAL_FLECHA else " 🔻" if diferencia < -UMBRAL_FLECHA else " 🟰"
        filas.append(_fila(manana, i, color[i], maximo, t, opciones, marcas + _marcas_extremos(manana, i, t)))
    texto = _bloque(filas, opciones)
    if _con_periodo(manana, opciones) or (comparar and _con_periodo(hoy, opciones)):
        texto += t["leyenda"] + "\n"
    if comparar:
        media_hoy, media_manana = _media(hoy.precios), _media(manana.precios)
        cambio = f"{float((media_manana - media_hoy) / media_hoy * 100):+.0f}" if media_hoy else "+0"
        medias = {"hoy": _num(media_hoy, 3, sep), "manana": _num(media_manana, 3, sep)}
        texto += t["media"].format(cambio=cambio, **medias)
    texto += "\n"
    if consumo is not None:
        texto += (
            t["consumo"].format(
                negrita="*" if opciones.markdown else "",
                kwh=_num(consumo[0], 1, sep),
                eur=_num(consumo[1], 2, sep),
            )
            + "\n"
        )
    if factura is not None:
        texto += (
            t["factura"].format(acumulado=_num(factura[0], 2, sep), prevision=_num(factura[1], 2, sep)) + "\n"
        )
    texto += _franjas(manana, 0, opciones.franjas_manana, opciones.duracion, t["franjas_manana"], sep)
    return Mensaje(t["titulo_manana"], texto.rstrip("\n"))
