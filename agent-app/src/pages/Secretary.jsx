import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, fmt } from '../store';
import { Win, StatusDot, PageHead } from '../components/UI.jsx';
import '../store/image-slot.js';
import { 
  UserCheck, 
  Coffee, 
  Send, 
  Trash2, 
  Cpu, 
  ShieldCheck, 
  Folder, 
  Play, 
  Square, 
  Terminal, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Code2, 
  Copy, 
  Check, 
  ChevronRight,
  Split,
  Layers
} from 'lucide-react';

/* ── Chat Avatar Helper ── */
function ChatAvatar({ slot, letter, color }) {
  return (
    <div className="relative flex-none rounded-full overflow-hidden" style={{
      width: 34, height: 34,
      boxShadow: `0 0 0 2px ${color}, 0 0 12px ${color}55`,
      background: '#0a0e1c'
    }}>
      <image-slot id={slot} shape="circle" placeholder={letter}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div className="slot-letter absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[13px]"
        style={{ color }}>{letter}</div>
    </div>
  );
}

const WORKERS = [
  { id: 'claude', name: 'Claude Code', role: 'Orchestrator (Yuri)', col: '#ffce4a', desc: 'Default orchestrator, handles subagents & multi-step execution' },
  { id: 'codex', name: 'OpenAI Codex', role: 'Specialist Worker', col: '#46b6ff', desc: 'Direct task execution via codex CLI' },
  { id: 'agy', name: 'Google Antigravity', role: 'Specialist Worker', col: '#b06bff', desc: 'Fast web-grounded research & CLI tasks' },
];

const PERMISSION_MODES = [
  { id: 'default', label: 'Default', desc: 'Prompts before running non-preapproved tools (Safest)' },
  { id: 'acceptEdits', label: 'Accept Edits', desc: 'Auto-accepts file edits without prompting' },
  { id: 'plan', label: 'Plan Only', desc: 'Read-only planning mode, no file edits' },
  { id: 'dontAsk', label: 'Don\'t Ask', desc: 'Auto-approves all tool calls (Fastest)' },
];

const PRESETS = [
  { label: 'สรุปสถานะออฟฟิศวันนี้', prompt: 'สรุปภาพรวมสถานะการทำงานในออฟฟิศวันนี้ และเช็คว่าแต่ละคนมีงานอะไรค้างอยู่บ้าง' },
  { label: 'สำรวจโครงสร้างโค้ดเบส', prompt: 'Explore this workspace repository structure and summarize key modules, files, and architectural entry points.' },
  { label: 'ตรวจสอบ Git Commits ล่าสุด', prompt: 'Check recent git commit logs and report modified areas and work in progress.' },
  { label: 'วางแผนงานสัปดาห์นี้', prompt: 'ช่วยวางแผนและจัดลำดับความสำคัญของงานในสัปดาห์นี้ให้หน่อย' },
];

const TRUSTED_PATHS = [
  'e:\\workspace\\my-project',
  'e:\\workspace\\joryui-agent',
];

function isTrustedCwd(p) {
  if (!p) return false;
  const norm = p.trim().toLowerCase().replace(/\\/g, '/');
  return TRUSTED_PATHS.some(tp => norm.startsWith(tp.replace(/\\/g, '/')));
}

