# Meridiano · Global ETF Analyzer

A Progressive Web App (PWA) for **simulating and tracking global ETF investments** with educational market analysis tools. Built with a clean dark/light design following the impeccable skill standards (Operate mode, "patient investor's ledger" direction).

> **Important**: This is a simulation and educational tool. It does **not** execute real trades, manage actual money, or provide investment advice. It helps investors practice, analyze, and prepare decisions — but is not for real investing.

[![Open in GitHub](https://img.shields.io/badge/Open%20in-GitHub-blue?logo=github)](https://github.com/DeployModeIO/Finanzas)
[![PWA](https://img.shields.io/badge/PWA-Ready-169ca1?logo=service-worker&color=169ca1)](https://github.com/DeployModeIO/Finanzas)

## Live Demo

👉 **Try it now**: https://finanzas-eta-amber.vercel.app/

## Preview

Serve the folder with any static server (recommended for service worker):

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`. Without a server, it also works by opening `index.html` directly (no offline mode or live data).

## Screenshots

### Desktop Dashboard

![Desktop view](docs/assets/desktop.png)

The full desktop experience with the navigation rail, KPI ledger, and portfolio overview.

### Mobile View

![Mobile view](docs/assets/mobile.png)

Responsive design adapts to mobile screens with a horizontal navigation bar.

## Features

- **Dashboard** — Simulated KPIs (value, day, YTD, total return), portfolio evolution, positions with P&L, allocation (donut) and tracking list.
- **ETFs** — Catalog of 40 global ETFs with search and filters by region/sector; detail with price, 50/200 moving averages, Bollinger Bands, RSI, MACD, Sharpe, drawdown, TER and AUM.
- **Portfolio** — Editable simulated positions (IndexedDB), aggregate risk (volatility, Sharpe, drawdown, VaR 95%, mean correlation, CAGR) and rebalancing against target weights.
- **Optimizer** — Mean-variance efficient frontier and suggested allocation by profile (conservative / balanced / aggressive).
- **Prediction** — Educational models extracted from GitHub projects:
  - *Monte Carlo (GBM)* and *AR-lite* P10/P50/P90 bands — essence of `huseinzol05/Stock-Prediction-Models`.
  - *Quantitative score* (momentum, volatility, drawdown, TER → probability of beating S&P 500 in 12 months) — essence of `robertmartin8/MachineLearningStocks`.
  - *Q-learning agent* (buy / hold / sell with backtest) — essence of `AI4Finance-Foundation/FinRL` and `austin-starks/Deep-RL-Stocks`.
  - *Headline sentiment* via local NLP lexicon — essence of `shirosaidev/stocksight`.
- **Alerts** — Target price per ETF with cross above/below detection.
- **Report** — PDF export (jsPDF) with summary, positions and disclaimer.

## Data

- Fetches real daily prices from Yahoo Finance (3 years, no API key) for analysis purposes only.
- If the API is not available (CORS/offline), it generates **deterministic demo series** by ticker and indicates it at all times ("demo" badge and flag on the rail).
- Predictive models are educational and **do not constitute financial advice**.

## Structure

```
index.html            App (single SPA by hash)
css/tokens.css        Light/dark tokens
css/app.css           Layout and components
js/catalog.js         ETF universe + deterministic demo generator
js/data.js            Yahoo Finance with demo fallback
js/indicators.js      SMA, EMA, RSI, MACD, Bollinger, Sharpe, VaR, drawdown
js/predict.js         Monte Carlo, AR-lite, logistic score, Q-agent, sentiment
js/portfolio.js       IndexedDB + remote sync (positions and metadata)
js/optimizer.js       Mean-variance frontier, suggestions and rebalancing drift
js/charts.js          Themed Chart.js configuration
js/ui.js              Rendering of tables, KPIs and states
js/auth.js            Clerk auth (login + session)
js/app.js             Controller (routes, modals, theme, actions)
api/config.js         Vercel function: exposes Clerk publishable key
api/data.js           Vercel function: positions + meta CRUD (Neon)
sw.js                 Service worker offline-first
```

## Shortcuts

- `Esc` closes modals · tables and rows are keyboard navigable · theme is remembered in `localStorage` and by default follows the system.

## Disclaimer

**This is an educational simulation tool, not a real investment platform.** It does not:
- Execute real trades or manage actual money
- Provide financial advice or investment recommendations
- Guarantee returns or predict market performance

This tool helps investors practice analysis, track simulated positions, and prepare investment decisions. Always conduct your own research and consult with a qualified financial advisor before making real investment decisions.

## Backend & Authentication (optional)

By default the app works in **guest mode**: everything is stored locally in IndexedDB / localStorage. No login, no server.

To enable **login + cross-device sync**, the app can use a serverless backend on Vercel with Clerk (auth) and Neon (Postgres):

- **Vercel Functions** — `api/config.js` and `api/data.js`
- **Clerk** — authentication (email, Google, GitHub, etc.)
- **Neon** — serverless Postgres (stores positions and metadata per user)

### Setup

1. **Clerk** (https://clerk.com): create an application and copy:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
2. **Neon** (https://neon.tech): create a project and copy the pooled connection string:
   - `DATABASE_URL` (e.g. `postgresql://...`)
3. **Vercel** (your project → Settings → Environment Variables): add the three variables above.
4. Redeploy. A **Sign in** button appears in the sidebar. When signed in, the portfolio, watchlist, targets and alerts sync to Neon and follow the user across devices. Signed out, it falls back to local storage.

The database schema is created automatically on the first request (`positions` and `user_meta` tables).

> Note: the publishable key is exposed via `GET /api/config` at runtime (publishable keys are safe to expose). Never expose `CLERK_SECRET_KEY` or `DATABASE_URL` client-side.

## License

MIT