import { getState, setState, subscribe, useOffice } from './core.js';
import { valuation } from './portfolio.js';
import { buy, sell, deposit, setCash, clock } from './trading.js';
import { addFavorite, removeFavorite, clearAllMarket, restoreDefaultMarket } from './market.js';
import { startTicker } from './api.js';
import { fmt } from './fmt.js';
import { SEED } from './seed.js';

const OfficeStore = {
  getState,
  setState,
  subscribe,
  valuation,
  buy,
  sell,
  deposit,
  setCash,
  addFavorite,
  removeFavorite,
  clearAllMarket,
  restoreDefaultMarket,
  startTicker,
  clock,
  get FX() {
    return getState().fx;
  }
};

export { OfficeStore, useOffice, fmt, SEED };
export { mk } from './seed.js'; // Expose mk helper as well, just in case
