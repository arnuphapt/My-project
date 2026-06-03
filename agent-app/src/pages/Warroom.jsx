import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, StatusDot, Rarity, Modal } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ WARROOM · IMMERSIVE ISOMETRIC OFFICE ============ */
function WarRoom() {
  const [s, set] = useOffice();
  const [bubbles, setBubbles] = useS({});   // ephemeral speech {agentId:text}
  const [open, setOpen] = useS(null);        // popover agent id
  const [cmd, setCmd] = useS('');
  const [place, setPlace] = useS(false);     // place-characters mode
  const [drag, setDrag] = useS(null);        // {id} being dragged
  const [live, setLive] = useS(null);        // {id,x,y} live drag pos
  const [clock, setClock] = useS(nowHM());
  const stageRef = useR(null);

  useE(() => { 
    const id = setInterval(() => setClock(nowHM()), 30000); 
    return () => clearInterval(id); 
  }, []);

  // ambient thoughts
  useE(() => {
    if (place) return;
    const id = setInterval(() => {
      const a = s.agents[Math.floor(Math.random() * s.agents.length)];
      if (a) popBubble(a.id, IDLE_THOUGHTS[Math.floor(Math.random() * IDLE_THOUGHTS.length)]);
    }, 5000);
    return () => clearInterval(id);
  }, [s.agents.length, place]);

  function popBubble(id, text) {
    setBubbles(b => ({ ...b, [id]: text }));
    setTimeout(() => setBubbles(b => { 
      const n = { ...b }; 
      if (n[id] === text) delete n[id]; 
      return n; 
    }), 4200);
  }

  const broadcast = () => {
    const t = cmd.trim(); 
    if (!t) return;
    OfficeStore.setState(st => ({
      ...st,
      teamChat: [...st.teamChat, { who: 'you', text: '📢 ' + t, t: OfficeStore.clock() }],
      log: [{ t: OfficeStore.clock(), who: 'You', text: 'สั่งงานรวม: ' + t, kind: 'sys' }, ...st.log].slice(0, 40),
    }), { now: true });
    s.agents.forEach((a, i) => setTimeout(() => popBubble(a.id, ACK[Math.floor(Math.random() * ACK.length)]), 200 + i * 160));
    setCmd('');
  };

  /* ----- drag handling ----- */
  const pos = (id) => (live && live.id === id) ? live : (s.warroomPos[id] || { x: 50, y: 50 });
  function onDown(e, id) {
    if (!place) return;
    e.preventDefault(); 
    e.stopPropagation();
    setDrag({ id });
    setLive({ id, ...(s.warroomPos[id] || { x: 50, y: 50 }) });
  }
  function onMove(e) {
    if (!drag) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(10, Math.min(96, ((e.clientY - r.top) / r.height) * 100));
    setLive({ id: drag.id, x, y });
  }
  function onUp() {
    if (drag && live) { 
      OfficeStore.setState(st => ({ ...st, warroomPos: { ...st.warroomPos, [live.id]: { x: live.x, y: live.y } } }), { now: true }); 
    }
    setDrag(null); 
    setLive(null);
  }

  return (
    <div 
      className="h-full relative overflow-hidden"
      ref={stageRef} 
      onPointerMove={onMove} 
      onPointerUp={onUp} 
      onPointerLeave={onUp}
    >
      {/* ===== ROOM BACKDROP ===== */}
      <image-slot 
        id="office-scene" 
        shape="rect"
        placeholder="วางรูปห้องออฟฟิศ isometric ที่นี่ (พื้นไม้ · หน้าต่าง · โต๊ะทำงาน — เต็มห้อง)"
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(120%_90%_at_50%_18%,transparent_40%,rgba(6,8,14,0.72)_100%)]"></div>

      {/* ===== CHARACTER TOKENS ===== */}
      {s.agents.map(a => {
        const p = pos(a.id);
        return (
          <CharToken 
            key={a.id} 
            a={a} 
            x={p.x} 
            y={p.y} 
            bubble={bubbles[a.id]} 
            place={place}
            dragging={drag && drag.id === a.id}
            onDown={e => onDown(e, a.id)} 
            onClick={() => { if (!place) setOpen(a.id); }}
          />
        );
      })}

      {/* ===== TOP TOOLBAR ===== */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3.5 px-3.5 py-2 rounded-[11px] bg-[#0c0f18]/82 border border-line-bright backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        <span className="font-pixel text-[10px] text-cyan tracking-[1.5px] [text-shadow:0_0_8px_rgba(70,182,255,0.4)]">WARROOM</span>
        <span className="font-mono text-[13px] text-white">🕐 {clock}</span>
        <span className="font-mono text-[13px] text-green">🟢 {s.agents.filter(a => a.status !== 'idle').length}/{s.agents.length}</span>
        <button className={'whitespace-nowrap btn sm ' + (place ? 'green' : 'ghost')} onClick={() => setPlace(p => !p)}>
          {place ? '✓ เสร็จแล้ว' : '🧩 จัดวางตัวละคร'}
        </button>
      </div>

      {/* place-mode hint */}
      {place && (
        <div className="absolute top-[58px] left-1/2 -translate-x-1/2 z-30 font-mono text-[12px] text-cyan bg-[#0c0f18]/80 px-3 py-1.25 rounded-lg border border-line">
          ลากตัวละครไปวางตำแหน่งบนโต๊ะในห้องได้เลย
        </div>
      )}

      {/* ===== ORDER BAR ===== */}
      <div className="absolute left-1/2 bottom-3 -translate-x-1/2 z-30 flex items-center gap-2.25 px-2.5 py-2 rounded-[11px] w-[min(560px,86%)] bg-[#0c0f18]/86 border border-line backdrop-blur-md">
        <span className="font-pixel text-[8px] text-cyan tracking-[1px] flex-none">ORDER ALL ▸</span>
        <input 
          className="fld px-2.75 py-2 text-[13px] flex-1" 
          placeholder="ออกคำสั่งให้ทุกคนในออฟฟิศ..." 
          value={cmd}
          onChange={e => setCmd(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && broadcast()} 
        />
        <button className="btn sm" onClick={broadcast}>📢</button>
      </div>

      {open && (
        <DeskPopover 
          agent={s.agents.find(a => a.id === open)} 
          onClose={() => setOpen(null)}
          onAssigned={txt => popBubble(open, txt)}
        />
      )}
    </div>
  );
}

function nowHM() { 
  return new Date().toTimeString().slice(0, 5); 
}
const IDLE_THOUGHTS = ['☕', 'พิมพ์ๆ...', '📊', 'อืม น่าสน', 'เกือบเสร็จละ', '555', 'focus 🎧', 'เช็คตลาดแป๊บ', '📝', '✦'];
const ACK = ['รับทราบ! 💪', 'จัดให้เลย', 'โอเค ลุยต่อ', '555 ได้เลย', 'กำลังทำ ✦', 'เคลียร์ทันที'];

/* ---- speech bubble ---- */
function Speech({ text, color }) {
  if (!text) return null;
  return (
    <div className="wr-speech" style={{ borderColor: (color || '#46b6ff') + 'aa' }}>
      {text}
      <span className="wr-speech-tail"></span>
    </div>
  );
}

/* ---- draggable character token ---- */
function CharToken({ a, x, y, bubble, place, dragging, onDown, onClick }) {
  return (
    <div 
      onPointerDown={onDown} 
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-full select-none touch-none"
      style={{ 
        left: x + '%', 
        top: y + '%', 
        zIndex: dragging ? 40 : 10,
        cursor: place ? 'grab' : 'pointer',
        filter: dragging ? 'drop-shadow(0 10px 16px rgba(0,0,0,.6))' : 'none', 
        transition: dragging ? 'none' : 'filter .1s'
      }}
    >
      <Speech text={place ? null : bubble} color={a.color} />

      {/* character */}
      <div className="relative w-[74px] h-[84px] mx-auto">
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[60px] h-3 bg-[radial-gradient(ellipse,rgba(0,0,0,0.5),transparent_70%)] rounded-[50%]"></div>
        <div 
          className="absolute inset-0 bottom-2 flex items-center justify-center pointer-events-none font-pixel text-[26px]"
          style={{ color: a.color, textShadow: '0 0 12px ' + a.color + '66' }}
        >
          {a.name[0]}
        </div>
        <image-slot 
          id={'agent-' + a.id} 
          shape="rect"
          className="absolute left-0 right-0 top-0 bottom-2 w-[74px] h-[76px]"
          style={{ 
            border: place ? '1.5px dashed ' + a.color : 'none', 
            background: place ? 'rgba(10,14,24,.4)' : 'transparent' 
          }}
        />
        <span className={'sdot s-' + a.status} style={{ position: 'absolute', right: 6, top: 2, width: 11, height: 11, border: '2px solid #0c0f18' }}></span>
      </div>

      {/* nameplate */}
      <div 
        className="mt-0.5 px-2 py-0.5 rounded-[7px] bg-[#0c0f18]/90 text-center whitespace-nowrap"
        style={{ border: '1px solid ' + a.color + '55' }}
      >
        <span className="font-mono text-[11px] text-white">{a.name}</span>
        <span className="font-mono text-[10px] ml-1.25" style={{ color: a.color }}>Lv{a.lv}</span>
      </div>
    </div>
  );
}

/* ---- popover: assign task / set status / chat ---- */
function DeskPopover({ agent, onClose, onAssigned }) {
  const [task, setTask] = useS(agent.task || '');
  const [, set] = useOffice();
  const upd = patch => OfficeStore.setState(st => ({ ...st, agents: st.agents.map(x => x.id === agent.id ? { ...x, ...patch } : x) }), { now: true });
  const assign = () => {
    const t = task.trim(); 
    if (!t) return;
    upd({ task: t, status: 'working', statusTh: t, last: 'เมื่อสักครู่' });
    OfficeStore.setState(st => ({
      ...st,
      teamChat: [...st.teamChat, { who: 'you', text: '@' + agent.name + ' ' + t, t: OfficeStore.clock() },
        { who: agent.id, text: ACK[Math.floor(Math.random() * ACK.length)], t: OfficeStore.clock() }],
      log: [{ t: OfficeStore.clock(), who: agent.name, text: 'รับงาน: ' + t, kind: 'ok' }, ...st.log].slice(0, 40),
    }), { now: true });
    if (onAssigned) onAssigned(ACK[Math.floor(Math.random() * ACK.length)]);
    onClose();
  };
  return (
    <Modal title={agent.roleEn + ' · ' + agent.name} onClose={onClose} width={460}>
      <div className="flex gap-3.5 items-center mb-3.5">
        <div 
          className="w-16 h-[70px] rounded-xl relative overflow-hidden flex-none bg-gradient-to-b from-[#1b2236] to-[#10141f]"
          style={{ border: '2px solid ' + agent.color + '66' }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[24px]" style={{ color: agent.color }}>{agent.name[0]}</div>
          <image-slot 
            id={'agent-' + agent.id} 
            shape="rounded" 
            radius="12"
            className="absolute inset-0 w-16 h-[70px]"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Rarity r={agent.rarity} />
            <span className="font-mono text-[12px]" style={{ color: agent.color }}>Lv{agent.lv}</span>
          </div>
          <div className="text-[13px] text-text-dim mt-1.5 leading-normal">{agent.roleTh}</div>
          <div className="flex items-center gap-1.75 mt-1.75">
            <span className={'sdot s-' + agent.status}></span>
            <span className="text-[12px] text-text">{agent.statusTh}</span>
          </div>
        </div>
      </div>
      <label className="lbl">มอบหมายงาน</label>
      <textarea className="fld" rows="2" placeholder={'สั่งงาน ' + agent.name + '...'} value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) assign(); }} />
      <div className="flex gap-2 mt-2">
        <span className="font-mono text-[11px] text-text-mute self-center">สถานะ:</span>
        {[['working', 'ทำงาน', '#3ce594'], ['thinking', 'คิดอยู่', '#46b6ff'], ['idle', 'ว่าง', '#9aa6cf']].map(([st, lb, c]) => (
          <button 
            key={st} 
            className={'flex-1 btn sm ' + (agent.status === st ? '' : 'ghost')}
            onClick={() => upd({ status: st, statusTh: lb })} 
            style={{ color: agent.status === st ? '#0b0e16' : c }}
          >
            {lb}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn green flex-1" onClick={assign}>มอบหมายงาน</button>
        <button className="btn ghost" onClick={() => { onClose(); set({ route: 'team' }); }}>ดูโปรไฟล์</button>
      </div>
    </Modal>
  );
}

export default WarRoom;
