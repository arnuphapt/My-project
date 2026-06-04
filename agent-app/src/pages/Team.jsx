import React, { useState as useS, useRef as useR, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { StatusDot, PageHead, Modal, RARITY } from '../components/UI.jsx';
import '../store/image-slot.js';
import { renderMd } from '../components/SkillMd.jsx';

/* ============ TEAM — employee roster + profile sheet ============ */

/* seniority (job level) — drives identity colour + stars */
const SENIOR = {
  ceo: { label: 'CEO', en: 'CEO', stars: 5, col: '#ff5168', glow: 'rgba(255,81,104,.5)' },
  secretary: { label: 'เลขา', en: 'SECRETARY', stars: 5, col: '#ffce4a', glow: 'rgba(255,206,74,.45)' },
  senior: { label: 'Senior', en: 'SENIOR', stars: 4, col: '#b06bff', glow: 'rgba(176,107,255,.45)' },
  mid: { label: 'Mid-level', en: 'MID-LEVEL', stars: 3, col: '#4db4ff', glow: 'rgba(77,180,255,.40)' },
  junior: { label: 'Junior', en: 'JUNIOR', stars: 2, col: '#3ce594', glow: 'rgba(60,229,148,.38)' },
  newgrad: { label: 'New Grad', en: 'NEW GRAD', stars: 1, col: '#9aa6cf', glow: 'rgba(154,166,207,.30)' },
};
/* model — chosen independently of seniority */
const MODELS = {
  opus: { label: 'Opus', full: 'Claude Opus', col: '#ffce4a' },
  sonnet: { label: 'Sonnet', full: 'Claude Sonnet', col: '#b06bff' },
  haiku: { label: 'Haiku', full: 'Claude Haiku', col: '#4db4ff' },
};
window.SENIOR = SENIOR; window.MODELS = MODELS;

const mdl = a => SENIOR[a.seniority] || SENIOR.mid;
const mdlMod = a => MODELS[a.model] || MODELS.sonnet;

/* pull a skill's description out of the agent's skill.md bullet, if present */
function abilityDesc(a, skill) {
  const md = a.skillMd || '';
  const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = md.match(new RegExp('\\*\\*' + esc + '\\*\\*\\s*[—\\-:]+\\s*(.+)'));
  if (m) return m[1].trim();
  return 'ทักษะประจำตัวของ ' + a.name + ' ใช้ในงานสาย ' + a.roleTh + '.';
}

function CsStars({ a }) {
  const m = mdl(a); const arr = [0, 1, 2, 3, 4];
  return <span className="cs-stars">{arr.map(i => <span key={i} className={i < m.stars ? '' : 'off'}>★</span>)}</span>;
}
function ModelChip({ a, style }) {
  const mm = mdlMod(a);
  return <span className="cs-modelchip" style={{ '--rcol': mm.col, ...style }}>◇ {mm.full}</span>;
}
function CsBar({ pct, from, to }) {
  return <div className="bar" style={{ height: 10 }}><i style={{ width: Math.max(0, Math.min(100, pct)) + '%', background: 'linear-gradient(90deg,' + from + ',' + to + ')' }}></i></div>;
}

/* ---------------- roster card ---------------- */
function CharCard({ a, onClick }) {
  const m = mdl(a);
  return (
    <div className="cs-rcard" onClick={onClick}
      style={{ '--rcol': m.col, '--rglow': m.glow }}>
      <span className="corner" style={{ top: -1, left: -1 }}></span>
      <span className="corner" style={{ top: -1, right: -1 }}></span>
      <span className="corner" style={{ bottom: -1, left: -1 }}></span>
      <span className="corner" style={{ bottom: -1, right: -1 }}></span>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#0a0e1c' }}>
        <image-slot id={a.isCeo ? 'player-avatar' : 'card-' + a.id} shape="rect" placeholder={a.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></image-slot>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', fontFamily: 'var(--pixel)', fontSize: 40, color: m.col, textShadow: '0 0 18px ' + m.glow
        }}>{a.name[0]}</div>
        <div style={{ position: 'absolute', top: 8, left: 8 }}><span className="cs-tier" style={{ '--rcol': m.col, '--rglow': m.glow }}>{m.en}</span></div>
        {a.isCeo
          ? <div style={{ position: 'absolute', top: 8, right: 9, fontSize: 13 }}>👑</div>
          : <div style={{
            position: 'absolute', top: 8, right: 9, fontFamily: 'var(--mono)', fontSize: 10, color: mdlMod(a).col,
            background: 'rgba(8,12,26,.7)', border: '1px solid ' + mdlMod(a).col + '66', borderRadius: 5, padding: '2px 6px'
          }}>{mdlMod(a).label}</div>}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 10px 9px',
          background: 'linear-gradient(180deg,transparent,rgba(6,9,18,.95))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <StatusDot s={a.status} />
            <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>{a.name}</span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-dim)', marginTop: 3 }}>{a.roleEn}</div>
        </div>
      </div>
      <div style={{
        padding: '9px 11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(0,0,0,.5)', background: 'rgba(8,12,26,.5)'
      }}>
        <CsStars a={a} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{a.isCeo ? 'ผู้นำสูงสุด' : (a.skills || []).length + ' ทักษะ'}</span>
      </div>
    </div>
  );
}

