# PVPC + Bono Social

**Precio horario del PVPC y cálculo de la factura con o sin bono social en tiempo real**, para Home Assistant.

[English below](#english)

> Herramienta no oficial. La factura que vale es la de tu comercializadora; esta integración la estima y te avisa antes de que llegue.

## Qué es

Una sola integración que reúne:

- **Precios horarios del PVPC** de hoy y de mañana (todo lo de PVPC Next): periodos de energía y de potencia, niveles de precio, próxima mejor hora, mínimo, máximo y media, potencia disponible y API privada de ESIOS opcional (excedentes, modo indexado).
- **Factura en tiempo real** con la Comercializadora de Referencia (COR), con o sin **bono social**: lo que llevas gastado, la previsión al cierre y la factura cerrada antes de que llegue, calculada línea a línea como la de la COR.
- **Bono social completo**: descuento, límite anual de kWh, saldo de los kWh no gastados de los últimos 12 meses y reparto proporcional.
- **Tarjeta propia** con la gráfica de precios y la factura, sin instalar nada aparte.
- **Resumen de precios por Telegram** (o cualquier notificación) por la mañana y por la noche.
- **Panel de Energía** con el coste real de cada hora, corregido hacia atrás cuando llega la factura.
- **Migración sin perder datos** desde PVPC Next y desde la versión anterior de esta integración.

## Cómo se hace

Guía rápida paso a paso. Los detalles de cada cosa están más abajo.

### Instalar la integración

1. En HACS → ⋮ → **Repositorios personalizados**, añade `https://github.com/BaRDaHL/pvpc_bonosocial` con el tipo **Integración**.
2. Busca **PVPC + Bono Social** en HACS, **Descargar**, y reinicia Home Assistant.
3. **Ajustes → Dispositivos y servicios → Añadir integración → PVPC + Bono Social.** Elige la tarifa (Península/Baleares) y, si lo tienes, tu token de ESIOS.
4. Si tenías PVPC Next, el asistente te ofrece importarlo con su historial (haz antes una copia de seguridad).

### Actualizar

HACS te avisa cuando hay versión nueva: **Descargar**, reinicia Home Assistant y recarga el navegador (Ctrl+F5). En la app del móvil: **Ajustes → Aplicación complementaria → Solución de problemas → Restablecer la caché del frontend**.

### Añadir un suministro (para la factura)

1. **Ajustes → Dispositivos y servicios → PVPC + Bono Social → Añadir suministro.**
2. Nombre, potencia contratada (P1 y P2), bono social y unidad de convivencia.
3. Fuente de consumo: el sensor de energía de tu medidor (por ejemplo, el de un Shelly EM) o una estadística externa.
4. Opcional: la IP de un Shelly EM de 1.ª generación para corregir las horas que falten.
5. **Fecha de fin de la última factura** (la «Y» de «del X al Y» de tu última factura), días hasta la emisión y alquiler del contador. Opcional: código postal (comparador de tarifas y segunda opinión de la CNMC).

Para cambiar algo después (potencia, bono, código postal…): rueda dentada **⚙** del suministro → **Cambiar datos del suministro**.

### Añadir una factura real

1. **Ajustes → Dispositivos y servicios → PVPC + Bono Social** → rueda dentada **⚙** del suministro → **Introducir factura real**.
2. Sube el **PDF** de la factura: se leen solos el periodo, la emisión, los kWh de P1, P2 y P3, el total y los kWh bonificados (solo facturas de la Comercializadora Regulada, Gas & Power; con otras, a mano).
3. Revisa y confirma.

Puedes subir también facturas antiguas, de una en una: afinan la calibración del medidor y llenan el gráfico de facturas.

### Añadir la tarjeta de precios y factura

En un panel: **Añadir tarjeta → PVPC + Bono Social**, o en YAML (todas las opciones son opcionales):

```yaml
type: custom:pvpc-bono-social-card
entity: sensor.pvpc_bs_precio      # se detecta sola
factura: below_chart               # below_chart, header o hidden
colores: fijo                      # fijo o precio (hoy coloreado por precio)
color_hoy: "#4269d0"
color_manana: "#f4bd4a"
bandas: true                       # punta y llano sombreados
icon_color: price                  # price o period
```

### Añadir la tarjeta de facturas (evolución)

Una barra por factura con su importe real. **Añadir tarjeta → Gráfico de estadísticas**, o en YAML:

```yaml
type: statistics-graph
title: Facturas de la luz
entities:
  - pvpc_bonosocial:facturas_casa   # «casa» = nombre del suministro al crearlo
stat_types: [mean]
period: month
days_to_show: 365                   # 150, 180, 270 o 365 = últimas 5, 6, 9 o 12 facturas
chart_type: bar
```

El identificador exacto aparece al escribir «facturas» en el selector de entidades del editor de la tarjeta.

### Poner el coste en el panel de Energía

La integración lo ofrece con un aviso en **Ajustes → Reparaciones** («Usar el coste de PVPC + Bono Social en el panel de Energía»): **Enviar**. También a mano: **Ajustes → Paneles → Energía → Red eléctrica →** coste: estadística `pvpc_bonosocial:coste_<suministro>`.

### Recibir el resumen de precios por Telegram

**Añadir resumen por notificación** → elige el chat de Telegram (o la notificación del móvil) y las horas. Para probarlo: **Herramientas para desarrolladores → Acciones →** `pvpc_bonosocial.enviar_resumen` con `dry_run: true`.

### Comparar tarifas

Con el código postal puesto en el suministro, pulsa el botón **Comparar tarifas** (o la acción `pvpc_bonosocial.comparar_tarifas`). Para que se haga sola cada mes, activa **Comparar tarifas cada mes** en el suministro. Detalles en [Comparar tarifas](#comparar-tarifas).

### Activar la segunda opinión de la CNMC

Rueda dentada **⚙** del suministro → **Cambiar datos del suministro** → último paso: **Segunda opinión de la CNMC para cada factura** (necesita el código postal). Aparece al cerrarse cada periodo.

### Conectar Datadis

**Añadir cuenta de Datadis** → tu usuario y contraseña de datadis.es → elige el suministro de la lista. Ver [Datadis](#datadis).

### Si la tarjeta sale «Error de configuración»

Recarga el navegador con Ctrl+F5 (o restablece la caché del frontend en la app del móvil). Si sigue, comprueba en **Ajustes → Paneles → ⋮ → Recursos** que está `/pvpc_bonosocial/pvpc-bono-social-card.js`.

## Requisitos

- Suministro **2.0TD** (hasta 15 kW) con **PVPC** en la **Península o Baleares**. Canarias, Ceuta y Melilla no están incluidas.
- **Home Assistant 2025.11** o posterior.
- Para la factura, una **fuente de consumo horario**: un sensor de energía de HA (un Shelly EM, por ejemplo) o una estadística externa que importe la curva horaria. Sin consumo solo tendrás los precios.

## Instalación

1. En HACS, **Repositorios personalizados** → añade `https://github.com/BaRDaHL/pvpc_bonosocial` como **Integración**.
2. Instala **PVPC + Bono Social** y reinicia Home Assistant.
3. **Ajustes → Dispositivos y servicios → Añadir integración → PVPC + Bono Social.**

Si ya tienes PVPC Next, el asistente te ofrece **importarlo** (ver [Migración](#migración)).

## Configuración

- **Integración**: tarifa (Península/Baleares), potencia para la potencia disponible y, opcional, token de la API privada de ESIOS.
- **Suministro** (*Añadir suministro*, uno por contrato):
  - nombre, potencia contratada P1 y P2;
  - bono social (vulnerable, vulnerable severo o vulnerable severo en riesgo de exclusión) y unidad de convivencia, que fija el límite anual de kWh con descuento;
  - fuente de consumo (sensor o estadística externa);
  - opcional: comprobación con la memoria de un **Shelly EM de 1.ª generación** (corrige las horas que falten o estén mal en HA);
  - fecha de fin de la última factura, días hasta la emisión, alquiler del contador y kWh con descuento acumulados.
- **Resumen por notificación** (*Añadir resumen por notificación*, uno por destino): ver [Resumen de precios por Telegram](#resumen-de-precios-por-telegram).
- **Cuenta de Datadis** (*Añadir cuenta de Datadis*, opcional): ver [Datadis](#datadis).

Si cambias de potencia, das de alta o de baja el bono o cambia tu unidad de convivencia, cámbialo en **⚙ Reconfigurar → Cambiar datos del suministro**: te pregunta desde qué día rige el contrato nuevo y los días anteriores del periodo se siguen calculando con el antiguo.

## Entidades

Todas empiezan por `sensor.pvpc_bs_`.

**Precios** (las mismas que PVPC Next):

| Entidad | Qué es |
|---|---|
| `precio` | Precio actual (€/kWh), con `price_XXh` y `price_next_day_XXh` de hoy y mañana |
| `periodo`, `siguiente_periodo`, `siguiente_periodo_en` | Periodo P1/P2/P3 actual, el siguiente y cuándo |
| `periodo_potencia`, `siguiente_periodo_potencia`, `potencia_disponible` | Periodos de potencia y potencia disponible |
| `precio_minimo`, `precio_maximo`, `precio_medio` | Mínimo, máximo y media de hoy |
| `nivel_precio`, `siguiente_mejor_precio`, `siguiente_mejor_precio_en`, `precios_mejores` | Nivel del precio y próxima hora barata |
| `precio_excedentes`, `precio_indexado`, `precio_omie`, `ajuste_gas` | Con la API privada de ESIOS |

**Factura** (por suministro):

| Entidad | Qué es |
|---|---|
| `factura_actual` | Previsión de la factura del periodo en curso; en atributos, lo gastado hasta ahora, el rango y el desglose |
| `factura_anterior` | Factura del periodo cerrado: estimada o la real si la has introducido, con la desviación |
| `coste_hoy` | Coste de hoy (válido para el panel de Energía) |
| `precio_real` | Lo que cuesta de verdad cada kWh más en cada hora, con bono e impuestos |
| `kwh_bonificables` | kWh con descuento que te quedan en el periodo |
| `estado_datos` | Diagnóstico: precios, consumo, calibración, precisión, Shelly |
| `date.pvpc_bs_fin_periodo` | Fecha de fin del periodo (editable si la COR lee otro día) |
| `mejor_alternativa` | Ahorro anual de la mejor oferta de la CNMC frente a lo pagado (ver [Comparar tarifas](#comparar-tarifas)) |
| `button.pvpc_bs_comparar_tarifas` | Lanza la comparativa de tarifas |

Además, cada suministro escribe la estadística `pvpc_bonosocial:coste_<suministro>`, que se puede elegir como coste en el panel de Energía (la integración lo ofrece con un aviso; nunca lo cambia sola).

## Tarjeta

La integración trae su propia tarjeta y la carga sola: no hay que instalar nada aparte ni añadir recursos. En un panel, **Añadir tarjeta → PVPC + Bono Social**. Muestra:

- el precio actual con un icono € en verde, amarillo, naranja o rojo (o por periodo P1–P3), sin título salvo que se ponga uno (`title`);
- el mínimo y el máximo de hoy (azul) y de mañana (amarillo), con su hora, como la tarjeta `pvpc-hourly-pricing-card`;
- la gráfica de hoy y de mañana en escalones por hora, con triángulos en el mínimo y el máximo, la hora actual marcada y, en los laborables, las horas punta y llano sombreadas. Los colores se pueden cambiar, o colorear cada hora de hoy por su precio (la misma regla que el resumen de Telegram);
- la factura del periodo en curso (lo gastado y, entre paréntesis, la previsión) y, debajo, la del periodo anterior con sus fechas (con la desviación si está conciliada y la segunda opinión de la CNMC si está activada). Puede ir bajo la gráfica, arriba (en pantallas estrechas pasa abajo sola) u oculta.

Todo se configura en el editor visual. En YAML:

```yaml
type: custom:pvpc-bono-social-card
entity: sensor.pvpc_bs_precio   # opcional: se detecta sola
factura: below_chart            # below_chart, header o hidden
icon_color: price               # price o period
colores: fijo                   # fijo (un color por día) o precio (hoy coloreado por precio)
color_hoy: "#4269d0"               # leyenda, línea y triángulos de hoy (en el editor, selector de color)
color_manana: "#f4bd4a"            # lo mismo para mañana
bandas: true                    # punta y llano sombreados
entity_injection: sensor.pvpc_bs_precio_excedentes   # opcional: precio de excedentes, en punteado
```

También valen las opciones de la tarjeta antigua `show_current`, `show_details`, `show_graph` y `show_only_today`.

Las tarjetas con `type: custom:pvpc-hourly-pricing-card` siguen funcionando. Si además tienes instalada esa tarjeta desde HACS, se usa la de HACS: desinstálala y cambia el `type` para usar la nueva.

## Resumen de precios por Telegram

Un mensaje por la mañana (07:00) con los precios de hoy y otro por la noche (21:05) con los de mañana comparados con hoy, como gráfico de barras hecho con emojis, con las horas más baratas y más caras, el periodo de cada hora en los laborables (🔴 punta, 🟡 llano, 🟢 valle), las mejores franjas de 3 horas y, si quieres, el consumo y el coste del día y la factura en curso.

En la integración, **Añadir resumen por notificación** y elige el destino: un chat de Telegram (la entidad de notificación que crea la integración de Telegram de HA; el ID del chat no hay que escribirlo) o cualquier otra notificación (la app del móvil, por ejemplo, en texto plano). Puedes añadir varios destinos. En fines de semana y festivos, en los que todo el día es valle, las horas se colorean comparando con los 5 días laborables anteriores (se puede cambiar).

Para probarlo o usarlo desde una automatización: servicio `pvpc_bonosocial.enviar_resumen` (`manana: true` para el de la noche; `dry_run: true` devuelve el texto sin enviarlo).

## Introducir la factura real

Cuando llega la factura, conviene introducirla: con ella la integración fija la fecha real del corte, recalibra el medidor (que nunca mide exactamente igual que el contador), corrige el saldo de kWh con descuento del bono social y reescribe el coste de ese periodo en el panel de Energía con el importe real. Cuantas más facturas introduzcas, más se afina la previsión.

1. En **Ajustes → Dispositivos y servicios → PVPC + Bono Social**, pulsa la rueda dentada **⚙** del suministro (**Reconfigurar**).
2. Elige **Introducir factura real** (la otra opción, **Cambiar datos del suministro**, es para la potencia, el bono, la fuente de consumo, etc.).
3. **Sube el PDF de la factura** y la integración lee sola las fechas del periodo y de emisión, los kWh de P1, P2 y P3, el total y los kWh bonificados. En el paso siguiente solo tienes que revisarlos y confirmar. Si no tienes el PDF, deja el archivo vacío y escribe los datos a mano: el formulario propone las fechas del último periodo cerrado.

Una factura que se solapa con otra ya introducida (por ejemplo, una rectificativa) la sustituye. Si subes un abono (una rectificativa con importe negativo), la integración te pide la factura que lo sustituye. El PDF se lee en tu Home Assistant, sin enviarlo a ningún sitio, y se borra al terminar. También puedes hacerlo desde una automatización con el servicio `pvpc_bonosocial.conciliar_factura`.

> ⚠️ **La lectura automática del PDF solo funciona con las facturas de la Comercializadora Regulada, Gas & Power (Naturgy)**, porque es la única comercializadora de la que tengo facturas para probarlo. Con cualquier otra, el formulario sigue funcionando a mano.
>
> Si quieres que añada otra comercializadora de referencia (ver [Se buscan voluntarios](#se-buscan-voluntarios)), necesito **al menos de 3 a 5 facturas consecutivas en PDF** (el PDF original, no una foto ni un escaneo). Puedes tapar el nombre, la dirección, el CUPS y los números de contrato: lo que hace falta es la estructura de la factura y sus importes. No las subas a una incidencia pública: abre una incidencia indicando la comercializadora y te diré cómo enviarlas en privado.

### Evolución de las facturas

Cada periodo cerrado (con la factura real o, si aún no la has introducido, la estimada) se guarda en la estadística `pvpc_bonosocial:facturas_<suministro>`: el importe de la factura, el primer día de su periodo. Para verla, un **gráfico de estadísticas** en barras por mes (una barra por factura, con su importe real; HA lo llama «media» porque es el tipo de estadística, pero cada mes solo tiene una factura):

```yaml
type: statistics-graph
entities:
  - pvpc_bonosocial:facturas_casa   # «casa» = nombre del suministro al crearlo
stat_types: [mean]
period: month
days_to_show: 365
chart_type: bar
```

Para ver las últimas 5, 6, 9 o 12 facturas, cambia `days_to_show` por 150, 180, 270 o 365 (o «Días a mostrar» en el editor visual de la tarjeta).

### Segunda opinión de la CNMC

Opcional (**⚙ Reconfigurar → Cambiar datos del suministro**, en el último paso, con el código postal): cuando se cierra cada periodo, la integración pide **la misma factura al simulador oficial de la CNMC** ([facturaluz](https://comparador.cnmc.gob.es/facturaluz/inicio)) con tu consumo hora a hora, tus potencias y tu bono social, y la muestra junto a la nuestra: atributos `cnmc`, `cnmc_diferencia` y `cnmc_desglose` de `sensor.pvpc_bs_factura_anterior`, y en la tarjeta («· CNMC 131,66 €»).

- Sirve para comprobar el cálculo con una fuente oficial e independiente. Con una factura real de 133,62 € y la curva del medidor de HA, la CNMC dio 131,66 €: la diferencia (1,5 %) es la misma que hay entre los kWh del medidor y los del contador.
- La CNMC no aplica el **arrastre** de kWh con descuento de periodos anteriores, y calcula con la curva del medidor, no con la del contador: su importe puede diferir algo del real.
- **Privacidad**: se envían el consumo hora a hora del periodo, las potencias, el tipo y la categoría del bono y el código postal. El CUPS no: va uno de ejemplo.
- Se pide una vez por periodo (de madrugada; si la CNMC no responde, se reintenta al día siguiente).

## Comparar tarifas

¿Te saldría más barata otra compañía? Con el botón **Comparar tarifas** de cada suministro (o el servicio `pvpc_bonosocial.comparar_tarifas`), la integración compara **lo que has pagado de verdad en los últimos 12 meses** (las facturas introducidas o, si faltan, las estimadas al cierre) con las ofertas del [comparador oficial de la CNMC](https://comparador.cnmc.gob.es/) para tu código postal, tu potencia y **tu consumo real en punta, llano y valle** (no el perfil medio que usa el formulario de la web).

- Necesita el **código postal** del suministro: **⚙ Reconfigurar → Cambiar datos del suministro**, en el último paso. Ahí también puedes activar una comparativa automática el día 2 de cada mes.
- El resultado queda en el sensor `sensor.pvpc_bs_mejor_alternativa` (ahorro anual de la mejor oferta; en sus atributos, las 5 mejores con permanencia, servicios adicionales, vigencia y si son solo para nuevos clientes) y en una notificación con las 3 mejores. El servicio también puede mandarlo a Telegram o a cualquier notificación (`destino`).
- **Bono social**: solo existe con el PVPC de una comercializadora de referencia. **Si cambias a mercado libre, lo pierdes.** La comparativa te dice lo que pagaste con bono, lo que habrías pagado sin él y la mejor oferta libre; casi siempre gana el PVPC con bono.
- **No es un censo del mercado**: la CNMC solo incluye las ofertas que le mandan las comercializadoras, y varias grandes no están. La comparativa te dice cuáles faltan. Para comparar a mano, también puedes usar el comparador de la OCU.
- Los importes de la CNMC llevan los impuestos y el alquiler del contador de hoy; lo pagado, los de cada factura. Con menos de un año de facturas, lo pagado y el consumo se extrapolan a un año (y se avisa).
- **Privacidad**: al comparar se envían a la CNMC (un organismo público) solo el código postal, las potencias y los kWh anuales por periodo. Nada más: ni el CUPS, ni el nombre, ni la dirección.
- La API del comparador no está documentada y a veces no responde (en octubre de 2026 estuvo caída varios días, también para la propia web). Si falla, se avisa, se conserva la comparativa anterior y no afecta a nada más.

## Datadis

Opcional. Con tu usuario y contraseña de [datadis.es](https://datadis.es), la integración descarga una vez al día el consumo horario **oficial del contador** y lo guarda en la estadística `pvpc_bonosocial:energia_datadis_<nombre>`, que puedes elegir como fuente de consumo de un suministro (*estadística externa*) o usar como referencia frente a tu medidor.

- Antes de usar nada se comprueba: se descartan los días con horas repetidas, con horas que no existen ese día o idénticos a otro día (exports corruptos).
- Si Datadis no da datos o no responde, no pasa nada: el sensor `sensor.pvpc_bs_estado_datadis` lo dice y se vuelve a intentar al día siguiente; cuando vuelva a dar datos, se rellena hacia atrás.
- También puedes importar el CSV de consumo que se descarga en datadis.es: **⚙ Reconfigurar → Importar un CSV de datadis.es**.
- Datadis solo deja hacer la misma consulta una vez al día y a menudo va con uno o dos días de retraso: para la factura en tiempo real sigue siendo mejor un medidor.

## Migración

- **Desde PVPC Next**: al añadir la integración (o con el aviso que aparece en Reparaciones) se importan su configuración y sus entidades, con su historial y sus estadísticas. Siempre con tu confirmación; después puedes eliminar la entrada vacía de PVPC Next y desinstalarlo desde HACS.
- **Desde la versión anterior de esta integración (0.2)**: automática al actualizar; se crea el primer suministro con tus datos y el «coste hoy» pasa a ser su coste.
- **Nombres nuevos**: las entidades migradas pasan a llamarse `sensor.pvpc_bs_*` conservando su historial y sus estadísticas. El panel de Energía se actualiza solo; un aviso lista los cambios para que actualices tus scripts, automatizaciones y paneles (por ejemplo, `sensor.esios_pvpc` → `sensor.pvpc_bs_precio`).
- Haz una **copia de seguridad** antes de migrar.

## Precisión

- **Fórmula**: reproduce **21 de 21 facturas reales** de la COR al céntimo (con los kWh de la factura).
- **Con un medidor**: la diferencia viene de lo que mide el medidor frente al contador. Sin calibrar, en torno a 1–2 € por factura; **con facturas introducidas, error medio de 0,45 €** (máximo 1,27 €) en 8 facturas reales.
- **Previsión a mitad de periodo**: depende de cuánto cambie tu consumo; la entidad da un rango (bajo–alto) que la recoge.
- **Cambios de contrato a mitad de periodo**: se calculan por tramos con cada contrato. Si el bono empieza o acaba a mitad de periodo, el descuento es una estimación (no hay facturas reales de ese caso para comprobarlo): introducir la factura real lo corrige.

## Cómo se calcula

- **Factura de la COR**: término de potencia (peajes, cargos y margen de comercialización por días), energía al PVPC de cada hora, descuento del bono social sobre la parte con derecho, impuesto eléctrico (con su mínimo), alquiler del contador e IVA, con redondeo por línea como la COR. Todos los valores regulados están en `engine/tarifas.json`, cada uno con su referencia del BOE y sus fechas de vigencia.
- **Periodos y festivos** (Circular CNMC 3/2020, art. 7): fines de semana, 6 de enero y festivos nacionales de fecha fija son valle todo el día. **Jueves y Viernes Santo no lo son** (no tienen fecha fija). Cuando ESIOS publica los peajes de cada hora, se usan esos.
- **Bono social** ([RD 897/2017](https://www.boe.es/buscar/act.php?id=BOE-A-2017-11505), art. 6.3 y anexo I): límite anual según la unidad de convivencia, prorrateado por días, y los kWh no consumidos de los 12 meses anteriores.
- **Peajes y cargos**: Resolución de la CNMC y Orden del Ministerio de cada año. **Impuesto eléctrico** ([Ley 38/1992](https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741)) e **IVA** ([Ley 37/1992](https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740)), con las rebajas temporales de cada momento.
- **Datos**: precios y peajes horarios de ESIOS (REE), archivo público del PVPC.
- **Normativa al día**: una tarea revisa el BOE cada semana y avisa si sale algo que pueda cambiar la factura.

## Comparativa con otras integraciones

Revisado el 10-oct-2026, leyendo el código de cada una:

| | Precios PVPC | Factura y bono social | Festivos | Notas |
|---|---|---|---|---|
| **PVPC + Bono Social** | ✅ (los de PVPC Next) | ✅ | Regla de la Circular 3/2020 y peajes publicados por ESIOS | Tarjeta, resumen y comparador de tarifas (CNMC) incluidos |
| Integración oficial `pvpc_hourly_pricing` (`esios_api` 4.4.0) | ✅ | ❌ | Tablas fijas, 2027–2028 provisionales | |
| [PVPC Next](https://github.com/privatecoder/ha-pvpc-next) 2.3.0 | ✅ | ❌ | Calculados | Base de la parte de precios de esta integración |
| [Enchufado](https://github.com/Migux13/enchufado) 0.3 (revisada el 13-oct) | ✅ (ESIOS, con token propio) | Factura simulada por la CNMC, sin bono social | — | Consumo de Datadis; coste horario sin impuestos ni fijos |
| [`Javisen/ha-pvpc-fixed`](https://github.com/Javisen/ha-pvpc-fixed) 1.8.0 y [`vtb77/ha-pvpc-alternative`](https://github.com/vtb77/ha-pvpc-alternative) 1.2.1 | ✅ | ❌ | Tablas manuales | Cuentan el **Viernes Santo** como valle todo el día, en contra de la Circular 3/2020 |

## Se buscan voluntarios

Hay cosas que no se pueden añadir ni probar sin datos reales, y yo solo tengo lo mío (facturas de una comercializadora y un Shelly EM de 1.ª generación). **Si tienes alguno de estos casos y quieres que funcione, necesito que me envíes datos para incorporarlo y probarlo:**

| Qué falta | Qué necesito |
|---|---|
| **Leer el PDF de la factura de otras comercializadoras de referencia** (hoy solo la Comercializadora Regulada, Gas & Power, de Naturgy) | De 3 a 5 facturas **consecutivas** en PDF original (no fotos ni escaneos) |
| **Shelly de 2.ª y 3.ª generación** (Pro EM, Pro 3EM, EM Gen3, EM Mini Gen3…) para comprobar el consumo con su memoria interna | El modelo y el CSV de su memoria de unos días (se descarga desde la web del propio Shelly) |
| **Otros medidores con memoria propia** (otras marcas) | El modelo, cómo se descargan sus datos y un ejemplo de unos días |
| **Datadis con datos** (en mi caso la distribuidora no los publica, así que está probado solo con datos simulados) | Que lo actives, me digas si funciona y, si algo falla, el diagnóstico de la integración (no lleva usuario, contraseña ni CUPS) |

Puedes tapar el nombre, la dirección, el CUPS y los números de contrato: lo que hace falta es el formato y los números. **No subas nada de esto a una incidencia pública**: abre una incidencia diciendo qué tienes y te diré cómo enviármelo en privado.

## Créditos

Este proyecto se apoya en el trabajo de mucha gente: ver [CREDITS.md](CREDITS.md).

## Licencia

MIT, © 2026 BaRDaHL: libre uso, modificación y distribución. Ver [LICENSE](LICENSE). Los componentes de terceros conservan su licencia ([NOTICE](NOTICE)).

---

## English

**Spanish PVPC hourly prices and real-time electricity bill calculation, with or without social bonus**, for Home Assistant.

> Unofficial tool. The bill that counts is your supplier's; this integration estimates it and tells you before it arrives.

### How to

- **Install**: HACS → ⋮ → Custom repositories → `https://github.com/BaRDaHL/pvpc_bonosocial` (Integration) → Download → restart → Settings → Devices & services → Add integration → PVPC + Bono Social.
- **Add a supply**: in the integration, **Add supply** (power, social bonus, consumption sensor, end date of the last bill).
- **Add an actual bill**: gear icon ⚙ of the supply → **Enter actual bill** → upload the PDF.
- **Price card**: Add card → PVPC + Bono Social (`type: custom:pvpc-bono-social-card`).
- **Bills card**: a statistics graph of `pvpc_bonosocial:facturas_<supply>` with `stat_types: [mean]`, `period: month`, `chart_type: bar` and `days_to_show` 150/180/270/365 for the last 5/6/9/12 bills.
- **Energy dashboard cost**: accept the Repairs notice, or pick the `pvpc_bonosocial:coste_<supply>` statistic as grid cost.

### What it does

- **PVPC hourly prices** for today and tomorrow (everything from PVPC Next): energy and power periods, price levels, next best hour, min/max/average, available power and optional ESIOS private API.
- **Real-time bill** with the regulated supplier (COR), with or without **social bonus** (bono social): spent so far, forecast at the end of the period and the closed bill before it arrives, line by line like the COR's.
- **Its own card** with the price chart and the bill.
- **Price summary on Telegram** (or any notify entity), morning and evening.
- **Energy dashboard** with the real cost of each hour, corrected when the actual bill is entered.
- **Lossless migration** from PVPC Next and from version 0.2: entities are renamed to `sensor.pvpc_bs_*` keeping their history and statistics.

### Requirements

2.0TD supply on PVPC in mainland Spain or the Balearic Islands, Home Assistant 2025.11 or later and, for the bill, an hourly consumption source (any energy sensor, e.g. a Shelly EM, or an external statistic).

### Installation

HACS → **Custom repositories** → `https://github.com/BaRDaHL/pvpc_bonosocial` (Integration) → install and restart → **Settings → Devices & services → Add integration → PVPC + Bono Social**. Then add a **supply** for each contract and, optionally, a **price summary notification**.

### Card and Telegram summary

The integration ships and loads its own card (**Add card → PVPC + Bono Social**): current price, today's (blue) and tomorrow's (yellow) min/max, stepped hourly chart with min/max markers like `pvpc-hourly-pricing-card` (colours configurable, or today coloured by price) and peak/standard hours shaded on working days, and the bill (previous and current). Cards with `type: custom:pvpc-hourly-pricing-card` keep working through an alias. Add a **price summary notification** to get a morning and an evening emoji chart of prices on Telegram (no chat ID to type) or any notify entity; service `pvpc_bonosocial.enviar_resumen` (`dry_run: true` returns the text).

### Entering the actual bill

When the bill arrives, open the supply's **Reconfigure** menu (gear icon ⚙) and choose **Enter actual bill**. Upload the bill PDF and the integration reads the billing and issue dates, the kWh in P1, P2 and P3, the total and the discounted kWh; you only have to check them. Without the PDF, type the data by hand. The bill sets the real meter reading date, recalibrates the meter, corrects the social bonus balance and rewrites that period's cost in the Energy dashboard. The PDF is read locally and deleted afterwards.

**Automatic PDF reading only works with bills from Comercializadora Regulada, Gas & Power (Naturgy)**, the only supplier I have bills from to test it. To add another regulated supplier I need **at least 3 to 5 consecutive bills as PDF** (the original PDF, not a photo or scan; personal data can be covered). Do not post them in a public issue: open an issue naming the supplier and I will tell you how to send them privately.

### CNMC second opinion

Optional (set it next to the postal code in **Reconfigure**): when each period closes, the same bill is requested from the official CNMC simulator with your hourly consumption, contracted power and social bonus, and shown next to ours (`cnmc` attributes of `sensor.pvpc_bs_factura_anterior`, and in the card). The CNMC does not apply the bonus carry-over and uses the HA meter curve, so small differences are expected. Hourly consumption, power, bonus type and postal code are sent; the CUPS is not (a sample one is used).

### Comparing tariffs

The **Compare tariffs** button of each supply (or the `pvpc_bonosocial.comparar_tarifas` service) compares **what you actually paid over the last 12 months** with the offers of the [CNMC official comparator](https://comparador.cnmc.gob.es/) for your postal code, contracted power and **real peak/standard/off-peak consumption**. It needs the supply's postal code (set it in **Reconfigure**; a monthly comparison can be enabled there too). The result goes to `sensor.pvpc_bs_mejor_alternativa` (yearly saving of the best offer, top 5 in the attributes) and to a notification with the top 3. **The social bonus only exists with the PVPC of a reference retailer: switching to the free market loses it**, and the comparison shows what you paid with it, without it and with the best free-market offer. The CNMC comparator is not a full census of the market (missing large retailers are listed). Only the postal code, the contracted power and the yearly kWh per period are sent to the CNMC. Its API is undocumented and sometimes down: a failure is reported and nothing else is affected.

### Accuracy

The formula reproduces 21 out of 21 real COR bills to the cent. With a meter and a few actual bills entered, the average error was €0.45 (max €1.27) over 8 real bills.

### Volunteers wanted

Some things cannot be added or tested without real data, and I only have my own (bills from one supplier and a 1st-generation Shelly EM). **If you have one of these cases and want it supported, please send data so it can be added and tested:** bill PDFs from other regulated suppliers (3 to 5 consecutive original PDFs), Shelly 2nd/3rd generation meters (model and a few days of their internal memory CSV), other meters with their own memory (model, how to download the data and a sample), and Datadis accounts that actually return data (tell me whether it works; the integration diagnostics contain no user, password or CUPS). Personal data can be covered. **Do not post any of this in a public issue**: open an issue saying what you have and I will tell you how to send it privately.

### License

MIT, © 2026 BaRDaHL. See [CREDITS.md](CREDITS.md) and [LICENSE](LICENSE).
