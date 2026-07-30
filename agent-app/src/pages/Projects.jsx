import React, { useState as useS, useRef as useR, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, Bar, PageHead, Modal, SumCard } from '../components/UI.jsx';
import '../store/image-slot.js';
import { createProject, updateProject, deleteProject } from '../api/projects.js';
import { Plus, Check, X, ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { SyncPicker } from '../components/SyncPicker.jsx';

/* ============ PROJECTS / CV DATA ============ */
const PSTATUS = {
  'กำลังทำ': ['#ffce4a', 'r-legend'],
  'เสร็จแล้ว': ['#3ce594', 'r-rare'],
  'พัก': ['#9aa6cf', 'r-common'],
};

function Projects() {
  const [s] = useOffice();
  const [open, setOpen] = useS(null);   // project id
  const [create, setCreate] = useS(false);
  const [showPicker, setShowPicker] = useS(false);
  const proj = s.projects.find(p => p.id === open);

  const done = s.projects.filter(p => p.status === 'เสร็จแล้ว').length;
  const skills = [...new Set(s.projects.flatMap(p => p.tags))];

  const onImportProjects = (items) => {
    OfficeStore.setState(st => {
      const have = new Set((st.projects || []).map(x => x.title.toLowerCase()));
      const newItems = items.filter(it => !have.has(it.title.toLowerCase())).map(it => ({
        id: it.id || ('p-' + Date.now() + Math.random().toString(36).slice(2, 5)),
        title: it.title,
        role: it.role || 'Builder',
        status: it.status || 'กำลังทำ',
        progress: it.progress || 50,
        period: it.period || '2026',
        tags: it.tags || ['Project'],
        summary: it.summary || 'รายละเอียดโปรเจกต์',
        highlights: it.highlights || [],
      }));
      return { ...st, projects: [...(st.projects || []), ...newItems] };
    }, { now: true });
  };

  const clearProjects = () => {
    if (confirm('ล้างรายการโปรเจกต์ทั้งหมดในคลัง?')) {
      OfficeStore.setState(st => ({ ...st, projects: [] }), { now: true });
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-[22px] py-5">
      <PageHead
        title="PROJECTS"
        sub="คลังผลงาน — เก็บสะสมไว้เป็นข้อมูลสร้าง Resume / CV ในอนาคต"
        right={
          <div className="flex gap-2">
            <button className="btn gold flex items-center gap-1.5" onClick={() => setShowPicker(true)}>⟳ Sync</button>
            {s.projects.length > 0 && <button className="btn ghost text-red border-red/40 flex items-center gap-1.5" onClick={clearProjects} title="ล้างรายการโปรเจกต์ทั้งหมด">🗑 ล้าง</button>}
            <button className="btn flex items-center gap-1.5" onClick={() => setCreate(true)}><Plus className="w-3.5 h-3.5" /> เพิ่มโปรเจกต์</button>
          </div>
        }
      />

      {/* stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-[18px]">
        <SumCard label="โปรเจกต์ทั้งหมด" main={s.projects.length + ''} sub="ในคลังผลงาน" tone="cyan" />
        <SumCard label="เสร็จสมบูรณ์" main={done + ''} sub={'จาก ' + s.projects.length + ' โปรเจกต์'} tone="pos" />
        <SumCard label="ทักษะที่สะสม" main={skills.length + ''} sub="แท็กไม่ซ้ำ" tone="gold" />
        <SumCard label="พร้อมทำ CV" main={done > 0 ? <Check className="w-6 h-6 text-green inline-block" /> : '…'} sub={done > 0 ? 'ส่งออกได้' : 'ยังไม่พอ'} tone={done > 0 ? 'pos' : 'cyan'} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {s.projects.map(p => (
          <ProjectCard key={p.id} p={p} onClick={() => setOpen(p.id)} />
        ))}
        <div
          onClick={() => setCreate(true)}
          className="win min-h-[260px] flex flex-col items-center justify-center cursor-pointer gap-2.5 !border-dashed border-cyan/40 hover:border-cyan/80 transition-colors duration-200"
        >
          <div className="text-cyan"><Plus className="w-9 h-9" /></div>
          <div className="font-pixel2 text-[12px] text-text-dim">NEW PROJECT</div>
        </div>
      </div>

      {/* skill cloud */}
      <Win
        title="SKILL CLOUD"
        th={false}
        className="mt-4.5"
        right={<span className="tag mr-1.5">auto จากแท็ก</span>}
      >
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 && <div className="empty">ยังไม่มีแท็ก — เพิ่มโปรเจกต์เพื่อสะสมทักษะ</div>}
          {skills.map(sk => {
            const n = s.projects.filter(p => p.tags.includes(sk)).length;
            return (
              <span
                key={sk}
                className="chip text-[12px] px-[11px] py-1.25 text-cyan border-cyan/40"
              >
                {sk}
                <span className="text-text-mute ml-1">×{n}</span>
              </span>
            );
          })}
        </div>
      </Win>

      {proj && <ProjectDrawer p={proj} onClose={() => setOpen(null)} />}
      {create && <CreateProject onClose={() => setCreate(false)} />}
      {showPicker && <SyncPicker kind="projects" existing={new Set(s.projects.map(p => p.title.toLowerCase()))} onClose={() => setShowPicker(false)} onImport={onImportProjects} />}
    </div>
  );
}

function ProjectCard({ p, onClick }) {
  const [c] = PSTATUS[p.status] || PSTATUS['พัก'];
  return (
    <div
      onClick={onClick}
      className="win cursor-pointer transition-transform duration-100 hover:-translate-y-[3px]"
    >
      <div className="relative h-32">
        <image-slot
          id={'proj-' + p.id}
          shape="rect"
          placeholder={'cover · ' + p.title}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute top-2.25 right-2.25">
          <span
            className="chip bg-[#060a1e]/80"
            style={{ color: c, borderColor: c + '66' }}
          >
            {p.status}
          </span>
        </div>
        <div className="absolute left-0 right-0 bottom-0 h-[46px] bg-gradient-to-b from-transparent to-[#080c24]/92"></div>
      </div>
      <div className="p-[12px_14px_14px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-pixel2 font-bold text-[16px] text-white">{p.title}</span>
          <span className="font-mono text-[11px] text-text-mute flex-none">{p.period}</span>
        </div>
        <div className="text-[12px] text-cyan mt-1 font-mono">{p.role}</div>
        <div className="text-[13px] text-text-dim mt-2 leading-normal line-clamp-2">{p.summary}</div>
        <div className="mt-[11px] mb-[9px]"><Bar pct={p.progress} tone={p.progress >= 100 ? 'green' : ''} /></div>
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-1.25">
            {p.tags.slice(0, 3).map(t => <span key={t} className="chip text-[10px] px-1.75 py-0.5">{t}</span>)}
            {p.tags.length > 3 && <span className="text-[11px] text-text-mute font-mono">+{p.tags.length - 3}</span>}
          </div>
          <span className="font-mono text-[12px]" style={{ color: c }}>{p.progress}%</span>
        </div>
      </div>
    </div>
  );
}

function ProjectDrawer({ p, onClose }) {
  const [c] = PSTATUS[p.status] || PSTATUS['พัก'];
  const [hl, setHl] = useS('');
  const live = OfficeStore.getState().projects.find(x => x.id === p.id) || p;
  const upd = async (patch) => {
    const updated = { ...live, ...patch };
    try {
      await updateProject(p.id, updated);
      OfficeStore.syncBackendData();
    } catch (err) {
      console.error(err);
      alert('Failed to update project');
    }
  };
  const addHl = () => { const t = hl.trim(); if (!t) return; upd({ highlights: [...live.highlights, t] }); setHl(''); };
  const delHl = i => upd({ highlights: live.highlights.filter((_, j) => j !== i) });
  const del = async () => { 
    if (confirm('ลบโปรเจกต์ "' + p.title + '"?')) { 
      try {
        await deleteProject(p.id);
        OfficeStore.syncBackendData();
        onClose(); 
      } catch(err) {
        console.error(err);
        alert('Failed to delete project');
      }
    } 
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-[#040614]/70 backdrop-blur-[3px] flex justify-end"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-[min(540px,96vw)] h-full bg-panel-solid border-l border-line-bright shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
      >
        <div className="relative h-[150px] flex-none">
          <image-slot
            id={'proj-' + p.id}
            shape="rect"
            placeholder={'cover · ' + p.title}
            className="absolute inset-0 w-full h-full"
          />
          <i
            onClick={onClose}
            className="absolute top-3.5 right-4 cursor-pointer text-white text-[20px] font-mono [text-shadow:0_0_8px_#000] z-[2] hover:text-cyan transition-colors"
          >
            <X className="w-5 h-5" />
          </i>
          <div className="absolute left-0 right-0 bottom-0 px-5 pt-6 pb-3.5 bg-gradient-to-b from-transparent to-[#080c24]/95">
            <div className="flex items-center gap-2.25">
              <span className="font-pixel text-[16px] text-white [text-shadow:0_0_12px_rgba(58,140,255,0.5)]">{p.title}</span>
              <span className="chip" style={{ color: c, borderColor: c + '66' }}>{p.status}</span>
            </div>
            <div className="font-mono text-[12px] text-cyan mt-1.5">{p.role} · {p.period}</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4.5">
          <p className="text-[14.5px] text-text leading-relaxed mt-0">{p.summary}</p>

          <div className="flex items-center gap-2.5 my-3.5">
            <div className="flex-1"><Bar pct={live.progress} tone={live.progress >= 100 ? 'green' : ''} /></div>
            <span className="font-mono text-[13px]" style={{ color: c }}>{live.progress}%</span>
          </div>

          <div className="font-pixel2 text-[12px] text-text-dim tracking-[0.5px] mt-4.5 mb-2.25">HIGHLIGHTS · ผลงานเด่น</div>
          <div className="flex flex-col gap-1.75">
            {live.highlights.map((h, i) => (
              <div
                key={i}
                className="flex gap-2.25 items-start px-2.75 py-2.25 bg-[#060a1e]/50 border border-line rounded-lg"
              >
                <span className="text-green font-mono flex-none">▸</span>
                <span className="flex-1 text-[13.5px] text-text leading-normal">{h}</span>
                <i
                  onClick={() => delHl(i)}
                  className="cursor-pointer text-text-mute font-mono text-[14px] hover:text-red transition-colors animate-[caFadeIn_.15s_ease-out]"
                >
                  <X className="w-3.5 h-3.5" />
                </i>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2.25">
            <input
              className="fld px-2.75 py-2 text-[13px]"
              placeholder="เพิ่มผลงานเด่น / ตัวเลขที่ทำได้..."
              value={hl}
              onChange={e => setHl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHl()}
            />
            <button className="btn green sm flex items-center justify-center" onClick={addHl}><Plus className="w-3.5 h-3.5" /></button>
          </div>

          <div className="font-pixel2 text-[12px] text-text-dim tracking-[0.5px] mt-5 mb-2.25">TECH / SKILLS</div>
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map(t => (
              <span key={t} className="chip text-cyan border-cyan/40">{t}</span>
            ))}
          </div>

          <div className="font-pixel2 text-[12px] text-text-dim tracking-[0.5px] mt-5 mb-2.25">ความคืบหน้า</div>
          <div className="flex gap-1.5">
            {[25, 50, 75, 100].map(v => (
              <button
                key={v}
                className={'btn sm ' + (live.progress === v ? '' : 'ghost')}
                onClick={() => upd({ progress: v, status: v >= 100 ? 'เสร็จแล้ว' : 'กำลังทำ' })}
                style={{ flex: 1 }}
              >
                {v}%
              </button>
            ))}
          </div>

          <button className="btn red w-full mt-6" onClick={del}>ลบโปรเจกต์นี้</button>
        </div>
      </div>
    </div>
  );
}

function PreviewProjectCard({ title, role, period, summary, tags, status, progress }) {
  const [c] = PSTATUS[status] || PSTATUS['พัก'];
  const tArr = tags.split(',').map(x => x.trim()).filter(Boolean);
  
  return (
    <div className="win w-full max-w-[300px] cursor-default pointer-events-none relative z-10" style={{ background: 'linear-gradient(180deg, rgba(16,22,46,.96), rgba(9,12,24,.97))', border: '1px solid var(--line)', borderTop: `3px solid ${c}` }}>
      <div className="relative h-[110px]">
        <image-slot id="proj-preview" shape="rect" placeholder={'cover · ' + (title.trim() || 'NEW PROJECT')} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-2.25 right-2.25">
          <span className="chip bg-[#060a1e]/80" style={{ color: c, borderColor: c + '66' }}>{status}</span>
        </div>
        <div className="absolute left-0 right-0 bottom-0 h-[46px] bg-gradient-to-b from-transparent to-[#080c24]/92" />
      </div>
      <div className="p-[12px_14px_14px] flex-1 border-t border-line" style={{ background: 'linear-gradient(180deg, rgba(14,20,44,.95), rgba(8,11,26,.98))' }}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-pixel2 font-bold text-[16px] text-white truncate block overflow-hidden text-ellipsis whitespace-nowrap">{title.trim() || '???'}</span>
          <span className="font-mono text-[11px] text-text-mute flex-none">{period || '2026'}</span>
        </div>
        <div className="text-[12px] text-cyan mt-1 font-mono">{role || 'Builder'}</div>
        <div className="text-[13px] text-text-dim mt-2 leading-normal line-clamp-2 break-words" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{summary || 'รายละเอียดโปรเจกต์...'}</div>
        <div className="mt-[11px] mb-[9px]"><Bar pct={progress} tone={progress >= 100 ? 'green' : ''} /></div>
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-1.25">
            {tArr.slice(0, 3).map(t => <span key={t} className="chip text-[10px] px-1.75 py-0.5">{t}</span>)}
            {tArr.length > 3 && <span className="text-[11px] text-text-mute font-mono">+{tArr.length - 3}</span>}
            {tArr.length === 0 && <span className="text-[10px] text-text-mute font-mono">NO TAGS</span>}
          </div>
          <span className="font-mono text-[12px]" style={{ color: c }}>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

function CreateProject({ onClose }) {
  const [step, setStep] = useS(0);
  const [title, setTitle] = useS('');
  const [role, setRole] = useS('');
  const [period, setPeriod] = useS('2026');
  const [summary, setSummary] = useS('');
  const [tags, setTags] = useS('');
  const [saving, setSaving] = useS(false);
  const [done, setDone] = useS(false);
  const inputRef = useR(null);

  useE(() => { if (step === 0 && inputRef.current) inputRef.current.focus(); }, [step]);

  const STEPS = ['ข้อมูลหลัก', 'รายละเอียด', 'ยืนยัน'];

  const create = async () => {
    if (saving) return;
    setSaving(true);
    const t = title.trim() || 'โปรเจกต์ใหม่';
    const id = 'p' + Date.now().toString().slice(-6);
    const newProj = {
      id, title: t, role: role.trim() || 'Builder', status: 'กำลังทำ', progress: 10, period: period.trim() || '2026',
      tags: tags.split(',').map(x => x.trim()).filter(Boolean), cover: '', summary: summary.trim() || 'รายละเอียดโปรเจกต์...',
      highlights: [],
    };
    
    try {
      await createProject(newProj);
      OfficeStore.syncBackendData();
      setDone(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error(err);
      alert('Error saving project to Backend');
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(3,5,18,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'caFadeIn .18s ease-out' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 780, background: 'linear-gradient(180deg, rgba(14,20,44,.99), rgba(8,11,26,.99))', border: '1px solid #2a3c6a', borderRadius: 14, boxShadow: '0 0 0 1px #000, 0 32px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04)', overflow: 'hidden', animation: 'caSlideUp .2s ease-out', position: 'relative' }}>
        
        {/* accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)', opacity: .7 }}/>

        {/* header + steps */}
        <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid #1e2d50', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 1, textShadow: '0 0 12px rgba(70,182,255,.5)' }}>NEW PROJECT</div>
          <div style={{ flex: 1, display: 'flex', gap: 0 }}>
            {STEPS.map((lb, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: i < step ? 'pointer' : 'default', padding: '4px 10px', borderRadius: 6, background: step === i ? 'rgba(40,60,110,.5)' : 'transparent' }} onClick={() => i < step && setStep(i)}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--mono)', background: i < step ? 'var(--cyan)' : step === i ? 'rgba(40,60,110,.8)' : 'rgba(20,28,50,.6)', color: i < step ? '#000' : step === i ? 'var(--cyan)' : 'var(--text-mute)', border: `1px solid ${i <= step ? 'rgba(70,182,255,.5)' : '#23304a'}`, boxShadow: i === step ? '0 0 10px rgba(70,182,255,.3)' : 'none', transition: '.2s' }}>{i < step ? <Check className="w-3 h-3" /> : i + 1}</div>
                  <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 11, color: step === i ? 'var(--white)' : 'var(--text-mute)', letterSpacing: .3 }}>{lb}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 28, height: 1, background: i < step ? 'rgba(70,182,255,.4)' : '#1e2d50', margin: '0 2px' }}/>}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #2a3c6a', background: 'rgba(10,14,34,.7)', color: 'var(--text-mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}><X className="w-4 h-4" /></button>
        </div>

        {/* body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', minHeight: 380 }}>
          {/* form */}
          <div style={{ padding: '24px 26px', borderRight: '1px solid #1a2540', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* STEP 0 — Main Info */}
            {step === 0 && (
              <div style={{ animation: 'caStepIn .18s ease-out', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 8 }}>ชื่อโปรเจกต์</div>
                  <input ref={inputRef} className="fld" placeholder="เช่น AI Trading Dashboard" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && setStep(1)} style={{ fontSize: 18, padding: '12px 14px', letterSpacing: .4 }}/>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 8 }}>บทบาทของคุณ</div>
                    <input className="fld" placeholder="Developer / Designer" value={role} onChange={e => setRole(e.target.value)} onKeyDown={e => e.key === 'Enter' && setStep(1)} style={{ fontSize: 15, padding: '10px 14px' }}/>
                  </div>
                  <div style={{ width: 140 }}>
                    <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 8 }}>ช่วงเวลา</div>
                    <input className="fld" placeholder="2026" value={period} onChange={e => setPeriod(e.target.value)} onKeyDown={e => e.key === 'Enter' && setStep(1)} style={{ fontSize: 15, padding: '10px 14px', fontFamily: 'var(--mono)' }}/>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1 — Details */}
            {step === 1 && (
              <div style={{ animation: 'caStepIn .18s ease-out', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 8 }}>สรุปสั้นๆ</div>
                  <textarea className="fld" rows="3" placeholder="โปรเจกต์นี้ทำอะไร แก้ปัญหาอะไร..." value={summary} onChange={e => setSummary(e.target.value)} style={{ fontSize: 14, padding: '12px 14px', lineHeight: 1.6 }}/>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 8 }}>แท็ก / ทักษะ <span style={{ color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 0 }}>(comma separated)</span></div>
                  <input className="fld" placeholder="React, Python, UX" value={tags} onChange={e => setTags(e.target.value)} onKeyDown={e => e.key === 'Enter' && setStep(2)} style={{ fontSize: 14, padding: '10px 14px', color: 'var(--cyan)', fontFamily: 'var(--mono)' }}/>
                </div>
              </div>
            )}

            {/* STEP 2 — Confirm */}
            {step === 2 && (
              <div style={{ animation: 'caStepIn .18s ease-out', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)' }}>ตรวจสอบข้อมูลโปรเจกต์</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 6 }}>ชื่อโปรเจกต์</div>
                    <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14, color: 'var(--cyan)' }}>{title.trim() || 'โปรเจกต์ใหม่'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '11px 13px' }}>
                      <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 6 }}>บทบาท</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--white)' }}>{role.trim() || 'Builder'}</div>
                    </div>
                    <div style={{ background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '11px 13px' }}>
                      <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 6 }}>ช่วงเวลา</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--white)' }}>{period.trim() || '2026'}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '11px 13px' }}>
                    <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 6 }}>ทักษะที่ใช้</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cyan)' }}>
                      {tags.split(',').filter(x => x.trim()).join(' · ') || 'ยังไม่มีการระบุทักษะ'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* nav buttons */}
            <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', background: 'rgba(14,18,36,.8)', border: '1px solid #2a3c6a', borderRadius: 8, padding: '11px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft className="w-4 h-4" /> ย้อนกลับ</button>
              )}
              <div style={{ flex: 1 }}/>
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !title.trim()} style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 13, color: step === 0 && !title.trim() ? 'var(--text-mute)' : '#000', background: step === 0 && !title.trim() ? 'rgba(20,28,50,.8)' : 'linear-gradient(180deg, var(--cyan), #2080cc)', border: `1px solid ${step === 0 && !title.trim() ? '#2a3c6a' : 'var(--cyan)'}`, borderRadius: 8, padding: '11px 22px', cursor: step === 0 && !title.trim() ? 'not-allowed' : 'pointer', boxShadow: step === 0 && !title.trim() ? 'none' : '0 4px 14px rgba(70,182,255,.3)', opacity: step === 0 && !title.trim() ? .5 : 1, transition: '.15s', display: 'flex', alignItems: 'center', gap: 6 }}>ถัดไป <ArrowRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={create} disabled={saving} style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14, color: '#000', background: done ? 'linear-gradient(180deg, #3ce594, #1f9a5e)' : 'linear-gradient(180deg, var(--cyan), #2080cc)', border: `1px solid ${done ? '#3ce594' : 'var(--cyan)'}`, borderRadius: 8, padding: '13px 28px', cursor: saving ? 'wait' : 'pointer', boxShadow: `0 4px 18px ${done ? 'rgba(60,229,148,.4)' : 'rgba(70,182,255,.3)'}`, opacity: saving ? .7 : 1, transition: '.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saving && !done ? <><span style={{ animation: 'caSpinner .8s linear infinite', display: 'inline-block' }}>◌</span> กำลังสร้าง…</> : done ? <><Check className="w-4 h-4 text-green" /> สำเร็จ!</> : <><Rocket className="w-4 h-4" /> เพิ่มเข้าคลังผลงาน</>}
                </button>
              )}
            </div>
          </div>

          {/* preview column */}
          <div style={{ padding: '20px 18px', background: 'rgba(6,9,20,.5)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(70,182,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)', position: 'relative', zIndex: 1 }}>PREVIEW</div>
            
            <PreviewProjectCard title={title} role={role} period={period} summary={summary} tags={tags} status="กำลังทำ" progress={10} />
            
            <div style={{ width: '100%', background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)', lineHeight: 1.6, position: 'relative', zIndex: 1, marginTop: 4 }}>
              <span style={{ color: 'var(--gold)' }}>◆ DATA BINDING:</span> LIVE<br/>
              <span style={{ color: 'var(--cyan)' }}>◆ AUTO-SAVE:</span> ENABLED<br/>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes caFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes caSlideUp  { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes caStepIn   { from { opacity:0; transform:translateX(10px) } to { opacity:1; transform:none } }
        @keyframes caSpinner  { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

export default Projects;
