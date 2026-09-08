(function (global) {
  "use strict";

  function sma(prices, n) {
    const out = new Array(prices.length).fill(null);
    let sum = 0;
    for (let i = 0; i < prices.length; i++) {
      sum += prices[i];
      if (i >= n) sum -= prices[i - n];
      if (i >= n - 1) out[i] = sum / n;
    }
    return out;
  }

  function ema(prices, n) {
    const out = new Array(prices.length).fill(null);
    const k = 2 / (n + 1);
    let prev = null;
    for (let i = 0; i < prices.length; i++) {
      if (i < n - 1) continue;
      if (prev === null) {
        let sum = 0;
        for (let j = i - n + 1; j <= i; j++) sum += prices[j];
        prev = sum / n;
      } else {
        prev = prices[i] * k + prev * (1 - k);
      }
      out[i] = prev;
    }
    return out;
  }

  function logReturns(prices) {
    const out = [];
    for (let i = 1; i < prices.length; i++) out.push(Math.log(prices[i] / prices[i - 1]));
    return out;
  }

  function rsi(prices, n = 14) {
    const out = new Array(prices.length).fill(null);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = Math.max(diff, 0);
      const loss = Math.max(-diff, 0);
      if (i <= n) {
        avgGain += gain / n;
        avgLoss += loss / n;
        if (i === n) out[i] = rsiFrom(avgGain, avgLoss);
      } else {
        avgGain = (avgGain * (n - 1) + gain) / n;
        avgLoss = (avgLoss * (n - 1) + loss) / n;
        out[i] = rsiFrom(avgGain, avgLoss);
      }
    }
    return out;
  }

  function rsiFrom(avgGain, avgLoss) {
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  function macd(prices, fast = 12, slow = 26, signal = 9) {
    const emaFast = ema(prices, fast);
    const emaSlow = ema(prices, slow);
    const line = prices.map((_, i) =>
      emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
    );
    const defined = line.filter((v) => v !== null);
    const sigDefined = ema(defined, signal);
    const sig = new Array(prices.length).fill(null);
    let d = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === null) continue;
      sig[i] = sigDefined[d];
      d++;
    }
    const hist = line.map((v, i) => (v !== null && sig[i] !== null ? v - sig[i] : null));
    return { line, signal: sig, hist };
  }

  function bollinger(prices, n = 20, k = 2) {
    const mid = sma(prices, n);
    const upper = new Array(prices.length).fill(null);
    const lower = new Array(prices.length).fill(null);
    for (let i = n - 1; i < prices.length; i++) {
      let variance = 0;
      for (let j = i - n + 1; j <= i; j++) variance += (prices[j] - mid[i]) ** 2;
      const sd = Math.sqrt(variance / n);
      upper[i] = mid[i] + k * sd;
      lower[i] = mid[i] - k * sd;
    }
    return { mid, upper, lower };
  }

  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function stdev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
  }

  function annualizedStats(prices) {
    const rets = logReturns(prices);
    const mu = mean(rets) * 252;
    const sigma = stdev(rets) * Math.sqrt(252);
    return { mu, sigma, rets };
  }

  function maxDrawdown(prices) {
    let peak = prices[0], mdd = 0;
    for (const p of prices) {
      if (p > peak) peak = p;
      const dd = (p - peak) / peak;
      if (dd < mdd) mdd = dd;
    }
    return mdd;
  }

  function sharpe(prices, rf = 0.03) {
    const { mu, sigma } = annualizedStats(prices);
    if (sigma === 0) return 0;
    return (mu - rf) / sigma;
  }

  function cagr(prices) {
    const years = prices.length / 252;
    if (years <= 0) return 0;
    return Math.pow(prices[prices.length - 1] / prices[0], 1 / years) - 1;
  }

  function var95(prices, horizonDays = 1) {
    const rets = logReturns(prices).slice(-504);
    if (rets.length < 30) return null;
    const scaled = rets.map((r) => r * Math.sqrt(horizonDays));
    const sorted = [...scaled].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.05);
    return sorted[idx];
  }

  function pct(n, digits = 2) {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    return (n * 100).toFixed(digits) + "%";
  }

  function fmtMoney(n, ccy = "USD") {
    if (n === null || n === undefined || !isFinite(n)) return "—";
    return new Intl.NumberFormat("es", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n);
  }

  function fmtCompact(n) {
    if (n === null || !isFinite(n)) return "—";
    return new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }

  function correlation(retsA, retsB) {
    const n = Math.min(retsA.length, retsB.length);
    if (n < 2) return 0;
    const a = retsA.slice(-n), b = retsB.slice(-n);
    const ma = mean(a), mb = mean(b);
    let cov = 0, va = 0, vb = 0;
    for (let i = 0; i < n; i++) {
      cov += (a[i] - ma) * (b[i] - mb);
      va += (a[i] - ma) ** 2;
      vb += (b[i] - mb) ** 2;
    }
    return va === 0 || vb === 0 ? 0 : cov / Math.sqrt(va * vb);
  }

  global.Indicators = {
    sma, ema, logReturns, rsi, macd, bollinger,
    mean, stdev, annualizedStats, maxDrawdown, sharpe, cagr, var95,
    correlation, pct, fmtMoney, fmtCompact
  };
})(window);
