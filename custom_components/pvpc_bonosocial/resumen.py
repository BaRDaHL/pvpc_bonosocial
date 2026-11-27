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
en los laborables cada hora lleva la letra de su periodo tras la hora (P punta, L llano, V valle;
las bolitas de colores confundían con los colores del precio).
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import ROUND_HALF_EVEN, Decimal

COLORES = ("🟩", "🟨", "🟧", "🟥")
BOLITAS = ("🟢", "🟡", "🟠", "🔴")  # el mismo color, junto al precio
# Formatos de la tabla (opción del resumen):
# - barras: barra de cuadrados del color del precio y el precio detrás (el del script original);
# - precio_delante: el precio alineado delante y la barra de color detrás;
# - color_precio: bolita del color y precio alineados delante, barra fina neutra detrás;
# - barra_fija: barra neutra de ancho fijo (█ y ░) y la bolita y el precio alineados detrás;
# - dos_columnas: bolita y precio, de 00 a 11 h a la izquierda y de 12 a 23 h a la derecha.
FORMATOS_TABLA = ("barras", "precio_delante", "color_precio", "barra_fija", "dos_columnas")
RELOJES = ("🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚")
MEDALLAS = ("🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣")
UMBRAL_FLECHA = Decimal("0.005")  # €/kWh: por debajo, 🟰

