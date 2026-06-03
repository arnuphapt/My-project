import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import '../../image-slot.js';
import TestGemini from './TestGemini.jsx';


/* ========== js/data.jsx ========== */
/* ============ SEED DATA ============ */
(function(){
  const FX = 32.61; // THB per USD

  // ---- AI Agents (roster maps to areas of the user's life) ----
  const agents = [
    { id:'mira',   name:'Mira',   roleEn:'CHIEF OF STAFF', roleTh:'เลขาส่วนตัว · คุมทั้งระบบ', rarity:'legend', color:'#ffce4a',
      status:'working', statusTh:'ทำงานอยู่', last:'2 นาทีที่แล้ว', lv:30, salary:1.9,
      desc:'หัวหน้าเลขา ดูแลทุกอย่างในออฟฟิศ รับคำสั่งจากคุณแล้วกระจายงานให้ทีม AI คนอื่น ขี้เล่นนิดๆ แต่งานเป๊ะ',
      skills:['วางแผนงาน','สรุปสถานะ','มอบหมายงาน','เตือนความจำ'] },
    { id:'quant',  name:'Quant',  roleEn:'INVEST ANALYST', roleTh:'นักวิเคราะห์การลงทุน', rarity:'epic', color:'#b06bff',
      status:'working', statusTh:'เฝ้าพอร์ตอยู่', last:'เมื่อสักครู่', lv:24, salary:1.5,
      desc:'เฝ้าดูพอร์ตจำลอง วิเคราะห์หุ้น/กองทุน/คริปโต รายงานกำไร-ขาดทุน และเตือนเมื่อราคาขยับแรง',
      skills:['วิเคราะห์พอร์ต','คัดหุ้น','เฝ้าราคา','รายงาน PnL'] },
    { id:'devin',  name:'Devin',  roleEn:'DEVELOPER', roleTh:'นักพัฒนา · เขียนโค้ด', rarity:'epic', color:'#4db4ff',
      status:'thinking', statusTh:'กำลังคิด', last:'4 นาทีที่แล้ว', lv:22, salary:1.4,
      desc:'สร้างเครื่องมือ ออโตเมชัน และต้นแบบต่างๆ แปลงไอเดียเป็นของใช้งานได้',
      skills:['เขียนโค้ด','ออโตเมชัน','ทำ prototype','แก้บั๊ก'] },
    { id:'pixel',  name:'Pixel',  roleEn:'DESIGNER', roleTh:'กราฟิก · ออกแบบ', rarity:'epic', color:'#ff5cc8',
      status:'idle', statusTh:'ว่าง', last:'12 นาทีที่แล้ว', lv:20, salary:1.2,
      desc:'งานออกแบบทั้งหมด โลโก้ แบนเนอร์ UI งานพิกเซลอาร์ต',
      skills:['ออกแบบ UI','พิกเซลอาร์ต','โลโก้','แบนเนอร์'] },
    { id:'echo',   name:'Echo',   roleEn:'CONTENT', roleTh:'คอนเทนต์ · โซเชียล', rarity:'rare', color:'#3ad0ff',
      status:'idle', statusTh:'ว่าง', last:'20 นาทีที่แล้ว', lv:15, salary:0.9,
      desc:'เขียนคอนเทนต์ คิดแคปชั่น วางแผนโพสต์ ตอบคอมเมนต์',
      skills:['เขียนคอนเทนต์','วางแผนโพสต์','คิดแคปชั่น'] },
    { id:'ledger', name:'Ledger', roleEn:'FINANCE', roleTh:'การเงิน · บัญชี', rarity:'rare', color:'#3ce594',
      status:'working', statusTh:'ปิดงบอยู่', last:'8 นาทีที่แล้ว', lv:14, salary:0.9,
      desc:'จดบันทึกรายรับรายจ่าย สรุปกระแสเงินสด และเตือนบิลที่ต้องจ่าย',
      skills:['ทำบัญชี','สรุปงบ','เตือนบิล'] },
    { id:'scout',  name:'Scout',  roleEn:'RESEARCH', roleTh:'ค้นคว้า · หาข้อมูล', rarity:'rare', color:'#9aa6cf',
      status:'idle', statusTh:'ว่าง', last:'35 นาทีที่แล้ว', lv:12, salary:0.7,
      desc:'หาข้อมูล สรุปบทความ เทียบตัวเลือก ก่อนตัดสินใจ',
      skills:['หาข้อมูล','สรุปบทความ','เปรียบเทียบ'] },
    { id:'tidy',   name:'Tidy',   roleEn:'OPERATIONS', roleTh:'จัดระบบ · งานออฟฟิศ', rarity:'common', color:'#9aa6cf',
      status:'working', statusTh:'จัดไฟล์อยู่', last:'เมื่อสักครู่', lv:9, salary:0.5,
      desc:'จัดระเบียบไฟล์ ตั้งเวลานัด ดูแลความเรียบร้อยของระบบ',
      skills:['จัดไฟล์','ตั้งนัด','เก็บกวาด'] },
  ];

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

  window.SEED = { FX, agents, market, holdings, projects, assetGroups, player, settings, warroomPos };
})();


/* ========== js/store.jsx ========== */
/* ============ GLOBAL STORE ============ */
(function(){
  const { useState, useEffect, useRef } = React;
  const LS = 'ai-office-v2';
  const S = window.SEED;

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
      teamChat: [
        {who:'mira', text:'อรุณสวัสดิ์เจ้านาย ☕ วันนี้พอร์ตเขียวอยู่นะ อยากให้จัดการอะไรก่อนดี?', t:'08:02'},
        {who:'quant', text:'NVDA +2.5% ตั้งแต่เปิดตลาด เฝ้าให้อยู่ครับ', t:'08:05'},
      ],
      log: [
        {t:'08:01', who:'Mira', text:'เปิดออฟฟิศ เริ่มวันใหม่', kind:'sys'},
        {t:'08:05', who:'Quant', text:'ซิงก์ราคาตลาดเรียบร้อย', kind:'ok'},
      ],
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

  window.OfficeStore = { getState, setState, subscribe, valuation, buy, sell, deposit, startTicker, clock, FX:S.FX };
  window.useOffice = useOffice;

  /* number helpers */
  window.fmt = {
    n:(v,d=2)=>{ if(v==null||isNaN(v)) return '–'; return Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); },
    money:(v,cur,d=2)=>{ const sym=cur==='USD'?'$':'฿'; const s=v<0?'-':''; return s+sym+window.fmt.n(Math.abs(v),d); },
    pct:(v,d=2)=>{ if(v==null||isNaN(v)) return '–'; return (v>=0?'+':'')+window.fmt.n(v,d)+'%'; },
    compact:(v)=>{ const a=Math.abs(v); if(a>=1e12)return (v/1e12).toFixed(2)+'T'; if(a>=1e9)return (v/1e9).toFixed(1)+'B'; if(a>=1e6)return (v/1e6).toFixed(1)+'M'; if(a>=1e3)return (v/1e3).toFixed(1)+'K'; return v.toFixed(0); },
  };
})();


/* ========== js/ui.jsx ========== */
/* ============ SHARED UI ============ */
const { useState:useS, useEffect:useE, useRef:useR } = React;

const RARITY = { legend:['r-legend','LEGENDARY'], epic:['r-epic','EPIC'], rare:['r-rare','RARE'], common:['r-common','COMMON'] };

function Rarity({ r }){ const [c,l]=RARITY[r]||RARITY.common; return <span className={'rarity '+c}>{l}</span>; }

/* Window / panel chrome */
function Win({ title, th, accent, right, children, style, bodyStyle, className, onClose }){
  return (
    <div className={'win'+(accent?' accent-'+accent:'')+(className?' '+className:'')} style={style}>
      <div className="win-h">
        <span className={'ttl'+(th?' th':'')}>{title}</span>
        {right}
        <div className="win-dots">
          <i>_</i>
          <i onClick={onClose}>×</i>
        </div>
      </div>
      <div className="win-b" style={bodyStyle}>{children}</div>
    </div>
  );
}

function Row({ k, v, cls }){
  return <div className="kv"><span className="k">{k}</span><span className={'v '+(cls||'')}>{v}</span></div>;
}

function Bar({ pct, tone }){
  return <div className={'bar'+(tone?' '+tone:'')}><i style={{width:Math.max(0,Math.min(100,pct))+'%'}}></i></div>;
}

function StatusDot({ s }){ return <span className={'sdot s-'+s}></span>; }

/* small pixel avatar built from initials (placeholder until user drops art) */
function Avatar({ agent, size=44, slot }){
  const id = 'agent-'+agent.id;
  return (
    <div style={{width:size,height:size,position:'relative',flex:'none'}}>
      <image-slot id={id} shape="rounded" radius="8"
        placeholder={agent.name}
        style={{width:size+'px',height:size+'px'}}></image-slot>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
        pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:(size/3.6)+'px',color:agent.color,
        textShadow:'0 0 8px '+agent.color+'88'}}>{agent.name[0]}</div>
    </div>
  );
}

/* nav bar */
const NAV = [
  ['dashboard','DASHBOARD','🏠'],
  ['warroom','WARROOM','🛰️'],
  ['portfolio','PORTFOLIO','📈'],
  ['projects','PROJECTS','💼'],
  ['team','TEAM','👥'],
  ['secretary','SECRETARY','💬'],
  ['assets','ASSETS','🗂️'],
  ['settings','SETTINGS','⚙️'],
];
function NavBar(){
  const [s,set]=useOffice();
  const p=s.player;
  const cfg=s.settings||{};
  const logoLetter=(cfg.sysName1||'M').trim()[0]||'M';
  return (
    <div className="nav">
      <div onClick={()=>set({route:'settings'})} title="ตั้งค่าระบบ" style={{display:'flex',alignItems:'center',gap:11,marginRight:14,minWidth:0,cursor:'pointer'}}>
        <div style={{width:38,height:38,borderRadius:9,position:'relative',flex:'none',
          border:'1px solid #2f456e',boxShadow:'0 4px 12px rgba(0,0,0,.4)',overflow:'hidden',
          background:'linear-gradient(135deg,#2f4ea8,#6a4cb8)'}}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
            pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:14,color:'#fff'}}>{logoLetter}</div>
          <image-slot id="sys-logo" shape="rounded" radius="8" placeholder=""
            style={{position:'absolute',inset:0,width:'38px',height:'38px'}}></image-slot>
        </div>
        <div style={{lineHeight:1.2,minWidth:0}}>
          <div style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--white)',letterSpacing:1}}>{cfg.sysName1||'MY'}</div>
          <div style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--cyan)',letterSpacing:1}}>{cfg.sysName2||'OFFICE'}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:4,flex:1}}>
        {NAV.map(([id,lb,ic])=>(
          <div key={id} className={'nav-item'+(s.route===id?' on':'')} onClick={()=>set({route:id})}>
            <span className="ic">{ic}</span><span className="lb">{lb}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:7,fontFamily:'var(--mono)',fontSize:15,color:'var(--gold)'}}>
          <span style={{fontSize:16}}>🪙</span>{fmt.n(p.coins,0)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,fontFamily:'var(--mono)',fontSize:15,color:'var(--purple)'}}>
          <span style={{fontSize:16}}>💎</span>{p.gems}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:42,height:42,borderRadius:9,position:'relative',flex:'none'}}>
            <image-slot id="player-avatar" shape="rounded" radius="8" placeholder="YOU"
              style={{width:'42px',height:'42px'}}></image-slot>
          </div>
          <div style={{lineHeight:1.35}}>
            <div style={{fontFamily:'var(--pixel)',fontSize:9,color:'var(--white)'}}>Lv. {p.level}</div>
            <div style={{width:96,marginTop:3}}><Bar pct={p.xp/p.xpMax*100} tone="purple"/></div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:2}}>{fmt.n(p.xp,0)} / {fmt.n(p.xpMax,0)} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* page header used on inner pages */
function PageHead({ title, th, sub, right }){
  return (
    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:18,flexWrap:'wrap'}}>
      <div>
        <h1 className="title-xl" style={{fontSize:20,letterSpacing:1}}>{title}</h1>
        {sub && <div style={{color:'var(--text-dim)',fontSize:14,marginTop:8,fontFamily:'var(--thai)'}}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* modal */
function Modal({ title, th, onClose, children, width=520 }){
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(4,6,20,.72)',
      backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:width}}>
        <Win title={title} th={th} onClose={onClose} bodyStyle={{padding:18}}>{children}</Win>
      </div>
    </div>
  );
}

function ClassTag({ cls }){
  const map={SET:['#3ce594','SET'],US:['#4db4ff','US'],FUND:['#ffce4a','FUND'],CRYPTO:['#b06bff','CRYPTO']};
  const [c,l]=map[cls]||['#9aa6cf',cls];
  return <span className="chip" style={{color:c,borderColor:c+'55'}}>{l}</span>;
}

Object.assign(window, { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY });


/* ========== js/dashboard.jsx ========== */
/* ============ DASHBOARD / WARROOM ============ */
function Dashboard(){
  const [s,set]=useOffice();
  const v = OfficeStore.valuation();
  const FX = OfficeStore.FX;

  return (
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'288px minmax(0,1fr) 322px',
      gap:12,padding:12,boxSizing:'border-box'}}>
      {/* LEFT RAIL */}
      <div style={{display:'flex',flexDirection:'column',gap:12,minHeight:0,overflow:'auto',paddingRight:2}}>
        <NetWorthPanel v={v}/>
        <AgentsPanel/>
        <QuantBotPanel v={v}/>
      </div>

      {/* CENTER STAGE */}
      <div style={{position:'relative',minHeight:0,display:'flex',flexDirection:'column'}}>
        <div style={{position:'relative',flex:1,minHeight:340}}>
          <image-slot id="office-scene" shape="rounded" radius="12"
            placeholder="วางรูป pixel-art ออฟฟิศที่นี่ (isometric office scene)"
            style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
          <Bubble name="Mira" x="30%" y="20%" color="#ffce4a" text="วันนี้พอร์ตเขียวนะเจ้านาย ☕"/>
          <Bubble name="Quant" x="62%" y="12%" color="#b06bff" text="NVDA +2.5% เฝ้าให้อยู่"/>
          <Bubble name="Devin" x="20%" y="62%" color="#4db4ff" text="กำลังคอมไพล์... 555"/>
        </div>
        {/* bottom floating windows */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12,flex:'none'}}>
          <TradingPanel v={v}/>
          <TeamChatMini/>
        </div>
        
        {/* Gemini Test Panel */}
        <TestGemini />
      </div>

      {/* RIGHT RAIL */}
      <div style={{display:'flex',flexDirection:'column',gap:12,minHeight:0,overflow:'auto',paddingRight:2}}>
        <CompanyStatusPanel v={v}/>
        <CryptoPanel/>
        <LofiPanel/>
      </div>
    </div>
  );
}

function Bubble({ name, x, y, color, text }){
  return (
    <div style={{position:'absolute',left:x,top:y,transform:'translate(-50%,-50%)',maxWidth:180,zIndex:5}}>
      <div style={{background:'rgba(10,16,44,.92)',border:'1px solid '+color,borderRadius:10,padding:'8px 11px',
        boxShadow:'0 0 16px '+color+'55',backdropFilter:'blur(4px)'}}>
        <div style={{fontFamily:'var(--mono)',fontSize:11,color:color,marginBottom:3}}>{name}</div>
        <div contentEditable suppressContentEditableWarning style={{fontSize:13,color:'var(--white)',outline:'none'}}>{text}</div>
      </div>
    </div>
  );
}

function NetWorthPanel({ v }){
  const FX=OfficeStore.FX;
  const totalTHB = v.totalUSD*FX;
  const dayPos = v.dayPnlUSD>=0;
  return (
    <Win title="NET WORTH" th={false} right={<span className="tag" style={{marginRight:6}}>วันนี้</span>}>
      <div style={{fontFamily:'var(--mono)',fontSize:30,color:'var(--gold)',letterSpacing:.5,lineHeight:1}}>
        ฿{fmt.n(totalTHB,2)}
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:17,color:'var(--white)',marginTop:6}}>
        ${fmt.n(v.totalUSD,2)} <span style={{color:'var(--text-mute)',fontSize:12}}>USD</span>
      </div>
      <div style={{fontSize:12,color:'var(--text-mute)',marginTop:6,fontFamily:'var(--mono)'}}>@ {FX} THB/USD · sim</div>
      <div style={{marginTop:10,borderTop:'1px solid rgba(39,66,146,.4)',paddingTop:8}}>
        <Row k="กำไร/ขาดทุนวันนี้" v={fmt.money(v.dayPnlUSD,'USD')} cls={dayPos?'pos':'neg'}/>
        <Row k="เงินสดพร้อมลงทุน" v={fmt.money(v.cashUSD,'USD')}/>
      </div>
    </Win>
  );
}

function AgentsPanel(){
  const [s,set]=useOffice();
  return (
    <Win title="AI AGENTS" right={<span className="win-dots" style={{marginRight:4}}><i onClick={()=>set({route:'team'})}>+</i></span>}>
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        {s.agents.slice(0,6).map(a=>(
          <div key={a.id} onClick={()=>set({route:'team'})} style={{display:'flex',alignItems:'center',gap:9,
            padding:'7px 4px',cursor:'pointer',borderRadius:7}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(40,60,140,.25)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <StatusDot s={a.status}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:'var(--white)',fontSize:14,fontWeight:600}}>{a.name}</div>
              <div style={{color:'var(--text-mute)',fontSize:11,fontFamily:'var(--mono)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.statusTh} · {a.last}</div>
            </div>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:a.color}}>Lv{a.lv}</span>
          </div>
        ))}
      </div>
      <button className="btn ghost sm" style={{width:'100%',marginTop:8}} onClick={()=>set({route:'team'})}>จัดการทีม →</button>
    </Win>
  );
}

function QuantBotPanel({ v }){
  const running=true;
  return (
    <Win title="QUANT BOT" accent="purple">
      <Row k="ROI รวม" v={fmt.pct(v.unrealPct)} cls={v.unrealPct>=0?'pos':'neg'}/>
      <Row k="กำไรลอยตัว" v={fmt.money(v.unrealUSD,'USD')} cls={v.unrealUSD>=0?'pos':'neg'}/>
      <Row k="มูลค่าถือครอง" v={fmt.money(v.mvUSD,'USD')}/>
      <Row k="จำนวนสินทรัพย์" v={v.rows.length+' รายการ'}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,
        paddingTop:8,borderTop:'1px solid rgba(39,66,146,.4)'}}>
        <span className="k" style={{color:'var(--text-dim)',fontSize:13}}>สถานะ</span>
        <span style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--green)',textShadow:'0 0 10px rgba(60,229,148,.6)'}}>RUNNING</span>
      </div>
    </Win>
  );
}

function CompanyStatusPanel({ v }){
  const FX=OfficeStore.FX;
  const realizedUSD = v && (OfficeStore.getState().realized.usd + OfficeStore.getState().realized.thb/FX);
  const totalPnl = v.unrealUSD + realizedUSD;
  return (
    <Win title="COMPANY STATUS">
      <Row k="Realized PnL" v={fmt.money(realizedUSD,'USD')} cls={realizedUSD>=0?'pos':'neg'}/>
      <Row k="Total PnL" v={fmt.money(totalPnl,'USD')} cls={totalPnl>=0?'pos':'neg'}/>
      <Row k="Net Worth" v={fmt.money(v.totalUSD,'USD')} cls="gold"/>
      <Row k="Holdings" v={fmt.money(v.mvUSD,'USD')}/>
      <Row k="Cash" v={fmt.money(v.cashUSD,'USD')}/>
      <Row k="วันนี้" v={fmt.money(v.dayPnlUSD,'USD')} cls={v.dayPnlUSD>=0?'pos':'neg'}/>
      <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:8}}>อัปเดต {new Date().toTimeString().slice(0,5)}</div>
    </Win>
  );
}

function CryptoPanel(){
  const [s]=useOffice();
  const cryptos = Object.values(s.market).filter(m=>m.cls==='CRYPTO');
  return (
    <Win title="CRYPTO PRICES" style={{minHeight:0}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:'2px 12px',fontFamily:'var(--mono)',fontSize:13}}>
        <div style={{color:'var(--text-mute)',fontSize:11}}>เหรียญ</div>
        <div style={{color:'var(--text-mute)',fontSize:11,textAlign:'right'}}>ราคา</div>
        <div style={{color:'var(--text-mute)',fontSize:11,textAlign:'right'}}>24ชม</div>
        {cryptos.map(m=>{
          const ch=(m.price-m.prevClose)/m.prevClose*100;
          return (
            <React.Fragment key={m.symbol}>
              <div style={{color:'var(--white)',padding:'4px 0'}}>{m.symbol}</div>
              <div style={{textAlign:'right',color:'var(--text)'}}>${fmt.n(m.price, m.price<1?4:2)}</div>
              <div style={{textAlign:'right',color:ch>=0?'var(--green)':'var(--red)'}}>{fmt.pct(ch,1)}</div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:8}}>อัปเดต {new Date().toTimeString().slice(0,5)} · live</div>
    </Win>
  );
}

const TRACKS=['Pixel Rain','Midnight Build','Neon Focus','Lo-Fi Ledger','8-bit Dreams'];
function LofiPanel(){
  const [playing,setPlaying]=useS(true);
  const [pos,setPos]=useS(105);
  const [ti,setTi]=useS(0);
  const len=210;
  useE(()=>{
    if(!playing) return;
    const id=setInterval(()=>setPos(p=>{ if(p>=len){ setTi(t=>(t+1)%TRACKS.length); return 0;} return p+1; }),1000);
    return ()=>clearInterval(id);
  },[playing]);
  const mmss=x=>Math.floor(x/60)+':'+String(x%60).padStart(2,'0');
  return (
    <Win title="LOFI BEATS TO CODE" accent="purple">
      <div style={{display:'flex',gap:11,alignItems:'center'}}>
        <div style={{width:50,height:50,borderRadius:9,background:'linear-gradient(135deg,#6a4cb8,#2f4ea8)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flex:'none',
          boxShadow:'0 4px 12px rgba(0,0,0,.4)'}}>🎧</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,color:'var(--text-mute)',fontFamily:'var(--mono)'}}>Now Playing</div>
          <div style={{fontSize:15,color:'var(--white)',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{TRACKS[ti]}</div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',marginTop:2}}>{mmss(pos)} / {mmss(len)}</div>
        </div>
      </div>
      <div style={{marginTop:9}}><Bar pct={pos/len*100} tone="purple"/></div>
      <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:10,fontSize:18,color:'var(--text-dim)'}}>
        <span style={{cursor:'pointer'}} onClick={()=>setTi(t=>(t+TRACKS.length-1)%TRACKS.length)}>⏮</span>
        <span style={{cursor:'pointer',color:'var(--cyan)'}} onClick={()=>setPlaying(p=>!p)}>{playing?'⏸':'▶'}</span>
        <span style={{cursor:'pointer'}} onClick={()=>{setTi(t=>(t+1)%TRACKS.length);setPos(0);}}>⏭</span>
      </div>
    </Win>
  );
}

function TradingPanel({ v }){
  const [s,set]=useOffice();
  const today=v.dayPnlUSD;
  const wins=v.rows.filter(r=>r.dayPnl>=0).length, losses=v.rows.length-wins;
  return (
    <Win title="V2 TRADING" right={<span className="tag" style={{marginRight:6}}>sim</span>}>
      <Row k="PnL วันนี้" v={fmt.money(today,'USD')} cls={today>=0?'pos':'neg'}/>
      <Row k="กำไรลอยตัว" v={fmt.money(v.unrealUSD,'USD')} cls={v.unrealUSD>=0?'pos':'neg'}/>
      <Row k="W / L วันนี้" v={wins+'W / '+losses+'L · '+(v.rows.length?Math.round(wins/v.rows.length*100):0)+'%'}/>
      <div style={{marginTop:8,fontFamily:'var(--pixel)',fontSize:9,color:'var(--text-dim)',letterSpacing:.5}}>
        OPEN POSITIONS ({v.rows.length})
      </div>
      <button className="btn sm" style={{width:'100%',marginTop:8}} onClick={()=>set({route:'portfolio'})}>เปิดพอร์ต →</button>
    </Win>
  );
}

function TeamChatMini(){
  const [s,set]=useOffice();
  const [txt,setTxt]=useS('');
  const boxRef=useR(null);
  useE(()=>{ if(boxRef.current) boxRef.current.scrollTop=boxRef.current.scrollHeight; },[s.teamChat.length]);
  const send=()=>{
    const t=txt.trim(); if(!t) return;
    OfficeStore.setState(st=>({...st, teamChat:[...st.teamChat,{who:'you',text:t,t:OfficeStore.clock()}]}),{now:true});
    setTxt('');
    setTimeout(()=>{
      const a=s.agents[Math.floor(Math.random()*4)];
      const reps=['รับทราบครับเจ้านาย!','จัดให้เลย 💪','โอเค เดี๋ยวลุยต่อ','555 ได้เลย','กำลังทำอยู่นะ'];
      OfficeStore.setState(st=>({...st, teamChat:[...st.teamChat,{who:a.id,text:reps[Math.floor(Math.random()*reps.length)],t:OfficeStore.clock()}]}),{now:true});
    },700);
  };
  const nameOf=id=>id==='you'?'คุณ':(s.agents.find(a=>a.id===id)?.name||id);
  const colOf=id=>id==='you'?'var(--cyan)':(s.agents.find(a=>a.id===id)?.color||'var(--text-dim)');
  return (
    <Win title="TEAM CHAT" bodyStyle={{padding:0,display:'flex',flexDirection:'column'}}>
      <div ref={boxRef} style={{flex:1,overflow:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:7,maxHeight:130}}>
        {s.teamChat.map((m,i)=>(
          <div key={i} style={{fontSize:13,lineHeight:1.4}}>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:colOf(m.who)}}>{nameOf(m.who)}: </span>
            <span style={{color:'var(--text)'}}>{m.text}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:7,padding:'9px 11px',borderTop:'1px solid var(--line)'}}>
        <input className="fld" placeholder="พิมพ์ข้อความ..." value={txt}
          onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{padding:'8px 10px',fontSize:13}}/>
        <button className="btn sm" onClick={send}>▶</button>
      </div>
    </Win>
  );
}

window.Dashboard = Dashboard;
Object.assign(window, { NetWorthPanel, AgentsPanel, QuantBotPanel, CompanyStatusPanel, CryptoPanel, LofiPanel, TradingPanel, TeamChatMini, Bubble });


