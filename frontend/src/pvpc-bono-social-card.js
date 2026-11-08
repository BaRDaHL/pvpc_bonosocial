/**
 * Tarjeta «PVPC + Bono Social» (DISENO §7).
 *
 * Precio actual, mínimos y máximos, gráfica de hoy y mañana y la factura en texto. Los
 * mínimos, máximos y la gráfica siguen el aspecto de `pvpc-hourly-pricing-card` (escalones por
 * hora, hoy en azul y mañana en amarillo, triángulos de mínimo y máximo, leyenda con la fecha).
 * Con `colores: precio`, cada hora de hoy se colorea con los atributos `colores_hoy` del sensor
 * de precio, con la misma regla que el resumen de Telegram.
 *
 * Acepta la configuración de `pvpc-hourly-pricing-card` (`entity`, `entity_injection`,
 * `show_current`, `show_details`, `show_graph`, `show_only_today`) cambiando solo el `type`.
 *
 * Copyright (c) 2026 BaRDaHL. Licencia MIT.
 */

import { LitElement, css, html, nothing, svg } from "lit";

const VERSION = "1.2.4";
const ETIQUETA = "pvpc-bono-social-card";
const COLORES = ["var(--pvpc-bs-verde)", "var(--pvpc-bs-amarillo)", "var(--pvpc-bs-naranja)", "var(--pvpc-bs-rojo)"];
const COLOR_PERIODO = { P1: 3, P2: 2, P3: 0 };
// Colores de hoy y de mañana de la tarjeta antigua (pvpc-hourly-pricing-card).
const COLOR_HOY = "#4269d0";
const COLOR_MANANA = "#f4bd4a";
/** Color de la configuración: «#4269d0», cualquier color CSS o [r, g, b] (selector de color del editor). */
function colorCss(valor, defecto) {
  if (Array.isArray(valor) && valor.length === 3 && valor.every((c) => Number.isFinite(Number(c)))) {
    return `rgb(${valor.map(Number).join(", ")})`;
  }
  return typeof valor === "string" && valor.trim() ? valor.trim() : defecto;
}

// Bolita de la leyenda cuando hoy va coloreado por precio: los cuatro colores del precio.
const MULTICOLOR = `conic-gradient(${["verde", "amarillo", "naranja", "rojo"]
  .map((c, i) => `var(--pvpc-bs-${c}) ${i * 25}% ${(i + 1) * 25}%`)
  .join(", ")})`;
// Triángulos de mínimo y máximo (mdi:triangle-down, mdi:triangle y sus contornos).
const TRIANGULO = {
  min: "M1,3H23L12,22",
  max: "M1,21H23L12,2",
  min_hueco: "M12,22L1,3H23L12,22M12,17.5L19.5,5H4.5L12,17.5Z",
  max_hueco: "M12,2L1,21H23M12,6L19.53,19H4.47",
};

const TEXTOS = {
  es: {
    titulo: "Precio de la luz",
    anterior: "Factura periodo anterior",
    en_curso: "Factura periodo en curso",
    estimada_cierre: "Factura estimada",
    facturas: "Facturas",
    sin_facturas: "Aún no hay facturas cerradas",
    calculada: "calculada",
    abrir: "Ver todo",
    cerrar: "Cerrar",
    factura_real: "Factura real",
    calculada_consumo: "Calculada con el consumo",
    real: "real",
    sin_precio: "Sin precios",
    no_disponible: "No disponible",
    hora_actual: "Hora actual",
    periodos: { P1: "punta", P2: "llano", P3: "valle" },
    sin_entidad: "No se encuentra el sensor de precio de PVPC + Bono Social",
    comp: {
      boton: "Comparar tarifas",
      comparando: "Comparando…",
      titulo: "Comparativa de tarifas",
      ultima: "Última comparación",
      facturas: (n) => (n === 1 ? "1 factura" : `${n} facturas`),
      dias: (n) => `${n} días`,
      ofertas: (n) => `${n} ofertas de la CNMC`,
      tu_tarifa: "Tu tarifa actual",
      pvpc_bono: "PVPC con bono social",
      pvpc: "PVPC sin bono",
      al_anio: "/año",
      sin_permanencia: "sin permanencia",
      permanencia: "permanencia",
      nuevos: "solo nuevos clientes",
      verde: "verde",
      espera: "Consultando la CNMC con tus facturas. Puede tardar unos segundos…",
      error: "No se ha podido comparar",
      sin_datos: "Aún no hay ninguna comparativa.",
      sin_suministro: "No se encuentra el suministro de la comparativa",
      estados: {
        sin_codigo_postal: "Falta el código postal del suministro (opciones del suministro).",
        sin_datos: "No hay facturas suficientes para comparar.",
        cnmc_no_responde: "El comparador de la CNMC no responde; inténtalo más tarde.",
      },
      veredictos: {
        quedarse_con_bono: ["Sigue con PVPC + bono social", "Con tu bono, el PVPC sigue siendo lo más barato: la mejor oferta libre te costaría {x} más al año."],
        libre_aunque_pierde_bono: ["Hay una oferta más barata", "La mejor oferta libre sale {x} más barata al año que lo que pagas con bono, aunque lo perderías. Comprueba las condiciones antes de cambiar."],
        mercado_libre: ["Puedes ahorrar", "Con la mejor oferta te ahorrarías {x} al año."],
        quedarse: ["Sigue con tu tarifa", "Ninguna oferta mejora lo que pagas: la mejor te costaría {x} más al año."],
      },
      avisos: {
        pierde_bono: "Con otra comercializadora pierdes el bono social.",
        bono_perdido: "Ya no tienes bono social: se compara con lo que pagarías sin él.",
        bono_nuevo: "Parte de lo pagado no llevaba el bono que tienes ahora: el ahorro real sería menor.",
        cobertura_incompleta: "No están en el comparador: {ausentes}.",
        datos_extrapolados: "Solo hay {dias} días de facturas: lo pagado y el consumo se han llevado a un año.",
        facturas_estimadas: "Hay facturas estimadas: concilia las reales para afinar.",
        sin_ofertas: "La CNMC no ha devuelto ofertas para tu código postal.",
      },
      cerrar: "Cerrar la comparativa",
      confirmar: "Los precios son los que publica la CNMC y pueden estar desfasados: confírmalos con la comercializadora antes de contratar.",
      ficha: "Ficha de la oferta en la CNMC (con la web de la comercializadora)",
      cnmc: "Ver todas las ofertas en el comparador de la CNMC",
      cnmc_datos: (n) => `${n ? `Las ${n} ofertas` : "Todas las ofertas"}, calculadas con tu consumo y tu potencia`,
      pvpc_cnmc: (x, p, b) =>
        b
          ? `PVPC según la CNMC: ${x} sin bono con los precios del último año · previsión próximo año: ${p} sin bono, ≈${b} con tu bono`
          : p
            ? `PVPC sin bono según la CNMC: ${x} con los precios del último año · previsión próximo año: ${p}`
            : `PVPC sin bono según la CNMC: ${x} con los precios del último año`,
      enviar: (a) => `Enviar a ${a}`,
      enviando: "Enviando…",
      enviado: "Enviada ✓",
    },
  },
  en: {
    titulo: "Electricity price",
    anterior: "Previous bill",
    en_curso: "Current bill",
    estimada_cierre: "Estimated bill",
    facturas: "Bills",
    sin_facturas: "No closed bills yet",
    calculada: "calculated",
    abrir: "Show everything",
    cerrar: "Close",
    factura_real: "Actual bill",
    calculada_consumo: "Calculated from consumption",
    real: "actual",
    sin_precio: "No prices",
    no_disponible: "Unavailable",
    hora_actual: "Current hour",
    periodos: { P1: "peak", P2: "standard", P3: "off-peak" },
    sin_entidad: "PVPC + Bono Social price sensor not found",
    comp: {
      boton: "Compare tariffs",
      comparando: "Comparing…",
      titulo: "Tariff comparison",
      ultima: "Last comparison",
      facturas: (n) => (n === 1 ? "1 bill" : `${n} bills`),
      dias: (n) => `${n} days`,
      ofertas: (n) => `${n} CNMC offers`,
      tu_tarifa: "Your current tariff",
      pvpc_bono: "PVPC with social bonus",
      pvpc: "PVPC without bonus",
      al_anio: "/year",
      sin_permanencia: "no minimum stay",
      permanencia: "minimum stay",
      nuevos: "new customers only",
      verde: "green",
      espera: "Asking the CNMC with your bills. It may take a few seconds…",
      error: "The comparison failed",
      sin_datos: "No comparison yet.",
      sin_suministro: "The supply for the comparison cannot be found",
      estados: {
        sin_codigo_postal: "The supply has no postal code (supply options).",
        sin_datos: "Not enough bills to compare.",
        cnmc_no_responde: "The CNMC comparator is not responding; try again later.",
      },
      veredictos: {
        quedarse_con_bono: ["Stay on PVPC + social bonus", "With your bonus, PVPC is still the cheapest: the best free-market offer would cost you {x} more per year."],
        libre_aunque_pierde_bono: ["There is a cheaper offer", "The best free-market offer is {x} per year cheaper than what you pay with the bonus, although you would lose it. Check the conditions before switching."],
        mercado_libre: ["You can save", "With the best offer you would save {x} per year."],
        quedarse: ["Keep your tariff", "No offer beats what you pay: the best would cost you {x} more per year."],
      },
      avisos: {
        pierde_bono: "Switching retailer loses the social bonus.",
        bono_perdido: "You no longer have the social bonus: compared with what you would pay without it.",
        bono_nuevo: "Part of what you paid did not have your current bonus: real savings would be smaller.",
        cobertura_incompleta: "Not in the comparator: {ausentes}.",
        datos_extrapolados: "Only {dias} days of bills: payments and consumption extrapolated to a year.",
        facturas_estimadas: "Some bills are estimates: reconcile the real ones to refine.",
        sin_ofertas: "The CNMC returned no offers for your postal code.",
      },
      cerrar: "Close the comparison",
      confirmar: "Prices are those published by the CNMC and may be out of date: confirm them with the retailer before signing up.",
      ficha: "Offer details at the CNMC (with the retailer website)",
      cnmc: "See all offers in the CNMC comparator",
      cnmc_datos: (n) => `${n ? `All ${n} offers` : "All offers"}, calculated with your consumption and power`,
      pvpc_cnmc: (x, p, b) =>
        b
          ? `PVPC according to the CNMC: ${x} without bonus at last year's prices · next year's forecast: ${p} without bonus, ≈${b} with your bonus`
          : p
            ? `PVPC without bonus according to the CNMC: ${x} at last year's prices · next year's forecast: ${p}`
            : `PVPC without bonus according to the CNMC: ${x} at last year's prices`,
      enviar: (a) => `Send to ${a}`,
      enviando: "Sending…",
      enviado: "Sent ✓",
    },
  },
  // Catalán, gallego y euskera: solo los textos que se pintan (los que falten salen en español).
  ca: {
    titulo: "Preu de la llum",
    anterior: "Factura del període anterior",
    en_curso: "Factura del període en curs",
    estimada_cierre: "Factura estimada",
    facturas: "Factures",
    sin_facturas: "Encara no hi ha factures tancades",
    calculada: "calculada",
    abrir: "Veure-ho tot",
    cerrar: "Tanca",
    factura_real: "Factura real",
    calculada_consumo: "Calculada amb el consum",
    real: "real",
    sin_precio: "Sense preus",
    no_disponible: "No disponible",
    hora_actual: "Hora actual",
    periodos: { P1: "punta", P2: "pla", P3: "vall" },
    sin_entidad: "No es troba el sensor de preu de PVPC + Bono Social",
  },
  gl: {
    titulo: "Prezo da luz",
    anterior: "Factura do período anterior",
    en_curso: "Factura do período en curso",
    estimada_cierre: "Factura estimada",
    facturas: "Facturas",
    sin_facturas: "Aínda non hai facturas pechadas",
    calculada: "calculada",
    abrir: "Ver todo",
    cerrar: "Pechar",
    factura_real: "Factura real",
    calculada_consumo: "Calculada co consumo",
    real: "real",
    sin_precio: "Sen prezos",
    no_disponible: "Non dispoñible",
    hora_actual: "Hora actual",
    periodos: { P1: "punta", P2: "chan", P3: "val" },
    sin_entidad: "Non se atopa o sensor de prezo de PVPC + Bono Social",
  },
  eu: {
    titulo: "Argindarraren prezioa",
    anterior: "Aurreko aldiko faktura",
    en_curso: "Aldi honetako faktura",
    estimada_cierre: "Zenbatetsitako faktura",
    facturas: "Fakturak",
    sin_facturas: "Oraindik ez dago itxitako fakturarik",
    calculada: "kalkulatua",
    abrir: "Ikusi dena",
    cerrar: "Itxi",
    factura_real: "Benetako faktura",
    calculada_consumo: "Kontsumoarekin kalkulatua",
    real: "benetakoa",
    sin_precio: "Preziorik ez",
    no_disponible: "Ez dago erabilgarri",
    hora_actual: "Uneko ordua",
    periodos: { P1: "punta", P2: "laua", P3: "harana" },
    sin_entidad: "Ez da aurkitu PVPC + Bono Social-en prezio-sentsorea",
  },
};

