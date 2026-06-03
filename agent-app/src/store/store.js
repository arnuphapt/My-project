import { useState, useEffect } from 'react';


/* ============ SEED DATA ============ */
const FX = 32.61; // THB per USD

// ---- AI Agents (roster maps to areas of the user's life) ----
const agents = [];

// ---- Market assets (price in native currency) ----
const mk = (symbol,name,cls,price,cur,prev)=>({symbol,name,cls,price,cur,prevClose:prev??price,seed:price});
const market = {
  // Thai stocks (THB)
  PTT:    mk('PTT','ปตท.','SET',35.25,'THB',35.75),
  AOT:    mk('AOT','ท่าอากาศยานไทย','SET',58.50,'THB',57.25),
  CPALL:  mk('CPALL','ซีพี ออลล์','SET',61.00,'THB',60.25),
  KBANK:  mk('KBANK','กสิกรไทย','SET',158.50,'THB',160.00),
  ADVANC: mk('ADVANC','แอดวานซ์','SET',281.00,'THB',278.00),
  DELTA:  mk('DELTA','เดลต้า','SET',122.50,'THB',125.00),
  // US stocks (USD)
  AAPL:  mk('AAPL','Apple','US',212.40,'USD',214.10),
  NVDA:  mk('NVDA','NVIDIA','US',131.80,'USD',128.50),
  TSLA:  mk('TSLA','Tesla','US',242.10,'USD',248.30),
  MSFT:  mk('MSFT','Microsoft','US',451.20,'USD',449.00),
  GOOGL: mk('GOOGL','Alphabet','US',178.60,'USD',177.20),
  AMZN:  mk('AMZN','Amazon','US',201.30,'USD',203.50),
  // Mutual funds (THB NAV)
  SCBSET:   mk('SCBSET','SCB SET Index','FUND',18.42,'THB',18.30),
  KFGBRAND: mk('KFGBRAND','KF Global Brands','FUND',24.85,'THB',24.60),
  TMBGQG:   mk('TMBGQG','TMB Global Quality','FUND',16.10,'THB',16.22),
  SCBGOLD:  mk('SCBGOLD','SCB Gold','FUND',12.74,'THB',12.55),
  // Crypto (USD)
  BTC:  mk('BTC','Bitcoin','CRYPTO',73042,'USD',75600),
  ETH:  mk('ETH','Ethereum','CRYPTO',1977,'USD',2068),
  SOL:  mk('SOL','Solana','CRYPTO',80.53,'USD',83.10),
  BNB:  mk('BNB','BNB','CRYPTO',635.59,'USD',652.40),
  XRP:  mk('XRP','XRP','CRYPTO',1.28,'USD',1.33),
  DOGE: mk('DOGE','Dogecoin','CRYPTO',0.0979,'USD',0.1012),
};

// ---- Starting portfolio ----
const holdings = [
  { symbol:'NVDA', qty:8,    avgCost:120.50 },
  { symbol:'AOT',  qty:500,  avgCost:55.00 },
  { symbol:'BTC',  qty:0.05, avgCost:68000 },
  { symbol:'SCBSET', qty:1200, avgCost:17.80 },
];

// ---- Projects (resume/CV data) ----
const projects = [
  { id:'p1', title:'AI Agent Office', role:'Founder / Builder', status:'กำลังทำ', progress:72,
    period:'2026 – ปัจจุบัน', tags:['React','UX','Automation','Product'], cover:'proj-1',
    summary:'ระบบจัดการชีวิตส่วนตัวรูปแบบออฟฟิศจำลอง มีพนักงาน AI ช่วยงานแต่ละด้าน',
    highlights:['ออกแบบ flow ทั้งระบบ 6 หน้า','พอร์ตลงทุนจำลองเรียลไทม์','เลขา AI สั่งงานทีมได้'] },
  { id:'p2', title:'Crypto Grid Bot', role:'Developer', status:'เสร็จแล้ว', progress:100,
    period:'2025', tags:['Python','Trading','API'], cover:'proj-2',
    summary:'บอทเทรดแบบ grid เชื่อม API ตลาด คอยจับช่วงราคาอัตโนมัติ',
    highlights:['ทำกำไรเฉลี่ย 4% ต่อเดือน','ระบบแจ้งเตือนผ่านไลน์','backtest 2 ปี'] },
  { id:'p3', title:'Pixel Portfolio Site', role:'Designer / Dev', status:'เสร็จแล้ว', progress:100,
    period:'2024', tags:['HTML','Pixel Art','Web'], cover:'proj-3',
    summary:'เว็บพอร์ตโฟลิโอสไตล์พิกเซลอาร์ต โชว์ผลงานและทักษะ',
    highlights:['ยอดเข้าชม 12k+','โหลดไว < 1s','responsive ครบ'] },
];

