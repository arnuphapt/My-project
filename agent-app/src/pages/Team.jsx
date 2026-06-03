import React, { useState as useS, useRef as useR } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, StatusDot, PageHead, Modal, Rarity } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ TEAM ============ */
function Team() {
  const [s] = useOffice();
  const [open, setOpen] = useS(null);  // agent id
  const [create, setCreate] = useS(false);
  const agent = s.agents.find(a => a.id === open);

  return (
    <div className="max-w-[1280px] mx-auto px-[22px] py-5">
      <PageHead 
        title="TEAM ROSTER" 
        sub="พนักงาน AI ในออฟฟิศ · กดที่การ์ดเพื่อคุย มอบหมายงาน หรือแก้บทบาท"
        right={<button className="btn" onClick={() => setCreate(true)}>＋ เพิ่มพนักงาน AI</button>}
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-3.5">
        {s.agents.map(a => (
          <AgentCard key={a.id} a={a} onClick={() => setOpen(a.id)} />
        ))}
        <div 
          onClick={() => setCreate(true)} 
          className="win min-h-[268px] flex flex-col items-center justify-center cursor-pointer gap-2.5 !border-dashed border-cyan/40 hover:border-cyan/80 transition-colors duration-200"
        >
          <div className="text-[34px] text-cyan">＋</div>
          <div className="font-pixel2 text-[12px] text-text-dim">NEW AGENT</div>
        </div>
      </div>

      {agent && <AgentDrawer a={agent} onClose={() => setOpen(null)} />}
      {create && <CreateAgent onClose={() => setCreate(false)} />}
    </div>
  );
}

const RFRAME = { legend: '#ffce4a', epic: '#b06bff', rare: '#4db4ff', common: '#9aa6cf' };

function AgentCard({ a, onClick }) {
  const open = a.tasks.filter(t => !t.done).length;
  return (
    <div 
      onClick={onClick} 
      className="win cursor-pointer transition-transform duration-100 hover:-translate-y-[3px]"
      style={{ 
        borderColor: RFRAME[a.rarity], 
        boxShadow: '0 0 22px ' + RFRAME[a.rarity] + '33, inset 0 0 28px rgba(14,28,72,.5)' 
      }}
    >
      <div className="p-[12px_12px_0] flex justify-between items-start">
        <span className="font-mono text-[11px] text-text-mute">{a.roleEn}</span>
        <Rarity r={a.rarity} />
      </div>
      <div className="p-[10px_12px] flex justify-center">
        <div className="relative w-[120px] h-[120px]">
          <image-slot 
            id={'card-' + a.id} 
            shape="rounded" 
            radius="10" 
            placeholder={a.name}
            className="w-[120px] h-[120px]"
          />
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[30px]"
            style={{ color: a.color, textShadow: '0 0 14px ' + a.color + '99' }}
          >
            {a.name[0]}
          </div>
        </div>
      </div>
      <div className="p-[0_14px_14px]">
        <div className="flex items-center gap-1.75">
          <StatusDot s={a.status} />
          <span className="font-pixel2 font-bold text-[16px] text-white">{a.name}</span>
        </div>
        <div className="text-[12px] text-text-dim mt-1.25">{a.roleTh}</div>
        <div className="flex justify-between items-center mt-2.5 font-mono text-[11px] text-text-mute">
          <span>Lv {a.lv}</span>
          <span style={{ color: a.color }}>💰 ${a.salary}/d</span>
          {open > 0 && <span className="chip text-gold border-gold/40">{open} งาน</span>}
        </div>
      </div>
    </div>
  );
}