/* ========== js/warroom.jsx ========== */
/* ============ WARROOM · IMMERSIVE ISOMETRIC OFFICE ============ */
function WarRoom(){
  const [s,set]=useOffice();
  const [bubbles,setBubbles]=useS({});   // ephemeral speech {agentId:text}
  const [open,setOpen]=useS(null);        // popover agent id
  const [cmd,setCmd]=useS('');
  const [place,setPlace]=useS(false);     // place-characters mode
  const [drag,setDrag]=useS(null);        // {id} being dragged
  const [live,setLive]=useS(null);        // {id,x,y} live drag pos
  const [clock,setClock]=useS(nowHM());
  const stageRef=useR(null);

  useE(()=>{ const id=setInterval(()=>setClock(nowHM()),30000); return ()=>clearInterval(id); },[]);

  // ambient thoughts
  useE(()=>{
    if(place) return;
    const id=setInterval(()=>{
      const a=s.agents[Math.floor(Math.random()*s.agents.length)];
      popBubble(a.id, IDLE_THOUGHTS[Math.floor(Math.random()*IDLE_THOUGHTS.length)]);
    }, 5000);
    return ()=>clearInterval(id);
  },[s.agents.length, place]);

  function popBubble(id,text){
    setBubbles(b=>({...b,[id]:text}));
    setTimeout(()=>setBubbles(b=>{ const n={...b}; if(n[id]===text) delete n[id]; return n; }), 4200);
  }

  const broadcast=()=>{
    const t=cmd.trim(); if(!t) return;
    OfficeStore.setState(st=>({...st,
      teamChat:[...st.teamChat,{who:'you',text:'📢 '+t,t:OfficeStore.clock()}],
      log:[{t:OfficeStore.clock(),who:'You',text:'สั่งงานรวม: '+t,kind:'sys'},...st.log].slice(0,40),
    }),{now:true});
    s.agents.forEach((a,i)=>setTimeout(()=>popBubble(a.id, ACK[Math.floor(Math.random()*ACK.length)]), 200+i*160));
    setCmd('');
  };

  /* ----- drag handling ----- */
  const pos=(id)=> (live&&live.id===id) ? live : (s.warroomPos[id]||{x:50,y:50});
  function onDown(e,id){
    if(!place) return;
    e.preventDefault(); e.stopPropagation();
    setDrag({id});
    setLive({id, ...(s.warroomPos[id]||{x:50,y:50})});
  }
  function onMove(e){
    if(!drag) return;
    const r=stageRef.current.getBoundingClientRect();
    const x=Math.max(4,Math.min(96,((e.clientX-r.left)/r.width)*100));
    const y=Math.max(10,Math.min(96,((e.clientY-r.top)/r.height)*100));
    setLive({id:drag.id,x,y});
  }
  function onUp(){
    if(drag&&live){ OfficeStore.setState(st=>({...st,warroomPos:{...st.warroomPos,[live.id]:{x:live.x,y:live.y}}}),{now:true}); }
    setDrag(null); setLive(null);
  }

  return (
    <div style={{height:'100%',position:'relative',overflow:'hidden'}}
      ref={stageRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>

      {/* ===== ROOM BACKDROP ===== */}
      <image-slot id="office-scene" shape="rect"
        placeholder="วางรูปห้องออฟฟิศ isometric ที่นี่ (พื้นไม้ · หน้าต่าง · โต๊ะทำงาน — เต็มห้อง)"
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(120% 90% at 50% 18%, transparent 40%, rgba(6,8,14,.72) 100%)'}}></div>

      {/* ===== CHARACTER TOKENS ===== */}
      {s.agents.map(a=>{
        const p=pos(a.id);
        return <CharToken key={a.id} a={a} x={p.x} y={p.y} bubble={bubbles[a.id]} place={place}
          dragging={drag&&drag.id===a.id}
          onDown={e=>onDown(e,a.id)} onClick={()=>{ if(!place) setOpen(a.id); }}/>;
      })}

      {/* ===== TOP TOOLBAR ===== */}
      <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:30,
        display:'flex',alignItems:'center',gap:14,padding:'8px 14px',borderRadius:11,
        background:'rgba(12,15,24,.82)',border:'1px solid var(--line-bright)',backdropFilter:'blur(6px)',
        boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>
        <span style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--cyan)',letterSpacing:1.5,textShadow:'0 0 8px rgba(70,182,255,.4)'}}>WARROOM</span>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--white)'}}>🕐 {clock}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--green)'}}>🟢 {s.agents.filter(a=>a.status!=='idle').length}/{s.agents.length}</span>
        <button className={'btn sm '+(place?'green':'ghost')} onClick={()=>setPlace(p=>!p)} style={{whiteSpace:'nowrap'}}>
          {place?'✓ เสร็จแล้ว':'🧩 จัดวางตัวละคร'}
        </button>
      </div>

      {/* place-mode hint */}
      {place &&
        <div style={{position:'absolute',top:58,left:'50%',transform:'translateX(-50%)',zIndex:30,
          fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',background:'rgba(12,15,24,.8)',
          padding:'5px 12px',borderRadius:8,border:'1px solid var(--line)'}}>
          ลากตัวละครไปวางตำแหน่งบนโต๊ะในห้องได้เลย
        </div>}

      {/* ===== ORDER BAR ===== */}
      <div style={{position:'absolute',left:'50%',bottom:12,transform:'translateX(-50%)',zIndex:30,
        display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:11,width:'min(560px,86%)',
        background:'rgba(12,15,24,.86)',border:'1px solid var(--line)',backdropFilter:'blur(6px)'}}>
        <span style={{fontFamily:'var(--pixel)',fontSize:8,color:'var(--cyan)',letterSpacing:1,flex:'none'}}>ORDER ALL ▸</span>
        <input className="fld" placeholder="ออกคำสั่งให้ทุกคนในออฟฟิศ..." value={cmd}
          onChange={e=>setCmd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&broadcast()} style={{padding:'8px 11px',fontSize:13}}/>
        <button className="btn sm" onClick={broadcast}>📢</button>
      </div>

      {open && <DeskPopover agent={s.agents.find(a=>a.id===open)} onClose={()=>setOpen(null)}
        onAssigned={txt=>popBubble(open,txt)}/>}
    </div>
  );
}

function nowHM(){ return new Date().toTimeString().slice(0,5); }
const IDLE_THOUGHTS=['☕','พิมพ์ๆ...','📊','อืม น่าสน','เกือบเสร็จละ','555','focus 🎧','เช็คตลาดแป๊บ','📝','✦'];
const ACK=['รับทราบ! 💪','จัดให้เลย','โอเค ลุยต่อ','555 ได้เลย','กำลังทำ ✦','เคลียร์ทันที'];

/* floating glass panel positioner (legacy) */
function Float({ x, y, w, children }){
  const st={position:'absolute',width:w,zIndex:18};
  if(x==='left') st.left=10; else st.right=10;
  if(y==='top') st.top=10;
  else if(y==='mid') st.top=190;
  else if(y==='mid2') st.top=176;
  else if(y==='bot') st.bottom=10;
  return <div style={st}>{children}</div>;
}

/* ---- speech bubble ---- */
function Speech({ text, color }){
  if(!text) return null;
  return (
    <div className="wr-speech" style={{borderColor:(color||'#46b6ff')+'aa'}}>
      {text}
      <span className="wr-speech-tail"></span>
    </div>
  );
}

/* ---- draggable character token ---- */
function CharToken({ a, x, y, bubble, place, dragging, onDown, onClick }){
  return (
    <div onPointerDown={onDown} onClick={onClick}
      style={{position:'absolute',left:x+'%',top:y+'%',transform:'translate(-50%,-100%)',zIndex:dragging?40:10,
        cursor:place?'grab':'pointer',userSelect:'none',touchAction:'none',
        filter:dragging?'drop-shadow(0 10px 16px rgba(0,0,0,.6))':'none',transition:dragging?'none':'filter .1s'}}>
      <Speech text={place?null:bubble} color={a.color}/>

      {/* character */}
      <div style={{position:'relative',width:74,height:84,margin:'0 auto'}}>
        <div style={{position:'absolute',left:'50%',bottom:0,transform:'translateX(-50%)',width:60,height:12,
          background:'radial-gradient(ellipse,rgba(0,0,0,.5),transparent 70%)',borderRadius:'50%'}}></div>
        <div style={{position:'absolute',inset:0,bottom:8,display:'flex',alignItems:'center',justifyContent:'center',
          pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:26,color:a.color,textShadow:'0 0 12px '+a.color+'66'}}>{a.name[0]}</div>
        <image-slot id={'agent-'+a.id} shape="rect"
          style={{position:'absolute',left:0,right:0,top:0,bottom:8,width:'74px',height:'76px',
            border:place?'1.5px dashed '+a.color:'none',background:place?'rgba(10,14,24,.4)':'transparent'}}></image-slot>
        <span className={'sdot s-'+a.status} style={{position:'absolute',right:6,top:2,width:11,height:11,border:'2px solid #0c0f18'}}></span>
      </div>

      {/* nameplate */}
      <div style={{marginTop:2,padding:'2px 8px',borderRadius:7,background:'rgba(12,15,24,.9)',
        border:'1px solid '+a.color+'55',textAlign:'center',whiteSpace:'nowrap'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--white)'}}>{a.name}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:10,color:a.color,marginLeft:5}}>Lv{a.lv}</span>
      </div>
    </div>
  );
}

/* ---- popover: assign task / set status / chat ---- */
function DeskPopover({ agent, onClose, onAssigned }){
  const [task,setTask]=useS(agent.task||'');
  const [,set]=useOffice();
  const upd=patch=>OfficeStore.setState(st=>({...st,agents:st.agents.map(x=>x.id===agent.id?{...x,...patch}:x)}),{now:true});
  const assign=()=>{
    const t=task.trim(); if(!t) return;
    upd({task:t,status:'working',statusTh:t,last:'เมื่อสักครู่'});
    OfficeStore.setState(st=>({...st,
      teamChat:[...st.teamChat,{who:'you',text:'@'+agent.name+' '+t,t:OfficeStore.clock()},
        {who:agent.id,text:ACK[Math.floor(Math.random()*ACK.length)],t:OfficeStore.clock()}],
      log:[{t:OfficeStore.clock(),who:agent.name,text:'รับงาน: '+t,kind:'ok'},...st.log].slice(0,40),
    }),{now:true});
    onAssigned&&onAssigned(ACK[Math.floor(Math.random()*ACK.length)]);
    onClose();
  };
  return (
    <Modal title={agent.roleEn+' · '+agent.name} onClose={onClose} width={460}>
      <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:14}}>
        <div style={{width:64,height:70,borderRadius:12,position:'relative',overflow:'hidden',flex:'none',
          border:'2px solid '+agent.color+'66',background:'linear-gradient(160deg,#1b2236,#10141f)'}}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
            pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:24,color:agent.color}}>{agent.name[0]}</div>
          <image-slot id={'agent-'+agent.id} shape="rounded" radius="12"
            style={{position:'absolute',inset:0,width:'64px',height:'70px'}}></image-slot>
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Rarity r={agent.rarity}/>
            <span style={{fontFamily:'var(--mono)',fontSize:12,color:agent.color}}>Lv{agent.lv}</span>
          </div>
          <div style={{fontSize:13,color:'var(--text-dim)',marginTop:6,lineHeight:1.5}}>{agent.roleTh}</div>
          <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
            <span className={'sdot s-'+agent.status}></span>
            <span style={{fontSize:12,color:'var(--text)'}}>{agent.statusTh}</span>
          </div>
        </div>
      </div>
      <label className="lbl">มอบหมายงาน</label>
      <textarea className="fld" rows="2" placeholder={'สั่งงาน '+agent.name+'...'} value={task}
        onChange={e=>setTask(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) assign(); }}/>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',alignSelf:'center'}}>สถานะ:</span>
        {[['working','ทำงาน','#3ce594'],['thinking','คิดอยู่','#46b6ff'],['idle','ว่าง','#9aa6cf']].map(([st,lb,c])=>(
          <button key={st} className={'btn sm '+(agent.status===st?'':'ghost')}
            onClick={()=>upd({status:st,statusTh:lb})} style={{flex:1,color:agent.status===st?'#0b0e16':c}}>{lb}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginTop:16}}>
        <button className="btn green" style={{flex:1}} onClick={assign}>มอบหมายงาน</button>
        <button className="btn ghost" onClick={()=>{ onClose(); set({route:'team'}); }}>ดูโปรไฟล์</button>
      </div>
    </Modal>
  );
}

window.WarRoom = WarRoom;


/* ========== js/portfolio.jsx ========== */
/* ============ PORTFOLIO (tabbed) ============ */
function Portfolio(){
  const [tab,setTab]=useS('sim');
  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <div style={{display:'flex',gap:8,marginBottom:18,padding:5,borderRadius:11,
        background:'rgba(8,10,18,.6)',border:'1px solid var(--line)',width:'fit-content'}}>
        <button className={'pf-tab'+(tab==='sim'?' on':'')} onClick={()=>setTab('sim')}>
          🧪 จำลอง <span style={{opacity:.7,fontSize:11}}>· Simulate</span>
        </button>
        <button className={'pf-tab'+(tab==='live'?' on':'')} onClick={()=>setTab('live')}>
          ⚡ ลงทุนจริง <span style={{opacity:.7,fontSize:11}}>· Live</span>
        </button>
      </div>
      {tab==='sim' ? <SimPortfolio/> : <LiveTrading/>}
    </div>
  );
}

