import { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { useOffice } from '../store';
import { Mic, Send, Terminal, RotateCcw, Power } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

/* ============ WEBLIVE · AGENT SQUAD LIVE TERMINAL ============
   พิมพ์สั่ง agent ฝั่งซ้าย (chat log ในระบบ) ฝั่งขวาคือ terminal จริง
   ที่รัน shell process จริงผ่าน node-pty ใน Electron main process
   (xterm.js renderer <-> IPC <-> node-pty) — ไม่ใช่ mock อีกต่อไป
 ============================================ */

function WebLive() {
  const [s] = useOffice();
  const agents = s.agents || [];
  const [selId, setSelId] = useS(null);
  // derive active agent: use selection if still valid, else fall back to first
  const active = agents.find(a => a.id === selId) || agents[0] || null;
  const activeId = active?.id || null;
  const setActiveId = setSelId;
  const [msg, setMsg] = useS('');
  const [busy, setBusy] = useS(false);
  const [ready, setReady] = useS(false);
  // preload bridge missing (e.g. running in a plain browser tab, not Electron)
  const unavailable = typeof window === 'undefined' || !window.electronAPI || !window.electronAPI.ptySpawn;

  const termContainerRef = useR(null);
  const xtermRef = useR(null);
  const fitAddonRef = useR(null);
  const sessionIdRef = useR(null);

  // mount real xterm.js terminal wired to a real shell via IPC + node-pty
  useE(() => {
    if (unavailable) return;

    const sessionId = `weblive-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionIdRef.current = sessionId;
    const term = new XTerm({
      convertEol: true,
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 13,
      theme: { background: '#070a11' },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    let removeDataListener = null;
    let removeExitListener = null;

    let fitted = false;

    // defer the first fit() to the next frame: xterm's renderer needs a layout
    // pass on the container before it can measure cell dimensions, otherwise
    // FitAddon.proposeDimensions() throws (reading 'scrollBarWidth' of undefined)
    const rafId = requestAnimationFrame(() => {
      fitAddon.fit();
      fitted = true;
      window.electronAPI.ptySpawn(sessionId, term.cols, term.rows).then(() => {
        setReady(true);
        setBusy(true);
      });
    });

    removeDataListener = window.electronAPI.onPtyData(sessionId, (data) => {
      term.write(data);
    });
    removeExitListener = window.electronAPI.onPtyExit(sessionId, () => {
      setBusy(false);
      term.write('\r\n[process exited]\r\n');
    });

    term.onData((data) => {
      window.electronAPI.ptyWrite(sessionId, data);
    });

    const handleResize = () => {
      if (!fitted) return; // ignore layout events before the terminal has done its first fit
      fitAddon.fit();
      window.electronAPI.ptyResize(sessionId, term.cols, term.rows);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (termContainerRef.current) resizeObserver.observe(termContainerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (removeDataListener) removeDataListener();
      if (removeExitListener) removeExitListener();
      window.electronAPI.ptyKill(sessionId);
      term.dispose();
    };
  }, []);

  // send chat message: writes the task as a command line into the real terminal
  const send = () => {
    const t = msg.trim();
    if (!t || !active || !ready) return;
    setMsg('');
    if (window.electronAPI) {
      window.electronAPI.ptyWrite(sessionIdRef.current, t + '\r');
    }
  };

  const reset = () => {
    if (xtermRef.current) xtermRef.current.clear();
  };

  if (unavailable) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="font-mono text-[13px] text-text-mute text-center">
          WebLive terminal ต้องรันผ่าน Electron เท่านั้น — ไม่พบ window.electronAPI<br />
          กรุณาเปิดแอปผ่าน Electron แทนการเปิดในเบราว์เซอร์ตรงๆ
        </div>
      </div>
    );
  }

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

        {/* terminal body — real xterm.js mounts here */}
        <div ref={termContainerRef} className="flex-1 overflow-hidden p-2" />
      </div>
    </div>
  );
}

export default WebLive;
