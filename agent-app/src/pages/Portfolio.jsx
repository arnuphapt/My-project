import React, { useState as useS } from 'react';
import { OfficeStore, useOffice, fmt } from '../store';
import { Win, Row, Bar, PageHead, ClassTag, SumCard } from '../components/UI.jsx';
import '../store/image-slot.js';
import { TxnLog, TradeModal, DepositModal } from '../components/portfolio/TradeModals.jsx';
import { MarketSearch }                      from '../components/portfolio/MarketSearch.jsx';
import { LiveTrading }                       from '../components/portfolio/LiveTrading.jsx';

/* ============ PORTFOLIO ============ */
function Portfolio() {
  const [tab, setTab] = useS('sim');
  return (
    <div className="max-w-[1280px] mx-auto px-[22px] py-5">
      <div className="flex gap-2 mb-[18px] p-1.25 rounded-[11px] bg-[#080a12]/60 border border-line w-fit">
        <button className={'pf-tab' + (tab === 'sim'  ? ' on' : '')} onClick={() => setTab('sim')}>
          🧪 จำลอง <span className="opacity-70 text-[11px]">· Simulate</span>
        </button>
        <button className={'pf-tab' + (tab === 'live' ? ' on' : '')} onClick={() => setTab('live')}>
          ⚡ ลงทุนจริง <span className="opacity-70 text-[11px]">· Live</span>
        </button>
      </div>
      {tab === 'sim' ? <SimPortfolio/> : <LiveTrading/>}
    </div>
  );
}

