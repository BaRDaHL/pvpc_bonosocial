# Créditos / Credits

Este proyecto se apoya en el trabajo de otras personas. Gracias a todas ellas.

| Quién | Proyecto | Licencia | Relación |
|---|---|---|---|
| Eugenio Panadero ([@azogue](https://github.com/azogue)) | [`aiopvpc`](https://github.com/azogue/aiopvpc) y la integración oficial [`pvpc_hourly_pricing`](https://www.home-assistant.io/integrations/pvpc_hourly_pricing/) de Home Assistant | MIT / Apache-2.0 | Idea original de traer el PVPC a Home Assistant |
| Álvaro Gutiérrez Romero ([@chiro79](https://github.com/chiro79)) | Co-mantenedor de `pvpc_hourly_pricing` y autor de [`esios-api`](https://github.com/chiro79/esios-api) | — | Misma línea de trabajo |
| [privatecoder](https://github.com/privatecoder) | [`ha-pvpc-next`](https://github.com/privatecoder/ha-pvpc-next), [`pvpc-hourly-pricing-card`](https://github.com/privatecoder/pvpc-hourly-pricing-card) (fork), [`spanish-pvpc-holidays`](https://github.com/privatecoder/spanish-pvpc-holidays) | MIT / Apache-2.0 | Capa de precios incorporada (PVPC Next 2.3.0 y `aiopvpc`); `spanish-pvpc-holidays`, referencia del calendario de festivos; la tarjeta incluida mantiene la configuración de su tarjeta |
| Daniel Martín González ([@danimart1991](https://github.com/danimart1991)) | [`pvpc-hourly-pricing-card`](https://github.com/danimart1991/pvpc-hourly-pricing-card) | Apache-2.0 | Tarjeta original: la tarjeta incluida está escrita de cero con su mismo diseño y acepta su configuración (alias `pvpc-hourly-pricing-card`) |
| [Pictogrammers](https://pictogrammers.com) | [Material Design Icons](https://pictogrammers.com/library/mdi/) | Apache-2.0 | Los triángulos de mínimo y máximo de la tarjeta (`triangle`, `triangle-down` y sus contornos), los mismos que usa la tarjeta original |
| Google LLC | [Lit](https://lit.dev) 3.2.1 | BSD-3-Clause | Va empaquetado dentro de la tarjeta (`frontend/pvpc-bono-social-card.js`), con su aviso de licencia al final del archivo |
| [Migux13](https://github.com/Migux13) | [`enchufado`](https://github.com/Migux13/enchufado) | MIT | Uso del simulador de facturas de la CNMC con la curva horaria (la segunda opinión de la factura; código propio) |
| [nuncaeslupus](https://github.com/nuncaeslupus) | [`comparador-luz-gas`](https://github.com/nuncaeslupus/comparador-luz-gas) | MIT | Parámetros de la API del comparador de la CNMC y respuesta grabada para las pruebas del comparador de tarifas |
| [CNMC](https://comparador.cnmc.gob.es/) | Comparador oficial de ofertas de energía | — | Fuente de las ofertas del comparador de tarifas |
| [Home Assistant](https://www.home-assistant.io/) | Plataforma y código de origen de la integración oficial | Apache-2.0 | Base |
| [Red Eléctrica (REE) / ESIOS](https://www.esios.ree.es/) | Datos de precios | Reutilización con atribución | Fuente de datos |

Cuando se incorpore código de terceros, cada fichero conservará su licencia y su aviso de copyright, con la indicación de los cambios, y se lista en `NOTICE`.

Copyright del proyecto: (c) 2026 BaRDaHL.
