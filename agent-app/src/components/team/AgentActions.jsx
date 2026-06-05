import React, { useState as useS, useRef as useR, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../../store';
import { updateAgent, deleteAgent } from '../../api/agents.js';
import { getTeamCfg } from './teamConfig.js';

/* ── Agent Chat ── */
export function AgentChat({ a }) {
  const [log, setLog] = useS([{ from: 'a', text: 'สวัสดีครับเจ้านาย 👋 ผม ' + a.name + ' รับผิดชอบ ' + a.roleTh + ' มีอะไรให้ช่วยไหม?' }]);
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
        messages: [{ role: 'user', content: `คุณคือ "${a.name}" พนักงาน AI ตำแหน่ง ${a.roleEn} (${a.roleTh}) ในออฟฟิศจำลองส่วนตัวของเจ้านาย. บุคลิก: มืออาชีพ เป็นกันเอง พูดไทย กระชับ 1-3 ประโยค ใส่อิโมจิได้นิดหน่อย. ทักษะของคุณ: ${a.skills.join(', ')}. เจ้านายพูดว่า: "${t}". ตอบในบทบาทของคุณ` }],
      });
      setLog(l => [...l, { from: 'a', text: reply }]);
    } catch (e) {
      setLog(l => [...l, { from: 'a', text: 'ขอโทษครับ ตอนนี้ระบบติดขัดนิดหน่อย ลองใหม่อีกครั้งนะ 🙏' }]);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 360 }}>
      <div ref={boxRef} className="flex-1 overflow-auto flex flex-col gap-2.25 mb-3 min-h-[200px]">
        {log.map((m, i) => (
          <div key={i} className="max-w-[85%] rounded-[10px] px-3 py-2.25 text-[14px]" style={{
            alignSelf: m.from === 'u' ? 'flex-end' : 'flex-start',
            background: m.from === 'u' ? 'linear-gradient(180deg,#27408f,#1a2a64)' : 'rgba(14,22,60,.8)',
            border: '1px solid ' + (m.from === 'u' ? 'var(--line-bright)' : 'var(--line)'),
            color: m.from === 'u' ? '#fff' : 'var(--text)',
          }}>{m.text}</div>
        ))}
        {busy && <div className="self-start text-text-mute font-mono text-[13px]">{a.name} กำลังพิมพ์…</div>}
      </div>
      <div className="flex gap-2">
        <input className="fld flex-1" placeholder={'คุยกับ ' + a.name + '...'} value={txt}
          onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}/>
        <button className="btn" onClick={send} disabled={busy}>▶</button>
      </div>
    </div>
  );
}

/* ── Agent Tasks ── */
export function AgentTasks({ a }) {
  const [s] = useOffice();
  const [txt, setTxt] = useS('');
  const live  = s.agents.find(x => x.id === a.id) || a;
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
          onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && assign()}/>
        <button className="btn green" onClick={assign}>มอบ</button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {tasks.length === 0 && <div className="empty">ยังไม่มีงานที่มอบหมาย</div>}
        {tasks.map((tk, i) => (
          <div key={i} onClick={() => toggle(i)}
            className="flex gap-2.5 items-center px-3 py-2.5 bg-[#060a1e]/50 border border-line rounded-lg cursor-pointer">
            <div className="w-5 h-5 rounded-[5px] border border-line-bright flex-none flex items-center justify-center text-green"
              style={{ background: tk.done ? 'rgba(60,229,148,.18)' : 'transparent' }}>
              {tk.done ? '✓' : ''}
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
      <input  className="fld" value={role} onChange={e => setRole(e.target.value)}/>
      <label className="lbl mt-3">คำอธิบายหน้าที่</label>
      <textarea className="fld" rows="3" value={desc} onChange={e => setDesc(e.target.value)}/>
      <label className="lbl mt-3">ตั้งระดับความทุ่มเท (Effort)</label>
      {curMax > 0 
        ? <div style={{display:'flex', gap:6, marginTop:6}}>
            {Array.from({length: curMax}).map((_, i) => {
              const v = i + 1;
              return <button key={v} className={'btn sm ' + (effort === v ? '' : 'ghost')} onClick={() => setEffort(v)}
                style={{flex:1, ...(effort === v ? {borderColor: modelInfo.col, color: modelInfo.col} : {})}}>{v}★</button>;
            })}
          </div>
        : <div style={{fontFamily:'var(--mono)', fontSize:12, color:'var(--text-mute)', padding:'7px 2px'}}>— โมเดลนี้ทำงานแบบเร็ว ไม่นับ effort</div>
      }
      <div className="flex gap-2 mt-4">
        <button className="btn green flex-1" onClick={save}>บันทึก</button>
        <button className="btn red"          onClick={fire}>ปลดออก</button>
      </div>
    </div>
  );
}
