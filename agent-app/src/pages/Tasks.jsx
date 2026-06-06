import React, { useState as useS } from 'react';
import { OfficeStore, useOffice } from '../store';
import { PageHead } from '../components/UI.jsx';
import { Bar } from '../components/Bar.jsx';

/* ============ TASKS · บอร์ดรวมงานทั้งบริษัท ============ */

export const TASK_STATUS = {
  open:     { label: 'เปิด',    en: 'OPEN',        col: '#46b6ff', icon: '○' },
  progress: { label: 'กำลังทำ', en: 'IN PROGRESS', col: '#ffce4a', icon: '◐' },
  pending:  { label: 'รอ',      en: 'PENDING',     col: '#b06bff', icon: '⏸' },
  done:     { label: 'เสร็จ',   en: 'DONE',        col: '#3ce594', icon: '✓' },
};
export const TASK_ORDER = ['open', 'progress', 'pending', 'done'];

export function taskStat(tk) { return tk.status || (tk.done ? 'done' : 'open'); }

export function gatherTasks(s) {
  const out = [];
  (s.agents || []).forEach(a =>
    (a.tasks || []).forEach(tk => out.push({ ...tk, status: taskStat(tk), agent: a }))
  );
  return out;
}

/* ---- store ops (by task id, across agents) ---- */
export function tkMoveStatus(id, status) {
  OfficeStore.setState(st => ({
    ...st,
    agents: st.agents.map(a => {
      if (!(a.tasks || []).some(t => t.id === id)) return a;
      return { ...a, tasks: a.tasks.map(t => t.id === id ? { ...t, status, done: status === 'done' } : t) };
    }),
  }), { now: true });
}

export function tkDelete(id) {
  OfficeStore.setState(st => ({
    ...st,
    agents: st.agents.map(a => ({ ...a, tasks: (a.tasks || []).filter(t => t.id !== id) })),
  }), { now: true });
}

export function tkAdd(agentId, text, status) {
  const id = 't' + Date.now() + Math.random().toString(36).slice(2, 5);
  OfficeStore.setState(st => ({
    ...st,
    agents: st.agents.map(a => a.id === agentId
      ? {
          ...a,
          status: a.status === 'idle' && status !== 'done' ? 'working' : a.status,
          tasks: [{ id, text, status, done: status === 'done', t: OfficeStore.clock() }, ...(a.tasks || [])],
        }
      : a),
    log: [{ t: OfficeStore.clock(), who: 'CEO', text: 'เพิ่มงาน: ' + text, kind: 'ok' }, ...st.log].slice(0, 40),
  }), { now: true });
}

const PRIORITY = {
  high:   { label: 'HIGH',   col: '#ff5168' },
  medium: { label: 'MEDIUM', col: '#ffce4a' },
  low:    { label: 'LOW',    col: '#7e8aae' },
};

function TaskItem({ tk }) {
  const a = tk.agent, st = tk.status;
  const sc = TASK_STATUS[st]?.col || '#9aa6cf';
  const pr = PRIORITY[tk.priority] || PRIORITY.medium;
  return (
    <div className="tk-item" style={{ '--sc': sc }}>
      <div className="tk-item-main">
        {/* meta top */}
        <div className="tk-meta">
          <span className="tk-prio" style={{ color: pr.col }}>{pr.label}</span>
          <span className="tk-stat" style={{ color: sc }}>{TASK_STATUS[st]?.en}</span>
        </div>
        {/* title */}
        <div className="tk-title" style={{
          color: st === 'done' ? 'var(--text-mute)' : 'var(--white)',
          textDecoration: st === 'done' ? 'line-through' : 'none',
        }}>{tk.text}</div>
        {/* meta bottom */}
        <div className="tk-cat">
          <span style={{ color: 'var(--text-dim)' }}>{(tk.cat || a.roleEn || 'งาน').toUpperCase()}</span>
          <span style={{ color: 'var(--text-mute)' }}> · </span>
          <span style={{ color: a.color }}>{a.name}</span>
          <span style={{ color: 'var(--text-mute)' }}> · {tk.t}</span>
        </div>
      </div>
      {/* right controls */}
      <div className="tk-side">
        <div className="tk-mvrow">
          {TASK_ORDER.map(k => {
            const on = k === st, kc = TASK_STATUS[k].col;
            return (
              <button key={k} onClick={() => tkMoveStatus(tk.id, k)} title={TASK_STATUS[k].label}
                className="tk-mv" style={{ color: on ? '#0a0e1c' : kc, background: on ? kc : 'transparent', borderColor: kc + '55' }}>
                {TASK_STATUS[k].icon}
              </button>
            );
          })}
          <i onClick={() => tkDelete(tk.id)} title="ลบงาน"
            style={{ cursor: 'pointer', color: 'var(--text-mute)', fontFamily: 'var(--mono)', fontSize: 15, padding: '0 3px' }}>×</i>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [s] = useOffice();
  const all = gatherTasks(s);
  const byStatus = k => all.filter(t => t.status === k);
  const total = all.length, doneN = byStatus('done').length;
  const pct = total ? Math.round(doneN / total * 100) : 0;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 22px' }}>
      <PageHead title="TASKS" sub={'รายการงานทั้งบริษัท · ' + total + ' งาน · เสร็จแล้ว ' + doneN + ' (' + pct + '%)'}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>{pct}% เสร็จ</span>
            <div style={{ width: 120 }}><Bar pct={pct} tone="green" /></div>
          </div>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {TASK_ORDER.map(k => {
          const list = byStatus(k), st = TASK_STATUS[k];
          if (list.length === 0) return null;
          return (
            <div key={k}>
              <div className="tk-secline" style={{ '--cc': st.col }}>
                {st.en} <span style={{ color: st.col }}>· {list.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {list.map(tk => <TaskItem key={tk.id} tk={tk} />)}
              </div>
            </div>
          );
        })}
        {total === 0 && <div className="empty">ยังไม่มีงานในระบบ</div>}
      </div>
    </div>
  );
}
