import { setState } from './core.js';
import { SEED } from './seed.js';
import { fetchMarketData } from '../api/market.js';

/* ---------- market management ---------- */
export function addFavorite(m) {
  setState(s => ({ ...s, market: { ...s.market, [m.symbol]: m } }), { now: true });
  if (window.__tickerOn) fetchMarketData(); // trigger immediate sync
}

export function removeFavorite(sym) {
  setState(s => {
    const market = { ...s.market };
    delete market[sym];
    return { ...s, market };
  }, { now: true });
}

export function clearAllMarket() {
  setState(s => {
    const holdingsSet = new Set(s.holdings.map(h => h.symbol));
    const newMarket = {};
    Object.keys(s.market).forEach(k => {
      if (holdingsSet.has(k)) newMarket[k] = s.market[k];
    });
    return { ...s, market: newMarket };
  }, { now: true });
}

export function restoreDefaultMarket() {
  setState(s => {
    const newMarket = { ...s.market };
    Object.keys(SEED.market).forEach(k => {
      if (!newMarket[k]) newMarket[k] = SEED.market[k];
    });
    return { ...s, market: newMarket };
  }, { now: true });
}