// Idiomas cooficiales con textos propios; lo que les falte, en español.
const COOFICIALES = ["ca", "gl", "eu"];

// --- tamaño de las gráficas ---------------------------------------------------------------
//
// Las gráficas se dibujan a 480 unidades de ancho. Entre estas dos escalas (px por unidad), que es
// el tamaño normal de la tarjeta, se ven como siempre. Fuera de ellas, el lienzo se adapta al ancho
// real en lugar de escalar el texto: 47 px en la vista panel de una pantalla 2K y 4 px a 246 px.
const ANCHO_BASE = 480;
const ESCALA_MIN = 0.95;
const ESCALA_MAX = 1.2;

/** Lienzo (en unidades del viewBox) para `anchoPx`; sin medir aún, el de siempre. */
function lienzo(anchoPx, altoBase, altoMaximo) {
  if (!anchoPx) return { ancho: ANCHO_BASE, alto: altoBase };
  const escala = Math.min(Math.max(anchoPx / ANCHO_BASE, ESCALA_MIN), ESCALA_MAX);
  const ancho = Math.round(anchoPx / escala);
  // El alto acompaña al ancho, con límites: ni una tira en un panel ni un cuadrado en el móvil.
  const proporcional = Math.round((altoBase * ancho) / ANCHO_BASE);
  const alto = ancho > ANCHO_BASE ? Math.min(proporcional, altoMaximo) : Math.max(proporcional, Math.round(altoBase * 0.8));
  return { ancho, alto };
}

/** Cada cuántas etiquetas se pinta una para que no se pisen (se cuenta desde la última). */
function cadaCuantas(hueco, anchoEtiqueta) {
  return Math.max(1, Math.ceil(anchoEtiqueta / hueco));
}

// --- datos ------------------------------------------------------------------------------

/** Precios del día desde los atributos `price_HHh` (o `price_next_day_HHh`), en orden de hora. */
function serie(atributos, manana = false) {
  const prefijo = manana ? "price_next_day_" : "price_";
  const out = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    const valor = atributos?.[`${prefijo}${hh}h`];
    if (typeof valor === "number") out.push({ hora: h, precio: valor });
    const repetida = atributos?.[`${prefijo}${hh}h_d`]; // día de 25 h
    if (typeof repetida === "number") out.push({ hora: h, precio: repetida });
  }
  return out;
}

// --- hora en la zona de HA ------------------------------------------------------------
//
// Los atributos `price_HHh` van en la hora de la zona de HA (`hass.config.time_zone`: la
// peninsular o la canaria), no en la del navegador: con el móvil en otra zona (de viaje, un
// portátil en UTC, HA en Canarias y el navegador en hora peninsular…) la hora en curso, «hoy»
// y «mañana» se calculan siempre en la zona de HA. La preferencia de perfil «Zona horaria:
// local/servidor» (`hass.locale.time_zone`) no se aplica aquí a propósito: los precios de cada
// hora son de la zona del servidor y mostrarlos en otra descuadraría la gráfica.

const FORMATEADORES = new Map();