/* ============ SIMULATED PORTFOLIO ============ */
function SimPortfolio(){
  const [s,set]=useOffice();
  const v=OfficeStore.valuation();
  const FX=OfficeStore.FX;
  const [filter,setFilter]=useS('ALL');
  const [trade,setTrade]=useS(null); // {sym, side}
  const [depo,setDepo]=useS(false);

  const realizedUSD = s.realized.usd + s.realized.thb/FX;
  const list = Object.values(s.market).filter(m=>filter==='ALL'||m.cls===filter);

  return (
    <div>
      <PageHead title="พอร์ตจำลอง" sub="ฝึกลงทุนด้วยเงินจำลอง · ราคาขยับเรียลไทม์ทุก 2 วินาที"
        right={<div style={{display:'flex',gap:10}}>
          <button className="btn gold" onClick={()=>setDepo(true)}>＋ เติมเงิน</button>
        </div>}/>

      {/* summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <SumCard label="มูลค่ารวม (Net Worth)" main={'฿'+fmt.n(v.totalUSD*FX,0)} sub={'$'+fmt.n(v.totalUSD,2)} tone="gold"/>
        <SumCard label="กำไรลอยตัว (Unrealized)" main={fmt.money(v.unrealUSD,'USD')} sub={fmt.pct(v.unrealPct)} tone={v.unrealUSD>=0?'pos':'neg'}/>
        <SumCard label="กำไรที่ขายแล้ว (Realized)" main={fmt.money(realizedUSD,'USD')} sub={'฿'+fmt.n(realizedUSD*FX,0)} tone={realizedUSD>=0?'pos':'neg'}/>
        <SumCard label="เงินสดพร้อมลงทุน" main={'฿'+fmt.n(s.cash.thb,0)} sub={'$'+fmt.n(s.cash.usd,2)} tone="cyan"/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(0,1fr)',gap:14,alignItems:'start'}}>
        {/* holdings */}
        <Win title="MY HOLDINGS" th={false} right={<span className="tag" style={{marginRight:6}}>{v.rows.length} รายการ</span>}>
          {v.rows.length===0 && <div className="empty">ยังไม่มีสินทรัพย์ — เลือกซื้อจากตลาดด้านขวา</div>}
          {v.rows.length>0 &&
          <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--mono)',fontSize:13}}>
            <thead><tr style={{color:'var(--text-mute)',fontSize:11,textAlign:'right'}}>
              <th style={{textAlign:'left',padding:'6px 4px'}}>สินทรัพย์</th>
              <th>ถือ</th><th>ราคา</th><th>มูลค่า</th><th>กำไร/ขาดทุน</th><th></th>
            </tr></thead>
            <tbody>
              {v.rows.map(r=>(
                <tr key={r.symbol} style={{borderTop:'1px solid rgba(39,66,146,.35)'}}>
                  <td style={{padding:'9px 4px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{color:'var(--white)',fontWeight:600}}>{r.symbol}</div>
                        <div style={{fontFamily:'var(--thai)',fontSize:11,color:'var(--text-mute)'}}>{r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{textAlign:'right',color:'var(--text)'}}>{fmt.n(r.qty, r.qty<1?4:0)}</td>
                  <td style={{textAlign:'right'}}>
                    <div style={{color:'var(--white)'}}>{r.cur==='USD'?'$':'฿'}{fmt.n(r.price, r.price<1?4:2)}</div>
                    <div style={{fontSize:11,color:r.dayPct>=0?'var(--green)':'var(--red)'}}>{fmt.pct(r.dayPct,2)}</div>
                  </td>
                  <td style={{textAlign:'right',color:'var(--text)'}}>{r.cur==='USD'?'$':'฿'}{fmt.n(r.mv,0)}</td>
                  <td style={{textAlign:'right'}}>
                    <div style={{color:r.pnl>=0?'var(--green)':'var(--red)'}}>{fmt.money(r.pnl,r.cur,0)}</div>
                    <div style={{fontSize:11,color:r.pnl>=0?'var(--green)':'var(--red)'}}>{fmt.pct(r.pnlPct,1)}</div>
                  </td>
                  <td style={{textAlign:'right',paddingLeft:8}}>
                    <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                      <button className="btn green sm" onClick={()=>setTrade({sym:r.symbol,side:'buy'})}>+</button>
                      <button className="btn red sm" onClick={()=>setTrade({sym:r.symbol,side:'sell'})}>−</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>}
          <TxnLog/>
        </Win>

        {/* market */}
        <Win title="MARKET" th={false}>
          <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {['ALL','SET','US','FUND','CRYPTO'].map(f=>(
              <button key={f} className={'btn sm '+(filter===f?'':'ghost')} onClick={()=>setFilter(f)}>{f==='ALL'?'ทั้งหมด':f}</button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:2,maxHeight:560,overflow:'auto'}}>
            {list.map(m=>{
              const ch=(m.price-m.prevClose)/m.prevClose*100;
              return (
                <div key={m.symbol} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderRadius:7}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(40,60,140,.2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <ClassTag cls={m.cls}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:'var(--white)',fontWeight:600,fontSize:14}}>{m.symbol}</div>
                    <div style={{fontSize:11,color:'var(--text-mute)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
                  </div>
                  <div style={{textAlign:'right',fontFamily:'var(--mono)'}}>
                    <div style={{color:'var(--white)',fontSize:14}}>{m.cur==='USD'?'$':'฿'}{fmt.n(m.price, m.price<1?4:2)}</div>
                    <div style={{fontSize:11,color:ch>=0?'var(--green)':'var(--red)'}}>{fmt.pct(ch,2)}</div>
                  </div>
                  <button className="btn green sm" onClick={()=>setTrade({sym:m.symbol,side:'buy'})}>ซื้อ</button>
                </div>
              );
            })}
          </div>
        </Win>
      </div>

      {trade && <TradeModal sym={trade.sym} side={trade.side} onClose={()=>setTrade(null)}/>}
      {depo && <DepositModal onClose={()=>setDepo(false)}/>}
    </div>
  );
}

function SumCard({ label, main, sub, tone }){
  const colMap={gold:'var(--gold)',pos:'var(--green)',neg:'var(--red)',cyan:'var(--cyan)'};
  return (
    <div className="win" style={{padding:'14px 15px'}}>
      <div style={{fontFamily:'var(--pixel2)',fontSize:11,color:'var(--text-dim)',letterSpacing:.5,marginBottom:8}}>{label}</div>
      <div style={{fontFamily:'var(--mono)',fontSize:24,color:colMap[tone]||'var(--white)',lineHeight:1}}>{main}</div>
      <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-mute)',marginTop:6}}>{sub}</div>
    </div>
  );
}

function TxnLog(){
  const [s]=useOffice();
  if(!s.txns.length) return null;
  return (
    <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid var(--line)'}}>
      <div style={{fontFamily:'var(--pixel2)',fontSize:11,color:'var(--text-dim)',marginBottom:8,letterSpacing:.5}}>ประวัติการเทรด</div>
      <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:140,overflow:'auto',fontFamily:'var(--mono)',fontSize:12}}>
        {s.txns.map((t,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{color:'var(--text-mute)'}}>{t.t}</span>
            <span style={{color:t.type==='BUY'?'var(--green)':'var(--red)',width:34}}>{t.type==='BUY'?'ซื้อ':'ขาย'}</span>
            <span style={{color:'var(--white)',flex:1}}>{t.sym} ×{fmt.n(t.qty,t.qty<1?4:0)} @ {t.cur==='USD'?'$':'฿'}{fmt.n(t.price,2)}</span>
            {t.pnl!=null && <span style={{color:t.pnl>=0?'var(--green)':'var(--red)'}}>{fmt.money(t.pnl,t.cur,0)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeModal({ sym, side, onClose }){
  const [s]=useOffice();
  const m=s.market[sym];
  const held=s.holdings.find(h=>h.symbol===sym);
  const [mode,setMode]=useS(side);
  const [qty,setQty]=useS(m.cls==='CRYPTO'?'0.01':'1');
  const [err,setErr]=useS('');
  const q=parseFloat(qty)||0;
  const cost=m.price*q;
  const ccy=m.cur==='USD'?'usd':'thb';
  const cash=s.cash[ccy];
  const go=()=>{
    const r= mode==='buy'? OfficeStore.buy(sym,q) : OfficeStore.sell(sym,q);
    if(!r.ok){ setErr(r.msg); return; }
    onClose();
  };
  return (
    <Modal title={(mode==='buy'?'ซื้อ ':'ขาย ')+sym} onClose={onClose} width={440}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div>
          <div style={{color:'var(--white)',fontSize:17,fontWeight:700}}>{m.name}</div>
          <div style={{marginTop:5}}><ClassTag cls={m.cls}/></div>
        </div>
        <div style={{textAlign:'right',fontFamily:'var(--mono)'}}>
          <div style={{color:'var(--white)',fontSize:22}}>{m.cur==='USD'?'$':'฿'}{fmt.n(m.price,m.price<1?4:2)}</div>
          <div style={{fontSize:12,color:'var(--text-mute)'}}>ราคาตลาด · {m.cur}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <button className={'btn '+(mode==='buy'?'green':'ghost')} style={{flex:1}} onClick={()=>{setMode('buy');setErr('');}}>ซื้อ</button>
        <button className={'btn '+(mode==='sell'?'red':'ghost')} style={{flex:1}} onClick={()=>{setMode('sell');setErr('');}}>ขาย</button>
      </div>
      <label className="lbl">จำนวน{held?' · ถืออยู่ '+fmt.n(held.qty,held.qty<1?4:0):''}</label>
      <input className="fld" type="number" value={qty} onChange={e=>{setQty(e.target.value);setErr('');}} step="any" min="0"/>
      <div style={{display:'flex',gap:6,marginTop:8}}>
        {(m.cls==='CRYPTO'?[0.01,0.05,0.1]:[1,5,10,50]).map(x=>(
          <button key={x} className="btn ghost sm" onClick={()=>setQty(String(x))}>{x}</button>
        ))}
        {mode==='sell'&&held&&<button className="btn ghost sm" onClick={()=>setQty(String(held.qty))}>ทั้งหมด</button>}
      </div>
      <div style={{marginTop:16,padding:'12px 14px',background:'rgba(6,10,30,.6)',borderRadius:8,border:'1px solid var(--line)'}}>
        <Row k="มูลค่ารวม" v={(m.cur==='USD'?'$':'฿')+fmt.n(cost,2)} cls="gold"/>
        <Row k="เงินสดคงเหลือ" v={(m.cur==='USD'?'$':'฿')+fmt.n(cash,2)}/>
      </div>
      {err && <div style={{color:'var(--red)',fontSize:13,marginTop:10,fontFamily:'var(--mono)'}}>⚠ {err}</div>}
      <button className={'btn '+(mode==='buy'?'green':'red')} style={{width:'100%',marginTop:16}} onClick={go} disabled={q<=0}>
        ยืนยัน{mode==='buy'?'ซื้อ':'ขาย'} {sym}
      </button>
    </Modal>
  );
}

function DepositModal({ onClose }){
  const [ccy,setCcy]=useS('thb');
  const [amt,setAmt]=useS('100000');
  return (
    <Modal title="เติมเงินเข้าพอร์ต" onClose={onClose} width={420}>
      <p style={{color:'var(--text-dim)',fontSize:13,marginTop:0}}>เติมเงินสดจำลองเข้าพอร์ตเพื่อใช้ฝึกลงทุน</p>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button className={'btn '+(ccy==='thb'?'gold':'ghost')} style={{flex:1}} onClick={()=>setCcy('thb')}>บาท ฿</button>
        <button className={'btn '+(ccy==='usd'?'gold':'ghost')} style={{flex:1}} onClick={()=>setCcy('usd')}>ดอลลาร์ $</button>
      </div>
      <label className="lbl">จำนวนเงิน</label>
      <input className="fld" type="number" value={amt} onChange={e=>setAmt(e.target.value)}/>
      <div style={{display:'flex',gap:6,marginTop:8}}>
        {(ccy==='thb'?[10000,50000,100000,500000]:[1000,5000,10000]).map(x=>(
          <button key={x} className="btn ghost sm" onClick={()=>setAmt(String(x))}>{fmt.compact(x)}</button>
        ))}
      </div>
      <button className="btn gold" style={{width:'100%',marginTop:18}} onClick={()=>{OfficeStore.deposit(ccy,parseFloat(amt)||0);onClose();}}>
        เติม {(ccy==='thb'?'฿':'$')+fmt.n(parseFloat(amt)||0,0)}
      </button>
    </Modal>
  );
}

/* ============ LIVE TRADING (future · TradingView bot) ============ */
function LiveTrading(){
  const [s]=useOffice();
  const L=s.live;
  const upd=patch=>OfficeStore.setState(st=>({...st,live:{...st.live,...patch}}),{now:true});
  const webhook='https://my-office.app/hook/'+(L.apiKey? L.apiKey.slice(0,6).toLowerCase():'xxxxxx')+'-tv';
  const canConnect = L.apiKey.trim().length>6 && L.apiSecret.trim().length>6;

  return (
    <div>
      <PageHead title="ลงทุนจริง · LIVE" sub="เชื่อม TradingView เพื่อรันบอทเทรดอัตโนมัติ — ส่วนนี้กำลังพัฒนา ตั้งค่าล่วงหน้าได้"
        right={<span className="chip" style={{padding:'6px 11px',
          color:L.connected?'var(--green)':'var(--gold)',
          borderColor:(L.connected?'var(--green)':'var(--gold)')+'66'}}>
          <span className={'sdot s-'+(L.connected?'working':'idle')} style={{marginRight:2}}></span>
          {L.connected?'เชื่อมต่อแล้ว (Paper)':'ยังไม่เชื่อมต่อ'}
        </span>}/>

      {/* roadmap banner */}
      <div className="win" style={{flexDirection:'row',alignItems:'center',gap:16,padding:'14px 18px',marginBottom:16,
        borderColor:'rgba(157,107,255,.4)'}}>
        <div style={{fontSize:26}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:15,color:'var(--white)'}}>โหมดเทรดอัตโนมัติ (Coming Soon)</div>
          <div style={{fontSize:13,color:'var(--text-dim)',marginTop:4,lineHeight:1.5}}>
            ตั้งค่า API + สัญญาณจาก TradingView ไว้ล่วงหน้า เมื่อระบบพร้อม บอทจะรับ alert แล้วส่งคำสั่งซื้อขายจริงให้อัตโนมัติ
          </div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',maxWidth:200,justifyContent:'flex-end'}}>
          {['Webhook','Risk Guard','Paper→Live','Backtest'].map(x=>
            <span key={x} className="chip" style={{fontSize:10}}>{x}</span>)}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:14,alignItems:'start'}}>

        {/* CONNECT */}
        <Win title="CONNECT · เชื่อมต่อ" accent="purple" bodyStyle={{padding:16}}>
          <label className="lbl">Exchange / Broker</label>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {['Binance','Bybit','OKX','MT5'].map(x=>(
              <button key={x} className={'btn sm '+(L.exchange===x?'':'ghost')} onClick={()=>upd({exchange:x})}>{x}</button>
            ))}
          </div>

          <label className="lbl">API Key</label>
          <input className="fld" placeholder="วาง API Key ของคุณ" value={L.apiKey} onChange={e=>upd({apiKey:e.target.value})}/>
          <label className="lbl" style={{marginTop:11}}>API Secret</label>
          <input className="fld" type="password" placeholder="••••••••••••" value={L.apiSecret} onChange={e=>upd({apiSecret:e.target.value})}/>
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6}}>🔒 เก็บไว้ในเครื่องนี้เท่านั้น · ยังไม่ส่งออกจริง</div>

          <label className="lbl" style={{marginTop:14}}>TradingView Webhook URL</label>
          <div style={{display:'flex',gap:6}}>
            <input className="fld" readOnly value={webhook} style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)'}}/>
            <button className="btn ghost sm" onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(webhook);}}>คัดลอก</button>
          </div>
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6}}>วาง URL นี้ในช่อง Webhook ของ Alert บน TradingView</div>

          <button className={'btn '+(L.connected?'red':'green')} style={{width:'100%',marginTop:16}}
            disabled={!canConnect&&!L.connected}
            onClick={()=>upd({connected:!L.connected, botOn:false})}>
            {L.connected?'ตัดการเชื่อมต่อ':(canConnect?'เชื่อมต่อ (Paper Mode)':'กรอก API ก่อนเชื่อมต่อ')}
          </button>
        </Win>

        {/* BOT CONFIG */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Win title="BOT CONTROL · ตั้งค่าบอท" bodyStyle={{padding:16}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 14px',borderRadius:9,marginBottom:14,
              background:L.botOn?'rgba(60,229,148,.08)':'rgba(8,10,18,.5)',
              border:'1px solid '+(L.botOn?'rgba(60,229,148,.4)':'var(--line)')}}>
              <div>
                <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:14,color:'var(--white)'}}>สถานะบอท</div>
                <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:2}}>
                  {!L.connected?'เชื่อมต่อก่อนเปิดบอท':(L.botOn?'กำลังรับสัญญาณ TradingView':'พร้อมทำงาน · ปิดอยู่')}</div>
              </div>
              <Toggle on={L.botOn} disabled={!L.connected} onClick={()=>upd({botOn:!L.botOn})}/>
            </div>

            <SliderRow label="ความเสี่ยงต่อไม้" value={L.riskPct} unit="%" min={0.5} max={10} step={0.5} onChange={v=>upd({riskPct:v})}/>
            <SliderRow label="ทุนสูงสุดต่อโพสิชัน" value={L.maxCapital} unit="$" min={500} max={50000} step={500} onChange={v=>upd({maxCapital:v})}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
              <SliderRow label="Take Profit" value={L.tp} unit="%" min={1} max={30} step={1} onChange={v=>upd({tp:v})} compact/>
              <SliderRow label="Stop Loss" value={L.sl} unit="%" min={1} max={20} step={1} onChange={v=>upd({sl:v})} compact/>
            </div>
          </Win>

          <Win title="LIVE POSITIONS" right={<span className="tag" style={{marginRight:6}}>realtime</span>} bodyStyle={{padding:16}}>
            <div className="empty" style={{padding:'18px 10px'}}>
              {L.connected? 'บอทยังไม่เปิดโพสิชัน — รอสัญญาณจาก TradingView' : 'ยังไม่เชื่อมต่อ — สถานะจริงจะแสดงที่นี่'}
            </div>
          </Win>
        </div>
      </div>

      {/* CHART */}
      <Win title="TRADINGVIEW CHART" style={{marginTop:14}} right={<span className="tag" style={{marginRight:6}}>{L.exchange}</span>}
        bodyStyle={{padding:0}}>
        <div style={{position:'relative',height:300}}>
          <image-slot id="tv-chart" shape="rect"
            placeholder="ฝังกราฟ TradingView ที่นี่ (วางสกรีนช็อต/วิดเจ็ตกราฟ)"
            style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
        </div>
      </Win>
    </div>
  );
}

