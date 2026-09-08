(function (global) {
  "use strict";

  const state = {
    positions: [],
    watchlist: [],
    targets: {},
    alerts: [],
    ranges: { panel: 252, detail: 252 },
    detailTicker: null,
    seriesCache: new Map(),
    portfolio: { total: 0, dayChange: 0, dayChangeValue: 0, ytd: 0, totalReturn: 0, holdings: [] }
  };

  const $ = (id) => document.getElementById(id);

  async function loadSeries(ticker) {
    if (state.seriesCache.has(ticker)) return state.seriesCache.get(ticker);
    const entry = await DataStore.getSeries(ticker);
    state.seriesCache.set(ticker, entry);
    updateModeFlag();
    return entry;
  }

  function updateModeFlag() {
    const demo = [...state.seriesCache.values()].some((s) => s.demo);
    const allDemo = [...state.seriesCache.values()].every((s) => s.demo);
    $("mode-dot").classList.toggle("live", !allDemo);
    $("mode-text").textContent = allDemo ? "Demo data (no API connection)" : "Market data + demo";
  }

  function priceAt(entry, daysAgo) {
    const p = entry.prices;
    const i = p.length - 1 - daysAgo;
    return p[Math.max(0, Math.min(p.length - 1, i))];
  }

  async function computePortfolio() {
    const holdings = [];
    for (const pos of state.positions) {
      const entry = await loadSeries(pos.ticker);
      const price = entry.prices[entry.prices.length - 1];
      const value = price * pos.qty;
      const cost = pos.price * pos.qty;
      holdings.push({
        id: pos.id,
        ticker: pos.ticker,
        name: Catalog.byTicker(pos.ticker)?.name || pos.ticker,
        qty: pos.qty,
        buyPrice: pos.price,
        price,
        value,
        cost,
        pl: value - cost,
        plPct: cost > 0 ? value / cost - 1 : 0,
        entry
      });
    }
    const total = holdings.reduce((a, h) => a + h.value, 0);
    const cost = holdings.reduce((a, h) => a + h.cost, 0);
    const prevValue = holdings.reduce((a, h) => a + priceAt(h.entry, 1) * h.qty, 0);
    const ytdBase = holdings.reduce((a, h) => a + priceAt(h.entry, 252) * h.qty, 0);
    state.portfolio = {
      total,
      holdings,
      dayChangeValue: total - prevValue,
      dayChange: prevValue > 0 ? total / prevValue - 1 : 0,
      ytd: ytdBase > 0 ? total / ytdBase - 1 : 0,
      totalReturn: cost > 0 ? total / cost - 1 : 0
    };
    return state.portfolio;
  }

  async function renderPanel() {
    const pf = await computePortfolio();
    UI.kpis(pf);
    const range = state.ranges.panel;
    await renderPortfolioChart(range);
    UI.positionsTable(
      "positions-table",
      state.positions,
      pf.holdings,
      "Add your first position with the 'Add position' button to see your portfolio here.",
      false
    );
    document.querySelectorAll("[data-edit-pos]").forEach((b) =>
      b.addEventListener("click", () => openEditModal(parseInt(b.dataset.editPos, 10)))
    );
    await renderAllocation(pf.holdings);
    await renderWatchMini();
  }

  async function renderPortfolioChart(range) {
    const pf = state.portfolio;
    if (!pf.holdings.length) {
      ChartsUI.render("chart-portfolio", emptyChartConfig());
      return;
    }
    const n = Math.min(range, Math.min(...pf.holdings.map((h) => h.entry.prices.length)));
    const labels = [];
    const data = [];
    for (let d = n - 1; d >= 0; d--) {
      let v = 0;
      for (const h of pf.holdings) v += h.entry.prices[h.entry.prices.length - 1 - d] * h.qty;
      data.push(Math.round(v * 100) / 100);
      labels.push(dateLabel(d));
    }
    const p = ChartsUI.palette();
    ChartsUI.render("chart-portfolio", {
      type: "line",
      data: {
        labels,
        datasets: [ChartsUI.lineDataset("Portfolio value", data, p.accent, { fill: true, width: 2.2 })]
      },
      options: {
        ...ChartsUI.baseOptions(p),
        plugins: {
          ...ChartsUI.baseOptions(p).plugins,
          legend: { display: false }
        }
      }
    });
  }

  function emptyChartConfig() {
    const p = ChartsUI.palette();
    return {
      type: "line",
      data: { labels: ["", "", "", ""], datasets: [{ data: [1, 1, 1, 1], borderColor: p.rule, pointRadius: 0 }] },
      options: { ...ChartsUI.baseOptions(p), plugins: { legend: { display: false } } }
    };
  }

  function dateLabel(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString("en", { day: "2-digit", month: "short", year: "2-digit" });
  }

  async function renderAllocation(holdings) {
    if (!holdings.length) {
      ChartsUI.destroy("chart-allocation");
      return;
    }
    const p = ChartsUI.palette();
    const shades = ["#1f6f43", "#4a8f66", "#7ab08d", "#a8cbb4", "#c9b98a", "#9a8f6b", "#6b7a8f", "#8a6b6b"];
    ChartsUI.render("chart-allocation", {
      type: "doughnut",
      data: {
        labels: holdings.map((h) => h.ticker),
        datasets: [
          {
            data: holdings.map((h) => Math.round(h.value * 100) / 100),
            backgroundColor: holdings.map((_, i) => shades[i % shades.length]),
            borderColor: p.surface,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "right", labels: { color: p.ink2, font: { family: p.mono, size: 11 }, boxWidth: 10 } },
          tooltip: {
            backgroundColor: p.surface, titleColor: p.ink, bodyColor: p.ink2, borderColor: p.rule, borderWidth: 1,
            bodyFont: { family: p.mono }, callbacks: { label: (c) => `${c.label}: ${Indicators.fmtMoney(c.parsed)}` }
          }
        }
      }
    });
  }

  async function renderWatchMini() {
    const rows = [];
    for (const t of state.watchlist.slice(0, 6)) {
      const entry = await loadSeries(t);
      const p = entry.prices;
      rows.push({ ticker: t, price: p[p.length - 1], chg: p[p.length - 1] / p[p.length - 2] - 1 });
    }
    UI.watchlistMini(rows);
  }

  function fillSelect(id, items, valueKey, labelFn, selected) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = items
      .map((it) => `<option value="${UI.esc(it[valueKey])}" ${it[valueKey] === selected ? "selected" : ""}>${labelFn(it)}</option>`)
      .join("");
  }

  async function renderEtfs() {
    const q = ($("etf-search").value || "").toLowerCase();
    const region = $("etf-region").value;
    const sector = $("etf-sector").value;
    const entries = [];
    for (const etf of Catalog.ETF_CATALOG) {
      if (q && !(etf.ticker.toLowerCase().includes(q) || etf.name.toLowerCase().includes(q))) continue;
      if (region && etf.region !== region) continue;
      if (sector && etf.sector !== sector) continue;
      const entry = await loadSeries(etf.ticker);
      const p = entry.prices;
      const n = Math.min(252, p.length - 1);
      entries.push({ etf, price: p[p.length - 1], ret1y: p[p.length - 1] / p[p.length - 1 - n] - 1, entry });
    }
    entries.sort((a, b) => b.ret1y - a.ret1y);
    UI.etfsTable(entries, true);
    document.querySelectorAll("#etfs-table [data-analyze]").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        showDetail(b.dataset.analyze);
      })
    );
    document.querySelectorAll("#etfs-table tr[data-etf]").forEach((tr) => {
      tr.addEventListener("click", () => showDetail(tr.dataset.etf));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter") showDetail(tr.dataset.etf);
      });
    });
  }

  async function showDetail(ticker) {
    state.detailTicker = ticker;
    const etf = Catalog.byTicker(ticker);
    const entry = await loadSeries(ticker);
    const p = entry.prices;
    const inWatch = state.watchlist.includes(ticker);
    $("etf-detail").hidden = false;
    $("detail-name").textContent = etf.name;
    $("detail-ticker").textContent = `${etf.ticker} · ${etf.region} · ${etf.sector} · ${DataStore.isDemo(ticker) ? "demo data" : "market data"}`;
    $("btn-detail-watch").textContent = inWatch ? "Remove from watchlist" : "Watchlist";
    UI.detailStats([
      { label: "Current price", value: Indicators.fmtMoney(p[p.length - 1]) },
      { label: "1-year return", value: Indicators.pct(p[p.length - 1] / p[Math.max(0, p.length - 252)] - 1) },
      { label: "Annualized volatility", value: Indicators.pct(Indicators.annualizedStats(p.slice(-252)).sigma) },
      { label: "Sharpe (rf 3%)", value: Indicators.sharpe(p.slice(-252)).toFixed(2) },
      { label: "Max drawdown (12m)", value: Indicators.pct(Indicators.maxDrawdown(p.slice(-252))) },
      { label: "TER", value: etf.ter.toFixed(2) + "%" },
      { label: "AUM", value: "$" + Indicators.fmtCompact(etf.aum) }
    ]);
    UI.rangeButtons("detail-range", [
      { d: 63, label: "3M" }, { d: 126, label: "6M" }, { d: 252, label: "1Y" }, { d: 504, label: "2Y" }, { d: 756, label: "3Y" }
    ], state.ranges.detail, (d) => { state.ranges.detail = d; showDetail(ticker); });
    renderIndicatorTabs(ticker);
    renderDetailChart(ticker, "precio");
    $("etf-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function busy(btn, label, fn) {
    return async (...args) => {
      if (btn.disabled) return;
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = label;
      try {
        await fn(...args);
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    };
  }

  function renderIndicatorTabs(ticker) {
    if (!state.detailIndicator) state.detailIndicator = "precio";
    const tabs = [
      { id: "precio", label: "Price" },
      { id: "sma", label: "MA 50/200" },
      { id: "bollinger", label: "Bollinger" },
      { id: "rsi", label: "RSI" },
      { id: "macd", label: "MACD" }
    ];
    const host = $("detail-indicators");
    host.innerHTML = tabs
      .map((t) => `<button class="tab-btn" type="button" data-ind="${t.id}" aria-pressed="${t.id === state.detailIndicator}">${t.label}</button>`)
      .join("");
    host.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        state.detailIndicator = b.dataset.ind;
        renderIndicatorTabs(ticker);
        renderDetailChart(ticker, b.dataset.ind);
      })
    );
  }

  async function renderDetailChart(ticker, indicator) {
    const entry = await loadSeries(ticker);
    const p = entry.prices;
    const n = Math.min(state.ranges.detail, p.length);
    const start = p.length - n;
    const labels = [];
    for (let i = start; i < p.length; i++) labels.push(dateLabel(p.length - 1 - i));
    const p2 = ChartsUI.palette();
    const datasets = [];
    const baseOpt = ChartsUI.baseOptions(p2);
    if (indicator === "precio") {
      datasets.push(ChartsUI.lineDataset("Price", p.slice(start), p2.accent, { fill: true, width: 2.2 }));
    } else if (indicator === "sma") {
      datasets.push(ChartsUI.lineDataset("Price", p.slice(start), p2.accent, { width: 1.6 }));
      datasets.push(ChartsUI.lineDataset("SMA 50", Indicators.sma(p, 50).slice(start), p2.ink3, { width: 1.2 }));
      datasets.push(ChartsUI.lineDataset("SMA 200", Indicators.sma(p, 200).slice(start), p2.up, { width: 1.2 }));
    } else if (indicator === "bollinger") {
      const bb = Indicators.bollinger(p);
      datasets.push(ChartsUI.lineDataset("Price", p.slice(start), p2.accent, { width: 1.6 }));
      datasets.push(ChartsUI.lineDataset("Upper 20±2σ", bb.upper.slice(start), p2.ink3, { dash: [4, 4], width: 1 }));
      datasets.push(ChartsUI.lineDataset("Lower 20±2σ", bb.lower.slice(start), p2.ink3, { dash: [4, 4], width: 1 }));
    } else if (indicator === "rsi") {
      const r = Indicators.rsi(p);
      datasets.push(ChartsUI.lineDataset("RSI 14", r.slice(start), p2.accent, { width: 1.8 }));
      datasets.push(ChartsUI.lineDataset("Overbought 70", new Array(n).fill(70), p2.down, { dash: [4, 4], width: 1 }));
      datasets.push(ChartsUI.lineDataset("Oversold 30", new Array(n).fill(30), p2.up, { dash: [4, 4], width: 1 }));
      baseOpt.scales.y.min = 0;
      baseOpt.scales.y.max = 100;
    } else if (indicator === "macd") {
      const m = Indicators.macd(p);
      datasets.push(ChartsUI.lineDataset("MACD", m.line.slice(start), p2.accent, { width: 1.6 }));
      datasets.push(ChartsUI.lineDataset("Signal", m.signal.slice(start), p2.down, { width: 1.2 }));
      datasets.push(ChartsUI.lineDataset("Histogram", m.hist.slice(start), p2.ink3, { width: 1 }));
      const zero = new Array(n).fill(0);
      datasets.push(ChartsUI.lineDataset("Zero", zero, p2.rule, { dash: [2, 4], width: 1 }));
    }
    ChartsUI.render("chart-detail", {
      type: "line",
      data: { labels, datasets },
      options: { ...baseOpt, plugins: { ...baseOpt.plugins, legend: { display: indicator !== "precio" } } }
    });
  }

  async function renderCartera() {
    const pf = await computePortfolio();
    UI.positionsTable(
      "cartera-table",
      state.positions,
      pf.holdings,
      "Add positions from 'Add position' to calculate P&L, risk and rebalancing.",
      true
    );
    document.querySelectorAll("[data-edit-pos]").forEach((b) =>
      b.addEventListener("click", () => openEditModal(parseInt(b.dataset.editPos, 10)))
    );
    renderRisk(pf.holdings);
    await renderRebalance(pf.holdings);
  }

  function renderRisk(holdings) {
    if (!holdings.length) {
      UI.statsList("portfolio-risk", [{ label: "Risk", value: "—" }]);
      return;
    }
    const total = holdings.reduce((a, h) => a + h.value, 0);
    const weights = holdings.map((h) => h.value / total);
    const vol = holdings.reduce((a, h, i) => a + weights[i] * Indicators.annualizedStats(h.entry.prices.slice(-252)).sigma, 0);
    const rets = holdings.map((h) => Indicators.logReturns(h.entry.prices.slice(-252)));
    let portRets = new Array(rets[0].length).fill(0);
    rets.forEach((r, i) => { for (let d = 0; d < r.length; d++) portRets[d] += weights[i] * r[d]; });
    const series = portRets.reduce((acc, r) => { acc.push(acc[acc.length - 1] * Math.exp(r)); return acc; }, [1]);
    const corrAvg =
      holdings.length > 1
        ? rets.reduce((acc, r, i) => acc + (rets.slice(i + 1).reduce((a, r2) => a + Indicators.correlation(r, r2), 0) || 0), 0) /
          ((holdings.length * (holdings.length - 1)) / 2 || 1)
        : 1;
    UI.statsList("portfolio-risk", [
      { label: "Weighted volatility", value: Indicators.pct(vol) },
      { label: "Portfolio Sharpe (rf 3%)", value: Indicators.sharpe(series).toFixed(2) },
      { label: "Max drawdown", value: Indicators.pct(Indicators.maxDrawdown(series)) },
      { label: "Daily VaR 95%", value: Indicators.pct(Indicators.var95(series, 1), 2) },
      { label: "Average correlation between positions", value: holdings.length > 1 ? corrAvg.toFixed(2) : "—" },
      { label: "Portfolio CAGR", value: Indicators.pct(Indicators.cagr(series)) }
    ]);
  }

  async function renderRebalance(holdings) {
    const targets = await Portfolio.getMeta("targets", {});
    const withSharpe = holdings.map((h) => ({ ...h, sharpe: Indicators.sharpe(h.entry.prices.slice(-252)) }));
    const hasTargets = Object.keys(targets).length > 0 && holdings.some((h) => targets[h.ticker] != null);
    if (!hasTargets) {
      const sug = Optimizer.suggest(withSharpe, "balanced");
      UI.rebalanceBox(sug.map((s) => ({ ticker: s.ticker, current: s.current, target: s.current, drift: s.suggested - s.current })));
      const host = $("rebalance-box");
      const note = document.createElement("p");
      note.style.cssText = "font-size:12.5px;color:var(--ink-3);margin-top:14px";
      note.textContent = "Provisional Sharpe-based suggestion (no targets defined). Click 'Target weights' to set your allocation.";
      host.appendChild(note);
      return;
    }
    const rows = Optimizer.rebalanceDrift(withSharpe, targets);
    UI.rebalanceBox(rows);
  }

  async function renderOptimizador() {
    const sel = $("opt-universe");
    sel.innerHTML = Catalog.ETF_CATALOG.map((e) => `<option value="${e.ticker}">${e.ticker} · ${UI.esc(e.name)}</option>`).join("");
    const saved = await Portfolio.getMeta("optUniverse", ["VT", "QQQ", "VEA", "AGG", "GLD"]);
    [...sel.options].forEach((o) => { if (saved.includes(o.value)) o.selected = true; });
  }

  async function runOptimize() {
    const sel = $("opt-universe");
    const tickers = [...sel.selectedOptions].map((o) => o.value);
    if (tickers.length < 2) {
      UI.toast("Select at least 2 ETFs from the universe", true);
      return;
    }
    await Portfolio.setMeta("optUniverse", tickers);
    const entries = [];
    for (const t of tickers) entries.push({ ticker: t, entry: await loadSeries(t) });
    const minLen = Math.min(...entries.map((e) => e.entry.prices.length));
    const rets = entries.map((e) => Indicators.logReturns(e.entry.prices.slice(-Math.min(504, minLen))));
    const horizon = Math.min(...rets.map((r) => r.length));
    const aligned = rets.map((r) => r.slice(-horizon));
    const profile = parseFloat($("opt-profile").value);
    const f = Optimizer.frontier(entries, aligned);
    const points = f.points;
    const chosen = points.reduce((best, pt) => {
      const utility = pt.mu - (1 / (2 * profile)) * pt.sigma * pt.sigma;
      return !best || utility > best.utility ? { ...pt, utility } : best;
    }, null);
    const p = ChartsUI.palette();
    ChartsUI.render("chart-frontier", {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Frontier",
            data: points.map((pt) => ({ x: pt.sigma * 100, y: pt.mu * 100 })),
            borderColor: p.accent,
            showLine: true,
            pointRadius: 0,
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: "Suggested (profile)",
            data: [{ x: chosen.sigma * 100, y: chosen.mu * 100 }],
            backgroundColor: p.down,
            pointRadius: 6,
            pointStyle: "rectRot"
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: p.ink2, font: { family: p.mono, size: 11 } } } },
        scales: {
          x: { title: { display: true, text: "Annual volatility (%)", color: p.ink3, font: { size: 11 } }, ticks: { color: p.ink3, font: { family: p.mono, size: 10 } }, grid: { color: "transparent" }, border: { color: p.rule } },
          y: { title: { display: true, text: "Annual return (%)", color: p.ink3, font: { size: 11 } }, ticks: { color: p.ink3, font: { family: p.mono, size: 10 } }, grid: { color: p.rule }, border: { color: p.rule } }
        }
      }
    });
    UI.weightsList("opt-weights", chosen.weights.map((w, i) => ({ ticker: entries[i].ticker, w })));
    await Portfolio.setMeta("suggestedWeights", Object.fromEntries(chosen.weights.map((w, i) => [entries[i].ticker, w])));
    $("optim-result").hidden = false;
    $("optim-empty").hidden = true;
  }

  async function renderPrediccion() {
    fillSelect("pred-etf", Catalog.ETF_CATALOG, "ticker", (e) => `${e.ticker} · ${e.name}`, state.positions[0]?.ticker || "VT");
  }

  async function runPredict() {
    const ticker = $("pred-etf").value;
    const horizon = parseInt($("pred-horizon").value, 10);
    const entry = await loadSeries(ticker);
    const prices = entry.prices;
    const mc = Predict.monteCarlo(prices, horizon, 500);
    const ar = Predict.arLite(prices, horizon, 5);
    const etf = Catalog.byTicker(ticker);
    const p = ChartsUI.palette();
    const histN = Math.min(126, prices.length);
    const labels = [];
    for (let i = prices.length - histN; i < prices.length; i++) labels.push(dateLabel(prices.length - 1 - i));
    for (let d = 1; d <= horizon; d++) labels.push("+" + d + "d");
    const pad = new Array(histN - 1).fill(null);
    const p50 = [...pad, prices[prices.length - 1], ...mc.bands.map((b) => b.p50)];
    const p10 = [...pad, prices[prices.length - 1], ...mc.bands.map((b) => b.p10)];
    const p90 = [...pad, prices[prices.length - 1], ...mc.bands.map((b) => b.p90)];
    const arLine = [...pad, prices[prices.length - 1], ...(ar ? ar.forecast.map((b) => b.p50) : [])];
    const hist = [...pad, ...prices.slice(-histN)];
    const datasets = [
      {
        label: "P90-P10 band",
        data: p90,
        backgroundColor: p.accent + "1c",
        borderColor: "transparent",
        pointRadius: 0,
        fill: 2,
        tension: 0.25
      },
      ChartsUI.lineDataset("P50 (Monte Carlo median)", p50, p.accent, { dash: [6, 4], width: 1.6 }),
      ChartsUI.lineDataset("P10", p10, "transparent", { width: 0.1 }),
      ChartsUI.lineDataset("AR-lite trend", arLine, p.ink3, { dash: [2, 4], width: 1.2 }),
      ChartsUI.lineDataset("Historical", hist, p.ink, { width: 2 })
    ];
    ChartsUI.render("chart-forecast", {
      type: "line",
      data: { labels, datasets },
      options: { ...ChartsUI.baseOptions(p), plugins: { ...ChartsUI.baseOptions(p).plugins, legend: { display: true } } }
    });
    UI.statsList("pred-stats", [
      { label: "Current price", value: Indicators.fmtMoney(mc.s0), hint: DataStore.isDemo(ticker) ? "demo" : "market" },
      { label: `P10 at ${horizon}d (pessimistic scenario)`, value: Indicators.fmtMoney(mc.finals.p10) },
      { label: `P50 at ${horizon}d (median)`, value: Indicators.fmtMoney(mc.finals.p50) },
      { label: `P90 at ${horizon}d (optimistic)`, value: Indicators.fmtMoney(mc.finals.p90) },
      { label: "Probability of ending above current price", value: Indicators.pct(mc.probUp, 1) }
    ]);
    const rl = Predict.qAgent(prices);
    UI.rlSignal("rl-signal", rl);
    const ml = Predict.logisticScore(etf, prices);
    UI.mlScore("ml-score", ml, "the S&P 500");
  }

  async function renderAlertas() {
    const alerts = await Portfolio.getMeta("alerts", []);
    state.alerts = alerts;
    UI.alertsList(alerts, (t) => {
      const e = state.seriesCache.get(t);
      return e ? e.prices[e.prices.length - 1] : null;
    }, async (id) => {
      const rest = state.alerts.filter((a) => a.id !== id);
      await Portfolio.setMeta("alerts", rest);
      UI.toast("Alert deleted");
      renderAlertas();
    });
    document.querySelectorAll("[data-del-alert]").forEach((b) =>
      b.addEventListener("click", async () => {
        const rest = state.alerts.filter((a) => a.id !== parseInt(b.dataset.delAlert, 10));
        await Portfolio.setMeta("alerts", rest);
        UI.toast("Alert deleted");
        renderAlertas();
      })
    );
  }

  async function renderInforme() {
    const pf = await computePortfolio();
    const rows = pf.holdings.length
      ? pf.holdings.map((h) => ({ label: `${h.ticker} · ${h.qty} units`, value: Indicators.fmtMoney(h.value) }))
      : [{ label: "Portfolio", value: "empty" }];
    UI.reportPreview($("report-preview"), [
      { title: "Summary", rows: [
        { label: "Total value", value: Indicators.fmtMoney(pf.total) },
        { label: "Total return", value: Indicators.pct(pf.totalReturn) },
        { label: "Daily change", value: Indicators.pct(pf.dayChange) },
        { label: "Date", value: new Date().toLocaleDateString("en") }
      ]},
      { title: "Positions", rows },
      { title: "Models", html: `<p style="color:var(--ink-3);font-size:12.5px;margin:0">The PDF report includes portfolio risk and a Monte Carlo projection of the first ETF in the portfolio or VT. ${DataStore.isLive() && !DataStore.isDemo("VT") ? "Market" : "Demo"} data.</p>` }
    ]);
    $("report-hint").textContent = pf.holdings.length ? `${pf.holdings.length} positions` : "no positions";
  }

  async function generatePdf() {
    if (typeof window.jspdf === "undefined") {
      UI.toast("jsPDF not available (offline). Retry with a connection.", true);
      return;
    }
    const pf = await computePortfolio();
    const doc = new window.jspdf.jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("Meridiano · Portfolio report", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("en") + " · " + (DataStore.isLive() ? "market data" : "demo data"), 14, y); y += 10;
    doc.setFontSize(12);
    doc.text("Summary", 14, y); y += 7;
    doc.setFontSize(10);
    const lines = [
      `Total value: ${Indicators.fmtMoney(pf.total)}`,
      `Total return: ${Indicators.pct(pf.totalReturn)}`,
      `Daily change: ${Indicators.pct(pf.dayChange)}`,
      `YTD: ${Indicators.pct(pf.ytd)}`
    ];
    for (const l of lines) { doc.text(l, 14, y); y += 6; }
    y += 4;
    doc.setFontSize(12);
    doc.text("Positions", 14, y); y += 7;
    doc.setFontSize(10);
    for (const h of pf.holdings) {
      doc.text(`${h.ticker}  ${h.qty} units · buy ${Indicators.fmtMoney(h.buyPrice)} · current ${Indicators.fmtMoney(h.price)} · P&L ${Indicators.fmtMoney(h.pl)}`, 14, y);
      y += 6;
      if (y > 275) { doc.addPage(); y = 20; }
    }
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Educational models (Monte Carlo, AR-lite, Q-agent). This does not constitute financial advice.", 14, y);
    doc.save("meridiano-report.pdf");
    UI.toast("PDF report generated");
  }

  function openModal(id) {
    $(id).classList.add("open");
    const first = $(id).querySelector("input, select, button");
    if (first) first.focus();
  }

  function closeModals() {
    document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
  }

  async function openPositionModal(ticker) {
    fillSelect("pos-etf", Catalog.ETF_CATALOG, "ticker", (e) => `${e.ticker} · ${e.name}`, ticker);
    const entry = ticker ? await loadSeries(ticker) : null;
    if (entry) {
      const p = entry.prices;
      $("pos-price").value = p[p.length - 1];
    }
    $("pos-date").value = new Date().toISOString().slice(0, 10);
    $("pos-error").textContent = "";
    openModal("modal-position");
  }

  async function openEditModal(id) {
    const pos = state.positions.find((p) => p.id === id);
    if (!pos) return;
    state.editingId = id;
    $("edit-qty").value = pos.qty;
    $("edit-price").value = pos.price;
    $("edit-error").textContent = "";
    openModal("modal-edit");
  }

  async function openTargetsModal() {
    const pf = state.portfolio;
    const host = $("targets-fields");
    if (!pf.holdings.length) {
      UI.toast("Add positions before setting targets", true);
      return;
    }
    const targets = await Portfolio.getMeta("targets", {});
    host.innerHTML = pf.holdings
      .map(
        (h) => `<div class="weight-row" style="grid-template-columns:70px 1fr 80px">
      <span class="num ticker">${UI.esc(h.ticker)}</span>
      <div class="weight-bar"><i style="width:${Math.round((targets[h.ticker] ?? h.value / pf.total) * 100)}%"></i></div>
      <input type="number" min="0" max="100" step="1" data-target="${UI.esc(h.ticker)}" value="${Math.round((targets[h.ticker] ?? h.value / pf.total) * 100)}" aria-label="Target ${UI.esc(h.ticker)}" />
    </div>`
      )
      .join("");
    openModal("modal-targets");
  }

  function route() {
    const hash = location.hash.replace("#/", "") || "panel";
    const views = ["panel", "etfs", "cartera", "optimizador", "prediccion", "alertas", "informe"];
    const view = views.includes(hash) ? hash : "panel";
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const el = $("view-" + view);
    if (el) el.classList.add("active");
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.getAttribute("href") === "#/" + view) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const loaders = {
      panel: renderPanel, etfs: renderEtfs, cartera: renderCartera,
      optimizador: renderOptimizador, prediccion: renderPrediccion,
      alertas: renderAlertas, informe: renderInforme
    };
    (loaders[view] || renderPanel)();
    window.scrollTo(0, 0);
  }

  function initTheme() {
    const apply = (theme) => {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem("mq-theme", theme);
      $("theme-label").textContent = theme === "dark" ? "Light" : "Dark";
      $("theme-icon").innerHTML =
        theme === "dark"
          ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
          : '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>';
    };
    apply(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    $("theme-toggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      apply(next);
      ChartsUI.destroyAll();
      route();
    });
  }

  function bind() {
    window.addEventListener("hashchange", route);
    document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModals));
    document.querySelectorAll(".modal-backdrop").forEach((m) =>
      m.addEventListener("click", (e) => { if (e.target === m) closeModals(); })
    );
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

    $("btn-add-position").addEventListener("click", () => openPositionModal());
    $("btn-add-position-2").addEventListener("click", () => openPositionModal());
    $("btn-targets").addEventListener("click", openTargetsModal);
    $("btn-add-alert").addEventListener("click", async () => {
      fillSelect("alert-etf", Catalog.ETF_CATALOG, "ticker", (e) => `${e.ticker} · ${e.name}`);
      $("alert-error").textContent = "";
      openModal("modal-alert");
    });
    $("btn-detail-add").addEventListener("click", () => openPositionModal(state.detailTicker));
    $("btn-detail-watch").addEventListener("click", async () => {
      const t = state.detailTicker;
      if (state.watchlist.includes(t)) state.watchlist = state.watchlist.filter((w) => w !== t);
      else state.watchlist.push(t);
      await Portfolio.setMeta("watchlist", state.watchlist);
      showDetail(t);
      UI.toast(state.watchlist.includes(t) ? "Added to watchlist" : "Removed from watchlist");
    });

    $("form-position").addEventListener("submit", async (e) => {
      e.preventDefault();
      const ticker = $("pos-etf").value;
      const qty = parseFloat($("pos-qty").value);
      const price = parseFloat($("pos-price").value);
      const date = $("pos-date").value;
      if (!ticker || !(qty > 0) || !(price >= 0) || !date) {
        $("pos-error").textContent = "Check the fields: quantity and price must be positive.";
        return;
      }
      await Portfolio.addPosition({ ticker, qty, price, date });
      closeModals();
      UI.toast(`Position added: ${qty} × ${ticker}`);
      if (location.hash.includes("cartera")) renderCartera();
      else renderPanel();
    });

    $("form-edit").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pos = state.positions.find((p) => p.id === state.editingId);
      const qty = parseFloat($("edit-qty").value);
      const price = parseFloat($("edit-price").value);
      if (!(qty > 0) || !(price >= 0)) {
        $("edit-error").textContent = "Quantity and price must be positive.";
        return;
      }
      pos.qty = qty;
      pos.price = price;
      await Portfolio.updatePosition(pos);
      closeModals();
      UI.toast("Position updated");
      renderCartera();
    });

    $("btn-delete-position").addEventListener("click", async () => {
      await Portfolio.deletePosition(state.editingId);
      closeModals();
      UI.toast("Position deleted");
      renderCartera();
    });

    $("form-targets").addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = document.querySelectorAll("[data-target]");
      const targets = {};
      let sum = 0;
      inputs.forEach((i) => { sum += parseFloat(i.value) || 0; });
      if (Math.round(sum) !== 100) {
        $("targets-error").textContent = `Targets add up to ${sum.toFixed(0)}% · must add up to 100%.`;
        return;
      }
      inputs.forEach((i) => { targets[i.dataset.target] = (parseFloat(i.value) || 0) / 100; });
      await Portfolio.setMeta("targets", targets);
      closeModals();
      UI.toast("Targets saved");
      renderCartera();
    });

    $("form-alert").addEventListener("submit", async (e) => {
      e.preventDefault();
      const ticker = $("alert-etf").value;
      const price = parseFloat($("alert-price").value);
      if (!(price > 0)) {
        $("alert-error").textContent = "Target price must be greater than zero.";
        return;
      }
      const entry = await loadSeries(ticker);
      const current = entry.prices[entry.prices.length - 1];
      const alerts = await Portfolio.getMeta("alerts", []);
      alerts.push({ id: Date.now(), ticker, price, dir: price >= current ? "above" : "below" });
      await Portfolio.setMeta("alerts", alerts);
      closeModals();
      UI.toast(`Alert created for ${ticker}`);
      renderAlertas();
    });

    $("etf-search").addEventListener("input", renderEtfs);
    $("etf-region").addEventListener("change", renderEtfs);
    $("etf-sector").addEventListener("change", renderEtfs);
    $("btn-optimize").addEventListener("click", busy($("btn-optimize"), "Optimizing…", runOptimize));
    $("btn-apply-weights").addEventListener("click", async () => {
      const w = await Portfolio.getMeta("suggestedWeights", {});
      await Portfolio.setMeta("targets", w);
      UI.toast("Suggested allocation saved as target");
    });
    $("btn-predict").addEventListener("click", busy($("btn-predict"), "Projecting…", runPredict));
    $("btn-pdf").addEventListener("click", busy($("btn-pdf"), "Generating…", generatePdf));
    $("form-sentiment").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("sent-input").value;
      if (!text.trim()) return;
      UI.sentimentResult($("sent-result"), Predict.sentiment(text));
    });

    UI.rangeButtons("panel-range", [
      { d: 63, label: "3M" }, { d: 126, label: "6M" }, { d: 252, label: "1Y" }, { d: 504, label: "2Y" }, { d: 756, label: "3Y" }
    ], state.ranges.panel, (d) => { state.ranges.panel = d; renderPanel(); });
  }

  let lastUserId = null;
  function initAuthSync() {
    if (!global.Auth) return;
    global.Auth.onAuthChange(async () => {
      const uid = global.Auth.userId() || null;
      if (uid === lastUserId) return;
      lastUserId = uid;
      state.positions = await Portfolio.getPositions();
      state.watchlist = await Portfolio.getMeta("watchlist", []);
      state.seriesCache.clear();
      route();
    });
  }

  async function init() {
    initTheme();
    bind();
    initAuthSync();
    if (global.Auth) global.Auth.init();
    $("etf-region").innerHTML =
      '<option value="">All</option>' +
      Catalog.regions().map((r) => `<option value="${UI.esc(r)}">${UI.esc(r)}</option>`).join("");
    $("etf-sector").innerHTML =
      '<option value="">All</option>' +
      Catalog.sectors().map((s) => `<option value="${UI.esc(s)}">${UI.esc(s)}</option>`).join("");
    state.positions = await Portfolio.getPositions();
    state.watchlist = await Portfolio.getMeta("watchlist", []);
    if (new URLSearchParams(location.search).has("seed")) {
      state.positions = [
        { id: 9001, ticker: "VT", qty: 40, price: 96.5, date: "2024-03-12" },
        { id: 9002, ticker: "QQQ", qty: 18, price: 380.2, date: "2024-06-03" },
        { id: 9003, ticker: "VEA", qty: 120, price: 44.1, date: "2024-09-20" },
        { id: 9004, ticker: "AGG", qty: 60, price: 97.8, date: "2025-01-15" }
      ];
      state.watchlist = ["GLD", "EEM", "SCHD"];
      state.positions.forEach((p) => (p.seeded = true));
    }
    route();
    const live = await DataStore.tryEnableLive();
    if (live) {
      state.seriesCache.clear();
      updateModeFlag();
      route();
    } else {
      updateModeFlag();
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  global.App = { state, loadSeries };
})(window);
