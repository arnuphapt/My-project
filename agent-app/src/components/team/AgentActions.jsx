import React, { useState as useS, useRef as useR, useEffect as useE } from 'react';
import { Send, Check, Star } from 'lucide-react';
import { OfficeStore, useOffice } from '../../store';
import { updateAgent, deleteAgent } from '../../api/agents.js';
import { getTeamCfg } from './teamConfig.js';
import '../../store/image-slot.js';

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

/* ── Agent Chat ── */
export function AgentChat({ a }) {
  const [s] = useOffice();
  const liveAgent = s.agents.find(x => x.id === a.id) || a;
  const [log, setLog] = useS([{ from: 'a', text: 'Hi บอส 👋 ผม ' + liveAgent.name + ' รับผิดชอบ ' + liveAgent.roleTh + ' มีอะไรให้ช่วยไหม?' }]);
  const [txt, setTxt] = useS('');
  const [busy, setBusy] = useS(false);
  const boxRef = useR(null);

  useE(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [log, busy]);

  const send = async () => {
    const t = txt.trim();
    if (!t || busy) return;
    setLog(l => [...l, { from: 'u', text: t }]);
    setTxt('');
    setBusy(true);
    try {
      const reply = await window.claude.complete({
        messages: [{
          role: 'user', content: `คุณคือ "${liveAgent.name}" พนักงาน AI ตำแหน่ง ${liveAgent.roleEn} (${liveAgent.roleTh}) ในออฟฟิศจำลองส่วนตัวของเจ้านาย.
บุคลิก: มืออาชีพ เป็นกันเอง พูดไทย กระชับ 1-3 ประโยค ใส่อิโมจิได้นิดหน่อย.

นี่คือคัมภีร์ข้อมูลบทบาท ข้อตกลง และรายละเอียดทักษะของคุณ (.skill.md):
${liveAgent.skillMd || 'ไม่มีข้อมูลทักษะเพิ่มเติม'}

เจ้านายพูดว่า: "${t}". โปรดตอบกลับในบทบาทของคุณตามคัมภีร์ด้านบนอย่างเหมาะสม`
        }],
      });
      setLog(l => [...l, { from: 'a', text: reply }]);
    } catch (e) {
      setLog(l => [...l, { from: 'a', text: 'ขอโทษครับ ตอนนี้ระบบติดขัดนิดหน่อย ลองใหม่อีกครั้งนะ 🙏' }]);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 360 }}>
      <div ref={boxRef} className="flex-1 overflow-auto flex flex-col gap-3 mb-3 min-h-[200px]">
        {log.map((m, i) => {
          const isU = m.from === 'u';
          const cfg = s.settings || {};
          const ceoName = (cfg.ownerName || '').trim() || 'CEO';
          const ceoRole = (cfg.ownerRole || 'CEO').toUpperCase();
          return (
            <div key={i} className="flex gap-2.5 max-w-[85%]" style={{
              flexDirection: isU ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              alignSelf: isU ? 'flex-end' : 'flex-start'
            }}>
              <ChatAvatar
                slot={isU ? 'player-avatar' : `card-${liveAgent.id}`}
                letter={isU ? ceoName[0] : liveAgent.name[0]}
                color={isU ? '#ff5168' : liveAgent.color || 'var(--cyan)'}
              />
              <div className="min-w-0">
                <div className="font-mono text-[11px] mb-1" style={{
                  color: isU ? '#ff8a97' : liveAgent.color || 'var(--cyan)',
                  textAlign: isU ? 'right' : 'left'
                }}>
                  {isU ? ceoRole : liveAgent.name.toUpperCase()}
                </div>
                <div className="rounded-[10px] px-3 py-2.25 text-[14px]" style={{
                  background: isU ? 'linear-gradient(180deg,#27408f,#1a2a64)' : 'rgba(14,22,60,.8)',
                  border: '1px solid ' + (isU ? 'var(--line-bright)' : 'var(--line)'),
                  color: isU ? '#fff' : 'var(--text)'
                }}>{m.text}</div>
              </div>
            </div>
          );
        })}
        {busy && (
          <div className="flex items-center gap-2.5 self-start">
            <ChatAvatar slot={`card-${liveAgent.id}`} letter={liveAgent.name[0]} color={liveAgent.color || 'var(--cyan)'} />
            <div className="text-text-mute font-mono text-[13px]">{liveAgent.name} กำลังพิมพ์…</div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input className="fld flex-1" placeholder={'คุยกับ ' + liveAgent.name + '...'} value={txt}
          onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button className="btn" onClick={send} disabled={busy}><Send className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

/* ── Agent Tasks ── */
export function AgentTasks({ a }) {
  const [s] = useOffice();
  const [txt, setTxt] = useS('');
  const live = s.agents.find(x => x.id === a.id) || a;
  const tasks = live.tasks || [];

  const assign = () => {
    const t = txt.trim(); if (!t) return;
    OfficeStore.setState(st => ({
      ...st,
      agents: st.agents.map(x => x.id === a.id
        ? { ...x, status: 'working', statusTh: 'ทำงานอยู่', last: 'เมื่อสักครู่', tasks: [{ text: t, done: false, t: OfficeStore.clock() }, ...(x.tasks || [])] }
        : x),
      log: [{ t: OfficeStore.clock(), who: a.name, text: 'รับงาน: ' + t, kind: 'ok' }, ...st.log].slice(0, 40),
    }), { now: true });
    window.electronAPI?.saveLog('info', 'Assigned task to ' + a.name + ': ' + t);
    setTxt('');
  };

  const toggle = i => {
    OfficeStore.setState(st => ({
      ...st, agents: st.agents.map(x => x.id === a.id ? { ...x, tasks: x.tasks.map((tk, j) => j === i ? { ...tk, done: !tk.done } : tk) } : x),
    }), { now: true });
    window.electronAPI?.saveLog('info', 'Toggled task status for ' + a.name);
  };

  return (
    <div>
      <label className="lbl">มอบหมายงานใหม่</label>
      <div className="flex gap-2">
        <input className="fld flex-1" placeholder={'สั่งงาน ' + a.name + '...'} value={txt}
          onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && assign()} />
        <button className="btn green" onClick={assign}>มอบ</button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {tasks.length === 0 && <div className="empty">ยังไม่มีงานที่มอบหมาย</div>}
        {tasks.map((tk, i) => (
          <div key={i} onClick={() => toggle(i)}
            className="flex gap-2.5 items-center px-3 py-2.5 bg-[#060a1e]/50 border border-line rounded-lg cursor-pointer">
            <div className="w-5 h-5 rounded-[5px] border border-line-bright flex-none flex items-center justify-center text-green"
              style={{ background: tk.done ? 'rgba(60,229,148,.18)' : 'transparent' }}>
              {tk.done ? <Check className="w-3.5 h-3.5" /> : ''}
            </div>
            <span className="flex-1 text-[14px]"
              style={{ color: tk.done ? 'var(--text-mute)' : 'var(--text)', textDecoration: tk.done ? 'line-through' : 'none' }}>
              {tk.text}
            </span>
            <span className="font-mono text-[11px] text-text-mute">{tk.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Agent Profile edit ── */
export function AgentProfile({ a }) {
  const [role, setRole] = useS(a.roleTh);
  const [desc, setDesc] = useS(a.desc);
  const [effort, setEffort] = useS(a.effort || 1);
  const skills = a.skills || [];
  const cfg = getTeamCfg();
  const modelInfo = cfg.MODEL_INFO[a.model] || cfg.MODEL_INFO.sonnet;
  const curMax = modelInfo.max || 0;

  const save = async () => {
    try {
      await updateAgent(a.id, { ...a, roleTh: role, desc, effort });
      window.electronAPI?.saveLog('info', 'Updated agent profile: ' + a.name);
      OfficeStore.syncBackendData();
    } catch (err) { console.error(err); alert('Failed to update agent'); }
  };

  const fire = async () => {
    if (window.confirm('ปลด ' + a.name + ' ออกจากทีม?')) {
      try {
        await deleteAgent(a.id);
        window.electronAPI?.saveLog('warning', 'Fired agent: ' + a.name);
        OfficeStore.syncBackendData();
      } catch (err) { console.error(err); alert('Failed to fire agent'); }
    }
  };

  return (
    <div>
      <p className="text-[14px] text-text-dim leading-relaxed mt-0">{a.desc}</p>
      <div className="flex flex-wrap gap-1.5 my-3.5 mb-4.5">
        {skills.map(sk => <span key={sk} className="chip">{sk}</span>)}
      </div>
      <label className="lbl">บทบาท (แก้ได้)</label>
      <input className="fld" value={role} onChange={e => setRole(e.target.value)} />
      <label className="lbl mt-3">คำอธิบายหน้าที่</label>
      <textarea className="fld" rows="3" value={desc} onChange={e => setDesc(e.target.value)} />
      <label className="lbl mt-3">ตั้งระดับความทุ่มเท (Effort)</label>
      {curMax > 0
        ? <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {Array.from({ length: curMax }).map((_, i) => {
            const v = i + 1;
            return <button key={v} className={'btn sm ' + (effort === v ? '' : 'ghost')} onClick={() => setEffort(v)}
              style={{ flex: 1, ...(effort === v ? { borderColor: modelInfo.col, color: modelInfo.col } : {}) }}>{v} <Star className="w-3 h-3 fill-current inline-block ml-0.5" /></button>;
          })}
        </div>
        : <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)', padding: '7px 2px' }}>— โมเดลนี้ทำงานแบบเร็ว ไม่นับ effort</div>
      }
      <div className="flex gap-2 mt-4">
        <button className="btn green flex-1" onClick={save}>บันทึก</button>
        <button className="btn red" onClick={fire}>ปลดออก</button>
      </div>
    </div>
  );
}
