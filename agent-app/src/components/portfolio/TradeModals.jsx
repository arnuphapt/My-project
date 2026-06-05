import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice, fmt } from '../../store';
import { Row, Modal } from '../UI.jsx';
import { ClassTag } from '../UI.jsx';

/** Trade history log shown below holdings */
export function TxnLog() {
  const [s] = useOffice();
  if (!s.txns.length) return null;
  return (
    <div className="mt-3.5 pt-3 border-t border-line">
      <div className="font-pixel2 text-[11px] text-text-dim mb-2 tracking-[0.5px]">ประวัติการเทรด</div>
      <div className="flex flex-col gap-1 max-h-[140px] overflow-auto font-mono text-[12px]">
        {s.txns.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-text-mute">{t.t}</span>
            <span className="w-8.5" style={{ color: t.type === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{t.type === 'BUY' ? 'ซื้อ' : 'ขาย'}</span>
            <span className="text-white flex-1">{t.sym} ×{fmt.n(t.qty, t.qty < 1 ? 4 : 0)} @ {t.cur === 'USD' ? '$' : '฿'}{fmt.n(t.price, 2)}</span>
            {t.pnl != null && <span style={{ color: t.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt.money(t.pnl, t.cur, 0)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Buy / Sell modal */
export function TradeModal({ sym, side, onClose }) {
  const [s]    = useOffice();
  const m      = s.market[sym];
  const held   = s.holdings.find(h => h.symbol === sym);
  const [mode, setMode] = useS(side);

  const initialQty = m.cls === 'CRYPTO' ? 0.01 : 1;
  const [qty,     setQty]     = useS(String(initialQty));
  const [costStr, setCostStr] = useS(String(initialQty * m.price));
  const [err,     setErr]     = useS('');

  const handleQtyChange  = (v) => { setQty(v); const n = parseFloat(v); if (!isNaN(n)) setCostStr(String(n * m.price)); else setCostStr(''); setErr(''); };
  const handleCostChange = (v) => { setCostStr(v); const n = parseFloat(v); if (!isNaN(n)) setQty(String(n / m.price)); else setQty(''); setErr(''); };
  const setPercent = (pct) => {
    if (mode === 'buy') { const ccy = m.cur === 'USD' ? 'usd' : 'thb'; handleCostChange(String(s.cash[ccy] * pct)); }
    else if (held)      { handleQtyChange(String(held.qty * pct)); }
  };

  const q    = parseFloat(qty)     || 0;
  const cost = parseFloat(costStr) || 0;
  const ccy  = m.cur === 'USD' ? 'usd' : 'thb';
  const cash = s.cash[ccy];
  const go   = () => { const r = mode === 'buy' ? OfficeStore.buy(sym, q) : OfficeStore.sell(sym, q); if (!r.ok) { setErr(r.msg); return; } onClose(); };

  return (
    <Modal title={(mode === 'buy' ? 'ซื้อ ' : 'ขาย ') + sym} onClose={onClose} width={440}>
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="text-white text-[17px] font-bold">{m.name}</div>
          <div className="mt-1.25"><ClassTag cls={m.cls}/></div>
        </div>
        <div className="text-right font-mono">
          <div className="text-white text-[22px]">{m.cur === 'USD' ? '$' : '฿'}{fmt.n(m.price, m.price < 1 ? 4 : 2)}</div>
          <div className="text-[12px] text-text-mute">ราคาตลาด · {m.cur}</div>
        </div>
      </div>
      <div className="flex gap-2 mb-3.5">
        <button className={'btn ' + (mode === 'buy'  ? 'green' : 'ghost')} style={{ flex: 1 }} onClick={() => { setMode('buy');  setErr(''); }}>ซื้อ</button>
        <button className={'btn ' + (mode === 'sell' ? 'red'   : 'ghost')} style={{ flex: 1 }} onClick={() => { setMode('sell'); setErr(''); }}>ขาย</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="lbl">จำนวนหุ้น{held ? ' · มี ' + fmt.n(held.qty, held.qty < 1 ? 4 : 0) : ''}</label>
          <input className="fld" type="number" value={qty}     onChange={e => handleQtyChange(e.target.value)}  step="any" min="0"/>
        </div>
        <div>
          <label className="lbl">จำนวนเงิน ({m.cur})</label>
          <input className="fld" type="number" value={costStr} onChange={e => handleCostChange(e.target.value)} step="any" min="0"/>
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0.25, 0.50, 0.75, 1.00].map(p => (
          <button key={p} className="btn ghost sm flex-1" onClick={() => setPercent(p)}>{p === 1 ? 'สูงสุด' : (p * 100) + '%'}</button>
        ))}
      </div>
      <div className="mt-4 p-[12px_14px] bg-[#060a1e]/60 rounded-lg border border-line">
        <Row k="เงินสดคงเหลือ" v={(m.cur === 'USD' ? '$' : '฿') + fmt.n(cash, 2)}/>
      </div>
      {err && <div className="text-red text-[13px] mt-2.5 font-mono">⚠ {err}</div>}
      <button className={'btn ' + (mode === 'buy' ? 'green' : 'red')} style={{ width: '100%', marginTop: 16 }} onClick={go} disabled={q <= 0}>
        ยืนยัน{mode === 'buy' ? 'ซื้อ' : 'ขาย'} {sym}
      </button>
    </Modal>
  );
}

/** Add / set budget modal */
export function DepositModal({ onClose }) {
  const [s]    = useOffice();
  const [ccy,  setCcy]  = useS('thb');
  const [mode, setMode] = useS('set');
  const [amt,  setAmt]  = useS(String(s.cash.thb));

  useE(() => { if (mode === 'set') setAmt(String(s.cash[ccy])); else setAmt('100000'); }, [ccy, mode, s.cash]);

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
      <input className="fld" type="number" value={amt} onChange={e => setAmt(e.target.value)}/>
      <div className="flex gap-1.5 mt-2">
        {(ccy === 'thb' ? [0,50000,100000,500000,1000000] : [0,1000,5000,10000,50000]).map(x => (
          <button key={x} className="btn ghost sm" onClick={() => setAmt(String(x))}>{x === 0 ? '0' : fmt.compact(x)}</button>
        ))}
      </div>
      <button className={'w-full mt-4.5 btn ' + (mode === 'add' ? 'gold' : 'cyan')}
        onClick={() => { const val = parseFloat(amt) || 0; if (mode === 'add') OfficeStore.deposit(ccy, val); else OfficeStore.setCash(ccy, val); onClose(); }}>
        {mode === 'add' ? 'เติมเงิน ' : 'บันทึกยอดเป็น '}{(ccy === 'thb' ? '฿' : '$') + fmt.n(parseFloat(amt) || 0, 0)}
      </button>
    </Modal>
  );
}
