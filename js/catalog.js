(function (global) {
  "use strict";

  const ETF_CATALOG = [
    { ticker: "VT", name: "Vanguard Total World Stock", region: "Global", sector: "Acciones Global", ter: 0.07, aum: 45000, ccy: "USD" },
    { ticker: "ACWI", name: "iShares MSCI ACWI", region: "Global", sector: "Acciones Global", ter: 0.32, aum: 18000, ccy: "USD" },
    { ticker: "VEU", name: "Vanguard FTSE All-World ex-US", region: "Global ex-US", sector: "Acciones Global", ter: 0.07, aum: 32000, ccy: "USD" },
    { ticker: "SPY", name: "SPDR S&P 500", region: "EE.UU.", sector: "Acciones EE.UU.", ter: 0.09, aum: 500000, ccy: "USD" },
    { ticker: "VOO", name: "Vanguard S&P 500", region: "EE.UU.", sector: "Acciones EE.UU.", ter: 0.03, aum: 480000, ccy: "USD" },
    { ticker: "QQQ", name: "Invesco Nasdaq 100", region: "EE.UU.", sector: "Tecnología", ter: 0.2, aum: 250000, ccy: "USD" },
    { ticker: "VTV", name: "Vanguard Value", region: "EE.UU.", sector: "Valor", ter: 0.04, aum: 105000, ccy: "USD" },
    { ticker: "VUG", name: "Vanguard Growth", region: "EE.UU.", sector: "Crecimiento", ter: 0.04, aum: 130000, ccy: "USD" },
    { ticker: "SCHD", name: "Schwab US Dividend Equity", region: "EE.UU.", sector: "Dividendos", ter: 0.06, aum: 55000, ccy: "USD" },
    { ticker: "IWM", name: "iShares Russell 2000", region: "EE.UU.", sector: "Small Cap", ter: 0.19, aum: 60000, ccy: "USD" },
    { ticker: "XLK", name: "Technology Select Sector", region: "EE.UU.", sector: "Tecnología", ter: 0.09, aum: 60000, ccy: "USD" },
    { ticker: "XLV", name: "Health Care Select Sector", region: "EE.UU.", sector: "Salud", ter: 0.09, aum: 38000, ccy: "USD" },
    { ticker: "XLE", name: "Energy Select Sector", region: "EE.UU.", sector: "Energía", ter: 0.09, aum: 32000, ccy: "USD" },
    { ticker: "XLF", name: "Financial Select Sector", region: "EE.UU.", sector: "Financiero", ter: 0.09, aum: 42000, ccy: "USD" },
    { ticker: "XLI", name: "Industrial Select Sector", region: "EE.UU.", sector: "Industrial", ter: 0.09, aum: 18000, ccy: "USD" },
    { ticker: "XLP", name: "Consumer Staples Select", region: "EE.UU.", sector: "Consumo Básico", ter: 0.09, aum: 15000, ccy: "USD" },
    { ticker: "XLY", name: "Consumer Discretionary Select", region: "EE.UU.", sector: "Consumo Discrecional", ter: 0.09, aum: 20000, ccy: "USD" },
    { ticker: "VNQ", name: "Vanguard Real Estate", region: "EE.UU.", sector: "Inmobiliario", ter: 0.13, aum: 32000, ccy: "USD" },
    { ticker: "VEA", name: "Vanguard Developed Markets", region: "Desarrollados", sector: "Acciones Desarrollados", ter: 0.05, aum: 120000, ccy: "USD" },
    { ticker: "VWO", name: "Vanguard Emerging Markets", region: "Emergentes", sector: "Emergentes", ter: 0.08, aum: 75000, ccy: "USD" },
    { ticker: "EEM", name: "iShares MSCI Emerging Markets", region: "Emergentes", sector: "Emergentes", ter: 0.7, aum: 40000, ccy: "USD" },
    { ticker: "EWJ", name: "iShares MSCI Japan", region: "Japón", sector: "Acciones Japón", ter: 0.49, aum: 20000, ccy: "USD" },
    { ticker: "EWG", name: "iShares MSCI Germany", region: "Europa", sector: "Acciones Alemania", ter: 0.5, aum: 5000, ccy: "USD" },
    { ticker: "EWU", name: "iShares MSCI United Kingdom", region: "Europa", sector: "Acciones Reino Unido", ter: 0.5, aum: 3500, ccy: "USD" },
    { ticker: "EWA", name: "iShares MSCI Australia", region: "Asia-Pacífico", sector: "Acciones Australia", ter: 0.5, aum: 3000, ccy: "USD" },
    { ticker: "MCHI", name: "iShares MSCI China", region: "Emergentes", sector: "Acciones China", ter: 0.59, aum: 6500, ccy: "USD" },
    { ticker: "INDA", name: "iShares MSCI India", region: "Emergentes", sector: "Acciones India", ter: 0.64, aum: 8000, ccy: "USD" },
    { ticker: "EWZ", name: "iShares MSCI Brazil", region: "Emergentes", sector: "Acciones Brasil", ter: 0.59, aum: 2000, ccy: "USD" },
    { ticker: "GLD", name: "SPDR Gold Shares", region: "Global", sector: "Metales Preciosos", ter: 0.4, aum: 60000, ccy: "USD" },
    { ticker: "SLV", name: "iShares Silver Trust", region: "Global", sector: "Metales Preciosos", ter: 0.5, aum: 12000, ccy: "USD" },
    { ticker: "DBC", name: "Invesco DB Commodity Index", region: "Global", sector: "Materias Primas", ter: 0.87, aum: 5000, ccy: "USD" },
    { ticker: "AGG", name: "iShares Core US Aggregate Bond", region: "EE.UU.", sector: "Bonos Agregado", ter: 0.03, aum: 100000, ccy: "USD" },
    { ticker: "BND", name: "Vanguard Total Bond Market", region: "EE.UU.", sector: "Bonos Agregado", ter: 0.03, aum: 110000, ccy: "USD" },
    { ticker: "TLT", name: "iShares 20+ Year Treasury Bond", region: "EE.UU.", sector: "Bonos Largo Plazo", ter: 0.15, aum: 55000, ccy: "USD" },
    { ticker: "SHY", name: "iShares 1-3 Year Treasury Bond", region: "EE.UU.", sector: "Bonos Corto Plazo", ter: 0.15, aum: 28000, ccy: "USD" },
    { ticker: "TIP", name: "iShares TIPS Bond", region: "EE.UU.", sector: "Bonos Inflación", ter: 0.19, aum: 14000, ccy: "USD" },
    { ticker: "LQD", name: "iShares iBoxx Investment Grade", region: "Global", sector: "Bonos Corporativos", ter: 0.14, aum: 30000, ccy: "USD" },
    { ticker: "EMB", name: "iShares JPMorgan USD Emerging Bond", region: "Emergentes", sector: "Bonos Emergentes", ter: 0.39, aum: 18000, ccy: "USD" },
    { ticker: "BIL", name: "SPDR 1-3 Month T-Bill", region: "EE.UU.", sector: "Efectivo", ter: 0.14, aum: 35000, ccy: "USD" },
    { ticker: "IAU", name: "iShares Gold Trust", region: "Global", sector: "Metales Preciosos", ter: 0.25, aum: 30000, ccy: "USD" }
  ];

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DRIFT = {
    "Metales Preciosos": 0.05,
    "Bonos Largo Plazo": 0.02,
    "Bonos Corto Plazo": 0.03,
    "Efectivo": 0.04,
    "Bonos Agregado": 0.03,
    "Bonos Inflación": 0.03,
    "Bonos Corporativos": 0.035,
    "Bonos Emergentes": 0.04
  };

  function baseDrift(sector) {
    if (DRIFT[sector] !== undefined) return DRIFT[sector];
    if (sector.startsWith("Bonos")) return 0.03;
    if (sector === "Tecnología") return 0.13;
    if (sector === "Energía") return 0.05;
    if (sector === "Salud") return 0.08;
    return 0.07;
  }

  function baseVol(sector, region) {
    if (DRIFT[sector] !== undefined) return sector === "Efectivo" ? 0.002 : 0.1;
    if (sector === "Tecnología") return 0.24;
    if (sector === "Energía") return 0.28;
    if (sector === "Metales Preciosos") return 0.16;
    if (region === "Emergentes") return 0.22;
    return 0.16;
  }

  const BASE_PRICE = {
    VT: 118, ACWI: 112, VEU: 62, SPY: 565, VOO: 520, QQQ: 485, VTV: 165, VUG: 320,
    SCHD: 82, IWM: 215, XLK: 230, XLV: 148, XLE: 92, XLF: 45, XLI: 132, XLP: 78,
    XLY: 195, VNQ: 88, VEA: 52, VWO: 47, EEM: 44, EWJ: 68, EWG: 42, EWU: 38,
    EWA: 31, MCHI: 58, INDA: 54, EWZ: 30, GLD: 245, SLV: 29, DBC: 26, AGG: 98,
    BND: 72, TLT: 92, SHY: 82, TIP: 108, LQD: 108, EMB: 102, BIL: 91, IAU: 58
  };

  function generateSeries(etf, days) {
    const rnd = mulberry32(hashSeed(etf.ticker));
    const mu = baseDrift(etf.sector);
    const sigma = baseVol(etf.sector, etf.region);
    const dt = 1 / 252;
    const years = days / 252;
    const base = BASE_PRICE[etf.ticker] || 50;
    const start = base * Math.exp(-(mu - 0.5 * sigma * sigma) * years);
    const prices = [];
    let price = start;
    for (let i = 0; i < days; i++) {
      const shock = Math.sqrt(dt) * sigma;
      const z = gaussian(rnd);
      price *= Math.exp((mu - 0.5 * sigma * sigma) * dt + shock * z);
      prices.push(round2(price));
    }
    const k = base / prices[prices.length - 1];
    for (let i = 0; i < prices.length; i++) prices[i] = round2(prices[i] * k);
    return prices;
  }

  function gaussian(rnd) {
    let u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function byTicker(ticker) {
    return ETF_CATALOG.find((e) => e.ticker === ticker) || null;
  }

  function regions() {
    return [...new Set(ETF_CATALOG.map((e) => e.region))].sort();
  }

  function sectors() {
    return [...new Set(ETF_CATALOG.map((e) => e.sector))].sort();
  }

  global.Catalog = { ETF_CATALOG, generateSeries, byTicker, regions, sectors, round2 };
})(window);