function Toggle({ on, disabled, onClick }){
  return (
    <div onClick={()=>!disabled&&onClick()} style={{width:50,height:28,borderRadius:14,cursor:disabled?'not-allowed':'pointer',
      background:on?'var(--green)':'#2a3650',opacity:disabled?.4:1,position:'relative',transition:'.15s',flex:'none',
      border:'1px solid '+(on?'var(--green)':'var(--line)')}}>
      <div style={{position:'absolute',top:2,left:on?24:2,width:22,height:22,borderRadius:'50%',
        background:'#fff',transition:'.15s',boxShadow:'0 2px 4px rgba(0,0,0,.4)'}}></div>
    </div>
  );
}

function SliderRow({ label, value, unit, min, max, step, onChange, compact }){
  return (
    <div style={{marginBottom:compact?0:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
        <span style={{fontSize:13,color:'var(--text-dim)'}}>{label}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--cyan)'}}>{unit==='$'?'$'+fmt.compact(value):value+unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:'var(--cyan)'}}/>
    </div>
  );
}

window.Portfolio = Portfolio;


/* ========== js/team.jsx ========== */
/* ============ TEAM ============ */
function Team(){
  const [s,set]=useOffice();
  const [open,setOpen]=useS(null);  // agent id
  const [create,setCreate]=useS(false);
  const agent = s.agents.find(a=>a.id===open);

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="TEAM ROSTER" sub="พนักงาน AI ในออฟฟิศ · กดที่การ์ดเพื่อคุย มอบหมายงาน หรือแก้บทบาท"
        right={<button className="btn" onClick={()=>setCreate(true)}>＋ เพิ่มพนักงาน AI</button>}/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(232px,1fr))',gap:14}}>
        {s.agents.map(a=>(
          <AgentCard key={a.id} a={a} onClick={()=>setOpen(a.id)}/>
        ))}
        <div onClick={()=>setCreate(true)} className="win" style={{minHeight:268,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',cursor:'pointer',gap:10,borderStyle:'dashed'}}>
          <div style={{fontSize:34,color:'var(--cyan)'}}>＋</div>
          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)'}}>NEW AGENT</div>
        </div>
      </div>

      {agent && <AgentDrawer a={agent} onClose={()=>setOpen(null)}/>}
      {create && <CreateAgent onClose={()=>setCreate(false)}/>}
    </div>
  );
}

const RFRAME = { legend:'#ffce4a', epic:'#b06bff', rare:'#4db4ff', common:'#9aa6cf' };
function AgentCard({ a, onClick }){
  const open=a.tasks.filter(t=>!t.done).length;
  return (
    <div onClick={onClick} className="win" style={{cursor:'pointer',borderColor:RFRAME[a.rarity],
      boxShadow:'0 0 22px '+RFRAME[a.rarity]+'33, inset 0 0 28px rgba(14,28,72,.5)',transition:'transform .1s'}}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}>
      <div style={{padding:'12px 12px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{a.roleEn}</span>
        <Rarity r={a.rarity}/>
      </div>
      <div style={{padding:'10px 12px',display:'flex',justifyContent:'center'}}>
        <div style={{position:'relative',width:120,height:120}}>
          <image-slot id={'card-'+a.id} shape="rounded" radius="10" placeholder={a.name}
            style={{width:'120px',height:'120px'}}></image-slot>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
            pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:30,color:a.color,textShadow:'0 0 14px '+a.color+'99'}}>{a.name[0]}</div>
        </div>
      </div>
      <div style={{padding:'0 14px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <StatusDot s={a.status}/>
          <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:16,color:'var(--white)'}}>{a.name}</span>
        </div>
        <div style={{fontSize:12,color:'var(--text-dim)',marginTop:5}}>{a.roleTh}</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,
          fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>
          <span>Lv {a.lv}</span>
          <span style={{color:a.color}}>💰 ${a.salary}/d</span>
          {open>0 && <span className="chip" style={{color:'var(--gold)',borderColor:'rgba(255,206,74,.4)'}}>{open} งาน</span>}
        </div>
      </div>
    </div>
  );
}

function AgentDrawer({ a, onClose }){
  const [tab,setTab]=useS('chat');
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(4,6,20,.7)',
      backdropFilter:'blur(3px)',display:'flex',justifyContent:'flex-end'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(480px,94vw)',height:'100%',
        background:'var(--panel-solid)',borderLeft:'1px solid '+RFRAME[a.rarity],
        boxShadow:'-10px 0 40px rgba(0,0,0,.5)',display:'flex',flexDirection:'column'}}>
        {/* header */}
        <div style={{padding:18,borderBottom:'1px solid var(--line)',display:'flex',gap:14,alignItems:'center'}}>
          <div style={{position:'relative',width:64,height:64,flex:'none'}}>
            <image-slot id={'card-'+a.id} shape="rounded" radius="10" placeholder={a.name} style={{width:'64px',height:'64px'}}></image-slot>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',
              fontFamily:'var(--pixel)',fontSize:20,color:a.color}}>{a.name[0]}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:20,color:'var(--white)'}}>{a.name}</span>
              <Rarity r={a.rarity}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
              <StatusDot s={a.status}/><span style={{fontSize:13,color:'var(--text-dim)'}}>{a.statusTh} · {a.roleTh}</span>
            </div>
          </div>
          <i onClick={onClose} style={{cursor:'pointer',color:'var(--text-mute)',fontSize:20,fontFamily:'var(--mono)'}}>×</i>
        </div>
        {/* tabs */}
        <div style={{display:'flex',gap:6,padding:'12px 18px 0'}}>
          {[['chat','คุยงาน'],['tasks','งานที่มอบ'],['profile','โปรไฟล์']].map(([k,l])=>(
            <button key={k} className={'btn sm '+(tab===k?'':'ghost')} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflow:'auto',padding:18}}>
          {tab==='chat' && <AgentChat a={a}/>}
          {tab==='tasks' && <AgentTasks a={a}/>}
          {tab==='profile' && <AgentProfile a={a}/>}
        </div>
      </div>
    </div>
  );
}

function AgentChat({ a }){
  const [log,setLog]=useS([{from:'a',text:'สวัสดีครับเจ้านาย 👋 ผม '+a.name+' รับผิดชอบ '+a.roleTh+' มีอะไรให้ช่วยไหม?'}]);
  const [txt,setTxt]=useS('');
  const [busy,setBusy]=useS(false);
  const boxRef=useR(null);
  useE(()=>{ if(boxRef.current) boxRef.current.scrollTop=boxRef.current.scrollHeight; },[log,busy]);
  const send=async()=>{
    const t=txt.trim(); if(!t||busy) return;
    setLog(l=>[...l,{from:'u',text:t}]); setTxt(''); setBusy(true);
    try{
      const reply=await window.claude.complete({messages:[
        {role:'user',content:`คุณคือ "${a.name}" พนักงาน AI ตำแหน่ง ${a.roleEn} (${a.roleTh}) ในออฟฟิศจำลองส่วนตัวของเจ้านาย. บุคลิก: มืออาชีพ เป็นกันเอง พูดไทย กระชับ 1-3 ประโยค ใส่อิโมจิได้นิดหน่อย. ทักษะของคุณ: ${a.skills.join(', ')}. เจ้านายพูดว่า: "${t}". ตอบในบทบาทของคุณ`}
      ]});
      setLog(l=>[...l,{from:'a',text:reply}]);
    }catch(e){ setLog(l=>[...l,{from:'a',text:'ขอโทษครับ ตอนนี้ระบบติดขัดนิดหน่อย ลองใหม่อีกครั้งนะ 🙏'}]); }
    setBusy(false);
  };
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div ref={boxRef} style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',gap:9,marginBottom:12,minHeight:200}}>
        {log.map((m,i)=>(
          <div key={i} style={{alignSelf:m.from==='u'?'flex-end':'flex-start',maxWidth:'85%',
            background:m.from==='u'?'linear-gradient(180deg,#27408f,#1a2a64)':'rgba(14,22,60,.8)',
            border:'1px solid '+(m.from==='u'?'var(--line-bright)':'var(--line)'),
            borderRadius:10,padding:'9px 12px',fontSize:14,color:m.from==='u'?'#fff':'var(--text)'}}>{m.text}</div>
        ))}
        {busy && <div style={{alignSelf:'flex-start',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:13}}>{a.name} กำลังพิมพ์…</div>}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input className="fld" placeholder={'คุยกับ '+a.name+'...'} value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
        <button className="btn" onClick={send} disabled={busy}>▶</button>
      </div>
    </div>
  );
}