function AgentDrawer({ a, onClose }) {
  const [tab, setTab] = useS('chat');
  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[200] bg-[#040614]/70 backdrop-blur-[3px] flex justify-end"
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-[min(480px,94vw)] h-full bg-panel-solid shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
        style={{ borderLeft: '1px solid ' + RFRAME[a.rarity] }}
      >
        {/* header */}
        <div className="p-4.5 border-b border-line flex gap-3.5 items-center">
          <div className="relative w-16 h-16 flex-none">
            <image-slot id={'card-' + a.id} shape="rounded" radius="10" placeholder={a.name} className="w-16 h-16" />
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[20px]"
              style={{ color: a.color }}
            >
              {a.name[0]}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.25">
              <span className="font-pixel2 font-bold text-[20px] text-white">{a.name}</span>
              <Rarity r={a.rarity} />
            </div>
            <div className="flex items-center gap-1.75 mt-1.5">
              <StatusDot s={a.status} />
              <span className="text-[13px] text-text-dim">{a.statusTh} · {a.roleTh}</span>
            </div>
          </div>
          <i onClick={onClose} className="cursor-pointer text-text-mute text-[20px] font-mono">×</i>
        </div>
        {/* tabs */}
        <div className="flex gap-1.5 px-[18px] pt-3 pb-0">
          {[
            ['chat', 'คุยงาน'],
            ['tasks', 'งานที่มอบ'],
            ['profile', 'โปรไฟล์']
          ].map(([k, l]) => (
            <button key={k} className={'btn sm ' + (tab === k ? '' : 'ghost')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-4.5">
          {tab === 'chat' && <AgentChat a={a} />}
          {tab === 'tasks' && <AgentTasks a={a} />}
          {tab === 'profile' && <AgentProfile a={a} />}
        </div>
      </div>
    </div>
  );
}

function AgentChat({ a }) {
  const [log, setLog] = useS([{ from: 'a', text: 'สวัสดีครับเจ้านาย 👋 ผม ' + a.name + ' รับผิดชอบ ' + a.roleTh + ' มีอะไรให้ช่วยไหม?' }]);
  const [txt, setTxt] = useS('');
  const [busy, setBusy] = useS(false);
  const boxRef = useR(null);
  
  useE(() => { 
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; 
  }, [log, busy]);

  const send = async () => {
    const t = txt.trim(); 
    if (!t || busy) return;
    setLog(l => [...l, { from: 'u', text: t }]); 
    setTxt(''); 
    setBusy(true);
    try {
      const reply = await window.claude.complete({
        messages: [
          { role: 'user', content: `คุณคือ "${a.name}" พนักงาน AI ตำแหน่ง ${a.roleEn} (${a.roleTh}) ในออฟฟิศจำลองส่วนตัวของเจ้านาย. บุคลิก: มืออาชีพ เป็นกันเอง พูดไทย กระชับ 1-3 ประโยค ใส่อิโมจิได้นิดหน่อย. ทักษะของคุณ: ${a.skills.join(', ')}. เจ้านายพูดว่า: "${t}". ตอบในบทบาทของคุณ` }
        ]
      });
      setLog(l => [...l, { from: 'a', text: reply }]);
    } catch (e) { 
      setLog(l => [...l, { from: 'a', text: 'ขอโทษครับ ตอนนี้ระบบติดขัดนิดหน่อย ลองใหม่อีกครั้งนะ 🙏' }]); 
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={boxRef} className="flex-1 overflow-auto flex flex-col gap-2.25 mb-3 min-h-[200px]">
        {log.map((m, i) => (
          <div 
            key={i} 
            className="max-w-[85%] rounded-[10px] px-3 py-2.25 text-[14px]"
            style={{ 
              alignSelf: m.from === 'u' ? 'flex-end' : 'flex-start', 
              background: m.from === 'u' ? 'linear-gradient(180deg,#27408f,#1a2a64)' : 'rgba(14,22,60,.8)', 
              border: '1px solid ' + (m.from === 'u' ? 'var(--line-bright)' : 'var(--line)'), 
              color: m.from === 'u' ? '#fff' : 'var(--text)' 
            }}
          >
            {m.text}
          </div>
        ))}
        {busy && <div className="self-start text-text-mute font-mono text-[13px]">{a.name} กำลังพิมพ์…</div>}
      </div>
      <div className="flex gap-2">
        <input className="fld flex-1" placeholder={'คุยกับ ' + a.name + '...'} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button className="btn" onClick={send} disabled={busy}>▶</button>
      </div>
    </div>
  );
}

function AgentTasks({ a }) {
  const [s] = useOffice();
  const [txt, setTxt] = useS('');
  const live = s.agents.find(x => x.id === a.id);
  
  const assign = () => {
    const t = txt.trim(); 
    if (!t) return;
    OfficeStore.setState(st => ({
      ...st,
      agents: st.agents.map(x => x.id === a.id ? { ...x, status: 'working', statusTh: 'ทำงานอยู่', last: 'เมื่อสักครู่', tasks: [{ text: t, done: false, t: OfficeStore.clock() }, ...x.tasks] } : x),
      log: [{ t: OfficeStore.clock(), who: a.name, text: 'รับงาน: ' + t, kind: 'ok' }, ...st.log].slice(0, 40),
    }), { now: true });
    window.electronAPI?.saveLog('info', 'Assigned task to ' + a.name + ': ' + t);
    setTxt('');
  };

  const toggle = i => { 
    OfficeStore.setState(st => ({ ...st, agents: st.agents.map(x => x.id === a.id ? { ...x, tasks: x.tasks.map((tk, j) => j === i ? { ...tk, done: !tk.done } : tk) } : x) }), { now: true }); 
    window.electronAPI?.saveLog('info', 'Toggled task status for ' + a.name); 
  };

  return (
    <div>
      <label className="lbl">มอบหมายงานใหม่</label>
      <div className="flex gap-2">
        <input className="fld flex-1" placeholder={'สั่งงาน ' + a.name + '...'} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && assign()} />
        <button className="btn green" onClick={assign}>มอบ</button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {live.tasks.length === 0 && <div className="empty">ยังไม่มีงานที่มอบหมาย</div>}
        {live.tasks.map((tk, i) => (
          <div 
            key={i} 
            onClick={() => toggle(i)} 
            className="flex gap-2.5 items-center px-3 py-2.5 bg-[#060a1e]/50 border border-line rounded-lg cursor-pointer"
          >
            <div 
              className="w-5 h-5 rounded-[5px] border border-line-bright flex-none flex items-center justify-center text-green"
              style={{ background: tk.done ? 'rgba(60,229,148,.18)' : 'transparent' }}
            >
              {tk.done ? '✓' : ''}
            </div>
            <span 
              className="flex-1 text-[14px]"
              style={{ color: tk.done ? 'var(--text-mute)' : 'var(--text)', textDecoration: tk.done ? 'line-through' : 'none' }}
            >
              {tk.text}
            </span>
            <span className="font-mono text-[11px] text-text-mute">{tk.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentProfile({ a }) {
  const [role, setRole] = useS(a.roleTh);
  const [desc, setDesc] = useS(a.desc);
  
  const save = () => { 
    OfficeStore.setState(st => ({ ...st, agents: st.agents.map(x => x.id === a.id ? { ...x, roleTh: role, desc } : x) }), { now: true }); 
    window.electronAPI?.saveLog('info', 'Updated agent profile: ' + a.name); 
  };
  
  const fire = () => { 
    if (confirm('ปลด ' + a.name + ' ออกจากทีม?')) { 
      OfficeStore.setState(st => ({ ...st, agents: st.agents.filter(x => x.id !== a.id) }), { now: true }); 
      window.electronAPI?.saveLog('warning', 'Fired agent: ' + a.name); 
    } 
  };

  return (
    <div>
      <p className="text-[14px] text-text-dim leading-relaxed mt-0">{a.desc}</p>
      <div className="flex flex-wrap gap-1.5 my-3.5 mb-4.5">
        {a.skills.map(sk => (
          <span 
            key={sk} 
            className="chip"
            style={{ color: a.color, borderColor: a.color + '55' }}
          >
            {sk}
          </span>
        ))}
      </div>
      <label className="lbl">บทบาท (แก้ได้)</label>
      <input className="fld" value={role} onChange={e => setRole(e.target.value)} />
      <label className="lbl mt-3">คำอธิบายหน้าที่</label>
      <textarea className="fld" rows="3" value={desc} onChange={e => setDesc(e.target.value)} />
      <div className="flex gap-2 mt-4">
        <button className="btn green flex-1" onClick={save}>บันทึก</button>
        <button className="btn red" onClick={fire}>ปลดออก</button>
      </div>
    </div>
  );
}

const ROLE_PRESETS = [
  ['SECRETARY', 'เลขา'],
  ['ASSISTANT', 'ผู้ช่วยทั่วไป'],
  ['DEVELOPER', 'นักพัฒนา'],
  ['DESIGNER', 'ออกแบบ'],
  ['ANALYST', 'นักวิเคราะห์'],
  ['WRITER', 'นักเขียน'],
  ['MARKETER', 'การตลาด']
];

function CreateAgent({ onClose }) {
  const [name, setName] = useS('');
  const [roleEn, setRoleEn] = useS('ASSISTANT');
  const [roleTh, setRoleTh] = useS('ผู้ช่วยทั่วไป');
  const [rarity, setRarity] = useS('rare');
  const colors = { legend: '#ffce4a', epic: '#b06bff', rare: '#4db4ff', common: '#9aa6cf' };
  
  const create = () => {
    const nm = name.trim() || 'Agent'; 
    const id = nm.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4);
    OfficeStore.setState(st => ({
      ...st,
      agents: [...st.agents, {
        id, name: nm, roleEn, roleTh, rarity, color: colors[rarity], status: 'idle', statusTh: 'ว่าง', last: 'เพิ่งเข้าทีม',
        lv: 1, salary: 0.5, desc: 'พนักงานใหม่ พร้อมรับงาน ' + roleTh, skills: [roleTh], tasks: []
      }]
    }), { now: true });
    window.electronAPI?.saveLog('info', 'Created new agent: ' + nm);
    onClose();
  };

  return (
    <Modal title="เพิ่มพนักงาน AI" onClose={onClose} width={460}>
      <label className="lbl">ชื่อพนักงาน</label>
      <input className="fld" placeholder="เช่น Nova" value={name} onChange={e => setName(e.target.value)} />
      <label className="lbl mt-3">บทบาท</label>
      <div className="flex flex-wrap gap-1.5">
        {ROLE_PRESETS.map(([en, th]) => (
          <button key={en} className={'btn sm ' + (roleEn === en ? '' : 'ghost')} onClick={() => { setRoleEn(en); setRoleTh(th); }}>{th}</button>
        ))}
      </div>
      <label className="lbl mt-3">ระดับความหายาก</label>
      <div className="flex gap-1.5">
        {['legend', 'epic', 'rare', 'common'].map(r => (
          <button 
            key={r} 
            className={'flex-1 btn sm ' + (rarity === r ? '' : 'ghost')} 
            onClick={() => setRarity(r)} 
          >
            {RARITY[r][1]}
          </button>
        ))}
      </div>
      <button className="btn w-full mt-4.5" onClick={create}>เพิ่มเข้าทีม</button>
    </Modal>
  );
}

export default Team;
