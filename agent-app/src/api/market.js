import { getState, setState } from '../store/core.js';

/* ---------- market ticker (realtime drift) ---------- */
let lastFetch = 0;
let isFetching = false;
let realPrices = {};

export async function fetchMarketData() {
  isFetching = true;
  lastFetch = Date.now();
  try {
    const s = getState();
    const supported = Object.keys(s.market).filter(k => 
       s.market[k].cls === 'US' || s.market[k].cls === 'CRYPTO' || s.market[k].cls === 'SET' || s.market[k].cls === 'FUND'
    );
    
    const fetchPromises = supported.map(async sym => {
       let querySym = sym;
       if (s.market[sym].cls === 'CRYPTO' && !sym.includes('-')) querySym = `${sym}-USD`;
       else if (s.market[sym].cls === 'SET' && !sym.includes('.')) querySym = `${sym}.BK`;
       
       const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${querySym}`);
       if (res.ok) {
         const data = await res.json();
         const meta = data?.chart?.result?.[0]?.meta;
         if (meta && meta.regularMarketPrice > 0) {
             return { 
               sym, 
               price: meta.regularMarketPrice, 
               pc: meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice 
             };
         }
       }
       return null;
    });
    const results = await Promise.all(fetchPromises);
    results.forEach(r => { if (r) realPrices[r.sym] = r; });
    
    // Fetch FX
    try {
      const fxRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/THB=X`);
      if (fxRes.ok) {
        const data = await fxRes.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice > 0) realPrices['FX'] = meta.regularMarketPrice;
      }
    } catch (e) {}
  } catch (e) { 
    console.error('Yahoo Finance error', e); 
  }
  isFetching = false;
}

export function startTicker() {
  if (window.__tickerOn) return; 
  window.__tickerOn = true;
  
  fetchMarketData();

  setInterval(() => {
    const now = Date.now();
    
    if (!isFetching && now - lastFetch > 15000) {
      fetchMarketData();
    }

    setState(s => {
      const market = { ...s.market };
      Object.keys(market).forEach(k => {
        const m = { ...market[k] };
        
        if (realPrices[k]) {
          // Use real data directly
          m.price = realPrices[k].price;
          if (realPrices[k].pc > 0) m.prevClose = realPrices[k].pc;
        }
        market[k] = m;
      });
      
      const nextState = { ...s, market };
      if (realPrices['FX']) nextState.fx = realPrices['FX'];
      return nextState;
    });
  }, 2000);
}