/* ============ SIMULATED PORTFOLIO ============ */
function SimPortfolio() {
  const [s]      = useOffice();
  const v        = OfficeStore.valuation();
  const FX       = OfficeStore.FX;
  const [filter, setFilter] = useS('ALL');
  const [trade,  setTrade]  = useS(null);
  const [depo,   setDepo]   = useS(false);

  const realizedUSD = s.realized.usd + s.realized.thb / FX;
  const list        = Object.values(s.market).filter(m => filter === 'ALL' || m.cls === filter);

  return (
    <div>
      <PageHead
        title="พอร์ตจำลอง"
        sub="ฝึกลงทุนด้วยเงินจำลอง · ราคาขยับเรียลไทม์ทุก 2 วินาที"
        right={<div className="flex gap-2.5"><button className="btn gold" onClick={() => setDepo(true)}>＋ เติมเงิน</button></div>}
      />

      {/* summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SumCard label="มูลค่ารวม (Net Worth)"     main={'฿' + fmt.n(v.totalUSD * FX, 0)} sub={'$' + fmt.n(v.totalUSD, 2)}     tone="gold"/>
        <SumCard label="กำไรลอยตัว (Unrealized)"   main={fmt.money(v.unrealUSD, 'USD')}   sub={fmt.pct(v.unrealPct)}            tone={v.unrealUSD >= 0 ? 'pos' : 'neg'}/>
        <SumCard label="กำไรที่ขายแล้ว (Realized)" main={fmt.money(realizedUSD, 'USD')}   sub={'฿' + fmt.n(realizedUSD * FX, 0)} tone={realizedUSD >= 0 ? 'pos' : 'neg'}/>
        <SumCard label="เงินสดพร้อมลงทุน"         main={'฿' + fmt.n(s.cash.thb, 0)}     sub={'$' + fmt.n(s.cash.usd, 2)}     tone="cyan" onClick={() => setDepo(true)}/>
      </div>

      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-3.5 items-start">
        {/* holdings */}
        <Win title="MY HOLDINGS" th={false} right={<span className="tag mr-1.5">{v.rows.length} รายการ</span>}>
          {v.rows.length === 0 && <div className="empty">ยังไม่มีสินทรัพย์ — เลือกซื้อจากตลาดด้านขวา</div>}
          {v.rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[13px]">
                <thead>
                  <tr className="text-text-mute text-[11px] text-right">
                    <th className="text-left px-1 py-1.5">สินทรัพย์</th>
                    <th>ถือ</th><th>ราคา</th><th>มูลค่า</th><th>กำไร/ขาดทุน</th><th/>
                  </tr>
                </thead>
                <tbody>
                  {v.rows.map(r => (
                    <tr key={r.symbol} className="border-t border-[#274292]/35">
                      <td className="px-1 py-2.25">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-white font-semibold">{r.symbol}</div>
                            <div className="font-thai text-[11px] text-text-mute">{r.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right text-text">{fmt.n(r.qty, r.qty < 1 ? 4 : 0)}</td>
                      <td className="text-right">
                        <div className="text-white">{r.cur === 'USD' ? '$' : '฿'}{fmt.n(r.price, r.price < 1 ? 4 : 2)}</div>
                        <div className="text-[11px]" style={{ color: r.dayPct >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.pct(r.dayPct, 2)}</div>
                      </td>
                      <td className="text-right text-text">{r.cur === 'USD' ? '$' : '฿'}{fmt.n(r.mv, 0)}</td>
                      <td className="text-right">
                        <div style={{ color: r.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.money(r.pnl, r.cur, 0)}</div>
                        <div className="text-[11px]" style={{ color: r.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.pct(r.pnlPct, 1)}</div>
                      </td>
                      <td className="text-right pl-2">
                        <div className="flex gap-1.25 justify-end">
                          <button className="btn green sm" onClick={() => setTrade({ sym: r.symbol, side: 'buy' })}>+</button>
                          <button className="btn red sm"   onClick={() => setTrade({ sym: r.symbol, side: 'sell' })}>−</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <TxnLog/>
        </Win>

        {/* market */}
        <Win title="MARKET" th={false}>
          <MarketSearch/>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['ALL','SET','US','FUND','CRYPTO'].map(f => (
              <button key={f} className={'btn sm ' + (filter === f ? '' : 'ghost')} onClick={() => setFilter(f)}>{f === 'ALL' ? 'ทั้งหมด' : f}</button>
            ))}
            <div className="flex-1"/>
            <button className="btn cyan sm ghost" onClick={() => OfficeStore.restoreDefaultMarket()} title="กู้คืนรายการหุ้นเริ่มต้น">↺</button>
            <button className="btn red sm ghost"  onClick={() => confirm('ล้างรายการทั้งหมดใน Market (ยกเว้นที่กำลังถืออยู่)?') && OfficeStore.clearAllMarket()} title="ล้างรายการทั้งหมด">🗑</button>
          </div>
          <div className="flex flex-col gap-0.5">
            {list.map(m => {
              const ch = (m.price - m.prevClose) / m.prevClose * 100;
              return (
                <div key={m.symbol} className="flex items-center gap-2.5 p-[8px_6px] rounded-[7px] hover:bg-[#283c8c]/20 transition-colors duration-200">
                  <ClassTag cls={m.cls}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-[14px]">{m.symbol}</div>
                    <div className="text-[11px] text-text-mute whitespace-nowrap overflow-hidden text-ellipsis">{m.name}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-white text-[14px]">{m.cur === 'USD' ? '$' : '฿'}{fmt.n(m.price, m.price < 1 ? 4 : 2)}</div>
                    <div className="text-[11px]" style={{ color: ch >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.pct(ch, 2)}</div>
                  </div>
                  <button className="btn green sm" onClick={() => setTrade({ sym: m.symbol, side: 'buy' })}>ซื้อ</button>
                  <button className="btn red sm ghost p-[4px_6px]" title="ลบออกจาก Market"
                    onClick={() => confirm('ลบ ' + m.symbol + ' ออกจากรายการ?') && OfficeStore.removeFavorite(m.symbol)}>✕</button>
                </div>
              );
            })}
          </div>
        </Win>
      </div>

      {trade && <TradeModal sym={trade.sym} side={trade.side} onClose={() => setTrade(null)}/>}
      {depo  && <DepositModal onClose={() => setDepo(false)}/>}
    </div>
  );
}

export default Portfolio;
