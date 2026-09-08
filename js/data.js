(function (global) {
  "use strict";

  const DAYS = 756;

  const state = {
    series: new Map(),
    live: false,
    lastSync: null
  };

  function synth(etf) {
    return Catalog.generateSeries(etf, DAYS);
  }

  async function fetchLive(ticker, range = "3y") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=1d`;
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const json = await res.json();
      const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
      if (!Array.isArray(closes)) return null;
      const clean = closes.filter((n) => typeof n === "number" && isFinite(n));
      return clean.length > 60 ? clean.map((n) => Math.round(n * 100) / 100) : null;
    } catch {
      clearTimeout(timer);
      return null;
    }
  }

  async function getSeries(ticker) {
    if (state.series.has(ticker)) return state.series.get(ticker);
    const etf = Catalog.byTicker(ticker);
    if (!etf) return null;
    let series = state.live ? await fetchLive(ticker) : null;
    let isDemo = true;
    if (!series) {
      series = synth(etf);
    } else {
      isDemo = false;
    }
    const entry = { prices: series, demo: isDemo, etf };
    state.series.set(ticker, entry);
    if (!isDemo) updateLiveFlag();
    return entry;
  }

  let liveFlagUpdated = false;
  function updateLiveFlag() {
    if (liveFlagUpdated) return;
    liveFlagUpdated = true;
    state.live = true;
    document.dispatchEvent(new CustomEvent("mq:livedata"));
  }

  async function tryEnableLive() {
    const probe = await fetchLive("SPY", "1mo");
    if (probe) {
      state.live = true;
      state.series.clear();
      liveFlagUpdated = false;
    }
    return state.live;
  }

  function isLive() {
    return state.live;
  }

  function lastPrice(ticker) {
    const entry = state.series.get(ticker);
    return entry ? entry.prices[entry.prices.length - 1] : null;
  }

  function isDemo(ticker) {
    const entry = state.series.get(ticker);
    return entry ? entry.demo : true;
  }

  global.DataStore = { getSeries, tryEnableLive, isLive, lastPrice, isDemo, DAYS };
})(window);
