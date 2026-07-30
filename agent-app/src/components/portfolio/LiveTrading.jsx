import React, { useState } from 'react';
import { Win, PageHead } from '../UI.jsx';
import '../../store/image-slot.js';
import { ClipboardList, TriangleAlert } from 'lucide-react';
import { parseSignal } from '../../lib/parseSignal.js';

/** Full Live Trading section — manual signal paste + parse + preview.
 *  No exchange/broker is connected here; real signals come from a human
 *  copy-pasting text out of a LINE group chat. Parsing is local/regex-based,
 *  nothing is sent anywhere and nothing is persisted. */
export function LiveTrading() {
  const [raw, setRaw]       = useState('');
  const [result, setResult] = useState(null); // parseSignal() return value, or null before first parse

  const handleParse = () => setResult(parseSignal(raw));

  return (
    <div>
      <PageHead
        title="ลงทุนจริง · LIVE"
        sub="วางข้อความสัญญาณจากกลุ่ม LINE แล้วกด Parse เพื่อดูตัวอย่างที่แปลงแล้ว — ยังไม่ส่งคำสั่งซื้อขายจริง"
        right={
          <span className="chip px-[11px] py-1.5" style={{ color: 'var(--gold)', borderColor: 'var(--gold)66' }}>
            <span className="mr-0.5 sdot s-idle"/>
            ยังไม่เชื่อมต่อโบรกเกอร์
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 items-start">
        {/* PASTE + PARSE */}
        <Win title="SIGNAL INPUT · วางสัญญาณ" accent="purple" bodyStyle={{ padding: 16 }}>
          <label className="lbl">ข้อความสัญญาณ (คัดลอกจากกลุ่ม LINE)</label>
          <textarea
            className="fld"
            style={{ minHeight: 120, resize: 'vertical', fontFamily: 'var(--mono)', fontSize: 13 }}
            placeholder={'ตัวอย่าง:\nXAUUSD SELL 4098-4102 SL 4106 TP1 4090 TP2 4080'}
            value={raw}
            onChange={e => setRaw(e.target.value)}
          />
          <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={handleParse} disabled={!raw.trim()}>
            Parse สัญญาณ
          </button>
          <div className="font-mono text-[10px] text-text-mute mt-2">
            แปลงในเครื่องเท่านั้น ไม่มีการส่งข้อมูลออกไปไหน · ยังไม่บันทึกประวัติ
          </div>
        </Win>

        {/* PREVIEW */}
        <Win title="PARSED PREVIEW" right={<span className="tag mr-1.5">preview</span>} bodyStyle={{ padding: 16 }}>
          {!result && (
            <div className="empty p-[18px_10px]">
              ยังไม่ได้ Parse — วางข้อความแล้วกด &quot;Parse สัญญาณ&quot;
            </div>
          )}

          {result && !result.ok && (
            <div className="flex-row items-start gap-2.5 p-[12px_14px] rounded-[9px]"
              style={{ background: 'rgba(255,93,114,.08)', border: '1px solid rgba(255,93,114,.4)' }}>
              <TriangleAlert className="w-4.5 h-4.5 text-red flex-none mt-0.5" />
              <div>
                <div className="font-pixel2 font-bold text-[13px] text-red">แปลงสัญญาณไม่สำเร็จ</div>
                <div className="text-[12px] text-text-dim mt-1">{result.error}</div>
              </div>
            </div>
          )}

          {result && result.ok && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-[12px_14px] rounded-[9px]"
                style={{ background: 'rgba(8,10,18,.5)', border: '1px solid var(--line)' }}>
                <div>
                  <div className="font-mono text-[11px] text-text-mute">SYMBOL</div>
                  <div className="font-pixel2 font-bold text-[16px] text-white mt-0.5">{result.data.symbol}</div>
                </div>
                <span className="tag" style={{
                  fontSize: 11, padding: '5px 10px',
                  color: result.data.side === 'BUY' ? 'var(--green)' : 'var(--red)',
                  border: '1px solid ' + (result.data.side === 'BUY' ? 'var(--green)' : 'var(--red)'),
                  background: result.data.side === 'BUY' ? 'rgba(60,229,148,.1)' : 'rgba(255,93,114,.1)',
                }}>{result.data.side}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-[10px_12px] rounded-[9px]" style={{ background: 'rgba(8,10,18,.5)', border: '1px solid var(--line)' }}>
                  <div className="font-mono text-[10px] text-text-mute">ENTRY</div>
                  <div className="font-mono text-[15px] text-cyan mt-0.5">
                    {result.data.entry.isRange ? `${result.data.entry.low} - ${result.data.entry.high}` : result.data.entry.low}
                  </div>
                </div>
                <div className="p-[10px_12px] rounded-[9px]" style={{ background: 'rgba(8,10,18,.5)', border: '1px solid var(--line)' }}>
                  <div className="font-mono text-[10px] text-text-mute">STOP LOSS</div>
                  <div className="font-mono text-[15px] text-red mt-0.5">{result.data.sl}</div>
                </div>
              </div>

              <div className="p-[10px_12px] rounded-[9px]" style={{ background: 'rgba(8,10,18,.5)', border: '1px solid var(--line)' }}>
                <div className="font-mono text-[10px] text-text-mute mb-1.5">TAKE PROFIT</div>
                <div className="flex gap-1.5 flex-wrap">
                  {result.data.tp.map((v, i) => (
                    <span key={i} className="chip text-[11px]" style={{ color: 'var(--green)', borderColor: 'var(--green)66' }}>
                      TP{i + 1} · {v}
                    </span>
                  ))}
                </div>
              </div>

              <button className="btn ghost" style={{ width: '100%', marginTop: 4 }} disabled title="ต้องเชื่อมต่อ MT5 ก่อน — อยู่ระหว่างพัฒนา">
                ส่งคำสั่งซื้อขาย (Coming soon — ต้องเชื่อมต่อ MT5 ก่อน)
              </button>
            </div>
          )}
        </Win>
      </div>

      {/* CHART */}
      <Win title="TRADINGVIEW CHART" className="mt-3.5" right={<span className="tag mr-1.5"><ClipboardList className="w-2.5 h-2.5 inline -mt-0.5 mr-1"/>manual</span>} bodyStyle={{ padding: 0 }}>
        <div className="relative h-[300px]">
          <image-slot id="tv-chart" shape="rect" placeholder="ฝังกราฟ TradingView ที่นี่ (วางสกรีนช็อต/วิดเจ็ตกราฟ)" className="absolute inset-0 w-full h-full"/>
        </div>
      </Win>
    </div>
  );
}