// ---- Assets ----
const assetGroups = [
  { id:'img',  name:'IMAGES',  th:'รูปภาพ / สกรีนช็อต', count:6 },
  { id:'logo', name:'LOGOS',   th:'โลโก้ / แบรนด์', count:4 },
  { id:'pix',  name:'PIXEL ART', th:'พิกเซลอาร์ต / ตัวละคร', count:6 },
  { id:'doc',  name:'DOCS',    th:'เอกสาร / สเปก', count:4 },
];

const player = { name:'BOSS', level:24, xp:1200, xpMax:2000, coins:12450, gems:320, company:'MY OFFICE' };

// ---- Warroom character token positions (% of stage) ----
const warroomPos = {
  mira:   {x:50, y:34},
  quant:  {x:34, y:44},
  devin:  {x:62, y:42},
  pixel:  {x:26, y:60},
  echo:   {x:72, y:56},
  ledger: {x:44, y:62},
  scout:  {x:64, y:70},
  tidy:   {x:38, y:74},
};

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
const LS = 'ai-office-v2';
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
    // always refresh market metadata (names) but keep persisted prices
    merged.market = {};
    Object.keys(base.market).forEach(k=>{
      merged.market[k] = { ...base.market[k], ...(raw.market?.[k]||{}) };
    });
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
  if(amt<=0) return;
  setState(s=>{ const cash={...s.cash}; cash[ccy]+=amt; return {...s,cash}; },{now:true});
}

function clock(){ const d=new Date(); return d.toTimeString().slice(0,5); }

/* ---------- market ticker (realtime drift) ---------- */
function startTicker(){
  if(window.__tickerOn) return; window.__tickerOn=true;
  setInterval(()=>{
    setState(s=>{
      const market={...s.market};
      Object.keys(market).forEach(k=>{
        const m={...market[k]};
        const vol = m.cls==='CRYPTO'?0.004 : m.cls==='FUND'?0.0008 : 0.0022;
        const drift=(Math.random()-0.5)*2*vol;
        let np = m.price*(1+drift);
        // gentle mean-reversion toward seed so it doesn't wander off
        np += (m.seed-np)*0.01;
        m.price = +np.toFixed(m.price<1?5:m.price<100?2:2);
        market[k]=m;
      });
      return {...s, market};
    });
  }, 2000);
}

const OfficeStore = { getState, setState, subscribe, valuation, buy, sell, deposit, startTicker, clock, FX:S.FX };


/* number helpers */
const fmt = {
  n:(v,d=2)=>{ if(v==null||isNaN(v)) return '–'; return Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); },
  money:(v,cur,d=2)=>{ const sym=cur==='USD'?'$':'฿'; const s=v<0?'-':''; return s+sym+fmt.n(Math.abs(v),d); },
  pct:(v,d=2)=>{ if(v==null||isNaN(v)) return '–'; return (v>=0?'+':'')+fmt.n(v,d)+'%'; },
  compact:(v)=>{ const a=Math.abs(v); if(a>=1e12)return (v/1e12).toFixed(2)+'T'; if(a>=1e9)return (v/1e9).toFixed(1)+'B'; if(a>=1e6)return (v/1e6).toFixed(1)+'M'; if(a>=1e3)return (v/1e3).toFixed(1)+'K'; return v.toFixed(0); },
};

export { OfficeStore, useOffice, fmt, SEED };
