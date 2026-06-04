import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, fmt } from '../store';
import { Win, Row, Bar, StatusDot, PageHead, Modal, Rarity, ClassTag, SumCard } from '../components/UI.jsx';
import '../store/image-slot.js';

/* ============ PORTFOLIO (tabbed) ============ */
function Portfolio() {
  const [tab, setTab] = useS('sim');
  return (
    <div className="max-w-[1280px] mx-auto px-[22px] py-5">
      <div className="flex gap-2 mb-[18px] p-1.25 rounded-[11px] bg-[#080a12]/60 border border-line w-fit">
        <button className={'pf-tab' + (tab === 'sim' ? ' on' : '')} onClick={() => setTab('sim')}>
          🧪 จำลอง <span className="opacity-70 text-[11px]">· Simulate</span>
        </button>
        <button className={'pf-tab' + (tab === 'live' ? ' on' : '')} onClick={() => setTab('live')}>
          ⚡ ลงทุนจริง <span className="opacity-70 text-[11px]">· Live</span>
        </button>
      </div>
      {tab === 'sim' ? <SimPortfolio /> : <LiveTrading />}
    </div>
  );
}

/* ============ SIMULATED PORTFOLIO ============ */
function SimPortfolio() {
  const [s] = useOffice();
  const v = OfficeStore.valuation();
  const FX = OfficeStore.FX;
  const [filter, setFilter] = useS('ALL');
  const [trade, setTrade] = useS(null); // {sym, side}
  const [depo, setDepo] = useS(false);

  const realizedUSD = s.realized.usd + s.realized.thb / FX;
  const list = Object.values(s.market).filter(m => filter === 'ALL' || m.cls === filter);

  return (
    <div>
      <PageHead
        title="พอร์ตจำลอง"
        sub="ฝึกลงทุนด้วยเงินจำลอง · ราคาขยับเรียลไทม์ทุก 2 วินาที"
        right={
          <div className="flex gap-2.5">
            <button className="btn gold" onClick={() => setDepo(true)}>＋ เติมเงิน</button>
          </div>
        }
      />

      {/* summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <SumCard label="มูลค่ารวม (Net Worth)" main={'฿' + fmt.n(v.totalUSD * FX, 0)} sub={'$' + fmt.n(v.totalUSD, 2)} tone="gold" />
        <SumCard label="กำไรลอยตัว (Unrealized)" main={fmt.money(v.unrealUSD, 'USD')} sub={fmt.pct(v.unrealPct)} tone={v.unrealUSD >= 0 ? 'pos' : 'neg'} />
        <SumCard label="กำไรที่ขายแล้ว (Realized)" main={fmt.money(realizedUSD, 'USD')} sub={'฿' + fmt.n(realizedUSD * FX, 0)} tone={realizedUSD >= 0 ? 'pos' : 'neg'} />
        <SumCard label="เงินสดพร้อมลงทุน" main={'฿' + fmt.n(s.cash.thb, 0)} sub={'$' + fmt.n(s.cash.usd, 2)} tone="cyan" onClick={() => setDepo(true)} />
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
                    <th>ถือ</th>
                    <th>ราคา</th>
                    <th>มูลค่า</th>
                    <th>กำไร/ขาดทุน</th>
                    <th></th>
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
                        <div
                          className="text-[11px]"
                          style={{ color: r.dayPct >= 0 ? 'var(--green)' : 'var(--red)' }}
                        >
                          {fmt.pct(r.dayPct, 2)}
                        </div>
                      </td>
                      <td className="text-right text-text">{r.cur === 'USD' ? '$' : '฿'}{fmt.n(r.mv, 0)}</td>
                      <td className="text-right">
                        <div style={{ color: r.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.money(r.pnl, r.cur, 0)}</div>
                        <div
                          className="text-[11px]"
                          style={{ color: r.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}
                        >
                          {fmt.pct(r.pnlPct, 1)}
                        </div>
                      </td>
                      <td className="text-right pl-2">
                        <div className="flex gap-1.25 justify-end">
                          <button className="btn green sm" onClick={() => setTrade({ sym: r.symbol, side: 'buy' })}>+</button>
                          <button className="btn red sm" onClick={() => setTrade({ sym: r.symbol, side: 'sell' })}>−</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <TxnLog />
        </Win>

        {/* market */}
        <Win title="MARKET" th={false}>
          <MarketSearch />
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['ALL', 'SET', 'US', 'FUND', 'CRYPTO'].map(f => (
              <button key={f} className={'btn sm ' + (filter === f ? '' : 'ghost')} onClick={() => setFilter(f)}>{f === 'ALL' ? 'ทั้งหมด' : f}</button>
            ))}
            <div className="flex-1"></div>
            <button className="btn cyan sm ghost" onClick={() => OfficeStore.restoreDefaultMarket()} title="กู้คืนรายการหุ้นเริ่มต้น">↺</button>
            <button className="btn red sm ghost" onClick={() => confirm('ล้างรายการทั้งหมดใน Market (ยกเว้นที่กำลังถืออยู่)?') && OfficeStore.clearAllMarket()} title="ล้างรายการทั้งหมด">🗑</button>
          </div>
          <div className="flex flex-col gap-0.5">
            {list.map(m => {
              const ch = (m.price - m.prevClose) / m.prevClose * 100;
              return (
                <div
                  key={m.symbol}
                  className="flex items-center gap-2.5 p-[8px_6px] rounded-[7px] hover:bg-[#283c8c]/20 transition-colors duration-200"
                >
                  <ClassTag cls={m.cls} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-[14px]">{m.symbol}</div>
                    <div className="text-[11px] text-text-mute whitespace-nowrap overflow-hidden text-ellipsis">{m.name}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-white text-[14px]">{m.cur === 'USD' ? '$' : '฿'}{fmt.n(m.price, m.price < 1 ? 4 : 2)}</div>
                    <div
                      className="text-[11px]"
                      style={{ color: ch >= 0 ? 'var(--green)' : 'var(--red)' }}
                    >
                      {fmt.pct(ch, 2)}
                    </div>
                  </div>
                  <button className="btn green sm" onClick={() => setTrade({ sym: m.symbol, side: 'buy' })}>ซื้อ</button>
                  <button
                    className="btn red sm ghost p-[4px_6px]"
                    title="ลบออกจาก Market"
                    onClick={() => confirm('ลบ ' + m.symbol + ' ออกจากรายการ?') && OfficeStore.removeFavorite(m.symbol)}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </Win>
      </div>

      {trade && <TradeModal sym={trade.sym} side={trade.side} onClose={() => setTrade(null)} />}
      {depo && <DepositModal onClose={() => setDepo(false)} />}
    </div>
  );
}

function TxnLog() {
  const [s] = useOffice();
  if (!s.txns.length) return null;
  return (
    <div className="mt-3.5 pt-3 border-t border-line">
      <div className="font-pixel2 text-[11px] text-text-dim mb-2 tracking-[0.5px]">ประวัติการเทรด</div>
      <div className="flex flex-col gap-1 max-h-[140px] overflow-auto font-mono text-[12px]">
        {s.txns.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-text-mute">{t.t}</span>
            <span
              className="w-8.5"
              style={{ color: t.type === 'BUY' ? 'var(--green)' : 'var(--red)' }}
            >
              {t.type === 'BUY' ? 'ซื้อ' : 'ขาย'}
            </span>
            <span className="text-white flex-1">{t.sym} ×{fmt.n(t.qty, t.qty < 1 ? 4 : 0)} @ {t.cur === 'USD' ? '$' : '฿'}{fmt.n(t.price, 2)}</span>
            {t.pnl != null && (
              <span style={{ color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmt.money(t.pnl, t.cur, 0)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeModal({ sym, side, onClose }) {
  const [s] = useOffice();
  const m = s.market[sym];
  const held = s.holdings.find(h => h.symbol === sym);
  const [mode, setMode] = useS(side);

  const initialQty = m.cls === 'CRYPTO' ? 0.01 : 1;
  const [qty, setQty] = useS(String(initialQty));
  const [costStr, setCostStr] = useS(String(initialQty * m.price));
  const [err, setErr] = useS('');

  const handleQtyChange = (v) => {
    setQty(v);
    const n = parseFloat(v);
    if (!isNaN(n)) setCostStr(String(n * m.price));
    else setCostStr('');
    setErr('');
  };

  const handleCostChange = (v) => {
    setCostStr(v);
    const n = parseFloat(v);
    if (!isNaN(n)) setQty(String(n / m.price));
    else setQty('');
    setErr('');
  };

  const setPercent = (pct) => {
    if (mode === 'buy') {
      const ccy = m.cur === 'USD' ? 'usd' : 'thb';
      const availableCash = s.cash[ccy];
      const targetCost = availableCash * pct;
      handleCostChange(String(targetCost));
    } else if (held) {
      const targetQty = held.qty * pct;
      handleQtyChange(String(targetQty));
    }
  };

  const q = parseFloat(qty) || 0;
  const cost = parseFloat(costStr) || 0;
  const ccy = m.cur === 'USD' ? 'usd' : 'thb';
  const cash = s.cash[ccy];

  const go = () => {
    const r = mode === 'buy' ? OfficeStore.buy(sym, q) : OfficeStore.sell(sym, q);
    if (!r.ok) { setErr(r.msg); return; }
    onClose();
  };

  return (
    <Modal title={(mode === 'buy' ? 'ซื้อ ' : 'ขาย ') + sym} onClose={onClose} width={440}>
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-white text-[17px] font-bold">{m.name}</div>
          <div className="mt-1.25"><ClassTag cls={m.cls} /></div>
        </div>
        <div className="text-right font-mono">
          <div className="text-white text-[22px]">{m.cur === 'USD' ? '$' : '฿'}{fmt.n(m.price, m.price < 1 ? 4 : 2)}</div>
          <div className="text-[12px] text-text-mute">ราคาตลาด · {m.cur}</div>
        </div>
      </div>
      <div className="flex gap-2 mb-3.5">
        <button className={'btn ' + (mode === 'buy' ? 'green' : 'ghost')} style={{ flex: 1 }} onClick={() => { setMode('buy'); setErr(''); }}>ซื้อ</button>
        <button className={'btn ' + (mode === 'sell' ? 'red' : 'ghost')} style={{ flex: 1 }} onClick={() => { setMode('sell'); setErr(''); }}>ขาย</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="lbl">จำนวนหุ้น{held ? ' · มี ' + fmt.n(held.qty, held.qty < 1 ? 4 : 0) : ''}</label>
          <input className="fld" type="number" value={qty} onChange={e => handleQtyChange(e.target.value)} step="any" min="0" />
        </div>
        <div>
          <label className="lbl">จำนวนเงิน ({m.cur})</label>
          <input className="fld" type="number" value={costStr} onChange={e => handleCostChange(e.target.value)} step="any" min="0" />
        </div>
      </div>

      <div className="flex gap-1.5 mt-2">
        <button className="btn ghost sm flex-1" onClick={() => setPercent(0.25)}>25%</button>
        <button className="btn ghost sm flex-1" onClick={() => setPercent(0.50)}>50%</button>
        <button className="btn ghost sm flex-1" onClick={() => setPercent(0.75)}>75%</button>
        <button className="btn ghost sm flex-1" onClick={() => setPercent(1.00)}>สูงสุด</button>
      </div>

      <div className="mt-4 p-[12px_14px] bg-[#060a1e]/60 rounded-lg border border-line">
        <Row k="เงินสดคงเหลือ" v={(m.cur === 'USD' ? '$' : '฿') + fmt.n(cash, 2)} />
      </div>
      {err && <div className="text-red text-[13px] mt-2.5 font-mono">⚠ {err}</div>}
      <button className={'btn ' + (mode === 'buy' ? 'green' : 'red')} style={{ width: '100%', marginTop: 16 }} onClick={go} disabled={q <= 0}>
        ยืนยัน{mode === 'buy' ? 'ซื้อ' : 'ขาย'} {sym}
      </button>
    </Modal>
  );
}

function DepositModal({ onClose }) {
  const [s] = useOffice();
  const [ccy, setCcy] = useS('thb');
  const [mode, setMode] = useS('set');

  // Keep input in sync with current balance when switching currency or mode (if in set mode)
  const [amt, setAmt] = useS(String(s.cash.thb));

  useE(() => {
    if (mode === 'set') setAmt(String(s.cash[ccy]));
    else setAmt('100000');
  }, [ccy, mode, s.cash]);

  return (
    <Modal title="จัดการงบประมาณ (Budget)" onClose={onClose} width={420}>
      <p className="text-text-dim text-[13px] mt-0">ตั้งค่ายอดเงินสดคงเหลือ หรือเติมเงินจำลองเข้าพอร์ต</p>

      <div className="flex gap-2 mb-3.5">
        <button className={'btn ' + (mode === 'set' ? 'cyan' : 'ghost')} style={{ flex: 1 }} onClick={() => setMode('set')}>✎ แก้ไขยอดใหม่</button>
        <button className={'btn ' + (mode === 'add' ? 'gold' : 'ghost')} style={{ flex: 1 }} onClick={() => setMode('add')}>＋ เติมเงินเพิ่ม</button>
      </div>

      <div className="flex gap-2 mb-3">
        <button className={'btn ' + (ccy === 'thb' ? 'ghost on' : 'ghost')} style={{ flex: 1 }} onClick={() => setCcy('thb')}>บาท ฿</button>
        <button className={'btn ' + (ccy === 'usd' ? 'ghost on' : 'ghost')} style={{ flex: 1 }} onClick={() => setCcy('usd')}>ดอลลาร์ $</button>
      </div>

      <label className="lbl">จำนวนเงิน</label>
      <input className="fld" type="number" value={amt} onChange={e => setAmt(e.target.value)} />

      <div className="flex gap-1.5 mt-2">
        {(ccy === 'thb' ? [0, 50000, 100000, 500000, 1000000] : [0, 1000, 5000, 10000, 50000]).map(x => (
          <button key={x} className="btn ghost sm" onClick={() => setAmt(String(x))}>
            {x === 0 ? '0' : fmt.compact(x)}
          </button>
        ))}
      </div>

      <button
        className={'w-full mt-4.5 btn ' + (mode === 'add' ? 'gold' : 'cyan')}
        onClick={() => {
          const val = parseFloat(amt) || 0;
          if (mode === 'add') OfficeStore.deposit(ccy, val);
          else OfficeStore.setCash(ccy, val);
          onClose();
        }}
      >
        {mode === 'add' ? 'เติมเงิน ' : 'บันทึกยอดเป็น '}{(ccy === 'thb' ? '฿' : '$') + fmt.n(parseFloat(amt) || 0, 0)}
      </button>
    </Modal>
  );
}

function MarketSearch() {
  const [q, setQ] = useS('');
  const [results, setResults] = useS([]);

  useE(() => {
    if (q.trim().length < 1) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.quotes || []);
        }
      } catch (e) { }
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  const add = (r) => {
    let cls = 'US';
    if (r.quoteType === 'CRYPTOCURRENCY') cls = 'CRYPTO';
    else if (r.exchDisp === 'SET') cls = 'SET';
    else if (r.quoteType === 'MUTUALFUND' || r.quoteType === 'ETF') cls = 'FUND';

    OfficeStore.addFavorite({
      symbol: r.symbol,
      name: r.shortname || r.longname || r.symbol,
      cls: cls,
      price: 1,
      cur: (cls === 'SET' || cls === 'FUND') ? 'THB' : 'USD',
      prevClose: 1,
      seed: 1
    });
    setQ('');
    setResults([]);
  };

  return (
    <div className="mb-3">
      <input
        className="fld"
        placeholder="🔍 ค้นหาชื่อหุ้น, คริปโต (เช่น AAPL, BTC)..."
        value={q}
        onChange={e => setQ(e.target.value)}
      />

      {results.length > 0 && (
        <div className="bg-[#080a12] border border-line rounded-lg mt-2 max-h-[300px] overflow-auto shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="p-[6px_12px] bg-white/5 text-[11px] text-text-dim border-b border-line">
            ผลการค้นหา (คลิกเพื่อเพิ่มลง Market)
          </div>
          {results.map((r, i) => (
            <div
              key={i}
              className="p-[8px_12px] cursor-pointer border-b border-white/5 flex justify-between hover:bg-[#283c8c]/30 transition-colors duration-200"
              onClick={() => add(r)}
            >
              <div>
                <div className="text-white font-semibold">{r.symbol}</div>
                <div className="text-[11px] text-text-dim">{r.shortname || r.longname}</div>
              </div>
              <div className="text-right">
                <span className="chip text-[10px]">{r.exchDisp || r.quoteType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ LIVE TRADING (future · TradingView bot) ============ */
function LiveTrading() {
  const [s] = useOffice();
  const L = s.live;
  const upd = patch => OfficeStore.setState(st => ({ ...st, live: { ...st.live, ...patch } }), { now: true });
  const webhook = 'https://my-office.app/hook/' + (L.apiKey ? L.apiKey.slice(0, 6).toLowerCase() : 'xxxxxx') + '-tv';
  const canConnect = L.apiKey.trim().length > 6 && L.apiSecret.trim().length > 6;

  return (
    <div>
      <PageHead
        title="ลงทุนจริง · LIVE"
        sub="เชื่อม TradingView เพื่อรันบอทเทรดอัตโนมัติ — ส่วนนี้กำลังพัฒนา ตั้งค่าล่วงหน้าได้"
        right={
          <span
            className="chip px-[11px] py-1.5"
            style={{
              color: L.connected ? 'var(--green)' : 'var(--gold)',
              borderColor: (L.connected ? 'var(--green)' : 'var(--gold)') + '66'
            }}
          >
            <span className={'mr-0.5 sdot s-' + (L.connected ? 'working' : 'idle')}></span>
            {L.connected ? 'เชื่อมต่อแล้ว (Paper)' : 'ยังไม่เชื่อมต่อ'}
          </span>
        }
      />

      {/* roadmap banner */}
      <div className="win flex-row items-center gap-4 p-[14px_18px] mb-4 border-[#9d6bff]/40">
        <div className="text-[26px]">🤖</div>
        <div className="flex-1">
          <div className="font-pixel2 font-bold text-[15px] text-white">โหมดเทรดอัตโนมัติ (Coming Soon)</div>
          <div className="text-[13px] text-text-dim mt-1 leading-normal">
            ตั้งค่า API + สัญญาณจาก TradingView ไว้ล่วงหน้า เมื่อระบบพร้อม บอทจะรับ alert แล้วส่งคำสั่งซื้อขายจริงให้อัตโนมัติ
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap max-w-[200px] justify-end">
          {['Webhook', 'Risk Guard', 'Paper→Live', 'Backtest'].map(x => (
            <span key={x} className="chip text-[10px]">{x}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 items-start">
        {/* CONNECT */}
        <Win title="CONNECT · เชื่อมต่อ" accent="purple" bodyStyle={{ padding: 16 }}>
          <label className="lbl">Exchange / Broker</label>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['Binance', 'Bybit', 'OKX', 'MT5'].map(x => (
              <button key={x} className={'btn sm ' + (L.exchange === x ? '' : 'ghost')} onClick={() => { upd({ exchange: x }); window.electronAPI?.saveLog('info', 'Changed exchange to: ' + x); }}>{x}</button>
            ))}
          </div>

          <label className="lbl">API Key</label>
          <input className="fld" placeholder="วาง API Key ของคุณ" value={L.apiKey} onChange={e => upd({ apiKey: e.target.value })} />
          <label className="lbl mt-2.75">API Secret</label>
          <input className="fld" type="password" placeholder="••••••••••••" value={L.apiSecret} onChange={e => upd({ apiSecret: e.target.value })} />
          <div className="font-mono text-[10px] text-text-mute mt-1.5">🔒 เก็บไว้ในเครื่องนี้เท่านั้น · ยังไม่ส่งออกจริง</div>

          <label className="lbl mt-3.5">TradingView Webhook URL</label>
          <div className="flex gap-1.5">
            <input className="fld font-mono text-[12px] text-cyan" readOnly value={webhook} />
            <button className="btn ghost sm" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(webhook); }}>คัดลอก</button>
          </div>
          <div className="font-mono text-[10px] text-text-mute mt-1.5">วาง URL นี้ในช่อง Webhook ของ Alert บน TradingView</div>

          <button
            className={'btn ' + (L.connected ? 'red' : 'green')}
            style={{ width: '100%', marginTop: 16 }}
            disabled={!canConnect && !L.connected}
            onClick={() => { upd({ connected: !L.connected, botOn: false }); window.electronAPI?.saveLog('info', 'Exchange connection status: ' + (!L.connected ? 'Connected' : 'Disconnected')); }}
          >
            {L.connected ? 'ตัดการเชื่อมต่อ' : (canConnect ? 'เชื่อมต่อ (Paper Mode)' : 'กรอก API ก่อนเชื่อมต่อ')}
          </button>
        </Win>

        {/* BOT CONFIG */}
        <div className="flex flex-col gap-3.5">
          <Win title="BOT CONTROL · ตั้งค่าบอท" bodyStyle={{ padding: 16 }}>
            <div
              className="flex items-center justify-between p-[12px_14px] rounded-[9px] mb-3.5"
              style={{
                background: L.botOn ? 'rgba(60,229,148,.08)' : 'rgba(8,10,18,.5)',
                border: '1px solid ' + (L.botOn ? 'rgba(60,229,148,.4)' : 'var(--line)')
              }}
            >
              <div>
                <div className="font-pixel2 font-bold text-[14px] text-white">สถานะบอท</div>
                <div className="font-mono text-[11px] text-text-mute mt-0.5">
                  {!L.connected ? 'เชื่อมต่อก่อนเปิดบอท' : (L.botOn ? 'กำลังรับสัญญาณ TradingView' : 'พร้อมทำงาน · ปิดอยู่')}
                </div>
              </div>
              <Toggle on={L.botOn} disabled={!L.connected} onClick={() => { upd({ botOn: !L.botOn }); window.electronAPI?.saveLog('info', 'Trading Bot status: ' + (!L.botOn ? 'ON' : 'OFF')); }} />
            </div>

            <SliderRow label="ความเสี่ยงต่อไม้" value={L.riskPct} unit="%" min={0.5} max={10} step={0.5} onChange={v => upd({ riskPct: v })} />
            <SliderRow label="ทุนสูงสุดต่อโพสิชัน" value={L.maxCapital} unit="$" min={500} max={50000} step={500} onChange={v => upd({ maxCapital: v })} />
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <SliderRow label="Take Profit" value={L.tp} unit="%" min={1} max={30} step={1} onChange={v => upd({ tp: v })} compact />
              <SliderRow label="Stop Loss" value={L.sl} unit="%" min={1} max={20} step={1} onChange={v => upd({ sl: v })} compact />
            </div>
          </Win>

          <Win title="LIVE POSITIONS" right={<span className="tag mr-1.5">realtime</span>} bodyStyle={{ padding: 16 }}>
            <div className="empty p-[18px_10px]">
              {L.connected ? 'บอทยังไม่เปิดโพสิชัน — รอสัญญาณจาก TradingView' : 'ยังไม่เชื่อมต่อ — สถานะจริงจะแสดงที่นี่'}
            </div>
          </Win>
        </div>
      </div>

      {/* CHART */}
      <Win
        title="TRADINGVIEW CHART"
        className="mt-3.5"
        right={<span className="tag mr-1.5">{L.exchange}</span>}
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative h-[300px]">
          <image-slot
            id="tv-chart"
            shape="rect"
            placeholder="ฝังกราฟ TradingView ที่นี่ (วางสกรีนช็อต/วิดเจ็ตกราฟ)"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </Win>
    </div>
  );
}

function Toggle({ on, disabled, onClick }) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      className="w-[50px] h-7 rounded-[14px] relative transition-all duration-150 flex-none"
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: on ? 'var(--green)' : '#2a3650',
        opacity: disabled ? 0.4 : 1,
        border: '1px solid ' + (on ? 'var(--green)' : 'var(--line)')
      }}
    >
      <div
        className="absolute top-0.5 w-[22px] h-[22px] rounded-[50%] bg-white transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        style={{ left: on ? 24 : 2 }}
      />
    </div>
  );
}

function SliderRow({ label, value, unit, min, max, step, onChange, compact }) {
  return (
    <div style={{ marginBottom: compact ? 0 : 12 }}>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[13px] text-text-dim">{label}</span>
        <span className="font-mono text-[14px] text-cyan">{unit === '$' ? '$' + fmt.compact(value) : value + unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--cyan)' }}
      />
    </div>
  );
}

export default Portfolio;
