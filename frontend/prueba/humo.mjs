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
  if (c.solapes !== undefined && info.solapes !== c.solapes) mal.push(`${info.solapes} etiquetas de mes se pisan`);
  if (info.ancho > c.ancho) mal.push(`se sale de la pantalla (${info.ancho} px)`);
  console.log(`${mal.length ? "✗" : "✓"} ${c.nombre}${mal.length ? ": " + mal.join("; ") : ""}`);
  fallos.push(...mal);
  await pag.close();
}
await navegador.close();
servidor.close();
process.exit(fallos.length ? 1 : 0);
