import React, { useState as useS } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, Bar, PageHead, Modal, SumCard } from '../components/UI.jsx';
import '../store/image-slot.js';
import { createProject, updateProject, deleteProject } from '../api/projects.js';

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
  const proj = s.projects.find(p => p.id === open);

  const done = s.projects.filter(p => p.status === 'เสร็จแล้ว').length;
  const skills = [...new Set(s.projects.flatMap(p => p.tags))];

  return (
    <div className="max-w-[1280px] mx-auto px-[22px] py-5">
      <PageHead
        title="PROJECTS"
        sub="คลังผลงาน — เก็บสะสมไว้เป็นข้อมูลสร้าง Resume / CV ในอนาคต"
        right={<button className="btn" onClick={() => setCreate(true)}>＋ เพิ่มโปรเจกต์</button>}
      />

      {/* stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-[18px]">
        <SumCard label="โปรเจกต์ทั้งหมด" main={s.projects.length + ''} sub="ในคลังผลงาน" tone="cyan" />
        <SumCard label="เสร็จสมบูรณ์" main={done + ''} sub={'จาก ' + s.projects.length + ' โปรเจกต์'} tone="pos" />
        <SumCard label="ทักษะที่สะสม" main={skills.length + ''} sub="แท็กไม่ซ้ำ" tone="gold" />
        <SumCard label="พร้อมทำ CV" main={done > 0 ? '✓' : '…'} sub={done > 0 ? 'ส่งออกได้' : 'ยังไม่พอ'} tone={done > 0 ? 'pos' : 'cyan'} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {s.projects.map(p => (
          <ProjectCard key={p.id} p={p} onClick={() => setOpen(p.id)} />
        ))}
        <div
          onClick={() => setCreate(true)}
          className="win min-h-[260px] flex flex-col items-center justify-center cursor-pointer gap-2.5 !border-dashed border-cyan/40 hover:border-cyan/80 transition-colors duration-200"
        >
          <div className="text-[34px] text-cyan">＋</div>
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
            className="absolute top-3 right-3.5 cursor-pointer text-white text-[22px] font-mono [text-shadow:0_0_8px_#000] z-[2]"
          >
            ×
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
                  className="cursor-pointer text-text-mute font-mono text-[14px]"
                >
                  ×
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
            <button className="btn green sm" onClick={addHl}>＋</button>
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

function CreateProject({ onClose }) {
  const [title, setTitle] = useS('');
  const [role, setRole] = useS('');
  const [period, setPeriod] = useS('2026');
  const [summary, setSummary] = useS('');
  const [tags, setTags] = useS('');

  const create = async () => {
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
    } catch (err) {
      console.error(err);
      alert('Error saving project to Backend');
    }
    onClose();
  };

  return (
    <Modal title="เพิ่มโปรเจกต์ใหม่" onClose={onClose} width={500}>
      <label className="lbl">ชื่อโปรเจกต์</label>
      <input className="fld" placeholder="เช่น AI Trading Dashboard" value={title} onChange={e => setTitle(e.target.value)} />
      <div className="flex gap-2.5 mt-3">
        <div className="flex-1">
          <label className="lbl">บทบาทของคุณ</label>
          <input className="fld" placeholder="Developer / Designer" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="w-[130px]">
          <label className="lbl">ช่วงเวลา</label>
          <input className="fld" placeholder="2026" value={period} onChange={e => setPeriod(e.target.value)} />
        </div>
      </div>
      <label className="lbl mt-3">สรุปสั้นๆ</label>
      <textarea className="fld" rows="2" placeholder="โปรเจกต์นี้ทำอะไร แก้ปัญหาอะไร..." value={summary} onChange={e => setSummary(e.target.value)} />
      <label className="lbl mt-3">แท็ก / ทักษะ <span className="text-text-mute">(คั่นด้วย ,)</span></label>
      <input className="fld" placeholder="React, Python, UX" value={tags} onChange={e => setTags(e.target.value)} />
      <button className="btn w-full mt-4.5" onClick={create}>เพิ่มเข้าคลังผลงาน</button>
    </Modal>
  );
}

export default Projects;
