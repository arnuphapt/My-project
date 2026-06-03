import { useState, useEffect } from 'react';
import { SEED } from './seed.js';

/* ============ GLOBAL STORE ENGINE ============ */
const LS = 'ai-office-v3';
const S = SEED;

export function freshState() {
  return {
    fx: S.FX,
    route: 'dashboard',
    player: { ...S.player },
    settings: { ...S.settings },
    live: {
      connected: false,
      exchange: 'Binance',
      apiKey: '',
      apiSecret: '',
      botOn: false,
      riskPct: 2,
      maxCapital: 10000,
      tp: 5,
      sl: 3,
      mode: 'paper',
    },
    warroomPos: JSON.parse(JSON.stringify(S.warroomPos)),
    cash: { thb: 500000, usd: 5000 },
    holdings: S.holdings.map(h => ({ ...h })),
    realized: { thb: 0, usd: 0 },
    txns: [],
    market: JSON.parse(JSON.stringify(S.market)),
    agents: S.agents.map(a => ({ ...a, tasks: [] })),
    projects: S.projects.map(p => ({ ...p })),
    secChat: [],
    teamChat: [],
    log: [],
  };
}

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS));
    if (!raw) return freshState();
    const base = freshState();
    // shallow-merge persisted onto fresh (so new fields appear)
    const merged = { ...base, ...raw };
    merged.settings = { ...base.settings, ...(raw.settings || {}) };
    merged.player = { ...base.player, ...(raw.player || {}) };
    merged.live = { ...base.live, ...(raw.live || {}) };
    merged.warroomPos = { ...base.warroomPos, ...(raw.warroomPos || {}) };
    // If the user has a saved market list, use it as the definitive list (so deleted defaults stay deleted)
    // but still merge metadata from base.market if it exists.
    if (raw.market) {
      merged.market = {};
      Object.keys(raw.market).forEach(k => {
        merged.market[k] = { ...(base.market[k] || {}), ...raw.market[k] };
      });
    } else {
      merged.market = {};
      Object.keys(base.market).forEach(k => {
        merged.market[k] = { ...base.market[k] };
      });
    }
    merged.route = 'dashboard';
    return merged;
  } catch (e) {
    return freshState();
  }
}

let state = load();
const subs = new Set();
let writeTimer = null;

export function persist(now) {
  if (now) {
    try {
      localStorage.setItem(LS, JSON.stringify(state));
    } catch (e) {}
    return;
  }
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      localStorage.setItem(LS, JSON.stringify(state));
    } catch (e) {}
  }, 1500);
}

export function setState(patch, opts = {}) {
  state = (typeof patch === 'function') ? patch(state) : { ...state, ...patch };
  persist(opts.now);
  subs.forEach(f => f(state));
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function useOffice() {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force(n => n + 1)), []);
  return [state, setState];
}
