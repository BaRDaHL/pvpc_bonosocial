"""Histórico mensual de comparativas de tarifas de un suministro (podio por mes).

Cada comparativa con éxito actualiza el mes en curso (fecha de Madrid):

- **podio**: las 3 ofertas más baratas del mes (importe del primer año). La primera comparativa
  del mes mete sus 3 mejores; las siguientes solo entran si mejoran alguna de las guardadas, y la
  peor sale. Una oferta que vuelve a salir (mismo id de la CNMC o, sin id, misma comercializadora
  y oferta) ocupa un solo puesto, con su mejor importe y el día de ese importe;
- **previsión**: la previsión más baja de la CNMC para el PVPC en el mes (con bono si la hay) y su día;
- **pagado**: lo pagado al año según la última comparativa del mes.

Con cada importe van los kWh anuales (P1, P2, P3 y total) de la comparativa que lo dio: así se ve
si una subida es del mercado o del consumo. El podio se ordena por importe, sin normalizar.

`termometro` sitúa la mejor oferta de hoy frente a la mejor de cada mes anterior guardado, en
€/kWh (importe / kWh totales de su comparativa). No predice nada: solo compara con lo ya visto.

Se guardan como mucho `MAX_MESES` meses (los que tienen comparativa): al pasar, sale el más antiguo.
Funciones puras sobre datos JSON: las usa el comparador, que las guarda en su Store.
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import date
from typing import Any

MAX_MESES = 18
PUESTOS = 3
# Lo que se guarda de cada oferta del podio (además de su importe y su día).
CAMPOS_OFERTA = (
    "id",
    "comercializadora",
    "oferta",
    "enlace",
    "permanencia",
    "revision",
    "solo_nuevos_clientes",
)


MIN_MESES_TERMOMETRO = 3
TERMOMETRO_MAS_BARATA = "mas_barata"
TERMOMETRO_MAS_CARA = "mas_cara"
TERMOMETRO_ENTRE = "entre"


def mes_de(dia: date) -> str:
    return f"{dia.year:04d}-{dia.month:02d}"


def _clave(o: Mapping[str, Any]) -> str:
    """La misma oferta en dos comparativas: por su id de la CNMC o, sin id, por sus nombres."""
    if o.get("id") not in (None, ""):
        return f"id:{o['id']}"
    return f"nombre:{str(o.get('comercializadora') or '').casefold()}|{str(o.get('oferta') or '').casefold()}"


def kwh_de(r: Mapping[str, Any]) -> dict[str, int] | None:
    """Los kWh anuales que se enviaron a la CNMC en la comparativa `r`, con su total."""
    k = r.get("kwh_anuales")
    if not k:
        return None
    periodos = {p: int(k.get(p) or 0) for p in ("P1", "P2", "P3")}
    return {**periodos, "total": sum(periodos.values())}


def _oferta(o: Mapping[str, Any], dia: date, kwh: dict[str, int] | None) -> dict[str, Any]:
    return {
        **{k: o.get(k) for k in CAMPOS_OFERTA},
        "importe_primer_anio": float(o["importe_primer_anio"]),
        "fecha": dia.isoformat(),
        "kwh": kwh,
    }


def _podio(
    guardadas: list[dict[str, Any]], nuevas: list[Mapping[str, Any]], dia: date, kwh: dict[str, int] | None
) -> list[dict[str, Any]]:
    """Las `PUESTOS` más baratas entre las guardadas y las nuevas, sin repetir oferta.

    A igual importe se queda la que ya estaba (orden estable): solo entra quien mejora."""
    por_clave: dict[str, dict[str, Any]] = {}
    candidatas = (_oferta(n, dia, kwh) for n in nuevas if n.get("importe_primer_anio") is not None)
    for o in [*guardadas, *candidatas]:
        k = _clave(o)
        if k not in por_clave or o["importe_primer_anio"] < por_clave[k]["importe_primer_anio"]:
            por_clave[k] = o
    return sorted(por_clave.values(), key=lambda o: o["importe_primer_anio"])[:PUESTOS]


def _prevision(r: Mapping[str, Any]) -> tuple[float | None, bool]:
    """La previsión de la CNMC del PVPC: con el bono si la hay; si no, sin bono."""
    if r.get("pvpc_cnmc_prevision_bono") is not None:
        return float(r["pvpc_cnmc_prevision_bono"]), True
    if r.get("pvpc_cnmc_prevision") is not None:
        return float(r["pvpc_cnmc_prevision"]), False
    return None, False


def actualizar(historico: Mapping[str, Any] | None, r: Mapping[str, Any], dia: date) -> dict[str, Any]:
    """El histórico con la comparativa `r` (la de `a_dict`, con sus enlaces) hecha el día `dia`."""
    meses = {k: dict(v) for k, v in (historico or {}).items()}
    mes = meses.get(mes_de(dia), {})
    prevision, con_bono = _prevision(r)
    kwh = kwh_de(r)
    nuevo = {
        "ofertas": _podio(list(mes.get("ofertas") or []), list(r.get("ofertas") or []), dia, kwh),
        "prevision": mes.get("prevision"),
        "prevision_bono": mes.get("prevision_bono"),
        "prevision_fecha": mes.get("prevision_fecha"),
        "prevision_kwh": mes.get("prevision_kwh"),
        "pagado_anual": r.get("pagado_anual"),
        "kwh": kwh,  # los de la última comparativa del mes (la de «pagado»)
        "ultima": dia.isoformat(),
        "comparativas": int(mes.get("comparativas") or 0) + 1,
    }
    if prevision is not None and (nuevo["prevision"] is None or prevision < nuevo["prevision"]):
        nuevo.update(
            prevision=prevision, prevision_bono=con_bono, prevision_fecha=dia.isoformat(), prevision_kwh=kwh
        )
    meses[mes_de(dia)] = nuevo
    for viejo in sorted(meses)[:-MAX_MESES]:
        del meses[viejo]
    return meses


def tiene_mes(historico: Mapping[str, Any] | None, dia: date) -> bool:
    return mes_de(dia) in (historico or {})


def para_atributo(historico: Mapping[str, Any] | None) -> list[dict[str, Any]]:
    """Los meses para el sensor (y la tarjeta): el más reciente primero."""
    return [{"mes": k, **v} for k, v in sorted((historico or {}).items(), reverse=True)]


def _eur_kwh(importe: float, kwh: Mapping[str, Any] | None) -> float | None:
    total = (kwh or {}).get("total")
    return importe / total if total else None


def termometro(historico: Mapping[str, Any] | None, r: Mapping[str, Any], dia: date) -> dict[str, Any] | None:
    """Dónde queda la mejor oferta de `r` (hecha el día `dia`) frente a la mejor de cada mes
    anterior guardado, en €/kWh; None con menos de `MIN_MESES_TERMOMETRO` meses que comparar.

    Iguales (a 4 decimales) cuentan como la más barata o la más cara: la misma oferta con más
    consumo no sale «más cara» si su €/kWh es el mismo."""
    ofertas = r.get("ofertas") or []
    hoy = _eur_kwh(float(ofertas[0]["importe_primer_anio"]), kwh_de(r)) if ofertas else None
    if hoy is None:
        return None
    actual = mes_de(dia)
    previos: list[tuple[str, float]] = []
    for mes, v in sorted((historico or {}).items(), reverse=True):  # del más reciente al más antiguo
        mejor = (v.get("ofertas") or [None])[0]
        x = _eur_kwh(mejor["importe_primer_anio"], mejor.get("kwh")) if mejor else None
        if mes < actual and x is not None:
            previos.append((mes, round(x, 4)))
    if len(previos) < MIN_MESES_TERMOMETRO:
        return None
    barata = min(previos, key=lambda p: p[1])  # a igualdad, el mes más reciente
    cara = max(previos, key=lambda p: p[1])
    x = round(hoy, 4)
    posicion = (
        TERMOMETRO_MAS_BARATA if x <= barata[1] else TERMOMETRO_MAS_CARA if x >= cara[1] else TERMOMETRO_ENTRE
    )
    return {
        "posicion": posicion,
        "meses": len(previos),
        "eur_kwh": x,
        "mas_barata": {"mes": barata[0], "eur_kwh": barata[1]},
        "mas_cara": {"mes": cara[0], "eur_kwh": cara[1]},
    }
