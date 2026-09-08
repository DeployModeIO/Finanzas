(function (global) {
  "use strict";

  let charts = [];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function palette() {
    return {
      ink: cssVar("--ink"),
      ink2: cssVar("--ink-2"),
      ink3: cssVar("--ink-3"),
      rule: cssVar("--rule"),
      accent: cssVar("--accent"),
      up: cssVar("--up"),
      down: cssVar("--down"),
      surface: cssVar("--surface"),
      mono: cssVar("--mono")
    };
  }

  function baseOptions(p) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: p.ink2, font: { family: p.mono, size: 11 }, boxWidth: 10, boxHeight: 10 }
        },
        tooltip: {
          backgroundColor: p.surface,
          titleColor: p.ink,
          bodyColor: p.ink2,
          borderColor: p.rule,
          borderWidth: 1,
          titleFont: { family: p.mono },
          bodyFont: { family: p.mono },
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          ticks: { color: p.ink3, font: { family: p.mono, size: 10 }, maxTicksLimit: 8 },
          grid: { color: "transparent" },
          border: { color: p.rule }
        },
        y: {
          ticks: { color: p.ink3, font: { family: p.mono, size: 10 } },
          grid: { color: p.rule },
          border: { color: p.rule }
        }
      }
    };
  }

  function render(canvasId, config) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === "undefined") return null;
    const chart = new Chart(ctx, config);
    charts.push(chart);
    return chart;
  }

  function destroy(canvasId) {
    charts = charts.filter((c) => {
      if (c.canvas && c.canvas.id === canvasId) {
        c.destroy();
        return false;
      }
      return true;
    });
  }

  function destroyAll() {
    for (const c of charts) c.destroy();
    charts = [];
  }

  function lineDataset(label, data, color, opts = {}) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: opts.fill ? color + "14" : "transparent",
      fill: !!opts.fill,
      borderWidth: opts.width || 1.8,
      borderDash: opts.dash || undefined,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: opts.tension ?? 0.25,
      spanGaps: true,
      order: opts.order || 0
    };
  }

  function bandDataset(label, upper, lower, color) {
    return {
      label,
      data: upper,
      backgroundColor: color + "1c",
      borderColor: "transparent",
      pointRadius: 0,
      fill: "+1",
      tension: 0.25,
      order: 3
    };
  }

  function themeColors() {
    return palette();
  }

  global.ChartsUI = { render, destroy, destroyAll, baseOptions, lineDataset, bandDataset, palette, themeColors };
})(window);
