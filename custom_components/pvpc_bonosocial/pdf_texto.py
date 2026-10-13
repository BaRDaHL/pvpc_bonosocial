"""Texto de un PDF sin dependencias (solo la biblioteca estándar), para leer facturas.

Cubre lo que usan las facturas de la Comercializadora Regulada (Naturgy): objetos sin
compresión de objetos, flujos FlateDecode, fuentes Type0 con tabla ToUnicode y fuentes
simples (Type1/TrueType/Type3) con codificación WinAnsi y /Differences con nombres de
glifo estándar. Devuelve el texto por líneas en el orden del contenido, con los bloques
de formularios (XObject Form) en su sitio. No pretende ser un lector general de PDF.
"""

from __future__ import annotations

import re
import zlib
from typing import Any

# --- analizador mínimo de objetos PDF --------------------------------------------------

_DELIM = b"()<>[]{}/%"
_MAX_FLUJO = 20 * 1024 * 1024  # bytes descomprimidos por flujo: una factura no llega a 1 MB
_ESPACIO = b" \t\r\n\x0c\x00"


class Nombre(str):
    """Un nombre PDF (/Font)."""


class Ref(tuple):
    """Referencia indirecta (n 0 R)."""


class _Lector:
    def __init__(self, datos: bytes) -> None:
        self.d = datos
        self.i = 0

    def _saltar(self) -> None:
        d = self.d
        while self.i < len(d):
            c = d[self.i : self.i + 1]
            if c in (b" ", b"\t", b"\r", b"\n", b"\x0c", b"\x00"):
                self.i += 1
            elif c == b"%":
                while self.i < len(d) and d[self.i : self.i + 1] not in (b"\r", b"\n"):
                    self.i += 1
            else:
                return

    def objeto(self) -> Any:
        self._saltar()
        d = self.d
        c = d[self.i : self.i + 1]
        if c == b"<" and d[self.i + 1 : self.i + 2] == b"<":
            self.i += 2
            out: dict = {}
            while True:
                self._saltar()
                if d[self.i : self.i + 2] == b">>":
                    self.i += 2
                    return out
                clave = self.objeto()
                out[str(clave)] = self.objeto()
        if c == b"[":
            self.i += 1
            lista = []
            while True:
                self._saltar()
                if d[self.i : self.i + 1] == b"]":
                    self.i += 1
                    return lista
                lista.append(self.objeto())
        if c == b"/":
            j = self.i + 1
            while j < len(d) and d[j : j + 1] not in _ESPACIO and d[j : j + 1] not in _DELIM:
                j += 1
            nombre = re.sub(rb"#([0-9A-Fa-f]{2})", lambda m: bytes([int(m.group(1), 16)]), d[self.i + 1 : j])
            self.i = j
            return Nombre(nombre.decode("latin-1"))
        if c == b"(":
            return self._literal()
        if c == b"<":
            j = d.index(b">", self.i)
            hexa = re.sub(rb"\s", b"", d[self.i + 1 : j])
            self.i = j + 1
            return bytes.fromhex((hexa + b"0" * (len(hexa) % 2)).decode())
        j = self.i
        while j < len(d) and d[j : j + 1] not in _ESPACIO and d[j : j + 1] not in _DELIM:
            j += 1
        palabra = d[self.i : j]
        self.i = j
        if re.fullmatch(rb"[+-]?\d+", palabra):
            # ¿«n g R»?
            m = re.match(rb"\s+(\d+)\s+R(?![\w])", d[self.i : self.i + 20])
            if m:
                self.i += m.end()
                return Ref((int(palabra), int(m.group(1))))
            return int(palabra)
        try:
            return float(palabra)
        except ValueError:
            return palabra.decode("latin-1")

    def _literal(self) -> bytes:
        d = self.d
        self.i += 1
        nivel, out = 1, bytearray()
        while self.i < len(d):
            c = d[self.i]
            if c == 0x5C:  # \
                n = d[self.i + 1]
                escapes = {0x6E: 10, 0x72: 13, 0x74: 9, 0x62: 8, 0x66: 12}
                if n in escapes:
                    out.append(escapes[n])
                    self.i += 2
                elif 0x30 <= n <= 0x37:
                    m = re.match(rb"[0-7]{1,3}", d[self.i + 1 : self.i + 4])
                    out.append(int(m.group(0), 8) & 0xFF)
                    self.i += 1 + len(m.group(0))
                elif n in (0x0D, 0x0A):
                    self.i += 3 if d[self.i + 1 : self.i + 3] == b"\r\n" else 2
                else:
                    out.append(n)
                    self.i += 2
                continue
            if c == 0x28:
                nivel += 1
            elif c == 0x29:
                nivel -= 1
                if nivel == 0:
                    self.i += 1
                    return bytes(out)
            out.append(c)
            self.i += 1
        return bytes(out)


