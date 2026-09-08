(function (global) {
  "use strict";

  function annualized(rets, weights) {
    const portRets = [];
    for (let i = 0; i < rets[0].length; i++) {
      let r = 0;
      for (let j = 0; j < weights.length; j++) r += weights[j] * rets[j][i];
      portRets.push(r);
    }
    const mu = Indicators.mean(portRets) * 252;
    const sigma = Indicators.stdev(portRets) * Math.sqrt(252);
    return { mu, sigma };
  }

  function frontier(assets, horizonReturns) {
    const n = assets.length;
    const points = [];
    const rets = horizonReturns;
    const mu = rets.map((r) => Indicators.mean(r) * 252);
    const best = { mu: null, sigma: null, weights: null };
    for (let step = 0; step <= 40; step++) {
      const target = step / 40;
      let weights = equalWeights(n);
      weights = tiltToTarget(weights, mu, target);
      const { mu: pmu, sigma: psigma } = annualized(rets, weights);
      points.push({ mu: pmu, sigma: psigma, weights: weights.slice() });
    }
    for (const p of points) {
      if (best.sigma === null || p.sigma < best.sigma) {
        best.sigma = p.sigma;
        best.mu = p.mu;
        best.weights = p.weights;
      }
    }
    return { points, minVar: best };
  }

  function equalWeights(n) {
    return new Array(n).fill(1 / n);
  }

  function tiltToTarget(weights, mu, target) {
    const minMu = Math.min(...mu), maxMu = Math.max(...mu);
    if (maxMu === minMu) return weights;
    const desired = minMu + target * (maxMu - minMu);
    const idx = mu.map((m, i) => [m, i]).sort((a, b) => a[0] - b[0]);
    const w = weights.slice();
    let sum = 0;
    for (let i = 0; i < w.length; i++) {
      w[i] = Math.max(0.01, w[i] * (1 + (mu[i] - desired) * 2));
      sum += w[i];
    }
    for (let i = 0; i < w.length; i++) w[i] /= sum;
    return w;
  }

  function suggest(portfolio, profile) {
    const lam = profile === "conservative" ? 0.5 : profile === "aggressive" ? 2 : 1;
    const total = portfolio.reduce((a, p) => a + p.value, 0);
    if (total === 0) return [];
    const scored = portfolio.map((p) => ({
      ticker: p.ticker,
      current: p.value / total,
      sharpe: p.sharpe || 0
    }));
    const maxS = Math.max(...scored.map((s) => s.sharpe), 0.01);
    const minS = Math.min(...scored.map((s) => s.sharpe), -0.01);
    const suggested = scored.map((s) => {
      const norm = (s.sharpe - minS) / (maxS - minS || 1);
      const w = Math.max(0.02, s.current * (0.6 + lam * 0.4 * norm));
      return { ticker: s.ticker, current: s.current, suggested: w };
    });
    const sum = suggested.reduce((a, s) => a + s.suggested, 0);
    for (const s of suggested) s.suggested /= sum;
    return suggested.sort((a, b) => b.suggested - a.suggested);
  }

  function rebalanceDrift(holdings, targets) {
    const total = holdings.reduce((a, h) => a + h.value, 0);
    return holdings
      .map((h) => {
        const current = h.value / total;
        const target = targets[h.ticker] ?? null;
        return {
          ticker: h.ticker,
          current,
          target,
          drift: target === null ? null : current - target
        };
      })
      .sort((a, b) => Math.abs(b.drift ?? 0) - Math.abs(a.drift ?? 0));
  }

  global.Optimizer = { frontier, suggest, rebalanceDrift };
})(window);
