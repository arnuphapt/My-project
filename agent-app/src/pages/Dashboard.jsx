import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, fmt } from '../store';
import { Win, Row, StatusDot, PageHead, Bar } from '../components/UI.jsx';
import '../store/image-slot.js';
import { checkApiHealth } from '../api/health.js';
import { Plus, ArrowRight, Headphones, SkipBack, Pause, Play, SkipForward, Send } from 'lucide-react';

/* ============ DASHBOARD / WARROOM ============ */
function Dashboard() {
  const [s, set] = useOffice();
  const v = OfficeStore.valuation();
  const FX = OfficeStore.FX;

  return (
    <div className="h-full grid grid-cols-[288px_minmax(0,1fr)_322px] gap-3 p-3 box-border">
      {/* LEFT RAIL */}
      <div className="flex flex-col gap-3 min-h-0 overflow-auto pr-0.5">
        <NetWorthPanel v={v} />
        <AgentsPanel />
        <QuantBotPanel v={v} />
      </div>

      {/* CENTER STAGE */}
      <div className="relative min-h-0 flex flex-col">
        <div className="relative flex-1 min-h-[340px]">
          <image-slot
            id="office-scene"
            shape="rounded"
            radius="12"
            placeholder="วางรูป pixel-art ออฟฟิศที่นี่ (isometric office scene)"
            className="absolute inset-0 w-full h-full"
          />
        </div>
        {/* bottom floating windows */}
        <div className="mt-3 flex-none">
          <TeamChatMini />
        </div>

      </div>

      {/* RIGHT RAIL */}
      <div className="flex flex-col gap-3 min-h-0 overflow-auto pr-0.5">
        <CompanyStatusPanel v={v} />
        <ApiStatusPanel />
        <MarketPanel />
        <LofiPanel />
      </div>
    </div>
  );
}

function NetWorthPanel({ v }) {
  const FX = OfficeStore.FX;
  const totalTHB = v.totalUSD * FX;
  const dayPos = v.dayPnlUSD >= 0;
  return (
    <Win title="NET WORTH" th={false} right={<span className="tag mr-1.5">วันนี้</span>}>
      <div className="font-mono text-[30px] text-gold tracking-[0.5px] leading-none">
        ฿{fmt.n(totalTHB, 2)}
      </div>
      <div className="font-mono text-[17px] text-white mt-1.5">
        ${fmt.n(v.totalUSD, 2)} <span className="text-text-mute text-[12px]">USD</span>
      </div>
      <div className="text-[12px] text-text-mute mt-1.5 font-mono">@ {FX} THB/USD · sim</div>
      <div className="mt-2.5 border-t border-[#274292]/40 pt-2">
        <Row k="กำไร/ขาดทุนวันนี้" v={fmt.money(v.dayPnlUSD, 'USD')} cls={dayPos ? 'pos' : 'neg'} />
        <Row k="เงินสดพร้อมลงทุน" v={fmt.money(v.cashUSD, 'USD')} />
      </div>
    </Win>
  );
}

function AgentsPanel() {
  const [s, set] = useOffice();
  return (
    <Win title="AI AGENTS" right={<span className="win-dots mr-1"><i onClick={() => set({ route: 'team' })} className="flex items-center justify-center"><Plus className="w-2 h-2" /></i></span>}>
      <div className="flex flex-col gap-0.5">
        {s.agents.slice(0, 6).map(a => (
          <div
            key={a.id}
            onClick={() => set({ route: 'team' })}
            className="flex items-center gap-2.25 p-[7px_4px] cursor-pointer rounded-[7px] hover:bg-[#283c8c]/25 transition-colors duration-200"
          >
            <StatusDot s={a.status} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-[14px] font-semibold">{a.name}</div>
              <div className="text-text-mute text-[11px] font-mono whitespace-nowrap overflow-hidden text-ellipsis">{a.statusTh} · {a.last}</div>
            </div>
            <span
              className="font-mono text-[11px]"
              style={{ color: a.color }}
            >
              Lv{a.lv}
            </span>
          </div>
        ))}
      </div>
      <button className="btn ghost sm w-full mt-2 flex items-center justify-center gap-1.5" onClick={() => set({ route: 'team' })}>จัดการทีม <ArrowRight className="w-3.5 h-3.5" /></button>
    </Win>
  );
}