class Documento:
    def __init__(self, datos: bytes) -> None:
        self.datos = datos
        self._objetos: dict[int, tuple[Any, bytes | None]] = {}
        for m in re.finditer(rb"(\d+)\s+(\d+)\s+obj\b", datos):
            n = int(m.group(1))
            lector = _Lector(datos)
            lector.i = m.end()
            try:
                valor = lector.objeto()
            except (ValueError, IndexError):
                continue
            flujo = None
            resto = datos[lector.i : lector.i + 20]
            s = re.match(rb"\s*stream\r?\n", resto)
            if s and isinstance(valor, dict):
                inicio = lector.i + s.end()
                largo = self.resolver(valor.get("Length"))
                if isinstance(largo, int) and datos[inicio + largo : inicio + largo + 30].lstrip().startswith(
                    b"endstream"
                ):
                    flujo = datos[inicio : inicio + largo]
                else:
                    fin = datos.index(b"endstream", inicio)
                    flujo = datos[inicio:fin].rstrip(b"\r\n")
            self._objetos[n] = (valor, flujo)

    def resolver(self, x: Any) -> Any:
        for _ in range(10):
            if not isinstance(x, Ref):
                return x
            x = self._objetos.get(x[0], (None, None))[0]
        return x

    def flujo(self, x: Any) -> bytes:
        n = x[0] if isinstance(x, Ref) else None
        if n is None or n not in self._objetos:
            return b""
        valor, crudo = self._objetos[n]
        if crudo is None:
            return b""
        filtro = self.resolver(valor.get("Filter"))
        filtros = filtro if isinstance(filtro, list) else [filtro] if filtro else []
        datos = crudo
        for f in filtros:
            if f == "FlateDecode":
                try:
                    datos = zlib.decompressobj().decompress(datos, _MAX_FLUJO)
                except zlib.error:
                    return b""
            else:
                return b""  # imágenes u otros filtros: no tienen texto
        return datos

    def paginas(self) -> list[dict]:
        raiz = next(
            (v for v, _ in self._objetos.values() if isinstance(v, dict) and v.get("Type") == "Catalog"), None
        )
        out: list[dict] = []

        def recorrer(nodo: Any, heredado: dict) -> None:
            nodo = self.resolver(nodo)
            if not isinstance(nodo, dict):
                return
            recursos = nodo.get("Resources", heredado.get("Resources"))
            if nodo.get("Type") == "Pages":
                for hijo in self.resolver(nodo.get("Kids")) or []:
                    recorrer(hijo, {"Resources": recursos})
            else:
                out.append({**nodo, "Resources": recursos})

        if raiz:
            recorrer(raiz.get("Pages"), {})
        return out


# --- fuentes ---------------------------------------------------------------------------

# Nombres de glifo estándar que aparecen en facturas (Adobe Glyph List, parte).
_GLIFOS = {
    "space": " ",
    "exclam": "!",
    "quotedbl": '"',
    "numbersign": "#",
    "dollar": "$",
    "percent": "%",
    "ampersand": "&",
    "quotesingle": "'",
    "quoteright": "’",
    "parenleft": "(",
    "parenright": ")",
    "asterisk": "*",
    "plus": "+",
    "comma": ",",
    "hyphen": "-",
    "period": ".",
    "slash": "/",
    "zero": "0",
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
    "colon": ":",
    "semicolon": ";",
    "less": "<",
    "equal": "=",
    "greater": ">",
    "question": "?",
    "at": "@",
    "bracketleft": "[",
    "backslash": "\\",
    "bracketright": "]",
    "underscore": "_",
    "bar": "|",
    "endash": "–",
    "emdash": "—",
    "bullet": "•",
    "Euro": "€",
    "euro": "€",
    "degree": "°",
    "ordfeminine": "ª",
    "ordmasculine": "º",
    "aacute": "á",
    "eacute": "é",
    "iacute": "í",
    "oacute": "ó",
    "uacute": "ú",
    "udieresis": "ü",
    "ntilde": "ñ",
    "Aacute": "Á",
    "Eacute": "É",
    "Iacute": "Í",
    "Oacute": "Ó",
    "Uacute": "Ú",
    "Ntilde": "Ñ",
    "ccedilla": "ç",
    "Ccedilla": "Ç",
    "agrave": "à",
    "egrave": "è",
    "questiondown": "¿",
    "exclamdown": "¡",
    "guillemotleft": "«",
    "guillemotright": "»",
    "uni00A0": " ",
    "nbspace": " ",
    "periodcentered": "·",
    "multiply": "×",
    "copyright": "©",
    "registered": "®",
}


