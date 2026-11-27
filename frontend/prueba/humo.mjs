// Prueba de humo de la tarjeta (F7): la carga en Chromium con un HA simulado y comprueba que se
// pinta sin errores en claro, oscuro, móvil e inglés, que no registra el nombre de la tarjeta
// antigua y que solo se vuelve a dibujar cuando cambian sus entidades o empieza otra hora.
// Uso: npm run humo (en frontend/; CHROMIUM=/ruta/al/chrome para usar otro navegador)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const aqui = dirname(fileURLToPath(import.meta.url));
const archivos = {
  "/pagina.html": [join(aqui, "pagina.html"), "text/html"],
  "/estados.json": [join(aqui, "estados.json"), "application/json"],
  "/pvpc-bono-social-card.js": [
    join(aqui, "..", "..", "custom_components", "pvpc_bonosocial", "frontend", "pvpc-bono-social-card.js"),
    "text/javascript",
  ],
};
const servidor = createServer(async (req, res) => {
  const ruta = archivos[req.url.split("?")[0]];
  if (req.url === "/favicon.ico") return res.writeHead(204).end();
  if (!ruta) return res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": ruta[1] }).end(await readFile(ruta[0]));
});
await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${servidor.address().port}/pagina.html`;


const casos = [
  { nombre: "claro", ancho: 500, q: "" , precio: "0,120", textos: ["PVPC", "Factura periodo en curso", "punta", "14:00 - 15:00", "Hora actual", "(12/08 - 13/09)", "Factura estimada (13/09 - 13/10): 98,20"] },
  { nombre: "tarjeta_nueva", ancho: 500, q: "stub=1", precio: "0,120", textos: ["PVPC", "Factura periodo en curso", "Factura estimada"], sin: ["(12/08 - 13/09)"] },
  { nombre: "oscuro", ancho: 500, q: "oscuro=1", precio: "0,120", textos: ["20:00 - 21:00"] },
  { nombre: "factura_derecha", ancho: 500, q: "config=" + encodeURIComponent('{"factura":"below_chart_right"}'), precio: "0,120", textos: ["Factura periodo en curso", "Factura estimada"] },
  { nombre: "manana_por_precio", ancho: 500, q: "config=" + encodeURIComponent('{"colores":"precio_manana"}'), precio: "0,120", textos: ["Hora actual"] },
  { nombre: "sin_manana_extremos", ancho: 500, q: "config=" + encodeURIComponent('{"extremos_manana":false}'), precio: "0,120", textos: ["14:00 - 15:00"], triangulos: 2 },
  { nombre: "sin_precio_actual", ancho: 500, q: "config=" + encodeURIComponent('{"current":false}'), precio: "0,120", textos: ["Factura periodo en curso"] },
  { nombre: "excedentes", ancho: 500, q: "config=" + encodeURIComponent('{"entity_injection":"sensor.pvpc_bs_precio_excedentes"}'), precio: "-0,00106", textos: [] },
  { nombre: "colores_propios", ancho: 500, q: "config=" + encodeURIComponent('{"color_hoy":[255,0,0],"color_manana":"rgb(0, 255, 0)","entity_injection":"sensor.pvpc_bs_precio_excedentes"}'), precio: "0,120", textos: [], color: ["rgb(255, 0, 0)", "rgb(0, 255, 0)"] },
  { nombre: "sin_prevision", ancho: 500, q: "config=" + encodeURIComponent('{"prevision":false}'), precio: "0,120", textos: ["Factura periodo en curso"], sin: ["Factura estimada"] },
  { nombre: "sin_manana", ancho: 500, q: "sin_manana=1&config=" + encodeURIComponent('{"entity_injection":"sensor.pvpc_bs_precio_excedentes"}'), precio: "0,120", textos: [], sin: ["No disponible"], triangulos: 4 },
  { nombre: "colores_precio", ancho: 500, q: "config=" + encodeURIComponent('{"colores":"precio"}'), precio: "0,120", textos: [], tramos: 24 },
  { nombre: "movil", ancho: 340, q: "config=" + encodeURIComponent('{"factura":"header"}'), precio: "0,120", textos: ["45,10"] },
  { nombre: "facturas", ancho: 500, q: "config=" + encodeURIComponent('{"grafica_facturas":true,"facturas_tendencia":true}'), precio: "0,120", textos: ["Facturas", "97,80 €", "156,90 €"], sin: ["88,40 €"], barras: 6, importes: 6, tendencia: 1 },
  { nombre: "facturas_movil", ancho: 340, q: "config=" + encodeURIComponent('{"grafica_facturas":true,"facturas_meses":"12","titulo_facturas":"Mis facturas","facturas_importe":false}'), precio: "0,120", textos: ["Mis facturas"], barras: 8, importes: 0, tendencia: 0 },
  { nombre: "facturas_calculadas", ancho: 500, q: "calculadas=1&config=" + encodeURIComponent('{"grafica_facturas":true,"facturas_meses":"9"}'), precio: "0,120", textos: ["Factura real", "Calculada con el consumo", "95,10 €"], barras: 8, calculadas: 3, importes: 8 },
  { nombre: "ventana", ancho: 900, q: "config=" + encodeURIComponent('{"details":false,"graph":false,"factura":"hidden"}'), precio: "0,120", textos: [], ventana: true },
  { nombre: "ventana_movil", ancho: 360, q: "calculadas=1&config=" + encodeURIComponent('{"graph":false}'), precio: "0,120", textos: [], ventana: true },
  { nombre: "ingles", ancho: 500, q: "idioma=en", redibujo: true, precio: "0.120", textos: ["Current bill", "peak", "Current hour", "Estimated bill"] },
  { nombre: "cambio_de_hora", ancho: 500, q: "", reloj: "2026-10-20T10:59:50+02:00", precio: "0,120", textos: [] },
  { nombre: "catalan", ancho: 500, q: "idioma=ca", precio: "0,120", textos: ["Factura del període en curs", "punta", "Hora actual", "Factura estimada"] },
  { nombre: "gallego", ancho: 500, q: "idioma=gl", precio: "0,120", textos: ["Factura do período en curso", "chan", "Hora actual"] },
  { nombre: "euskera", ancho: 500, q: "idioma=eu", precio: "0,120", textos: ["Aldi honetako faktura", "laua", "Uneko ordua", "Zenbatetsitako faktura"] },
  // Textos completos en los cinco idiomas (tarjeta y editor) y el editor en cada uno; otro idioma, en inglés.
  { nombre: "idiomas_completos", ancho: 500, q: "", precio: "0,120", textos: [], idiomas: true },
  ...["en", "ca", "gl", "eu", "fr"].map((idioma) => ({
    nombre: `editor_${idioma}`,
    ancho: 500,
    q: `idioma=${idioma}`,
    precio: idioma === "en" ? "0.120" : "0,120",
    textos: [],
    editorIdioma: idioma,
  })),
  // Legible a cualquier ancho: el texto de las gráficas no escala con la tarjeta (px reales).
  ...[
    { ancho: 278, min: 9, max: 13, viewBox: null },
    { ancho: 405, min: 9, max: 13, viewBox: null },
    { ancho: 524, min: 9, max: 13, viewBox: "0 0 480 190" }, // el tamaño de siempre, sin tocar
    { ancho: 1064, min: 9, max: 13, viewBox: null },
    { ancho: 2336, min: 9, max: 13, viewBox: null, altoMax: 1100 },
  ].map((m) => ({
    nombre: `legible_${m.ancho}`,
    ancho: m.ancho,
    q: "config=" + encodeURIComponent('{"grafica_facturas":true}'),
    precio: "0,120",
    textos: [],
    legible: m,
  })),
  { nombre: "editor", ancho: 500, q: "", precio: "0,120", textos: [], editor: true },
  { nombre: "anexo_dos_vistas", ancho: 1100, q: "anexo=1", precio: "0,120", textos: [], anexo: true },
  // «Histórico»: tercer botón y su panel (a la derecha en escritorio, debajo en móvil), con datos y vacío.
  { nombre: "historico", ancho: 1100, q: "historico=1&subir=1", precio: "0,120", textos: [], historico: "datos" },
  { nombre: "historico_movil", ancho: 360, q: "historico=1&subir=1", precio: "0,120", textos: [], historico: "datos" },
  { nombre: "historico_vacio", ancho: 1100, q: "historico=vacio", precio: "0,120", textos: [], historico: "vacio" },
  { nombre: "historico_vacio_movil", ancho: 360, q: "historico=vacio", precio: "0,120", textos: [], historico: "vacio" },
  { nombre: "historico_ingles", ancho: 1100, q: "historico=1&idioma=en", precio: "0.120", textos: [], historico: "en" },
  { nombre: "subir_factura", ancho: 1100, q: "subir=1", precio: "0,120", textos: [], subir: true },
  { nombre: "subir_factura_movil", ancho: 360, q: "subir=1", precio: "0,120", textos: [], subir: true },
  // 12 facturas: las etiquetas de mes no se pisan (en catalán y gallego salía «nov. del 25»).
  ...["es", "en", "ca", "gl", "eu"].map((idioma) => ({
    nombre: `meses_${idioma}`,
    ancho: 500,
    q: `doce=1&idioma=${idioma}&config=` + encodeURIComponent('{"grafica_facturas":true,"facturas_meses":"12"}'),
    precio: idioma === "en" ? "0.120" : "0,120",
    textos: [],
    solapes: 0,
  })),
  // HA en hora peninsular y el navegador en otra zona: la hora en curso, «hoy» y «mañana» son
  // las de HA. 00:30 en Madrid = 23:30 del día anterior en Canarias y 22:30 en UTC.
  { nombre: "zona_canarias", ancho: 500, q: "zona=Europe/Madrid", zonaNavegador: "Atlantic/Canary", fijo: "2026-10-20T00:30:00+02:00", precio: "0,120", textos: ["20/10/2026", "21/10/2026", "(13/09 - 20/10)"] },
  { nombre: "zona_utc", ancho: 500, q: "zona=Europe/Madrid", zonaNavegador: "UTC", fijo: "2026-10-20T00:30:00+02:00", precio: "0,120", textos: ["20/10/2026", "21/10/2026"] },
  // Y al revés: HA en Canarias y el navegador en Madrid (10:30 en Madrid = 09:30 en Canarias).
  { nombre: "zona_ha_canarias", ancho: 500, q: "zona=Atlantic/Canary", zonaNavegador: "Europe/Madrid", fijo: "2026-10-20T10:30:00+02:00", precio: "0,120", textos: [] },
  // Cada línea de factura con su interruptor, en las 8 combinaciones.
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const [ant, cur, est] = [k & 4, k & 2, k & 1].map(Boolean);
    const nombres = [["Factura periodo anterior", ant], ["Factura periodo en curso", cur], ["Factura estimada", est]];
    return {
      nombre: `factura_${+ant}${+cur}${+est}`,
      ancho: 500,
      q: "config=" + encodeURIComponent(JSON.stringify({ factura_anterior: ant, factura_actual: cur, prevision: est })),
      precio: "0,120",
      textos: nombres.filter(([, v]) => v).map(([n]) => n),
      sin: nombres.filter(([, v]) => !v).map(([n]) => n),
    };
  }),
];
const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const fallos = [];
for (const c of casos) {
  const pag = await navegador.newPage({
    viewport: { width: c.ancho, height: 800 },
    ...(c.reloj ? { timezoneId: "Europe/Madrid" } : {}),
    ...(c.zonaNavegador ? { timezoneId: c.zonaNavegador } : {}),
  });
  const errores = [];
  pag.on("pageerror", (e) => errores.push(e.message));
  pag.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  if (c.reloj) await pag.clock.install({ time: new Date(c.reloj) });
  if (c.fijo) await pag.clock.setFixedTime(new Date(c.fijo));
  await pag.goto(`${base}?${c.q}`);
  await pag.waitForFunction(() => window.listo);
  await pag.waitForTimeout(200);
  if (c.ventana) {
    await pag.locator("pvpc-bono-social-card button.abrir").click();
    await pag.waitForTimeout(300);
  }
  const etiqueta = "pvpc-bono-social-card";
  const info = await pag.evaluate((etiqueta) => {
    const raiz = document.querySelector(etiqueta)?.shadowRoot;
    return {
      texto: raiz?.textContent.replace(/\s+/g, " ") ?? "",
      marcas: raiz?.querySelectorAll("svg.marca").length ?? 0,
      tramos: raiz?.querySelectorAll("line.tramo").length ?? 0,
      triangulos: raiz?.querySelectorAll(".columna:not(.fantasma) svg.tri, .fila svg.tri").length ?? 0,
      // Colores de las series, de los triángulos (gráfica y detalle) y de las bolitas de la leyenda.
      colores: [
        ...[...(raiz?.querySelectorAll("path.serie") ?? [])].map((e) => e.getAttribute("stroke")),
        ...[...(raiz?.querySelectorAll("svg.marca path, svg.tri path") ?? [])].map((e) => e.getAttribute("fill")),
        ...[...(raiz?.querySelectorAll(".bolita") ?? [])].map((e) => e.style.background),
      ],
      barras: raiz?.querySelectorAll("rect.barra").length ?? 0,
      ventana: (() => {
        const d = raiz?.querySelector("dialog.ventana");
        const dentro = d?.querySelector("pvpc-bono-social-card")?.shadowRoot;
        return d?.open
          ? {
              barras: dentro?.querySelectorAll("rect.barra").length ?? 0,
              grafica: !!dentro?.querySelector(".grafica svg"),
              abrir: dentro?.querySelectorAll("button.abrir").length ?? 0,
              ancho: d.getBoundingClientRect().width,
            }
          : null;
      })(),
      calculadas: raiz?.querySelectorAll("rect.barra.calculada").length ?? 0,
      importes: raiz?.querySelectorAll("text.importe").length ?? 0,
      tendencia: raiz?.querySelectorAll("line.tendencia").length ?? 0,
      bandas: raiz?.querySelectorAll("rect.banda-punta, rect.banda-llano").length ?? 0,
      ancho: document.documentElement.scrollWidth,
      medidas: (() => {
        const tarjeta = document.querySelector(etiqueta);
        const px = (sel) => {
          const e = raiz?.querySelector(sel);
          if (!e) return null;
          return parseFloat(getComputedStyle(e).fontSize) * e.ownerSVGElement.getScreenCTM().a;
        };
        const borde = raiz?.querySelector("ha-card")?.getBoundingClientRect().right ?? 0;
        const derecha = Math.max(0, ...[...(raiz?.querySelectorAll(".detalle .valor, .detalle .horas") ?? [])].map((e) => e.getBoundingClientRect().right));
        const textos = [...(raiz?.querySelectorAll(".grafica svg text.eje") ?? [])]
          .filter((e) => (e.textContent || "").includes(":"))
          .map((e) => e.getBoundingClientRect());
        return {
          eje: px(".grafica text.eje"),
          importe: px("text.importe"),
          alto: tarjeta.getBoundingClientRect().height,
          holgura: borde - derecha,
          solapesHoras: textos.filter((r, i) => i && r.left < textos[i - 1].right).length,
          viewBox: raiz?.querySelector(".grafica svg")?.getAttribute("viewBox"),
          lineasPrecio: (() => {
            const p = raiz?.querySelector(".precio");
            return p ? Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)) : 0;
          })(),
        };
      })(),
      solapes: (() => {
        const textos = [...(raiz?.querySelectorAll(".facturas svg text.eje") ?? [])].map((e) => e.getBoundingClientRect());
        return textos.filter((r, i) => i && r.left < textos[i - 1].right).length;
      })(),
    };
  }, etiqueta);
  const mal = [...errores];
  if (c.redibujo) {
    const r = await pag.evaluate(async () => {
      const t = document.querySelector("pvpc-bono-social-card");
      let dibujos = 0;
      const render = t.render.bind(t);
      t.render = () => (dibujos++, render());
      const cambiar = async (id, estado) => {
        t.hass = { ...t.hass, states: { ...t.hass.states, [id]: { ...(t.hass.states[id] ?? { attributes: {} }), state: estado } } };
        await t.updateComplete;
      };
      await cambiar("light.otra_cosa_de_la_casa", "on");
      const ajena = dibujos;
      await cambiar("sensor.pvpc_bs_periodo", "P1");
      return { ajena, propia: dibujos - ajena, alias: !!customElements.get("pvpc-hourly-pricing-card") };
    });
    if (r.ajena) mal.push(`se redibuja por una entidad ajena (${r.ajena})`);
    if (r.propia !== 1) mal.push(`no se redibuja al cambiar su periodo (${r.propia})`);
    if (r.alias) mal.push("registra pvpc-hourly-pricing-card");
  }
  if (c.reloj) {
    // El precio nuevo llega con el reloj del navegador aún en la hora anterior (va por detrás del
    // servidor): la franja «Hora actual» tiene que pasar sola a la hora siguiente.
    const franja = () =>
      pag.evaluate(() => document.querySelector("pvpc-bono-social-card").shadowRoot.querySelector("rect.ahora")?.getAttribute("x"));
    const antes = await franja();
    await pag.clock.runFor(new Date("2026-10-20T10:59:59.800+02:00") - (await pag.evaluate(() => Date.now())));
    await pag.evaluate(async () => {
      const t = document.querySelector("pvpc-bono-social-card");
      const id = "sensor.pvpc_bs_precio";
      t.hass = { ...t.hass, states: { ...t.hass.states, [id]: { ...t.hass.states[id] } } };
      await t.updateComplete;
    });
    await pag.clock.runFor(2000);
    const despues = await franja();
    if (!antes || antes === despues) mal.push(`la hora actual no avanza al cambiar de hora (${antes} → ${despues})`);
  }
  if (c.zonaNavegador) {
    // La franja «Hora actual» tiene que caer en el mismo sitio que en un navegador que esté en la
    // zona de HA, en el mismo instante.
    const x = (p) => p.evaluate(() => document.querySelector("pvpc-bono-social-card").shadowRoot.querySelector("rect.ahora")?.getAttribute("x"));
    const ref = await navegador.newPage({ viewport: { width: c.ancho, height: 800 }, timezoneId: new URLSearchParams(c.q).get("zona") });
    await ref.clock.setFixedTime(new Date(c.fijo));
    await ref.goto(`${base}?${c.q}`);
    await ref.waitForFunction(() => window.listo);
    await ref.waitForTimeout(200);
    const [obtenida, esperada] = [await x(pag), await x(ref)];
    await ref.close();
    if (!esperada || obtenida !== esperada) mal.push(`hora actual fuera de sitio (x=${obtenida}, debería ser ${esperada})`);
  }
  if (!info.texto.includes(c.precio)) mal.push(`no sale el precio ${c.precio}`);
  for (const t of c.textos) if (!info.texto.includes(t)) mal.push(`no sale «${t}»`);
  if (!c.ventana && info.marcas < 4) mal.push(`la gráfica tiene ${info.marcas} triángulos de mínimo y máximo`);
  for (const col of c.color ?? []) {
    const n = info.colores.filter((x) => x === col).length;
    // hoy y mañana: 2 líneas + 2 punteadas, 4 triángulos en la gráfica, 4 en el detalle y su bolita
    if (n < 11) mal.push(`el color ${col} solo sale ${n} veces`);
  }
  for (const t of c.sin ?? []) if (info.texto.includes(t)) mal.push(`sale «${t}»`);
  if (c.triangulos !== undefined && info.triangulos !== c.triangulos)
    mal.push(`${info.triangulos} triángulos en el detalle (deberían ser ${c.triangulos})`);
  if ((c.tramos ?? 0) > info.tramos) mal.push(`${info.tramos} horas coloreadas por precio`);
  if (c.barras !== undefined && info.barras !== c.barras) mal.push(`${info.barras} barras de facturas (deberían ser ${c.barras})`);
  if (c.ventana) {
    const v = info.ventana;
    if (!v) mal.push("no se abre la ventana");
    else {
      if (!v.grafica || v.barras !== 6) mal.push(`ventana incompleta (${JSON.stringify(v)})`);
      if (v.abrir) mal.push("la tarjeta de la ventana abre otra ventana");
      if (v.ancho > c.ancho) mal.push(`la ventana se sale (${v.ancho} px)`);
    }
  }
  if (c.calculadas !== undefined && info.calculadas !== c.calculadas) mal.push(`${info.calculadas} barras calculadas`);
  if (c.importes !== undefined && info.importes !== c.importes) mal.push(`${info.importes} importes sobre las barras`);
  if (c.tendencia !== undefined && info.tendencia !== c.tendencia) mal.push(`${info.tendencia} líneas de tendencia`);
  if (!c.ventana && info.bandas !== 16) mal.push(`${info.bandas} franjas de punta/llano (deberían ser 16)`);
  if (c.legible) {
    const m = info.medidas;
    for (const [nombre, v] of [["eje", m.eje], ["importe", m.importe]]) {
      if (!(v >= c.legible.min && v <= c.legible.max * (nombre === "importe" ? 1.25 : 1)))
        mal.push(`${nombre} a ${v?.toFixed(1)} px`);
    }
    if (m.holgura < 8) mal.push(`la columna de mañana queda a ${m.holgura.toFixed(1)} px del borde`);
    if (m.solapesHoras) mal.push(`${m.solapesHoras} horas del eje se pisan`);
    if (m.lineasPrecio > 1) mal.push(`el precio ocupa ${m.lineasPrecio} líneas`);
    if (c.legible.viewBox && m.viewBox !== c.legible.viewBox) mal.push(`viewBox ${m.viewBox}`);
    if (c.legible.altoMax && m.alto > c.legible.altoMax) mal.push(`tarjeta de ${m.alto} px de alto`);
  }
  if (c.editor) {
    const r = await pag.evaluate(async () => {
      const Tarjeta = customElements.get("pvpc-bono-social-card");
      if (!Tarjeta.getConfigElement) return { sin: true };
      const editor = await Tarjeta.getConfigElement();
      editor.setConfig({ type: "custom:pvpc-bono-social-card", color_hoy: "#4269d0", color_manana: "rgb(1, 2, 3)", prevision: false });
      editor.hass = document.querySelector("pvpc-bono-social-card").hass;
      document.body.appendChild(editor);
      await editor.updateComplete;
      const form = editor.shadowRoot.querySelector("ha-form");
      const data = form.data;
      let emitida;
      editor.addEventListener("config-changed", (ev) => (emitida = ev.detail.config));
      // Campos de cada sección (todas planas: las claves del YAML no cambian).
      const campos = (esquema) => esquema.flatMap((s) => (s.type === "expandable" ? s.schema.map((c) => c.name) : [s.name]));
      const antes = campos(form.schema);
      const planas = form.schema.every((s) => s.type === "expandable" && s.flatten === true);
      form.dispatchEvent(new CustomEvent("value-changed", { detail: { value: { ...data, graph: false } } }));
      await editor.updateComplete;
      const despues = campos(editor.shadowRoot.querySelector("ha-form").schema);
      const ayuda = antes.includes("ventana") ? "con ventana" : "";
      return { data, emitida, etiqueta: form.computeLabel({ name: "graph" }), antes, despues, planas, ayuda };
    });
    if (r.sin) mal.push("sin getConfigElement");
    else {
      const d = r.data;
      if (JSON.stringify(d.color_hoy) !== "[66,105,208]") mal.push(`color_hoy ${JSON.stringify(d.color_hoy)}`);
      if (JSON.stringify(d.color_manana) !== "[1,2,3]") mal.push(`color_manana ${JSON.stringify(d.color_manana)}`);
      if (JSON.stringify(d.color_facturas) !== "[66,105,208]") mal.push(`color_facturas ${JSON.stringify(d.color_facturas)}`);
      if (d.graph !== true || d.details !== true || d.bandas !== true) mal.push("interruptores apagados con la función activa");
      if (d.prevision !== false) mal.push("no respeta lo que hay en el YAML");
      if (d.entity !== "sensor.pvpc_bs_precio") mal.push(`sensor ${d.entity}`);
      // Lo que no se ha tocado no se escribe en el YAML.
      const esperada = { type: "custom:pvpc-bono-social-card", color_hoy: "#4269d0", color_manana: "rgb(1, 2, 3)", prevision: false, graph: false };
      if (JSON.stringify(r.emitida) !== JSON.stringify(esperada)) mal.push(`config emitida ${JSON.stringify(r.emitida)}`);
      if (r.etiqueta !== "Mostrar la gráfica") mal.push(`etiqueta «${r.etiqueta}»`);
      if (!r.planas) mal.push("secciones sin flatten");
      if (!r.antes.includes("color_hoy") || r.despues.includes("color_hoy") || !r.despues.includes("graph"))
        mal.push(`sin gráfica deben ocultarse sus opciones (${r.despues.join(",")})`);
      if (r.antes.includes("facturas_meses")) mal.push("opciones de la evolución de facturas visibles con ella apagada");
      // La ventana va siempre: el editor ya no la ofrece.
      if (r.ayuda) mal.push("el editor aún ofrece la opción de la ventana");
    }
  }
  if (c.anexo) {
    // Ventana → «Comparar tarifas» → anexo con las dos vistas (último año y previsión de la CNMC).
    await pag.locator("pvpc-bono-social-card >> button.abrir").first().click();
    await pag.locator("dialog.ventana pvpc-bono-social-card >> button.btn-comparar").click();
    await pag.waitForTimeout(300);
    const texto = await pag.locator("dialog.ventana .anexo").innerText();
    for (const t of ["Depende de los precios", "Lo que pagaste (último año)", "PVPC previsto", "≈1825,23", "último año", "previsión", "revisión anual", "bono social térmico", "mercado de futuros"])
      if (!texto.includes(t)) mal.push(`anexo sin «${t}»`);
    // Termómetro bajo el veredicto: la mejor de hoy frente a los meses anteriores, en €/kWh.
    const termo = "🌡️ La mejor oferta de hoy (0,360 €/kWh) está entre la más barata (julio de 2026, 0,341 €/kWh) y la más cara (septiembre de 2026, 0,376 €/kWh) de los últimos 4 meses.";
    if (!texto.includes(termo)) mal.push("anexo sin el termómetro");
    // Sin el atributo del histórico en el sensor, no hay tercer botón.
    if (await pag.locator("dialog.ventana pvpc-bono-social-card >> button.btn-historico").count()) mal.push("botón «Histórico» sin histórico");
  }
  if (c.historico) {
    // Ventana → «Histórico»: panel propio, uno a la vez con los de comparar y subir.
    await pag.locator("pvpc-bono-social-card >> button.abrir").first().click();
    const dentro = "dialog.ventana pvpc-bono-social-card";
    const botones = await pag.evaluate(() => {
      const d = document.querySelector("pvpc-bono-social-card").shadowRoot.querySelector("dialog.ventana pvpc-bono-social-card");
      return [...d.shadowRoot.querySelectorAll(".comparar button")].map((b) => b.className);
    });
    const esperados = c.historico === "datos" ? ["btn-subir", "btn-comparar", "btn-historico"] : ["btn-comparar", "btn-historico"];
    if (JSON.stringify(botones) !== JSON.stringify(esperados)) mal.push(`botones ${JSON.stringify(botones)}`);
    await pag.locator(`${dentro} >> button.btn-historico`).click();
    await pag.waitForTimeout(200);
    const anexo = pag.locator("dialog.ventana .anexo");
    if ((await anexo.count()) !== 1 || !(await pag.locator("dialog.ventana .anexo.historico").count())) mal.push("no se abre el panel del histórico");
    const texto = await anexo.innerText();
    const esperado = {
      datos: ["Histórico de comparativas", "noviembre de 2026", "octubre de 2026", "1512,40 €", "CNMC ≈1825,23 €", "pagado 1384,40 €", "4200 kWh/año", "mejor oferta"],
      vacio: ["Histórico de comparativas", "Aún no hay comparativas guardadas."],
      en: ["Comparison history", "November 2026", "1,512.40 €", "paid 1,384.40 €", "4,200 kWh/year"],
    }[c.historico];
    for (const t of esperado) if (!texto.includes(t)) mal.push(`histórico sin «${t}»`);
    if (c.historico !== "vacio") {
      // Cerrado no se ven las ofertas; al tocar el mes, las 3 con su enlace a la ficha.
      const mes = anexo.locator("details.hist-mes").first();
      if (await mes.locator(".hist-oferta").first().isVisible()) mal.push("las ofertas se ven sin desplegar");
      await mes.locator("summary").click();
      await pag.waitForTimeout(100);
      const ofertas = await mes.locator(".hist-oferta").count();
      const enlaces = await mes.locator(".hist-oferta a.enlace").evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
      if (ofertas !== 3 || enlaces.length !== 3 || !enlaces.every(([t, h]) => t.endsWith("↗") && h.startsWith("https://comparador.example/")))
        mal.push(`ofertas del mes ${ofertas} ${JSON.stringify(enlaces)}`);
      const desplegado = await mes.innerText();
      for (const t of c.historico === "en" ? ["Oferta 2", "minimum stay", "05/11"] : ["Oferta 2", "permanencia", "solo nuevos clientes", "05/11", "4300 kWh/año"])
        if (!desplegado.includes(t)) mal.push(`mes desplegado sin «${t}»`);
    }
    // Escritorio: el panel a la derecha de la ventana; ≤900 px, debajo.
    const caja = await pag.evaluate(() => {
      const d = document.querySelector("pvpc-bono-social-card").shadowRoot.querySelector("dialog.ventana");
      const p = d.querySelector(".ventana-principal").getBoundingClientRect();
      const a = d.querySelector(".anexo").getBoundingClientRect();
      return { pDer: p.right, pAbajo: p.bottom, aIzq: a.left, aArriba: a.top, aAncho: a.width };
    });
    if (c.ancho > 900 ? caja.aIzq < caja.pDer - 1 : caja.aArriba < caja.pAbajo - 1) mal.push(`panel mal colocado ${JSON.stringify(caja)}`);
    const ancho = await pag.evaluate(() => document.documentElement.scrollWidth);
    if (ancho > c.ancho) mal.push(`el histórico se sale de la pantalla (${ancho} px)`);
    // Uno a la vez: «Comparar tarifas» lo cierra y abre el suyo; «Histórico» vuelve; «Subir factura» lo cierra.
    await pag.locator(`${dentro} >> button.btn-comparar`).click();
    await pag.waitForTimeout(300);
    if ((await pag.locator("dialog.ventana .anexo").count()) !== 1 || (await pag.locator("dialog.ventana .anexo.historico").count()))
      mal.push("comparar no cierra el histórico");
    await pag.locator(`${dentro} >> button.btn-historico`).click();
    await pag.waitForTimeout(200);
    if ((await pag.locator("dialog.ventana .anexo").count()) !== 1 || !(await pag.locator("dialog.ventana .anexo.historico").count()))
      mal.push("el histórico no vuelve tras comparar");
    if (c.historico === "datos") {
      await pag.locator(`${dentro} >> button.btn-subir`).click();
      await pag.waitForTimeout(200);
      if ((await pag.locator("dialog.ventana .anexo.historico").count()) || !(await pag.locator("dialog.ventana .anexo.subida").count()))
        mal.push("subir no cierra el histórico");
    }
  }
  if (c.subir) {
    // Ventana → «Subir factura» → dos archivos (un PDF y un ZIP) → revisar → guardar las dos.
    await pag.locator("pvpc-bono-social-card >> button.abrir").first().click();
    await pag.locator("dialog.ventana pvpc-bono-social-card >> button.btn-subir").click();
    await pag.locator("dialog.ventana .anexo input.sub-archivos").setInputFiles([
      { name: "marzo.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 prueba") },
      { name: "facturas.zip", mimeType: "application/zip", buffer: Buffer.from("PK prueba") },
    ]);
    await pag.locator("dialog.ventana .anexo .sub-factura").nth(1).waitFor();
    const anexo = pag.locator("dialog.ventana .anexo");
    const texto = await anexo.innerText();
    for (const t of ["Subir factura", "febrero.pdf", "marzo.pdf", "Se quedan fuera", "otra.pdf", "Guardar 2 facturas"])
      if (!texto.includes(t)) mal.push(`subida sin «${t}»`);
    const total = await anexo.locator(".sub-factura").nth(1).locator("input[name=total]").inputValue();
    if (total !== "180.55") mal.push(`total leído ${total}`);
    // Se corrige un dato antes de guardar, como en el formulario del flujo.
    await anexo.locator(".sub-factura").first().locator("input[name=kwh_p3]").fill("351");
    await anexo.locator(".anexo-pie button.btn-subir").click();
    await anexo.locator(".anexo-aviso.hecho").waitFor();
    const llamadas = await pag.evaluate(() => window.llamadas);
    const guardadas = llamadas.filter(([s]) => s === "conciliar_factura").map(([, d]) => `${d.inicio}:${d.kwh_p3}:${d.total}:${d.comprobar}`);
    if (llamadas.filter(([s]) => s === "subir").length !== 2) mal.push(`subidas ${JSON.stringify(llamadas)}`);
    const leer = llamadas.find(([s]) => s === "leer_facturas");
    if (JSON.stringify(leer?.[1]) !== JSON.stringify({ suministro: "d1", archivos: ["id-marzo.pdf", "id-facturas.zip"] }))
      mal.push(`leer_facturas ${JSON.stringify(leer)}`);
    if (JSON.stringify(guardadas) !== JSON.stringify(["2026-02-12:351:150:false", "2026-03-12:350:180.55:true"]))
      mal.push(`conciliar_factura ${JSON.stringify(guardadas)}`);
    if (!(await anexo.innerText()).includes("2 facturas introducidas")) mal.push("sin «2 facturas introducidas»");
    // A mano, sin datos: no llama al servicio y dice qué falta.
    await anexo.locator("button.btn-subir.secundario").click();
    // Pulsar otra vez no crea una segunda en blanco: deja el cursor en la que ya hay.
    await anexo.locator("button.btn-subir.secundario").click();
    await pag.waitForTimeout(100);
    const enBlanco = await anexo.locator(".sub-factura").count();
    if (enBlanco !== 1) mal.push(`«Añadir a mano» dos veces deja ${enBlanco} facturas`);
    if (!(await anexo.locator(".sub-factura input[name=inicio]").evaluate((el) => el.matches(":focus"))))
      mal.push("«Añadir a mano» no lleva el cursor a la factura en blanco");
    await anexo.locator(".anexo-pie button.btn-subir").click();
    await anexo.locator(".sub-factura .anexo-aviso.error").waitFor();
    const n = (await pag.evaluate(() => window.llamadas)).filter(([s]) => s === "conciliar_factura").length;
    if (n !== 2) mal.push(`factura a mano vacía enviada (${n})`);
    const ancho = await pag.evaluate(() => document.documentElement.scrollWidth);
    if (ancho > c.ancho) mal.push(`la subida se sale de la pantalla (${ancho} px)`);
  }
  if (c.idiomas) {
    // Los cinco idiomas con las mismas claves que el español (las funciones, con los mismos
    // parámetros), en la tarjeta y en el editor; y los errores de los servicios, traducidos.
    const r = await pag.evaluate(async () => {
      const forma = (o) =>
        Object.fromEntries(
          Object.entries(o).map(([k, v]) => [
            k,
            typeof v === "function" ? `función(${v.length})` : Array.isArray(v) ? `lista(${v.length})` : v && typeof v === "object" ? forma(v) : typeof v,
          ]),
        );
      const rutas = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? rutas(v, `${p}${k}.`) : [`${p}${k}=${v}`]));
      // Vacíos donde el español sí tiene texto (el de «depende» va vacío a propósito).
      const vacios = (o, es, p = "") =>
        Object.entries(o).flatMap(([k, v]) =>
          typeof v === "string" ? (v.trim() || !es?.[k] ? [] : [`${p}${k}`]) : v && typeof v === "object" ? vacios(v, es?.[k], `${p}${k}.`) : [],
        );
      const { tarjeta, editor } = customElements.get("pvpc-bono-social-card").textos;
      const mal = [];
      for (const [nombre, textos] of [["tarjeta", tarjeta], ["editor", editor]]) {
        const es = new Set(rutas(forma(textos.es)));
        for (const idioma of ["en", "ca", "gl", "eu"]) {
          if (!textos[idioma]) {
            mal.push(`${nombre}: sin ${idioma}`);
            continue;
          }
          const otro = new Set(rutas(forma(textos[idioma])));
          const faltan = [...es].filter((x) => !otro.has(x));
          const sobran = [...otro].filter((x) => !es.has(x));
          if (faltan.length || sobran.length) mal.push(`${nombre} ${idioma}: faltan ${faltan.join(", ")} · sobran ${sobran.join(", ")}`);
          const huecos = vacios(textos[idioma], textos.es);
          if (huecos.length) mal.push(`${nombre} ${idioma}: vacíos ${huecos.join(", ")}`);
        }
      }
      const t = document.querySelector("pvpc-bono-social-card");
      const traducciones = { "component.pvpc_bonosocial.exceptions.sin_comparativa.message": "Encara no hi ha cap comparativa ({n})" };
      t.hass = { ...t.hass, loadBackendTranslation: async () => (clave, datos) => (traducciones[clave] ?? "").replace("{n}", datos.n) };
      const traducido = await t._mensajeError({ translation_domain: "pvpc_bonosocial", translation_key: "sin_comparativa", translation_placeholders: { n: 1 }, message: "There is no comparison yet" });
      const sinClave = await t._mensajeError({ message: "Error de red" });
      const sinTraduccion = await t._mensajeError({ translation_domain: "pvpc_bonosocial", translation_key: "otra", message: "Other" });
      if (traducido !== "Encara no hi ha cap comparativa (1)") mal.push(`error traducido «${traducido}»`);
      if (sinClave !== "Error de red" || sinTraduccion !== "Other") mal.push(`errores sin traducción «${sinClave}» «${sinTraduccion}»`);
      return mal;
    });
    mal.push(...r);
  }
  if (c.editorIdioma) {
    // El editor en cada idioma: etiquetas, ayudas, secciones y opciones de su bloque.
    const r = await pag.evaluate(async (idioma) => {
      const { editor: textos } = customElements.get("pvpc-bono-social-card").textos;
      const editor = await customElements.get("pvpc-bono-social-card").getConfigElement();
      editor.setConfig({ type: "custom:pvpc-bono-social-card" });
      editor.hass = document.querySelector("pvpc-bono-social-card").hass;
      document.body.appendChild(editor);
      await editor.updateComplete;
      const form = editor.shadowRoot.querySelector("ha-form");
      const te = textos[idioma] ?? textos.en;
      const mal = [];
      if (form.computeLabel({ name: "graph" }) !== te.etiquetas.graph) mal.push(`etiqueta ${form.computeLabel({ name: "graph" })}`);
      if (form.computeHelper({ name: "graph" }) !== te.ayudas.graph) mal.push(`ayuda ${form.computeHelper({ name: "graph" })}`);
      if (form.schema[0].title !== te.secciones.cabecera) mal.push(`sección ${form.schema[0].title}`);
      const icono = form.schema[0].schema.find((s) => s.name === "icon_color").selector.select.options.map((o) => o.label);
      if (JSON.stringify(icono) !== JSON.stringify(Object.values(te.opciones.icon_color))) mal.push(`opciones ${icono}`);
      return mal;
    }, c.editorIdioma);
    mal.push(...r);
  }
  if (c.solapes !== undefined && info.solapes !== c.solapes) mal.push(`${info.solapes} etiquetas de mes se pisan`);
  if (info.ancho > c.ancho) mal.push(`se sale de la pantalla (${info.ancho} px)`);
  console.log(`${mal.length ? "✗" : "✓"} ${c.nombre}${mal.length ? ": " + mal.join("; ") : ""}`);
  fallos.push(...mal);
  await pag.close();
}
await navegador.close();
servidor.close();
process.exit(fallos.length ? 1 : 0);