export default function Secretary() {
  const [s] = useOffice();
  const [txt, setTxt] = useS('');
  const [busy, setBusy] = useS(false);
  const [activeTab, setActiveTab] = useS('chat'); // 'chat' | 'stream' | 'split'
  
  // Dispatch configuration
  const [worker, setWorker] = useS('claude');
  const [selectedAgent, setSelectedAgent] = useS('joyuri');
  const [permissionMode, setPermissionMode] = useS('default');
  const [cwd, setCwd] = useS('E:\\WorkSpace\\My-project');
  
  // Realtime Execution State
  const [runId, setRunId] = useS(null);
  const [events, setEvents] = useS([]);
  const [status, setStatus] = useS('idle'); // idle | running | success | error | canceled
  const [elapsed, setElapsed] = useS(0);
  const [copied, setCopied] = useS(false);
  const [showRaw, setShowRaw] = useS(false);
  const [pendingApproval, setPendingApproval] = useS(null);

  const boxRef = useR(null);
  const streamRef = useR(null);
  const timerRef = useR(null);

  const agents = s.agents || [];
  const sec = agents.find(a => 
    (a.roleTh && a.roleTh.includes('เลขา')) || 
    (a.roleEn && a.roleEn.toUpperCase().includes('SECRETARY')) || 
    a.seniority === 'secretary' || 
    a.id === 'joyuri'
  ) || agents[0];
  const log = s.secChat || [];

  // Pre-fill from CEO directive
  useE(() => {
    if (s.secretaryDraft) {
      setTxt(s.secretaryDraft);
      OfficeStore.setState({ secretaryDraft: '' });
    }
  }, [s.secretaryDraft]);

  // Scroll chat box
  useE(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [log.length, busy]);

  // Scroll stream console
  useE(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [events]);

  // Execution Timer
  useE(() => {
    if (busy) {
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [busy]);

  const push = (m) => OfficeStore.setState(st => ({ ...st, secChat: [...(st.secChat || []), m] }), { now: true });

  const clearChat = () => {
    if (window.confirm('คุณต้องการล้างประวัติการสนทนากับเลขาใช่หรือไม่?')) {
      OfficeStore.setState(st => ({ ...st, secChat: [] }), { now: true });
    }
  };

  const handleSend = async (presetText) => {
    const t = (presetText || txt).trim();
    if (!t || busy) return;

    push({ from: 'u', text: t });
    setTxt('');
    setBusy(true);
    setStatus('running');

    const newRunId = 'run-' + Date.now();
    setRunId(newRunId);
    setEvents([]);
    setPendingApproval(null);

    // Target agent resolution
    const targetAgentObj = agents.find(a => a.id === selectedAgent) || sec;
    const isYuri = !selectedAgent || selectedAgent === 'joyuri' || selectedAgent === sec?.id;

    OfficeStore.setState(st => ({
      ...st,
      agents: st.agents.map(a => a.id === targetAgentObj.id ? { ...a, status: 'working', statusTh: 'กำลังทำงาน...' } : a),
      log: [{ t: OfficeStore.clock(), who: (sec?.name || 'YURI').toUpperCase(), text: `[Dispatch] ${t.slice(0, 60)}...`, kind: 'sys' }, ...(st.log || [])].slice(0, 40)
    }), { now: true });

    let cleanupListener = null;
    let accumulatedText = '';

    if (window.electronAPI && window.electronAPI.onAgentEvent) {
      cleanupListener = window.electronAPI.onAgentEvent(newRunId, (ev) => {
        setEvents(prev => [...prev, ev]);

        if (ev.kind === 'tool_use' && permissionMode === 'default') {
          setPendingApproval(ev);
        } else if (ev.kind === 'tool_result' || ev.kind === 'result') {
          setPendingApproval(null);
        }

        // Forward agent speech bubble to Warroom
        if (ev.text && (ev.kind === 'text' || ev.kind === 'subagent_text')) {
          const targetId = ev.agentName || targetAgentObj.id;
          window.dispatchEvent(new CustomEvent('agent-speech', { detail: { id: targetId, text: ev.text } }));
        }

        if (ev.kind === 'result' && ev.text) {
          accumulatedText = ev.text;
        } else if (ev.kind === 'text' && ev.text) {
          accumulatedText += ev.text;
        }
      });
    }

    try {
      if (window.electronAPI && window.electronAPI.dispatchAgent) {
        const res = await window.electronAPI.dispatchAgent({
          runId: newRunId,
          worker,
          agentName: isYuri ? undefined : selectedAgent,
          permissionMode,
          cwd,
          prompt: t
        });

        if (res.canceled) {
          setStatus('canceled');
          push({ from: 'a', text: '🛑 การทำงานถูกยกเลิกแล้วค่ะ' });
        } else if (res.success) {
          setStatus('success');
          const reply = (res.result || accumulatedText || 'ดำเนินการเสร็จสิ้นเรียบร้อยแล้วค่ะ').trim();
          push({ from: 'a', text: reply });
        } else {
          setStatus('error');
          push({ from: 'a', text: `⚠️ เกิดข้อผิดพลาด: ${res.error || 'Execution failed'}` });
        }
      } else {
        // Fallback for non-electron dev mode
        setTimeout(() => {
          setStatus('success');
          push({ from: 'a', text: 'ค่ะเจ้านาย รับคำสั่งงานเรียบร้อยแล้วนะคะ' });
        }, 800);
      }
    } catch (err) {
      setStatus('error');
      push({ from: 'a', text: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}` });
    } finally {
      setBusy(false);
      if (cleanupListener) cleanupListener();

      OfficeStore.setState(st => ({
        ...st,
        agents: st.agents.map(a => a.id === targetAgentObj.id ? { ...a, status: 'idle', statusTh: 'ว่าง' } : a)
      }), { now: true });
    }
  };

  const handleCancel = async () => {
    if (!runId || !busy) return;
    try {
      await window.electronAPI.cancelAgent(runId);
      setStatus('canceled');
      setBusy(false);
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const copyEventLog = () => {
    const logText = events.map(e => `[${e.kind.toUpperCase()}] ${e.text || JSON.stringify(e.raw || '')}`).join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTrusted = isTrustedCwd(cwd);
  const activeWorkerObj = WORKERS.find(w => w.id === worker) || WORKERS[0];
  const activeAgentObj = agents.find(a => a.id === selectedAgent) || sec;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-4 h-full flex flex-col box-border">
      <style>{`
        .sec-theme {
          border-color: ${sec.color || '#ffce4a'} !important;
          box-shadow: 0 8px 24px ${sec.color || '#ffce4a'}22 !important;
        }
        .sec-theme .win-h .ttl {
          color: ${sec.color || '#ffce4a'} !important;
          text-shadow: 0 0 6px ${sec.color || '#ffce4a'}4d !important;
        }
      `}</style>

      {/* Page Header */}
      <PageHead
        title="SECRETARY & ORCHESTRATOR"
        sub={`คุยกับ ${sec.name} เลขาและ Chief of Staff — สั่งงานและ Dispatch ระบบ Multi-Agent พร้อมรับชม Realtime Stream`}
        right={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0a0e1c] border border-line font-mono text-[12px]">
              <Clock className="w-3.5 h-3.5 text-cyan" /> {elapsed}s
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0a0e1c] border border-line font-mono text-[12px]">
              <StatusDot s={busy ? 'working' : (status === 'success' ? 'idle' : status === 'error' ? 'busy' : 'idle')} />
              <span className="uppercase text-white font-bold">{busy ? 'RUNNING' : status}</span>
            </div>
            <button
              className="btn sm ghost flex items-center gap-1.5 text-text-mute hover:text-red border-line hover:border-red/30 cursor-pointer"
              onClick={clearChat}
              title="ล้างประวัติการสนทนา"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Session
            </button>
          </div>
        }
      />

      {/* Main Grid: Left Controls (360px) + Right Workspace (1fr) */}
      <div className="grid grid-cols-[360px_1fr] gap-4 flex-1 min-h-0">
        
        {/* Left Side: Secretary Profile & Dispatch Engine Setup */}
        <div className="flex flex-col gap-3 min-h-0 overflow-auto pr-0.5">
          {/* Secretary Card */}
          <Win title={sec.name.toUpperCase()} className="sec-theme" bodyStyle={{ padding: 12 }}>
            <div className="flex items-center gap-3">
              <div className="relative w-18 h-18 flex-none rounded-xl overflow-hidden bg-gradient-to-b from-[#1b2236] to-[#10141f] border border-gold/40">
                <image-slot id={`card-${sec.id}`} shape="rounded" radius="12" placeholder={sec.name} className="w-18 h-18" editable />
                <div
                  className="slot-letter absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[22px]"
                  style={{ color: sec.color, textShadow: `0 0 14px ${sec.color}b3` }}
                >
                  {sec.name[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px] text-white flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-gold" /> {sec.name}
                </div>
                <div className="text-[12px] text-text-dim mt-0.5">{sec.roleTh}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <StatusDot s={sec.status || 'idle'} />
                  <span className="text-[11.5px] font-mono text-cyan">{sec.statusTh || 'ว่าง · พร้อมรับคำสั่ง'}</span>
                </div>
              </div>
            </div>
          </Win>

          {/* Worker Engine Picker */}
          <Win title="1. WORKER ENGINE" accent="gold" bodyStyle={{ padding: 12 }}>
            <div className="flex flex-col gap-1.5">
              {WORKERS.map(w => (
                <div
                  key={w.id}
                  onClick={() => !busy && setWorker(w.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    worker === w.id
                      ? 'bg-gold/10 border-gold shadow-[0_0_10px_rgba(255,206,74,0.2)]'
                      : 'bg-[#080c1a]/50 border-line hover:border-line-bright'
                  } ${busy ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-[12px] text-white flex items-center gap-1.5">
                      <Cpu className="w-3 h-3" style={{ color: w.col }} /> {w.name}
                    </span>
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: w.col, background: w.col + '15' }}>
                      {w.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Win>

          {/* Target Subagent Picker */}
          <Win title="2. TARGET AGENT" accent="cyan" bodyStyle={{ padding: 12 }}>
            <div className="flex flex-col gap-2">
              <select
                className="fld font-mono text-[12.5px]"
                value={selectedAgent}
                disabled={busy}
                onChange={e => setSelectedAgent(e.target.value)}
              >
                <option value="joyuri">👑 {sec.name} (Direct / Chief of Staff)</option>
                {agents.filter(a => a.id !== sec.id).map(a => (
                  <option key={a.id} value={a.id}>
                    🤖 {a.name} ({a.roleTh || a.roleEn})
                  </option>
                ))}
              </select>
            </div>
          </Win>

          {/* Run Configuration (Permission & CWD) */}
          <Win title="3. RUN CONFIGURATION" bodyStyle={{ padding: 12 }}>
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="lbl flex items-center gap-1 text-[11px] mb-1">
                  <ShieldCheck className="w-3 h-3 text-green" /> Permission Mode
                </label>
                <select
                  className="fld font-mono text-[12px]"
                  value={permissionMode}
                  disabled={busy}
                  onChange={e => setPermissionMode(e.target.value)}
                >
                  {PERMISSION_MODES.map(pm => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label} — {pm.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="lbl mb-0 flex items-center gap-1 text-[11px]">
                    <Folder className="w-3 h-3 text-yellow-400" /> Working Directory (cwd)
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCwd('E:\\WorkSpace\\My-project')}
                      className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#10162a] border border-line text-cyan hover:border-cyan"
                    >
                      My-project
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCwd('E:\\WorkSpace\\Joryui-agent')}
                      className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-[#10162a] border border-line text-gold hover:border-gold"
                    >
                      Joryui-agent
                    </button>
                  </div>
                </div>
                <input
                  className={`fld font-mono text-[11.5px] ${!isTrusted ? 'border-yellow-500/70 bg-yellow-950/20' : ''}`}
                  value={cwd}
                  disabled={busy}
                  onChange={e => setCwd(e.target.value)}
                  placeholder="E:\WorkSpace\..."
                />
                {!isTrusted && (
                  <div className="text-[10.5px] text-yellow-400 mt-1 leading-tight flex items-start gap-1 p-1.5 rounded bg-yellow-950/30 border border-yellow-500/30">
                    <AlertTriangle className="w-3 h-3 flex-none mt-0.5" />
                    <span><strong>Trust Boundary Warning:</strong> ไดเรกทอรีนี้จะรัน Project Hooks (<code className="font-mono text-[9px]">.claude/settings.json</code>) ของโฟลเดอร์นั้นโดยอัตโนมัติ</span>
                  </div>
                )}
              </div>
            </div>
          </Win>

          {/* Team Roster Status */}
          <Win title="TEAM STATUS" bodyStyle={{ padding: 12 }}>
            <div className="flex flex-col gap-1.5">
              {agents.filter(a => a.id !== sec.id).map(a => (
                <div key={a.id} className="flex items-center gap-2 text-[12px]">
                  <StatusDot s={a.status} />
                  <span className="flex-1 text-text truncate">{a.name}</span>
                  <span className="font-mono text-[10.5px] text-text-mute">{(a.tasks || []).filter(t => !t.done).length} งาน</span>
                </div>
              ))}
            </div>
          </Win>
        </div>

        {/* Right Side: Chat & Realtime Stream Surface */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Surface View Switcher Bar */}
          <div className="bg-panel-solid border border-line rounded-xl p-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                className={`btn sm ${activeTab === 'chat' ? 'gold' : 'ghost'} text-[12px] flex items-center gap-1`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat Timeline
              </button>
              <button
                className={`btn sm ${activeTab === 'stream' ? 'cyan' : 'ghost'} text-[12px] flex items-center gap-1`}
                onClick={() => setActiveTab('stream')}
              >
                <Terminal className="w-3.5 h-3.5" /> Live Stream ({events.length})
              </button>
              <button
                className={`btn sm ${activeTab === 'split' ? '' : 'ghost'} text-[12px] flex items-center gap-1`}
                onClick={() => setActiveTab('split')}
              >
                <Split className="w-3.5 h-3.5" /> Split View
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {events.length > 0 && (
                <button
                  className="btn ghost sm text-[11px] font-mono py-0.5 px-2 flex items-center gap-1"
                  onClick={copyEventLog}
                >
                  {copied ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Events'}
                </button>
              )}
            </div>
          </div>

          {/* Pending Approval Notice */}
          {pendingApproval && (
            <div className="bg-yellow-950/40 border-2 border-gold rounded-xl p-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-gold flex-none" />
                <div>
                  <div className="font-mono text-[12.5px] text-gold font-bold">
                    Permission Prompt: Tool Execution [{pendingApproval.text || pendingApproval.raw?.name}]
                  </div>
                  <div className="font-mono text-[11px] text-text-dim">
                    Worker: {worker.toUpperCase()} · Mode: {permissionMode} · Target: {selectedAgent}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-gold font-semibold">Running Stream...</span>
            </div>
          )}

          {/* Main Content Area (Chat / Stream / Split) */}
          <div className="flex-1 flex gap-3 min-h-0">
            {/* Chat Timeline Box */}
            {(activeTab === 'chat' || activeTab === 'split') && (
              <Win 
                title={`CHAT WITH ${sec.name.toUpperCase()}`} 
                className="sec-theme flex-1" 
                bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}
              >
                <div ref={boxRef} className="flex-1 overflow-auto p-4 flex flex-col gap-3 min-h-0">
                  {log.length === 0 && (
                    <div className="m-auto text-center text-text-mute max-w-[380px] py-12">
                      <Coffee size={42} className="mx-auto mb-3 text-gold opacity-60" />
                      <div className="text-[15px] text-white font-bold">สวัสดีค่ะเจ้านาย! ยูริรายงานตัวค่ะ</div>
                      <div className="text-[12.5px] text-text-dim mt-1.5 leading-relaxed">
                        พิมพ์สั่งการหรือวางงานที่ต้องการได้เลยค่ะ ยูริจะประสานงานและ Dispatch ให้ทั้งทีมทันทีค่ะ
                      </div>
                    </div>
                  )}
                  {log.map((m, i) => {
                    const isU = m.from === 'u';
                    const cfg = s.settings || {};
                    const ceoName = (cfg.ownerName || '').trim() || 'CEO';
                    return (
                      <div key={i} className={`flex gap-3 items-start ${isU ? 'flex-row-reverse' : ''}`}>
                        <ChatAvatar
                          slot={isU ? 'player-avatar' : `card-${sec.id}`}
                          letter={isU ? ceoName[0] : sec.name[0]}
                          color={isU ? 'var(--cyan)' : (sec.color || '#ffce4a')}
                        />
                        <div
                          className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words font-thai ${
                            isU
                              ? 'bg-cyan/15 border border-cyan/30 text-white rounded-tr-none'
                              : 'bg-[#0f1526] border border-gold/30 text-text rounded-tl-none'
                          }`}
                        >
                          <div className="font-mono text-[10px] text-text-mute mb-1">
                            {isU ? ceoName : sec.name} · {OfficeStore.clock()}
                          </div>
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        </div>
                      </div>
                    );
                  })}
                  {busy && (
                    <div className="flex gap-3 items-start">
                      <ChatAvatar slot={`card-${sec.id}`} letter={sec.name[0]} color={sec.color || '#ffce4a'} />
                      <div className="bg-[#0f1526] border border-gold/40 px-4 py-2.5 rounded-2xl rounded-tl-none text-[13px] text-gold flex items-center gap-2 font-mono">
                        <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                        <span>กำลังประมวลผลคำสั่งงานและควบคุม Subagent...</span>
                      </div>
                    </div>
                  )}
                </div>
              </Win>
            )}

            {/* Stream Console Box */}
            {(activeTab === 'stream' || activeTab === 'split') && (
              <div className="flex-1 bg-[#06080f] border border-line rounded-xl p-3.5 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                  <div className="flex items-center gap-2 font-mono text-[12px] text-text-dim">
                    <Terminal className="w-4 h-4 text-cyan" />
                    <span>REALTIME EXECUTION TELEMETRY</span>
                    {busy && <span className="w-2 h-2 rounded-full bg-green animate-ping" />}
                  </div>
                  <button
                    className="btn ghost sm text-[10.5px] font-mono py-0.5 px-2"
                    onClick={() => setShowRaw(r => !r)}
                  >
                    {showRaw ? 'Rendered View' : 'Raw JSON'}
                  </button>
                </div>

                <div ref={streamRef} className="flex-1 overflow-auto font-mono text-[12px] leading-relaxed p-1 flex flex-col gap-1.5">
                  {events.length === 0 ? (
                    <div className="m-auto text-center text-text-mute py-12">
                      <Bot size={36} className="mx-auto mb-2 text-text-mute opacity-40" />
                      <div>ยังไม่มี Event การ Dispatch</div>
                      <div className="text-[11px] text-text-dim mt-1">ส่งข้อความหรือคำสั่งงานด้านล่างเพื่อเริ่มการรัน</div>
                    </div>
                  ) : (
                    events.map((ev, idx) => (
                      <StreamEventRow key={idx} event={ev} showRaw={showRaw} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Presets Strip */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-text-mute flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-gold" /> Quick:
            </span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                className="btn ghost sm text-[11.5px] font-thai py-1 px-2.5"
                disabled={busy}
                onClick={() => setTxt(p.prompt)}
              >
                ✦ {p.label}
              </button>
            ))}
          </div>

          {/* Input & Dispatch Box */}
          <div className="bg-panel-solid border border-line rounded-xl p-3 flex flex-col gap-2">
            <textarea
              className="fld font-mono text-[13px] leading-relaxed resize-none"
              rows={2}
              placeholder={`พิมพ์ข้อความคุยกับ ${sec.name} หรือสั่งงานให้ระบบ Dispatch...`}
              value={txt}
              disabled={busy}
              onChange={e => setTxt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSend();
                }
              }}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-text-mute">
                Ctrl + Enter เพื่อส่งคำสั่ง · Target: <strong className="text-cyan">{activeAgentObj.name}</strong> · Engine: <strong className="text-gold">{activeWorkerObj.name}</strong>
              </span>
              <div className="flex items-center gap-2">
                {busy ? (
                  <button
                    className="btn sm bg-red/80 border-red hover:bg-red text-white flex items-center gap-1.5"
                    onClick={handleCancel}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Cancel
                  </button>
                ) : (
                  <button
                    className="btn sm gold flex items-center gap-1.5"
                    disabled={!txt.trim()}
                    onClick={() => handleSend()}
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch / Send
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stream Event Row Component ── */
function StreamEventRow({ event, showRaw }) {
  const { kind, text, parentId, agentName, raw, worker } = event;

  if (showRaw) {
    return (
      <div className="p-1.5 rounded bg-black/60 border border-white/10 font-mono text-[10.5px] text-text-dim break-all">
        <span className="text-cyan">[{kind.toUpperCase()}]</span> {JSON.stringify(raw || text)}
      </div>
    );
  }

  switch (kind) {
    case 'init':
      return (
        <div className="flex items-center gap-2 p-1.5 rounded bg-cyan/5 border border-cyan/20 text-cyan text-[11.5px]">
          <ChevronRight className="w-3 h-3 flex-none" />
          <span className="font-bold">[{worker ? worker.toUpperCase() : 'INIT'}]</span>
          <span>{text || 'Process initialized'}</span>
        </div>
      );

    case 'progress':
      return (
        <div className="flex items-center gap-2 text-text-dim text-[11px] pl-2 border-l-2 border-line">
          <Clock className="w-3 h-3 text-text-mute flex-none" />
          <span>{text}</span>
        </div>
      );

    case 'subagent_start':
      return (
        <div className="p-2 rounded-lg bg-[#141b2d] border border-cyan/40 my-0.5 text-[11.5px]">
          <div className="flex items-center gap-1.5 font-bold text-cyan">
            <Bot className="w-3.5 h-3.5 text-cyan" />
            <span>SUBAGENT: {agentName || 'Agent'}</span>
          </div>
          {text && <div className="text-text-dim mt-0.5 text-[11px]">{text}</div>}
        </div>
      );

    case 'subagent_text':
      return (
        <div className="pl-4 pr-2 py-0.5 border-l-2 border-cyan/40 text-cyan-200 whitespace-pre-wrap text-[11.5px]">
          {text}
        </div>
      );

    case 'tool_use':
      return (
        <div className="flex items-start gap-2 p-1.5 rounded bg-[#0d1222] border border-line text-gold text-[11.5px]">
          <Code2 className="w-3 h-3 mt-0.5 flex-none" />
          <div className="min-w-0">
            <span className="font-bold">[TOOL]</span> <span className="text-white">{text}</span>
          </div>
        </div>
      );

    case 'tool_result':
      return (
        <div className="flex items-start gap-2 p-1 rounded bg-black/40 border border-line text-[11px] text-text-dim">
          <CheckCircle2 className="w-3 h-3 text-green mt-0.5 flex-none" />
          <div className="truncate flex-1 font-mono">
            <span className="text-green font-bold">[OUTPUT]</span> {text ? text.slice(0, 150) : 'Completed'}
          </div>
        </div>
      );

    case 'result':
      return (
        <div className="p-2.5 rounded-lg bg-green/10 border border-green text-white my-1 text-[12px]">
          <div className="flex items-center gap-1.5 font-bold text-green mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>RESULT</span>
          </div>
          <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
        </div>
      );

    case 'canceled':
      return (
        <div className="p-2 rounded bg-red/10 border border-red/40 text-red font-bold flex items-center gap-1.5 text-[11.5px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>EXECUTION CANCELED</span>
        </div>
      );

    case 'error':
      return (
        <div className="p-2 rounded bg-red/15 border border-red text-red whitespace-pre-wrap text-[11.5px]">
          <div className="font-bold flex items-center gap-1.5 mb-0.5">
            <AlertTriangle className="w-3.5 h-3.5" /> ERROR
          </div>
          <div>{text}</div>
        </div>
      );

    case 'text':
    default:
      return (
        <div className="text-white whitespace-pre-wrap py-0.5 text-[12px]">
          {text}
        </div>
      );
  }
}
