import { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { useOffice } from '../store';
import { Mic, Send, Terminal, RotateCcw, Power } from 'lucide-react';

/* ============ WEBLIVE · AGENT SQUAD LIVE TERMINAL ============
   พิมพ์สั่ง agent ฝั่งซ้าย → เห็น terminal log (mock) ฝั่งขวา
   เลียนแบบ "Agent Squad WebLive" — UI mock ล้วน ยังไม่ต่อ AI จริง
 ============================================ */

// mock terminal lines an agent "emits" after receiving an order
const SCRIPT = (agentName, task) => [
  { kind: 'tool', text: `Bash(cd /workspace && git log --oneline -5)` },
  { kind: 'out', text: `9835da1 chore: update ${agentName} and team roster` },
  { kind: 'sys', text: `Shell cwd was reset to /workspace` },
  { kind: 'think', text: `อ่าน brief: "${task}" — วาง plan ก่อนลงมือ` },
  { kind: 'tool', text: `Read(PLAN.md)` },
  { kind: 'tool', text: `Bash(npm run build)` },
  { kind: 'out', text: `✓ built in 2.4s · 0 errors` },
  { kind: 'tool', text: `Bash(git add -A && git commit -m "feat: ${task}")` },
  { kind: 'out', text: `[main 8745029] feat: ${task}` },
  { kind: 'out', text: `  4 files changed, 291 insertions(+), 38 deletions(-)` },
  { kind: 'ok', text: `✓ Cooked — งานเสร็จ callback + เขียน Diary` },
];

function WebLive() {
  const [s] = useOffice();
  const agents = s.agents || [];
  const [selId, setSelId] = useS(null);
  // derive active agent: use selection if still valid, else fall back to first
  const active = agents.find(a => a.id === selId) || agents[0] || null;
  const activeId = active?.id || null;
  const setActiveId = setSelId;
  const [msg, setMsg] = useS('');
  const [lines, setLines] = useS([
    { kind: 'sys', text: 'Agent Squad WebLive · terminal ready' },
    { kind: 'sys', text: 'พิมพ์คำสั่งฝั่งซ้ายเพื่อมอบงานให้ agent' },
  ]);
  const [busy, setBusy] = useS(false);
  const termRef = useR(null);
  const timers = useR([]);

  // auto-scroll terminal to bottom on new lines
  useE(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  // clear pending timers on unmount
  useE(() => () => timers.current.forEach(clearTimeout), []);

  const push = (line) => setLines(ls => [...ls, line]);

  const send = () => {
    const t = msg.trim();
    if (!t || !active || busy) return;
    setMsg('');
    setBusy(true);
    push({ kind: 'you', text: `> @${active.name}  ${t}` });

    const script = SCRIPT(active.name, t);
    timers.current = [];
    script.forEach((line, i) => {
      const id = setTimeout(() => {
        push(line);
        if (i === script.length - 1) setBusy(false);
      }, 500 + i * 650);
      timers.current.push(id);
    });
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setBusy(false);
    setLines([{ kind: 'sys', text: 'terminal cleared' }]);
  };

  return (
    <div className="h-full flex gap-3 p-3">
      {/* ===== LEFT · AGENT LIST + CHAT ===== */}
      <div className="w-[300px] flex-none flex flex-col rounded-xl bg-[#0c0f18]/80 border border-line overflow-hidden">
        <div className="px-3.5 py-3 border-b border-line">
          <div className="font-pixel text-[11px] text-cyan tracking-[1.5px] [text-shadow:0_0_8px_rgba(70,182,255,0.4)]">AGENT SQUAD</div>
          <div className="font-pixel text-[11px] text-white tracking-[1.5px]">WEBLIVE</div>
        </div>

        {/* agent avatars */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {agents.map(a => (
            <button
              key={a.id}
              onClick={() => setActiveId(a.id)}
              className={'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ' +
                (a.id === activeId ? 'bg-[#16203a] border border-line-bright' : 'border border-transparent hover:bg-[#121829]')}
            >
              <div
                className="w-9 h-9 rounded-full flex-none flex items-center justify-center font-pixel text-[14px] relative"
                style={{ background: (a.color || '#46b6ff') + '22', color: a.color || '#46b6ff', border: '2px solid ' + (a.color || '#46b6ff') + '55' }}
              >
                {a.name[0]}
                <span className={'sdot s-' + a.status} style={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, border: '2px solid #0c0f18' }}></span>
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[12px] text-white truncate">{a.name}</div>
                <div className="font-mono text-[10px] text-text-mute truncate">{a.roleTh || a.roleEn}</div>
              </div>
            </button>
          ))}
        </div>

        {/* chat box */}
        <div className="p-2.5 border-t border-line">
          <div className="font-mono text-[10px] text-text-mute mb-1.5">
            MESSAGE TO {active ? active.name : '—'}
          </div>
          <textarea
            className="fld text-[13px] w-full"
            rows="3"
            placeholder={active ? `สั่งงาน ${active.name}...` : 'ยังไม่มี agent'}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            disabled={!active}
          />
          <div className="flex gap-2 mt-2">
            <button className="btn ghost sm flex-none" disabled title="Voice (ยังไม่เปิด)"><Mic className="w-3.5 h-3.5" /></button>
            <button className="btn flex-1" onClick={send} disabled={!active || busy}>
              <Send className="w-3.5 h-3.5" /> {busy ? 'กำลังทำ...' : 'ส่ง'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== RIGHT · TERMINAL ===== */}
      <div className="flex-1 flex flex-col rounded-xl bg-[#070a11] border border-line overflow-hidden">
        {/* terminal header */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-line bg-[#0c0f18]/80">
          <span className={'sdot s-' + (active?.status || 'idle')}></span>
          <span className="font-mono text-[13px] text-white">{active ? active.name : 'TERMINAL'}</span>
          <span className="font-mono text-[11px] text-text-mute flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> {busy ? 'running' : 'idle'}
          </span>
          <div className="ml-auto flex gap-2">
            <button className="btn ghost sm" onClick={reset}><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            <button className="btn ghost sm" disabled title="Shutdown (ยังไม่เปิด)"><Power className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* terminal body */}
        <div ref={termRef} className="flex-1 overflow-y-auto p-3.5 font-mono text-[12.5px] leading-[1.7]">
          {lines.map((l, i) => <TermLine key={i} line={l} />)}
          {busy && <div className="text-cyan animate-pulse">▌</div>}
        </div>
      </div>
    </div>
  );
}

const KIND_STYLE = {
  you:   'text-cyan',
  tool:  'text-[#9d6bff]',
  out:   'text-text-dim',
  sys:   'text-text-mute italic',
  think: 'text-gold',
  ok:    'text-green',
};

function TermLine({ line }) {
  const prefix = line.kind === 'tool' ? '⏺ ' : line.kind === 'out' ? '   ' : '';
  return (
    <div className={KIND_STYLE[line.kind] || 'text-text'}>
      {prefix}{line.text}
    </div>
  );
}

export default WebLive;