/* ---------------- annotations + codex ---------------- */
function CodexPanel({ a }) {
  const [s] = useOffice();
  const live = a.isCeo ? (s.ceo || a) : (s.agents.find(x => x.id === a.id) || a);
  const patch = (updater) => OfficeStore.setState(st => {
    if (a.isCeo) return { ...st, ceo: updater(st.ceo) };
    return { ...st, agents: st.agents.map(x => x.id === a.id ? updater(x) : x) };
  }, { now: true });
  const [mode, setMode] = useS('rendered');
  const [editing, setEditing] = useS(false);
  const [draft, setDraft] = useS(live.skillMd || '');
  const [popup, setPopup] = useS(null);
  const [pending, setPending] = useS('');
  const [note, setNote] = useS('');
  const docRef = useR(null);
  const noteRef = useR(null);

  useE(() => { if (!editing) setDraft(live.skillMd || ''); }, [live.skillMd, editing]);
  useE(() => { if (pending && noteRef.current) noteRef.current.focus(); }, [pending]);

  const saveMd = () => {
    patch(x => ({ ...x, skillMd: draft }));
    OfficeStore.setState(st => ({ ...st, log: [{ t: OfficeStore.clock(), who: a.name, text: 'แก้คัมภีร์ skill.md', kind: 'sys' }, ...st.log].slice(0, 40) }), { now: true });
    setEditing(false);
  };
  const onSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setPopup(null); return; }
    const txt = sel.toString().trim();
    const within = docRef.current && docRef.current.contains(sel.anchorNode) && docRef.current.contains(sel.focusNode);
    if (!txt || !within) { setPopup(null); return; }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    setPopup({ quote: txt.length > 140 ? txt.slice(0, 140) + '…' : txt, x: r.left + r.width / 2, y: r.top });
  };
  const startNote = () => { setPending(popup.quote); setNote(''); setPopup(null); if (window.getSelection) window.getSelection().removeAllRanges(); };
  const addAnno = () => {
    const n = note.trim(); if (!n) { return; }
    patch(x => ({ ...x, annotations: [{ id: Date.now(), quote: pending, note: n, t: OfficeStore.clock() }, ...(x.annotations || [])] }));
    setPending(''); setNote('');
  };
  const delAnno = id => patch(x => ({ ...x, annotations: (x.annotations || []).filter(an => an.id !== id) }));

  const annos = live.annotations || [];

  return (
    <div className="cs-cx">
      <div>
        <div className="cs-sec">คัมภีร์<span style={{ color: 'var(--text-mute)', margin: '0 9px' }}>—</span><span style={{ fontFamily: 'var(--mono)', color: 'var(--gold)', letterSpacing: 0, fontSize: 12, textShadow: 'none' }}>{a.name.toLowerCase()}.skill.md</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, flexWrap: 'wrap' }}>
          {!editing && (
            <div className="codex-toggle">
              <button className={mode === 'rendered' ? 'on' : ''} onClick={() => setMode('rendered')}>RENDERED</button>
              <button className={mode === 'source' ? 'on' : ''} onClick={() => setMode('source')}>SOURCE</button>
            </div>
          )}
          <span style={{ flex: 1 }}></span>
          {!editing
            ? <button className="btn sm gold" onClick={() => { setDraft(live.skillMd || ''); setEditing(true); }}>✎ แก้คัมภีร์</button>
            : <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn sm ghost" onClick={() => { setEditing(false); setDraft(live.skillMd || ''); }}>ยกเลิก</button>
              <button className="btn sm green" onClick={saveMd}>บันทึก</button>
            </div>}
        </div>

        {editing
          ? <div>
            <textarea className="codex-edit" value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false}></textarea>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 6 }}>
              Markdown: # หัวข้อ · **ตัวหนา** · - รายการ · &gt; คำคม · --- เส้นคั่น
            </div>
          </div>
          : (mode === 'rendered'
            ? <div className="cs-codex-frame">
              <div className="parch" ref={docRef} onMouseUp={onSelect}
                dangerouslySetInnerHTML={{ __html: renderMd(live.skillMd || '') }} />
            </div>
            : <div className="codex-src">{live.skillMd || ''}</div>)
        }
      </div>

      <div className="cs-anno">
        <div className="win-h"><span className="ttl" style={{ fontSize: 9 }}>ANNOTATIONS</span></div>
        <div className="win-b" style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflow: 'auto' }}>
          {pending && (
            <div style={{ border: '1px solid var(--gold)', borderRadius: 6, padding: '10px 11px', background: 'rgba(255,206,74,.06)' }}>
              <div className="cs-anno-quote" style={{ marginBottom: 8 }}>“{pending}”</div>
              <textarea ref={noteRef} className="fld" rows="2" placeholder="เขียนโน้ต…" value={note}
                onChange={e => setNote(e.target.value)} style={{ fontSize: 13, padding: '8px 10px' }}></textarea>
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
              <div className="cs-anno-quote">“{an.quote}”</div>
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

/* ---------------- full character sheet ---------------- */
function CharSheet({ a, onBack }) {
  const m = mdl(a);
  const [sk, setSk] = useS(0);
  const [act, setAct] = useS(null);   // 'chat' | 'tasks' | 'profile'
  const skills = a.skills || [];
  const cur = skills[Math.min(sk, skills.length - 1)];
  const perf = Math.min(98, 62 + Math.round(a.lv * 1.05));
  const load = Math.min(94, 38 + (a.lv * 7) % 48);
  const isCeo = a.isCeo;

  return (
    <div className="cs-page">
      <div className="cs-top">
        <span className="cs-back" onClick={onBack}>← ทีม</span>
        <span style={{ flex: 1 }}></span>
        {isCeo
          ? <button className="btn sm ghost" onClick={() => OfficeStore.setState({ route: 'settings' })}>✎ แก้โปรไฟล์เจ้าของ</button>
          : <React.Fragment>
            <button className="btn sm ghost" onClick={() => setAct('chat')}>🗨 คุยงาน</button>
            <button className="btn sm ghost" onClick={() => setAct('tasks')}>＋ มอบงาน</button>
            <button className="btn sm ghost" onClick={() => setAct('profile')}>✎ แก้บทบาท</button>
          </React.Fragment>}
      </div>

      <div className="cs-main">
        <div className="cs-left">
          <div className="cs-frame" style={{ '--rcol': m.col, '--rglow': m.glow }}>
            <div className="inner" style={{ aspectRatio: '1 / 1' }}>
              <image-slot id={a.isCeo ? 'player-avatar' : 'card-' + a.id} shape="rect" placeholder={a.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></image-slot>
              <div className="lp" style={{ fontSize: 64, color: m.col, textShadow: '0 0 26px ' + m.glow }}>{a.name[0]}</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <StatusDot s={a.status} />
              <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 22, color: 'var(--white)' }}>{a.name}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 5 }}>{a.roleTh}</div>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            background: 'rgba(10,14,30,.7)', border: '1px solid var(--line)', borderRadius: 6, padding: '15px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="cs-tier" style={{ '--rcol': m.col, '--rglow': m.glow, fontSize: 11 }}>{m.en}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{a.statusTh}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>
                <span>ผลงานเดือนนี้</span><span style={{ fontFamily: 'var(--mono)' }}>{perf}%</span></div>
              <CsBar pct={perf} from="#c79a2c" to="#ffd75e" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>
                <span>ภาระงาน</span><span style={{ fontFamily: 'var(--mono)' }}>{load}%</span></div>
              <CsBar pct={load} from="#2f8f5a" to="#5fe39a" />
            </div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', letterSpacing: .5 }}>ระดับ</div>
                <span style={{ fontSize: 12, color: m.col }}>{m.label}</span>
              </div>
              <CsStars a={a} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', letterSpacing: .5 }}>{isCeo ? 'ประเภท' : 'โมเดล'}</div>
                {isCeo
                  ? <span className="cs-modelchip" style={{ '--rcol': m.col }}>👑 เจ้าของบริษัท</span>
                  : <ModelChip a={a} />}
              </div>
            </div>
            <div style={{
              borderTop: '1px solid var(--line)', paddingTop: 11, fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 11,
              color: m.col, letterSpacing: .5, lineHeight: 1.7
            }}>❖ ทักษะ {skills.length} รายการ</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, minWidth: 0 }}>
          <div>
            <div className="cs-sec">รายละเอียด</div>
            <p style={{ fontSize: 15.5, color: 'var(--text)', lineHeight: 1.72, margin: 0, maxWidth: 760 }}>{a.desc}</p>
          </div>

          <div className="cs-eq">
            <div>
              <div className="cs-sec">ทักษะ · {skills.length}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {skills.map((s2, i) => (
                  <div key={s2} className={'cs-banner' + (i === sk ? ' on' : '')} onClick={() => setSk(i)}
                    style={{ '--rcol': m.col }}>
                    <span className="num">{i + 1}</span>
                    <span className="nm">{s2}</span>
                    <span className="dots">●●●</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="cs-sec" style={{ visibility: 'hidden' }}>·</div>
              {cur && (
                <div className="cs-ability" style={{ '--rcol': m.col }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 11 }}>
                    <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 17, color: 'var(--white)' }}>{cur}</span>
                    <span className="cs-tier" style={{ '--rcol': m.col, '--rglow': m.glow }}>{m.en}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 13, flexWrap: 'wrap' }}>
                    <span className="chip" style={{ color: m.col, borderColor: m.col + '66' }}>{m.label}</span>
                    {!isCeo && <ModelChip a={a} />}
                  </div>
                  <p style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.68, margin: 0 }}>{abilityDesc(a, cur)}</p>
                  <div style={{
                    marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line)',
                    fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)'
                  }}>
                    ใช้โดย <span style={{ color: 'var(--white)' }}>{a.name}</span> · {a.roleEn}
                  </div>
                </div>
              )}
            </div>
          </div>

          <CodexPanel a={a} />
        </div>
      </div>

      {act && (
        <Modal title={act === 'chat' ? 'คุยกับ ' + a.name : act === 'tasks' ? 'มอบหมายงาน · ' + a.name : 'แก้บทบาท · ' + a.name}
          onClose={() => setAct(null)} width={act === 'chat' ? 520 : 480}>
          <div style={{ minHeight: act === 'chat' ? 360 : 'auto' }}>
            {act === 'chat' && <AgentChat a={a} />}
            {act === 'tasks' && <AgentTasks a={a} />}
            {act === 'profile' && <AgentProfile a={a} />}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- page root ---------------- */
function Team() {
  const [s, set] = useOffice();
  const [openId, setOpenId] = useS(null);
  const [create, setCreate] = useS(false);
  const cfg = s.settings || {};
  const ceo = {
    ...(s.ceo || {}), isCeo: true, id: '__ceo',
    name: (cfg.ownerName || '').trim() || 'YOU',
    roleEn: (cfg.ownerRole || 'FOUNDER').toUpperCase(), roleTh: 'ผู้ก่อตั้ง · CEO'
  };
  const a = openId === '__ceo' ? ceo : s.agents.find(x => x.id === openId);

  // open agent requested from another page (e.g. Org Chart)
  useE(() => { if (s.openAgent) { setOpenId(s.openAgent); set({ openAgent: null }); } }, [s.openAgent]);

  // if selected agent got removed (fired), bounce back to roster
  useE(() => { if (openId && openId !== '__ceo' && !a) setOpenId(null); }, [openId, a]);

  if (a) return <CharSheet a={a} onBack={() => setOpenId(null)} />;

  return (
    <div className="cs-page">
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '22px 24px 40px' }}>
        <PageHead title="TEAM" sub={'CEO + พนักงาน AI · ' + (s.agents.length + 1) + ' คน · กดเพื่อดูโปรไฟล์ + คัมภีร์ skill.md'}
          right={<button className="btn gold" onClick={() => setCreate(true)}>＋ เพิ่มพนักงาน</button>} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(214px,1fr))', gap: 16 }}>
          <CharCard a={ceo} onClick={() => setOpenId('__ceo')} />
          {s.agents.map(ag => <CharCard key={ag.id} a={ag} onClick={() => setOpenId(ag.id)} />)}
          <div onClick={() => setCreate(true)} className="cs-rcard" style={{
            '--rcol': '#33406a', '--rglow': 'rgba(51,64,106,.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 268, gap: 10
          }}>
            <div style={{ fontSize: 38, color: 'var(--cyan)' }}>＋</div>
            <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 12, color: 'var(--text-dim)' }}>เพิ่มพนักงาน</div>
          </div>
        </div>
      </div>
      {create && <CreateAgent onClose={() => setCreate(false)} />}
    </div>
  );
}

