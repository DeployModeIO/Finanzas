# PRODUCT.md — Finanzas (Analizador Global de ETFs)

> Nota: PRODUCT.md inferido del brief explícito del usuario (sesión dirigida por el usuario
> en español). Supuestos marcados con **[supuesto]**.

## Producto

Aplicación web local (PWA, sin backend) para analizar y seguir **inversiones a mediano plazo
en ETFs globales**, con módulo de **análisis predictivo de mercado**. Inspirada en lo mejor
de Ghostfolio, StockDock, investment-news y AlphaForge (cartera, análisis técnico, riesgo,
optimización media-varianza) y en la segunda tanda aportada por el usuario: FinRL
(agente RL), Stock-Prediction-Models (Monte Carlo, ARIMA), MachineLearningStocks
(score ML fundamental), StockSight (sentimiento NLP) y Deep-RL-Stocks (agentes PPO/DDDG —
aquí como Q-learning ligero).

Los modelos predictivos son implementaciones educativas en JS del navegador, entrenadas
al vuelo sobre la serie del propio ETF, y se etiquetan siempre como **educativos, no
asesoramiento financiero**.

## Usuarios

- **[supuesto]** Inversor individual hispanohablante, auto-dirigido, horizonte de 1–5 años.
- **[supuesto]** Usa la app en su escritorio Windows tras el trabajo; también la consulta en
  móvil. Ambiente: oficina con luz de día y salas tenues por la noche → **la app exige tema
  claro y oscuro reales, conmutable y persistente** (pin explícito del usuario: "impeccable
  claro oscuro").

## Trabajo del usuario

1. Vigilar el valor de su cartera y su evolución (día, YTD, total).
2. Descubrir y comparar ETFs globales por región/sector antes de decidir.
3. Analizar un ETF: precio, medias, RSI, MACD, Bandas de Bollinger, volatilidad, Sharpe.
4. Registrar posiciones (compra, cantidad, precio) y ver P&L real.
5. Rebalancear: pesos objetivo, desvíos, sugerencias.
6. Optimizar asignación media-varianza según su tolerancia al riesgo.
7. Exportar un informe PDF.

## Principios

- Datos honestos: precios de API gratuita cuando estén disponibles; si no, serie sintética
  determinista **etiquetada como "datos demo"**. Nunca presentar demo como real.
- Todo local: IndexedDB + localStorage; sin cuentas, sin claves de API obligatorias.
- Operar antes que decorar: escaneabilidad, números tabulares, estados completos
  (cargando/vacío/error).
- Accesible: contraste ≥ 4.5:1 en ambos temas, foco visible, navegación por teclado.

## Compromisos de marca

- Tema claro y oscuro de primera clase, ambos diseñados (no uno derivado del otro).
- Sin estética HMI/SCADA (rechazada explícitamente por el usuario el 2026-09-03).
- Diseño bajo el estándar de la skill **impeccable**: oficio por encima de plantilla.