function QuantBotPanel({ v }) {
  return (
    <Win title="QUANT BOT" accent="purple">
      <Row k="ROI รวม" v={fmt.pct(v.unrealPct)} cls={v.unrealPct >= 0 ? 'pos' : 'neg'} />
      <Row k="กำไรลอยตัว" v={fmt.money(v.unrealUSD, 'USD')} cls={v.unrealUSD >= 0 ? 'pos' : 'neg'} />
      <Row k="มูลค่าถือครอง" v={fmt.money(v.mvUSD, 'USD')} />
      <Row k="จำนวนสินทรัพย์" v={v.rows.length + ' รายการ'} />
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#274292]/40">
        <span className="text-text-dim text-[13px]">สถานะ</span>
        <span className="font-pixel text-[10px] text-green [text-shadow:0_0_10px_rgba(60,229,148,0.6)]">RUNNING</span>
      </div>
    </Win>
  );
}

function CompanyStatusPanel({ v }) {
  const FX = OfficeStore.FX;
  const realizedUSD = v && (OfficeStore.getState().realized.usd + OfficeStore.getState().realized.thb / FX);
  const totalPnl = v.unrealUSD + realizedUSD;
  return (
    <Win title="COMPANY STATUS">
      <Row k="Realized PnL" v={fmt.money(realizedUSD, 'USD')} cls={realizedUSD >= 0 ? 'pos' : 'neg'} />
      <Row k="Total PnL" v={fmt.money(totalPnl, 'USD')} cls={totalPnl >= 0 ? 'pos' : 'neg'} />
      <Row k="Net Worth" v={fmt.money(v.totalUSD, 'USD')} cls="gold" />
      <Row k="Holdings" v={fmt.money(v.mvUSD, 'USD')} />
      <Row k="Cash" v={fmt.money(v.cashUSD, 'USD')} />
      <Row k="วันนี้" v={fmt.money(v.dayPnlUSD, 'USD')} cls={v.dayPnlUSD >= 0 ? 'pos' : 'neg'} />
      <div className="font-mono text-[11px] text-text-mute mt-2">อัปเดต {new Date().toTimeString().slice(0, 5)}</div>
    </Win>
  );
}

