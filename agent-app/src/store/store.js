import { useState, useEffect } from 'react';


/* ============ SEED DATA ============ */
const FX = 32.61; // THB per USD

// ---- AI Agents (roster maps to areas of the user's life) ----
const agents = [];

// ---- Market assets (price in native currency) ----
const mk = (symbol,name,cls,price,cur,prev)=>({symbol,name,cls,price,cur,prevClose:prev??price,seed:price});
const market = {
  // Thai stocks (THB)
  PTT:    mk('PTT','ปตท.','SET',0,'THB'),
  AOT:    mk('AOT','ท่าอากาศยานไทย','SET',0,'THB'),
  CPALL:  mk('CPALL','ซีพี ออลล์','SET',0,'THB'),
  KBANK:  mk('KBANK','กสิกรไทย','SET',0,'THB'),
  ADVANC: mk('ADVANC','แอดวานซ์','SET',0,'THB'),
  DELTA:  mk('DELTA','เดลต้า','SET',0,'THB'),
  // US stocks (USD)
  AAPL:  mk('AAPL','Apple','US',0,'USD'),
  NVDA:  mk('NVDA','NVIDIA','US',0,'USD'),
  TSLA:  mk('TSLA','Tesla','US',0,'USD'),
  MSFT:  mk('MSFT','Microsoft','US',0,'USD'),
  GOOGL: mk('GOOGL','Alphabet','US',0,'USD'),
  AMZN:  mk('AMZN','Amazon','US',0,'USD'),
  // Mutual funds (THB NAV)
  SCBSET:   mk('SCBSET','SCB SET Index','FUND',0,'THB'),
  KFGBRAND: mk('KFGBRAND','KF Global Brands','FUND',0,'THB'),
  TMBGQG:   mk('TMBGQG','TMB Global Quality','FUND',0,'THB'),
  SCBGOLD:  mk('SCBGOLD','SCB Gold','FUND',0,'THB'),
  // Crypto (USD)
  BTC:  mk('BTC','Bitcoin','CRYPTO',0,'USD'),
  ETH:  mk('ETH','Ethereum','CRYPTO',0,'USD'),
  SOL:  mk('SOL','Solana','CRYPTO',0,'USD'),
  BNB:  mk('BNB','BNB','CRYPTO',0,'USD'),
  XRP:  mk('XRP','XRP','CRYPTO',0,'USD'),
  DOGE: mk('DOGE','Dogecoin','CRYPTO',0,'USD'),
};

// ---- Starting portfolio ----
const holdings = [];

// ---- Projects (resume/CV data) ----
const projects = [];

// ---- Assets ----
const assetGroups = [
  { id:'img',  name:'IMAGES',  th:'รูปภาพ / สกรีนช็อต', count:6 },
  { id:'logo', name:'LOGOS',   th:'โลโก้ / แบรนด์', count:4 },
  { id:'pix',  name:'PIXEL ART', th:'พิกเซลอาร์ต / ตัวละคร', count:6 },
  { id:'doc',  name:'DOCS',    th:'เอกสาร / สเปก', count:4 },
];

const player = { name:'BOSS', level:1, xp:0, xpMax:2000, coins:0, gems:0, company:'MY OFFICE' };

// ---- Warroom character token positions (% of stage) ----
const warroomPos = {};

// ---- Settings (system identity + owner profile for CV) ----
const settings = {
  sysName1:'MY',
  sysName2:'OFFICE',
  tagline:'ระบบจัดการชีวิตส่วนตัว ขับเคลื่อนด้วยทีม AI',
  ownerName:'',
  ownerRole:'Founder / Builder',
  location:'Bangkok, Thailand',
  email:'',
  phone:'',
  website:'',
  bio:'',
  accent:'cyan',
};

const SEED = { FX, agents, market, holdings, projects, assetGroups, player, settings, warroomPos };


/* ============ GLOBAL STORE ============ */
const LS = 'ai-office-v3';
const S = SEED;

function freshState(){
  return {
    route:'dashboard',
    player: {...S.player},
    settings: {...S.settings},
    live: {
      connected:false, exchange:'Binance', apiKey:'', apiSecret:'',
      botOn:false, riskPct:2, maxCapital:10000, tp:5, sl:3, mode:'paper',
    },
    warroomPos: JSON.parse(JSON.stringify(S.warroomPos)),
    cash: { thb: 500000, usd: 5000 },
    holdings: S.holdings.map(h=>({...h})),
    realized: { thb: 0, usd: 0 },
    txns: [],
    market: JSON.parse(JSON.stringify(S.market)),
    agents: S.agents.map(a=>({...a, tasks:[]})),
    projects: S.projects.map(p=>({...p})),
    secChat: [],
    teamChat: [],
    log: [],
  };
}

