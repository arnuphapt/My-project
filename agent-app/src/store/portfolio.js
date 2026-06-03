import { getState } from './core.js';

/* ---------- portfolio math ---------- */
export function px(sym) {
  const state = getState();
  const m = state.market[sym];
  return m ? m.price : 0;
}

export function valuation() {
  const state = getState();
  const FX = state.fx;
  let mvUSD = 0, costUSD = 0, dayPnlUSD = 0;
  
  const rows = state.holdings.map(h => {
    const m = state.market[h.symbol];
    if (!m) return null;
    const price = m.price;
    const inUSD = m.cur === 'USD';
    const toUSD = v => inUSD ? v : v / FX;
    const mv = h.qty * price;
    const cost = h.qty * h.avgCost;
    const pnl = mv - cost;
    const dayPnl = h.qty * (price - m.prevClose);
    
    mvUSD += toUSD(mv);
    costUSD += toUSD(cost);
    dayPnlUSD += toUSD(dayPnl);
    
    return {
      ...h,
      name: m.name,
      cls: m.cls,
      cur: m.cur,
      price,
      prevClose: m.prevClose,
      mv,
      cost,
      pnl,
      pnlPct: cost ? pnl / cost * 100 : 0,
      dayPnl,
      dayPct: m.prevClose ? (price - m.prevClose) / m.prevClose * 100 : 0
    };
  }).filter(Boolean);
  
  const cashUSD = state.cash.usd + state.cash.thb / FX;
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