function MarketPanel() {
  const [s] = useOffice();
  const items = Object.values(s.market);
  return (
    <Win title="MARKET PRICES" className="min-h-0">
      <div className="grid grid-cols-[1fr_auto_auto] gap-[2px_12px] font-mono text-[13px]">
        <div className="text-text-mute text-[11px]">สินทรัพย์</div>
        <div className="text-text-mute text-[11px] text-right">ราคา</div>
        <div className="text-text-mute text-[11px] text-right">24ชม</div>
        {items.map(m => {
          const ch = (m.price - m.prevClose) / m.prevClose * 100;
          return (
            <React.Fragment key={m.symbol}>
              <div className="text-white py-1 whitespace-nowrap overflow-hidden text-ellipsis">{m.symbol}</div>
              <div className="text-right text-text">{m.cur === 'USD' ? '$' : '฿'}{fmt.n(m.price, m.price < 1 ? 4 : 2)}</div>
              <div
                className="text-right"
                style={{ color: ch >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {fmt.pct(ch, 1)}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="font-mono text-[11px] text-text-mute mt-2">อัปเดต {new Date().toTimeString().slice(0, 5)} · live</div>
    </Win>
  );
}

const TRACKS = ['Pixel Rain', 'Midnight Build', 'Neon Focus', 'Lo-Fi Ledger', '8-bit Dreams'];
function LofiPanel() {
  const [playing, setPlaying] = useS(true);
  const [pos, setPos] = useS(105);
  const [ti, setTi] = useS(0);
  const len = 210;
  useE(() => {
    if (!playing) return;
    const id = setInterval(() => setPos(p => { if (p >= len) { setTi(t => (t + 1) % TRACKS.length); return 0; } return p + 1; }), 1000);
    return () => clearInterval(id);
  }, [playing]);
  const mmss = x => Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0');
  return (
    <Win title="LOFI BEATS TO CODE" accent="purple">
      <div className="flex gap-2.75 items-center">
        <div className="w-[50px] h-[50px] rounded-[9px] bg-gradient-to-br from-[#6a4cb8] to-[#2f4ea8] flex items-center justify-center flex-none shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <Headphones className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-text-mute font-mono">Now Playing</div>
          <div className="text-[15px] text-white font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{TRACKS[ti]}</div>
          <div className="font-mono text-[11px] text-text-dim mt-0.5">{mmss(pos)} / {mmss(len)}</div>
        </div>
      </div>
      <div className="mt-2.25"><Bar pct={pos / len * 100} tone="purple" /></div>
      <div className="flex justify-center items-center gap-4 mt-2.5 text-text-dim">
        <SkipBack className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={() => setTi(t => (t + TRACKS.length - 1) % TRACKS.length)} />
        <span className="cursor-pointer text-cyan hover:text-white transition-colors flex items-center justify-center w-6 h-6 rounded-md bg-[#0a102c]/50 border border-line" onClick={() => setPlaying(p => !p)}>
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </span>
        <SkipForward className="w-4 h-4 cursor-pointer hover:text-white transition-colors" onClick={() => { setTi(t => (t + 1) % TRACKS.length); setPos(0); }} />
      </div>
    </Win>
  );
}


function TeamChatMini() {
  const [s] = useOffice();
  const [txt, setTxt] = useS('');
  const boxRef = useR(null);
  useE(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [s.teamChat.length]);

  const send = () => {
    const t = txt.trim();
    if (!t) return;
    OfficeStore.setState(st => ({ ...st, teamChat: [...st.teamChat, { who: 'you', text: t, t: OfficeStore.clock() }] }), { now: true });
    setTxt('');
    setTimeout(() => {
      const a = s.agents[Math.floor(Math.random() * 4)];
      if (!a) return;
      const reps = ['รับทราบครับเจ้านาย！', 'จัดให้เลย 💪', 'โอเค เดี๋ยวลุยต่อ', '555 ได้เลย', 'กำลังทำอยู่นะ'];
      OfficeStore.setState(st => ({ ...st, teamChat: [...st.teamChat, { who: a.id, text: reps[Math.floor(Math.random() * reps.length)], t: OfficeStore.clock() }] }), { now: true });
    }, 700);
  };

  const nameOf = id => id === 'you' ? 'คุณ' : (s.agents.find(a => a.id === id)?.name || id);
  const colOf = id => id === 'you' ? 'var(--cyan)' : (s.agents.find(a => a.id === id)?.color || 'var(--text-dim)');
  return (
    <Win title="TEAM CHAT" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={boxRef} className="flex-1 overflow-auto p-[10px_12px] flex flex-col gap-1.75 max-h-[130px]">
        {s.teamChat.map((m, i) => (
          <div key={i} className="text-[13px] leading-normal">
            <span className="font-mono text-[11px]" style={{ color: colOf(m.who) }}>{nameOf(m.who)}: </span>
            <span className="text-text">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-1.75 p-[9px_11px] border-t border-line">
        <input
          className="fld px-2.5 py-2 text-[13px] flex-1"
          placeholder="พิมพ์ข้อความ..."
          value={txt}
          onChange={e => setTxt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="btn sm" onClick={send}><Send className="w-3 h-3" /></button>
      </div>
    </Win>
  );
}

function ApiStatusPanel() {
  const [status, setStatus] = useS('connecting');
  const [latency, setLatency] = useS(0);

  useE(() => {
    let active = true;
    const check = async () => {
      try {
        const start = Date.now();
        const res = await checkApiHealth();
        if (active && res.status === 'online') {
          setStatus('online');
          setLatency(res.latency);
        } else if (active) {
          setStatus('offline');
        }
      } catch (e) {
        if (active) setStatus('offline');
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const color = status === 'online' ? 'var(--green)' : status === 'connecting' ? 'var(--gold)' : 'var(--red)';
  const label = status === 'online' ? 'CONNECTED' : status === 'connecting' ? 'CONNECTING' : 'DISCONNECTED';

  return (
    <Win title="BACKEND API">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
        <div className="flex-1 text-white text-[13px] font-mono">{label}</div>
        {status === 'online' && <div className="text-text-mute text-[11px] font-mono">{latency}ms</div>}
      </div>
      <div className="font-mono text-[11px] text-text-mute mt-2">http://127.0.0.1:8000/</div>
    </Win>
  );
}

Object.assign(window, { NetWorthPanel, AgentsPanel, QuantBotPanel, CompanyStatusPanel, MarketPanel, LofiPanel, TeamChatMini, Bubble, ApiStatusPanel });

export default Dashboard;
