import React, { useState as useS, useEffect as useE } from 'react';
import { SK_CLUSTER_BY } from '../pages/Skills';
import { SYNC_PATHS, SKILL_CATALOG, AGENT_CATALOG } from '../store/catalog';

/* ---------------- import picker modal ---------------- */
export function SyncPicker({ kind, existing, onClose, onImport }) {
  const isSkill = kind === 'skills';
  const path = isSkill ? SYNC_PATHS.skills : SYNC_PATHS.agents;
  const exist = existing || new Set();
  const [catalog, setCatalog] = useS([]);
  const [scanning, setScanning] = useS(true);
  const [requiresWeb, setRequiresWeb] = useS(false);
  const [sel, setSel] = useS(() => new Set());
  const [q, setQ] = useS('');
  const fileRef = React.useRef(null);

  useE(() => {
    if (fileRef.current) {
      fileRef.current.setAttribute('webkitdirectory', '');
      fileRef.current.setAttribute('directory', '');
    }
  }, [requiresWeb]);

  useE(() => {
    if (window.electronAPI && window.electronAPI.scanSyncFolder) {
      window.electronAPI.scanSyncFolder(path).then((files) => {
        if (isSkill) {
          // fallback to mock for skills for now
          setCatalog(SKILL_CATALOG);
          setScanning(false);
        } else {
          const parsed = [];
          for (const f of files) {
            if (!f.name.toLowerCase().endsWith('.md')) continue;
            const text = f.text;
            const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
            const rawName = (heading || f.name.replace(/\.md$/i, '')).trim().split('·')[0].trim();
            const name = rawName.split(/\s+/).slice(0, 2).join(' ');
            if (!name) continue;
            const sub = (text.match(/^>\s+(.+)$/m) || [])[1] || 'นำเข้าจากโฟลเดอร์';
            const roleTh = sub.split('—')[0].trim().slice(0, 40);
            const sk = [...text.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map(m => m[1].trim()).slice(0, 5);
            parsed.push({
              id: f.name.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '-'),
              name,
              role: roleTh,
              cluster: 'ops',
              model: 'sonnet',
              skills: sk,
              desc: sub,
              md: text,
              files: [{ path: f.name, main: true, md: text }]
            });
          }
          setCatalog(parsed);
          setScanning(false);
        }
      }).catch(err => {
        console.error(err);
        setRequiresWeb(true);
        setScanning(false);
      });
    } else {
      setRequiresWeb(true);
      setScanning(false);
    }
  }, [path, isSkill]);

  const onWebSync = async (e) => {
    const files = [...(e.target.files || [])].filter(f => /\.md$/i.test(f.name));
    if (!files.length) {
      alert('ไม่พบไฟล์ .md ในโฟลเดอร์ที่เลือก');
      e.target.value = '';
      return;
    }
    setScanning(true);
    if (isSkill) {
      setCatalog(SKILL_CATALOG);
      setRequiresWeb(false);
      setScanning(false);
    } else {
      const parsed = [];
      for (const f of files) {
        let text = ''; try { text = await f.text(); } catch (err) { text = ''; }
        const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
        const rawName = (heading || f.name.replace(/\.md$/i, '')).trim().split('·')[0].trim();
        const name = rawName.split(/\s+/).slice(0, 2).join(' ');
        if (!name) continue;
        const sub = (text.match(/^>\s+(.+)$/m) || [])[1] || 'นำเข้าจากโฟลเดอร์';
        const roleTh = sub.split('—')[0].trim().slice(0, 40);
        const sk = [...text.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map(m => m[1].trim()).slice(0, 5);
        parsed.push({
          id: f.name.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '-'),
          name, role: roleTh, cluster: 'ops', model: 'sonnet', skills: sk, desc: sub, md: text,
          files: [{ path: f.name, main: true, md: text }]
        });
      }
      setCatalog(parsed);
      setRequiresWeb(false);
      setScanning(false);
    }
  };

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

        {requiresWeb ? (
          <div className="syp-scan">
            <div className="syp-scan-t" style={{marginBottom: 10, color: 'var(--text-mute)'}}>โหมด Web Browser</div>
            <button className="btn ghost" style={{border: '1px solid var(--line)', padding: '10px 20px'}} onClick={() => fileRef.current && fileRef.current.click()}>
              📁 เลือกโฟลเดอร์ {isSkill ? 'skills' : 'agents'}
            </button>
            <input ref={fileRef} type="file" multiple accept=".md" style={{ display: 'none' }} onChange={onWebSync} />
            <div className="syp-scan-s" style={{marginTop: 10}}>เลือกโฟลเดอร์ {path} ในเครื่องของคุณ</div>
          </div>
        ) : scanning ? (
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
