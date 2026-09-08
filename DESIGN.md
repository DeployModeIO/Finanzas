# DESIGN.md ? Meridiano, libro mayor del inversor paciente

Direcci?n de dise?o de la app **Finanzas / Meridiano** (PWA vanilla, tema claro/oscuro).
Fuente de verdad del mundo visual; los valores provienen de `css/tokens.css` y `css/app.css`.

## 1. T?tulo y direcci?n

**?Libro mayor del inversor paciente?** ? modo Operate de la skill impeccable.

- **Thesis:** un libro mayor sereno donde las decisiones de inversi?n se toman con calma.
  Rechaza expl?citamente el terminal de trading ne?n y el dashboard de tarjetas uniformes.
- **Own-world:** papel c?lido con tinta en claro; tinta azul-noche profunda en oscuro; acento
  verde siempreviva; rojo/verde reservados a la sem?ntica de deltas; todo dato num?rico en
  monoespaciada tabular; reglas finas de 1 px, cero sombras decorativas, cero tarjetas anidadas.
- **Story:** el inversor abre la app y ve la verdad de su cartera en segundos; compara ETFs,
  registra posiciones y conf?a porque cada dato declara si es real o demo.

## 2. Tokens (valores reales de `css/tokens.css`)

### Color ? claro (`:root`)

| Token | Valor | Uso |
|---|---|---|
| `--paper` | `#f7f5f0` | Fondo de p?gina |
| `--surface` | `#fffdf9` | Superficie de paneles |
| `--surface-2` | `#f1eee6` | Hover de filas / fondo de skeleton |
| `--ink` | `#1c1a17` | Texto principal |
| `--ink-2` | `#5a554b` | Texto secundario |
| `--ink-3` | `#8a8375` | Texto terciario / cabeceras |
| `--rule` | `#e2ddd1` | Reglas y bordes 1 px |
| `--rule-strong` | `#cfc8b8` | Bordes en hover / scroll |
| `--accent` | `#1f6f43` | Acento verde siempreviva |
| `--accent-ink` | `#ffffff` | Texto sobre acento |
| `--accent-soft` | `rgba(31,111,67,.09)` | Fondo suave (?tem activo) |
| `--up` | `#1f6f43` | Delta positivo (sem?ntico) |
| `--down` | `#b3372e` | Delta negativo (sem?ntico) |
| `--warn` | `#9a6b1f` | Modo demo / avisos |
| `--focus` | `#1f6f43` | Anillo de foco visible |

### Color ? oscuro (`[data-theme="dark"]`)

| Token | Valor |
|---|---|
| `--paper` | `#0f1319` |
| `--surface` | `#161b23` |
| `--surface-2` | `#1d242f` |
| `--ink` | `#ece9e2` |
| `--ink-2` | `#a8a294` |
| `--ink-3` | `#736e62` |
| `--rule` | `#262d38` |
| `--rule-strong` | `#38414f` |
| `--accent` | `#4fb07d` |
| `--accent-ink` | `#0c130f` |
| `--accent-soft` | `rgba(79,176,125,.12)` |
| `--up` | `#4fb07d` |
| `--down` | `#e06055` |
| `--warn` | `#d9a44a` |
| `--focus` | `#4fb07d` |

### Tipograf?a, radios y espaciado

| Token | Valor | Uso |
|---|---|---|
| `--sans` | `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif` | Cuerpo y titulares |
| `--mono` | `"Cascadia Mono", "Consolas", "IBM Plex Mono", ui-monospace, monospace` | Datos num?ricos (`.num`) |
| `--r-sm` | `8px` | Botones, campos, toasts |
| `--r-md` | `12px` | Previsualizaci?n de informe |
| `--r-lg` | `14px` | Paneles y modal |
| `--rail-w` | `216px` | Columna del rail de navegaci?n |
| `--pad` | `28px` | Padding del ?rea principal |
| `--measure` | `72ch` | Medida de lectura |

### Sombra (solo funcional)

`--shadow` existe ?nicamente para elementos que flotan sobre el contenido (modal y toasts):
claro `0 10px 24px rgba(28,26,23,.1), 0 2px 6px rgba(28,26,23,.06)`; oscuro
`0 12px 28px rgba(0,0,0,.45), 0 2px 8px rgba(0,0,0,.35)`. Nada m?s lleva sombra.

## 3. Tipograf?a

- **Cuerpo y display:** una sola familia (`--sans`); la jerarqu?a se construye con peso
  (650 titulares, 550?600 ?nfasis), tama?o y `letter-spacing: -0.02em` en h1?h3. No hay
  familia display separada: el registro es el de un documento contable, no el de una revista.
- **Mono para datos:** `.num { font-family: var(--mono); font-variant-numeric: tabular-nums; }`
  ? todo precio, porcentaje y cifra usa numerales tabulares para alinear columnas.
