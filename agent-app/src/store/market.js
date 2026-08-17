import { setState } from './core.js';
import { SEED } from './seed.js';
import { fetchMarketData } from '../api/market.js';

/* ---------- market management ---------- */
export function addFavorite(m) {
  if (!m || !m.symbol) return;
  setState(s => ({ ...s, market: { ...(s.market || {}), [m.symbol]: m } }), { now: true });
  if (window.__tickerOn) fetchMarketData(); // trigger immediate sync
}

export function removeFavorite(sym) {
  if (!sym) return;
  setState(s => {
    const market = { ...(s.market || {}) };
    delete market[sym];
    return { ...s, market };
  }, { now: true });
}

export function clearAllMarket() {
  setState(s => {
    const holdingsSet = new Set((s.holdings || []).map(h => h?.symbol).filter(Boolean));
    const currentMarket = s.market || {};
    const newMarket = {};
    Object.keys(currentMarket).forEach(k => {
      if (holdingsSet.has(k)) newMarket[k] = currentMarket[k];
    });
    return { ...s, market: newMarket };
  }, { now: true });
}

export function restoreDefaultMarket() {
  setState(s => {
    const newMarket = { ...(s.market || {}) };
    const defaultMarket = SEED.market || {};
    Object.keys(defaultMarket).forEach(k => {
      if (!newMarket[k]) newMarket[k] = defaultMarket[k];
    });
    return { ...s, market: newMarket };
  }, { now: true });
}