/* ---------------- Legacy Actions ---------------- */
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
    <div className="flex flex-col h-full" style={{ minHeight: 360 }}>
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
  const live = s.agents.find(x => x.id === a.id) || a;
  const tasks = live.tasks || [];

  const assign = () => {
    const t = txt.trim();
    if (!t) return;
    OfficeStore.setState(st => ({
      ...st,
      agents: st.agents.map(x => x.id === a.id ? { ...x, status: 'working', statusTh: 'ทำงานอยู่', last: 'เมื่อสักครู่', tasks: [{ text: t, done: false, t: OfficeStore.clock() }, ...(x.tasks || [])] } : x),
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
        {tasks.length === 0 && <div className="empty">ยังไม่มีงานที่มอบหมาย</div>}
        {tasks.map((tk, i) => (
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
    if (window.confirm('ปลด ' + a.name + ' ออกจากทีม?')) {
      OfficeStore.setState(st => ({ ...st, agents: st.agents.filter(x => x.id !== a.id) }), { now: true });
      window.electronAPI?.saveLog('warning', 'Fired agent: ' + a.name);
    }
  };

  const skills = a.skills || [];

  return (
    <div>
      <p className="text-[14px] text-text-dim leading-relaxed mt-0">{a.desc}</p>
      <div className="flex flex-wrap gap-1.5 my-3.5 mb-4.5">
        {skills.map(sk => (
          <span
            key={sk}
            className="chip"
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

  const create = () => {
    const nm = name.trim() || 'Agent';
    const id = nm.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4);
    OfficeStore.setState(st => ({
      ...st,
      agents: [...st.agents, {
        id, name: nm, roleEn, roleTh, rarity, seniority: rarity === 'legend' ? 'senior' : rarity === 'epic' ? 'mid' : rarity === 'rare' ? 'junior' : 'newgrad', color: '#ffce4a', status: 'idle', statusTh: 'ว่าง', last: 'เพิ่งเข้าทีม',
        lv: 1, salary: 0.5, desc: 'พนักงานใหม่ พร้อมรับงาน ' + roleTh, skills: [roleTh], tasks: [], model: 'sonnet', skillMd: `# ${nm}'s Skills\n\n- **${roleTh}** — ทักษะพื้นฐาน`
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
            {RARITY[r] ? RARITY[r][1] : r}
          </button>
        ))}
      </div>
      <button className="btn w-full mt-4.5" onClick={create}>เพิ่มเข้าทีม</button>
    </Modal>
  );
}

export default Team;