TEXTOS = {
    "es": {
        "titulo_hoy": "⚡ Precios de la luz hoy (€/kWh)",
        "titulo_manana": "🌙 Precios de la luz mañana vs hoy (€/kWh)",
        "barata": " ⬅️ 🤑 barata",
        "cara": " ⬅️ 💸 cara",
        "ahora": " 👈 ahora",
        "separador": "──── mañana ────",
        "franjas": "🧺 Mejores franjas de {horas}h:",
        "franjas_manana": "🧺 Mejores franjas de {horas}h mañana:",
        "media": "Media: hoy {hoy} → mañana {manana} ({cambio} %)",
        "consumo": "⚡ Consumido hasta ahora: {negrita}{kwh} kWh · {eur} €{negrita}",
        "factura": "🧾 Factura en curso: {acumulado} € (previsión {prevision} €)",
        "consumo_estimado": (
            "⚡ Consumido hasta ahora: {negrita}≈{kwh} kWh{negrita} (estimado; datos hasta {hasta})"
        ),
        "consumo_sin_datos": "⚡ Consumo de hoy: sin datos todavía (datos hasta {hasta})",
        "consumo_recibido": "⚡ Consumido hasta {hasta}: {negrita}{kwh} kWh{negrita}",
        "factura_provisional": "🧾 Factura en curso: ≈{acumulado} € provisional (previsión {prevision} €)",
        "sin_datos": "Sin datos de precios todavía.",
        "periodos": {"P1": "P", "P2": "L", "P3": "V"},
        "decimal": ",",
        "dia_hora": "%d/%m %H:%M",  # strftime: «datos hasta» de otro día (eu: mes/día)
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
        "consumo_estimado": "⚡ Used so far: {negrita}≈{kwh} kWh{negrita} (estimated; data until {hasta})",
        "consumo_sin_datos": "⚡ Used today: no data yet (data until {hasta})",
        "consumo_recibido": "⚡ Used until {hasta}: {negrita}{kwh} kWh{negrita}",
        "factura_provisional": "🧾 Current bill: ≈{acumulado} € provisional (forecast {prevision} €)",
        "sin_datos": "No price data yet.",
        "periodos": {"P1": "P", "P2": "S", "P3": "O"},
        "decimal": ".",
        "dia_hora": "%Y-%m-%d %H:%M",
    },
    "ca": {
        "titulo_hoy": "⚡ Preus de la llum avui (€/kWh)",
        "titulo_manana": "🌙 Preus de la llum demà vs. avui (€/kWh)",
        "barata": " ⬅️ 🤑 barata",
        "cara": " ⬅️ 💸 cara",
        "ahora": " 👈 ara",
        "separador": "──── demà ────",
        "franjas": "🧺 Millors franges de {horas} h:",
        "franjas_manana": "🧺 Millors franges de {horas} h demà:",
        "media": "Mitjana: avui {hoy} → demà {manana} ({cambio} %)",
        "consumo": "⚡ Consumit fins ara: {negrita}{kwh} kWh · {eur} €{negrita}",
        "factura": "🧾 Factura en curs: {acumulado} € (previsió {prevision} €)",
        "consumo_estimado": (
            "⚡ Consumit fins ara: {negrita}≈{kwh} kWh{negrita} (estimat; dades fins a {hasta})"
        ),
        "consumo_sin_datos": "⚡ Consum d'avui: encara sense dades (dades fins a {hasta})",
        "consumo_recibido": "⚡ Consumit fins a {hasta}: {negrita}{kwh} kWh{negrita}",
        "factura_provisional": "🧾 Factura en curs: ≈{acumulado} € provisional (previsió {prevision} €)",
        "sin_datos": "Encara no hi ha dades de preus.",
        # Punta, pla i vall: la «P» ya es la punta; el llano («pla») lleva dos letras (se alinean).
        "periodos": {"P1": "P", "P2": "Pl", "P3": "V"},
        "decimal": ",",
        "dia_hora": "%d/%m %H:%M",
    },
    "gl": {
        "titulo_hoy": "⚡ Prezos da luz hoxe (€/kWh)",
        "titulo_manana": "🌙 Prezos da luz mañá vs. hoxe (€/kWh)",
        "barata": " ⬅️ 🤑 barata",
        "cara": " ⬅️ 💸 cara",
        "ahora": " 👈 agora",
        "separador": "──── mañá ────",
        "franjas": "🧺 Mellores franxas de {horas} h:",
        "franjas_manana": "🧺 Mellores franxas de {horas} h mañá:",
        "media": "Media: hoxe {hoy} → mañá {manana} ({cambio} %)",
        "consumo": "⚡ Consumido ata agora: {negrita}{kwh} kWh · {eur} €{negrita}",
        "factura": "🧾 Factura en curso: {acumulado} € (previsión {prevision} €)",
        "consumo_estimado": (
            "⚡ Consumido ata agora: {negrita}≈{kwh} kWh{negrita} (estimado; datos ata {hasta})"
        ),
        "consumo_sin_datos": "⚡ Consumo de hoxe: aínda sen datos (datos ata {hasta})",
        "consumo_recibido": "⚡ Consumido ata {hasta}: {negrita}{kwh} kWh{negrita}",
        "factura_provisional": "🧾 Factura en curso: ≈{acumulado} € provisional (previsión {prevision} €)",
        "sin_datos": "Aínda non hai datos de prezos.",
        "periodos": {"P1": "P", "P2": "C", "P3": "V"},
        "decimal": ",",
        "dia_hora": "%d/%m %H:%M",
    },
    "eu": {
        "titulo_hoy": "⚡ Argindarraren prezioak gaur (€/kWh)",
        "titulo_manana": "🌙 Argindarraren prezioak bihar, gaurkoekin alderatuta (€/kWh)",
        "barata": " ⬅️ 🤑 merkea",
        "cara": " ⬅️ 💸 garestia",
        "ahora": " 👈 orain",
        "separador": "──── bihar ────",
        "franjas": "🧺 {horas} orduko tarte onenak:",
        "franjas_manana": "🧺 Biharko {horas} orduko tarte onenak:",
        "media": "Batez bestekoa: gaur {hoy} → bihar {manana} (% {cambio})",
        "consumo": "⚡ Orain arte kontsumitua: {negrita}{kwh} kWh · {eur} €{negrita}",
        "factura": "🧾 Aldi honetako faktura: {acumulado} € (aurreikuspena: {prevision} €)",
        "consumo_estimado": (
            "⚡ Orain arte kontsumitua: {negrita}≈{kwh} kWh{negrita} (zenbatetsia; datuak {hasta} arte)"
        ),
        "consumo_sin_datos": "⚡ Gaurko kontsumoa: oraindik daturik ez (datuak {hasta} arte)",
        "consumo_recibido": "⚡ {hasta} arte kontsumitua: {negrita}{kwh} kWh{negrita}",
        "factura_provisional": (
            "🧾 Aldi honetako faktura: ≈{acumulado} € behin-behinean (aurreikuspena: {prevision} €)"
        ),
        "sin_datos": "Oraindik ez dago prezioen daturik.",
        "periodos": {"P1": "P", "P2": "L", "P3": "H"},
        "decimal": ",",
        "dia_hora": "%m/%d %H:%M",
    },
}


