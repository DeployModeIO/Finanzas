(function (global) {
  "use strict";

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussianPair(rnd) {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    const r = Math.sqrt(-2 * Math.log(u));
    return [r * Math.cos(2 * Math.PI * v), r * Math.sin(2 * Math.PI * v)];
  }

  function monteCarlo(prices, horizon, sims = 500) {
    const rets = Indicators.logReturns(prices);
    const recent = rets.slice(-504);
    const n = recent.length;
    const mu = recent.reduce((a, b) => a + b, 0) / n;
    const sigma = Math.sqrt(recent.reduce((a, b) => a + (b - mu) ** 2, 0) / (n - 1));
    const s0 = prices[prices.length - 1];
    const rnd = mulberry32(0x5eed ^ horizon ^ s0 * 1000);
    const finals = [];
    const pathsSample = [];
    const keepEvery = Math.max(1, Math.floor(sims / 12));
    for (let s = 0; s < sims; s++) {
      let logp = 0;
      const path = [];
      for (let d = 0; d < horizon; d++) {
        const [z] = s % 2 === 0 ? gaussianPair(rnd) : [gaussianPair(rnd)[1]];
        logp += mu - 0.5 * sigma * sigma + sigma * z;
        path.push(s0 * Math.exp(logp));
      }
      finals.push(s0 * Math.exp(logp));
      if (s % keepEvery === 0) pathsSample.push(path);
    }
    finals.sort((a, b) => a - b);
    const bands = [];
    for (let d = 0; d < horizon; d++) {
      const slice = [];
      for (const p of pathsSample) slice.push(p[d]);
      slice.sort((a, b) => a - b);
      const q = (p) => slice[Math.min(slice.length - 1, Math.floor(p * slice.length))];
      bands.push({ p10: q(0.1), p50: q(0.5), p90: q(0.9) });
    }
    const q = (p) => finals[Math.min(finals.length - 1, Math.floor(p * finals.length))];
    return {
      s0,
      bands,
      finals: { p10: q(0.1), p50: q(0.5), p90: q(0.9), mean: finals.reduce((a, b) => a + b, 0) / finals.length },
      probUp: finals.filter((f) => f > s0).length / finals.length,
      muDaily: mu,
      sigmaDaily: sigma
    };
  }

  function solveLinear(A, b) {
    const n = b.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      if (Math.abs(M[piv][col]) < 1e-12) continue;
      [M[col], M[piv]] = [M[piv], M[col]];
      const d = M[col][col];
      for (let c = col; c <= n; c++) M[col][c] /= d;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = M[r][col];
        if (f === 0) continue;
        for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
      }
    }
    return M.map((row) => row[n]);
  }

  function arLite(prices, horizon, p = 5) {
    const rets = Indicators.logReturns(prices);
    const rows = rets.length - p;
    if (rows < p * 6) return null;
    const X = [], y = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < p; j++) row.push(rets[i + j]);
      X.push(row);
      y.push(rets[i + p]);
    }
    const XtX = [], Xty = [];
    for (let i = 0; i < p; i++) {
      const rowX = [];
      for (let j = 0; j < p; j++) {
        let s = 0;
        for (let r = 0; r < rows; r++) s += X[r][i] * X[r][j];
        rowX.push(s);
      }
      let sy = 0;
      for (let r = 0; r < rows; r++) sy += X[r][i] * y[r];
      XtX.push(rowX);
      Xty.push(sy);
    }
    const coef = solveLinear(XtX, Xty);
    const hist = rets.slice(-p);
    const s0 = prices[prices.length - 1];
    const forecast = [];
    let logp = 0;
    for (let d = 0; d < horizon; d++) {
      let r = 0;
      for (let j = 0; j < p; j++) r += coef[j] * hist[hist.length - p + j];
      hist.push(r);
      logp += r;
      forecast.push(s0 * Math.exp(logp));
    }
    const resid = [];
    for (let r = 0; r < rows; r++) {
      let pred = 0;
      for (let j = 0; j < p; j++) pred += coef[j] * X[r][j];
      resid.push(y[r] - pred);
    }
    const sd = Math.sqrt(resid.reduce((a, b) => a + b * b, 0) / (resid.length - p));
    const bands = forecast.map((f, d) => {
      const w = sd * Math.sqrt(d + 1);
      return { p10: f * Math.exp(-1.2816 * w), p50: f, p90: f * Math.exp(1.2816 * w) };
    });
    return { forecast: bands, coef, residSd: sd };
  }

  function features(etf, prices) {
    const n = prices.length;
    const mom6m = n > 126 ? prices[n - 1] / prices[n - 126] - 1 : 0;
    const mom1m = n > 21 ? prices[n - 1] / prices[n - 21] - 1 : 0;
    const { sigma } = Indicators.annualizedStats(prices.slice(-252));
    const dd = Indicators.maxDrawdown(prices.slice(-252));
    const normTer = Math.min(etf.ter / 1.0, 1);
    const normAum = Math.log10(1 + etf.aum) / Math.log10(1 + 600000);
    return { mom6m, mom1m, vol: sigma, drawdown: dd, ter: normTer, aum: normAum };
  }

  function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  function logisticScore(etf, prices) {
    const f = features(etf, prices);
    const w = { mom6m: 1.15, mom1m: 0.45, vol: -1.6, drawdown: 0.9, ter: -0.5, aum: 0.35 };
    const contrib = {};
    let z = 0;
    for (const k of Object.keys(w)) {
      const c = w[k] * f[k];
      contrib[k] = c;
      z += c;
    }
    z += 0.18;
    const prob = sigmoid(z);
    return { prob, features: f, contributions: contrib, weights: w };
  }

  function qAgent(prices) {
    const rsiArr = Indicators.rsi(prices);
    const sma50 = Indicators.sma(prices, 50);
    const sma200 = Indicators.sma(prices, 200);
    const states = new Map();
    const Q = new Map();
    const ACTIONS = ["buy", "hold", "sell"];
    const key = (s) => s;
    const getQ = (s) => {
      if (!Q.has(s)) Q.set(s, [0, 0, 0]);
      return Q.get(s);
    };
    const stateOf = (i) => {
      const trend = sma200[i] === null ? 0 : prices[i] > sma200[i] ? 1 : -1;
      const r = rsiArr[i] ?? 50;
      const zone = r > 70 ? 1 : r < 30 ? -1 : 0;
      return `${trend}|${zone}`;
    };
    let pos = 0;
    const rnd = mulberry32(prices.length);
    for (let ep = 0; ep < 24; ep++) {
      pos = 0;
      let s = stateOf(201);
      for (let i = 202; i < prices.length - 1; i++) {
        states.set(s, true);
        const q = getQ(s);
        let aIdx;
        if (rnd() < 0.15) {
          aIdx = Math.floor(rnd() * 3);
        } else {
          aIdx = q.indexOf(Math.max(...q));
        }
        const ret = prices[i + 1] / prices[i] - 1;
        const reward = pos === 1 ? ret : pos === -1 ? -ret * 0.5 : 0;
        const tradeCost = ACTIONS[aIdx] !== "hold" ? 0.0002 : 0;
        const r2 = reward - tradeCost;
        if (ACTIONS[aIdx] === "buy") pos = 1;
        else if (ACTIONS[aIdx] === "sell") pos = -1;
        const sNext = stateOf(i + 1);
        const qNext = getQ(sNext);
        q[aIdx] += 0.1 * (r2 + 0.9 * Math.max(...qNext) - q[aIdx]);
        s = sNext;
      }
    }
    const cur = stateOf(prices.length - 1);
    const qCur = getQ(cur);
    const best = qCur.indexOf(Math.max(...qCur));
    let hits = 0, total = 0, agentVal = 1, buyHold = 1;
    pos = 0;
    for (let i = 202; i < prices.length; i++) {
      const s = stateOf(i);
      const qq = getQ(s);
      const act = qq.indexOf(Math.max(...qq));
      const ret = prices[i] / prices[i - 1] - 1;
      if (pos === 1) agentVal *= 1 + ret;
      if (pos === -1) agentVal *= 1 - ret * 0.5;
      if (act === 0) pos = 1;
      else if (act === 2) pos = -1;
      buyHold *= 1 + ret;
      if (Math.abs(ret) > 0.004) {
        const right = (ret > 0 && act !== 2) || (ret < 0 && act !== 0);
        if (right) hits++;
        total++;
      }
    }
    return {
      action: ACTIONS[best],
      confidence: sigmoid(qCur[best] * 2),
      q: qCur,
      states: [...states.keys()],
      accuracy: total > 0 ? hits / total : null,
      agentReturn: agentVal - 1,
      buyHoldReturn: buyHold - 1
    };
  }

  const LEXICON = {
    bullish: ["rises", "rise", "rally", "recovery", "optimism", "grows", "grow", "strong", "beat", "record", "high", "gains", "expansion", "rate cut", "stimulus", "surge", "surges", "gain", "upgrade", "outperform", "bullish", "soars", "soar", "jumps", "jump", "outlook"],
    bearish: ["falls", "fall", "drop", "drops", "decline", "crisis", "panic", "fear", "recession", "plunge", "plunges", "losses", "bankruptcy", "default", "rate hike", "inflation spike", "crash", "downgrade", "bearish", "slides", "slump", "weak", "tumbles", "tumble", "fears"]
  };

  function sentiment(text) {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return { score: 0, lines: [] };
    const results = lines.map((line) => {
      const low = line.toLowerCase();
      let bull = 0, bear = 0;
      for (const w of LEXICON.bullish) if (low.includes(w)) bull++;
      for (const w of LEXICON.bearish) if (low.includes(w)) bear++;
      const raw = bull + bear === 0 ? 0 : (bull - bear) / (bull + bear);
      return { text: line, score: raw, tag: raw > 0.2 ? "positive" : raw < -0.2 ? "negative" : "neutral" };
    });
    const score = results.reduce((a, b) => a + b.score, 0) / results.length;
    return { score, lines: results };
  }

  global.Predict = { monteCarlo, arLite, logisticScore, qAgent, sentiment, features };
})(window);