/** Formateador de fecha y hora (24 h) en `zona`; con una zona no válida, la del navegador. */
function formateador(zona) {
  const clave = zona || "";
  let f = FORMATEADORES.get(clave);
  if (!f) {
    const opciones = { hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" };
    try {
      f = new Intl.DateTimeFormat("en-US", zona ? { ...opciones, timeZone: zona } : opciones);
    } catch {
      f = new Intl.DateTimeFormat("en-US", opciones); // RangeError: zona desconocida
    }
    FORMATEADORES.set(clave, f);
  }
  return f;
}

/** Fecha y hora de pared de `ahora` en `zona` (por defecto, la del navegador), con el desfase
 * en minutos respecto a UTC. */
function enZona(ahora = new Date(), zona) {
  const p = {};
  for (const { type, value } of formateador(zona).formatToParts(ahora)) p[type] = Number(value);
  const r = { anio: p.year, mes: p.month, dia: p.day, hora: p.hour % 24, minuto: p.minute };
  const pared = Date.UTC(r.anio, r.mes - 1, r.dia, r.hora, r.minuto);
  r.desfase = Math.round((pared - Math.floor(ahora.getTime() / 60000) * 60000) / 60000);
  return r;
}

/** Zona horaria de HA (la de los precios); sin ella (HA muy antiguo), la del navegador. */
function zonaDeHA(hass) {
  return hass?.config?.time_zone || undefined;
}

/** Fecha «AAAA-MM-DD» de hoy (o `dias` después) en `zona`. */
function fechaIso(ahora = new Date(), zona, dias = 0) {
  const r = enZona(ahora, zona);
  return new Date(Date.UTC(r.anio, r.mes - 1, r.dia + dias)).toISOString().slice(0, 10);
}

/** Día y hora en la zona de HA, para saber si lo pintado se ha quedado atrás (con el desfase
 * horario: las dos horas 02 del día de 25 h son distintas). */
function horaLocal(ahora = new Date(), zona) {
  const r = enZona(ahora, zona);
  return `${r.anio}-${r.mes}-${r.dia}-${r.hora}-${r.desfase}`;
}

/** Posición de la hora en curso (en la zona de HA) dentro de la serie de hoy. */
function posicionActual(puntos, ahora = new Date(), zona) {
  const h = enZona(ahora, zona).hora;
  const i = puntos.findIndex((p) => p.hora === h);
  // Segunda vez de la misma hora (día de 25 h): una hora antes el reloj marcaba lo mismo.
  const repetida = enZona(new Date(ahora.getTime() - 3600000), zona).hora === h;
  return repetida && puntos[i + 1]?.hora === h ? i + 1 : i;
}

function extremos(puntos) {
  if (!puntos.length) return null;
  let min = 0;
  let max = 0;
  puntos.forEach((p, i) => {
    if (p.precio < puntos[min].precio) min = i;
    if (p.precio > puntos[max].precio) max = i;
  });
  return { min: puntos[min], max: puntos[max] };
}

/** Color de cada hora por su posición en el rango del día (si la integración no los da). */
function coloresPorRango(puntos) {
  const e = extremos(puntos);
  if (!e) return [];
  const rango = e.max.precio - e.min.precio;
  return puntos.map((p) => (rango ? Math.min(3, Math.floor(((p.precio - e.min.precio) / rango) * 4)) : 0));
}

function buscarEntidad(hass, prefijo, condicion = () => true) {
  return Object.keys(hass?.states || {})
    .filter((id) => id.startsWith(prefijo) && condicion(hass.states[id]))
    .sort()[0];
}

function entidadPrecio(hass) {
  if (hass?.states["sensor.pvpc_bs_precio"]) return "sensor.pvpc_bs_precio";
  return buscarEntidad(
    hass,
    "sensor.",
    (s) => "price_00h" in (s.attributes || {}) && String(s.attributes.attribution || "").includes("REE"),
  );
}

const POR_DEFECTO = {
  current: true,
  details: true,
  extremos: "columnas",
  graph: true,
  next_day: true,
  extremos_manana: true,
  factura: "header",
  factura_actual: true,
  factura_anterior: true,
  prevision: true,
  icon_color: "price",
  colores: "fijo",
  color_hoy: COLOR_HOY,
  color_manana: COLOR_MANANA,
  bandas: true,
  grafica_facturas: false,
  facturas_meses: "6",
  facturas_importe: true,
  grosor: "2.5",
  excedentes_grafica: true,
};

/** La configuración con los valores por defecto y las opciones de la tarjeta antigua (`show_*`). */
function conDefectos(config) {
  const antigua = {};
  for (const [vieja, nueva] of [
    ["show_current", "current"],
    ["show_details", "details"],
    ["show_graph", "graph"],
  ]) {
    if (typeof config[vieja] === "boolean" && !(nueva in config)) antigua[nueva] = config[vieja];
  }
  if (typeof config.show_only_today === "boolean" && !("next_day" in config)) antigua.next_day = !config.show_only_today;
  const c = { ...POR_DEFECTO, ...antigua, ...config };
  // Antes «mañana» era uno solo para la gráfica y los mínimos y máximos: sin la clave nueva, se respeta.
  if (!("extremos_manana" in config) && c.next_day === false) c.extremos_manana = false;
  return c;
}

// --- tarjeta ----------------------------------------------------------------------------

class PvpcBonoSocialCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _cursor: { state: true },
    _facturas: { state: true },
    _ventana: { state: true },
    _anexo: { state: true },
    _envio: { state: true },
    comparando: { attribute: false },
    _anchoUtil: { state: true },
  };

  static async getConfigElement() {
    await cargarHaForm();
    return document.createElement(ETIQUETA_EDITOR);
  }

  /** Configuración inicial al añadir la tarjeta (la que eligió el titular, 13-oct-2026). */
  static getStubConfig(hass) {
    return {
      entity: entidadPrecio(hass) || "sensor.pvpc_bs_precio",
      entity_factura_actual: buscarEntidad(hass, "sensor.pvpc_bs_factura_actual") || "sensor.pvpc_bs_factura_actual",
      entity_factura_anterior:
        buscarEntidad(hass, "sensor.pvpc_bs_factura_anterior") || "sensor.pvpc_bs_factura_anterior",
      // Lo que sale al añadir una tarjeta nueva (las ya puestas siguen con POR_DEFECTO, como siempre).
      title: "PVPC",
      current: true,
      icon_color: "price",
      factura: "header",
      factura_anterior: false,
      factura_actual: true,
      prevision: true,
      details: true,
      extremos_manana: true,
      extremos: "columnas",
      graph: true,
      next_day: true,
      excedentes_grafica: false,
      bandas: true,
      titulo_grafica: "",
      grosor: "1.5",
      colores: "fijo",
      grafica_facturas: false,
      facturas_importe: true,
      facturas_tendencia: true,
      facturas_meses: "12",
      grid_options: { columns: "full", rows: "auto" },
    };
  }

  _id = Math.random().toString(36).slice(2, 8);

  setConfig(config) {
    if (!config) throw new Error("Configuración no válida");
    this._config = conDefectos(config);
  }

  getCardSize() {
    return this._config?.graph === false ? 3 : 7;
  }

  getGridOptions() {
    return { columns: "full", rows: "auto", min_columns: 6, min_rows: 3 };
  }

  // Colores de hoy y de mañana: leyenda, línea, triángulos de mínimo y máximo y excedentes.
  get _cHoy() {
    return colorCss(this._config.color_hoy, COLOR_HOY);
  }

  get _cManana() {
    return colorCss(this._config.color_manana, COLOR_MANANA);
  }

  get _t() {
    return textosDe(this.hass);
  }

  /** Idioma para `Intl`: en catalán, gallego y euskera, con el español de respaldo (si el
   * navegador no trae sus datos, números y fechas salen como en español y no en inglés). */
  get _idiomas() {
    const idioma = this.hass?.locale?.language || this.hass?.language || "es";
    return COOFICIALES.includes(idioma.slice(0, 2)) ? [idioma, "es"] : idioma;
  }

  _num(valor, decimales = 3) {
    return new Intl.NumberFormat(this._idiomas, {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(valor);
  }

  /** Entidades que pinta la tarjeta: solo sus cambios la vuelven a dibujar. */
  _entidadesVigiladas(hass) {
    const c = this._config;
    return [
      c.entity || entidadPrecio(hass),
      c.entity_injection,
      "sensor.pvpc_bs_periodo",
      c.entity_factura_anterior || buscarEntidad(hass, "sensor.pvpc_bs_factura_anterior"),
      c.entity_factura_actual || buscarEntidad(hass, "sensor.pvpc_bs_factura_actual"),
    ].filter(Boolean);
  }

  /**
   * `hass` cambia con cualquier entidad de la casa; sin este filtro la tarjeta entera (SVG y
   * alineación de la cabecera) se rehace varias veces por segundo.
   */
  shouldUpdate(cambios) {
    if (!cambios.has("hass") || cambios.size > 1 || !this._config) return true;
    const antes = cambios.get("hass");
    const ahora = this.hass;
    if (!antes || !ahora) return true;
    if (antes.locale !== ahora.locale || antes.language !== ahora.language || antes.themes !== ahora.themes) {
      return true;
    }
    const ids = new Set([...this._entidadesVigiladas(antes), ...this._entidadesVigiladas(ahora)]);
    for (const id of ids) if (antes.states[id] !== ahora.states[id]) return true;
    // La franja «Hora actual», el color del icono y la fecha salen del reloj (en la zona de HA).
    return this._horaPintada !== horaLocal(new Date(), zonaDeHA(ahora));
  }

  /** Redibujo al empezar cada hora: sin él, la hora en curso se queda en la anterior hasta que
   * cambie una entidad vigilada (el precio llega a las hh:00 del servidor, que puede ir por delante). */
  _programarCambioDeHora() {
    clearTimeout(this._temporizadorHora);
    // En tiempo absoluto: con la hora de pared, el día de 25 h se saltaría la segunda 02. Lo que
    // falta para la hora en punto se mide en la zona de HA (vale también con desfases de media hora).
    const ahora = Date.now();
    const minuto = enZona(new Date(ahora), zonaDeHA(this.hass)).minuto;
    const espera = (60 - minuto) * 60000 - (ahora % 60000) + 1000;
    this._temporizadorHora = setTimeout(() => {
      this.requestUpdate();
      this._programarCambioDeHora();
    }, espera);
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    const zona = zonaDeHA(this.hass);
    const reloj = new Date();
    this._horaPintada = horaLocal(reloj, zona);
    const t = this._t;
    const id = this._config.entity || entidadPrecio(this.hass);
    const estado = id && this.hass.states[id];
    if (!estado) {
      return html`<ha-card><div class="aviso">${t.sin_entidad}</div></ha-card>`;
    }
    const a = estado.attributes || {};
    const hoy = serie(a);
    const mananaTodo = serie(a, true);
    // «Mostrar mañana» va por separado en la gráfica (next_day) y en los mínimos y máximos.
    const manana = this._config.next_day ? mananaTodo : [];
    const mananaExtremos = this._config.extremos_manana !== false ? mananaTodo : [];
    const coloresHoy = Array.isArray(a.colores_hoy) && a.colores_hoy.length === hoy.length ? a.colores_hoy : coloresPorRango(hoy);
    const coloresManana =
      Array.isArray(a.colores_manana) && a.colores_manana.length === mananaTodo.length
        ? a.colores_manana
        : coloresPorRango(mananaTodo);
    const ahora = posicionActual(hoy, reloj, zona);
    const iny = this._config.entity_injection && this.hass.states[this._config.entity_injection];
    const injManana = iny ? serie(iny.attributes, true) : [];
    const inyeccion = iny ? { hoy: serie(iny.attributes), manana: this._config.next_day ? injManana : [] } : null;
    const inyeccionExtremos = iny
      ? { hoy: inyeccion.hoy, manana: this._config.extremos_manana !== false ? injManana : [] }
      : null;
    // Periodo de cada hora de hoy; en fines de semana y festivos (todo valle) no se marca.
    const periodos =
      this._config.bandas !== false &&
      Array.isArray(a.periodos_hoy) && a.periodos_hoy.length === hoy.length && a.periodos_hoy.some((p) => p !== "P3")
        ? a.periodos_hoy
        : null;
    const precio = Number(estado.state);
    const factura = this._factura();
    const posicion = this._config.factura;

    return html`
      <ha-card>
        <div class="contenedor">
          ${html`<div class="cabecera">
                ${this._conVentana
                  ? html`<button class="abrir" aria-label=${t.abrir} @click=${() => this._abrirVentana()}>
                      ${this._icono(ahora >= 0 ? coloresHoy[ahora] : undefined)}
                    </button>`
                  : this._icono(ahora >= 0 ? coloresHoy[ahora] : undefined)}
                <div class="nombre">${this._config.title || ""}</div>
                <div class="actual">
                  ${/* Sin «Precio actual» el precio se pinta invisible: ocupa su sitio y la factura no se mueve. */ ""}
                  <div class="precio ${this._config.current ? "" : "oculto"}" aria-hidden=${this._config.current ? "false" : "true"}>
                    ${Number.isFinite(precio) ? this._precioGrande(precio) : "—"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${iny && Number.isFinite(Number(iny.state))
                    ? html`<div class="precio-iny ${this._config.current ? "" : "oculto"}" aria-hidden=${this._config.current ? "false" : "true"}>
                        ${this._precioIny(Number(iny.state))}
                      </div>`
                    : nothing}
                  ${posicion === "header" && factura ? html`<div class="factura arriba">${factura}</div>` : nothing}
                </div>
              </div>`}
          ${this._config.details
            ? this._detalles(hoy, mananaExtremos, inyeccionExtremos)
            : html`<div class="referencia" aria-hidden="true">${this._detalles(hoy, [], null)}</div>`}
          ${this._config.graph
            ? this._grafica(hoy, manana, coloresHoy, coloresManana, ahora, periodos, this._config.excedentes_grafica === false ? null : inyeccion)
            : nothing}
          ${factura && posicion === "below_chart"
            ? html`<div class="factura abajo">${factura}</div>`
            : nothing}
          ${factura && posicion === "below_chart_right"
            ? html`<div class="factura abajo derecha">${factura}</div>`
            : nothing}
          ${factura && posicion === "header"
            ? html`<div class="factura abajo estrecha">${factura}</div>`
            : nothing}
          ${this._config.grafica_facturas ? this._graficaFacturas() : nothing}
          ${this.enVentana && buscarEntidad(this.hass, "button.pvpc_bs_comparar_tarifas")
            ? html`<div class="comparar">
                <button
                  class="btn-comparar"
                  ?disabled=${this.comparando}
                  @click=${() => this.dispatchEvent(new CustomEvent("pvpc-bs-comparar", { bubbles: true, composed: true }))}
                >
                  ${this.comparando ? t.comp.comparando : t.comp.boton}
                </button>
              </div>`
            : nothing}
        </div>
      </ha-card>
      ${this._ventana ? this._dialogo() : nothing}
    `;
  }

  // --- ventana con la tarjeta completa (al pulsar el icono) ----------------------------

  get _conVentana() {
    // Siempre: la ventana trae la comparativa de tarifas (una config antigua con ventana: false no la quita).
    return !this.enVentana;
  }

  /** La tarjeta dentro de la ventana: lo mismo con todo activado. */
  set configVentana(config) {
    this.enVentana = true;
    this.toggleAttribute("en-ventana", true);
    this.setConfig(config);
  }

  _abrirVentana() {
    if (this._conVentana) this._ventana = true;
  }

  _cerrarVentana() {
    this.renderRoot.querySelector("dialog.ventana")?.close();
  }

  _dialogo() {
    const completa = {
      ...this._config,
      current: true,
      details: true,
      graph: true,
      next_day: true,
      factura: "header",
      factura_actual: true,
      factura_anterior: true,
      prevision: true,
      grafica_facturas: true,
      extremos_manana: true,
      // El título ya va en la barra de la ventana: dentro no se repite.
      title: "",
    };
    return html`<dialog
      class="ventana ${this._anexo ? "con-anexo" : ""}"
      @close=${() => {
        this._ventana = false;
        this._anexo = null;
      }}
      @click=${(ev) => ev.target === ev.currentTarget && this._cerrarVentana()}
      @pvpc-bs-comparar=${() => this._comparar()}
    >
      <div class="ventana-cuerpo">
        <div class="ventana-principal">
        <div class="ventana-cabecera">
          <button class="cerrar" aria-label=${this._t.cerrar} @click=${() => this._cerrarVentana()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
            </svg>
          </button>
          <div class="ventana-titulo">${this._config.title || "PVPC + Bono Social"}</div>
        </div>
        <pvpc-bono-social-card
          .configVentana=${completa}
          .hass=${this.hass}
          .comparando=${this._anexo?.estado === "cargando"}
        ></pvpc-bono-social-card>
        </div>
        ${this._anexo ? this._anexoComparativa() : nothing}
      </div>
    </dialog>`;
  }

  // --- comparativa de tarifas (anexo de la ventana) -------------------------------------

  /** Compara las tarifas del suministro (sin enviar al destino) y abre el anexo con el resultado. */
  async _comparar() {
    if (this._anexo?.estado === "cargando") return;
    const boton = buscarEntidad(this.hass, "button.pvpc_bs_comparar_tarifas");
    if (!boton) return;
    this._anexo = { estado: "cargando" };
    this._envio = null;
    try {
      // El servicio espera a la CNMC: cuando vuelve, el sensor ya tiene la comparativa nueva.
      // Desde la tarjeta ni notificación de HA ni destino (Telegram…): para eso está «Enviar».
      const suministro = this.hass.entities?.[boton]?.device_id;
      // Sin el dispositivo no se pulsa el botón: enviaría al destino, y desde aquí no se envía nada.
      if (!suministro) throw new Error(this._t.comp.sin_suministro);
      await this.hass.callService("pvpc_bonosocial", "comparar_tarifas", { suministro, enviar: false, notificacion: false });
      this._anexo = { estado: "ok" };
    } catch (error) {
      this._anexo = { estado: "error", mensaje: error?.message || String(error) };
    }
    await this.updateComplete;
    this.renderRoot.querySelector(".anexo")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }

  _anexoComparativa() {
    const c = this._t.comp;
    const cerrar = html`<button class="cerrar" aria-label=${c.cerrar} @click=${() => (this._anexo = null)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`;
    const cabecera = html`<div class="anexo-cabecera"><div class="ventana-titulo">${c.titulo}</div>${cerrar}</div>`;
    if (this._anexo.estado === "cargando") {
      return html`<aside class="anexo">${cabecera}<div class="anexo-espera"><span class="girando"></span>${c.espera}</div></aside>`;
    }
    const id = buscarEntidad(this.hass, "sensor.pvpc_bs_mejor_alternativa");
    const sensor = id && this.hass.states[id];
    const r = sensor?.attributes || {};
    if (this._anexo.estado === "error" || (r.estado && r.estado !== "ok")) {
      const mensaje = c.estados[r.estado] || this._anexo.mensaje || c.error;
      return html`<aside class="anexo">${cabecera}<div class="anexo-aviso error">⚠️ ${c.error}: ${mensaje}</div></aside>`;
    }
    const ofertas = Array.isArray(r.ofertas) ? r.ofertas : [];
    if (!sensor || !r.fecha) {
      return html`<aside class="anexo">${cabecera}<div class="anexo-aviso">${c.sin_datos}</div></aside>`;
    }
    if (!ofertas.length) {
      // Comparativa hecha, pero la CNMC no ha devuelto ninguna oferta libre.
      return html`<aside class="anexo">${cabecera}<div class="anexo-aviso">${c.avisos.sin_ofertas}</div></aside>`;
    }
    const avisos = Array.isArray(r.avisos) ? r.avisos : [];
    // Con bono se compara con lo pagado; si se ha perdido, con lo que se pagaría sin él.
    const sinBono = avisos.includes("bono_perdido") || !["quedarse_con_bono", "libre_aunque_pierde_bono"].includes(r.veredicto);
    const base = avisos.includes("bono_perdido") ? r.pagado_sin_bono_anual : r.pagado_anual;
    const eur = (x) => `${this._num(x, 2)} €`;
    const fecha = typeof r.fecha === "string" ? `${r.fecha.slice(8, 10)}/${r.fecha.slice(5, 7)} ${r.fecha.slice(11, 16)}` : "";
    const p = r.periodo || {};
    const resumen = [
      fecha && `${c.ultima}: ${fecha}`,
      p.facturas_conciliadas !== undefined && `${c.facturas(p.facturas_conciliadas + (p.facturas_estimadas || 0))}${p.dias ? ` (${c.dias(p.dias)})` : ""}`,
      r.total_ofertas !== undefined && c.ofertas(r.total_ofertas),
    ].filter(Boolean).join(" · ");
    const mejor = ofertas[0];
    const veredicto = c.veredictos[r.veredicto];
    const bueno = ["quedarse_con_bono", "quedarse"].includes(r.veredicto);
    const etiquetas = (o) =>
      [o.oferta, o.permanencia ? c.permanencia : c.sin_permanencia, o.solo_nuevos_clientes && c.nuevos, o.verde && c.verde]
        .filter(Boolean)
        .join(" · ");
    const textoAviso = (a) =>
      (c.avisos[a] || "")
        .replace("{ausentes}", (r.grandes_ausentes || []).join(", "))
        .replace("{dias}", p.dias ?? "");
    return html`<aside class="anexo">
      ${cabecera}
      <div class="anexo-resumen">${resumen}</div>
      ${veredicto && mejor
        ? html`<div class="anexo-veredicto ${bueno ? "bueno" : "ahorro"}">
            <b>${bueno ? "✅" : "💡"} ${veredicto[0]}</b>
            <div>${veredicto[1].replace("{x}", eur(Math.abs(mejor.ahorro_anual)))}</div>
          </div>`
        : nothing}
      <div class="anexo-fila tuya">
        <div><div class="n">${c.tu_tarifa}</div><div class="o">${sinBono ? c.pvpc : c.pvpc_bono}</div></div>
        <div class="i">${eur(base)}${c.al_anio}</div>
      </div>
      ${ofertas.slice(0, 4).map(
        (o) => html`<div class="anexo-fila">
          <div>
            ${o.enlace
              ? html`<a class="n enlace" href=${o.enlace} target="_blank" rel="noopener noreferrer" title=${c.ficha}
                  >${o.comercializadora} ↗</a
                >`
              : html`<div class="n">${o.comercializadora}</div>`}
            <div class="o">${etiquetas(o)}</div>
          </div>
          <div>
            <div class="i">${eur(o.importe_primer_anio)}</div>
            <div class="d ${o.ahorro_anual >= 0 ? "menos" : "mas"}">
              ${o.ahorro_anual >= 0 ? "−" : "+"}${eur(Math.abs(o.ahorro_anual))}
            </div>
          </div>
        </div>`,
      )}
      <div class="anexo-fila">
        <div>
          <a
            class="n enlace"
            href=${r.enlace_listado || "https://comparador.cnmc.gob.es/"}
            target="_blank"
            rel="noopener noreferrer"
            >${c.cnmc} ↗</a
          >
          <div class="o">${r.enlace_listado ? c.cnmc_datos(r.total_ofertas) : ""}</div>
        </div>
      </div>
      ${r.pvpc_cnmc != null
        ? html`<div class="anexo-pvpc">
            ${c.pvpc_cnmc(
              eur(r.pvpc_cnmc),
              r.pvpc_cnmc_prevision != null ? eur(r.pvpc_cnmc_prevision) : null,
              r.pvpc_cnmc_prevision_bono != null ? eur(r.pvpc_cnmc_prevision_bono) : null,
            )}
          </div>`
        : nothing}
      ${avisos.filter((a) => c.avisos[a]).map((a) => html`<div class="anexo-nota">⚠️ ${textoAviso(a)}</div>`)}
      <div class="anexo-nota">ℹ️ ${c.confirmar}</div>
      ${r.destino ? html`<div class="anexo-pie">${this._botonEnviar(id, r.destino)}</div>` : nothing}
    </aside>`;
  }

  /** «Enviar a Telegram»: reenvía la comparativa guardada al destino de las opciones del suministro. */
  _botonEnviar(idSensor, destino) {
    const c = this._t.comp;
    const nombre = /telegram/i.test(destino)
      ? "Telegram"
      : this.hass.states[destino]?.attributes?.friendly_name || destino;
    const dispositivo = this.hass.entities?.[idSensor]?.device_id;
    if (!dispositivo) return nothing;
    const enviar = async () => {
      this._envio = "enviando";
      try {
        await this.hass.callService("pvpc_bonosocial", "enviar_comparativa", { suministro: dispositivo });
        this._envio = "ok";
      } catch (error) {
        this._envio = error?.message || String(error);
      }
    };
    const texto = this._envio === "enviando" ? c.enviando : this._envio === "ok" ? c.enviado : c.enviar(nombre);
    return html`<div class="comparar">
        <button class="btn-comparar" ?disabled=${this._envio === "enviando" || this._envio === "ok"} @click=${enviar}>${texto}</button>
      </div>
      ${this._envio && !["enviando", "ok"].includes(this._envio)
        ? html`<div class="anexo-aviso error">⚠️ ${this._envio}</div>`
        : nothing}`;
  }

  /** Cinco decimales como la tarjeta antigua: los tres primeros grandes y los dos últimos pequeños. */
  _precioGrande(precio) {
    const texto = this._num(precio, 5);
    // La coma en su propio span: el precio de excedentes se alinea con ella.
    const i = texto.search(/[^-\d]/);
    const grande = texto.slice(0, -2);
    return i < 0
      ? html`${grande}<span class="cola">${texto.slice(-2)}</span>`
      : html`${grande.slice(0, i)}<span class="coma">${grande[i]}</span>${grande.slice(i + 1)}<span class="cola"
            >${texto.slice(-2)}</span
          >`;
  }

  /** Precio de excedentes en piezas: su coma y su «€» se colocan bajo los del precio grande. */
  _precioIny(valor) {
    const texto = this._num(valor, 5);
    const i = texto.search(/[^-\d]/);
    const ent = i < 0 ? texto : texto.slice(0, i);
    const coma = i < 0 ? "" : texto[i];
    const dec = i < 0 ? "" : texto.slice(i + 1);
    return html`<span class="iny-ent">${ent}</span><span class="iny-coma">${coma}</span><span class="iny-dec"
        >${dec}</span
      ><span class="iny-hueco"> </span><span class="iny-euro">€</span>/kWh`;
  }

  _icono(codigo) {
    let indice = codigo;
    if (this._config.icon_color === "period") {
      const periodo = this.hass.states["sensor.pvpc_bs_periodo"]?.state;
      indice = COLOR_PERIODO[periodo];
    }
    // El icono de la integración (torre eléctrica con €), entero del color del precio.
    const color =
      this._config.icon_color === "fijo" || indice === undefined ? COLOR_HOY : COLORES[indice];
    const mascara = `pvpc-bs-hueco-${this._id}`;
    return html`<svg class="icono" viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <mask id=${mascara}>
          <rect width="512" height="512" fill="#fff"></rect>
          <circle cx="256" cy="424" r="74" fill="#000"></circle>
        </mask>
      </defs>
      <g mask="url(#${mascara})" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M108 150 V170 M404 150 V170 M108 230 V250 M404 230 V250" stroke=${color} stroke-opacity="0.6" stroke-width="10"></path>
        <g fill=${color} fill-opacity="0.6">
          <rect x="88" y="168" width="40" height="14" rx="7"></rect>
          <rect x="384" y="168" width="40" height="14" rx="7"></rect>
          <rect x="88" y="248" width="40" height="14" rx="7"></rect>
          <rect x="384" y="248" width="40" height="14" rx="7"></rect>
        </g>
        <g stroke=${color} stroke-width="22">
          <path d="M100 150 H412 M100 150 L243.8 95 M412 150 L268.2 95"></path>
          <path d="M100 230 H412 M100 230 L228.7 178 M412 230 L283.3 178"></path>
          <path
            d="M233.8 150 L292.7 230 M278.2 150 L219.3 230 M219.3 230 L310.9 330 M292.7 230 L201.1 330 M201.1 330 L336 468 M310.9 330 L176 468"
          ></path>
          <path d="M176 468 L256 28 L336 468"></path>
        </g>
        <path d="M150 484 H362" stroke=${color} stroke-width="22"></path>
      </g>
      <circle cx="256" cy="424" r="60" fill=${color}></circle>
      <text x="256" y="426" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84"
        text-anchor="middle" dominant-baseline="central">€</text>
    </svg>`;
  }


  _hora(h) {
    return `${String(h).padStart(2, "0")}:00`;
  }

  /** Fecha de hoy (o `dias` después) en la zona de HA, en el formato del idioma. */
  _fecha(dias = 0) {
    // Mediodía UTC del día calculado, formateado en UTC: el mismo día en cualquier navegador.
    const d = new Date(`${fechaIso(new Date(), zonaDeHA(this.hass), dias)}T12:00:00Z`);
    return new Intl.DateTimeFormat(this._idiomas, {
      timeZone: "UTC",
    }).format(d);
  }

  _triangulo(tipo, color) {
    return html`<svg class="tri" viewBox="0 0 24 24" aria-hidden="true"><path d=${TRIANGULO[tipo]} fill=${color}></path></svg>`;
  }

  /**
   * Mínimo y máximo de cada día. `extremos: columnas` (por defecto, como en la tarjeta antigua):
   * hoy a la izquierda y mañana a la derecha. `extremos: filas`: un día por fila, el mínimo a la
   * izquierda y el máximo a la derecha, y mañana debajo de hoy.
   */
  _detalles(hoy, manana, inyeccion) {
    const t = this._t;
    const linea = (tipo, color, punto) =>
      html`<div class="detalle">
        ${this._triangulo(tipo, color)}
        <div>
          ${punto
            ? html`<div class="valor">${this._num(punto.precio, 5)} €/kWh</div>
                <div class="horas">${this._hora(punto.hora)} - ${this._hora(punto.hora + 1)}</div>`
            : html`<div class="valor">${t.no_disponible}</div>`}
        </div>
      </div>`;
    const columna = (puntos, color, hueco = "") => {
      const e = extremos(puntos);
      return html`<div class="columna">${linea(`min${hueco}`, color, e?.min)}${linea(`max${hueco}`, color, e?.max)}</div>`;
    };
    const fila = (puntos, color, hueco = "") => {
      const e = extremos(puntos);
      return html`<div class="fila">${linea(`min${hueco}`, color, e?.min)}${linea(`max${hueco}`, color, e?.max)}</div>`;
    };
    const parte = this._config.extremos === "filas" ? fila : columna;
    // Sin precios de mañana (se publican hacia las 20:30) la columna o la fila de mañana no sale.
    const bloque = (h, m, hueco) =>
      html`<div class="detalles ${this._config.extremos === "filas" ? "en-filas" : ""}">
        ${parte(h, this._cHoy, hueco)}${m.length
          ? parte(m, this._cManana, hueco)
          : this._config.extremos === "filas"
            ? nothing
            : this._columnaFantasma(linea, hueco)}
      </div>`;
    return html`${bloque(hoy, manana)}${inyeccion ? bloque(inyeccion.hoy, inyeccion.manana, "_hueco") : nothing}`;
  }

  /** Sin mañana, una columna invisible en su sitio: la cabecera se alinea igual con o sin mañana. */
  _columnaFantasma(linea, hueco) {
    const muestra = { precio: -0.00001, hora: 0 };
    return html`<div class="columna fantasma" aria-hidden="true">
      ${linea(`min${hueco}`, this._cManana, muestra)}${linea(`max${hueco}`, this._cManana, muestra)}
    </div>`;
  }

  _factura() {
    const t = this._t;
    if (this._config.factura === "hidden") return null;
    const lineas = [];
    const idAnterior = this._config.entity_factura_anterior || buscarEntidad(this.hass, "sensor.pvpc_bs_factura_anterior");
    const idActual = this._config.entity_factura_actual || buscarEntidad(this.hass, "sensor.pvpc_bs_factura_actual");
    // dd/mm de una fecha ISO; el periodo, «(dd/mm - dd/mm)»
    const dm = (iso) => (typeof iso === "string" ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");
    const periodo = (desde, hasta) => (desde && hasta ? ` (${dm(desde)} - ${dm(hasta)})` : "");
    const linea = (texto, fechas, importe, extra = nothing) =>
      html`<div>${texto}<span class="sin-corte">${fechas}</span>: <b class="sin-corte">${this._num(importe, 2)} €</b>${extra}</div>`;

    // 1. Periodo anterior
    const anterior = idAnterior && this.hass.states[idAnterior];
    if (this._config.factura_anterior && anterior && Number.isFinite(Number(anterior.state))) {
      const a = anterior.attributes || {};
      lineas.push(linea(t.anterior, periodo(a.inicio, a.fin), Number(anterior.state)));
    }
    // 2. Periodo en curso (lo gastado hasta hoy) y 3. factura estimada al cierre (opcional)
    const actual = idActual && this.hass.states[idActual];
    // Cada línea con su interruptor: la estimada sale aunque la de «en curso» esté apagada.
    if (actual && Number.isFinite(Number(actual.state))) {
      const a = actual.attributes || {};
      const hoyIso = fechaIso(new Date(), zonaDeHA(this.hass));
      if (this._config.factura_actual && typeof a.acumulado === "number") {
        lineas.push(linea(t.en_curso, periodo(a.inicio, hoyIso), a.acumulado));
      }
      if (this._config.prevision !== false) {
        lineas.push(linea(t.estimada_cierre, periodo(a.inicio, a.fin_previsto), Number(actual.state)));
      }
    }
    return lineas.length ? lineas : null;
  }


  _grafica(hoy, manana, coloresHoy, coloresManana, ahora, periodos, inyeccion) {
    const t = this._t;
    if (!hoy.length) return html`<div class="aviso">${t.sin_precio}</div>`;
    const cHoy = this._cHoy;
    const cManana = this._cManana;
    const { ancho, alto } = lienzo(this._anchoUtil, 190, 300);
    const m = { izq: 38, der: 16, arr: 24, aba: 24 };
    const series = [
      { puntos: hoy, color: cHoy },
      { puntos: manana, color: cManana },
      ...(inyeccion
        ? [
            { puntos: inyeccion.hoy, color: cHoy, punteada: true },
            { puntos: inyeccion.manana, color: cManana, punteada: true },
          ]
        : []),
    ].filter((s) => s.puntos.length);
    const todos = series.flatMap((s) => s.puntos.map((p) => p.precio));
    let min = Math.min(0, ...todos);
    let max = Math.max(...todos);
    if (max - min < 0.01) max = min + 0.01;
    const margen = (max - min) * 0.08; // sitio para los triángulos
    min -= Math.min(0, ...todos) < 0 ? margen : 0;
    max += margen;
    const n = Math.max(hoy.length, manana.length, 24);
    const hueco = (ancho - m.izq - m.der) / n;
    // Cada hora es un escalón: empieza en x0(i) y acaba en x0(i + 1), como en la tarjeta antigua.
    const x0 = (i) => m.izq + hueco * i;
    const x = (i) => x0(i) + hueco / 2;
    const y = (v) => m.arr + (alto - m.arr - m.aba) * (1 - (v - min) / (max - min));
    const escalones = (puntos) =>
      puntos
        .map((p, i) => `${i ? "V" : `M${x0(0).toFixed(1)},`}${y(p.precio).toFixed(1)}H${x0(i + 1).toFixed(1)}`)
        .join("");
    const tramo = (puntos, colores, i) =>
      svg`<line class="tramo" x1=${x0(i)} x2=${x0(i + 1)}
        y1=${y(puntos[i].precio)} y2=${y(puntos[i].precio)} stroke=${COLORES[colores[i] ?? 0]}></line>`;
    const marca = (puntos, color, cual) => {
      const e = extremos(puntos);
      const i = puntos.indexOf(e[cual]);
      const yy = y(e[cual].precio) + (cual === "max" ? -11 : 4);
      return svg`<svg class="marca" x=${x(i) - 4.5} y=${yy} width="9" height="9" viewBox="0 0 24 24">
        <path d=${TRIANGULO[cual]} fill=${color}></path></svg>`;
    };
    const paso = (max - min) / 4;
    const marcas = [0, 1, 2, 3, 4].map((k) => min + paso * k);
    const cursor = this._cursor;
    const punto = (puntos, color, i, clase) =>
      svg`<circle class=${clase} cx=${x(i)} cy=${y(puntos[i].precio)} r="3" fill=${color}></circle>`;
    // «precio»: hoy por precio; «precio_manana»: mañana por precio. Una config antigua con
    // «precio_ambos» (ya no existe) se trata como «precio».
    const porPrecio = this._config.colores === "precio" || this._config.colores === "precio_ambos";
    const mananaPorPrecio = this._config.colores === "precio_manana";
    // «00:00» mide unas 27 unidades: con poco ancho, una etiqueta cada 6 h (la rejilla sigue igual).
    const horasPorEtiqueta = cadaCuantas(hueco * 3, 28);

    const titulo = this._config.titulo_grafica ?? "PVPC";
    return html`
      <div class="grafica">
        ${titulo ? html`<div class="titulo-seccion">${titulo}</div>` : nothing}
        <svg
          viewBox="0 0 ${ancho} ${alto}"
          role="img"
          style="--grosor: ${this._config.grosor === "1.5" ? 1.5 : 2.5}"
          aria-label=${t.titulo}
          @pointermove=${(ev) => this._mover(ev, ancho, m, n)}
          @pointerleave=${() => (this._cursor = undefined)}
        >
          <text class="eje" x=${m.izq - 4} y=${m.arr - 12} text-anchor="end">€/kWh</text>
          ${periodos
            ? periodos.map((p, i) =>
                p === "P3"
                  ? nothing
                  : svg`<rect class=${p === "P1" ? "banda-punta" : "banda-llano"} x=${x0(i)}
                      y=${m.arr} width=${hueco} height=${alto - m.arr - m.aba}></rect>`,
              )
            : nothing}
          ${ahora >= 0
            ? svg`<rect class="ahora" x=${x0(ahora)} y=${m.arr} width=${hueco} height=${alto - m.arr - m.aba}></rect>`
            : nothing}
          ${marcas.map(
            (v) => svg`<line class="rejilla" x1=${m.izq} x2=${ancho - m.der} y1=${y(v)} y2=${y(v)}></line>
              <text class="eje" x=${m.izq - 4} y=${y(v) + 3} text-anchor="end">${this._num(Math.abs(v) < 0.005 ? 0 : v, 2)}</text>`,
          )}
          ${[0, 3, 6, 9, 12, 15, 18, 21, 24].map(
            (h, k) => svg`<line class="rejilla" x1=${x0(h)} x2=${x0(h)} y1=${m.arr} y2=${alto - m.aba}></line>
              ${k % horasPorEtiqueta
                ? nothing
                : svg`<text class="eje" x=${x0(h)} y=${alto - 8} text-anchor="middle">${this._hora(h)}</text>`}`,
          )}
          ${series.map(
            (s) =>
              svg`<path class="serie ${s.punteada ? "punteada" : ""}"
                d=${escalones(s.puntos)}
                stroke=${(porPrecio && s.puntos === hoy) || (mananaPorPrecio && s.puntos === manana)
                  ? "var(--secondary-text-color)"
                  : s.color}></path>`,
          )}
          ${porPrecio ? hoy.map((_, i) => tramo(hoy, coloresHoy, i)) : nothing}
          ${mananaPorPrecio ? manana.map((_, i) => tramo(manana, coloresManana, i)) : nothing}
          ${series.flatMap((s) => [marca(s.puntos, s.color, "max"), marca(s.puntos, s.color, "min")])}
          ${cursor !== undefined ? svg`<line class="cursor" x1=${x(cursor)} x2=${x(cursor)} y1=${m.arr} y2=${alto - m.aba}></line>` : nothing}
          ${cursor !== undefined && cursor < hoy.length ? punto(hoy, cHoy, cursor, "p-hoy") : nothing}
          ${cursor !== undefined && cursor < manana.length ? punto(manana, cManana, cursor, "p-manana") : nothing}
        </svg>
        <div class="leyenda">
          ${cursor !== undefined
            ? html`<span
                  ><b>${this._hora((hoy[cursor] ?? manana[cursor])?.hora ?? cursor)} - ${this._hora(
                    ((hoy[cursor] ?? manana[cursor])?.hora ?? cursor) + 1,
                  )}</b>${periodos?.[cursor] ? html` · ${t.periodos[periodos[cursor]]}` : nothing}</span
                >
                ${hoy[cursor]
                  ? html`<span><i class="bolita" style="background:${cHoy}"></i>${this._num(hoy[cursor].precio, 5)}</span>`
                  : nothing}
                ${manana[cursor]
                  ? html`<span><i class="bolita" style="background:${cManana}"></i>${this._num(manana[cursor].precio, 5)}</span>`
                  : nothing}`
            : html`<span
                  ><i class="bolita" style="background:${porPrecio ? MULTICOLOR : cHoy}"></i>${this._fecha(0)}</span
                >${manana.length
                  ? html`<span><i class="bolita" style="background:${mananaPorPrecio ? MULTICOLOR : cManana}"></i>${this._fecha(1)}</span>`
                  : nothing}${ahora >= 0 ? html`<span class="l-ahora">${t.hora_actual}</span>` : nothing}${periodos
                  ? html`<span class="l-punta">${t.periodos.P1}</span><span class="l-llano">${t.periodos.P2}</span>`
                  : nothing}`}
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    // Al cambiar el ancho, se vuelven a medir las gráficas y a alinear la factura de la cabecera.
    this._observador ??= new ResizeObserver(() => {
      this._medirAncho();
      this._alinearFactura();
    });
    this._observador.observe(this);
    this._programarCambioDeHora();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observador?.disconnect();
    clearTimeout(this._temporizadorHora);
  }

  /** Ancho útil de la tarjeta en px, para el lienzo de las gráficas. */
  _medirAncho() {
    const contenedor = this.renderRoot?.querySelector(".contenedor");
    if (!contenedor?.clientWidth) return;
    const ancho = contenedor.clientWidth - 32; // padding del contenedor
    // Con menos de 2 px de diferencia no se redibuja: una barra de scroll no debe provocar vaivenes.
    if (Math.abs(ancho - (this._anchoUtil ?? 0)) >= 2) this._anchoUtil = ancho;
  }

  /**
   * Cabecera alineada con la columna de mañana de los mínimos y máximos: el «€» de «€/kWh»
   * del precio grande y el «€» final de las líneas de factura acaban en la misma vertical que
   * la «h» de «€/kWh» de mañana (no en el borde derecho de la tarjeta).
   */
  _alinearFactura() {
    const actual = this.renderRoot?.querySelector(".cabecera .actual");
    if (!actual) return;
    const precio = actual.querySelector(".precio");
    const resto = [...actual.querySelectorAll(".factura.arriba")];
    const iny = actual.querySelector(".precio-iny");
    for (const e of [precio, iny, ...resto]) if (e) e.style.marginRight = "";
    const abajoDerecha = this.renderRoot.querySelector(".factura.derecha");
    if (abajoDerecha) abajoDerecha.style.marginRight = "";
    const hueco = iny?.querySelector(".iny-hueco");
    if (hueco) hueco.style.width = "";
    const columnas = this.renderRoot.querySelectorAll(".detalles .columna");
    // En filas, la referencia es la columna de los máximos (a la derecha de cada fila).
    const maximos = this.renderRoot.querySelectorAll(".detalles .fila > .detalle:last-child");
    const icono = this.renderRoot.querySelector(".cabecera .icono");
    // Ancho reservado para un valor: el más ancho que haya o «-0,00000 €/kWh», lo que sea mayor. Así
    // la cabecera no baila al quitar mañana ni cuando mañana trae un precio negativo.
    const anchoValores = (c) => {
      const valores = [...c.querySelectorAll(".valor, .horas")];
      const muestra = c.querySelector(".valor");
      let ancho = Math.max(0, ...valores.map((e) => e.getBoundingClientRect().width));
      if (muestra) {
        const sonda = muestra.cloneNode(false);
        sonda.textContent = `-${this._num(0, 5)} €/kWh`;
        sonda.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
        muestra.parentElement.appendChild(sonda);
        ancho = Math.max(ancho, sonda.getBoundingClientRect().width);
        sonda.remove();
      }
      return ancho;
    };
    let derecha;
    if (columnas.length >= 2) {
      // La 2.ª columna (mañana o, sin mañana, la fantasma) va centrada en su mitad de la rejilla y
      // mide lo que su texto: con valores distintos cambia de ancho y de sitio. La referencia es su
      // borde derecho con el ancho reservado («-0,00000 €/kWh»), medido desde el centro de esa
      // mitad: así es la misma con mañana, sin mañana o sin mínimos y máximos.
      const col = columnas[1];
      const rejilla = col.parentElement.getBoundingClientRect();
      const hueco = parseFloat(getComputedStyle(col.parentElement).columnGap) || 0;
      const mitad = (rejilla.width - hueco) / 2;
      const centro = rejilla.left + mitad + hueco + mitad / 2;
      const valor = col.querySelector(".valor")?.getBoundingClientRect().width ?? 0;
      const ancho = col.getBoundingClientRect().width + Math.max(0, anchoValores(col) - valor);
      derecha = centro + ancho / 2;
    } else if (maximos.length) {
      // En filas, la misma vertical que en columnas (centro de la 2.ª mitad de la rejilla más la
      // mitad del ancho reservado de un mínimo/máximo): cambiar la disposición no mueve la cabecera.
      const d = maximos[0];
      const caja = d.closest(".detalles");
      const rejilla = caja.getBoundingClientRect();
      const hueco = parseFloat(getComputedStyle(caja).columnGap) || 0;
      const mitad = (rejilla.width - hueco) / 2;
      const centro = rejilla.left + mitad + hueco + mitad / 2;
      const valor = d.querySelector(".valor")?.getBoundingClientRect().width ?? 0;
      const ancho = d.getBoundingClientRect().width + Math.max(0, anchoValores(d) - valor);
      derecha = centro + ancho / 2;
    }
    if (!Number.isFinite(derecha) || !actual.offsetParent) return;
    // Sin pisar el icono: lo que más se mueva, como mucho hasta 12 px de él.
    const tope = (e) =>
      icono ? e.getBoundingClientRect().left - icono.getBoundingClientRect().right - 12 : Infinity;
    const mover = (e, cuanto) => {
      const m = Math.min(cuanto, tope(e));
      if (m > 0) e.style.marginRight = `${m}px`;
    };
    const euro = precio?.querySelector(".euro");
    if (euro) mover(precio, euro.getBoundingClientRect().right - derecha);
    // Lo de debajo del precio, en la vertical del «€» ya colocado (el icono puede haberlo frenado).
    const objetivo = euro ? euro.getBoundingClientRect().right : derecha;
    for (const e of resto) mover(e, e.getBoundingClientRect().right - objetivo);
    this._alinearIny(precio, iny);
    // La factura bajo la gráfica a la derecha, en la misma vertical que tendría arriba.
    const abajo = this.renderRoot.querySelector(".factura.derecha");
    if (abajo) {
      abajo.style.marginRight = "";
      const m = abajo.getBoundingClientRect().right - objetivo;
      if (m > 0) abajo.style.marginRight = `${m}px`;
    }
  }

  /** Coma del precio de excedentes bajo la coma grande y su «€» bajo el «€» de «€/kWh». */
  _alinearIny(precio, iny) {
    const comaG = precio?.querySelector(".coma");
    const euroG = precio?.querySelector(".euro");
    const comaP = iny?.querySelector(".iny-coma");
    const euroP = iny?.querySelector(".iny-euro");
    const hueco = iny?.querySelector(".iny-hueco");
    if (!comaG || !euroG || !comaP || !euroP || !hueco) return;
    const x = (e) => e.getBoundingClientRect();
    // 1) El hueco entre decimales y «€», para que coma→€ mida lo mismo que en el precio grande.
    hueco.style.width = "0px";
    const falta = x(euroG).left - x(comaG).left - (x(euroP).left - x(comaP).left);
    hueco.style.width = `${Math.max(0, falta)}px`;
    // 2) Todo el bloque a la izquierda hasta que su «€» quede bajo el grande (y así también la coma).
    // Puede ser negativo (unos px a la derecha): «/kWh» pequeño es algo más ancho que el del precio.
    const m = x(euroP).left - x(euroG).left;
    if (Math.abs(m) > 0.1) iny.style.marginRight = `${m}px`;
  }

  updated(cambios) {
    super.updated?.(cambios);
    // Medir y alinear solo cuando cambian los datos o el tamaño (no con el cursor ni el anexo).
    if (["hass", "_config", "_anchoUtil", "_facturas"].some((k) => cambios.has(k))) {
      this._medirAncho();
      this._alinearFactura();
    }
    if (cambios.has("_ventana") && this._ventana) {
      const dialogo = this.renderRoot.querySelector("dialog.ventana");
      if (dialogo && !dialogo.open) dialogo.showModal();
    }
    if (!this.hass || !this._config?.grafica_facturas || this._cargandoFacturas) return;
    if (this._facturasDelSensor()) return;
    const clave = `${this._config.estadistica_facturas || ""}|${this._config.facturas_meses}`;
    const caducada = !this._facturasHora || Date.now() - this._facturasHora > 3 * 3600 * 1000;
    if (caducada || clave !== this._facturasClave) this._cargarFacturas(clave);
  }

  /**
   * Las facturas cerradas del atributo `facturas` del sensor de factura en curso (v1.1.6+),
   * con `real` (factura introducida) o calculadas con el consumo. Sin él, la estadística.
   */
  _facturasDelSensor() {
    if (this._config.estadistica_facturas) return null;
    const id = this._config.entity_factura_actual || buscarEntidad(this.hass, "sensor.pvpc_bs_factura_actual");
    const lista = this.hass?.states[id]?.attributes?.facturas;
    if (!Array.isArray(lista)) return null;
    const cuantas = Math.max(1, Number(this._config.facturas_meses) || 6);
    return lista
      .filter((f) => Number.isFinite(Number(f.total)) && f.inicio)
      .map((f) => {
        // Primer día facturado (el día siguiente a la lectura anterior), como la estadística.
        const [a, m, d] = String(f.inicio).split("-").map(Number);
        // Mediodía UTC: el mismo día en cualquier zona (el mes se pinta en la de HA).
        return { inicio: new Date(Date.UTC(a, m - 1, d + 1, 12)), total: Number(f.total), real: f.real !== false };
      })
      .slice(-cuantas);
  }

  /** Las facturas cerradas: una fila de la estadística `pvpc_bonosocial:facturas_*` por factura. */
  async _cargarFacturas(clave) {
    this._cargandoFacturas = true;
    this._facturasClave = clave;
    this._facturasHora = Date.now();
    try {
      let id = this._config.estadistica_facturas;
      if (!id) {
        const lista = await this.hass.callWS({ type: "recorder/list_statistic_ids", statistic_type: "mean" });
        id = lista.map((e) => e.statistic_id).find((e) => e.startsWith("pvpc_bonosocial:facturas_"));
      }
      if (!id) {
        this._facturas = [];
        return;
      }
      const cuantas = Math.max(1, Number(this._config.facturas_meses) || 6);
      const desde = new Date(Date.now() - (cuantas + 2) * 35 * 86400 * 1000);
      const datos = await this.hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: desde.toISOString(),
        statistic_ids: [id],
        period: "hour",
        types: ["max"],
      });
      this._facturas = (datos[id] || [])
        .filter((f) => Number.isFinite(Number(f.max)))
        .map((f) => ({ inicio: new Date(f.start), total: Number(f.max), real: true }))
        .slice(-cuantas);
    } catch (err) {
      console.warn("pvpc-bono-social-card: no se pudieron leer las facturas", err);
      this._facturas = [];
    } finally {
      this._cargandoFacturas = false;
    }
  }

  _graficaFacturas() {
    const t = this._t;
    const facturas = this._facturasDelSensor() ?? this._facturas;
    const titulo = this._config.titulo_facturas ?? t.facturas;
    const cabecera = titulo ? html`<div class="titulo-seccion">${titulo}</div>` : nothing;
    if (!facturas) return nothing;
    if (!facturas.length) return html`<div class="facturas">${cabecera}<div class="aviso">${t.sin_facturas}</div></div>`;
    const color = colorCss(this._config.color_facturas, this._cHoy);
    const conImporte = this._config.facturas_importe !== false;
    const { ancho, alto } = lienzo(this._anchoUtil, 150, 220);
    const m = { izq: 8, der: 8, arr: conImporte ? 18 : 6, aba: 20 };
    const max = Math.max(...facturas.map((f) => f.total), 1);
    const hueco = (ancho - m.izq - m.der) / facturas.length;
    const barra = Math.min(hueco * 0.6, 56);
    // Con muchas barras o poco ancho, una etiqueta de cada tantas: la última, la factura más reciente.
    const ultima = facturas.length - 1;
    const importeMasLargo = Math.max(...facturas.map((f) => this._num(f.total, 2).length + 2));
    const cadaImporte = cadaCuantas(hueco, importeMasLargo * 6.2);
    const y = (v) => m.arr + (alto - m.arr - m.aba) * (1 - Math.max(v, 0) / max);
    const idioma = this._idiomas;
    const zona = zonaDeHA(this.hass);
    let formato;
    try {
      formato = new Intl.DateTimeFormat(idioma, { month: "short", year: "2-digit", ...(zona ? { timeZone: zona } : {}) });
    } catch {
      formato = new Intl.DateTimeFormat(idioma, { month: "short", year: "2-digit" });
    }
    // Solo mes y año: en catalán y gallego el formato lleva «del»/«de» y las etiquetas se pisan.
    const mes = {
      format: (fecha) => {
        const partes = formato.formatToParts(fecha);
        const parte = (tipo) => partes.find((p) => p.type === tipo)?.value ?? "";
        return `${parte("month")} ${parte("year")}`;
      },
    };
    const mesMasLargo = Math.max(...facturas.map((f) => mes.format(f.inicio).length));
    const cadaMes = cadaCuantas(hueco, mesMasLargo * 5.2);
    return html`
      <div class="facturas">
        ${cabecera}
        <svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-label=${titulo || t.facturas}>
          <line class="rejilla" x1=${m.izq} x2=${ancho - m.der} y1=${alto - m.aba} y2=${alto - m.aba}></line>
          ${facturas.map((f, i) => {
            const cx = m.izq + hueco * (i + 0.5);
            // Factura real, rellena; calculada con el consumo, solo el borde.
            return svg`<rect class="barra ${f.real ? "real" : "calculada"}" x=${cx - barra / 2 + (f.real ? 0 : 1)}
                y=${y(f.total) + (f.real ? 0 : 1)} width=${barra - (f.real ? 0 : 2)}
                height=${Math.max(alto - m.aba - y(f.total) - (f.real ? 0 : 1), 0)} rx="3"
                fill=${f.real ? color : "none"} stroke=${color}>
                <title>${mes.format(f.inicio)}: ${this._num(f.total, 2)} € (${f.real ? t.real : t.calculada})</title></rect>
              ${(ultima - i) % cadaMes
                ? nothing
                : svg`<text class="eje" x=${cx} y=${alto - 6} text-anchor="middle">${mes.format(f.inicio)}</text>`}`;
          })}
          ${this._config.facturas_tendencia && facturas.length > 1 ? this._tendencia(facturas, hueco, m, y) : nothing}
          ${conImporte
            ? facturas.map((f, i) =>
                (ultima - i) % cadaImporte
                  ? nothing
                  : svg`<text class="importe" x=${m.izq + hueco * (i + 0.5)} y=${y(f.total) - 5}
                    text-anchor="middle">${this._num(f.total, 2)} €</text>`,
              )
            : nothing}
        </svg>
        ${facturas.some((f) => !f.real)
          ? html`<div class="leyenda">
              ${facturas.some((f) => f.real)
                ? html`<span><i class="bolita cuadro" style="background:${color}"></i>${t.factura_real}</span>`
                : nothing}
              <span><i class="bolita cuadro" style="border:2px solid ${color}"></i>${t.calculada_consumo}</span>
            </div>`
          : nothing}
      </div>
    `;
  }

  /** Recta de mínimos cuadrados sobre los importes, de la primera barra a la última. */
  _tendencia(facturas, hueco, m, y) {
    const n = facturas.length;
    const media = (n - 1) / 2;
    const mediaY = facturas.reduce((a, f) => a + f.total, 0) / n;
    let num = 0;
    let den = 0;
    facturas.forEach((f, i) => {
      num += (i - media) * (f.total - mediaY);
      den += (i - media) ** 2;
    });
    const pendiente = num / den;
    const valor = (i) => mediaY + pendiente * (i - media);
    const x = (i) => m.izq + hueco * (i + 0.5);
    return svg`<line class="tendencia" x1=${x(0)} y1=${y(valor(0))} x2=${x(n - 1)} y2=${y(valor(n - 1))}></line>`;
  }

  _mover(ev, ancho, m, n) {
    const caja = ev.currentTarget.getBoundingClientRect();
    const xs = ((ev.clientX - caja.left) / caja.width) * ancho;
    const i = Math.floor(((xs - m.izq) / (ancho - m.izq - m.der)) * n);
    this._cursor = i >= 0 && i < n ? i : undefined;
  }

  static styles = css`
    :host {
      --pvpc-bs-verde: var(--success-color, #43a047);
      --pvpc-bs-amarillo: #f9c80e;
      --pvpc-bs-naranja: var(--warning-color, #fb8c00);
      --pvpc-bs-rojo: var(--error-color, #e53935);
    }
    /* Sin mínimos y máximos: su rejilla, invisible y sin alto, solo para alinear la cabecera igual. */
    .referencia {
      height: 0;
      overflow: hidden;
      visibility: hidden;
      margin-top: -12px;
    }
    .contenedor {
      container-type: inline-size;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    /* El icono a la izquierda; el precio y las facturas, en la columna de la derecha. */
    .cabecera {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .icono {
      flex: none;
      width: 75px;
      height: 75px;
    }
    .nombre {
      flex: 1;
      min-width: 0;
      font-size: 1.15em;
      color: var(--primary-text-color);
    }
    @container (max-width: 380px) {
      .nombre {
        font-size: 1em;
      }
      .precio {
        font-size: 1.6em;
      }
    }
    .actual {
      text-align: right;
    }
    .sin-corte {
      white-space: nowrap;
    }
    .precio {
      white-space: nowrap;
      font-size: 1.9em;
      font-weight: 700;
      line-height: 1.1;
      color: var(--primary-text-color);
    }
    .iny-hueco {
      display: inline-block;
    }
    .precio-iny {
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }
    .cola {
      font-size: 0.45em;
    }
    .unidad {
      font-size: 0.45em;
      color: var(--primary-text-color);
    }
    /* Hoy centrado en la mitad izquierda y mañana en la derecha (aunque mañana no esté). */
    .detalles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
    }
    .columna.fantasma {
      visibility: hidden;
    }
    .columna {
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-self: center;
    }
    /* En filas: un día por fila, mínimo a la izquierda y máximo a la derecha. Las dos columnas
       miden lo que su dato más largo, para que los triángulos de hoy y mañana queden alineados. */
    .detalles.en-filas {
      grid-template-columns: repeat(2, max-content);
      justify-content: space-around;
      row-gap: 8px;
    }
    .fila {
      display: contents;
    }
    .detalle {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .tri {
      flex: none;
      width: 24px;
      height: 24px;
      margin: 0 4px;
    }
    .detalle .valor {
      font-weight: 700;
      font-size: 0.95em;
      color: var(--primary-text-color);
    }
    .detalle .horas {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .detalle .valor,
    .detalle .horas {
      white-space: nowrap;
    }
    @container (max-width: 380px) {
      .detalle {
        gap: 6px;
      }
      .tri {
        width: 18px;
        height: 18px;
        margin: 0;
      }
      .detalle .valor {
        font-size: 0.85em;
      }
    }
    /* El mínimo que anuncia la tarjeta (6 columnas): dos columnas de precios tienen que caber. */
    @container (max-width: 250px) {
      .precio {
        font-size: 1.4em;
      }
      .detalles {
        column-gap: 6px;
      }
      .detalle {
        gap: 3px;
      }
      .tri {
        width: 14px;
        height: 14px;
      }
      .detalle .valor {
        font-size: 0.78em;
      }
      .detalle .horas {
        font-size: 0.72em;
      }
    }
    .grafica > svg {
      width: 100%;
      height: auto;
      display: block;
      touch-action: pan-y;
    }
    .rejilla {
      stroke: var(--divider-color, #e0e0e0);
      stroke-width: 1;
    }
    .eje {
      fill: var(--secondary-text-color);
      font-size: 10px;
    }
    /* Grosor de las líneas (opción «grosor»: 1,5 o 2,5). */
    .serie {
      fill: none;
      stroke-width: var(--grosor, 2.5);
    }
    /* Excedentes: mismo grosor que hoy y mañana, en puntos redondos (hueco proporcional). */
    .serie.punteada {
      stroke-width: var(--grosor, 2.5);
      stroke-dasharray: 0.1 calc(var(--grosor, 2.5) * 2);
      stroke-linecap: round;
    }
    .tramo {
      stroke-width: calc(var(--grosor, 2.5) + 0.5);
      stroke-linecap: square;
    }
    .titulo-seccion {
      font-size: 0.95em;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    .facturas > svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .tendencia {
      stroke: var(--primary-text-color);
      stroke-width: 1.5;
      stroke-dasharray: 5 4;
      opacity: 0.7;
    }
    .barra.calculada {
      stroke-width: 2;
    }
    .bolita.cuadro {
      border-radius: 2px;
      box-sizing: border-box;
    }
    .importe {
      fill: var(--primary-text-color);
      stroke: var(--card-background-color, var(--ha-card-background, #fff));
      stroke-width: 3px;
      paint-order: stroke;
      font-size: 12px;
      font-weight: 600;
    }
    .banda-punta {
      fill: var(--pvpc-bs-rojo);
      fill-opacity: 0.08;
    }
    .banda-llano {
      fill: var(--pvpc-bs-amarillo);
      fill-opacity: 0.1;
    }
    .l-punta,
    .l-llano {
      text-transform: capitalize;
    }
    .l-punta::before,
    .l-llano::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-right: 4px;
      vertical-align: middle;
      background: var(--pvpc-bs-rojo);
      opacity: 0.25;
    }
    .l-llano::before {
      background: var(--pvpc-bs-amarillo);
      opacity: 0.4;
    }
    .l-ahora::before {
      content: "";
      display: inline-block;
      width: 10px;
      height: 10px;
      margin-right: 4px;
      vertical-align: middle;
      background: var(--divider-color, #e0e0e0);
    }
    .ahora {
      fill: var(--divider-color, #e0e0e0);
      fill-opacity: 0.8;
    }
    .cursor {
      stroke: var(--primary-text-color);
      stroke-opacity: 0.4;
      stroke-width: 1;
    }
    .leyenda {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 12px;
      justify-content: center;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      min-height: 1.3em;
    }
    .bolita {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: -1px;
    }
    .factura {
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: var(--primary-text-color);
    }
    .factura.arriba {
      font-size: 0.85em;
      align-items: flex-end;
      text-align: right;
      margin-top: 6px;
    }
    /* Bajo la gráfica (izquierda o derecha) y en pantallas estrechas: mismo tamaño que en la cabecera. */
    .factura.abajo {
      font-size: 0.85em;
    }
    .precio.oculto,
    .precio-iny.oculto {
      visibility: hidden;
    }
    /* A la derecha, además, en la vertical de los € de la cabecera. */
    .factura.derecha {
      align-items: flex-end;
      text-align: right;
    }
    .factura.estrecha {
      display: none;
    }
    /* En pantallas estrechas la factura de la cabecera pasa abajo. */
    @container (max-width: 380px) {
      .factura.arriba {
        display: none;
      }
      .factura.estrecha {
        display: flex;
      }
    }
    button.abrir {
      flex: none;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 12px;
      line-height: 0;
    }
    button.abrir:focus-visible {
      outline: 2px solid var(--primary-color);
    }
    dialog.ventana {
      padding: 0;
      border: none;
      border-radius: var(--ha-dialog-border-radius, 24px);
      width: min(560px, calc(100vw - 32px));
      max-height: calc(100vh - 64px);
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
      overflow: auto;
    }
    dialog.ventana::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
    @media (max-width: 600px) {
      dialog.ventana {
        width: 100vw;
        max-width: 100vw;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }
    .ventana-cabecera {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px 0;
      position: sticky;
      top: 0;
      z-index: 1;
      background: inherit;
    }
    .ventana-titulo {
      font-size: 1.3em;
      font-weight: 500;
    }
    button.cerrar {
      width: 40px;
      height: 40px;
      padding: 8px;
      border: none;
      border-radius: 50%;
      background: none;
      cursor: pointer;
      color: var(--primary-text-color);
    }
    button.cerrar:hover {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.15));
    }
    button.cerrar svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .ventana-cuerpo {
      background: var(--card-background-color, var(--ha-card-background, #fff));
    }
    /* Comparativa: anexo a la derecha de la ventana; en pantallas estrechas, debajo. */
    dialog.ventana.con-anexo {
      width: min(1060px, calc(100vw - 32px));
    }
    dialog.con-anexo .ventana-cuerpo {
      display: grid;
      grid-template-columns: minmax(0, 560px) minmax(0, 1fr);
      /* Las dos columnas igual de altas: «Enviar» queda a la altura de «Comparar tarifas» y solo
         baja si el anexo necesita más líneas. */
      align-items: stretch;
    }
    @media (max-width: 900px) {
      dialog.con-anexo .ventana-cuerpo {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .anexo {
      display: flex;
      flex-direction: column;
      padding: 12px 18px 16px;
      border-left: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
      font-size: 0.95em;
    }
    @media (max-width: 900px) {
      .anexo {
        border-left: none;
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
      }
    }
    .anexo-pvpc {
      padding: 8px 0 2px;
      font-size: 0.8em;
      font-style: italic;
      color: var(--secondary-text-color);
    }
    .anexo-pie {
      margin-top: auto;
      /* Mismo tamaño que «Comparar tarifas» (el anexo va al 0,95). */
      font-size: calc(1em / 0.95);
    }
    .anexo-cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 40px;
    }
    .anexo-resumen {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin: 2px 0 12px;
    }
    .anexo-veredicto {
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .anexo-veredicto b {
      display: block;
      font-size: 1.05em;
      margin-bottom: 2px;
    }
    .anexo-veredicto.bueno {
      background: rgba(67, 160, 71, 0.15);
      border: 1px solid rgba(67, 160, 71, 0.5);
    }
    .anexo-veredicto.ahorro {
      background: rgba(255, 179, 0, 0.14);
      border: 1px solid rgba(255, 179, 0, 0.5);
    }
    .anexo-fila {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
    }
    .anexo-fila .n {
      font-weight: 600;
    }
    .enlace {
      color: inherit;
      text-decoration: none;
    }
    .enlace:hover {
      text-decoration: underline;
      color: var(--primary-color, #03a9f4);
    }
    a.n.enlace {
      display: inline-block;
    }
    .anexo-fila .o {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .anexo-fila .i {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .anexo-fila .d {
      text-align: right;
      font-size: 0.8em;
      white-space: nowrap;
    }
    .anexo-fila .d.mas {
      color: var(--error-color, #e57373);
    }
    .anexo-fila .d.menos,
    .anexo-fila.tuya .i {
      color: var(--success-color, #43a047);
    }
    .anexo-nota {
      font-size: 0.78em;
      color: var(--secondary-text-color);
      margin-top: 8px;
      line-height: 1.35;
    }
    .anexo-aviso,
    .anexo-espera {
      padding: 16px 0;
      color: var(--secondary-text-color);
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .anexo-aviso.error {
      color: var(--error-color, #e57373);
    }
    .girando {
      width: 18px;
      height: 18px;
      flex: none;
      border: 2px solid var(--divider-color, rgba(127, 127, 127, 0.4));
      border-top-color: var(--primary-color, #03a9f4);
      border-radius: 50%;
      animation: girar 0.9s linear infinite;
    }
    @keyframes girar {
      to {
        transform: rotate(360deg);
      }
    }
    .comparar {
      display: flex;
      justify-content: center;
      margin: 14px 0 4px;
    }
    .btn-comparar {
      border: none;
      border-radius: 18px;
      padding: 8px 18px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .btn-comparar:disabled {
      opacity: 0.6;
      cursor: progress;
    }
    :host([en-ventana]) ha-card {
      box-shadow: none;
      border: none;
      background: transparent;
    }
    .aviso {
      padding: 16px;
      color: var(--secondary-text-color);
    }
  `;
}

// --- editor visual -----------------------------------------------------------------------

const ETIQUETA_EDITOR = `${ETIQUETA}-editor`;

/** Parte de una etiqueta «español / inglés» para el idioma del usuario. */
function enSuIdioma(etiqueta, idioma) {
  const [es, en] = etiqueta.split(" / ");
  return ["es", ...COOFICIALES].includes(idioma) ? es : (en ?? es);
}

/**
 * Esquema del editor: secciones plegables (ha-form «expandable» con `flatten`, así las claves siguen
 * siendo las mismas del YAML) y, con los datos actuales, sin lo que depende de algo apagado.
 */
function esquemaEditor(idioma, d = {}) {
  const opciones = (lista) => ({
    select: {
      mode: "dropdown",
      options: lista.map(([value, label]) => ({ value, label: enSuIdioma(label, idioma) })),
    },
  });
  const si = (nombre) => ({ name: nombre, selector: { boolean: {} } });
  const seccion = (clave, icon, expanded, campos) => ({
    type: "expandable",
    name: "",
    flatten: true,
    title: enSuIdioma(SECCIONES_EDITOR[clave], idioma),
    icon,
    expanded,
    schema: campos.filter(Boolean),
  });
  const conFactura = d.factura !== "hidden";
  const conGrafica = d.graph !== false;
  const conManana = (conGrafica && d.next_day !== false) || (d.details !== false && d.extremos_manana !== false);
  const conFacturas = Boolean(d.grafica_facturas);
  return [
    seccion("cabecera", "mdi:page-layout-header", false, [
      si("current"),
      {
        name: "icon_color",
        selector: opciones([
          ["price", "Por precio / By price"],
          ["period", "Por periodo P1-P3 / By period"],
          ["fijo", "Azul fijo / Fixed blue"],
        ]),
      },
      { name: "title", selector: { text: {} } },
    ]),
    seccion("factura", "mdi:receipt-text-outline", false, [
      conFactura && si("factura_anterior"),
      conFactura && si("factura_actual"),
      conFactura && si("prevision"),
      {
        name: "factura",
        selector: opciones([
          ["header", "Arriba, junto al precio / Top, next to the price"],
          ["below_chart", "Bajo la gráfica, a la izquierda / Below the chart, left"],
          ["below_chart_right", "Bajo la gráfica, a la derecha / Below the chart, right"],
          ["hidden", "No mostrar / Don't show"],
        ]),
      },
    ]),
    seccion("extremos", "mdi:arrow-up-down", false, [
      si("details"),
      d.details !== false && si("extremos_manana"),
      // Afecta a los mínimos y máximos y a la gráfica: solo se oculta si los dos están apagados.
      // Solo si la integración tiene el sensor de excedentes (API privada de ESIOS) o ya está puesto.
      (d.details !== false || conGrafica) && (d.hay_excedentes || d.entity_injection) && si("mostrar_excedentes"),
      d.details !== false && {
        name: "extremos",
        selector: opciones([
          ["columnas", "Columnas: hoy | mañana / Columns: today | tomorrow"],
          ["filas", "Filas: un día por fila / Rows: one day per row"],
        ]),
      },
    ]),
    seccion("grafica", "mdi:chart-line", false, [
      si("graph"),
      conGrafica && si("next_day"),
      conGrafica && d.entity_injection && si("excedentes_grafica"),
      conGrafica && si("bandas"),
      conGrafica && { name: "titulo_grafica", selector: { text: {} } },
      conGrafica && {
        name: "grosor",
        selector: opciones([
          ["1.5", "Fino (1,5) / Thin (1.5)"],
          ["2.5", "Normal (2,5) / Normal (2.5)"],
        ]),
      },
      conGrafica && {
        name: "colores",
        selector: opciones([
          ["fijo", "Un color por día / One colour per day"],
          ["precio", "Hoy por precio / Today by price"],
          d.next_day !== false && ["precio_manana", "Mañana por precio / Tomorrow by price"],
        ].filter(Boolean)),
      },
      conGrafica && { name: "color_hoy", selector: { color_rgb: {} } },
      conManana && { name: "color_manana", selector: { color_rgb: {} } },
    ]),
    seccion("facturas", "mdi:chart-bar", false, [
      si("grafica_facturas"),
      conFacturas && si("facturas_importe"),
      conFacturas && si("facturas_tendencia"),
      conFacturas && { name: "facturas_meses", selector: opciones(["3", "5", "6", "9", "12"].map((v) => [v, v])) },
      conFacturas && { name: "titulo_facturas", selector: { text: {} } },
      conFacturas && { name: "color_facturas", selector: { color_rgb: {} } },
    ]),
    seccion("avanzado", "mdi:tune-variant", false, [
      { name: "entity", selector: { entity: { domain: "sensor" } } },
      { name: "entity_factura_actual", selector: { entity: { domain: "sensor" } } },
      { name: "entity_factura_anterior", selector: { entity: { domain: "sensor" } } },
      { name: "entity_injection", selector: { entity: { domain: "sensor" } } },
    ]),
  ];
}

const SECCIONES_EDITOR = {
  cabecera: "Cabecera / Header",
  factura: "Importes de la factura / Bill amounts",
  extremos: "Mínimos y máximos / Min and max",
  grafica: "Gráfica de precios / Price chart",
  facturas: "Facturas / Bills",
  avanzado: "Avanzado / Advanced",
};

/** [r, g, b] de un color de la configuración (el selector de color solo entiende eso). */
function aRgb(valor, defecto) {
  if (Array.isArray(valor) && valor.length === 3) return valor.map(Number);
  const texto = typeof valor === "string" ? valor.trim() : "";
  const hexa = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(texto)?.[1];
  if (hexa) {
    const largo = hexa.length === 3 ? [...hexa].map((c) => c + c).join("") : hexa;
    return [0, 2, 4].map((i) => parseInt(largo.slice(i, i + 2), 16));
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(texto);
  if (rgb) return rgb.slice(1, 4).map(Number);
  if (texto) {
    // Un color con nombre: que lo traduzca el navegador. Si no lo conoce, deja el negro de partida.
    const lienzo2d = document.createElement("canvas").getContext("2d");
    lienzo2d.fillStyle = "#000000";
    lienzo2d.fillStyle = texto;
    if (lienzo2d.fillStyle !== "#000000" || texto.toLowerCase() === "black") return aRgb(lienzo2d.fillStyle);
  }
  return defecto === undefined ? [0, 0, 0] : aRgb(defecto);
}

/** Lo que enseña el editor: lo que de verdad hace la tarjeta, aunque el YAML no lo diga. */
function datosEditor(config, hass) {
  const c = conDefectos(config);
  return {
    ...c,
    entity: c.entity || entidadPrecio(hass),
    entity_factura_actual: c.entity_factura_actual || buscarEntidad(hass, "sensor.pvpc_bs_factura_actual"),
    entity_factura_anterior: c.entity_factura_anterior || buscarEntidad(hass, "sensor.pvpc_bs_factura_anterior"),
    color_hoy: aRgb(c.color_hoy, COLOR_HOY),
    color_manana: aRgb(c.color_manana, COLOR_MANANA),
    color_facturas: aRgb(c.color_facturas ?? c.color_hoy, COLOR_HOY),
    facturas_meses: String(c.facturas_meses),
    grafica_facturas: Boolean(c.grafica_facturas),
    mostrar_excedentes: Boolean(c.entity_injection),
    // No es una opción: dice al editor si hay sensor de excedentes que ofrecer.
    hay_excedentes: Boolean(buscarEntidad(hass, "sensor.pvpc_bs_precio_excedentes")),
    // Lo que se ve de verdad: «PVPC» / «Facturas» si no se ha escrito nada; vacío = sin título.
    titulo_grafica: c.titulo_grafica ?? "PVPC",
    titulo_facturas: c.titulo_facturas ?? textosDe(hass).facturas,
  };
}

/** Los textos de la tarjeta en el idioma de HA (como `_t`). */
function textosDe(hass) {
  const idioma = (hass?.locale?.language || hass?.language || "es").slice(0, 2);
  if (COOFICIALES.includes(idioma)) return { ...TEXTOS.es, ...TEXTOS[idioma] };
  return TEXTOS[idioma] || TEXTOS.en;
}

/** HA carga ha-form con los editores de sus tarjetas: si no está, se le pide uno que lo use. */
async function cargarHaForm() {
  if (customElements.get("ha-form")) return;
  try {
    const ayudas = await window.loadCardHelpers?.();
    const tarjeta = await ayudas?.createCardElement({ type: "entities", entities: [] });
    await tarjeta?.constructor?.getConfigElement?.();
  } catch (err) {
    console.warn("pvpc-bono-social-card: no se pudo cargar el editor", err);
  }
}

class PvpcBonoSocialCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  setConfig(config) {
    this._config = config;
  }

  get _idioma() {
    return (this.hass?.locale?.language || this.hass?.language || "es").slice(0, 2);
  }

  render() {
    if (!this._config || !this.hass) return nothing;
    const datos = datosEditor(this._config, this.hass);
    return html`<ha-form
      .hass=${this.hass}
      .data=${datos}
      .schema=${esquemaEditor(this._idioma, datos)}
      .computeLabel=${(s) => (ETIQUETAS_EDITOR[s.name] ? enSuIdioma(ETIQUETAS_EDITOR[s.name], this._idioma) : s.title ?? s.name)}
      .computeHelper=${(s) => (AYUDAS_EDITOR[s.name] ? enSuIdioma(AYUDAS_EDITOR[s.name], this._idioma) : "")}
      @value-changed=${this._alCambiar}
    ></ha-form>`;
  }

  /** Solo se escribe lo que el usuario ha tocado: el resto no tiene por qué acabar en su YAML. */
  _alCambiar(ev) {
    ev.stopPropagation();
    const nuevos = ev.detail.value;
    const antes = datosEditor(this._config, this.hass);
    const config = { ...this._config };
    for (const clave of new Set([...Object.keys(nuevos), ...Object.keys(antes)])) {
      if (clave === "hay_excedentes") continue;
      if (JSON.stringify(nuevos[clave]) === JSON.stringify(antes[clave])) continue;
      if (clave === "mostrar_excedentes") {
        // No es una opción de la tarjeta: pone o quita el sensor de excedentes de la integración.
        if (nuevos[clave]) config.entity_injection = buscarEntidad(this.hass, "sensor.pvpc_bs_precio_excedentes");
        else delete config.entity_injection;
        continue;
      }
      // Un título borrado es «sin título», no «el de siempre».
      if (["title", "titulo_grafica", "titulo_facturas"].includes(clave) && nuevos[clave] === undefined) config[clave] = "";
      else if (nuevos[clave] === undefined) delete config[clave];
      else config[clave] = nuevos[clave];
    }
    if (!config.entity_injection) delete config.entity_injection;
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

const ETIQUETAS_EDITOR = {
  entity: "Sensor de precio / Price sensor",
  title: "Título de la tarjeta / Card title",
  factura: "Posición en la tarjeta / Position on the card",
  factura_actual: "Factura periodo en curso / Current bill",
  factura_anterior: "Factura periodo anterior / Previous bill",
  prevision: "Factura estimada / Estimated bill",
  current: "Precio actual / Current price",
  details: "Mostrar mínimos y máximos / Show min and max",
  extremos: "Disposición / Layout",
  graph: "Mostrar la gráfica / Show the chart",
  next_day: "Mostrar mañana / Show tomorrow",
  extremos_manana: "Mostrar mañana / Show tomorrow",
  icon_color: "Color del icono / Icon colour",
  colores: "Colores de la gráfica / Chart colours",
  grosor: "Grosor de las líneas / Line width",
  color_hoy: "Color de hoy / Today's colour",
  color_manana: "Color de mañana / Tomorrow's colour",
  bandas: "Punta y llano sombreados / Shade peak hours",
  entity_injection: "Sensor de precio de excedentes / Surplus price sensor",
  mostrar_excedentes: "Mostrar precios de los excedentes / Show surplus prices",
  excedentes_grafica: "Mostrar excedentes / Show surplus",
  grafica_facturas: "Mostrar facturas / Show bills",
  facturas_importe: "Importe sobre las barras / Amount above bars",
  facturas_tendencia: "Línea de tendencia / Trend line",
  facturas_meses: "Cantidad de facturas / Number of bills",
  color_facturas: "Color de las barras / Bar colour",
  titulo_grafica: "Título de la gráfica de precios / Price chart title",
  titulo_facturas: "Título de la gráfica / Chart title",
  entity_factura_actual: "Sensor de factura en curso / Current bill sensor",
  entity_factura_anterior: "Sensor de factura anterior / Previous bill sensor",
};

/** Una línea de ayuda bajo cada campo del editor. */
const AYUDAS_EDITOR = {
  current: "Precio de esta hora, en grande; el icono sigue / This hour's price, in large type; the icon stays",
  icon_color: "Por precio: verde barato, rojo caro / By price: green cheap, red expensive",
  title: "Bórralo para dejar la tarjeta sin título / Clear it to leave the card untitled",
  factura: "Dónde van las líneas de factura / Where the bill lines go",
  factura_anterior: "Último periodo cerrado / Last closed period",
  factura_actual: "Lo gastado en el periodo hasta hoy / Spent so far this period",
  prevision: "Lo que se prevé pagar al cerrar el periodo / Expected total at the end of the period",
  details: "Hora más barata y más cara de hoy y de mañana / Cheapest and most expensive hour today and tomorrow",
  extremos: "Columnas: hoy a la izquierda y mañana a la derecha. Filas: hoy arriba y mañana debajo / Columns: today left, tomorrow right. Rows: today above, tomorrow below",
  graph: "Precio de cada hora en escalones / Hourly price as steps",
  next_day: "Solo en la gráfica, cuando ya hay precios (sobre las 20:30) / Chart only, once prices are out (around 20:30)",
  extremos_manana: "Mínimo y máximo de mañana, cuando ya hay precios (sobre las 20:30) / Tomorrow's min and max, once prices are out (around 20:30)",
  titulo_grafica: "Bórralo para dejar la gráfica sin título / Clear it to leave the chart untitled",
  grosor: "De hoy, mañana y excedentes / Today, tomorrow and surplus",
  colores: "«Por precio» colorea cada hora del día elegido según lo cara que es / «By price» colours each hour of that day by how expensive it is",
  color_hoy: "La línea y los triángulos de hoy / Today's line and triangles",
  color_manana: "La línea y los triángulos de mañana / Tomorrow's line and triangles",
  facturas_importe: "El importe de cada factura encima de su barra / Each bill's amount above its bar",
  facturas_meses: "Cuántas facturas cerradas se ven, las más recientes / How many closed bills are shown, the latest",
  color_facturas: "El color de las barras / The bar colour",
  bandas: "Fondo de color en las horas punta y llano de los laborables / Shaded peak and standard hours on working days",
  entity_injection: "Se elige solo con «Mostrar precios de los excedentes» / Set by «Show surplus prices»",
  mostrar_excedentes: "Activa los excedentes en la tarjeta (triángulos huecos); necesita la API privada de ESIOS / Enables surplus on the card (hollow triangles); needs the ESIOS private API",
  excedentes_grafica: "Su precio en punteado en la gráfica / Its price, dotted, on the chart",
  grafica_facturas: "Barras con las últimas facturas cerradas / Bars with the latest closed bills",
  facturas_tendencia: "Línea discontinua con la tendencia / Dashed trend line",
  titulo_facturas: "Bórralo para dejar la gráfica sin título / Clear it to leave the chart untitled",
  entity: "Se detecta sola; cámbialo solo si tienes varias entradas / Detected automatically; change it only with several entries",
  entity_factura_actual: "Se detecta solo / Detected automatically",
  entity_factura_anterior: "Se detecta solo / Detected automatically",
};

if (!customElements.get(ETIQUETA)) {
  customElements.define(ETIQUETA, PvpcBonoSocialCard);
  customElements.define(ETIQUETA_EDITOR, PvpcBonoSocialCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: ETIQUETA,
    name: "PVPC + Bono Social",
    description: "Precio del PVPC de hoy y mañana y la factura con o sin bono social.",
    preview: true,
    documentationURL: "https://github.com/BaRDaHL/pvpc_bonosocial",
  });
  console.info(`%c PVPC + Bono Social %c ${VERSION} `, "background:#43a047;color:#fff", "");
}
