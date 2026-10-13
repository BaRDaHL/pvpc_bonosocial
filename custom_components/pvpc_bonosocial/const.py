"""Constantes de la integración (las de precios vienen de PVPC Next)."""

import voluptuous as vol

from .prices.aiopvpc.const import TARIFFS

DOMAIN = "pvpc_bonosocial"
# Versión de la entrada principal. La 1 es la de la v0.2 (se migra en migracion.py). No
# tiene nada que ver con las versiones 1-7 de PVPC Next, que viven en su propio dominio.
ENTRY_VERSION = 2
ENTRY_MINOR_VERSION = 1

# Subentradas «Suministro» (DISENO §2.1)
SUBENTRY_SUMINISTRO = "suministro"
# Subentradas «Datadis» (F7): usuario, contraseña y suministro de datadis.es
SUBENTRY_DATADIS = "datadis"
CONF_DATADIS_USUARIO = "usuario"
CONF_DATADIS_CLAVE = "clave"
CONF_DATADIS_SUMINISTRO = "suministro_datadis"  # {cups, distributorCode, pointType}
# Subentradas «Resumen por notificación» (DISENO §8): una por destino
SUBENTRY_RESUMEN = "resumen"
CONF_DESTINO = "destino"
CONF_SUMINISTRO = "suministro"
CONF_HOY_ACTIVO = "hoy_activo"
CONF_HOY_HORA = "hoy_hora"
CONF_MANANA_ACTIVO = "manana_activo"
CONF_MANANA_HORA = "manana_hora"
CONF_FRANJAS_HOY = "franjas_hoy"
CONF_FRANJAS_MANANA = "franjas_manana"
CONF_DURACION_FRANJA = "duracion_franja"
CONF_INCLUIR_CONSUMO = "incluir_consumo"
CONF_INCLUIR_FACTURA = "incluir_factura"
CONF_COLOR_VALLE = "color_valle"
CONF_MOSTRAR_PERIODO = "mostrar_periodo"
COLORES_VALLE = ("laborables", "dia")
CONF_POTENCIA_P1 = "potencia_p1_kw"
CONF_POTENCIA_P2 = "potencia_p2_kw"
CONF_BONO = "bono"
CONF_CATEGORIA = "categoria"
CONF_TIPO_FUENTE = "tipo_fuente"
CONF_FUENTE = "fuente"
CONF_FIN_ULTIMA_FACTURA = "fin_ultima_factura"
CONF_DIAS_EMISION = "dias_hasta_emision"
CONF_ALQUILER = "alquiler_contador_eur_mes"
# kWh con descuento no consumidos acumulados antes de la primera factura que conozca la integración
CONF_ARRASTRE_INICIAL = "arrastre_inicial_kwh"
CONF_CODIGO_POSTAL = "codigo_postal"  # solo para el comparador de tarifas (§8 bis)
CONF_COMPARAR_MENSUAL = "comparar_mensual"
# Envío de la comparativa de tarifas a una entidad `notify` (Telegram incluido), opcional.
CONF_COMPARADOR_DESTINO = "comparador_destino"
CONF_COMPARADOR_ENVIO = "comparador_envio"  # siempre | si_ahorra
CONF_COMPARADOR_UMBRAL = "comparador_umbral_eur"  # € al año de ahorro mínimo (con si_ahorra)
CONF_COMPARADOR_FORMATO = "comparador_formato"  # completo | breve
ENVIOS_COMPARADOR = ["siempre", "si_ahorra"]
FORMATOS_COMPARADOR = ["completo", "breve"]
# Segunda opinión de cada factura cerrada con el simulador de la CNMC (envía la curva horaria)
CONF_SEGUNDA_OPINION = "segunda_opinion_cnmc"
# Contratos anteriores del suministro (cambios a mitad de periodo, F7): lista de
# {"hasta": último día con ese contrato, potencias, bono y categoría}
CONF_CONTRATOS_ANTERIORES = "contratos_anteriores"
CAMPOS_CONTRATO = ("potencia_p1_kw", "potencia_p2_kw", "bono", "categoria")
# unique_id de entidades que vienen de otra versión y se conservan (clave → unique_id)
CONF_IDS_HEREDADOS = "ids_heredados"
# Comprobación con la memoria de un Shelly EM (opcional, solo con fuente «sensor»)
CONF_SHELLY_IP = "shelly_ip"
CONF_SHELLY_CANAL = "shelly_canal"
CONF_SHELLY_FRECUENCIA = "shelly_frecuencia"
FRECUENCIAS_SHELLY = ("diaria", "semanal", "desactivada")
FUENTE_SENSOR = "sensor"
FUENTE_ESTADISTICA = "estadistica"
TIPOS_FUENTE = (FUENTE_SENSOR, FUENTE_ESTADISTICA)
DEFAULT_DIAS_EMISION = 5
DEFAULT_ALQUILER = 0.81

