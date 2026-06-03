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
