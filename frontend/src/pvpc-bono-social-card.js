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

const VERSION = "2.0.0";
const ETIQUETA = "pvpc-bono-social-card";
const COLORES = ["var(--pvpc-bs-verde)", "var(--pvpc-bs-amarillo)", "var(--pvpc-bs-naranja)", "var(--pvpc-bs-rojo)"];
const COLOR_PERIODO = { P1: 3, P2: 2, P3: 0 };
// Colores de hoy y de mañana de la tarjeta antigua (pvpc-hourly-pricing-card).
const COLOR_HOY = "#4269d0";
const COLOR_MANANA = "#f4bd4a";
/** Color de la configuración: «#4269d0», cualquier color CSS o [r, g, b] (selector de color del editor). */
// Orden de los avisos de la comparativa (igual que ORDEN_AVISOS de comparativa.py).
const ORDEN_AVISOS = [
  "pierde_bono",
  "bono_perdido",
  "bono_nuevo",
  "bono_termico",
  "prevision_volatil",
  "cobertura_incompleta",
  "datos_extrapolados",
  "facturas_estimadas",
  "revision_precios",
  "sin_ofertas",
];
const ordenAviso = (a) => (ORDEN_AVISOS.includes(a) ? ORDEN_AVISOS.indexOf(a) : ORDEN_AVISOS.length);

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
    anterior_corto: "Anterior",
    en_curso_corto: "En curso",
    estimada_corto: "Estimada",
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
      tu_tarifa: "Lo que pagaste (último año)",
      prevision: "PVPC previsto (CNMC, próximos 12 meses)",
      prevision_bono: "con tu bono, si se cumple la previsión",
      prevision_sin_bono: "sin bono, si se cumple la previsión",
      ultimo_anio: "último año",
      con_prevision: "previsión",
      revision: (r) => `revisión ${r}`,
      revisiones: { mensual: "mensual", trimestral: "trimestral", cuatrimestral: "tres veces al año", semestral: "semestral", anual: "anual", bienal: "cada dos años", trienal: "cada tres años", quinquenal: "cada cinco años" },
      depende: (pasadoOferta, x, futuroOferta, y) =>
        `${pasadoOferta ? `Con los precios del último año, la mejor oferta te habría salido ${x} más barata` : `Con los precios del último año, el PVPC te salió ${x} más barato que la mejor oferta`}; ${futuroOferta ? `con la previsión de la CNMC para los próximos 12 meses, la mejor oferta saldría ${y} más barata` : `con la previsión de la CNMC para los próximos 12 meses, el PVPC saldría ${y} más barato`}. Vuelve a comparar antes de decidir.`,
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
        depende_precios: ["Depende de los precios", ""],
      },
      avisos: {
        pierde_bono: "Con otra comercializadora pierdes el bono social.",
        bono_perdido: "Ya no tienes bono social: se compara con lo que pagarías sin él.",
        bono_nuevo: "Parte de lo pagado no llevaba el bono que tienes ahora: el ahorro real sería menor.",
        cobertura_incompleta: "No están en el comparador: {ausentes}.",
        datos_extrapolados: "Solo hay {dias} días de facturas: lo pagado y el consumo se han llevado a un año.",
        facturas_estimadas: "Hay facturas estimadas: concilia las reales para afinar.",
        sin_ofertas: "La CNMC no ha devuelto ofertas para tu código postal.",
        revision_precios: "La mejor oferta revisa sus precios ({revision}); la CNMC calcula sus importes sin esas revisiones.",
        prevision_volatil: "La previsión de la CNMC para el PVPC sale de los precios del mercado de futuros de hoy y cambia mucho de un mes a otro: es un escenario, no lo que vas a pagar.",
        bono_termico: "Si cambias de comercializadora antes del 1 de enero, no tendrás el bono social a 31 de diciembre y perderás el bono social térmico que se cobra el próximo año: una ayuda en dinero (mínimo 50 €) que recibes aunque no tengas gas. Para no perderlo, cámbiate a partir del 1 de enero.",
      },
      cerrar: "Cerrar la comparativa",
      leer_avisos: "👇 Antes de decidir, lee los avisos del final.",
      leer_avisos_termico: "👇 Antes de decidir, lee los avisos del final: hay uno importante sobre el bono social térmico.",
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
      // Termómetro: la mejor oferta de hoy frente a la mejor de cada mes anterior guardado (€/kWh).
      termometro: (pos, n, x, mesBarata, barata, mesCara, cara) =>
        pos === "mas_barata"
          ? `La mejor oferta de hoy (${x}) es la más barata (en €/kWh) de los últimos ${n} meses.`
          : pos === "mas_cara"
            ? `La mejor oferta de hoy (${x}) es la más cara (en €/kWh) de los últimos ${n} meses.`
            : `La mejor oferta de hoy (${x}) está entre la más barata (${mesBarata}, ${barata}) y la más cara (${mesCara}, ${cara}) de los últimos ${n} meses.`,
    },
    // «Histórico»: el podio de ofertas de cada mes (atributo `historico` de «Mejor alternativa»).
    hist: {
      boton: "Histórico",
      titulo: "Histórico de comparativas",
      intro: "Las 3 ofertas más baratas de cada mes (importe del primer año), la previsión más baja de la CNMC para el PVPC y lo pagado según la última comparativa del mes.",
      vacio: "Aún no hay comparativas guardadas.",
      mejor: "mejor oferta",
      prevision: "CNMC",
      pagado: "pagado",
      kwh: (x) => `${x} kWh/año`,
      cerrar: "Cerrar el histórico",
    },
    // «Subir factura»: el lector de «Factura real» (servicio leer_facturas) y conciliar_factura.
    sub: {
      boton: "Subir factura",
      titulo: "Subir factura",
      intro: "Elige el PDF de la factura, varios a la vez o un ZIP con varias: se leen sus datos para que los revises antes de guardarlos. Solo se leen las facturas de la Comercializadora Regulada, Gas & Power (Naturgy); con otras, añádela a mano.",
      elegir: "Elegir PDF o ZIP",
      a_mano: "Añadir a mano",
      leyendo: "Leyendo las facturas…",
      manual: "Factura a mano",
      quitar: "Quitar",
      campos: {
        inicio: "Inicio del periodo",
        fin: "Fin del periodo",
        emision: "Fecha de emisión",
        total: "Total de la factura (€)",
        kwh_p1: "Consumo en P1 (kWh)",
        kwh_p2: "Consumo en P2 (kWh)",
        kwh_p3: "Consumo en P3 (kWh)",
        kwh_bonificados: "Consumo bonificado (kWh)",
      },
      revisar: "Revisa los datos tal como vienen en la factura. Una factura que se solape con otra ya introducida (por ejemplo, una rectificativa) la sustituye.",
      fuera: "Se quedan fuera:",
      guardar: (n) => (n === 1 ? "Guardar la factura" : `Guardar ${n} facturas`),
      guardando: "Guardando…",
      hechas: (n) => (n === 1 ? "Factura introducida ✓" : `${n} facturas introducidas ✓`),
      faltan: "Faltan datos: las fechas del periodo, el consumo de P1, P2 y P3 y el total son obligatorios.",
      demasiados: (n) => `Como mucho ${n} archivos a la vez.`,
      no_subido: "no se ha podido subir",
      error: "No se han podido leer las facturas",
      cerrar: "Cerrar",
      sin_suministro: "No se encuentra el suministro de la factura",
    },
  },
  en: {
    titulo: "Electricity price",
    anterior: "Previous bill",
    en_curso: "Current bill",
    estimada_cierre: "Estimated bill",
    anterior_corto: "Previous",
    en_curso_corto: "Current",
    estimada_corto: "Estimated",
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
      tu_tarifa: "What you paid (last year)",
      prevision: "Forecast PVPC (CNMC, next 12 months)",
      prevision_bono: "with your bonus, if the forecast holds",
      prevision_sin_bono: "without bonus, if the forecast holds",
      ultimo_anio: "last year",
      con_prevision: "forecast",
      revision: (r) => `review ${r}`,
      revisiones: { mensual: "monthly", trimestral: "quarterly", cuatrimestral: "three times a year", semestral: "every six months", anual: "yearly", bienal: "every two years", trienal: "every three years", quinquenal: "every five years" },
      depende: (pasadoOferta, x, futuroOferta, y) =>
        `${pasadoOferta ? `At last year's prices, the best offer would have been ${x} cheaper` : `At last year's prices, PVPC was ${x} cheaper than the best offer`}; ${futuroOferta ? `with the CNMC forecast for the next 12 months, the best offer would be ${y} cheaper` : `with the CNMC forecast for the next 12 months, PVPC would be ${y} cheaper`}. Compare again before deciding.`,
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
        depende_precios: ["It depends on prices", ""],
      },
      avisos: {
        pierde_bono: "Switching retailer loses the social bonus.",
        bono_perdido: "You no longer have the social bonus: compared with what you would pay without it.",
        bono_nuevo: "Part of what you paid did not have your current bonus: real savings would be smaller.",
        cobertura_incompleta: "Not in the comparator: {ausentes}.",
        datos_extrapolados: "Only {dias} days of bills: payments and consumption extrapolated to a year.",
        facturas_estimadas: "Some bills are estimates: reconcile the real ones to refine.",
        sin_ofertas: "The CNMC returned no offers for your postal code.",
        revision_precios: "The best offer reviews its prices ({revision}); the CNMC works out its amounts without those reviews.",
        prevision_volatil: "The CNMC forecast for PVPC comes from today's futures market prices and changes a lot from month to month: it is a scenario, not what you will pay.",
        bono_termico: "If you switch retailer before 1 January, you won't have the social bonus on 31 December and you'll lose the thermal social bonus paid next year: a cash aid (at least €50) you get even if you have no gas. To keep it, switch on or after 1 January.",
      },
      cerrar: "Close the comparison",
      leer_avisos: "👇 Before deciding, read the notes at the end.",
      leer_avisos_termico: "👇 Before deciding, read the notes at the end: there is an important one about the thermal social bonus.",
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
      termometro: (pos, n, x, mesBarata, barata, mesCara, cara) =>
        pos === "mas_barata"
          ? `Today's best offer (${x}) is the cheapest (per kWh) of the last ${n} months.`
          : pos === "mas_cara"
            ? `Today's best offer (${x}) is the most expensive (per kWh) of the last ${n} months.`
            : `Today's best offer (${x}) is between the cheapest (${mesBarata}, ${barata}) and the most expensive (${mesCara}, ${cara}) of the last ${n} months.`,
    },
    hist: {
      boton: "History",
      titulo: "Comparison history",
      intro: "The 3 cheapest offers of each month (first-year amount), the lowest CNMC forecast for PVPC and what you paid according to the month's last comparison.",
      vacio: "No saved comparisons yet.",
      mejor: "best offer",
      prevision: "CNMC",
      pagado: "paid",
      kwh: (x) => `${x} kWh/year`,
      cerrar: "Close the history",
    },
    sub: {
      boton: "Upload bill",
      titulo: "Upload bill",
      intro: "Choose the bill PDF, several at once or a ZIP with several: their data is read so you can review it before saving. Only bills from Comercializadora Regulada, Gas & Power (Naturgy) are read; for others, add it by hand.",
      elegir: "Choose PDF or ZIP",
      a_mano: "Add by hand",
      leyendo: "Reading the bills…",
      manual: "Bill entered by hand",
      quitar: "Remove",
      campos: {
        inicio: "Period start",
        fin: "Period end",
        emision: "Issue date",
        total: "Bill total (€)",
        kwh_p1: "P1 consumption (kWh)",
        kwh_p2: "P2 consumption (kWh)",
        kwh_p3: "P3 consumption (kWh)",
        kwh_bonificados: "Discounted consumption (kWh)",
      },
      revisar: "Check the data exactly as it appears on the bill. A bill overlapping one already entered (for example, a corrective bill) replaces it.",
      fuera: "Left out:",
      guardar: (n) => (n === 1 ? "Save the bill" : `Save ${n} bills`),
      guardando: "Saving…",
      hechas: (n) => (n === 1 ? "Bill entered ✓" : `${n} bills entered ✓`),
      faltan: "Missing data: the period dates, P1, P2 and P3 consumption and the total are required.",
      demasiados: (n) => `At most ${n} files at a time.`,
      no_subido: "could not be uploaded",
      error: "The bills could not be read",
      cerrar: "Close",
      sin_suministro: "The supply of the bill cannot be found",
    },
  },
  ca: {
    titulo: "Preu de la llum",
    anterior: "Factura del període anterior",
    en_curso: "Factura del període en curs",
    estimada_cierre: "Factura estimada",
    anterior_corto: "Anterior",
    en_curso_corto: "En curs",
    estimada_corto: "Estimada",
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
    comp: {
      boton: "Comparar tarifes",
      comparando: "Comparant…",
      titulo: "Comparativa de tarifes",
      ultima: "Última comparació",
      facturas: (n) => (n === 1 ? "1 factura" : `${n} factures`),
      dias: (n) => `${n} dies`,
      ofertas: (n) => `${n} ofertes de la CNMC`,
      tu_tarifa: "El que vas pagar (últim any)",
      prevision: "PVPC previst (CNMC, pròxims 12 mesos)",
      prevision_bono: "amb el teu bo, si es compleix la previsió",
      prevision_sin_bono: "sense bo, si es compleix la previsió",
      ultimo_anio: "últim any",
      con_prevision: "previsió",
      revision: (r) => `revisió ${r}`,
      revisiones: { mensual: "mensual", trimestral: "trimestral", cuatrimestral: "tres vegades l'any", semestral: "semestral", anual: "anual", bienal: "cada dos anys", trienal: "cada tres anys", quinquenal: "cada cinc anys" },
      depende: (pasadoOferta, x, futuroOferta, y) =>
        `${pasadoOferta ? `Amb els preus de l'últim any, la millor oferta t'hauria sortit ${x} més barata` : `Amb els preus de l'últim any, el PVPC et va sortir ${x} més barat que la millor oferta`}; ${futuroOferta ? `amb la previsió de la CNMC per als pròxims 12 mesos, la millor oferta sortiria ${y} més barata` : `amb la previsió de la CNMC per als pròxims 12 mesos, el PVPC sortiria ${y} més barat`}. Torna a comparar abans de decidir.`,
      pvpc_bono: "PVPC amb bo social",
      pvpc: "PVPC sense bo",
      al_anio: "/any",
      sin_permanencia: "sense permanència",
      permanencia: "permanència",
      nuevos: "només clients nous",
      verde: "verda",
      espera: "Consultant la CNMC amb les teves factures. Pot trigar uns segons…",
      error: "No s'ha pogut comparar",
      sin_datos: "Encara no hi ha cap comparativa.",
      sin_suministro: "No es troba el subministrament de la comparativa",
      estados: {
        sin_codigo_postal: "Falta el codi postal del subministrament (opcions del subministrament).",
        sin_datos: "No hi ha prou factures per comparar.",
        cnmc_no_responde: "El comparador de la CNMC no respon; torna-ho a provar més tard.",
      },
      veredictos: {
        quedarse_con_bono: ["Continua amb PVPC + bo social", "Amb el teu bo, el PVPC continua sent el més barat: la millor oferta lliure et costaria {x} més l'any."],
        libre_aunque_pierde_bono: ["Hi ha una oferta més barata", "La millor oferta lliure surt {x} més barata l'any que el que pagues amb bo, tot i que el perdries. Comprova les condicions abans de canviar."],
        mercado_libre: ["Pots estalviar", "Amb la millor oferta t'estalviaries {x} l'any."],
        quedarse: ["Continua amb la teva tarifa", "Cap oferta millora el que pagues: la millor et costaria {x} més l'any."],
        depende_precios: ["Depèn dels preus", ""],
      },
      avisos: {
        pierde_bono: "Amb una altra comercialitzadora perds el bo social.",
        bono_perdido: "Ja no tens bo social: es compara amb el que pagaries sense.",
        bono_nuevo: "Part del que s'ha pagat no portava el bo que tens ara: l'estalvi real seria menor.",
        cobertura_incompleta: "No són al comparador: {ausentes}.",
        datos_extrapolados: "Només hi ha {dias} dies de factures: el que s'ha pagat i el consum s'han extrapolat a un any.",
        facturas_estimadas: "Hi ha factures estimades: concilia les reals per afinar.",
        sin_ofertas: "La CNMC no ha retornat ofertes per al teu codi postal.",
        revision_precios: "La millor oferta revisa els seus preus ({revision}); la CNMC en calcula els imports sense aquestes revisions.",
        prevision_volatil: "La previsió de la CNMC per al PVPC surt dels preus del mercat de futurs d'avui i canvia molt d'un mes a l'altre: és un escenari, no el que pagaràs.",
        bono_termico: "Si canvies de comercialitzadora abans de l'1 de gener, no tindràs el bo social a 31 de desembre i perdràs el bo social tèrmic que es cobra l'any vinent: un ajut en diners (mínim 50 €) que reps encara que no tinguis gas. Per no perdre'l, canvia a partir de l'1 de gener.",
      },
      cerrar: "Tanca la comparativa",
      leer_avisos: "👇 Abans de decidir, llegeix els avisos del final.",
      leer_avisos_termico: "👇 Abans de decidir, llegeix els avisos del final: n'hi ha un d'important sobre el bo social tèrmic.",
      confirmar: "Els preus són els que publica la CNMC i poden estar desfasats: confirma'ls amb la comercialitzadora abans de contractar.",
      ficha: "Fitxa de l'oferta a la CNMC (amb el web de la comercialitzadora)",
      cnmc: "Veure totes les ofertes al comparador de la CNMC",
      cnmc_datos: (n) => `${n ? `Les ${n} ofertes` : "Totes les ofertes"}, calculades amb el teu consum i la teva potència`,
      pvpc_cnmc: (x, p, b) =>
        b
          ? `PVPC segons la CNMC: ${x} sense bo amb els preus de l'últim any · previsió per a l'any vinent: ${p} sense bo, ≈${b} amb el teu bo`
          : p
            ? `PVPC sense bo segons la CNMC: ${x} amb els preus de l'últim any · previsió per a l'any vinent: ${p}`
            : `PVPC sense bo segons la CNMC: ${x} amb els preus de l'últim any`,
      enviar: (a) => `Envia a ${a}`,
      enviando: "Enviant…",
      enviado: "Enviada ✓",
      termometro: (pos, n, x, mesBarata, barata, mesCara, cara) =>
        pos === "mas_barata"
          ? `La millor oferta d'avui (${x}) és la més barata (en €/kWh) dels últims ${n} mesos.`
          : pos === "mas_cara"
            ? `La millor oferta d'avui (${x}) és la més cara (en €/kWh) dels últims ${n} mesos.`
            : `La millor oferta d'avui (${x}) està entre la més barata (${mesBarata}, ${barata}) i la més cara (${mesCara}, ${cara}) dels últims ${n} mesos.`,
    },
    hist: {
      boton: "Històric",
      titulo: "Històric de comparatives",
      intro: "Les 3 ofertes més barates de cada mes (import del primer any), la previsió més baixa de la CNMC per al PVPC i el que s'ha pagat segons l'última comparativa del mes.",
      vacio: "Encara no hi ha comparatives desades.",
      mejor: "millor oferta",
      prevision: "CNMC",
      pagado: "pagat",
      kwh: (x) => `${x} kWh/any`,
      cerrar: "Tanca l'històric",
    },
    sub: {
      boton: "Pujar factura",
      titulo: "Pujar factura",
      intro: "Tria el PDF de la factura, diversos alhora o un ZIP amb diverses factures: se'n llegeixen les dades perquè les revisis abans de desar-les. Només es llegeixen les factures de la Comercializadora Regulada, Gas & Power (Naturgy); amb altres, afegeix-la a mà.",
      elegir: "Tria un PDF o ZIP",
      a_mano: "Afegeix a mà",
      leyendo: "Llegint les factures…",
      manual: "Factura a mà",
      quitar: "Treu",
      campos: {
        inicio: "Inici del període",
        fin: "Fi del període",
        emision: "Data d'emissió",
        total: "Total de la factura (€)",
        kwh_p1: "Consum en P1 (kWh)",
        kwh_p2: "Consum en P2 (kWh)",
        kwh_p3: "Consum en P3 (kWh)",
        kwh_bonificados: "Consum bonificat (kWh)",
      },
      revisar: "Revisa les dades tal com figuren a la factura. Una factura que se solapi amb una altra ja introduïda (per exemple, una rectificativa) la substitueix.",
      fuera: "Queden fora:",
      guardar: (n) => (n === 1 ? "Desa la factura" : `Desa ${n} factures`),
      guardando: "Desant…",
      hechas: (n) => (n === 1 ? "Factura introduïda ✓" : `${n} factures introduïdes ✓`),
      faltan: "Falten dades: les dates del període, el consum de P1, P2 i P3 i el total són obligatoris.",
      demasiados: (n) => `Com a màxim ${n} fitxers alhora.`,
      no_subido: "no s'ha pogut pujar",
      error: "No s'han pogut llegir les factures",
      cerrar: "Tanca",
      sin_suministro: "No es troba el subministrament de la factura",
    },
  },
  gl: {
    titulo: "Prezo da luz",
    anterior: "Factura do período anterior",
    en_curso: "Factura do período en curso",
    estimada_cierre: "Factura estimada",
    anterior_corto: "Anterior",
    en_curso_corto: "En curso",
    estimada_corto: "Estimada",
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
    comp: {
      boton: "Comparar tarifas",
      comparando: "Comparando…",
      titulo: "Comparativa de tarifas",
      ultima: "Última comparación",
      facturas: (n) => (n === 1 ? "1 factura" : `${n} facturas`),
      dias: (n) => `${n} días`,
      ofertas: (n) => `${n} ofertas da CNMC`,
      tu_tarifa: "O que pagaches (último ano)",
      prevision: "PVPC previsto (CNMC, próximos 12 meses)",
      prevision_bono: "co teu bono, se se cumpre a previsión",
      prevision_sin_bono: "sen bono, se se cumpre a previsión",
      ultimo_anio: "último ano",
      con_prevision: "previsión",
      revision: (r) => `revisión ${r}`,
      revisiones: { mensual: "mensual", trimestral: "trimestral", cuatrimestral: "tres veces ao ano", semestral: "semestral", anual: "anual", bienal: "cada dous anos", trienal: "cada tres anos", quinquenal: "cada cinco anos" },
      depende: (pasadoOferta, x, futuroOferta, y) =>
        `${pasadoOferta ? `Cos prezos do último ano, a mellor oferta saíriache ${x} máis barata` : `Cos prezos do último ano, o PVPC saíuche ${x} máis barato que a mellor oferta`}; ${futuroOferta ? `coa previsión da CNMC para os próximos 12 meses, a mellor oferta sairía ${y} máis barata` : `coa previsión da CNMC para os próximos 12 meses, o PVPC sairía ${y} máis barato`}. Volve comparar antes de decidir.`,
      pvpc_bono: "PVPC con bono social",
      pvpc: "PVPC sen bono",
      al_anio: "/ano",
      sin_permanencia: "sen permanencia",
      permanencia: "permanencia",
      nuevos: "só clientes novos",
      verde: "verde",
      espera: "Consultando a CNMC coas túas facturas. Pode tardar uns segundos…",
      error: "Non foi posible comparar",
      sin_datos: "Aínda non hai ningunha comparativa.",
      sin_suministro: "Non se atopa a subministración da comparativa",
      estados: {
        sin_codigo_postal: "Falta o código postal da subministración (opcións da subministración).",
        sin_datos: "Non hai facturas suficientes para comparar.",
        cnmc_no_responde: "O comparador da CNMC non responde; téntao máis tarde.",
      },
      veredictos: {
        quedarse_con_bono: ["Segue co PVPC + bono social", "Co teu bono, o PVPC segue sendo o máis barato: a mellor oferta libre custaríache {x} máis ao ano."],
        libre_aunque_pierde_bono: ["Hai unha oferta máis barata", "A mellor oferta libre sae {x} máis barata ao ano do que pagas con bono, aínda que o perderías. Comproba as condicións antes de cambiar."],
        mercado_libre: ["Podes aforrar", "Coa mellor oferta aforrarías {x} ao ano."],
        quedarse: ["Segue coa túa tarifa", "Ningunha oferta mellora o que pagas: a mellor custaríache {x} máis ao ano."],
        depende_precios: ["Depende dos prezos", ""],
      },
      avisos: {
        pierde_bono: "Con outra comercializadora perdes o bono social.",
        bono_perdido: "Xa non tes bono social: compárase co que pagarías sen el.",
        bono_nuevo: "Parte do pagado non levaba o bono que tes agora: o aforro real sería menor.",
        cobertura_incompleta: "Non están no comparador: {ausentes}.",
        datos_extrapolados: "Só hai {dias} días de facturas: o pagado e o consumo leváronse a un ano.",
        facturas_estimadas: "Hai facturas estimadas: concilia as reais para afinar.",
        sin_ofertas: "A CNMC non devolveu ofertas para o teu código postal.",
        revision_precios: "A mellor oferta revisa os seus prezos ({revision}); a CNMC calcula os seus importes sen esas revisións.",
        prevision_volatil: "A previsión da CNMC para o PVPC sae dos prezos do mercado de futuros de hoxe e cambia moito dun mes a outro: é un escenario, non o que vas pagar.",
        bono_termico: "Se cambias de comercializadora antes do 1 de xaneiro, non terás o bono social a 31 de decembro e perderás o bono social térmico que se cobra o próximo ano: unha axuda en diñeiro (mínimo 50 €) que recibes aínda que non teñas gas. Para non perdelo, cambia a partir do 1 de xaneiro.",
      },
      cerrar: "Pechar a comparativa",
      leer_avisos: "👇 Antes de decidir, le os avisos do final.",
      leer_avisos_termico: "👇 Antes de decidir, le os avisos do final: hai un importante sobre o bono social térmico.",
      confirmar: "Os prezos son os que publica a CNMC e poden estar desfasados: confírmaos coa comercializadora antes de contratar.",
      ficha: "Ficha da oferta na CNMC (coa web da comercializadora)",
      cnmc: "Ver todas as ofertas no comparador da CNMC",
      cnmc_datos: (n) => `${n ? `As ${n} ofertas` : "Todas as ofertas"}, calculadas co teu consumo e a túa potencia`,
      pvpc_cnmc: (x, p, b) =>
        b
          ? `PVPC segundo a CNMC: ${x} sen bono cos prezos do último ano · previsión para o próximo ano: ${p} sen bono, ≈${b} co teu bono`
          : p
            ? `PVPC sen bono segundo a CNMC: ${x} cos prezos do último ano · previsión para o próximo ano: ${p}`
            : `PVPC sen bono segundo a CNMC: ${x} cos prezos do último ano`,
      enviar: (a) => `Enviar a ${a}`,
      enviando: "Enviando…",
      enviado: "Enviada ✓",
      // Termómetro: la mejor oferta de hoy frente a la mejor de cada mes anterior guardado (€/kWh).
      termometro: (pos, n, x, mesBarata, barata, mesCara, cara) =>
        pos === "mas_barata"
          ? `A mellor oferta de hoxe (${x}) é a máis barata (en €/kWh) dos últimos ${n} meses.`
          : pos === "mas_cara"
            ? `A mellor oferta de hoxe (${x}) é a máis cara (en €/kWh) dos últimos ${n} meses.`
            : `A mellor oferta de hoxe (${x}) está entre a máis barata (${mesBarata}, ${barata}) e a máis cara (${mesCara}, ${cara}) dos últimos ${n} meses.`,
    },
    // «Histórico»: el podio de ofertas de cada mes (atributo `historico` de «Mejor alternativa»).
    hist: {
      boton: "Histórico",
      titulo: "Histórico de comparativas",
      intro: "As 3 ofertas máis baratas de cada mes (importe do primeiro ano), a previsión máis baixa da CNMC para o PVPC e o pagado segundo a última comparativa do mes.",
      vacio: "Aínda non hai comparativas gardadas.",
      mejor: "mellor oferta",
      prevision: "CNMC",
      pagado: "pagado",
      kwh: (x) => `${x} kWh/ano`,
      cerrar: "Pechar o histórico",
    },
    // «Subir factura»: el lector de «Factura real» (servicio leer_facturas) y conciliar_factura.
    sub: {
      boton: "Subir factura",
      titulo: "Subir factura",
      intro: "Escolle o PDF da factura, varios á vez ou un ZIP con varias: lense os seus datos para que os revises antes de gardalos. Só se len as facturas da Comercializadora Regulada, Gas & Power (Naturgy); con outras, engádea a man.",
      elegir: "Escoller PDF ou ZIP",
      a_mano: "Engadir a man",
      leyendo: "Lendo as facturas…",
      manual: "Factura a man",
      quitar: "Quitar",
      campos: {
        inicio: "Inicio do período",
        fin: "Fin do período",
        emision: "Data de emisión",
        total: "Total da factura (€)",
        kwh_p1: "Consumo en P1 (kWh)",
        kwh_p2: "Consumo en P2 (kWh)",
        kwh_p3: "Consumo en P3 (kWh)",
        kwh_bonificados: "Consumo bonificado (kWh)",
      },
      revisar: "Revisa os datos tal como veñen na factura. Unha factura que se solape con outra xa introducida (por exemplo, unha rectificativa) substitúea.",
      fuera: "Quedan fóra:",
      guardar: (n) => (n === 1 ? "Gardar a factura" : `Gardar ${n} facturas`),
      guardando: "Gardando…",
      hechas: (n) => (n === 1 ? "Factura introducida ✓" : `${n} facturas introducidas ✓`),
      faltan: "Faltan datos: as datas do período, o consumo de P1, P2 e P3 e o total son obrigatorios.",
      demasiados: (n) => `Como moito ${n} ficheiros á vez.`,
      no_subido: "non foi posible subilo",
      error: "Non foi posible ler as facturas",
      cerrar: "Pechar",
      sin_suministro: "Non se atopa a subministración da factura",
    },
  },
  eu: {
    titulo: "Argindarraren prezioa",
    anterior: "Aurreko aldiko faktura",
    en_curso: "Aldi honetako faktura",
    estimada_cierre: "Zenbatetsitako faktura",
    anterior_corto: "Aurrekoa",
    en_curso_corto: "Oraingoa",
    estimada_corto: "Zenbatetsia",
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
    periodos: { P1: "puntakoa", P2: "laua", P3: "harana" },
    sin_entidad: "Ez da aurkitu PVPC + Bono Social integrazioaren prezio-sentsorea",
    comp: {
      boton: "Alderatu tarifak",
      comparando: "Alderatzen…",
      titulo: "Tarifen konparaketa",
      ultima: "Azken konparaketa",
      facturas: (n) => (n === 1 ? "1 faktura" : `${n} faktura`),
      dias: (n) => `${n} egun`,
      ofertas: (n) => `CNMCren ${n} eskaintza`,
      tu_tarifa: "Ordaindu zenuena (azken urtea)",
      prevision: "Aurreikusitako PVPC (CNMC, hurrengo 12 hilabeteak)",
      prevision_bono: "zure bonuarekin, aurreikuspena betetzen bada",
      prevision_sin_bono: "bonurik gabe, aurreikuspena betetzen bada",
      ultimo_anio: "azken urtea",
      con_prevision: "aurreikuspena",
      revision: (r) => `berrikuspena: ${r}`,
      revisiones: { mensual: "hilero", trimestral: "hiru hilean behin", cuatrimestral: "urtean hiru aldiz", semestral: "sei hilean behin", anual: "urtero", bienal: "bi urtean behin", trienal: "hiru urtean behin", quinquenal: "bost urtean behin" },
      depende: (pasadoOferta, x, futuroOferta, y) =>
        `${pasadoOferta ? `Azken urteko prezioekin, eskaintza onenarekin ${x} gutxiago ordainduko zenukeen` : `Azken urteko prezioekin, PVPCarekin ${x} gutxiago ordaindu zenuen eskaintza onenarekin baino`}; ${futuroOferta ? `CNMCk hurrengo 12 hilabeteetarako egindako aurreikuspenarekin, eskaintza onenarekin ${y} gutxiago ordainduko zenuke` : `CNMCk hurrengo 12 hilabeteetarako egindako aurreikuspenarekin, PVPCarekin ${y} gutxiago ordainduko zenuke`}. Alderatu berriro erabaki aurretik.`,
      pvpc_bono: "PVPC gizarte-bonuarekin",
      pvpc: "PVPC bonurik gabe",
      al_anio: "/urte",
      sin_permanencia: "iraunkortasunik gabe",
      permanencia: "iraunkortasuna",
      nuevos: "bezero berrientzat soilik",
      verde: "berdea",
      espera: "CNMCri kontsultatzen zure fakturekin. Segundo batzuk behar izan ditzake…",
      error: "Ezin izan da alderatu",
      sin_datos: "Oraindik ez dago konparaketarik.",
      sin_suministro: "Ez da aurkitu konparaketaren hornidura",
      estados: {
        sin_codigo_postal: "Hornidurako posta-kodea falta da (hornidurako aukerak).",
        sin_datos: "Ez dago alderatzeko adina faktura.",
        cnmc_no_responde: "CNMCren konparatzaileak ez du erantzuten; saiatu berriro geroago.",
      },
      veredictos: {
        quedarse_con_bono: ["Jarraitu PVPC + gizarte-bonuarekin", "Zure bonuarekin, PVPC da oraindik merkeena: eskaintza libre onenak {x} gehiago kostatuko litzaizuke urtean."],
        libre_aunque_pierde_bono: ["Eskaintza merkeago bat dago", "Eskaintza libre onena urtean {x} merkeagoa da bonuarekin ordaintzen duzuna baino, nahiz eta bonua galdu. Egiaztatu baldintzak aldatu aurretik."],
        mercado_libre: ["Aurreztu dezakezu", "Eskaintza onenarekin {x} aurreztuko zenuke urtean."],
        quedarse: ["Jarraitu zure tarifarekin", "Eskaintza batek ere ez du hobetzen ordaintzen duzuna: onenak {x} gehiago kostatuko litzaizuke urtean."],
        depende_precios: ["Prezioen araberakoa da", ""],
      },
      avisos: {
        pierde_bono: "Beste merkaturatzaile batekin, gizarte-bonua galtzen duzu.",
        bono_perdido: "Jada ez duzu gizarte-bonurik: bonurik gabe ordainduko zenukeenarekin alderatzen da.",
        bono_nuevo: "Ordaindutakoaren zati batek ez zuen orain duzun bonua: benetako aurrezpena txikiagoa izango litzateke.",
        cobertura_incompleta: "Hauek ez daude konparatzailean: {ausentes}.",
        datos_extrapolados: "{dias} egunetako fakturak baino ez daude: ordaindutakoa eta kontsumoa urtebetera eraman dira.",
        facturas_estimadas: "Faktura zenbatetsiak daude: bateratu benetakoak doitzeko.",
        sin_ofertas: "CNMCk ez du eskaintzarik itzuli zure posta-koderako.",
        revision_precios: "Eskaintza onenak bere prezioak berrikusten ditu ({revision}); CNMCk berrikuspen horiek gabe kalkulatzen ditu zenbatekoak.",
        prevision_volatil: "CNMCk PVPCrako egiten duen aurreikuspena gaurko etorkizun-merkatuko prezioetatik ateratzen da, eta asko aldatzen da hilabete batetik bestera: agertoki bat da, ez ordainduko duzuna.",
        bono_termico: "Urtarrilaren 1a baino lehen merkaturatzailez aldatzen bazara, ez duzu gizarte-bonurik izango abenduaren 31n, eta hurrengo urtean kobratzen den gizarte-bono termikoa galduko duzu: diru-laguntza bat (gutxienez 50 €), gasik ez baduzu ere jasotzen duzuna. Ez galtzeko, aldatu urtarrilaren 1etik aurrera.",
      },
      cerrar: "Itxi konparaketa",
      leer_avisos: "👇 Erabaki aurretik, irakurri amaierako abisuak.",
      leer_avisos_termico: "👇 Erabaki aurretik, irakurri amaierako abisuak: bat garrantzitsua da gizarte-bono termikoari buruz.",
      confirmar: "Prezioak CNMCk argitaratutakoak dira, eta zaharkituta egon daitezke: berretsi merkaturatzailearekin kontratatu aurretik.",
      ficha: "Eskaintzaren fitxa CNMCn (merkaturatzailearen webgunearekin)",
      cnmc: "Ikusi eskaintza guztiak CNMCren konparatzailean",
      cnmc_datos: (n) => `${n ? `${n} eskaintzak` : "Eskaintza guztiak"}, zure kontsumoarekin eta potentziarekin kalkulatuta`,
      pvpc_cnmc: (x, p, b) =>
        b
          ? `PVPC, CNMCren arabera: ${x} bonurik gabe, azken urteko prezioekin · hurrengo urteko aurreikuspena: ${p} bonurik gabe, ≈${b} zure bonuarekin`
          : p
            ? `PVPC bonurik gabe, CNMCren arabera: ${x}, azken urteko prezioekin · hurrengo urteko aurreikuspena: ${p}`
            : `PVPC bonurik gabe, CNMCren arabera: ${x}, azken urteko prezioekin`,
      enviar: (a) => `Bidali hona: ${a}`,
      enviando: "Bidaltzen…",
      enviado: "Bidalita ✓",
      // Termómetro: la mejor oferta de hoy frente a la mejor de cada mes anterior guardado (€/kWh).
      termometro: (pos, n, x, mesBarata, barata, mesCara, cara) =>
        pos === "mas_barata"
          ? `Gaurko eskaintza onena (${x}) azken ${n} hilabeteetako merkeena da (€/kWh-tan).`
          : pos === "mas_cara"
            ? `Gaurko eskaintza onena (${x}) azken ${n} hilabeteetako garestiena da (€/kWh-tan).`
            : `Gaurko eskaintza onena (${x}) azken ${n} hilabeteetako merkeenaren (${mesBarata}, ${barata}) eta garestienaren (${mesCara}, ${cara}) artean dago.`,
    },
    // «Histórico»: el podio de ofertas de cada mes (atributo `historico` de «Mejor alternativa»).
    hist: {
      boton: "Historikoa",
      titulo: "Konparaketen historikoa",
      intro: "Hilabete bakoitzeko 3 eskaintza merkeenak (lehen urteko zenbatekoa), CNMCk PVPCrako egindako aurreikuspen baxuena eta ordaindutakoa, hilabeteko azken konparaketaren arabera.",
      vacio: "Oraindik ez dago gordetako konparaketarik.",
      mejor: "eskaintza onena",
      prevision: "CNMC",
      pagado: "ordaindua",
      kwh: (x) => `${x} kWh/urte`,
      cerrar: "Itxi historikoa",
    },
    // «Subir factura»: el lector de «Factura real» (servicio leer_facturas) y conciliar_factura.
    sub: {
      boton: "Igo faktura",
      titulo: "Igo faktura",
      intro: "Aukeratu fakturaren PDFa, hainbat batera edo hainbat dituen ZIP bat: haien datuak irakurtzen dira, gorde aurretik berrikus ditzazun. Comercializadora Regulada, Gas & Power (Naturgy) merkaturatzailearen fakturak soilik irakurtzen dira; besteekin, gehitu eskuz.",
      elegir: "Aukeratu PDFa edo ZIPa",
      a_mano: "Gehitu eskuz",
      leyendo: "Fakturak irakurtzen…",
      manual: "Eskuzko faktura",
      quitar: "Kendu",
      campos: {
        inicio: "Aldiaren hasiera",
        fin: "Aldiaren amaiera",
        emision: "Jaulkipen-data",
        total: "Fakturaren guztizkoa (€)",
        kwh_p1: "Kontsumoa P1 aldian (kWh)",
        kwh_p2: "Kontsumoa P2 aldian (kWh)",
        kwh_p3: "Kontsumoa P3 aldian (kWh)",
        kwh_bonificados: "Kontsumo hobariduna (kWh)",
      },
      revisar: "Berrikusi datuak fakturan datozen bezala. Jada sartutako beste batekin gainjartzen den faktura batek (adibidez, faktura zuzentzaile batek) hura ordezten du.",
      fuera: "Kanpoan geratzen dira:",
      guardar: (n) => (n === 1 ? "Gorde faktura" : `Gorde ${n} faktura`),
      guardando: "Gordetzen…",
      hechas: (n) => (n === 1 ? "Faktura sartu da ✓" : `${n} faktura sartu dira ✓`),
      faltan: "Datuak falta dira: aldiaren datak, P1, P2 eta P3 aldietako kontsumoa eta guztizkoa derrigorrezkoak dira.",
      demasiados: (n) => `Gehienez ${n} fitxategi aldi berean.`,
      no_subido: "ezin izan da igo",
      error: "Ezin izan dira fakturak irakurri",
      cerrar: "Itxi",
      sin_suministro: "Ez da aurkitu fakturaren hornidura",
    },
  },
};

