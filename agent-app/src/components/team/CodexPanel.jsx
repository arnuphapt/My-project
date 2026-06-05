import React, { useState as useS, useRef as useR, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../../store';
import { renderMd } from '../SkillMd.jsx';

/** Codex (skill.md) editor + annotations panel */
export function CodexPanel({ a }) {
  const [s] = useOffice();
  const live = a.isCeo ? (s.ceo || a) : (s.agents.find(x => x.id === a.id) || a);
  const patch = (updater) => OfficeStore.setState(st => {
    if (a.isCeo) return { ...st, ceo: updater(st.ceo) };
    return { ...st, agents: st.agents.map(x => x.id === a.id ? updater(x) : x) };
  }, { now: true });

  const [mode,    setMode]    = useS('rendered');
  const [editing, setEditing] = useS(false);
  const [draft,   setDraft]   = useS(live.skillMd || '');
  const [popup,   setPopup]   = useS(null);
  const [pending, setPending] = useS('');
  const [note,    setNote]    = useS('');
  const docRef  = useR(null);
  const noteRef = useR(null);

  useE(() => { if (!editing) setDraft(live.skillMd || ''); }, [live.skillMd, editing]);
  useE(() => { if (pending && noteRef.current) noteRef.current.focus(); }, [pending]);

  const saveMd = () => {
    patch(x => ({ ...x, skillMd: draft }));
    OfficeStore.setState(st => ({
      ...st, log: [{ t: OfficeStore.clock(), who: a.name, text: 'แก้คัมภีร์ skill.md', kind: 'sys' }, ...st.log].slice(0, 40),
    }), { now: true });
    setEditing(false);
  };

  const onSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setPopup(null); return; }
    const txt    = sel.toString().trim();
    const within = docRef.current && docRef.current.contains(sel.anchorNode) && docRef.current.contains(sel.focusNode);
    if (!txt || !within) { setPopup(null); return; }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    setPopup({ quote: txt.length > 140 ? txt.slice(0, 140) + '…' : txt, x: r.left + r.width / 2, y: r.top });
  };

  const startNote = () => { setPending(popup.quote); setNote(''); setPopup(null); if (window.getSelection) window.getSelection().removeAllRanges(); };
  const addAnno   = () => {
    const n = note.trim(); if (!n) return;
    patch(x => ({ ...x, annotations: [{ id: Date.now(), quote: pending, note: n, t: OfficeStore.clock() }, ...(x.annotations || [])] }));
    setPending(''); setNote('');
  };
  const delAnno = id => patch(x => ({ ...x, annotations: (x.annotations || []).filter(an => an.id !== id) }));
  const annos = live.annotations || [];

  return (
    <div className="cs-cx">
      <div>
        <div className="cs-sec">
          คัมภีร์<span style={{ color: 'var(--text-mute)', margin: '0 9px' }}>—</span>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', letterSpacing: 0, fontSize: 12, textShadow: 'none' }}>
            {a.name.toLowerCase()}.skill.md
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, flexWrap: 'wrap' }}>
          {!editing && (
            <div className="codex-toggle">
              <button className={mode === 'rendered' ? 'on' : ''} onClick={() => setMode('rendered')}>RENDERED</button>
              <button className={mode === 'source'   ? 'on' : ''} onClick={() => setMode('source')}>SOURCE</button>
            </div>
          )}
          <span style={{ flex: 1 }}/>
          {!editing
            ? <button className="btn sm gold" onClick={() => { setDraft(live.skillMd || ''); setEditing(true); }}>✎ แก้คัมภีร์</button>
            : <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm ghost" onClick={() => { setEditing(false); setDraft(live.skillMd || ''); }}>ยกเลิก</button>
                <button className="btn sm green"  onClick={saveMd}>บันทึก</button>
              </div>}
        </div>
        {editing
          ? <div>
              <textarea className="codex-edit" value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false}/>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 6 }}>
                Markdown: # หัวข้อ · **ตัวหนา** · - รายการ · &gt; คำคม · --- เส้นคั่น
              </div>
            </div>
          : (mode === 'rendered'
              ? <div className="cs-codex-frame">
                  <div className="parch" ref={docRef} onMouseUp={onSelect}
                    dangerouslySetInnerHTML={{ __html: renderMd(live.skillMd || '') }}/>
                </div>
              : <div className="codex-src">{live.skillMd || ''}</div>)
        }
      </div>

      <div className="cs-anno">
        <div className="win-h"><span className="ttl" style={{ fontSize: 9 }}>ANNOTATIONS</span></div>
        <div className="win-b" style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflow: 'auto' }}>
          {pending && (
            <div style={{ border: '1px solid var(--gold)', borderRadius: 6, padding: '10px 11px', background: 'rgba(255,206,74,.06)' }}>
              <div className="cs-anno-quote" style={{ marginBottom: 8 }}>"{pending}"</div>
              <textarea ref={noteRef} className="fld" rows="2" placeholder="เขียนโน้ต…" value={note}
                onChange={e => setNote(e.target.value)} style={{ fontSize: 13, padding: '8px 10px' }}/>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="btn sm green" style={{ flex: 1 }} onClick={addAnno}>＋ เพิ่มโน้ต</button>
                <button className="btn sm ghost" onClick={() => { setPending(''); setNote(''); }}>ยกเลิก</button>
              </div>
            </div>
          )}
          {!pending && annos.length === 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-mute)', lineHeight: 1.6, padding: '6px 2px' }}>
              ยังไม่มีโน้ต — <span style={{ color: 'var(--gold)' }}>ไฮไลต์ข้อความ</span>ในคัมภีร์เพื่อจดบันทึก
            </div>
          )}
          {annos.map(an => (
            <div key={an.id} className="cs-anno-item">
              <div className="cs-anno-quote">"{an.quote}"</div>
              <div className="cs-anno-note">{an.note}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)' }}>{an.t}</span>
                <span onClick={() => delAnno(an.id)} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', cursor: 'pointer' }}>ลบ</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {popup && (
        <button className="cs-annobtn" style={{ left: popup.x, top: popup.y }}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation(); startNote(); }}>✎ จดโน้ต</button>
      )}
    </div>
  );
}