# entity_id de las entidades de precio: sensor.pvpc_bs_<sufijo> (decisión del titular: nombres
# propios, cortos y en español; los de PVPC Next y la v0.2 se renombran al migrar). El
# sufijo es también la clave de traducción del nombre visible.
PREFIJO_ENTIDADES = "pvpc_bs_"
SUFIJOS_ENTIDADES: dict[str, str] = {
    "PVPC": "precio",
    "INJECTION": "precio_excedentes",
    "MAG": "ajuste_gas",
    "OMIE": "precio_omie",
    "INDEXED": "precio_indexado",
    "PVPC_REFERENCE": "precio_pvpc",
    "pvpc_data_id": "id_dato_pvpc",
    "pvpc_api_source": "fuente_api",
    "pvpc_price_mode": "modo_precio",
    "pvpc_tariff": "tarifa",
    "pvpc_period": "periodo",
    "pvpc_current_power_period": "periodo_potencia",
    "pvpc_next_power_period": "siguiente_periodo_potencia",
    "pvpc_next_power_period_in": "siguiente_periodo_potencia_en",
    "pvpc_available_power": "potencia_disponible",
    "pvpc_next_period": "siguiente_periodo",
    "pvpc_next_period_in": "siguiente_periodo_en",
    "pvpc_min_price": "precio_minimo",
    "pvpc_max_price": "precio_maximo",
    "pvpc_next_best_price": "siguiente_mejor_precio",
    "pvpc_next_price": "siguiente_precio",
    "pvpc_next_price_in": "siguiente_precio_en",
    "pvpc_next_price_level": "nivel_siguiente_precio",
    "pvpc_time_to_next_best": "siguiente_mejor_precio_en",
    "pvpc_num_better_prices_ahead": "precios_mejores",
    "pvpc_avg_price_today": "precio_medio",
    "pvpc_price_ratio_category": "nivel_precio",
    "pvpc_next_best_price_level": "nivel_siguiente_mejor_precio",
    "injection_price_data_id": "id_dato_excedentes",
    "mag_tax_data_id": "id_dato_ajuste_gas",
    "omie_price_data_id": "id_dato_omie",
}

ATTR_POWER_P1 = "power_p1"
ATTR_POWER_P3 = "power_p3"
ATTR_BETTER_PRICE_TARGET = "better_price_target"
ATTR_ENABLE_PRIVATE_API = "enable_private_api"
ATTR_PRICE_MODE = "price_mode"
ATTR_SHOW_REFERENCE_PRICE = "show_reference_price"
# Clave de PVPC Next (fuente de festivos) que se descarta al importar
ATTR_HOLIDAY_SOURCE = "holiday_source"
LEGACY_ATTR_ENABLE_INJECTION_PRICE = "enable_injection_price"
LEGACY_ATTR_POWER = "power"
LEGACY_ATTR_POWER_P2_P3 = "power_p2_p3"
LEGACY_ATTR_POWER_P3 = "power_p3"
ATTR_NEXT_PRICE_IN_UPDATE = "next_price_in_update"
ATTR_NEXT_BEST_IN_UPDATE = "next_best_in_update"
ATTR_NEXT_PERIOD_IN_UPDATE = "next_period_in_update"
ATTR_NEXT_POWER_PERIOD_IN_UPDATE = "next_power_period_in_update"
ATTR_TARIFF = "tariff"
DEFAULT_NAME = "PVPC Bono Social"
DEFAULT_TARIFF = TARIFFS[0]

DEFAULT_BETTER_PRICE_TARGET = "very_cheap"
DEFAULT_ENABLE_PRIVATE_API = False
DEFAULT_PRICE_MODE = "pvpc"
DEFAULT_SHOW_REFERENCE_PRICE = False
# PVPC Next guardaba «very cheap» (con espacio); se sigue aceptando al leer y se normaliza.
BETTER_PRICE_TARGETS = ("neutral", "cheap", "very_cheap")
PRICE_MODES = ("pvpc", "indexed")
UPDATE_FREQUENCY_OPTIONS = ("disabled", "hourly", "minute")
DEFAULT_UPDATE_FREQUENCY = "minute"
UPDATE_FREQUENCY_BY_SENSOR = {
    "pvpc_next_price_in": ATTR_NEXT_PRICE_IN_UPDATE,
    "pvpc_time_to_next_best": ATTR_NEXT_BEST_IN_UPDATE,
    "pvpc_next_period_in": ATTR_NEXT_PERIOD_IN_UPDATE,
    "pvpc_next_power_period_in": ATTR_NEXT_POWER_PERIOD_IN_UPDATE,
}
VALID_POWER = vol.All(vol.Coerce(float), vol.Range(min=1.0, max=15.0))
VALID_TARIFF = vol.In(TARIFFS)
VALID_PRICE_MODE = vol.In(PRICE_MODES)


def normalize_better_price_target(target: str | None) -> str:
    """Return canonical better-price target label."""
    if not target:
        return DEFAULT_BETTER_PRICE_TARGET
    mapping = {
        "very cheap": "very_cheap",
        "very_cheap": "very_cheap",
        "cheap": "cheap",
        "neutral": "neutral",
    }
    return mapping.get(target, DEFAULT_BETTER_PRICE_TARGET)


def normalize_price_mode(mode: str | None) -> str:
    """Return canonical price mode label."""
    if not mode:
        return DEFAULT_PRICE_MODE
    if mode in PRICE_MODES:
        return mode
    return DEFAULT_PRICE_MODE