@dataclass(frozen=True)
class ConsumoProvisional:
    """Consumo de hoy cuando la fuente aún no ha publicado todas las horas (Datadis va con días de
    retraso): en vez de «0 kWh», lo estimado (`kwh`) o solo lo recibido (`estimado` falso)."""

    kwh: Decimal  # estimado (medido + pendiente) o, con «solo lo recibido», lo medido
    hasta: datetime  # fin (hora local) de la última hora con dato
    estimado: bool


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
    formato: str = "barras"  # uno de FORMATOS_TABLA
    resto_hoy: bool = True  # por la noche, las horas que quedan de hoy antes de las de mañana
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
    dia: DiaPrecios,
    i: int,
    color: str,
    escala: Decimal,
    t: dict,
    opciones: Opciones,
    marcas: str = "",
    flecha: str = "",
) -> str:
    hora = dia.horas[i]
    n = _cuadrados(dia.precios[i], escala)
    letras = t["periodos"]
    ancho = max(len(x) for x in letras.values())  # todas las filas igual de anchas (el «Pl» catalán)
    periodo = f" {letras.get(dia.periodos[i] or '', '·').ljust(ancho)}" if _con_periodo(dia, opciones) else ""
    cabeza = f"{RELOJES[hora % 12]}{hora:02d}{periodo}"
    precio = _num(dia.precios[i], 3, t["decimal"]) + flecha  # la flecha, pegada al precio
    bolita = BOLITAS[COLORES.index(color)]
    if opciones.formato == "precio_delante":
        return f"{cabeza} {precio} {color * n}{marcas}"
    if opciones.formato == "color_precio":
        return f"{cabeza} {bolita} {precio} {'█' * n}{marcas}"
    if opciones.formato == "barra_fija":
        n = min(n, 10)
        return f"{cabeza} {'█' * n}{'░' * (10 - n)} {bolita} {precio}{marcas}"
    if opciones.formato == "dos_columnas":
        return f"{cabeza} {bolita} {precio}{marcas}"
    return f"{cabeza} {color * n} {precio}{marcas}"


def _marca_corta(dia: DiaPrecios, i: int, ahora: int | None = None) -> str:
    """En dos columnas no cabe el texto: solo 🤑 (la más barata), 💸 (la más cara) o 👈 (ahora)."""
    if i == ahora:
        return " 👈"
    if dia.precios[i] == min(dia.precios):
        return " 🤑"
    if dia.precios[i] == max(dia.precios):
        return " 💸"
    return ""


def _dos_columnas(filas: list[str]) -> list[str]:
    """Las 24 filas en 12: de 00 a 11 h a la izquierda y de 12 a 23 h a la derecha."""
    mitad = (len(filas) + 1) // 2
    izquierda, derecha = filas[:mitad], filas[mitad:]
    return [f"{a} │ {derecha[k]}" if k < len(derecha) else a for k, a in enumerate(izquierda)]


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
    # El bloque se cierra pegado a la última fila: con un salto de línea antes del cierre,
    # Telegram deja un hueco entre la tabla y lo que va debajo.
    if opciones.markdown:
        return "```\n" + "\n".join(filas) + "```\n"
    return "".join(f"{f}\n" for f in filas)


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
    if opciones.formato == "dos_columnas":
        filas = _dos_columnas(
            [
                _fila(hoy, i, color[i], maximo, t, opciones, _marca_corta(hoy, i, ahora))
                for i in range(len(hoy.precios))
            ]
        )
    else:
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
    bloques = [
        _franjas(hoy, ahora, opciones.franjas_hoy, opciones.duracion, t["franjas"], sep),
    ]
    return Mensaje(t["titulo_hoy"], _juntar(_bloque(filas, opciones), bloques))