function load(){
  try{
    const raw = JSON.parse(localStorage.getItem(LS));
    if(!raw) return freshState();
    const base = freshState();
    // shallow-merge persisted onto fresh (so new fields appear)
    const merged = {...base, ...raw};
    merged.settings = {...base.settings, ...(raw.settings||{})};
    merged.player = {...base.player, ...(raw.player||{})};
    merged.live = {...base.live, ...(raw.live||{})};
    merged.warroomPos = {...base.warroomPos, ...(raw.warroomPos||{})};
    // If the user has a saved market list, use it as the definitive list (so deleted defaults stay deleted)
    // but still merge metadata from base.market if it exists.
    if (raw.market) {
      merged.market = {};
      Object.keys(raw.market).forEach(k => {
        merged.market[k] = { ...(base.market[k]||{}), ...raw.market[k] };
      });
    } else {
      merged.market = {};
      Object.keys(base.market).forEach(k => {
        merged.market[k] = { ...base.market[k] };
      });
    }
    merged.route = 'dashboard';
    return merged;
  }catch(e){ return freshState(); }
}

let state = load();
const subs = new Set();
let writeTimer = null;
function persist(now){
  if(now){ try{localStorage.setItem(LS, JSON.stringify(state));}catch(e){} return; }
  if(writeTimer) return;
  writeTimer = setTimeout(()=>{ writeTimer=null; try{localStorage.setItem(LS, JSON.stringify(state));}catch(e){} }, 1500);
}
function setState(patch, opts={}){
  state = (typeof patch==='function') ? patch(state) : {...state, ...patch};
  persist(opts.now);
  subs.forEach(f=>f(state));
}
function getState(){ return state; }
function subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); }

function useOffice(){
  const [,force] = useState(0);
  useEffect(()=> subscribe(()=>force(n=>n+1)), []);
  return [state, setState];
}

/* ---------- portfolio math ---------- */
function px(sym){ const m=state.market[sym]; return m? m.price : 0; }
function valuation(){
  const FX = S.FX;
  let mvUSD=0, costUSD=0, dayPnlUSD=0;
  const rows = state.holdings.map(h=>{
    const m = state.market[h.symbol];
    if(!m) return null;
    const price = m.price;
    const inUSD = m.cur==='USD';
    const toUSD = v => inUSD ? v : v/FX;
    const mv = h.qty*price;
    const cost = h.qty*h.avgCost;
    const pnl = mv-cost;
    const dayPnl = h.qty*(price - m.prevClose);
    mvUSD += toUSD(mv); costUSD += toUSD(cost); dayPnlUSD += toUSD(dayPnl);
    return { ...h, name:m.name, cls:m.cls, cur:m.cur, price, prevClose:m.prevClose,
      mv, cost, pnl, pnlPct: cost? pnl/cost*100:0, dayPnl,
      dayPct: m.prevClose? (price-m.prevClose)/m.prevClose*100:0 };
  }).filter(Boolean);
  const cashUSD = state.cash.usd + state.cash.thb/FX;
  const totalUSD = mvUSD + cashUSD;
  return {
    rows, FX,
    mvUSD, costUSD, dayPnlUSD,
    unrealUSD: mvUSD-costUSD,
    cashUSD, totalUSD,
    unrealPct: costUSD? (mvUSD-costUSD)/costUSD*100 : 0,
  };
}

/* ---------- trading actions ---------- */
function buy(sym, qty){
  const m = state.market[sym]; if(!m||qty<=0) return {ok:false,msg:'จำนวนไม่ถูกต้อง'};
  const cost = m.price*qty; const ccy = m.cur==='USD'?'usd':'thb';
  if(state.cash[ccy] < cost) return {ok:false,msg:'เงินสดไม่พอ'};
  setState(s=>{
    const cash = {...s.cash}; cash[ccy] -= cost;
    const holdings = s.holdings.map(h=>({...h}));
    const ex = holdings.find(h=>h.symbol===sym);
    if(ex){ const tot=ex.qty+qty; ex.avgCost=(ex.avgCost*ex.qty + m.price*qty)/tot; ex.qty=tot; }
    else holdings.push({symbol:sym, qty, avgCost:m.price});
    const txns=[{type:'BUY',sym,qty,price:m.price,cur:m.cur,t:clock()},...s.txns].slice(0,60);
    return {...s, cash, holdings, txns};
  }, {now:true});
  return {ok:true};
}
function sell(sym, qty){
  const m = state.market[sym]; if(!m||qty<=0) return {ok:false,msg:'จำนวนไม่ถูกต้อง'};
  const h = state.holdings.find(x=>x.symbol===sym);
  if(!h || h.qty < qty) return {ok:false,msg:'จำนวนถือไม่พอ'};
  const ccy = m.cur==='USD'?'usd':'thb';
  setState(s=>{
    const cash={...s.cash}; cash[ccy]+= m.price*qty;
    let holdings=s.holdings.map(x=>({...x}));
    const hh=holdings.find(x=>x.symbol===sym);
    const realizedPnl=(m.price-hh.avgCost)*qty;
    hh.qty-=qty; if(hh.qty<=1e-9) holdings=holdings.filter(x=>x.symbol!==sym);
    const realized={...s.realized}; realized[ccy]+=realizedPnl;
    const txns=[{type:'SELL',sym,qty,price:m.price,cur:m.cur,t:clock(),pnl:realizedPnl},...s.txns].slice(0,60);
    return {...s, cash, holdings, realized, txns};
  }, {now:true});
  return {ok:true};
}
function deposit(ccy, amt){
  if(amt===0) return;
  setState(s=>{ const cash={...s.cash}; cash[ccy]+=amt; return {...s,cash}; },{now:true});
}
function setCash(ccy, amt){
  if(amt<0) return;
  setState(s=>{ const cash={...s.cash}; cash[ccy]=amt; return {...s,cash}; },{now:true});
}

