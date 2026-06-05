import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore } from '../../store';

/** Search Yahoo Finance + add symbol to Market */
export function MarketSearch() {
  const [q,       setQ]       = useS('');
  const [results, setResults] = useS([]);

  useE(() => {
    if (q.trim().length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6`);
        if (res.ok) { const data = await res.json(); setResults(data.quotes || []); }
      } catch (e) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  const add = (r) => {
    let cls = 'US';
    if (r.quoteType === 'CRYPTOCURRENCY') cls = 'CRYPTO';
    else if (r.exchDisp === 'SET') cls = 'SET';
    else if (r.quoteType === 'MUTUALFUND' || r.quoteType === 'ETF') cls = 'FUND';
    OfficeStore.addFavorite({ symbol: r.symbol, name: r.shortname || r.longname || r.symbol, cls, price: 1, cur: (cls === 'SET' || cls === 'FUND') ? 'THB' : 'USD', prevClose: 1, seed: 1 });
    setQ(''); setResults([]);
  };

  return (
    <div className="mb-3">
      <input className="fld" placeholder="🔍 ค้นหาชื่อหุ้น, คริปโต (เช่น AAPL, BTC)..." value={q} onChange={e => setQ(e.target.value)}/>
      {results.length > 0 && (
        <div className="bg-[#080a12] border border-line rounded-lg mt-2 max-h-[300px] overflow-auto shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="p-[6px_12px] bg-white/5 text-[11px] text-text-dim border-b border-line">ผลการค้นหา (คลิกเพื่อเพิ่มลง Market)</div>
          {results.map((r, i) => (
            <div key={i} className="p-[8px_12px] cursor-pointer border-b border-white/5 flex justify-between hover:bg-[#283c8c]/30 transition-colors duration-200" onClick={() => add(r)}>
              <div>
                <div className="text-white font-semibold">{r.symbol}</div>
                <div className="text-[11px] text-text-dim">{r.shortname || r.longname}</div>
              </div>
              <div className="text-right"><span className="chip text-[10px]">{r.exchDisp || r.quoteType}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