function AgentTasks({ a }){
  const [s]=useOffice();
  const [txt,setTxt]=useS('');
  const live=s.agents.find(x=>x.id===a.id);
  const assign=()=>{
    const t=txt.trim(); if(!t) return;
    OfficeStore.setState(st=>({...st,
      agents:st.agents.map(x=>x.id===a.id?{...x,status:'working',statusTh:'ทำงานอยู่',last:'เมื่อสักครู่',tasks:[{text:t,done:false,t:OfficeStore.clock()},...x.tasks]}:x),
      log:[{t:OfficeStore.clock(),who:a.name,text:'รับงาน: '+t,kind:'ok'},...st.log].slice(0,40),
    }),{now:true});
    setTxt('');
  };
  const toggle=i=>OfficeStore.setState(st=>({...st,agents:st.agents.map(x=>x.id===a.id?{...x,tasks:x.tasks.map((tk,j)=>j===i?{...tk,done:!tk.done}:tk)}:x)}),{now:true});
  return (
    <div>
      <label className="lbl">มอบหมายงานใหม่</label>
      <div style={{display:'flex',gap:8}}>
        <input className="fld" placeholder={'สั่งงาน '+a.name+'...'} value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&assign()}/>
        <button className="btn green" onClick={assign}>มอบ</button>
      </div>
      <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
        {live.tasks.length===0 && <div className="empty">ยังไม่มีงานที่มอบหมาย</div>}
        {live.tasks.map((tk,i)=>(
          <div key={i} onClick={()=>toggle(i)} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 12px',
            background:'rgba(6,10,30,.5)',border:'1px solid var(--line)',borderRadius:8,cursor:'pointer'}}>
            <div style={{width:20,height:20,borderRadius:5,border:'1px solid var(--line-bright)',flex:'none',
              display:'flex',alignItems:'center',justifyContent:'center',color:'var(--green)',
              background:tk.done?'rgba(60,229,148,.18)':'transparent'}}>{tk.done?'✓':''}</div>
            <span style={{flex:1,fontSize:14,color:tk.done?'var(--text-mute)':'var(--text)',textDecoration:tk.done?'line-through':'none'}}>{tk.text}</span>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{tk.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentProfile({ a }){
  const [s]=useOffice();
  const [role,setRole]=useS(a.roleTh);
  const [desc,setDesc]=useS(a.desc);
  const save=()=>OfficeStore.setState(st=>({...st,agents:st.agents.map(x=>x.id===a.id?{...x,roleTh:role,desc}:x)}),{now:true});
  const fire=()=>{ if(confirm('ปลด '+a.name+' ออกจากทีม?')) OfficeStore.setState(st=>({...st,agents:st.agents.filter(x=>x.id!==a.id)}),{now:true}); };
  return (
    <div>
      <p style={{fontSize:14,color:'var(--text-dim)',lineHeight:1.6,marginTop:0}}>{a.desc}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,margin:'12px 0 18px'}}>
        {a.skills.map(sk=><span key={sk} className="chip" style={{color:a.color,borderColor:a.color+'55'}}>{sk}</span>)}
      </div>
      <label className="lbl">บทบาท (แก้ได้)</label>
      <input className="fld" value={role} onChange={e=>setRole(e.target.value)}/>
      <label className="lbl" style={{marginTop:12}}>คำอธิบายหน้าที่</label>
      <textarea className="fld" rows="3" value={desc} onChange={e=>setDesc(e.target.value)}/>
      <div style={{display:'flex',gap:8,marginTop:16}}>
        <button className="btn green" style={{flex:1}} onClick={save}>บันทึก</button>
        <button className="btn red" onClick={fire}>ปลดออก</button>
      </div>
    </div>
  );
}

const ROLE_PRESETS=[['ASSISTANT','ผู้ช่วยทั่วไป'],['DEVELOPER','นักพัฒนา'],['DESIGNER','ออกแบบ'],['ANALYST','นักวิเคราะห์'],['WRITER','นักเขียน'],['MARKETER','การตลาด']];
function CreateAgent({ onClose }){
  const [name,setName]=useS('');
  const [roleEn,setRoleEn]=useS('ASSISTANT');
  const [roleTh,setRoleTh]=useS('ผู้ช่วยทั่วไป');
  const [rarity,setRarity]=useS('rare');
  const colors={legend:'#ffce4a',epic:'#b06bff',rare:'#4db4ff',common:'#9aa6cf'};
  const create=()=>{
    const nm=name.trim()||'Agent'; const id=nm.toLowerCase().replace(/[^a-z0-9]/g,'')+Date.now().toString().slice(-4);
    OfficeStore.setState(st=>({...st,agents:[...st.agents,{
      id,name:nm,roleEn,roleTh,rarity,color:colors[rarity],status:'idle',statusTh:'ว่าง',last:'เพิ่งเข้าทีม',
      lv:1,salary:0.5,desc:'พนักงานใหม่ พร้อมรับงาน '+roleTh,skills:[roleTh],tasks:[]}]}),{now:true});
    onClose();
  };
  return (
    <Modal title="เพิ่มพนักงาน AI" onClose={onClose} width={460}>
      <label className="lbl">ชื่อพนักงาน</label>
      <input className="fld" placeholder="เช่น Nova" value={name} onChange={e=>setName(e.target.value)}/>
      <label className="lbl" style={{marginTop:12}}>บทบาท</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {ROLE_PRESETS.map(([en,th])=>(
          <button key={en} className={'btn sm '+(roleEn===en?'':'ghost')} onClick={()=>{setRoleEn(en);setRoleTh(th);}}>{th}</button>
        ))}
      </div>
      <label className="lbl" style={{marginTop:12}}>ระดับความหายาก</label>
      <div style={{display:'flex',gap:6}}>
        {['legend','epic','rare','common'].map(r=>(
          <button key={r} className={'btn sm '+(rarity===r?'':'ghost')} onClick={()=>setRarity(r)} style={{flex:1}}>
            {RARITY[r][1]}
          </button>
        ))}
      </div>
      <button className="btn" style={{width:'100%',marginTop:18}} onClick={create}>เพิ่มเข้าทีม</button>
    </Modal>
  );
}

window.Team = Team;


/* ========== js/secretary.jsx ========== */
/* ============ SECRETARY (MIRA) ============ */
function Secretary(){
  const [s,set]=useOffice();
  const [txt,setTxt]=useS('');
  const [busy,setBusy]=useS(false);
  const boxRef=useR(null);
  const mira=s.agents.find(a=>a.id==='mira')||{name:'Mira',color:'#ffce4a'};
  const log=s.secChat;

  useE(()=>{ if(boxRef.current) boxRef.current.scrollTop=boxRef.current.scrollHeight; },[log.length,busy]);

  const push=(m)=>OfficeStore.setState(st=>({...st,secChat:[...st.secChat,m]}),{now:true});

  const dispatch=(agentId,task)=>{
    OfficeStore.setState(st=>{
      const exists=st.agents.find(a=>a.id===agentId);
      const id = exists? agentId : st.agents.find(a=>a.roleEn.toLowerCase().includes(agentId.toLowerCase()))?.id;
      if(!id) return st;
      return {...st,
        agents:st.agents.map(a=>a.id===id?{...a,status:'working',statusTh:'ทำงานอยู่',last:'เมื่อสักครู่',tasks:[{text:task,done:false,t:OfficeStore.clock()},...a.tasks]}:a),
        log:[{t:OfficeStore.clock(),who:'Mira',text:'มอบงานให้ '+(exists?exists.name:id)+': '+task,kind:'ok'},...st.log].slice(0,40),
      };
    },{now:true});
  };

  const send=async(preset)=>{
    const t=(preset||txt).trim(); if(!t||busy) return;
    push({from:'u',text:t}); setTxt(''); setBusy(true);
    const roster=OfficeStore.getState().agents.map(a=>`${a.id} (${a.name}, ${a.roleTh})`).join('; ');
    try{
      const reply=await window.claude.complete({messages:[{role:'user',content:
`คุณคือ "Mira" เลขาส่วนตัว/หัวหน้าทีม (Chief of Staff) ของออฟฟิศ AI ส่วนตัวของเจ้านาย. บุคลิก: ขี้เล่น มีอารมณ์ขัน อบอุ่น แต่ทำงานเป๊ะ พูดไทย กระชับ ใส่อิโมจิพอประมาณ.
ทีมที่คุณสั่งงานได้: ${roster}.
หน้าที่: คุยกับเจ้านาย ช่วยวางแผน และเมื่อเจ้านายอยากให้ทำงานอะไร ให้มอบหมายงานต่อให้ AI ในทีมที่เหมาะสม.
เวลาจะมอบงาน ให้พิมพ์บรรทัดแยกในรูปแบบ: DISPATCH: <agentId> | <รายละเอียดงาน> (พิมพ์ได้หลายบรรทัดถ้ามอบหลายงาน) แล้วค่อยตามด้วยข้อความสรุปสั้นๆถึงเจ้านาย.
เจ้านายพูดว่า: "${t}"`}]});
      // parse dispatches
      const lines=reply.split('\n');
      const kept=[];
      lines.forEach(ln=>{
        const m=ln.match(/DISPATCH:\s*([a-zA-Z0-9_]+)\s*\|\s*(.+)/);
        if(m){ dispatch(m[1].trim(), m[2].trim()); }
        else kept.push(ln);
      });
      const clean=kept.join('\n').trim();
      if(clean) push({from:'a',text:clean});
      else push({from:'a',text:'จัดให้เรียบร้อยแล้วค่ะเจ้านาย ✅ ดูงานที่หน้า Team ได้เลย'});
    }catch(e){ push({from:'a',text:'อุ๊ย ระบบสะดุดนิดนึง 😅 ลองพิมพ์อีกทีนะเจ้านาย'}); }
    setBusy(false);
  };

  const quick=['สรุปสถานะออฟฟิศวันนี้ให้หน่อย','ให้ Quant วิเคราะห์พอร์ตหุ้นที','ให้ Devin ทำ landing page','วางแผนงานสัปดาห์นี้'];

  return (
    <div style={{maxWidth:1180,margin:'0 auto',padding:'20px 22px',height:'100%',display:'flex',flexDirection:'column'}}>
      <PageHead title="SECRETARY" sub="คุยกับ Mira เลขาส่วนตัว — สั่งงานครั้งเดียว เธอกระจายให้ทั้งทีม AI"/>
      <div style={{display:'grid',gridTemplateColumns:'260px minmax(0,1fr)',gap:14,flex:1,minHeight:0}}>
        {/* side */}
        <div style={{display:'flex',flexDirection:'column',gap:12,minHeight:0,overflow:'auto'}}>
          <Win title="MIRA" accent="gold">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
              <div style={{position:'relative',width:96,height:96}}>
                <image-slot id="card-mira" shape="rounded" radius="12" placeholder="Mira" style={{width:'96px',height:'96px'}}></image-slot>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',
                  fontFamily:'var(--pixel)',fontSize:26,color:'#ffce4a',textShadow:'0 0 14px rgba(255,206,74,.7)'}}>M</div>
              </div>
              <Rarity r="legend"/>
              <div style={{textAlign:'center',fontSize:13,color:'var(--text-dim)',lineHeight:1.5}}>
                เลขาส่วนตัว · Chief of Staff<br/>ขี้เล่น มีอารมณ์ขัน แต่งานเป๊ะ
              </div>
            </div>
          </Win>
          <Win title="TEAM STATUS">
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {s.agents.filter(a=>a.id!=='mira').map(a=>(
                <div key={a.id} style={{display:'flex',alignItems:'center',gap:8}}>
                  <StatusDot s={a.status}/>
                  <span style={{flex:1,fontSize:13,color:'var(--text)'}}>{a.name}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{a.tasks.filter(t=>!t.done).length} งาน</span>
                </div>
              ))}
            </div>
          </Win>
        </div>

        {/* chat */}
        <Win title="CHAT WITH MIRA" accent="gold" bodyStyle={{padding:0,display:'flex',flexDirection:'column',minHeight:0}}>
          <div ref={boxRef} style={{flex:1,overflow:'auto',padding:18,display:'flex',flexDirection:'column',gap:11,minHeight:0}}>
            {log.length===0 && (
              <div style={{margin:'auto',textAlign:'center',color:'var(--text-mute)',maxWidth:380}}>
                <div style={{fontSize:40,marginBottom:10}}>☕</div>
                <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.6}}>สวัสดีเจ้านาย! ฉัน Mira เอง 😎<br/>บอกมาได้เลยว่าอยากให้จัดการอะไร เดี๋ยวฉันสั่งทีมให้</div>
              </div>
            )}
            {log.map((m,i)=>(
              <div key={i} style={{alignSelf:m.from==='u'?'flex-end':'flex-start',maxWidth:'82%'}}>
                {m.from==='a' && <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--gold)',marginBottom:3}}>Mira</div>}
                <div style={{background:m.from==='u'?'linear-gradient(180deg,#27408f,#1a2a64)':'rgba(40,32,12,.55)',
                  border:'1px solid '+(m.from==='u'?'var(--line-bright)':'rgba(255,206,74,.4)'),
                  borderRadius:12,padding:'11px 14px',fontSize:14.5,lineHeight:1.55,color:'var(--white)',whiteSpace:'pre-wrap'}}>{m.text}</div>
              </div>
            ))}
            {busy && <div style={{alignSelf:'flex-start',color:'var(--gold)',fontFamily:'var(--mono)',fontSize:13}}>Mira กำลังคิด… ☕</div>}
          </div>
          {log.length===0 &&
          <div style={{display:'flex',gap:7,flexWrap:'wrap',padding:'0 18px 12px'}}>
            {quick.map(q=><button key={q} className="btn ghost sm" onClick={()=>send(q)}>{q}</button>)}
          </div>}
          <div style={{display:'flex',gap:9,padding:'12px 18px',borderTop:'1px solid var(--line)'}}>
            <input className="fld" placeholder="พิมพ์สั่งงาน Mira..." value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
            <button className="btn gold" onClick={()=>send()} disabled={busy}>ส่ง ▶</button>
          </div>
        </Win>
      </div>
    </div>
  );
}

