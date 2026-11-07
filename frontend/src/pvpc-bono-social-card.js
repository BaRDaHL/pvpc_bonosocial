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

const VERSION = "1.2.2";
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
  graph: true,
  next_day: true,
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
  ventana: true,
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
  return { ...POR_DEFECTO, ...antigua, ...config };
}

// --- tarjeta ----------------------------------------------------------------------------

class PvpcBonoSocialCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _cursor: { state: true },
    _facturas: { state: true },
    _ventana: { state: true },
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
      current: true,
      factura: "header",
      factura_actual: true,
      factura_anterior: true,
      prevision: true,
      grafica_facturas: true,
      facturas_meses: "6",
      facturas_importe: true,
      ventana: true,
      details: true,
      next_day: true,
      graph: true,
      bandas: true,
      colores: "fijo",
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
    const idioma = (this.hass?.locale?.language || this.hass?.language || "es").slice(0, 2);
    if (COOFICIALES.includes(idioma)) return { ...TEXTOS.es, ...TEXTOS[idioma] };
    return TEXTOS[idioma] || TEXTOS.en;
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
    const manana = this._config.next_day ? serie(a, true) : [];
    const coloresHoy = Array.isArray(a.colores_hoy) && a.colores_hoy.length === hoy.length ? a.colores_hoy : coloresPorRango(hoy);
    const coloresManana =
      Array.isArray(a.colores_manana) && a.colores_manana.length === manana.length
        ? a.colores_manana
        : coloresPorRango(manana);
    const ahora = posicionActual(hoy, reloj, zona);
    const iny = this._config.entity_injection && this.hass.states[this._config.entity_injection];
    const inyeccion = iny ? { hoy: serie(iny.attributes), manana: this._config.next_day ? serie(iny.attributes, true) : [] } : null;
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
          ${this._config.current
            ? html`<div class="cabecera">
                ${this._conVentana
                  ? html`<button class="abrir" aria-label=${t.abrir} @click=${() => this._abrirVentana()}>
                      ${this._icono(ahora >= 0 ? coloresHoy[ahora] : undefined)}
                    </button>`
                  : this._icono(ahora >= 0 ? coloresHoy[ahora] : undefined)}
                <div class="nombre">${this._config.title || ""}</div>
                <div class="actual">
                  <div class="precio">
                    ${Number.isFinite(precio) ? this._precioGrande(precio) : "—"}
                    <span class="unidad"><span class="euro">€</span>/kWh</span>
                  </div>
                  ${iny && Number.isFinite(Number(iny.state))
                    ? html`<div class="precio-iny">${this._num(Number(iny.state), 5)} €/kWh</div>`
                    : nothing}
                  ${posicion === "header" && factura ? html`<div class="factura arriba">${factura}</div>` : nothing}
                </div>
              </div>`
            : nothing}
          ${this._config.details ? this._detalles(hoy, manana, inyeccion) : nothing}
          ${this._config.graph ? this._grafica(hoy, manana, coloresHoy, coloresManana, ahora, periodos, inyeccion) : nothing}
          ${factura && (posicion === "below_chart" || (posicion === "header" && !this._config.current))
            ? html`<div class="factura abajo">${factura}</div>`
            : nothing}
          ${factura && posicion === "header" && this._config.current
            ? html`<div class="factura abajo estrecha">${factura}</div>`
            : nothing}
          ${this._config.grafica_facturas ? this._graficaFacturas() : nothing}
        </div>
      </ha-card>
      ${this._ventana ? this._dialogo() : nothing}
    `;
  }

  // --- ventana con la tarjeta completa (al pulsar el icono) ----------------------------

  get _conVentana() {
    return this._config.ventana !== false && !this.enVentana;
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
      ventana: false,
    };
    return html`<dialog
      class="ventana"
      @close=${() => (this._ventana = false)}
      @click=${(ev) => ev.target === ev.currentTarget && this._cerrarVentana()}
    >
      <div class="ventana-cuerpo">
        <div class="ventana-cabecera">
          <button class="cerrar" aria-label=${this._t.cerrar} @click=${() => this._cerrarVentana()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
            </svg>
          </button>
          <div class="ventana-titulo">${this._config.title || "PVPC + Bono Social"}</div>
        </div>
        <pvpc-bono-social-card .configVentana=${completa} .hass=${this.hass}></pvpc-bono-social-card>
      </div>
    </dialog>`;
  }

  /** Cinco decimales como la tarjeta antigua: los tres primeros grandes y los dos últimos pequeños. */
  _precioGrande(precio) {
    const texto = this._num(precio, 5);
    return html`${texto.slice(0, -2)}<span class="cola">${texto.slice(-2)}</span>`;
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

  /** Mínimo y máximo de cada día, como en la tarjeta antigua: hoy a la izquierda y mañana a la derecha. */
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
    // Sin precios de mañana (se publican hacia las 20:30) la columna de mañana no sale.
    const bloque = (h, m, hueco) =>
      html`<div class="detalles">
        ${columna(h, this._cHoy, hueco)}${m.length ? columna(m, this._cManana, hueco) : nothing}
      </div>`;
    return html`${bloque(hoy, manana)}${inyeccion ? bloque(inyeccion.hoy, inyeccion.manana, "_hueco") : nothing}`;
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
    if (this._config.factura_actual && actual && Number.isFinite(Number(actual.state))) {
      const a = actual.attributes || {};
      const hoyIso = fechaIso(new Date(), zonaDeHA(this.hass));
      if (typeof a.acumulado === "number") {
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
      svg`<line class="tramo" x1=${x0(i)} x2=${x0(i + 1)} y1=${y(puntos[i].precio)} y2=${y(puntos[i].precio)}
        stroke=${COLORES[colores[i] ?? 0]}></line>`;
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
    const porPrecio = this._config.colores === "precio";
    // «00:00» mide unas 27 unidades: con poco ancho, una etiqueta cada 6 h (la rejilla sigue igual).
    const horasPorEtiqueta = cadaCuantas(hueco * 3, 28);

    const titulo = this._config.titulo_grafica ?? "PVPC";
    return html`
      <div class="grafica">
        ${titulo ? html`<div class="titulo-seccion">${titulo}</div>` : nothing}
        <svg
          viewBox="0 0 ${ancho} ${alto}"
          role="img"
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
              svg`<path class="serie ${s.punteada ? "punteada" : ""}" d=${escalones(s.puntos)}
                stroke=${porPrecio && s.puntos === hoy ? "var(--secondary-text-color)" : s.color}></path>`,
          )}
          ${porPrecio ? hoy.map((_, i) => tramo(hoy, coloresHoy, i)) : nothing}
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
                  ? html`<span><i class="bolita" style="background:${cManana}"></i>${this._fecha(1)}</span>`
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
    const resto = [...actual.querySelectorAll(".precio-iny, .factura.arriba")];
    for (const e of [precio, ...resto]) if (e) e.style.marginRight = "";
    const columnas = this.renderRoot.querySelectorAll(".detalles .columna");
    const icono = this.renderRoot.querySelector(".cabecera .icono");
    if (columnas.length < 2 || !actual.offsetParent) return;
    const derecha = Math.max(
      ...[...columnas[1].querySelectorAll(".valor, .horas")].map((e) => e.getBoundingClientRect().right),
    );
    if (!Number.isFinite(derecha)) return;
    // Sin pisar el icono: lo que más se mueva, como mucho hasta 12 px de él.
    const tope = (e) =>
      icono ? e.getBoundingClientRect().left - icono.getBoundingClientRect().right - 12 : Infinity;
    const mover = (e, cuanto) => {
      const m = Math.min(cuanto, tope(e));
      if (m > 0) e.style.marginRight = `${m}px`;
    };
    const euro = precio?.querySelector(".euro");
    if (euro) mover(precio, euro.getBoundingClientRect().right - derecha);
    for (const e of resto) mover(e, e.getBoundingClientRect().right - derecha);
  }

  updated(cambios) {
    super.updated?.(cambios);
    this._medirAncho();
    this._alinearFactura();
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
    .precio-iny {
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }
    .cola {
      font-size: 0.45em;
    }
    .unidad {
      font-size: 0.45em;
      color: var(--secondary-text-color);
    }
    /* Hoy centrado en la mitad izquierda y mañana en la derecha (aunque mañana no esté). */
    .detalles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 12px;
    }
    .columna {
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-self: center;
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
    .serie {
      fill: none;
      stroke-width: 2.5;
    }
    .serie.punteada {
      stroke-width: 1.5;
      stroke-dasharray: 2 3;
    }
    .tramo {
      stroke-width: 3;
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

function esquemaEditor(idioma) {
  const opciones = (lista) => ({
    select: {
      mode: "dropdown",
      options: lista.map(([value, label]) => ({ value, label: enSuIdioma(label, idioma) })),
    },
  });
  const interruptores = (...nombres) => nombres.map((name) => ({ name, selector: { boolean: {} } }));
  return [
    { name: "entity", selector: { entity: { domain: "sensor" } } },
    { name: "title", selector: { text: {} } },
    {
      name: "factura",
      selector: opciones([
        ["below_chart", "Bajo la gráfica / Below the chart"],
        ["header", "Arriba / In the header"],
        ["hidden", "Oculta / Hidden"],
      ]),
    },
    {
      type: "grid",
      name: "",
      schema: interruptores("factura_actual", "factura_anterior", "prevision", "current", "details", "graph", "next_day", "ventana"),
    },
    {
      name: "colores",
      selector: opciones([
        ["fijo", "Un color por día / One colour per day"],
        ["precio", "Hoy por precio / Today by price"],
      ]),
    },
    {
      type: "grid",
      name: "",
      schema: [
        { name: "color_hoy", selector: { color_rgb: {} } },
        { name: "color_manana", selector: { color_rgb: {} } },
        ...interruptores("bandas"),
      ],
    },
    { name: "entity_injection", selector: { entity: { domain: "sensor" } } },
    {
      name: "icon_color",
      selector: opciones([
        ["price", "Por precio / By price"],
        ["period", "Por periodo P1-P3 / By period"],
        ["fijo", "Azul fijo / Fixed blue"],
      ]),
    },
    {
      type: "grid",
      name: "",
      schema: [
        ...interruptores("grafica_facturas", "facturas_importe", "facturas_tendencia"),
        { name: "facturas_meses", selector: opciones(["3", "5", "6", "9", "12"].map((v) => [v, v])) },
        { name: "color_facturas", selector: { color_rgb: {} } },
      ],
    },
    { name: "titulo_grafica", selector: { text: {} } },
    { name: "titulo_facturas", selector: { text: {} } },
    { name: "entity_factura_actual", selector: { entity: { domain: "sensor" } } },
    { name: "entity_factura_anterior", selector: { entity: { domain: "sensor" } } },
  ];
}

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
  };
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
    return html`<ha-form
      .hass=${this.hass}
      .data=${datosEditor(this._config, this.hass)}
      .schema=${esquemaEditor(this._idioma)}
      .computeLabel=${(s) => (ETIQUETAS_EDITOR[s.name] ? enSuIdioma(ETIQUETAS_EDITOR[s.name], this._idioma) : s.name)}
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
      if (JSON.stringify(nuevos[clave]) === JSON.stringify(antes[clave])) continue;
      if (nuevos[clave] === undefined) delete config[clave];
      else config[clave] = nuevos[clave];
    }
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

const ETIQUETAS_EDITOR = {
  entity: "Sensor de precio / Price sensor",
  title: "Título / Title",
  factura: "Factura / Bill",
  factura_actual: "Factura en curso / Current bill",
  factura_anterior: "Factura anterior / Previous bill",
  prevision: "Factura estimada al cierre / Estimated bill",
  current: "Precio actual / Current price",
  details: "Mínimos y máximos / Min and max",
  graph: "Gráfica / Chart",
  ventana: "Ventana con todo al pulsar el icono / Full view on icon tap",
  next_day: "Mañana / Tomorrow",
  icon_color: "Color del icono / Icon colour",
  colores: "Colores de la gráfica / Chart colours",
  color_hoy: "Color de hoy / Today's colour",
  color_manana: "Color de mañana / Tomorrow's colour",
  bandas: "Punta y llano sombreados / Shade peak hours",
  entity_injection: "Sensor de precio de excedentes (opcional) / Injection price sensor (optional)",
  grafica_facturas: "Gráfica de facturas / Bills chart",
  facturas_importe: "Importe sobre cada barra / Amount above bars",
  facturas_tendencia: "Línea de tendencia / Trend line",
  facturas_meses: "Cuántas facturas / How many bills",
  color_facturas: "Color de las barras / Bar colour",
  titulo_grafica: "Título de la gráfica de precios / Price chart title",
  titulo_facturas: "Título de la gráfica de facturas / Bills chart title",
  entity_factura_actual: "Sensor de factura en curso / Current bill sensor",
  entity_factura_anterior: "Sensor de factura anterior / Previous bill sensor",
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
