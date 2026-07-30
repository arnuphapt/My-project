import { useState, useEffect } from 'react';
import { SEED } from './seed.js';
import { getAgents, createAgent } from '../api/agents.js';
import { getProjects } from '../api/projects.js';
import { getSettings } from '../api/settings.js';

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
    syncedSkills: [],
    syncedAgents: [],
    syncMeta: { skills: null, team: null },
    skillAnno: {},
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

// ── API Integration ───────────────────────────────────────────
export async function syncBackendData() {
  try {
    const [agentsData, projectsData, settingsData] = await Promise.all([
      getAgents(),
      getProjects(),
      getSettings()
    ]);
    
    let finalAgents = agentsData;
    


    const formattedAgents = finalAgents.map(a => {
        // Compute UI fields that are not in the backend schema
        let color = '#9aa6cf';
        if (a.rarity === 'legend' || a.rarity === 'CEO' || a.seniority === 'ceo') color = '#ff5168';
        else if (a.rarity === 'SECRETARY' || a.seniority === 'secretary') color = '#ffce4a';
        else if (a.rarity === 'epic') color = '#b06bff';
        else if (a.rarity === 'rare') color = '#4db4ff';
        return {
          ...a,
          color,
          statusTh: a.status === 'idle' ? 'ว่าง' : 'กำลังทำงาน',
          last: 'เชื่อมต่อกับ API แล้ว',
          skills: a.skills || [],
          tasks: []
        };
    });

    const newState = { agents: formattedAgents };
    if (projectsData.length > 0) newState.projects = projectsData;
    if (Object.keys(settingsData).length > 0) {
       // Merge settings over the base ones
       const mergedSettings = { ...getState().settings, ...settingsData };
       newState.settings = mergedSettings;
    }

    setState(newState, { now: true });
  } catch (err) {
    console.error('Failed to sync data from Backend API', err);
  }
}

// Auto-sync on load (will execute once when core.js is evaluated)
setTimeout(syncBackendData, 1000);