def _glifo(nombre: str) -> str:
    if nombre in _GLIFOS:
        return _GLIFOS[nombre]
    if len(nombre) == 1:
        return nombre
    m = re.fullmatch(r"uni([0-9A-Fa-f]{4})", nombre)
    if m:
        return chr(int(m.group(1), 16))
    return ""


def _cmap(texto: bytes) -> tuple[dict[int, str], int]:
    tabla: dict[int, str] = {}
    ancho = 1
    for m in re.finditer(rb"begincodespacerange(.*?)endcodespacerange", texto, re.S):
        h = re.search(rb"<([0-9A-Fa-f]+)>", m.group(1))
        if h:
            ancho = max(ancho, len(h.group(1)) // 2)
    for bloque in re.findall(rb"beginbfchar(.*?)endbfchar", texto, re.S):
        for a, u in re.findall(rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>", bloque):
            tabla[int(a, 16)] = bytes.fromhex(u.decode()).decode("utf-16-be", "replace")
    for bloque in re.findall(rb"beginbfrange(.*?)endbfrange", texto, re.S):
        for a, z, resto in re.findall(
            rb"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[0-9A-Fa-f]+>|\[[^\]]*\])", bloque
        ):
            ini, fin = int(a, 16), int(z, 16)
            if resto.startswith(b"["):
                for k, u in enumerate(re.findall(rb"<([0-9A-Fa-f]+)>", resto)):
                    tabla[ini + k] = bytes.fromhex(u.decode()).decode("utf-16-be", "replace")
            else:
                base = bytes.fromhex(resto[1:-1].decode()).decode("utf-16-be", "replace")
                for k in range(fin - ini + 1):
                    tabla[ini + k] = base[:-1] + chr(ord(base[-1]) + k)
    return tabla, ancho


class _Fuente:
    def __init__(self, doc: Documento, dic: dict) -> None:
        self.ancho = 2 if dic.get("Subtype") == "Type0" else 1
        self.tabla: dict[int, str] | None = None
        if "ToUnicode" in dic:
            tabla, ancho = _cmap(doc.flujo(dic["ToUnicode"]))
            if tabla:
                self.tabla, self.ancho = tabla, ancho if dic.get("Subtype") == "Type0" else 1
        self.dif: dict[int, str] = {}
        self.base = "cp1252"
        cod = doc.resolver(dic.get("Encoding"))
        base = cod.get("BaseEncoding") if isinstance(cod, dict) else cod
        if base == "MacRomanEncoding":
            self.base = "mac_roman"
        if isinstance(cod, dict):
            codigo = 0
            for x in doc.resolver(cod.get("Differences")) or []:
                if isinstance(x, int):
                    codigo = x
                elif isinstance(x, Nombre):
                    self.dif[codigo] = _glifo(x)
                    codigo += 1

    def texto(self, raw: bytes) -> str:
        if self.ancho == 2:
            codigos = [int.from_bytes(raw[i : i + 2], "big") for i in range(0, len(raw) - 1, 2)]
            return "".join((self.tabla or {}).get(c, "") for c in codigos)
        out = []
        for c in raw:
            if self.tabla and c in self.tabla:
                out.append(self.tabla[c])
            elif c in self.dif:
                out.append(self.dif[c])
            else:
                out.append(bytes([c]).decode(self.base, "replace"))
        return "".join(out)


# --- contenido -----------------------------------------------------------------------

_TOKEN = re.compile(
    rb"\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>|\[|\]|/[^\s/\[\]()<>]+|[-+]?\d*\.?\d+|[A-Za-z'\"*]+|<<|>>"
)


def _contenido(doc: Documento, datos: bytes, recursos: Any, lineas: list[str], profundidad: int = 0) -> None:
    recursos = doc.resolver(recursos) or {}
    fuentes_dic = doc.resolver(recursos.get("Font")) or {}
    xobjetos = doc.resolver(recursos.get("XObject")) or {}
    cache: dict[str, _Fuente] = {}
    actual: _Fuente | None = None
    pila: list[Any] = []
    linea: list[str] = []
    ultimo_y: float | None = None

    def cortar() -> None:
        if linea and "".join(linea).strip():
            lineas.append("".join(linea).strip())
        linea.clear()

    i = 0
    while i < len(datos):
        m = _TOKEN.search(datos, i)
        if not m:
            break
        tok = m.group(0)
        i = m.end()
        if tok == b"BI":  # imagen en línea: saltar hasta EI
            fin = datos.find(b"EI", i)
            i = fin + 2 if fin >= 0 else len(datos)
            continue
        if tok[:1] == b"(":
            pila.append(_Lector(tok).objeto())
        elif tok[:1] == b"<" and tok[:2] != b"<<":
            pila.append(bytes.fromhex(re.sub(rb"\s", b"", tok[1:-1]).decode() or ""))
        elif tok == b"[":
            pila.append("[")
        elif tok == b"]":
            j = len(pila) - 1 - pila[::-1].index("[") if "[" in pila else 0
            lista = pila[j + 1 :]
            del pila[j:]
            pila.append(lista)
        elif tok[:1] == b"/":
            pila.append(Nombre(tok[1:].decode("latin-1")))
        elif re.fullmatch(rb"[-+]?\d*\.?\d+", tok):
            pila.append(float(tok))
        else:
            op = tok.decode("latin-1")
            if op == "Tf" and len(pila) >= 2:
                nombre = pila[-2]
                if nombre not in cache:
                    dic = doc.resolver(fuentes_dic.get(str(nombre)))
                    cache[nombre] = _Fuente(doc, dic) if isinstance(dic, dict) else None
                actual = cache[nombre]
            elif op in ("Tj", "'", '"') and pila and isinstance(pila[-1], bytes) and actual:
                if op != "Tj":
                    cortar()
                linea.append(actual.texto(pila[-1]))
            elif op == "TJ" and pila and isinstance(pila[-1], list) and actual:
                for x in pila[-1]:
                    if isinstance(x, bytes):
                        linea.append(actual.texto(x))
                    elif isinstance(x, float) and x < -200:
                        linea.append(" ")
            elif op in ("Td", "TD", "Tm") and len(pila) >= 2:
                y = pila[-1] if op == "Tm" else None
                if op == "Tm":
                    if ultimo_y is None or abs(y - ultimo_y) > 1:
                        cortar()
                    ultimo_y = y
                elif abs(pila[-1]) > 1:
                    cortar()
                else:
                    linea.append(" ")
            elif op in ("T*", "ET"):
                cortar()
            elif op == "Do" and pila and profundidad < 5:
                xo = xobjetos.get(str(pila[-1]))
                dic = doc.resolver(xo)
                if isinstance(dic, dict) and dic.get("Subtype") == "Form":
                    cortar()
                    _contenido(doc, doc.flujo(xo), dic.get("Resources", recursos), lineas, profundidad + 1)
            pila.clear()
    cortar()


def texto_pdf(datos: bytes) -> str:
    """Texto del PDF, una línea por renglón (aproximado), páginas en orden."""
    if not datos.startswith(b"%PDF"):
        raise ValueError("No es un PDF")
    doc = Documento(datos)
    lineas: list[str] = []
    for pagina in doc.paginas():
        contenidos = pagina.get("Contents")
        lista = doc.resolver(contenidos)
        partes = lista if isinstance(lista, list) else [contenidos]
        datos_pagina = b"\n".join(doc.flujo(p) for p in partes)
        _contenido(doc, datos_pagina, pagina.get("Resources"), lineas)
    return "\n".join(lineas)
