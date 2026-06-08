import React, { useState as useS, useEffect as useE } from 'react';
import { SK_CLUSTER_BY } from '../pages/Skills';
import { SYNC_PATHS, SKILL_CATALOG, AGENT_CATALOG } from '../store/catalog';

/* ---------------- import picker modal ---------------- */
export function SyncPicker({ kind, existing, onClose, onImport }) {
  const isSkill = kind === 'skills';
  const path = isSkill ? SYNC_PATHS.skills : SYNC_PATHS.agents;
  const catalog = isSkill ? SKILL_CATALOG : AGENT_CATALOG;
  const exist = existing || new Set();
  const [scanning, setScanning] = useS(true);
  const [sel, setSel] = useS(() => new Set());
  const [q, setQ] = useS('');

  useE(() => {
    const t = setTimeout(() => setScanning(false), 780);
    return () => clearTimeout(t);
  }, []);

  const list = catalog.filter(it => !q || it.name.toLowerCase().includes(q.toLowerCase()) || (it.id || '').includes(q.toLowerCase()));
  const selectable = list.filter(it => !exist.has(it.name.toLowerCase()));
  const allSel = selectable.length > 0 && selectable.every(it => sel.has(it.id));
  
  const toggle = (id) => setSel(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  
  const toggleAll = () => setSel(s => {
    if (allSel) return new Set();
    return new Set(selectable.map(it => it.id));
  });
  
  const doImport = () => {
    const items = catalog.filter(it => sel.has(it.id));
    if (items.length) onImport(items);
    onClose();
  };

  return (
    <div className="syp-back" onClick={onClose}>
      <div className="syp-modal" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="syp-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="syp-title">{isSkill ? '⟳ ซิงค์ SKILLS' : '⟳ ซิงค์ AGENTS'}</div>
            <div className="syp-path">📂 {path}</div>
          </div>
          <i className="syp-x" onClick={onClose}>×</i>
        </div>

        {scanning ? (
          <div className="syp-scan">
            <div className="syp-spin"></div>
            <div className="syp-scan-t">กำลังสแกนโฟลเดอร์…</div>
            <div className="syp-scan-s">{path}</div>
          </div>
        ) : (
          <>
            {/* toolbar */}
            <div className="syp-toolbar">
              <span className="syp-found">พบ {list.length} {isSkill ? 'สกิล' : 'เอเจนต์'}</span>
              <input className="fld" placeholder="ค้นหา…" value={q} onChange={e => setQ(e.target.value)}
                style={{ flex: 1, padding: '7px 11px', fontSize: 13 }} />
              <button className="syp-selall" onClick={toggleAll}>{allSel ? '✓ ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}</button>
            </div>

            {/* list */}
            <div className="syp-list">
              {list.map(it => {
                const dup = exist.has(it.name.toLowerCase());
                const on = sel.has(it.id);
                const cl = SK_CLUSTER_BY[it.cluster] || SK_CLUSTER_BY.ops;
                const nFiles = it.files ? it.files.length : 1;
                return (
                  <div key={it.id} className={'syp-row' + (on ? ' on' : '') + (dup ? ' dup' : '')}
                    style={{ '--cc': cl.col }} onClick={() => !dup && toggle(it.id)}>
                    <span className={'syp-check' + (on ? ' on' : '')} style={{ borderColor: on ? cl.col : '', background: on ? cl.col : '' }}>
                      {on ? '✓' : ''}
                    </span>
                    <span className="syp-glyph" style={{ color: cl.col }}>{isSkill ? '📄' : '🤖'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="syp-name">
                        {it.name}
                        {dup && <span className="syp-dupbadge">มีแล้ว</span>}
                      </div>
                      <div className="syp-desc">{it.desc}</div>
                    </div>
                    <div className="syp-meta">
                      <span className="syp-tag" style={{ color: cl.col, borderColor: cl.col + '55' }}>{cl.name}</span>
                      {isSkill
                        ? <span className="syp-files">📁 {nFiles} ไฟล์</span>
                        : <span className="syp-files" style={{ color: 'var(--text-dim)' }}>{(it.model || '').toUpperCase()} · {it.skills.length} ทักษะ</span>}
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <div className="empty" style={{ padding: 30 }}>ไม่พบรายการที่ตรงกับ "{q}"</div>}
            </div>

            {/* footer */}
            <div className="syp-foot">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>เลือกแล้ว {sel.size} รายการ</span>
              <span style={{ flex: 1 }}></span>
              <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
              <button className="btn gold" disabled={sel.size === 0} onClick={doImport}
                style={{ opacity: sel.size === 0 ? 0.4 : 1, pointerEvents: sel.size === 0 ? 'none' : 'auto' }}>
                ⬇ นำเข้า {sel.size > 0 ? '(' + sel.size + ')' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
