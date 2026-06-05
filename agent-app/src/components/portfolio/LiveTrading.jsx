import React from 'react';
import { OfficeStore, useOffice } from '../../store';
import { Win, PageHead } from '../UI.jsx';
import { Toggle }    from './Toggle.jsx';
import { SliderRow } from './SliderRow.jsx';
import '../../store/image-slot.js';
import { Bot, Lock } from 'lucide-react';

/** Full Live Trading section (TradingView bot + config) */
export function LiveTrading() {
  const [s] = useOffice();
  const L   = s.live;
  const upd = patch => OfficeStore.setState(st => ({ ...st, live: { ...st.live, ...patch } }), { now: true });
  const webhook    = 'https://my-office.app/hook/' + (L.apiKey ? L.apiKey.slice(0, 6).toLowerCase() : 'xxxxxx') + '-tv';
  const canConnect = L.apiKey.trim().length > 6 && L.apiSecret.trim().length > 6;

  return (
    <div>
      <PageHead
        title="ลงทุนจริง · LIVE"
        sub="เชื่อม TradingView เพื่อรันบอทเทรดอัตโนมัติ — ส่วนนี้กำลังพัฒนา ตั้งค่าล่วงหน้าได้"
        right={
          <span className="chip px-[11px] py-1.5" style={{ color: L.connected ? 'var(--green)' : 'var(--gold)', borderColor: (L.connected ? 'var(--green)' : 'var(--gold)') + '66' }}>
            <span className={'mr-0.5 sdot s-' + (L.connected ? 'working' : 'idle')}/>
            {L.connected ? 'เชื่อมต่อแล้ว (Paper)' : 'ยังไม่เชื่อมต่อ'}
          </span>
        }
      />

      {/* roadmap banner */}
      <div className="win flex-row items-center gap-4 p-[14px_18px] mb-4 border-[#9d6bff]/40">
        <Bot className="w-8 h-8 text-[#9d6bff] flex-none" />
        <div className="flex-1">
          <div className="font-pixel2 font-bold text-[15px] text-white">โหมดเทรดอัตโนมัติ (Coming Soon)</div>
          <div className="text-[13px] text-text-dim mt-1 leading-normal">ตั้งค่า API + สัญญาณจาก TradingView ไว้ล่วงหน้า เมื่อระบบพร้อม บอทจะรับ alert แล้วส่งคำสั่งซื้อขายจริงให้อัตโนมัติ</div>
        </div>
        <div className="flex gap-1.5 flex-wrap max-w-[200px] justify-end">
          {['Webhook','Risk Guard','Paper→Live','Backtest'].map(x => <span key={x} className="chip text-[10px]">{x}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 items-start">
        {/* CONNECT */}
        <Win title="CONNECT · เชื่อมต่อ" accent="purple" bodyStyle={{ padding: 16 }}>
          <label className="lbl">Exchange / Broker</label>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {['Binance','Bybit','OKX','MT5'].map(x => (
              <button key={x} className={'btn sm ' + (L.exchange === x ? '' : 'ghost')} onClick={() => { upd({ exchange: x }); window.electronAPI?.saveLog('info', 'Changed exchange to: ' + x); }}>{x}</button>
            ))}
          </div>
          <label className="lbl">API Key</label>
          <input className="fld" placeholder="วาง API Key ของคุณ" value={L.apiKey} onChange={e => upd({ apiKey: e.target.value })}/>
          <label className="lbl mt-2.75">API Secret</label>
          <input className="fld" type="password" placeholder="••••••••••••" value={L.apiSecret} onChange={e => upd({ apiSecret: e.target.value })}/>
          <div className="font-mono text-[10px] text-text-mute mt-1.5 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> เก็บไว้ในเครื่องนี้เท่านั้น · ยังไม่ส่งออกจริง</div>
          <label className="lbl mt-3.5">TradingView Webhook URL</label>
          <div className="flex gap-1.5">
            <input className="fld font-mono text-[12px] text-cyan" readOnly value={webhook}/>
            <button className="btn ghost sm" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(webhook); }}>คัดลอก</button>
          </div>
          <div className="font-mono text-[10px] text-text-mute mt-1.5">วาง URL นี้ในช่อง Webhook ของ Alert บน TradingView</div>
          <button className={'btn ' + (L.connected ? 'red' : 'green')} style={{ width: '100%', marginTop: 16 }} disabled={!canConnect && !L.connected}
            onClick={() => { upd({ connected: !L.connected, botOn: false }); window.electronAPI?.saveLog('info', 'Exchange connection status: ' + (!L.connected ? 'Connected' : 'Disconnected')); }}>
            {L.connected ? 'ตัดการเชื่อมต่อ' : (canConnect ? 'เชื่อมต่อ (Paper Mode)' : 'กรอก API ก่อนเชื่อมต่อ')}
          </button>
        </Win>

        {/* BOT CONFIG */}
        <div className="flex flex-col gap-3.5">
          <Win title="BOT CONTROL · ตั้งค่าบอท" bodyStyle={{ padding: 16 }}>
            <div className="flex items-center justify-between p-[12px_14px] rounded-[9px] mb-3.5"
              style={{ background: L.botOn ? 'rgba(60,229,148,.08)' : 'rgba(8,10,18,.5)', border: '1px solid ' + (L.botOn ? 'rgba(60,229,148,.4)' : 'var(--line)') }}>
              <div>
                <div className="font-pixel2 font-bold text-[14px] text-white">สถานะบอท</div>
                <div className="font-mono text-[11px] text-text-mute mt-0.5">
                  {!L.connected ? 'เชื่อมต่อก่อนเปิดบอท' : (L.botOn ? 'กำลังรับสัญญาณ TradingView' : 'พร้อมทำงาน · ปิดอยู่')}
                </div>
              </div>
              <Toggle on={L.botOn} disabled={!L.connected} onClick={() => { upd({ botOn: !L.botOn }); window.electronAPI?.saveLog('info', 'Trading Bot status: ' + (!L.botOn ? 'ON' : 'OFF')); }}/>
            </div>
            <SliderRow label="ความเสี่ยงต่อไม้"    value={L.riskPct}    unit="%" min={0.5} max={10}    step={0.5} onChange={v => upd({ riskPct: v })}/>
            <SliderRow label="ทุนสูงสุดต่อโพสิชัน" value={L.maxCapital} unit="$" min={500} max={50000} step={500} onChange={v => upd({ maxCapital: v })}/>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <SliderRow label="Take Profit" value={L.tp} unit="%" min={1} max={30} step={1} onChange={v => upd({ tp: v })} compact/>
              <SliderRow label="Stop Loss"   value={L.sl} unit="%" min={1} max={20} step={1} onChange={v => upd({ sl: v })} compact/>
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
      <Win title="TRADINGVIEW CHART" className="mt-3.5" right={<span className="tag mr-1.5">{L.exchange}</span>} bodyStyle={{ padding: 0 }}>
        <div className="relative h-[300px]">
          <image-slot id="tv-chart" shape="rect" placeholder="ฝังกราฟ TradingView ที่นี่ (วางสกรีนช็อต/วิดเจ็ตกราฟ)" className="absolute inset-0 w-full h-full"/>
        </div>
      </Win>
    </div>
  );
}