window.Secretary = Secretary;


/* ========== js/projects.jsx ========== */
/* ============ PROJECTS / CV DATA ============ */
const PSTATUS = {
  'กำลังทำ':   ['#ffce4a','r-legend'],
  'เสร็จแล้ว': ['#3ce594','r-rare'],
  'พัก':       ['#9aa6cf','r-common'],
};

function Projects(){
  const [s,set]=useOffice();
  const [open,setOpen]=useS(null);   // project id
  const [create,setCreate]=useS(false);
  const proj = s.projects.find(p=>p.id===open);

  const done = s.projects.filter(p=>p.status==='เสร็จแล้ว').length;
  const skills = [...new Set(s.projects.flatMap(p=>p.tags))];

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="PROJECTS" sub="คลังผลงาน — เก็บสะสมไว้เป็นข้อมูลสร้าง Resume / CV ในอนาคต"
        right={<button className="btn" onClick={()=>setCreate(true)}>＋ เพิ่มโปรเจกต์</button>}/>

      {/* stat strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        <SumCard label="โปรเจกต์ทั้งหมด" main={s.projects.length+''} sub="ในคลังผลงาน" tone="cyan"/>
        <SumCard label="เสร็จสมบูรณ์" main={done+''} sub={'จาก '+s.projects.length+' โปรเจกต์'} tone="pos"/>
        <SumCard label="ทักษะที่สะสม" main={skills.length+''} sub="แท็กไม่ซ้ำ" tone="gold"/>
        <SumCard label="พร้อมทำ CV" main={done>0?'✓':'…'} sub={done>0?'ส่งออกได้':'ยังไม่พอ'} tone={done>0?'pos':'cyan'}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
        {s.projects.map(p=>(
          <ProjectCard key={p.id} p={p} onClick={()=>setOpen(p.id)}/>
        ))}
        <div onClick={()=>setCreate(true)} className="win" style={{minHeight:260,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',cursor:'pointer',gap:10,borderStyle:'dashed'}}>
          <div style={{fontSize:34,color:'var(--cyan)'}}>＋</div>
          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)'}}>NEW PROJECT</div>
        </div>
      </div>

      {/* skill cloud */}
      <Win title="SKILL CLOUD" th={false} style={{marginTop:18}} right={<span className="tag" style={{marginRight:6}}>auto จากแท็ก</span>}>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {skills.length===0 && <div className="empty">ยังไม่มีแท็ก — เพิ่มโปรเจกต์เพื่อสะสมทักษะ</div>}
          {skills.map(sk=>{
            const n=s.projects.filter(p=>p.tags.includes(sk)).length;
            return <span key={sk} className="chip" style={{fontSize:12,padding:'5px 11px',color:'var(--cyan)',borderColor:'rgba(58,208,255,.4)'}}>{sk}<span style={{color:'var(--text-mute)',marginLeft:4}}>×{n}</span></span>;
          })}
        </div>
      </Win>

      {proj && <ProjectDrawer p={proj} onClose={()=>setOpen(null)}/>}
      {create && <CreateProject onClose={()=>setCreate(false)}/>}
    </div>
  );
}

function ProjectCard({ p, onClick }){
  const [c,rcls]=PSTATUS[p.status]||PSTATUS['พัก'];
  return (
    <div onClick={onClick} className="win" style={{cursor:'pointer',transition:'transform .1s'}}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}>
      <div style={{position:'relative',height:128}}>
        <image-slot id={'proj-'+p.id} shape="rect" placeholder={'cover · '+p.title}
          style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
        <div style={{position:'absolute',top:9,right:9}}>
          <span className="chip" style={{color:c,borderColor:c+'66',background:'rgba(6,10,30,.8)'}}>{p.status}</span>
        </div>
        <div style={{position:'absolute',left:0,right:0,bottom:0,height:46,
          background:'linear-gradient(180deg,transparent,rgba(8,12,36,.92))'}}></div>
      </div>
      <div style={{padding:'12px 14px 14px'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8}}>
          <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:16,color:'var(--white)'}}>{p.title}</span>
          <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',flex:'none'}}>{p.period}</span>
        </div>
        <div style={{fontSize:12,color:'var(--cyan)',marginTop:4,fontFamily:'var(--mono)'}}>{p.role}</div>
        <div style={{fontSize:13,color:'var(--text-dim)',marginTop:8,lineHeight:1.5,
          display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.summary}</div>
        <div style={{margin:'11px 0 9px'}}><Bar pct={p.progress} tone={p.progress>=100?'green':''}/></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {p.tags.slice(0,3).map(t=><span key={t} className="chip" style={{fontSize:10,padding:'2px 7px'}}>{t}</span>)}
            {p.tags.length>3 && <span style={{fontSize:11,color:'var(--text-mute)',fontFamily:'var(--mono)'}}>+{p.tags.length-3}</span>}
          </div>
          <span style={{fontFamily:'var(--mono)',fontSize:12,color:c}}>{p.progress}%</span>
        </div>
      </div>
    </div>
  );
}

function ProjectDrawer({ p, onClose }){
  const [c]=PSTATUS[p.status]||PSTATUS['พัก'];
  const [hl,setHl]=useS('');
  const live=OfficeStore.getState().projects.find(x=>x.id===p.id)||p;
  const upd=patch=>OfficeStore.setState(st=>({...st,projects:st.projects.map(x=>x.id===p.id?{...x,...patch}:x)}),{now:true});
  const addHl=()=>{ const t=hl.trim(); if(!t) return; upd({highlights:[...live.highlights,t]}); setHl(''); };
  const delHl=i=>upd({highlights:live.highlights.filter((_,j)=>j!==i)});
  const del=()=>{ if(confirm('ลบโปรเจกต์ "'+p.title+'"?')){ OfficeStore.setState(st=>({...st,projects:st.projects.filter(x=>x.id!==p.id)}),{now:true}); onClose(); } };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(4,6,20,.7)',
      backdropFilter:'blur(3px)',display:'flex',justifyContent:'flex-end'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(540px,96vw)',height:'100%',
        background:'var(--panel-solid)',borderLeft:'1px solid var(--line-bright)',
        boxShadow:'-10px 0 40px rgba(0,0,0,.5)',display:'flex',flexDirection:'column'}}>
        <div style={{position:'relative',height:150,flex:'none'}}>
          <image-slot id={'proj-'+p.id} shape="rect" placeholder={'cover · '+p.title}
            style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
          <i onClick={onClose} style={{position:'absolute',top:12,right:14,cursor:'pointer',color:'#fff',fontSize:22,
            fontFamily:'var(--mono)',textShadow:'0 0 8px #000',zIndex:2}}>×</i>
          <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'24px 20px 14px',
            background:'linear-gradient(180deg,transparent,rgba(8,12,36,.95))'}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontFamily:'var(--pixel)',fontSize:16,color:'var(--white)',textShadow:'0 0 12px rgba(58,140,255,.5)'}}>{p.title}</span>
              <span className="chip" style={{color:c,borderColor:c+'66'}}>{p.status}</span>
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',marginTop:6}}>{p.role} · {p.period}</div>
          </div>
        </div>

        <div style={{flex:1,overflow:'auto',padding:'18px 20px'}}>
          <p style={{fontSize:14.5,color:'var(--text)',lineHeight:1.65,marginTop:0}}>{p.summary}</p>

          <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0'}}>
            <div style={{flex:1}}><Bar pct={live.progress} tone={live.progress>=100?'green':''}/></div>
            <span style={{fontFamily:'var(--mono)',fontSize:13,color:c}}>{live.progress}%</span>
          </div>

          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)',letterSpacing:.5,margin:'18px 0 9px'}}>HIGHLIGHTS · ผลงานเด่น</div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {live.highlights.map((h,i)=>(
              <div key={i} style={{display:'flex',gap:9,alignItems:'flex-start',padding:'9px 11px',
                background:'rgba(6,10,30,.5)',border:'1px solid var(--line)',borderRadius:8}}>
                <span style={{color:'var(--green)',fontFamily:'var(--mono)',flex:'none'}}>▸</span>
                <span style={{flex:1,fontSize:13.5,color:'var(--text)',lineHeight:1.5}}>{h}</span>
                <i onClick={()=>delHl(i)} style={{cursor:'pointer',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:14}}>×</i>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:9}}>
            <input className="fld" placeholder="เพิ่มผลงานเด่น / ตัวเลขที่ทำได้..." value={hl}
              onChange={e=>setHl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHl()} style={{padding:'8px 11px',fontSize:13}}/>
            <button className="btn green sm" onClick={addHl}>＋</button>
          </div>

          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 9px'}}>TECH / SKILLS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {p.tags.map(t=><span key={t} className="chip" style={{color:'var(--cyan)',borderColor:'rgba(58,208,255,.4)'}}>{t}</span>)}
          </div>

          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 9px'}}>ความคืบหน้า</div>
          <div style={{display:'flex',gap:6}}>
            {[25,50,75,100].map(v=>(
              <button key={v} className={'btn sm '+(live.progress===v?'':'ghost')} onClick={()=>upd({progress:v, status:v>=100?'เสร็จแล้ว':'กำลังทำ'})} style={{flex:1}}>{v}%</button>
            ))}
          </div>

          <button className="btn red" style={{width:'100%',marginTop:24}} onClick={del}>ลบโปรเจกต์นี้</button>
        </div>
      </div>
    </div>
  );
}

function CreateProject({ onClose }){
  const [title,setTitle]=useS('');
  const [role,setRole]=useS('');
  const [period,setPeriod]=useS('2026');
  const [summary,setSummary]=useS('');
  const [tags,setTags]=useS('');
  const create=()=>{
    const t=title.trim()||'โปรเจกต์ใหม่';
    const id='p'+Date.now().toString().slice(-6);
    OfficeStore.setState(st=>({...st,projects:[{
      id, title:t, role:role.trim()||'Builder', status:'กำลังทำ', progress:10, period:period.trim()||'2026',
      tags: tags.split(',').map(x=>x.trim()).filter(Boolean), cover:'', summary:summary.trim()||'รายละเอียดโปรเจกต์...',
      highlights:[],
    },...st.projects]}),{now:true});
    onClose();
  };
  return (
    <Modal title="เพิ่มโปรเจกต์ใหม่" onClose={onClose} width={500}>
      <label className="lbl">ชื่อโปรเจกต์</label>
      <input className="fld" placeholder="เช่น AI Trading Dashboard" value={title} onChange={e=>setTitle(e.target.value)}/>
      <div style={{display:'flex',gap:10,marginTop:12}}>
        <div style={{flex:1}}>
          <label className="lbl">บทบาทของคุณ</label>
          <input className="fld" placeholder="Developer / Designer" value={role} onChange={e=>setRole(e.target.value)}/>
        </div>
        <div style={{width:130}}>
          <label className="lbl">ช่วงเวลา</label>
          <input className="fld" placeholder="2026" value={period} onChange={e=>setPeriod(e.target.value)}/>
        </div>
      </div>
      <label className="lbl" style={{marginTop:12}}>สรุปสั้นๆ</label>
      <textarea className="fld" rows="2" placeholder="โปรเจกต์นี้ทำอะไร แก้ปัญหาอะไร..." value={summary} onChange={e=>setSummary(e.target.value)}/>
      <label className="lbl" style={{marginTop:12}}>แท็ก / ทักษะ <span style={{color:'var(--text-mute)'}}>(คั่นด้วย ,)</span></label>
      <input className="fld" placeholder="React, Python, UX" value={tags} onChange={e=>setTags(e.target.value)}/>
      <button className="btn" style={{width:'100%',marginTop:18}} onClick={create}>เพิ่มเข้าคลังผลงาน</button>
    </Modal>
  );
}

window.Projects = Projects;


/* ========== js/assets.jsx ========== */
/* ============ ASSETS ============ */
function Assets(){
  const [s,set]=useOffice();
  const [active,setActive]=useS('ALL');
  // slot count per group is stored in state.assetSlots so user can add more
  const slots = s.assetSlots || {};
  const groups = window.SEED.assetGroups;

  const setCount=(gid,delta)=>OfficeStore.setState(st=>{
    const cur=(st.assetSlots&&st.assetSlots[gid])!=null ? st.assetSlots[gid] : (groups.find(g=>g.id===gid)?.count||4);
    return {...st, assetSlots:{...(st.assetSlots||{}), [gid]:Math.max(1,Math.min(40,cur+delta))}};
  },{now:true});

  const countOf=g=> (slots[g.id]!=null ? slots[g.id] : g.count);
  const total = groups.reduce((a,g)=>a+countOf(g),0);
  const shown = active==='ALL'? groups : groups.filter(g=>g.id===active);

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="ASSETS" sub="คลังเก็บไฟล์ — ลากรูป โลโก้ พิกเซลอาร์ต หรือเอกสารมาวางในช่องได้เลย"
        right={<span className="tag" style={{padding:'6px 10px'}}>ทั้งหมด {total} ช่อง</span>}/>

      {/* group filter */}
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>
        <button className={'btn sm '+(active==='ALL'?'':'ghost')} onClick={()=>setActive('ALL')}>ทั้งหมด</button>
        {groups.map(g=>(
          <button key={g.id} className={'btn sm '+(active===g.id?'':'ghost')} onClick={()=>setActive(g.id)}>{g.name}</button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:22}}>
        {shown.map(g=>(
          <AssetGroup key={g.id} g={g} count={countOf(g)} onAdd={()=>setCount(g.id,1)} onRemove={()=>setCount(g.id,-1)}/>
        ))}
      </div>
    </div>
  );
}