- **Escala usada** (px, de `app.css`): 26 (h1 de vista / valor de ledger), 20 (ledger en
  m?vil), 18 (marca), 17 (h2 de panel y modal), 15 (cuerpo base), 14 (tablas, campos,
  botones), 13.5 (toasts, deltas), 13 (tabs), 12.5 (labels, pistas), 12 (th), 11.5?11
  (badges, subt?tulos).

## 4. Componentes

Anatom?a com?n: **reglas de 1 px, sin tarjetas anidadas, sin sombras** (salvo modal/toast).

- **Rail** ? columna fija de 216 px con borde derecho 1 px; marca arriba, navegaci?n como
  enlaces con ?cono (activo: `--accent-soft` + acento), pie con el bander?n de modo de datos
  (demo/real) y el toggle de tema. En m?vil se vuelve barra horizontal sticky con scroll.
- **Ledger** ? franja de KPIs (valor, d?a, YTD, retorno) sobre reglas horizontales y
  separadores verticales de 1 px; etiqueta peque?a + cifra grande en `.num` + delta sem?ntico.
- **Panel** ? superficie `--surface`, borde 1 px `--rule`, radio `--r-lg`, cabecera con
  t?tulo 17 px y pista a la derecha; nunca panel dentro de panel.
- **Tablas** ? `border-collapse`, filas separadas por regla de 1 px, th en versalitas de
  12 px color `--ink-3`, columnas num?ricas alineadas a la derecha con `.num`, hover con
  `--surface-2`; contenedor con scroll horizontal en m?vil.
- **Botones** ? primario relleno de acento, ghost con borde 1 px, danger con texto `--down`;
  radios `--r-sm`, transici?n de 120 ms, foco visible.
- **Campos** ? label 12.5 px + input con fondo `--paper`, borde 1 px y foco con anillo suave
  de `--accent-soft`.
- **Badges** ? p?ldora 999 px de 11 px con borde 1 px: `demo` (?mbar) / `live` (verde).
- **Modal** ? backdrop `rgba(12,14,18,.45)`, caja `--surface` con borde 1 px, radio `--r-lg`
  y `--shadow` (funcional, por flotar); entrada con fade + translate suave.
- **Toasts** ? esquina inferior derecha, borde 1 px con l?nea izquierda de acento (o rojo en
  error), radio `--r-sm`, `--shadow` funcional.
- **Tabs** ? botones p?ldora con borde 1 px; activo relleno `--accent-soft` con borde de acento.
- **Skeleton** ? barra con gradiente horizontal que barre en shimmer 1.3 s mientras cargan datos.

## 5. Temas claro/oscuro

- **Tokens:** cada tema es un set completo y co-dise?ado (no una inversi?n del otro) en
  `tokens.css`: `:root` (claro) y `[data-theme="dark"]`, ambos con `color-scheme` correcto.
- **Aplicaci?n sin FOUC:** un script inline en `index.html` lee `localStorage("mq-theme")`
  y, si no hay elecci?n previa, consulta `matchMedia("(prefers-color-scheme: dark)")`; fija
  `data-theme` en `<html>` antes del primer pintado.
- **Toggle:** bot?n de tema fijo en la esquina superior derecha (`position: fixed`,
  `top: 16px; right: 20px; z-index: 30`), superficie con borde 1 px, ?cono sol/luna y
  etiqueta con el tema al que cambiar?; en m?vil se compacta (`top: 8px; right: 10px`,
  padding y fuente menores). `initTheme()` en `app.js` persiste la elecci?n en
  `localStorage`, repinta las gr?ficas y el `.view-head` reserva 156 px de padding derecho
  para que el t?tulo nunca caiga bajo el bot?n fijo.

## 6. Prohibiciones del contrato

- **Sin sombras decorativas:** la sombra es funcional (flotaci?n real: modal, toasts) y
  nada m?s.
- **Sin glassmorphism:** ni desenfoques ni transl?cidos; superficies opacas y reglas finas.
- **Rojo/verde solo sem?ntico:** exclusivos para deltas, errores y estados arriba/abajo;
  nunca como decoraci?n.
- **Sin est?tica HMI/SCADA:** rechazada expl?citamente; nada de ne?n, franjas de peligro ni
  pantallas de sala de control.

## 7. Procedencia de las capturas

| Archivo | Viewport | Generaci?n |
|---|---|---|
| `.impeccable/review/desktop.png` | 1440 x 900 | Chromium headless (Edge `--headless=new`), `--virtual-time-budget=8000`, URL `http://localhost:8091/?seed=1#/panel` |
| `.impeccable/review/mobile.png` | 390 x 844 | ?dem, `--window-size=390,844` |

Ambas regeneradas el 2026-09-03 tras el pulido final (normalizaci?n de precios en
`js/catalog.js`, toggle de tema fijo unificado en `css/app.css`, cach? `meridiano-v2`).
El par?metro `?seed=1` garantiza series demo deterministas y reproducibles.