def texto_manana(
    hoy: DiaPrecios | None,
    manana: DiaPrecios | None,
    ahora: int,
    opciones: Opciones,
    consumo: tuple[Decimal, Decimal] | ConsumoProvisional | None = None,
    factura: tuple[Decimal, Decimal] | tuple[Decimal, Decimal, bool] | None = None,
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
        if opciones.resto_hoy:
            filas += [
                _fila(hoy, i, color_hoy[i], maximo, t, opciones) for i in range(ahora, len(hoy.precios))
            ]
            filas.append(t["separador"])
    color = colores(manana, opciones)
    hoy_por_hora = dict(zip(hoy.horas, hoy.precios, strict=True)) if comparar else {}

    def flecha(i: int) -> str:
        """🔺/🔻/🟰 frente a la misma hora de hoy; siempre justo a la derecha del precio."""
        anterior = hoy_por_hora.get(manana.horas[i])
        if anterior is None:
            return ""
        diferencia = manana.precios[i] - anterior
        return " 🔺" if diferencia > UMBRAL_FLECHA else " 🔻" if diferencia < -UMBRAL_FLECHA else " 🟰"

    if opciones.formato == "dos_columnas":
        filas += _dos_columnas(
            [
                _fila(manana, i, color[i], maximo, t, opciones, _marca_corta(manana, i), flecha(i))
                for i in range(len(manana.precios))
            ]
        )
    else:
        filas += [
            _fila(manana, i, color[i], maximo, t, opciones, _marcas_extremos(manana, i, t), flecha(i))
            for i in range(len(manana.precios))
        ]
    # Debajo del bloque, en grupos separados por una línea en blanco: la media; el consumo y la
    # factura; las mejores franjas. Sin leyenda de los periodos: las letras se entienden solas.
    precios = []
    if comparar:
        media_hoy, media_manana = _media(hoy.precios), _media(manana.precios)
        cambio = f"{float((media_manana - media_hoy) / media_hoy * 100):+.0f}" if media_hoy else "+0"
        medias = {"hoy": _num(media_hoy, 3, sep), "manana": _num(media_manana, 3, sep)}
        precios.append(t["media"].format(cambio=cambio, **medias))
    gasto = []
    negrita = "*" if opciones.markdown else ""
    if isinstance(consumo, ConsumoProvisional):
        hoy_local = consumo.hasta.date() if hoy is None else hoy.dia
        hasta = (
            f"{consumo.hasta:%H:%M}"
            if consumo.hasta.date() == hoy_local
            else consumo.hasta.strftime(t["dia_hora"])
        )
        if consumo.estimado:
            clave = "consumo_estimado"
        elif consumo.hasta.date() == hoy_local and consumo.hasta.hour:
            clave = "consumo_recibido"
        else:
            clave = "consumo_sin_datos"
        gasto.append(t[clave].format(negrita=negrita, kwh=_num(consumo.kwh, 1, sep), hasta=hasta))
    elif consumo is not None:
        gasto.append(
            t["consumo"].format(negrita=negrita, kwh=_num(consumo[0], 1, sep), eur=_num(consumo[1], 2, sep))
        )
    if factura is not None:
        clave = "factura_provisional" if len(factura) > 2 and factura[2] else "factura"
        gasto.append(t[clave].format(acumulado=_num(factura[0], 2, sep), prevision=_num(factura[1], 2, sep)))
    bloques = [
        "\n".join(precios),
        "\n".join(gasto),
        _franjas(manana, 0, opciones.franjas_manana, opciones.duracion, t["franjas_manana"], sep),
    ]
    return Mensaje(t["titulo_manana"], _juntar(_bloque(filas, opciones), bloques))


def _juntar(tabla: str, bloques: list[str]) -> str:
    """La tabla y, debajo, los bloques que no estén vacíos separados por una línea en blanco."""
    return (tabla + "\n\n".join(b for b in bloques if b)).rstrip("\n")