// Archivos por subida en «Subir factura» (el máximo del servicio leer_facturas).
const MAX_ARCHIVOS_FACTURA = 12;

// Idiomas cooficiales: textos propios completos y, para `Intl`, el español de respaldo.
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
    _subida: { state: true },
    _historico: { state: true },
    comparando: { attribute: false },
    _anchoUtil: { state: true },
  };

  static async getConfigElement() {
    await cargarHaForm();
    return document.createElement(ETIQUETA_EDITOR);
  }

  /** Los textos de todos los idiomas, para la prueba de humo (que no falte ninguno en ninguno). */
  static get textos() {
    return { tarjeta: TEXTOS, editor: TEXTOS_EDITOR };
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
  _claveFactura = 0;

  setConfig(config) {
    if (!config) throw new Error(textosEditor(idiomaPagina()).config_no_valida);
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

  /**
   * Un error de un servicio en el idioma del usuario: los de la integración traen su `translation_key`
   * (sección «exceptions» de translations/) y HA la traduce; los demás, con su mensaje tal cual.
   */
  async _mensajeError(error) {
    const { translation_domain: dominio, translation_key: clave, translation_placeholders: datos } = error || {};
    if (dominio && clave && this.hass?.loadBackendTranslation) {
      try {
        const localize = await this.hass.loadBackendTranslation("exceptions", dominio);
        const texto = localize(`component.${dominio}.exceptions.${clave}.message`, datos || {});
        if (texto) return texto;
      } catch {
        // Sin traducción: el mensaje que manda HA.
      }
    }
    return error?.message || String(error);
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
          ${this._config.grafica_facturas ? this._graficaFacturas() : nothing}
          ${this.enVentana && (buscarEntidad(this.hass, "button.pvpc_bs_comparar_tarifas") || this._suministroFactura || this._conHistorico)
            ? html`<div class="comparar">
                ${this._suministroFactura
                  ? html`<button
                      class="btn-subir"
                      @click=${() => this.dispatchEvent(new CustomEvent("pvpc-bs-subir", { bubbles: true, composed: true }))}
                    >
                      ${t.sub.boton}
                    </button>`
                  : nothing}
                ${buscarEntidad(this.hass, "button.pvpc_bs_comparar_tarifas")
                  ? html`<button
                      class="btn-comparar"
                      ?disabled=${this.comparando}
                      @click=${() => this.dispatchEvent(new CustomEvent("pvpc-bs-comparar", { bubbles: true, composed: true }))}
                    >
                      ${this.comparando ? t.comp.comparando : t.comp.boton}
                    </button>`
                  : nothing}
                ${this._conHistorico
                  ? html`<button
                      class="btn-historico"
                      @click=${() => this.dispatchEvent(new CustomEvent("pvpc-bs-historico", { bubbles: true, composed: true }))}
                    >
                      ${t.hist.boton}
                    </button>`
                  : nothing}
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
      class="ventana ${this._anexo || this._subida || this._historico ? "con-anexo" : ""}"
      @close=${() => {
        this._ventana = false;
        this._anexo = null;
        this._subida = null;
        this._historico = null;
      }}
      @click=${(ev) => ev.target === ev.currentTarget && this._cerrarVentana()}
      @pvpc-bs-comparar=${() => this._comparar()}
      @pvpc-bs-subir=${() => this._abrirSubida()}
      @pvpc-bs-historico=${() => this._abrirHistorico()}
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
        ${this._anexo
          ? this._anexoComparativa()
          : this._subida
            ? this._anexoSubida()
            : this._historico
              ? this._anexoHistorico()
              : nothing}
      </div>
    </dialog>`;
  }

  // --- comparativa de tarifas (anexo de la ventana) -------------------------------------

  /** Compara las tarifas del suministro (sin enviar al destino) y abre el anexo con el resultado. */
  async _comparar() {
    if (this._anexo?.estado === "cargando") return;
    const boton = buscarEntidad(this.hass, "button.pvpc_bs_comparar_tarifas");
    if (!boton) return;
    this._subida = null;
    this._historico = null;
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
      this._anexo = { estado: "error", mensaje: await this._mensajeError(error) };
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
    const termicoVisible = avisos.includes("bono_termico") && new Date().getMonth() >= 7;
    // Con bono se compara con lo pagado; si se ha perdido, con lo que se pagaría sin él.
    // («pierde_bono» solo sale si hoy se tiene bono; vale también con el veredicto «depende»).
    const sinBono = avisos.includes("bono_perdido") || !avisos.includes("pierde_bono");
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
    const depende = r.veredicto === "depende_precios";
    const textoVeredicto = depende
      ? c.depende(mejor.ahorro_anual > 0, eur(Math.abs(mejor.ahorro_anual)), (mejor.ahorro_prevision ?? 0) > 0, eur(Math.abs(mejor.ahorro_prevision ?? 0)))
      : veredicto?.[1].replace("{x}", eur(Math.abs(mejor.ahorro_anual)));
    // Lo que costaría seguir en el PVPC según la previsión de la CNMC (con tu bono si lo tienes).
    const futuro = sinBono ? r.pvpc_cnmc_prevision : r.pvpc_cnmc_prevision_bono;
    const revision = (o) => (o.revision ? c.revision(c.revisiones[o.revision] || o.revision) : null);
    const etiquetas = (o) =>
      [o.oferta, o.permanencia ? c.permanencia : c.sin_permanencia, revision(o), o.solo_nuevos_clientes && c.nuevos, o.verde && c.verde]
        .filter(Boolean)
        .join(" · ");
    const textoAviso = (a) =>
      (c.avisos[a] || "")
        .replace("{ausentes}", (r.grandes_ausentes || []).join(", "))
        .replace("{dias}", p.dias ?? "")
        .replace("{revision}", mejor.revision ? c.revisiones[mejor.revision] || mejor.revision : "");
    const diferencia = (x, etiqueta) =>
      html`<div class="d ${x >= 0 ? "menos" : "mas"}">${x >= 0 ? "−" : "+"}${eur(Math.abs(x))}${futuro != null ? html` <span class="base">${etiqueta}</span>` : nothing}</div>`;
    return html`<aside class="anexo">
      ${cabecera}
      <div class="anexo-resumen">${resumen}</div>
      ${veredicto && mejor
        ? html`<div class="anexo-veredicto ${bueno ? "bueno" : depende ? "depende" : "ahorro"}">
            <b>${bueno ? "✅" : depende ? "⚖️" : "💡"} ${veredicto[0]}</b>
            <div>${textoVeredicto}</div>
            ${this._termometro(r.termometro)}
          </div>
          <div class="anexo-leer"><b>${termicoVisible ? c.leer_avisos_termico : c.leer_avisos}</b></div>`
        : nothing}
      <div class="anexo-fila tuya">
        <div><div class="n">${c.tu_tarifa}</div><div class="o">${sinBono ? c.pvpc : c.pvpc_bono}</div></div>
        <div class="i">${eur(base)}${c.al_anio}</div>
      </div>
      ${futuro != null
        ? html`<div class="anexo-fila tuya prevista">
            <div><div class="n">${c.prevision}</div><div class="o">${sinBono ? c.prevision_sin_bono : c.prevision_bono}</div></div>
            <div class="i">≈${eur(futuro)}${c.al_anio}</div>
          </div>`
        : nothing}
      ${ofertas.slice(0, 3).map(
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
            ${diferencia(o.ahorro_anual, c.ultimo_anio)}
            ${o.ahorro_prevision != null && futuro != null ? diferencia(o.ahorro_prevision, c.con_prevision) : nothing}
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
      ${/* Orden de José (9-nov); el del térmico destacado y solo de agosto a diciembre. */ ""}
      ${[...avisos]
        .filter((a) => c.avisos[a] && (a !== "bono_termico" || termicoVisible))
        .sort((x, y) => ordenAviso(x) - ordenAviso(y))
        .map((a) => {
          // Formato de José (9-nov): perder el bono y el térmico en negrita; la previsión subrayada
          // hasta los dos puntos y en negrita lo que sigue.
          const x = textoAviso(a);
          const i = x.indexOf(": ");
          if (a === "bono_termico") return html`<div class="anexo-nota destacado"><b>🛑 ${x}</b></div>`;
          if (a === "pierde_bono") return html`<div class="anexo-nota"><b>⚠️ ${x}</b></div>`;
          if (a === "prevision_volatil" && i > 0)
            return html`<div class="anexo-nota">⚠️ <u>${x.slice(0, i)}</u>: <b>${x.slice(i + 2)}</b></div>`;
          // Los informativos con ℹ️ (José, 9-nov).
          const info = ["cobertura_incompleta", "datos_extrapolados", "revision_precios"].includes(a);
          return html`<div class="anexo-nota">${info ? "ℹ️" : "⚠️"} ${x}</div>`;
        })}
      <div class="anexo-nota">ℹ️ ${c.confirmar}</div>
      ${r.destino ? html`<div class="anexo-pie">${this._botonEnviar(id, r.destino)}</div>` : nothing}
    </aside>`;
  }

  /** Mes «AAAA-MM» con su nombre en el idioma de HA («noviembre de 2026»). */
  _nombreMes(mes, formato = "long") {
    const [a, m] = String(mes).split("-").map(Number);
    if (!a || !m) return String(mes);
    return new Intl.DateTimeFormat(this._idiomas, { month: formato, year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 15)));
  }

  /** Línea «termómetro» bajo el veredicto: la mejor oferta de hoy frente a los meses anteriores. */
  _termometro(t) {
    if (!t || !t.mas_barata || !t.mas_cara) return nothing;
    const k = (x) => `${this._num(x, 3)} €/kWh`;
    const texto = this._t.comp.termometro(
      t.posicion,
      t.meses,
      k(t.eur_kwh),
      this._nombreMes(t.mas_barata.mes),
      k(t.mas_barata.eur_kwh),
      this._nombreMes(t.mas_cara.mes),
      k(t.mas_cara.eur_kwh),
    );
    return html`<div class="anexo-termometro">🌡️ ${texto}</div>`;
  }

  // --- histórico de comparativas (anexo de la ventana) -----------------------------------

  /** El sensor «Mejor alternativa» trae el histórico (aunque esté vacío): hay botón «Histórico». */
  get _conHistorico() {
    const id = buscarEntidad(this.hass, "sensor.pvpc_bs_mejor_alternativa");
    return !!id && Array.isArray(this.hass.states[id]?.attributes?.historico);
  }

  _abrirHistorico() {
    this._anexo = null;
    this._subida = null;
    this._historico = true;
  }

  _anexoHistorico() {
    const h = this._t.hist;
    const c = this._t.comp;
    const cerrar = html`<button class="cerrar" aria-label=${h.cerrar} @click=${() => (this._historico = null)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`;
    const id = buscarEntidad(this.hass, "sensor.pvpc_bs_mejor_alternativa");
    const meses = (id && this.hass.states[id]?.attributes?.historico) || [];
    const eur = (x) => `${this._num(x, 2)} €`;
    const dia = (iso) => (typeof iso === "string" ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");
    const etiquetas = (o, kwhMes) =>
      [
        o.oferta,
        o.permanencia ? c.permanencia : c.sin_permanencia,
        o.revision && c.revision(c.revisiones[o.revision] || o.revision),
        o.solo_nuevos_clientes && c.nuevos,
        dia(o.fecha),
        // Si su importe salió con otro consumo que el del mes, se dice con cuál.
        o.kwh?.total && o.kwh.total !== kwhMes && h.kwh(this._num(o.kwh.total, 0)),
      ]
        .filter(Boolean)
        .join(" · ");
    return html`<aside class="anexo historico">
      <div class="anexo-cabecera"><div class="ventana-titulo">${h.titulo}</div>${cerrar}</div>
      <div class="anexo-resumen">${h.intro}</div>
      ${meses.length
        ? meses.map((m) => {
            const ofertas = Array.isArray(m.ofertas) ? m.ofertas : [];
            const mejor = ofertas[0];
            const kwhMes = m.kwh?.total;
            const detalle = [
              m.prevision != null && `${h.prevision} ≈${eur(m.prevision)}`,
              m.pagado_anual != null && `${h.pagado} ${eur(m.pagado_anual)}`,
            ]
              .filter(Boolean)
              .join(" · ");
            return html`<details class="hist-mes">
              <summary class="anexo-fila">
                <div>
                  <div class="n"><span class="flecha" aria-hidden="true">›</span>${this._nombreMes(m.mes)}</div>
                  ${detalle ? html`<div class="o">${detalle}</div>` : nothing}
                  ${kwhMes ? html`<div class="o kwh">${h.kwh(this._num(kwhMes, 0))}</div>` : nothing}
                </div>
                <div>
                  <div class="i">${mejor ? eur(mejor.importe_primer_anio) : "—"}</div>
                  ${mejor ? html`<div class="d">${h.mejor}</div>` : nothing}
                </div>
              </summary>
              ${ofertas.length
                ? ofertas.map(
                    (o) => html`<div class="anexo-fila hist-oferta">
                      <div>
                        ${o.enlace
                          ? html`<a class="n enlace" href=${o.enlace} target="_blank" rel="noopener noreferrer" title=${c.ficha}
                              >${o.comercializadora} ↗</a
                            >`
                          : html`<div class="n">${o.comercializadora}</div>`}
                        <div class="o">${etiquetas(o, kwhMes)}</div>
                      </div>
                      <div class="i">${eur(o.importe_primer_anio)}</div>
                    </div>`,
                  )
                : html`<div class="anexo-nota">${c.avisos.sin_ofertas}</div>`}
            </details>`;
          })
        : html`<div class="anexo-aviso">${h.vacio}</div>`}
    </aside>`;
  }

  // --- subir factura (anexo de la ventana) ------------------------------------------------

  /** Dispositivo del suministro de la tarjeta (el del sensor de factura): el `suministro` de los
   * servicios. Solo hay sensor de factura si el suministro tiene facturación. */
  get _suministroFactura() {
    const id = this._config.entity_factura_actual || buscarEntidad(this.hass, "sensor.pvpc_bs_factura_actual");
    return (id && this.hass.entities?.[id]?.device_id) || null;
  }

  _abrirSubida() {
    this._anexo = null;
    this._historico = null;
    if (!this._subida) this._subida = { estado: "elegir", facturas: [], rechazadas: [], hechas: 0 };
  }

  /** Sube cada archivo a /api/file_upload (lo mismo que el selector de archivos del flujo) y lee
   * las facturas con el lector de «Factura real» (leer_facturas). No guarda nada. */
  async _leerArchivos(ev) {
    const s = this._t.sub;
    const archivos = [...(ev.target.files || [])];
    ev.target.value = "";
    const subida = this._subida;
    if (!archivos.length || !subida || subida.estado !== "elegir") return;
    subida.mensaje = null;
    if (archivos.length > MAX_ARCHIVOS_FACTURA) {
      subida.mensaje = s.demasiados(MAX_ARCHIVOS_FACTURA);
      this.requestUpdate();
      return;
    }
    const suministro = this._suministroFactura;
    if (!suministro) {
      subida.mensaje = s.sin_suministro;
      this.requestUpdate();
      return;
    }
    subida.estado = "leyendo";
    this.requestUpdate();
    const nombres = {};
    try {
      for (const archivo of archivos) {
        try {
          const datos = new FormData();
          datos.append("file", archivo);
          const r = await this.hass.fetchWithAuth("/api/file_upload", { method: "POST", body: datos });
          if (!r.ok) throw new Error(`${r.status}`);
          nombres[(await r.json()).file_id] = archivo.name;
        } catch (error) {
          subida.rechazadas.push({ archivo: archivo.name, texto: `${s.no_subido} (${error?.message || error})` });
        }
      }
      if (Object.keys(nombres).length) {
        const { response } = await this.hass.callWS({
          type: "call_service",
          domain: "pvpc_bonosocial",
          service: "leer_facturas",
          service_data: { suministro, archivos: Object.keys(nombres) },
          return_response: true,
        });
        for (const f of response?.facturas || []) {
          const { id, archivo, ...datos } = f;
          subida.facturas.push({ clave: ++this._claveFactura, archivo: archivo || nombres[id], datos });
        }
        for (const r of response?.rechazadas || []) {
          subida.rechazadas.push({ archivo: r.archivo || nombres[r.id], texto: r.texto || r.motivo });
        }
      }
    } catch (error) {
      subida.mensaje = `${s.error}: ${await this._mensajeError(error)}`;
    }
    subida.estado = "elegir";
    subida.hechas = 0;
    this.requestUpdate();
  }

  _anadirAMano() {
    const subida = this._subida;
    if (!subida || subida.estado !== "elegir") return;
    // Si ya hay una a mano sin rellenar, no se crea otra: se lleva el cursor a esa.
    const vacia = subida.facturas.find(
      (f) => !f.archivo && Object.values(f.datos).every((v) => v == null || String(v).trim() === ""),
    );
    if (!vacia) subida.facturas.push({ clave: ++this._claveFactura, archivo: null, datos: {} });
    const clave = vacia ? vacia.clave : this._claveFactura;
    subida.hechas = 0;
    this.requestUpdate();
    this.updateComplete.then(() => {
      const bloque = this.renderRoot.querySelector(`.sub-factura[data-clave="${clave}"]`);
      bloque?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      bloque?.querySelector("input")?.focus({ preventScroll: true });
    });
  }

  _quitarFactura(f) {
    const subida = this._subida;
    if (!subida || subida.estado !== "elegir") return;
    subida.facturas = subida.facturas.filter((x) => x !== f);
    this.requestUpdate();
  }

  /** Introduce cada factura con conciliar_factura, en orden de fechas; la comprobación con la CNMC,
   * solo con la última (como el lote ZIP del flujo). Las que fallan se quedan con su error. */
  async _guardarFacturas() {
    const s = this._t.sub;
    const subida = this._subida;
    const suministro = this._suministroFactura;
    if (!subida || subida.estado !== "elegir" || !subida.facturas.length || !suministro) return;
    const numero = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
    const pendientes = [];
    for (const f of subida.facturas) {
      const d = f.datos;
      const datos = {
        inicio: d.inicio || null,
        fin: d.fin || null,
        kwh_p1: numero(d.kwh_p1),
        kwh_p2: numero(d.kwh_p2),
        kwh_p3: numero(d.kwh_p3),
        total: numero(d.total),
      };
      f.error = Object.values(datos).some((v) => v == null) ? s.faltan : null;
      if (d.emision) datos.emision = d.emision;
      if (numero(d.kwh_bonificados) != null) datos.kwh_bonificados = numero(d.kwh_bonificados);
      if (!f.error) pendientes.push([f, datos]);
    }
    pendientes.sort(([, a], [, b]) => (a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : 0));
    subida.estado = "guardando";
    subida.hechas = 0;
    this.requestUpdate();
    for (const [n, [f, datos]] of pendientes.entries()) {
      try {
        await this.hass.callWS({
          type: "call_service",
          domain: "pvpc_bonosocial",
          service: "conciliar_factura",
          service_data: { suministro, ...datos, comprobar: n === pendientes.length - 1 },
        });
        f.hecha = true;
        subida.hechas += 1;
      } catch (error) {
        f.error = await this._mensajeError(error);
      }
      this.requestUpdate();
    }
    subida.facturas = subida.facturas.filter((f) => !f.hecha);
    if (!subida.facturas.length) subida.rechazadas = [];
    subida.estado = "elegir";
    this.requestUpdate();
  }

  _anexoSubida() {
    const s = this._t.sub;
    const subida = this._subida;
    const ocupada = subida.estado !== "elegir";
    const cerrar = html`<button class="cerrar" aria-label=${s.cerrar} @click=${() => (this._subida = null)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </svg>
    </button>`;
    const campo = (f, clave, tipo) =>
      html`<label class="sub-campo">
        <span>${s.campos[clave]}</span>
        <input
          type=${tipo}
          name=${clave}
          min=${tipo === "number" ? "0" : nothing}
          step=${tipo === "number" ? (clave === "total" ? "0.01" : "1") : nothing}
          inputmode=${tipo === "number" ? (clave === "total" ? "decimal" : "numeric") : nothing}
          .value=${f.datos[clave] == null ? "" : String(f.datos[clave])}
          ?disabled=${ocupada}
          @input=${(ev) => (f.datos[clave] = ev.target.value)}
        />
      </label>`;
    return html`<aside class="anexo subida">
      <div class="anexo-cabecera"><div class="ventana-titulo">${s.titulo}</div>${cerrar}</div>
      <div class="anexo-resumen">${s.intro}</div>
      <input class="sub-archivos" type="file" multiple accept=".pdf,.zip,application/pdf,application/zip" hidden @change=${(ev) => this._leerArchivos(ev)} />
      <div class="sub-acciones">
        <button class="btn-subir" ?disabled=${ocupada} @click=${() => this.renderRoot.querySelector("input.sub-archivos")?.click()}>${s.elegir}</button>
        <button class="btn-subir secundario" ?disabled=${ocupada} @click=${() => this._anadirAMano()}>${s.a_mano}</button>
      </div>
      ${subida.estado === "leyendo" ? html`<div class="anexo-espera"><span class="girando"></span>${s.leyendo}</div>` : nothing}
      ${subida.mensaje ? html`<div class="anexo-aviso error">⚠️ ${subida.mensaje}</div>` : nothing}
      ${subida.hechas && !ocupada ? html`<div class="anexo-aviso hecho">${s.hechas(subida.hechas)}</div>` : nothing}
      ${subida.facturas.length ? html`<div class="anexo-nota">${s.revisar}</div>` : nothing}
      ${subida.facturas.map(
        (f) => html`<div class="sub-factura ${f.error ? "con-error" : ""}" data-clave=${f.clave}>
          <div class="sub-cabecera">
            <b>${f.archivo || s.manual}</b>
            <button class="sub-quitar" ?disabled=${ocupada} @click=${() => this._quitarFactura(f)}>${s.quitar}</button>
          </div>
          <div class="sub-campos">
            ${campo(f, "inicio", "date")}${campo(f, "fin", "date")}${campo(f, "emision", "date")}${campo(f, "total", "number")}
            ${campo(f, "kwh_p1", "number")}${campo(f, "kwh_p2", "number")}${campo(f, "kwh_p3", "number")}${campo(f, "kwh_bonificados", "number")}
          </div>
          ${f.error ? html`<div class="anexo-aviso error">⚠️ ${f.error}</div>` : nothing}
        </div>`,
      )}
      ${subida.rechazadas.length
        ? html`<div class="anexo-nota sub-fuera">
            ${s.fuera}
            <ul>
              ${subida.rechazadas.map((r) => html`<li><b>${r.archivo}</b>: ${r.texto}</li>`)}
            </ul>
          </div>`
        : nothing}
      ${subida.facturas.length
        ? html`<div class="anexo-pie">
            <div class="comparar">
              <button class="btn-subir" ?disabled=${ocupada} @click=${() => this._guardarFacturas()}>
                ${subida.estado === "guardando" ? s.guardando : s.guardar(subida.facturas.length)}
              </button>
            </div>
          </div>`
        : nothing}
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
        this._envio = await this._mensajeError(error);
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
    // En la cabecera de una tarjeta estrecha (móvil) solo cabe el texto corto, sin fechas. Va en
    // ::before (atributo) para que el texto del DOM sea solo el largo.
    // `aprox`: cifra provisional (horas que la fuente aún no ha publicado, estimadas) o aproximada.
    const linea = (texto, fechas, importe, corto, aprox = false) =>
      html`<div><span class="txt-largo">${texto}<span class="sin-corte">${fechas}</span></span><span class="txt-corto" data-t=${corto}></span>: <b class="sin-corte">${aprox ? "≈" : ""}${this._num(importe, 2)} €</b></div>`;

    // 1. Periodo anterior
    const anterior = idAnterior && this.hass.states[idAnterior];
    if (this._config.factura_anterior && anterior && Number.isFinite(Number(anterior.state))) {
      const a = anterior.attributes || {};
      lineas.push(linea(t.anterior, periodo(a.inicio, a.fin), Number(anterior.state), t.anterior_corto));
    }
    // 2. Periodo en curso (lo gastado hasta hoy) y 3. factura estimada al cierre (opcional)
    const actual = idActual && this.hass.states[idActual];
    // Cada línea con su interruptor: la estimada sale aunque la de «en curso» esté apagada.
    if (actual && Number.isFinite(Number(actual.state))) {
      const a = actual.attributes || {};
      const hoyIso = fechaIso(new Date(), zonaDeHA(this.hass));
      // Datadis va con días de retraso: con «solo lo recibido» el periodo acaba en el último dato
      // (datos_hasta es el fin de esa hora: a las 00:00 son los datos del día anterior).
      let hasta = hoyIso;
      if (a.provisional && a.factura_en_curso === "recibido" && typeof a.datos_hasta === "string") {
        const fin = new Date(new Date(a.datos_hasta).getTime() - 1000);
        hasta = fechaIso(fin, zonaDeHA(this.hass));
      }
      if (this._config.factura_actual && typeof a.acumulado === "number") {
        const aprox = a.provisional === true && a.factura_en_curso !== "recibido";
        lineas.push(linea(t.en_curso, periodo(a.inicio, hasta), a.acumulado, t.en_curso_corto, aprox));
      }
      if (this._config.prevision !== false) {
        lineas.push(
          linea(t.estimada_cierre, periodo(a.inicio, a.fin_previsto), Number(actual.state), t.estimada_corto, a.aproximada === true),
        );
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
    /* Bajo la gráfica (izquierda o derecha): mismo tamaño que en la cabecera. */
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
    .factura .txt-corto {
      display: none;
    }
    .factura .txt-corto::before {
      content: attr(data-t);
    }
    /* En pantallas estrechas la factura de la cabecera se queda arriba con el texto corto. */
    @container (max-width: 380px) {
      .factura.arriba .txt-largo {
        display: none;
      }
      .factura.arriba .txt-corto {
        display: inline;
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
    .anexo-leer {
      font-size: 0.85em;
      margin: -2px 0 10px;
      line-height: 1.35;
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
    .anexo-veredicto.depende {
      background: rgba(66, 165, 245, 0.12);
      border: 1px solid rgba(66, 165, 245, 0.5);
    }
    .anexo-fila.tuya.prevista .i {
      color: var(--primary-text-color);
    }
    .anexo-fila .d .base {
      color: var(--secondary-text-color);
      font-size: 0.9em;
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
    .anexo-nota.destacado {
      font-size: 0.85em;
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
    .anexo-termometro {
      margin-top: 6px;
      font-size: 0.9em;
    }
    /* Histórico: un mes por fila; al tocarlo, sus 3 ofertas. */
    .hist-mes summary {
      list-style: none;
      cursor: pointer;
    }
    .hist-mes summary::-webkit-details-marker {
      display: none;
    }
    .hist-mes .flecha {
      display: inline-block;
      width: 1em;
      transition: transform 0.15s;
    }
    .hist-mes[open] .flecha {
      transform: rotate(90deg);
    }
    .hist-mes[open] summary {
      border-bottom-style: dashed;
    }
    .hist-oferta {
      padding-left: 1em;
    }
    .hist-oferta .i {
      font-weight: 600;
    }
    .anexo-fila .o.kwh {
      opacity: 0.8;
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
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin: 14px 0 4px;
    }
    .btn-comparar,
    .btn-subir,
    .btn-historico {
      border: none;
      border-radius: 18px;
      padding: 8px 18px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .btn-comparar:disabled,
    .btn-subir:disabled {
      opacity: 0.6;
      cursor: progress;
    }
    .btn-subir.secundario {
      background: none;
      color: var(--primary-color, #03a9f4);
      box-shadow: inset 0 0 0 1px var(--primary-color, #03a9f4);
    }
    .sub-acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin: 14px 0 4px;
    }
    .sub-factura {
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
      border-radius: 10px;
      padding: 8px 12px 10px;
      margin-top: 10px;
    }
    .sub-factura.con-error {
      border-color: var(--error-color, #e57373);
    }
    .sub-cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      overflow-wrap: anywhere;
    }
    .sub-quitar {
      border: none;
      background: none;
      font: inherit;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      cursor: pointer;
      text-decoration: underline;
    }
    .sub-campos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px 10px;
    }
    .sub-campo {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .sub-campo input {
      font: inherit;
      font-size: 1.15em;
      padding: 5px 6px;
      border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.4));
      border-radius: 6px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      min-width: 0;
    }
    .sub-fuera ul {
      margin: 4px 0 0;
      padding-left: 18px;
    }
    .anexo-aviso.hecho {
      color: var(--success-color, #43a047);
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

/** Sin `hass` (al cargar, `setConfig`): el idioma de la página, que HA pone en <html lang>. */
function idiomaPagina() {
  return (document.documentElement.lang || navigator.language || "en").slice(0, 2);
}

/** Los textos del editor en el idioma del usuario (en inglés si no es uno de los cinco). */
function textosEditor(idioma) {
  return TEXTOS_EDITOR[idioma] || TEXTOS_EDITOR.en;
}

/**
 * Esquema del editor: secciones plegables (ha-form «expandable» con `flatten`, así las claves siguen
 * siendo las mismas del YAML) y, con los datos actuales, sin lo que depende de algo apagado.
 */
function esquemaEditor(idioma, d = {}) {
  const te = textosEditor(idioma);
  const opciones = (clave, valores) => ({
    select: {
      mode: "dropdown",
      options: valores.map((value) => ({ value, label: te.opciones[clave]?.[value] ?? value })),
    },
  });
  const si = (nombre) => ({ name: nombre, selector: { boolean: {} } });
  const seccion = (clave, icon, expanded, campos) => ({
    type: "expandable",
    name: "",
    flatten: true,
    title: te.secciones[clave],
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
        selector: opciones("icon_color", ["price", "period", "fijo"]),
      },
      { name: "title", selector: { text: {} } },
    ]),
    seccion("factura", "mdi:receipt-text-outline", false, [
      conFactura && si("factura_anterior"),
      conFactura && si("factura_actual"),
      conFactura && si("prevision"),
      {
        name: "factura",
        selector: opciones("factura", ["header", "below_chart", "below_chart_right", "hidden"]),
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
        selector: opciones("extremos", ["columnas", "filas"]),
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
        selector: opciones("grosor", ["1.5", "2.5"]),
      },
      conGrafica && {
        name: "colores",
        selector: opciones("colores", ["fijo", "precio", d.next_day !== false && "precio_manana"].filter(Boolean)),
      },
      conGrafica && { name: "color_hoy", selector: { color_rgb: {} } },
      conManana && { name: "color_manana", selector: { color_rgb: {} } },
    ]),
    seccion("facturas", "mdi:chart-bar", false, [
      si("grafica_facturas"),
      conFacturas && si("facturas_importe"),
      conFacturas && si("facturas_tendencia"),
      conFacturas && { name: "facturas_meses", selector: opciones("facturas_meses", ["3", "5", "6", "9", "12"]) },
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

/** Los textos de la tarjeta en el idioma de HA (como `_t`); fuera de los cinco, en inglés. */
function textosDe(hass) {
  const idioma = (hass?.locale?.language || hass?.language || "es").slice(0, 2);
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
      .computeLabel=${(s) => textosEditor(this._idioma).etiquetas[s.name] ?? s.title ?? s.name}
      .computeHelper=${(s) => textosEditor(this._idioma).ayudas[s.name] ?? ""}
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

/**
 * Textos del editor visual: secciones, opciones de los desplegables, etiquetas y una línea de ayuda
 * bajo cada campo. Cada idioma, completo (la prueba de humo lo comprueba).
 */
const TEXTOS_EDITOR = {
  es: {
    // La descripción del selector de tarjetas de HA.
    descripcion: "Precio del PVPC de hoy y mañana y la factura con o sin bono social.",
    config_no_valida: "Configuración no válida",
    secciones: {
      cabecera: "Cabecera",
      factura: "Importes de la factura",
      extremos: "Mínimos y máximos",
      grafica: "Gráfica de precios",
      facturas: "Facturas",
      avanzado: "Avanzado",
    },
    opciones: {
      icon_color: { price: "Por precio", period: "Por periodo P1-P3", fijo: "Azul fijo" },
      factura: { header: "Arriba, junto al precio", below_chart: "Bajo la gráfica, a la izquierda", below_chart_right: "Bajo la gráfica, a la derecha", hidden: "No mostrar" },
      extremos: { columnas: "Columnas: hoy | mañana", filas: "Filas: un día por fila" },
      grosor: { "1.5": "Fino (1,5)", "2.5": "Normal (2,5)" },
      colores: { fijo: "Un color por día", precio: "Hoy por precio", precio_manana: "Mañana por precio" },
    },
    etiquetas: {
      entity: "Sensor de precio",
      title: "Título de la tarjeta",
      factura: "Posición en la tarjeta",
      factura_actual: "Factura periodo en curso",
      factura_anterior: "Factura periodo anterior",
      prevision: "Factura estimada",
      current: "Precio actual",
      details: "Mostrar mínimos y máximos",
      extremos: "Disposición",
      graph: "Mostrar la gráfica",
      next_day: "Mostrar mañana",
      extremos_manana: "Mostrar mañana",
      icon_color: "Color del icono",
      colores: "Colores de la gráfica",
      grosor: "Grosor de las líneas",
      color_hoy: "Color de hoy",
      color_manana: "Color de mañana",
      bandas: "Punta y llano sombreados",
      entity_injection: "Sensor de precio de excedentes",
      mostrar_excedentes: "Mostrar precios de los excedentes",
      excedentes_grafica: "Mostrar excedentes",
      grafica_facturas: "Mostrar facturas",
      facturas_importe: "Importe sobre las barras",
      facturas_tendencia: "Línea de tendencia",
      facturas_meses: "Cantidad de facturas",
      color_facturas: "Color de las barras",
      titulo_grafica: "Título de la gráfica de precios",
      titulo_facturas: "Título de la gráfica",
      entity_factura_actual: "Sensor de factura en curso",
      entity_factura_anterior: "Sensor de factura anterior",
    },
    ayudas: {
      current: "Precio de esta hora, en grande; el icono sigue",
      icon_color: "Por precio: verde barato, rojo caro",
      title: "Bórralo para dejar la tarjeta sin título",
      factura: "Dónde van las líneas de factura",
      factura_anterior: "Último periodo cerrado",
      factura_actual: "Lo gastado en el periodo hasta hoy",
      prevision: "Lo que se prevé pagar al cerrar el periodo",
      details: "Hora más barata y más cara de hoy y de mañana",
      extremos: "Columnas: hoy a la izquierda y mañana a la derecha. Filas: hoy arriba y mañana debajo",
      graph: "Precio de cada hora en escalones",
      next_day: "Solo en la gráfica, cuando ya hay precios (sobre las 20:30)",
      extremos_manana: "Mínimo y máximo de mañana, cuando ya hay precios (sobre las 20:30)",
      titulo_grafica: "Bórralo para dejar la gráfica sin título",
      grosor: "De hoy, mañana y excedentes",
      colores: "«Por precio» colorea cada hora del día elegido según lo cara que es",
      color_hoy: "La línea y los triángulos de hoy",
      color_manana: "La línea y los triángulos de mañana",
      facturas_importe: "El importe de cada factura encima de su barra",
      facturas_meses: "Cuántas facturas cerradas se ven, las más recientes",
      color_facturas: "El color de las barras",
      bandas: "Fondo de color en las horas punta y llano de los laborables",
      entity_injection: "Se elige solo con «Mostrar precios de los excedentes»",
      mostrar_excedentes: "Activa los excedentes en la tarjeta (triángulos huecos); necesita la API privada de ESIOS",
      excedentes_grafica: "Su precio en punteado en la gráfica",
      grafica_facturas: "Barras con las últimas facturas cerradas",
      facturas_tendencia: "Línea discontinua con la tendencia",
      titulo_facturas: "Bórralo para dejar la gráfica sin título",
      entity: "Se detecta sola; cámbialo solo si tienes varias entradas",
      entity_factura_actual: "Se detecta solo",
      entity_factura_anterior: "Se detecta solo",
    },
  },
  en: {
    descripcion: "Today's and tomorrow's PVPC price and the bill with or without the social bonus.",
    config_no_valida: "Invalid configuration",
    secciones: {
      cabecera: "Header",
      factura: "Bill amounts",
      extremos: "Min and max",
      grafica: "Price chart",
      facturas: "Bills",
      avanzado: "Advanced",
    },
    opciones: {
      icon_color: { price: "By price", period: "By period", fijo: "Fixed blue" },
      factura: { header: "Top, next to the price", below_chart: "Below the chart, left", below_chart_right: "Below the chart, right", hidden: "Don't show" },
      extremos: { columnas: "Columns: today | tomorrow", filas: "Rows: one day per row" },
      grosor: { "1.5": "Thin (1.5)", "2.5": "Normal (2.5)" },
      colores: { fijo: "One colour per day", precio: "Today by price", precio_manana: "Tomorrow by price" },
    },
    etiquetas: {
      entity: "Price sensor",
      title: "Card title",
      factura: "Position on the card",
      factura_actual: "Current bill",
      factura_anterior: "Previous bill",
      prevision: "Estimated bill",
      current: "Current price",
      details: "Show min and max",
      extremos: "Layout",
      graph: "Show the chart",
      next_day: "Show tomorrow",
      extremos_manana: "Show tomorrow",
      icon_color: "Icon colour",
      colores: "Chart colours",
      grosor: "Line width",
      color_hoy: "Today's colour",
      color_manana: "Tomorrow's colour",
      bandas: "Shade peak hours",
      entity_injection: "Surplus price sensor",
      mostrar_excedentes: "Show surplus prices",
      excedentes_grafica: "Show surplus",
      grafica_facturas: "Show bills",
      facturas_importe: "Amount above bars",
      facturas_tendencia: "Trend line",
      facturas_meses: "Number of bills",
      color_facturas: "Bar colour",
      titulo_grafica: "Price chart title",
      titulo_facturas: "Chart title",
      entity_factura_actual: "Current bill sensor",
      entity_factura_anterior: "Previous bill sensor",
    },
    ayudas: {
      current: "This hour's price, in large type; the icon stays",
      icon_color: "By price: green cheap, red expensive",
      title: "Clear it to leave the card untitled",
      factura: "Where the bill lines go",
      factura_anterior: "Last closed period",
      factura_actual: "Spent so far this period",
      prevision: "Expected total at the end of the period",
      details: "Cheapest and most expensive hour today and tomorrow",
      extremos: "Columns: today left, tomorrow right. Rows: today above, tomorrow below",
      graph: "Hourly price as steps",
      next_day: "Chart only, once prices are out (around 20:30)",
      extremos_manana: "Tomorrow's min and max, once prices are out (around 20:30)",
      titulo_grafica: "Clear it to leave the chart untitled",
      grosor: "Today, tomorrow and surplus",
      colores: "«By price» colours each hour of that day by how expensive it is",
      color_hoy: "Today's line and triangles",
      color_manana: "Tomorrow's line and triangles",
      facturas_importe: "Each bill's amount above its bar",
      facturas_meses: "How many closed bills are shown, the latest",
      color_facturas: "The bar colour",
      bandas: "Shaded peak and standard hours on working days",
      entity_injection: "Set by «Show surplus prices»",
      mostrar_excedentes: "Enables surplus on the card (hollow triangles); needs the ESIOS private API",
      excedentes_grafica: "Its price, dotted, on the chart",
      grafica_facturas: "Bars with the latest closed bills",
      facturas_tendencia: "Dashed trend line",
      titulo_facturas: "Clear it to leave the chart untitled",
      entity: "Detected automatically; change it only with several entries",
      entity_factura_actual: "Detected automatically",
      entity_factura_anterior: "Detected automatically",
    },
  },
  ca: {
    descripcion: "Preu del PVPC d'avui i de demà i la factura amb bo social o sense.",
    config_no_valida: "Configuració no vàlida",
    secciones: {
      cabecera: "Capçalera",
      factura: "Imports de la factura",
      extremos: "Mínims i màxims",
      grafica: "Gràfic de preus",
      facturas: "Factures",
      avanzado: "Avançat",
    },
    opciones: {
      icon_color: { price: "Per preu", period: "Per període P1-P3", fijo: "Blau fix" },
      factura: { header: "A dalt, al costat del preu", below_chart: "Sota el gràfic, a l'esquerra", below_chart_right: "Sota el gràfic, a la dreta", hidden: "No mostrar" },
      extremos: { columnas: "Columnes: avui | demà", filas: "Files: un dia per fila" },
      grosor: { "1.5": "Fina (1,5)", "2.5": "Normal (2,5)" },
      colores: { fijo: "Un color per dia", precio: "Avui per preu", precio_manana: "Demà per preu" },
    },
    etiquetas: {
      entity: "Sensor de preu",
      title: "Títol de la targeta",
      factura: "Posició a la targeta",
      factura_actual: "Factura del període en curs",
      factura_anterior: "Factura del període anterior",
      prevision: "Factura estimada",
      current: "Preu actual",
      details: "Mostrar mínims i màxims",
      extremos: "Disposició",
      graph: "Mostrar el gràfic",
      next_day: "Mostrar demà",
      extremos_manana: "Mostrar demà",
      icon_color: "Color de la icona",
      colores: "Colors del gràfic",
      grosor: "Gruix de les línies",
      color_hoy: "Color d'avui",
      color_manana: "Color de demà",
      bandas: "Punta i pla ombrejats",
      entity_injection: "Sensor de preu dels excedents",
      mostrar_excedentes: "Mostrar els preus dels excedents",
      excedentes_grafica: "Mostrar els excedents",
      grafica_facturas: "Mostrar les factures",
      facturas_importe: "Import sobre les barres",
      facturas_tendencia: "Línia de tendència",
      facturas_meses: "Nombre de factures",
      color_facturas: "Color de les barres",
      titulo_grafica: "Títol del gràfic de preus",
      titulo_facturas: "Títol del gràfic",
      entity_factura_actual: "Sensor de la factura en curs",
      entity_factura_anterior: "Sensor de la factura anterior",
    },
    ayudas: {
      current: "Preu d'aquesta hora, en gran; la icona es manté",
      icon_color: "Per preu: verd barat, vermell car",
      title: "Esborra'l per deixar la targeta sense títol",
      factura: "On van les línies de factura",
      factura_anterior: "Últim període tancat",
      factura_actual: "El que s'ha gastat en el període fins avui",
      prevision: "El que es preveu pagar en tancar el període",
      details: "Hora més barata i més cara d'avui i de demà",
      extremos: "Columnes: avui a l'esquerra i demà a la dreta. Files: avui a dalt i demà a sota",
      graph: "Preu de cada hora en esglaons",
      next_day: "Només al gràfic, quan ja hi ha preus (cap a les 20:30)",
      extremos_manana: "Mínim i màxim de demà, quan ja hi ha preus (cap a les 20:30)",
      titulo_grafica: "Esborra'l per deixar el gràfic sense títol",
      grosor: "D'avui, de demà i dels excedents",
      colores: "«Per preu» pinta cada hora del dia triat segons com n'és de car",
      color_hoy: "La línia i els triangles d'avui",
      color_manana: "La línia i els triangles de demà",
      facturas_importe: "L'import de cada factura damunt de la seva barra",
      facturas_meses: "Quantes factures tancades es veuen, les més recents",
      color_facturas: "El color de les barres",
      bandas: "Fons de color a les hores punta i pla dels dies feiners",
      entity_injection: "Es tria sol en activar «Mostrar els preus dels excedents»",
      mostrar_excedentes: "Activa els excedents a la targeta (triangles buits); cal l'API privada d'ESIOS",
      excedentes_grafica: "El seu preu en puntejat al gràfic",
      grafica_facturas: "Barres amb les últimes factures tancades",
      facturas_tendencia: "Línia discontínua amb la tendència",
      titulo_facturas: "Esborra'l per deixar el gràfic sense títol",
      entity: "Es detecta sol; canvia'l només si tens diverses entrades",
      entity_factura_actual: "Es detecta sol",
      entity_factura_anterior: "Es detecta sol",
    },
  },
  gl: {
    // La descripción del selector de tarjetas de HA.
    descripcion: "Prezo do PVPC de hoxe e mañá e a factura con ou sen bono social.",
    config_no_valida: "Configuración non válida",
    secciones: {
      cabecera: "Cabeceira",
      factura: "Importes da factura",
      extremos: "Mínimos e máximos",
      grafica: "Gráfica de prezos",
      facturas: "Facturas",
      avanzado: "Avanzado",
    },
    opciones: {
      icon_color: { price: "Por prezo", period: "Por período P1-P3", fijo: "Azul fixo" },
      factura: { header: "Arriba, xunto ao prezo", below_chart: "Debaixo da gráfica, á esquerda", below_chart_right: "Debaixo da gráfica, á dereita", hidden: "Non amosar" },
      extremos: { columnas: "Columnas: hoxe | mañá", filas: "Filas: un día por fila" },
      grosor: { "1.5": "Fina (1,5)", "2.5": "Normal (2,5)" },
      colores: { fijo: "Unha cor por día", precio: "Hoxe por prezo", precio_manana: "Mañá por prezo" },
    },
    etiquetas: {
      entity: "Sensor de prezo",
      title: "Título da tarxeta",
      factura: "Posición na tarxeta",
      factura_actual: "Factura do período en curso",
      factura_anterior: "Factura do período anterior",
      prevision: "Factura estimada",
      current: "Prezo actual",
      details: "Amosar mínimos e máximos",
      extremos: "Disposición",
      graph: "Amosar a gráfica",
      next_day: "Amosar mañá",
      extremos_manana: "Amosar mañá",
      icon_color: "Cor da icona",
      colores: "Cores da gráfica",
      grosor: "Grosor das liñas",
      color_hoy: "Cor de hoxe",
      color_manana: "Cor de mañá",
      bandas: "Punta e chan sombreados",
      entity_injection: "Sensor de prezo dos excedentes",
      mostrar_excedentes: "Amosar os prezos dos excedentes",
      excedentes_grafica: "Amosar os excedentes",
      grafica_facturas: "Amosar as facturas",
      facturas_importe: "Importe sobre as barras",
      facturas_tendencia: "Liña de tendencia",
      facturas_meses: "Cantidade de facturas",
      color_facturas: "Cor das barras",
      titulo_grafica: "Título da gráfica de prezos",
      titulo_facturas: "Título da gráfica",
      entity_factura_actual: "Sensor de factura en curso",
      entity_factura_anterior: "Sensor de factura anterior",
    },
    ayudas: {
      current: "Prezo desta hora, en grande; a icona mantense",
      icon_color: "Por prezo: verde barato, vermello caro",
      title: "Bórrao para deixar a tarxeta sen título",
      factura: "Onde van as liñas de factura",
      factura_anterior: "Último período pechado",
      factura_actual: "O gastado no período ata hoxe",
      prevision: "O que se prevé pagar ao pechar o período",
      details: "Hora máis barata e máis cara de hoxe e de mañá",
      extremos: "Columnas: hoxe á esquerda e mañá á dereita. Filas: hoxe arriba e mañá debaixo",
      graph: "Prezo de cada hora en chanzos",
      next_day: "Só na gráfica, cando xa hai prezos (arredor das 20:30)",
      extremos_manana: "Mínimo e máximo de mañá, cando xa hai prezos (arredor das 20:30)",
      titulo_grafica: "Bórrao para deixar a gráfica sen título",
      grosor: "De hoxe, mañá e excedentes",
      colores: "«Por prezo» colorea cada hora do día escollido segundo o cara que sexa",
      color_hoy: "A liña e os triángulos de hoxe",
      color_manana: "A liña e os triángulos de mañá",
      facturas_importe: "O importe de cada factura enriba da súa barra",
      facturas_meses: "Cantas facturas pechadas se ven, as máis recentes",
      color_facturas: "A cor das barras",
      bandas: "Fondo de cor nas horas punta e chan dos laborables",
      entity_injection: "Escóllese só con «Amosar os prezos dos excedentes»",
      mostrar_excedentes: "Activa os excedentes na tarxeta (triángulos baleiros); necesita a API privada de ESIOS",
      excedentes_grafica: "O seu prezo con liña de puntos na gráfica",
      grafica_facturas: "Barras coas últimas facturas pechadas",
      facturas_tendencia: "Liña descontinua coa tendencia",
      titulo_facturas: "Bórrao para deixar a gráfica sen título",
      entity: "Detéctase só; cámbiao só se tes varias entradas",
      entity_factura_actual: "Detéctase só",
      entity_factura_anterior: "Detéctase só",
    },
  },
  eu: {
    // La descripción del selector de tarjetas de HA.
    descripcion: "Gaurko eta biharko PVPC prezioa eta faktura, gizarte-bonuarekin edo gabe.",
    config_no_valida: "Konfigurazio baliogabea",
    secciones: {
      cabecera: "Goiburua",
      factura: "Fakturaren zenbatekoak",
      extremos: "Gutxienekoak eta gehienekoak",
      grafica: "Prezioen grafikoa",
      facturas: "Fakturak",
      avanzado: "Aurreratua",
    },
    opciones: {
      icon_color: { price: "Prezioaren arabera", period: "P1-P3 aldiaren arabera", fijo: "Urdin finkoa" },
      factura: { header: "Goian, prezioaren ondoan", below_chart: "Grafikoaren azpian, ezkerrean", below_chart_right: "Grafikoaren azpian, eskuinean", hidden: "Ez erakutsi" },
      extremos: { columnas: "Zutabeak: gaur | bihar", filas: "Errenkadak: egun bat errenkada bakoitzeko" },
      grosor: { "1.5": "Mehea (1,5)", "2.5": "Normala (2,5)" },
      colores: { fijo: "Kolore bat egun bakoitzeko", precio: "Gaur, prezioaren arabera", precio_manana: "Bihar, prezioaren arabera" },
    },
    etiquetas: {
      entity: "Prezio-sentsorea",
      title: "Txartelaren izenburua",
      factura: "Kokapena txartelean",
      factura_actual: "Uneko aldiko faktura",
      factura_anterior: "Aurreko aldiko faktura",
      prevision: "Zenbatetsitako faktura",
      current: "Uneko prezioa",
      details: "Erakutsi gutxienekoak eta gehienekoak",
      extremos: "Antolaera",
      graph: "Erakutsi grafikoa",
      next_day: "Erakutsi bihar",
      extremos_manana: "Erakutsi bihar",
      icon_color: "Ikonoaren kolorea",
      colores: "Grafikoaren koloreak",
      grosor: "Marren lodiera",
      color_hoy: "Gaurko kolorea",
      color_manana: "Biharko kolorea",
      bandas: "Puntakoa eta laua itzalduta",
      entity_injection: "Soberakinen prezio-sentsorea",
      mostrar_excedentes: "Erakutsi soberakinen prezioak",
      excedentes_grafica: "Erakutsi soberakinak",
      grafica_facturas: "Erakutsi fakturak",
      facturas_importe: "Zenbatekoa barren gainean",
      facturas_tendencia: "Joera-marra",
      facturas_meses: "Faktura kopurua",
      color_facturas: "Barren kolorea",
      titulo_grafica: "Prezioen grafikoaren izenburua",
      titulo_facturas: "Grafikoaren izenburua",
      entity_factura_actual: "Uneko fakturaren sentsorea",
      entity_factura_anterior: "Aurreko fakturaren sentsorea",
    },
    ayudas: {
      current: "Ordu honetako prezioa, handian; ikonoa mantentzen da",
      icon_color: "Prezioaren arabera: berdea merkea, gorria garestia",
      title: "Ezabatu txartela izenbururik gabe uzteko",
      factura: "Fakturaren lerroak non doazen",
      factura_anterior: "Itxitako azken aldia",
      factura_actual: "Aldian gaur arte gastatutakoa",
      prevision: "Aldia ixtean ordaintzea aurreikusten dena",
      details: "Gaurko eta biharko ordu merkeena eta garestiena",
      extremos: "Zutabeak: gaur ezkerrean eta bihar eskuinean. Errenkadak: gaur goian eta bihar behean",
      graph: "Ordu bakoitzeko prezioa, mailaka",
      next_day: "Grafikoan soilik, prezioak daudenean (20:30 aldera)",
      extremos_manana: "Biharko gutxienekoa eta gehienekoa, prezioak daudenean (20:30 aldera)",
      titulo_grafica: "Ezabatu grafikoa izenbururik gabe uzteko",
      grosor: "Gaurkoa, biharkoa eta soberakinak",
      colores: "«Prezioaren arabera» aukerak aukeratutako eguneko ordu bakoitza koloreztatzen du, zein garestia den kontuan hartuta",
      color_hoy: "Gaurko marra eta triangeluak",
      color_manana: "Biharko marra eta triangeluak",
      facturas_importe: "Faktura bakoitzaren zenbatekoa bere barraren gainean",
      facturas_meses: "Zenbat faktura itxi ikusten diren, berrienak",
      color_facturas: "Barren kolorea",
      bandas: "Kolorezko hondoa lanegunetako aldi puntakoan eta lauan",
      entity_injection: "«Erakutsi soberakinen prezioak» aktibatuta dagoenean bakarrik aukeratzen da",
      mostrar_excedentes: "Soberakinak aktibatzen ditu txartelean (triangelu hutsak); ESIOSen API pribatua behar du",
      excedentes_grafica: "Haien prezioa, puntuz, grafikoan",
      grafica_facturas: "Itxitako azken fakturen barrak",
      facturas_tendencia: "Joera erakusten duen marra etena",
      titulo_facturas: "Ezabatu grafikoa izenbururik gabe uzteko",
      entity: "Bere kabuz detektatzen da; aldatu hainbat sarrera badituzu soilik",
      entity_factura_actual: "Bere kabuz detektatzen da",
      entity_factura_anterior: "Bere kabuz detektatzen da",
    },
  },
};

if (!customElements.get(ETIQUETA)) {
  customElements.define(ETIQUETA, PvpcBonoSocialCard);
  customElements.define(ETIQUETA_EDITOR, PvpcBonoSocialCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: ETIQUETA,
    name: "PVPC + Bono Social",
    description: textosEditor(idiomaPagina()).descripcion,
    preview: true,
    documentationURL: "https://github.com/BaRDaHL/pvpc_bonosocial",
  });
  console.info(`%c PVPC + Bono Social %c ${VERSION} `, "background:#43a047;color:#fff", "");
}
