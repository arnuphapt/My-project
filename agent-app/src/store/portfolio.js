import { getState } from './core.js';

/* ---------- portfolio math ---------- */
export function px(sym) {
  const state = getState() || {};
  const m = (state.market || {})[sym];
  return m ? m.price : 0;
}

export function valuation() {
  const state = getState() || {};
  const FX = state.fx || 32.61;
  const market = state.market || {};
  const holdings = state.holdings || [];
  const cash = state.cash || { usd: 0, thb: 0 };
  let mvUSD = 0, costUSD = 0, dayPnlUSD = 0;
  
  const rows = holdings.map(h => {
    if (!h) return null;
    const m = market[h.symbol];
    if (!m) return null;
    const price = m.price || 0;
    const inUSD = m.cur === 'USD';
    const toUSD = v => inUSD ? v : v / FX;
    const mv = (h.qty || 0) * price;
    const cost = (h.qty || 0) * (h.avgCost || 0);
    const pnl = mv - cost;
    const dayPnl = (h.qty || 0) * (price - (m.prevClose || price));
    
    mvUSD += toUSD(mv);
    costUSD += toUSD(cost);
    dayPnlUSD += toUSD(dayPnl);
    
    return {
      ...h,
      name: m.name || h.symbol,
      cls: m.cls || 'OTHER',
      cur: m.cur || 'THB',
      price,
      prevClose: m.prevClose || price,
      mv,
      cost,
      pnl,
      pnlPct: cost ? pnl / cost * 100 : 0,
      dayPnl,
      dayPct: m.prevClose ? (price - m.prevClose) / m.prevClose * 100 : 0
    };
  }).filter(Boolean);
  
  const cashUSD = (cash.usd || 0) + (cash.thb || 0) / FX;
  const totalUSD = mvUSD + cashUSD;
  
  return {
    rows,
    FX,
    mvUSD,
    costUSD,
    dayPnlUSD,
    unrealUSD: mvUSD - costUSD,
    cashUSD,
    totalUSD,
    unrealPct: costUSD ? (mvUSD - costUSD) / costUSD * 100 : 0,
  };
}