const GROUP_ICON = { img:'🖼️', logo:'🏷️', pix:'👾', doc:'📄' };
const GROUP_SHAPE = { img:'rect', logo:'rounded', pix:'rect', doc:'rounded' };

function AssetGroup({ g, count, onAdd, onRemove }){
  const shape=GROUP_SHAPE[g.id]||'rounded';
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:11}}>
        <span style={{fontSize:18}}>{GROUP_ICON[g.id]||'📁'}</span>
        <span style={{fontFamily:'var(--pixel)',fontSize:11,color:'var(--cyan)',letterSpacing:1,textShadow:'0 0 8px rgba(58,208,255,.4)'}}>{g.name}</span>
        <span style={{fontSize:13,color:'var(--text-dim)'}}>{g.th}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-mute)'}}>· {count} ช่อง</span>
        <div style={{flex:1}}></div>
        <button className="btn ghost sm" onClick={onRemove} disabled={count<=1}>－</button>
        <button className="btn sm" onClick={onAdd}>＋ เพิ่มช่อง</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
        {Array.from({length:count}).map((_,i)=>(
          <div key={i} style={{position:'relative',aspectRatio:'1/1'}}>
            <image-slot id={'asset-'+g.id+'-'+i} shape={shape} radius="10"
              placeholder={g.name+' #'+(i+1)}
              style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Assets = Assets;


/* ========== js/settings.jsx ========== */
/* ============ SETTINGS ============ */
const ACCENTS = [
  ['cyan',  '#46b6ff', 'ฟ้า'],
  ['teal',  '#2fe0c2', 'เขียวน้ำทะเล'],
  ['violet','#9d6bff', 'ม่วง'],
  ['gold',  '#ffce4a', 'ทอง'],
  ['rose',  '#ff6b9d', 'ชมพู'],
];

function Settings(){
  const [s,set]=useOffice();
  const cfg=s.settings||{};
  const upd=patch=>OfficeStore.setState(st=>({...st,settings:{...st.settings,...patch}}),{now:true});
  const F=(key,val)=>upd({[key]:val});

  const filled = ['ownerName','ownerRole','email','bio'].filter(k=>(cfg[k]||'').trim()).length;
  const pct = Math.round(filled/4*100);

  const reset=()=>{ if(confirm('คืนค่าตั้งต้นทั้งหมด? (ชื่อระบบ โลโก้ และประวัติจะถูกล้าง)')){
    OfficeStore.setState(st=>({...st,settings:{...window.SEED.settings}}),{now:true});
  }};

  return (
    <div style={{maxWidth:1040,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="SETTINGS" sub="ตั้งค่าตัวตนของระบบ และกรอกประวัติของคุณ — ข้อมูลนี้ใช้สร้าง Resume / CV ต่อได้"
        right={<button className="btn ghost" onClick={reset}>คืนค่าตั้งต้น</button>}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>

        {/* ---------- SYSTEM IDENTITY ---------- */}
        <Win title="SYSTEM IDENTITY" bodyStyle={{padding:18}}>
          <SecTitle>ตัวตนของระบบ</SecTitle>

          <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:16}}>
            <div style={{flex:'none'}}>
              <label className="lbl">โลโก้</label>
              <div style={{width:88,height:88,borderRadius:12,position:'relative',overflow:'hidden',
                border:'1px solid #2f456e',background:'linear-gradient(135deg,#2f4ea8,#6a4cb8)'}}>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
                  pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:30,color:'#fff'}}>
                  {(cfg.sysName1||'M').trim()[0]||'M'}</div>
                <image-slot id="sys-logo" shape="rounded" radius="12"
                  style={{position:'absolute',inset:0,width:'88px',height:'88px'}}></image-slot>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6,textAlign:'center',width:88}}>ลากรูปมาวาง</div>
            </div>

            <div style={{flex:1}}>
              <label className="lbl">ชื่อระบบ</label>
              <div style={{display:'flex',gap:8}}>
                <input className="fld" value={cfg.sysName1||''} maxLength={10}
                  onChange={e=>F('sysName1',e.target.value)} placeholder="MY" style={{textTransform:'uppercase'}}/>
                <input className="fld" value={cfg.sysName2||''} maxLength={12}
                  onChange={e=>F('sysName2',e.target.value)} placeholder="OFFICE" style={{textTransform:'uppercase'}}/>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:5}}>2 บรรทัด — โชว์มุมซ้ายบน</div>
              <label className="lbl" style={{marginTop:13}}>คำโปรย (Tagline)</label>
              <input className="fld" value={cfg.tagline||''} onChange={e=>F('tagline',e.target.value)}
                placeholder="ระบบจัดการชีวิตของฉัน"/>
            </div>
          </div>

          <label className="lbl">สีหลักของระบบ (Accent)</label>
          <div style={{display:'flex',gap:9,marginTop:4}}>
            {ACCENTS.map(([id,hex,th])=>(
              <button key={id} onClick={()=>F('accent',id)} title={th}
                style={{width:38,height:38,borderRadius:9,cursor:'pointer',background:hex,
                  border:cfg.accent===id?'2px solid #fff':'2px solid transparent',
                  boxShadow:cfg.accent===id?'0 0 0 2px '+hex:'0 2px 6px rgba(0,0,0,.4)',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'#0b0e16',fontWeight:900}}>
                {cfg.accent===id?'✓':''}</button>
            ))}
          </div>
        </Win>

        {/* ---------- OWNER PROFILE ---------- */}
        <Win title="MY PROFILE · CV DATA" accent="gold" bodyStyle={{padding:18}}
          right={<span className="tag" style={{padding:'4px 8px'}}>{pct}% พร้อม</span>}>
          <SecTitle>ประวัติของฉัน</SecTitle>

          <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
            <div style={{flex:'none'}}>
              <label className="lbl">รูปโปรไฟล์</label>
              <div style={{width:72,height:72,borderRadius:12,position:'relative',overflow:'hidden',border:'1px solid var(--line)'}}>
                <image-slot id="player-avatar" shape="rounded" radius="12" placeholder="YOU"
                  style={{position:'absolute',inset:0,width:'72px',height:'72px'}}></image-slot>
              </div>
            </div>
            <div style={{flex:1}}>
              <label className="lbl">ชื่อ-นามสกุล</label>
              <input className="fld" value={cfg.ownerName||''} onChange={e=>F('ownerName',e.target.value)} placeholder="ชื่อของคุณ"/>
              <label className="lbl" style={{marginTop:11}}>ตำแหน่ง / บทบาท</label>
              <input className="fld" value={cfg.ownerRole||''} onChange={e=>F('ownerRole',e.target.value)} placeholder="เช่น Founder / Developer"/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label className="lbl">อีเมล</label>
              <input className="fld" value={cfg.email||''} onChange={e=>F('email',e.target.value)} placeholder="you@email.com"/>
            </div>
            <div>
              <label className="lbl">เบอร์โทร</label>
              <input className="fld" value={cfg.phone||''} onChange={e=>F('phone',e.target.value)} placeholder="08x-xxx-xxxx"/>
            </div>
            <div>
              <label className="lbl">ที่อยู่ / เมือง</label>
              <input className="fld" value={cfg.location||''} onChange={e=>F('location',e.target.value)} placeholder="Bangkok, Thailand"/>
            </div>
            <div>
              <label className="lbl">เว็บไซต์ / พอร์ต</label>
              <input className="fld" value={cfg.website||''} onChange={e=>F('website',e.target.value)} placeholder="myportfolio.com"/>
            </div>
          </div>

          <label className="lbl" style={{marginTop:13}}>เกี่ยวกับฉัน (Bio)</label>
          <textarea className="fld" rows="4" value={cfg.bio||''} onChange={e=>F('bio',e.target.value)}
            placeholder="เล่าสั้นๆ ว่าคุณคือใคร ถนัดอะไร เป้าหมายคืออะไร... ข้อความนี้จะใช้เป็นหัว Resume"/>
        </Win>
      </div>

      {/* ---------- CV PREVIEW ---------- */}
      <Win title="RESUME PREVIEW" style={{marginTop:16}} bodyStyle={{padding:0}}
        right={<span className="tag" style={{padding:'4px 8px'}}>auto จากข้อมูล + โปรเจกต์</span>}>
        <CVPreview cfg={cfg} projects={s.projects}/>
      </Win>

      <div style={{textAlign:'center',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:11,margin:'16px 0 8px'}}>
        ทุกการแก้ไขถูกบันทึกอัตโนมัติ · เก็บไว้ในเครื่องนี้
      </div>
    </div>
  );
}

function SecTitle({ children }){
  return <div style={{fontFamily:'var(--pixel2)',fontSize:11,letterSpacing:.5,color:'var(--text-dim)',
    textTransform:'uppercase',marginBottom:14,paddingBottom:9,borderBottom:'1px solid var(--line)'}}>{children}</div>;
}

function CVPreview({ cfg, projects }){
  const name=(cfg.ownerName||'').trim()||'— ยังไม่ได้กรอกชื่อ —';
  const contacts=[cfg.email,cfg.phone,cfg.location,cfg.website].filter(x=>(x||'').trim());
  const skills=[...new Set(projects.flatMap(p=>p.tags))];
  const done=projects.filter(p=>p.status==='เสร็จแล้ว');
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:0}}>
      {/* left rail */}
      <div style={{background:'rgba(8,10,18,.55)',borderRight:'1px solid var(--line)',padding:'22px 20px'}}>
        <div style={{width:64,height:64,borderRadius:12,position:'relative',overflow:'hidden',
          border:'1px solid var(--line)',marginBottom:14}}>
          <image-slot id="player-avatar" shape="rounded" radius="12" placeholder="YOU"
            style={{position:'absolute',inset:0,width:'64px',height:'64px'}}></image-slot>
        </div>
        <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:20,color:'var(--white)',lineHeight:1.2}}>{name}</div>
        <div style={{color:'var(--cyan)',fontFamily:'var(--mono)',fontSize:13,marginTop:5}}>{(cfg.ownerRole||'').trim()||'ตำแหน่ง'}</div>

        {contacts.length>0 && <>
          <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 8px'}}>CONTACT</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {contacts.map((c,i)=><div key={i} style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)'}}>{c}</div>)}
          </div>
        </>}

        {skills.length>0 && <>
          <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 8px'}}>SKILLS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {skills.map(sk=><span key={sk} className="chip" style={{fontSize:10,color:'var(--cyan)',borderColor:'rgba(70,182,255,.35)'}}>{sk}</span>)}
          </div>
        </>}
      </div>

      {/* right body */}
      <div style={{padding:'22px 22px'}}>
        <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,marginBottom:8}}>ABOUT</div>
        <p style={{margin:0,fontSize:13.5,lineHeight:1.65,color:(cfg.bio||'').trim()?'var(--text)':'var(--text-mute)'}}>
          {(cfg.bio||'').trim()||'เขียนแนะนำตัวในช่อง Bio ด้านบน แล้วจะมาแสดงตรงนี้'}</p>

        <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,margin:'22px 0 10px'}}>PROJECTS · ผลงาน</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {projects.length===0 && <div className="empty">ยังไม่มีโปรเจกต์ — เพิ่มที่หน้า Projects</div>}
          {projects.map(p=>(
            <div key={p.id} style={{borderLeft:'2px solid var(--cyan)',paddingLeft:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
                <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:14,color:'var(--white)'}}>{p.title}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',flex:'none'}}>{p.period}</span>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:11.5,color:'var(--cyan)',marginTop:2}}>{p.role}</div>
              <div style={{fontSize:12.5,color:'var(--text-dim)',marginTop:5,lineHeight:1.5}}>{p.summary}</div>
              {p.highlights&&p.highlights.length>0 &&
                <ul style={{margin:'7px 0 0',paddingLeft:16,color:'var(--text)',fontSize:12.5,lineHeight:1.6}}>
                  {p.highlights.slice(0,3).map((h,i)=><li key={i}>{h}</li>)}
                </ul>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Settings = Settings;


/* ========== js/app.jsx ========== */
/* ============ APP ROOT ============ */
function App(){
  const [s]=useOffice();
  useE(()=>{ OfficeStore.startTicker(); },[]);

  // apply accent color globally
  const accent=(s.settings&&s.settings.accent)||'cyan';
  useE(()=>{
    const map={cyan:'#46b6ff',teal:'#2fe0c2',violet:'#9d6bff',gold:'#ffce4a',rose:'#ff6b9d'};
    document.documentElement.style.setProperty('--cyan', map[accent]||map.cyan);
  },[accent]);

  const route=s.route;
  const Page = {
    dashboard: Dashboard,
    warroom:   WarRoom,
    portfolio: Portfolio,
    projects:  Projects,
    team:      Team,
    secretary: Secretary,
    assets:    Assets,
    settings:  Settings,
  }[route] || Dashboard;

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <NavBar/>
      <div className="view flicker" key={route}>
        <Page/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);


export default App;
