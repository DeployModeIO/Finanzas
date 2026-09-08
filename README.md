# Meridiano · Analizador Global de ETFs

PWA local (sin backend, sin claves de API) para **inversiones a mediano plazo en ETFs
globales**, con módulo de **predicción de mercado**. Diseño claro/oscuro de primera clase
bajo el estándar de la skill impeccable (modo Operate, dirección "libro mayor del inversor
paciente").

## Abrir

Sirve la carpeta con cualquier servidor estático (recomendado para el service worker):

```
python -m http.server 8080
```

y abre `http://localhost:8080`. Sin servidor también funciona abriendo `index.html`
directamente (sin offline ni datos en vivo).

## Funciones

- **Panel** — KPIs (valor, día, YTD, retorno total), evolución de cartera, posiciones con
  P&L, asignación (donut) y lista de seguimiento.
- **ETFs** — catálogo de 40 ETFs globales con búsqueda y filtros por región/sector; detalle
  con precio, medias 50/200, Bandas de Bollinger, RSI, MACD, Sharpe, drawdown, TER y AUM.
- **Cartera** — posiciones editables (IndexedDB), riesgo agregado (volatilidad, Sharpe,
  drawdown, VaR 95%, correlación media, CAGR) y rebalanceo frente a pesos objetivo.
- **Optimizador** — frontera eficiente media-varianza y asignación sugerida según perfil
  (conservador / equilibrado / agresivo).
- **Predicción** — modelos educativos extraídos de proyectos de GitHub:
  - *Monte Carlo (GBM)* y *AR-lite* bandas P10/P50/P90 — esencia de
    `huseinzol05/Stock-Prediction-Models`.
  - *Score cuantitativo* (momentum, volatilidad, drawdown, TER → probabilidad de superar
    el S&P 500 a 12 meses) — esencia de `robertmartin8/MachineLearningStocks`.
  - *Agente Q-learning* (compra / mantén / vende con backtest) — esencia de
    `AI4Finance-Foundation/FinRL` y `austin-starks/Deep-RL-Stocks`.
  - *Sentimiento de titulares* por léxico NLP local — esencia de `shirosaidev/stocksight`.
- **Alertas** — precio objetivo por ETF con detección de cruce arriba/abajo.
- **Informe** — exportación PDF (jsPDF) con resumen, posiciones y descargo.

## Datos

- Intenta precios diarios reales de Yahoo Finance (3 años, sin clave).
- Si la API no responde (CORS/offline), genera **series demo deterministas** por ticker y
  lo indica en todo momento (badge "demo" y bandera en el rail).
- Los modelos predictivos son educativos y **no constituyen asesoramiento financiero**.

## Estructura

```
index.html            App (vista única SPA por hash)
css/tokens.css        Tokens claro/oscuro
css/app.css           Layout y componentes
js/catalog.js         Universo de ETFs + generador demo determinista
js/data.js            Yahoo Finance con respaldo demo
js/indicators.js      SMA, EMA, RSI, MACD, Bollinger, Sharpe, VaR, drawdown
js/predict.js         Monte Carlo, AR-lite, score logístico, agente Q, sentimiento
js/portfolio.js       IndexedDB (posiciones y metadatos)
js/optimizer.js       Frontera media-varianza, sugerencias y drift de rebalanceo
js/charts.js          Configuración Chart.js tematizada
js/ui.js              Render de tablas, KPIs y estados
js/app.js             Controlador (rutas, modales, tema, acciones)
sw.js                 Service worker offline-first
```

## Atajos

- `Esc` cierra modales · tablas y filas son navegables con teclado · el tema se recuerda
  en `localStorage` y por defecto sigue al sistema.
