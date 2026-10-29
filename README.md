# URBANFLOW AI — Smart Urban Delivery Simulator

Sistema de gestión y simulación de entregas urbanas (Huánuco) con grafos ponderados, listas de adyacencia, Dijkstra, cola de prioridad y lista enlazada. HTML5 + CSS3 + JavaScript puro, sin frameworks.

## Ejecutar
- Local: `python3 -m http.server 8000` y abrir http://localhost:8000
- Pruebas de lógica (sin navegador): `node tests/run.js`

## Publicar en GitHub Pages (HTTPS, necesario para el GPS)
Settings → Pages → Branch `main` / carpeta `/ (root)` → Save.
La app del repartidor queda en `https://TU-USUARIO.github.io/NOMBRE-REPO/repartidor.html`

## Ubicación en tiempo real
Crea una Firebase Realtime Database y pon su URL en `js/config.js`. Reglas de demostración (abiertas; para producción añade autenticación):
`{"rules":{"couriers":{".read":true,".write":true}}}`
No subas claves privadas al repositorio.

## Estructura
`index.html`, `repartidor.html`, `css/styles.css`, `js/` (graph, dijkstra, priorityQueue, linkedList, orders, dispatch, simulation, comparison, live, huanuco, app), `tests/run.js`.

Los datos se guardan en localStorage (navegador), no en un servidor. Mapa © OpenStreetMap contributors.
