import { getState, setState } from './core.js';

/* ---------- trading actions ---------- */
export function clock() {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

export function buy(sym, qty) {
  const state = getState();
  const m = state.market[sym];
  if (!m || qty <= 0) return { ok: false, msg: 'จำนวนไม่ถูกต้อง' };
  
  const cost = m.price * qty;
  const ccy = m.cur === 'USD' ? 'usd' : 'thb';
  if (state.cash[ccy] < cost) return { ok: false, msg: 'เงินสดไม่พอ' };
  
  setState(s => {
    const cash = { ...s.cash };
    cash[ccy] -= cost;
    const holdings = s.holdings.map(h => ({ ...h }));
    const ex = holdings.find(h => h.symbol === sym);
    if (ex) {
      const tot = ex.qty + qty;
      ex.avgCost = (ex.avgCost * ex.qty + m.price * qty) / tot;
      ex.qty = tot;
    } else {
      holdings.push({ symbol: sym, qty, avgCost: m.price });
    }
    const txns = [
      { type: 'BUY', sym, qty, price: m.price, cur: m.cur, t: clock() },
      ...s.txns
    ].slice(0, 60);
    return { ...s, cash, holdings, txns };
  }, { now: true });
  
  return { ok: true };
}

export function sell(sym, qty) {
  const state = getState();
  const m = state.market[sym];
  if (!m || qty <= 0) return { ok: false, msg: 'จำนวนไม่ถูกต้อง' };
  
  const h = state.holdings.find(x => x.symbol === sym);
  if (!h || h.qty < qty) return { ok: false, msg: 'จำนวนถือไม่พอ' };
  
  const ccy = m.cur === 'USD' ? 'usd' : 'thb';
  
  setState(s => {
    const cash = { ...s.cash };
    cash[ccy] += m.price * qty;
    let holdings = s.holdings.map(x => ({ ...x }));
    const hh = holdings.find(x => x.symbol === sym);
    const realizedPnl = (m.price - hh.avgCost) * qty;
    hh.qty -= qty;
    if (hh.qty <= 1e-9) holdings = holdings.filter(x => x.symbol !== sym);
    const realized = { ...s.realized };
    realized[ccy] += realizedPnl;
    const txns = [
      { type: 'SELL', sym, qty, price: m.price, cur: m.cur, t: clock(), pnl: realizedPnl },
      ...s.txns
    ].slice(0, 60);
    return { ...s, cash, holdings, realized, txns };
  }, { now: true });
  
  return { ok: true };
}

export function deposit(ccy, amt) {
  if (amt === 0) return;
  setState(s => {
    const cash = { ...s.cash };
    cash[ccy] += amt;
    return { ...s, cash };
  }, { now: true });
}

export function setCash(ccy, amt) {
  if (amt < 0) return;
  setState(s => {
    const cash = { ...s.cash };
    cash[ccy] = amt;
    return { ...s, cash };
  }, { now: true });
}
