"""Días P3 (valle) todo el día por festivo, sin dependencias ni descargas.

Circular 3/2020 de la CNMC, art. 7: son P3 todas las horas de «los sábados, domingos, el
6 de enero y los días festivos de ámbito nacional, definidos como tales en el calendario
oficial del año correspondiente, con exclusión tanto de los festivos sustituibles como de
los que no tienen fecha fija».

Las fiestas nacionales no sustituibles (RD 2001/1983, art. 45) son todas de fecha fija,
así que el calendario se reduce a fechas fijas más el 6 de enero:

- No cuentan el Viernes Santo ni el Jueves Santo (sin fecha fija), ni los festivos
  autonómicos o locales, ni los lunes que sustituyen a un festivo caído en domingo.
- Si un día cae en fin de semana ya es P3 por ser sábado o domingo.

En los días con precio publicado manda además el peaje real de cada hora (TEU del
archivo 70 de ESIOS) y cualquier diferencia se avisa en Repairs (DISENO §3.3).
"""

from __future__ import annotations

from datetime import date

# (mes, día, nombre)
FESTIVOS_P3: tuple[tuple[int, int, str], ...] = (
    (1, 1, "Año Nuevo"),
    (1, 6, "Epifanía del Señor"),
    (5, 1, "Fiesta del Trabajo"),
    (8, 15, "Asunción de la Virgen"),
    (10, 12, "Fiesta Nacional de España"),
    (11, 1, "Todos los Santos"),
    (12, 6, "Día de la Constitución Española"),
    (12, 8, "Inmaculada Concepción"),
    (12, 25, "Natividad del Señor"),
)
_FECHAS = frozenset((mes, dia) for mes, dia, _ in FESTIVOS_P3)


def es_festivo_p3(dia: date) -> bool:
    """El día es festivo nacional de fecha fija (o 6 de enero), P3 todo el día."""
    return (dia.month, dia.day) in _FECHAS


def festivos_p3(anio: int) -> dict[date, str]:
    """Festivos P3 de un año, con su nombre."""
    return {date(anio, mes, dia): nombre for mes, dia, nombre in FESTIVOS_P3}
