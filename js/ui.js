(function (global) {
  "use strict";

  const I = () => window.Indicators;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function delta(n) {
    if (n === null || !isFinite(n)) return "";
    const cls = n >= 0 ? "up" : "down";
    const sign = n >= 0 ? "+" : "";
    return `<span class="delta num ${cls}">${sign}${(n * 100).toFixed(2)}%</span>`;
  }

  function kpis(state) {
    const el = document.getElementById("kpi-ledger");
    const cells = [
      { label: "Portfolio value", value: I().fmtMoney(state.total), extra: delta(state.dayChange) },
      { label: "Daily change", value: I().fmtMoney(state.dayChangeValue), extra: "" },
      { label: "Year to date", value: I().pct(state.ytd), extra: "" },
      { label: "Total return", value: I().pct(state.totalReturn), extra: "" }
    ];
    el.innerHTML = cells
      .map(
        (c) => `<div class="ledger-cell"><div class="ledger-label">${c.label}</div><div class="ledger-value num">${c.value}${c.extra}</div></div>`
      )
      .join("");
  }

  function positionsTable(hostId, positions, rows, emptyMsg, onEdit) {
    const host = document.getElementById(hostId);
    if (!positions.length) {
      host.innerHTML = `<div class="empty"><strong>No positions yet</strong><p>${emptyMsg}</p></div>`;
      return;
    }
    host.innerHTML = `<table><thead><tr>
      <th>ETF</th><th>Name</th><th class="num">Quantity</th><th class="num">Buy price</th>
      <th class="num">Current price</th><th class="num">Value</th><th class="num">P&L</th><th></th>
    </tr></thead><tbody>
      ${rows
        .map(
          (r) => `<tr data-pos-id="${r.id}" ${onEdit ? 'tabindex="0" role="button" aria-label="Edit position"' : ""}>
        <td class="num ticker">${esc(r.ticker)}</td>
        <td style="white-space:normal">${esc(r.name)}</td>
        <td class="num">${r.qty}</td>
        <td class="num">${I().fmtMoney(r.buyPrice)}</td>
        <td class="num">${I().fmtMoney(r.price)}</td>
        <td class="num">${I().fmtMoney(r.value)}</td>
        <td class="num" style="color:var(--${r.pl >= 0 ? "up" : "down"})">${I().fmtMoney(r.pl)} ${delta(r.plPct)}</td>
        <td>${onEdit ? '<button class="btn btn-ghost btn-sm" data-edit-pos="' + r.id + '">Edit</button>' : ""}</td>
      </tr>`
        )
        .join("")}</tbody></table>`;
  }

  function etfsTable(entries, onSelect) {
    const host = document.getElementById("etfs-table");
    if (!entries.length) {
      host.innerHTML = `<div class="empty"><strong>No results</strong><p>Try another term or clear the filters.</p></div>`;
      return;
    }
    host.innerHTML = `<table><thead><tr>
      <th>Ticker</th><th>Name</th><th>Region</th><th>Sector</th>
      <th class="num">TER</th><th class="num">AUM</th><th class="num">Price</th><th class="num">1Y</th><th></th>
    </tr></thead><tbody>
      ${entries
        .map(
          (e) => `<tr tabindex="0" role="button" data-etf="${esc(e.etf.ticker)}" aria-label="Analyze ${esc(e.etf.ticker)}">
        <td class="num ticker">${esc(e.etf.ticker)}</td>
        <td style="white-space:normal">${esc(e.etf.name)}</td>
        <td>${esc(e.etf.region)}</td>
        <td>${esc(e.etf.sector)}</td>
        <td class="num">${e.etf.ter.toFixed(2)}%</td>
        <td class="num">${I().fmtCompact(e.etf.aum)}</td>
        <td class="num">${I().fmtMoney(e.price)}</td>
        <td class="num" style="color:var(--${e.ret1y >= 0 ? "up" : "down"})">${I().pct(e.ret1y)}</td>
        <td><button class="btn btn-ghost btn-sm" data-analyze="${esc(e.etf.ticker)}">Analyze</button></td>
      </tr>`
        )
        .join("")}</tbody></table>`;
  }

  function watchlistMini(rows) {
    const host = document.getElementById("watchlist-mini");
    if (!rows.length) {
      host.innerHTML = `<div class="empty"><strong>Empty list</strong><p>Add ETFs to the watchlist from the ETFs tab to track them here.</p></div>`;
      return;
    }
    host.innerHTML = rows
      .map(
        (r) => `<div class="alert-row"><span class="num ticker">${esc(r.ticker)}</span><span class="num">${I().fmtMoney(r.price)}</span>${delta(r.chg)}</div>`
      )
      .join("");
  }

  function statsList(hostId, rows) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = rows
      .map(
        (r) =>
          `<div class="stat-row"><span>${r.label}${r.hint ? ` <span class="hint" style="color:var(--ink-3)">· ${r.hint}</span>` : ""}</span><span class="num">${r.value}</span></div>`
      )
      .join("");
  }

  function detailStats(rows) {
    document.getElementById("detail-stats").innerHTML = rows
      .map((r) => `<div class="stat-row"><span>${r.label}</span><span class="num">${r.value}</span></div>`)
      .join("");
  }

  function rebalanceBox(rows, total) {
    const host = document.getElementById("rebalance-box");
    if (!rows.length) {
      host.innerHTML = `<div class="empty"><strong>Nothing to rebalance</strong><p>Define target weights to see drifts and trade suggestions.</p></div>`;
      return;
    }
    host.innerHTML = rows
      .map((r) => {
        const driftPct = (r.drift * 100).toFixed(1);
        const action = r.drift > 0.02 ? "Sell" : r.drift < -0.02 ? "Buy" : "Hold";
        const color = action === "Sell" ? "down" : action === "Buy" ? "up" : "ink-3";
        return `<div class="weight-row">
          <span class="num ticker">${esc(r.ticker)}</span>
          <div class="weight-bar"><i style="width:${Math.round(r.current * 100)}%"></i></div>
          <span class="num">${(r.current * 100).toFixed(1)}%</span>
          <span class="num" style="color:var(--ink-3)">tgt ${(r.target * 100).toFixed(0)}%</span>
          <span class="num" style="color:var(--${color})">${action} ${Math.abs(driftPct)}%</span>
        </div>`;
      })
      .join("");
  }

  function weightsList(hostId, pairs) {
    const host = document.getElementById(hostId);
    host.innerHTML = pairs
      .map(
        (p) => `<div class="weight-row">
      <span class="num ticker">${esc(p.ticker)}</span>
      <div class="weight-bar"><i style="width:${Math.round(p.w * 100)}%"></i></div>
      <span class="num">${(p.w * 100).toFixed(1)}%</span>
    </div>`
      )
      .join("");
  }

  function alertsList(alerts, priceOf, onDelete) {
    const host = document.getElementById("alerts-list");
    if (!alerts.length) {
      host.innerHTML = `<div class="empty"><strong>No alerts</strong><p>Create an alert so Meridiano notifies you when an ETF crosses your target price.</p></div>`;
      return;
    }
    host.innerHTML = alerts
      .map((a) => {
        const price = priceOf(a.ticker);
        const dist = price ? (a.price / price - 1) * 100 : null;
        const reached = dist !== null && ((a.dir === "above" && price >= a.price) || (a.dir === "below" && price <= a.price));
        return `<div class="alert-row">
        <span class="num ticker">${esc(a.ticker)}</span>
        <span class="num">target ${I().fmtMoney(a.price)}</span>
        <span class="alert-state">${reached ? "Reached" : dist !== null ? `${Math.abs(dist).toFixed(1)}% away · crosses ${a.dir}` : "—"}</span>
        <button class="btn btn-danger btn-sm" data-del-alert="${a.id}">Delete</button>
      </div>`;
      })
      .join("");
  }

  function rlSignal(hostId, rl) {
    const host = document.getElementById(hostId);
    const color = rl.action === "buy" ? "up" : rl.action === "sell" ? "down" : "ink-2";
    host.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:12px">
        <span class="ledger-value" style="color:var(--${color});text-transform:uppercase">${esc(rl.action)}</span>
        <span class="num" style="color:var(--ink-2)">confidence ${(rl.confidence * 100).toFixed(0)}%</span>
      </div>
      ${statsListIdless([
        { label: "Directional signal accuracy (backtest)", value: rl.accuracy === null ? "—" : I().pct(rl.accuracy, 1) },
        { label: "Agent return (3Y, no real costs)", value: I().pct(rl.agentReturn, 1) },
        { label: "Buy & hold return (3Y)", value: I().pct(rl.buyHoldReturn, 1) },
        { label: "Learned states", value: String(rl.states.length) }
      ])}`;
  }

  function statsListIdless(rows) {
    return rows
      .map(
        (r) =>
          `<div class="stat-row"><span>${r.label}</span><span class="num">${r.value}</span></div>`
      )
      .join("");
  }

  function mlScore(hostId, ml, benchmarkName) {
    const host = document.getElementById(hostId);
    const p = ml.prob;
    const color = p >= 0.5 ? "up" : "down";
    const feats = [
      { label: "6-month momentum", value: I().pct(ml.features.mom6m, 1) },
      { label: "1-month momentum", value: I().pct(ml.features.mom1m, 1) },
      { label: "Annualized volatility", value: I().pct(ml.features.vol, 1) },
      { label: "12-month drawdown", value: I().pct(ml.features.drawdown, 1) },
      { label: "TER", value: ml.features.ter > 0 ? (ml.features.ter * 100).toFixed(2) + "%" : "—" }
    ];
    host.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:12px">
        <span class="ledger-value num" style="color:var(--${color})">${(p * 100).toFixed(0)}%</span>
        <span style="color:var(--ink-2);font-size:13.5px">prob. of beating ${esc(benchmarkName)} over 12 months</span>
      </div>
      ${statsListIdless(feats)}`;
  }

  function sentimentResult(host, result) {
    const cls = result.score > 0.1 ? "up" : result.score < -0.1 ? "down" : "ink-2";
    const rows = result.lines
      .map(
        (l) => `<div class="alert-row"><span style="white-space:normal">${esc(l.text)}</span>
      <span class="badge" style="color:var(--${l.tag === "positive" ? "up" : l.tag === "negative" ? "down" : "ink-2"})">${l.tag} ${l.score.toFixed(2)}</span></div>`
      )
      .join("");
    host.innerHTML = `<div style="margin-bottom:10px"><span class="ledger-value num" style="color:var(--${cls});font-size:22px">${result.score.toFixed(2)}</span>
      <span style="color:var(--ink-2);font-size:13.5px">aggregate sentiment (-1 to +1)</span></div>${rows}`;
  }

  function reportPreview(host, sections) {
    host.innerHTML = sections
      .map(
        (s) => `<div style="margin-bottom:18px"><h3 style="font-size:14px;margin-bottom:8px">${s.title}</h3>${
          s.rows ? statsListIdless(s.rows) : s.html || ""
        }</div>`
      )
      .join("");
  }

  function toast(msg, isError = false) {
    const host = document.getElementById("toasts");
    const el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 200ms ease-out";
      setTimeout(() => el.remove(), 220);
    }, 3600);
  }

  function rangeButtons(hostId, ranges, current, onPick) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = ranges
      .map(
        (r) =>
          `<button class="tab-btn" type="button" data-range="${r.d}" aria-pressed="${r.d === current}">${r.label}</button>`
      )
      .join("");
    host.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => onPick(parseInt(b.dataset.range, 10)))
    );
  }

  global.UI = {
    esc, delta, kpis, positionsTable, etfsTable, watchlistMini, statsList,
    detailStats, rebalanceBox, weightsList, alertsList, rlSignal, mlScore,
    sentimentResult, reportPreview, toast, rangeButtons
  };
})(window);