function clock(){ const d=new Date(); return d.toTimeString().slice(0,5); }

/* ---------- market ticker (realtime drift) ---------- */
let lastFetch = 0;
let isFetching = false;
let realPrices = {};

async function fetchMarketData() {
  isFetching = true;
  lastFetch = Date.now();
  try {
    const s = OfficeStore.getState();
    const supported = Object.keys(s.market).filter(k => 
       s.market[k].cls === 'US' || s.market[k].cls === 'CRYPTO' || s.market[k].cls === 'SET' || s.market[k].cls === 'FUND'
    );
    
    const fetchPromises = supported.map(async sym => {
       let querySym = sym;
       if(s.market[sym].cls === 'CRYPTO' && !sym.includes('-')) querySym = `${sym}-USD`;
       else if (s.market[sym].cls === 'SET' && !sym.includes('.')) querySym = `${sym}.BK`;
       
       const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${querySym}`);
       if(res.ok) {
         const data = await res.json();
         const meta = data?.chart?.result?.[0]?.meta;
         if(meta && meta.regularMarketPrice > 0) {
             return { sym, price: meta.regularMarketPrice, pc: meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice };
         }
       }
       return null;
    });
    const results = await Promise.all(fetchPromises);
    results.forEach(r => { if(r) realPrices[r.sym] = r; });
  } catch(e) { console.error('Yahoo Finance error', e); }
  isFetching = false;
}

function startTicker(){
  if(window.__tickerOn) return; window.__tickerOn=true;
  
  fetchMarketData();

  setInterval(()=>{
    const now = Date.now();
    
    if (!isFetching && now - lastFetch > 15000) {
      fetchMarketData();
    }

    setState(s=>{
      const market={...s.market};
      Object.keys(market).forEach(k=>{
        const m={...market[k]};
        
        if (realPrices[k]) {
          // Use real data directly
          m.price = realPrices[k].price;
          if (realPrices[k].pc > 0) m.prevClose = realPrices[k].pc;
        }
        market[k]=m;
      });
      return {...s, market};
    });
  }, 2000);
}

function addFavorite(m){
  setState(s => ({ ...s, market: { ...s.market, [m.symbol]: m } }), {now:true});
  if (window.__tickerOn) fetchMarketData(); // trigger immediate sync
}
function removeFavorite(sym){
  setState(s => {
    const market = {...s.market};
    delete market[sym];
    return { ...s, market };
  }, {now:true});
}
function clearAllMarket(){
  setState(s => {
    const holdingsSet = new Set(s.holdings.map(h => h.symbol));
    const newMarket = {};
    Object.keys(s.market).forEach(k => {
      if(holdingsSet.has(k)) newMarket[k] = s.market[k];
    });
    return { ...s, market: newMarket };
  }, {now:true});
}
function restoreDefaultMarket(){
  setState(s => {
    const newMarket = { ...s.market };
    Object.keys(SEED.market).forEach(k => {
      if(!newMarket[k]) newMarket[k] = SEED.market[k];
    });
    return { ...s, market: newMarket };
  }, {now:true});
}

const OfficeStore = { getState, setState, subscribe, valuation, buy, sell, deposit, setCash, addFavorite, removeFavorite, clearAllMarket, restoreDefaultMarket, startTicker, clock, FX:S.FX };


/* number helpers */
const fmt = {
  n:(v,d=2)=>{ if(v==null||isNaN(v)) return '–'; return Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); },
  money:(v,cur,d=2)=>{ const sym=cur==='USD'?'$':'฿'; const s=v<0?'-':''; return s+sym+fmt.n(Math.abs(v),d); },
  pct:(v,d=2)=>{ if(v==null||isNaN(v)) return '–'; return (v>=0?'+':'')+fmt.n(v,d)+'%'; },
  compact:(v)=>{ const a=Math.abs(v); if(a>=1e12)return (v/1e12).toFixed(2)+'T'; if(a>=1e9)return (v/1e9).toFixed(1)+'B'; if(a>=1e6)return (v/1e6).toFixed(1)+'M'; if(a>=1e3)return (v/1e3).toFixed(1)+'K'; return v.toFixed(0); },
};

export { OfficeStore, useOffice, fmt, SEED };
