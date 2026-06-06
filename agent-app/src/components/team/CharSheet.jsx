import React, { useState as useS } from 'react';
import { OfficeStore, useOffice } from '../../store';
import { StatusDot, Modal } from '../UI.jsx';
import { mdl, mdlMod, abilityDesc, DEFAULT_MODEL_INFO as MODELS } from './teamConfig.js';
import { CodexPanel } from './CodexPanel.jsx';
import { AgentChat, AgentTasks, AgentProfile } from './AgentActions.jsx';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, MessageSquare, Plus, Star, Crown, Gem } from 'lucide-react';
import { Bar } from '../Bar.jsx';

function CsStars({ a }) {
  const m = mdl(a);
  return (
    <span className="cs-stars inline-flex items-center gap-0.5">
      {[0,1,2,3,4].map(i => (
        <span key={i} className={i < m.stars ? '' : 'off'}>
          <Star className="w-2.5 h-2.5 fill-current inline" style={{ verticalAlign: 'middle', marginTop: -2 }} />
        </span>
      ))}
    </span>
  );
}
function ModelChip({ a, style }) {
  const mm = mdlMod(a);
  return <span className="cs-modelchip inline-flex items-center gap-1" style={{ '--rcol': mm.col, ...style }}><Gem className="w-2.5 h-2.5" /> {mm.full}</span>;
}
function CsBar({ pct, from, to }) {
  return <div className="bar" style={{ height: 10 }}><i style={{ width: Math.max(0, Math.min(100, pct)) + '%', background: 'linear-gradient(90deg,' + from + ',' + to + ')' }}/></div>;
}

/* ── helpers for exec sheets ── */
function effortOf(a) { return a.effort != null ? a.effort : 4; }
function modelMax(a) { return (MODELS[a.model] || MODELS.sonnet).max || 0; }

function Kpi({ label, val, sub, col }) {
  return (
    <div className="cs-kpi-card" style={{ '--kc': col }}>
      <div className="cs-kpi-l">{label}</div>
      <div className="cs-kpi-v" style={{ '--kc': col }}>{val}</div>
      <div className="cs-kpi-s">{sub}</div>
    </div>
  );
}

function HeroAva({ slot, letter }) {
  return (
    <div className="cs-hero-ava">
      <image-slot id={slot} shape="rounded" radius="18" placeholder={letter}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div className="lp slot-letter">{letter}</div>
    </div>
  );
}

/* ── CEO sheet ── */
function CeoSheet({ a, onBack }) {
  const [s] = useOffice();
  const cfg = s.settings || {};
  const agents = s.agents;
  const sec = agents.find(x => x.seniority === 'secretary');
  const tasks = (agents || []).flatMap(ag => (ag.tasks || []).map(tk => ({ ...tk, agent: ag })));
  const activeN = tasks.filter(t => t.status !== 'done' && !t.done).length;
  const doneN = tasks.filter(t => t.status === 'done' || t.done).length;
  const total = tasks.length;
  const donePct = total ? Math.round(doneN / total * 100) : 0;
  const projects = (s.projects || []).length;
  const [dir, setDir] = useS('');
  const navigate = useNavigate();
  const red = '#ff5168', glow = 'rgba(255,81,104,.32)';

  const sendDirective = () => {
    const t = dir.trim(); if (!t) return;
    OfficeStore.setState(st => ({
      ...st,
      secretaryDraft: t,
      route: 'secretary',
      log: [{ t: OfficeStore.clock(), who: a.name, text: 'สั่งงาน ' + (sec ? sec.name : 'เลขา') + ': ' + t, kind: 'ok' }, ...st.log].slice(0, 40),
    }), { now: true });
    navigate('/secretary');
    setDir('');
  };

  const TASK_STATUS_COLORS = { open: '#46b6ff', progress: '#ffce4a', pending: '#b06bff', done: '#3ce594' };
  const taskKeys = ['open', 'progress', 'pending', 'done'];
  const taskLabels = { open: 'OPEN', progress: 'IN PROGRESS', pending: 'PENDING', done: 'DONE' };

  return (
    <div className="cs-page">
      <div className="cs-top flex items-center gap-3">
        <span className="cs-back flex items-center gap-1.5 cursor-pointer" onClick={onBack}><ArrowLeft className="w-4 h-4" /> ทีม</span>
        <span style={{ flex: 1 }} />
        <button className="btn sm ghost" onClick={() => { OfficeStore.setState({ route: 'org' }); navigate('/orgchart'); }}>🏢 ผังบริษัท</button>
        <button className="btn sm gold" onClick={() => { OfficeStore.setState({ route: 'settings' }); navigate('/settings'); }}><Pencil className="w-3 h-3" /> แก้โปรไฟล์เจ้าของ</button>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '4px 24px 44px' }}>
        {/* hero */}
        <div className="cs-hero" style={{ '--hc': red, '--hg': glow, '--hb': 'rgba(255,81,104,.16)' }}>
          <span className="cs-crown">👑</span>
          <HeroAva slot="player-avatar" letter={a.name[0]} />
          <div className="cs-hero-body">
            <div className="cs-kicker" style={{ '--hc': red, '--hg': glow }}>👑 ผู้บัญชาการสูงสุด</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--pixel)', fontSize: 24, color: 'var(--white)', margin: 0, letterSpacing: .5, textShadow: '0 0 20px ' + glow }}>{a.name}</h1>
              <span className="cs-tier" style={{ '--rcol': red, '--rglow': glow }}>CEO</span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: red, marginTop: 8 }}>
              {(cfg.ownerRole || 'FOUNDER').toUpperCase()} · เจ้าของบริษัท
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.65, margin: '12px 0 0', maxWidth: 620 }}>
              {(cfg.bio || '').trim() || a.desc}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="cs-kpi">
          <Kpi label="ทีมในบังคับบัญชา" val={agents.length} sub="พนักงาน AI" col={red} />
          <Kpi label="งานที่ยังไม่เสร็จ" val={activeN} sub="ทั่วทั้งบริษัท" col="#ffce4a" />
          <Kpi label="โปรเจกต์ในคลัง" val={projects} sub="ผลงานสะสม" col="#46b6ff" />
        </div>

        {/* company task overview */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div className="cs-sec" style={{ marginBottom: 0 }}>ภาพรวมงานบริษัท</div>
          <span onClick={() => { OfficeStore.setState({ route: 'tasks' }); navigate('/tasks'); }}
            style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cyan)', cursor: 'pointer' }}>ดูบอร์ดงานทั้งหมด →</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, margin: '13px 0 10px' }}>
          {taskKeys.map(k => (
            <div key={k} onClick={() => { OfficeStore.setState({ route: 'tasks' }); navigate('/tasks'); }}
              style={{ cursor: 'pointer', background: 'rgba(10,14,30,.6)', border: '1px solid var(--line)',
                borderTop: '2px solid ' + TASK_STATUS_COLORS[k], borderRadius: 10, padding: '13px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: TASK_STATUS_COLORS[k], boxShadow: '0 0 7px ' + TASK_STATUS_COLORS[k] }} />
                <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 11, color: 'var(--text-dim)' }}>{taskLabels[k]}</span>
              </div>
              <div style={{ fontFamily: 'var(--pixel)', fontSize: 21, color: TASK_STATUS_COLORS[k], marginTop: 9, textShadow: '0 0 12px ' + TASK_STATUS_COLORS[k] + '55' }}>
                {tasks.filter(t => (t.status || (t.done ? 'done' : 'open')) === k).length}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 }}>
          <div style={{ flex: 1 }}><Bar pct={donePct} tone="green" /></div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)' }}>{donePct}% เสร็จ</span>
        </div>

        {/* chain of command */}
        <div className="cs-sec">สายบังคับบัญชา</div>
        <div className="cs-chain" style={{ marginBottom: 26 }}>
          <div className="cs-chain-node" style={{ '--cc': red }}>
            <div className="cs-chain-ava" style={{ '--cc': red }}>
              <image-slot id="player-avatar" shape="rounded" radius="10" placeholder={a.name[0]}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              <div className="lp slot-letter">{a.name[0]}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{a.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)' }}>CEO · สั่งการ</div>
            </div>
          </div>
          <div className="cs-chain-arrow">→</div>
          {sec && (
            <div className="cs-chain-node" style={{ '--cc': '#ffce4a', cursor: 'pointer' }}
              onClick={() => OfficeStore.setState({ route: 'team', openAgent: sec.id })}>
              <div className="cs-chain-ava" style={{ '--cc': '#ffce4a' }}>
                <image-slot id={'card-' + sec.id} shape="rounded" radius="10" placeholder={sec.name[0]}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                <div className="lp slot-letter">{sec.name[0]}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>{sec.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)' }}>เลขา · กระจายงาน</div>
              </div>
            </div>
          )}
          <div className="cs-chain-arrow">→</div>
          <div className="cs-chain-node" style={{ '--cc': '#46b6ff' }}>
            <div style={{ display: 'flex', marginRight: 2 }}>
              {agents.filter(x => x !== sec).slice(0, 4).map((x, i) => (
                <div key={x.id} style={{ width: 30, height: 30, borderRadius: 8, marginLeft: i ? -9 : 0, position: 'relative',
                  overflow: 'hidden', background: '#0a0e1c', boxShadow: '0 0 0 2px #0b1024, inset 0 0 0 1px ' + x.color }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--pixel)', fontSize: 11, color: x.color }}>{x.name[0]}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>ทีม AI</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)' }}>{agents.filter(x => x !== sec).length} คน · ลงมือทำ</div>
            </div>
          </div>
        </div>

        {/* responsibilities */}
        <div className="cs-sec">ขอบเขตงาน</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {(a.skills || []).map(sk => (
            <span key={sk} className="chip" style={{ color: red, borderColor: red + '66', fontSize: 13, padding: '6px 13px' }}>{sk}</span>
          ))}
        </div>

        {/* directive composer */}
        <div className="cs-sec">ออกคำสั่งถึง {sec ? sec.name : 'เลขา'}</div>
        <div style={{ background: 'linear-gradient(120deg,rgba(255,81,104,.08),rgba(10,14,30,.6) 60%)',
          border: '1px solid ' + red + '44', borderRadius: 12, padding: '16px 17px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
            {sec && (
              <div style={{ width: 34, height: 34, borderRadius: 9, position: 'relative', overflow: 'hidden', flex: 'none',
                background: '#0a0e1c', boxShadow: '0 0 0 2px #ffce4a' }}>
                <image-slot id={'card-' + sec.id} shape="rounded" radius="9" placeholder={sec.name[0]}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', fontFamily: 'var(--pixel)', fontSize: 13, color: '#ffce4a' }} className="slot-letter">{sec.name[0]}</div>
              </div>
            )}
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              สั่งงานเป็นภาษาคน — {sec ? sec.name : 'เลขา'} จะแตกงานแล้วกระจายให้ทีมเอง
            </div>
          </div>
          <textarea className="fld" rows="3" value={dir} onChange={e => setDir(e.target.value)}
            placeholder="เช่น: เตรียมสรุปผลประกอบการไตรมาสนี้ พร้อมกราฟ แล้วร่างโพสต์ประกาศ"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendDirective(); }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 11 }}>
            <span style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)' }}>⌘/Ctrl + Enter เพื่อส่ง</span>
            <button className="btn" style={{ background: red, borderColor: red }} onClick={sendDirective}>
              🗨 ส่งให้ {sec ? sec.name : 'เลขา'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Secretary sheet ── */
function SecretarySheet({ a, onBack }) {
  const [s] = useOffice();
  const [act, setAct] = useS(null);
  const team = s.agents.filter(x => x.id !== a.id);
  const dispatched = team.reduce((n, x) => n + ((x.tasks || []).filter(t => !t.done && t.status !== 'done').length), 0);
  const gold = '#ffce4a', glow = 'rgba(255,206,74,.3)';
  const navigate = useNavigate();

  return (
    <div className="cs-page">
      <div className="cs-top flex items-center gap-3">
        <span className="cs-back flex items-center gap-1.5 cursor-pointer" onClick={onBack}><ArrowLeft className="w-4 h-4" /> ทีม</span>
        <span style={{ flex: 1 }} />
        <button className="btn sm ghost" onClick={() => setAct('profile')}><Pencil className="w-3 h-3" /> แก้บทบาท</button>
        <button className="btn sm gold" onClick={() => { OfficeStore.setState({ route: 'secretary' }); navigate('/secretary'); }}>🗨 เปิดห้องสั่งงาน</button>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '4px 24px 44px' }}>
        {/* hero */}
        <div className="cs-hero" style={{ '--hc': gold, '--hg': glow, '--hb': 'rgba(255,206,74,.14)' }}>
          <HeroAva slot={'card-' + a.id} letter={a.name[0]} />
          <div className="cs-hero-body">
            <div className="cs-kicker" style={{ '--hc': gold, '--hg': glow }}>✦ เลขาส่วนตัว · CHIEF OF STAFF</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--pixel)', fontSize: 24, color: 'var(--white)', margin: 0, letterSpacing: .5, textShadow: '0 0 20px ' + glow }}>{a.name}</h1>
              <StatusDot s={a.status} />
              <ModelChip a={a} />
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.65, margin: '12px 0 0', maxWidth: 620 }}>{a.desc}</p>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: gold, marginTop: 11 }}>
              รับคำสั่งจาก CEO → แตกงาน → กระจายให้ทีม → สรุปกลับ
            </div>
          </div>
        </div>

        {/* action bar */}
        <div className="cs-actionbar">
          <button className="btn gold" onClick={() => { OfficeStore.setState({ route: 'secretary' }); navigate('/secretary'); }}>🗨 คุยงานกับ {a.name}</button>
          <button className="btn ghost" onClick={() => setAct('tasks')}><Plus className="w-3.5 h-3.5" /> มอบงานโดยตรง</button>
          <button className="btn ghost" onClick={() => { OfficeStore.setState({ route: 'org' }); navigate('/orgchart'); }}>🏢 ดูผังบริษัท</button>
        </div>

        {/* KPIs */}
        <div className="cs-kpi">
          <Kpi label="ทีมที่ดูแล" val={team.length} sub="พนักงาน AI" col={gold} />
          <Kpi label="งานที่กระจายอยู่" val={dispatched} sub="ยังไม่เสร็จ" col="#46b6ff" />
          <Kpi label="EFFORT" val={modelMax(a) > 0 ? effortOf(a) + '/' + modelMax(a) : '—'} sub={(MODELS[a.model] || MODELS.sonnet).full} col={(MODELS[a.model] || MODELS.sonnet).col} />
        </div>

        {/* team roster */}
        <div className="cs-sec">ทีมที่ {a.name} กระจายงานให้ · {team.length} คน</div>
        <div className="cs-roster" style={{ marginBottom: 28 }}>
          {team.map(x => {
            const open = (x.tasks || []).filter(t => !t.done && t.status !== 'done').length;
            return (
              <div key={x.id} className="cs-roster-card" style={{ '--rc': x.color }}
                onClick={() => OfficeStore.setState({ route: 'team', openAgent: x.id })}>
                <div className="cs-roster-ava" style={{ '--rc': x.color }}>
                  <image-slot id={'card-' + x.id} shape="rounded" radius="9" placeholder={x.name[0]}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                  <div className="lp slot-letter">{x.name[0]}</div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusDot s={x.status} />
                    <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 13.5, color: 'var(--white)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: open ? 'var(--gold)' : 'var(--text-mute)', marginTop: 2 }}>
                    {open ? ('▸ ' + open + ' งานค้าง') : 'ว่าง'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* codex */}
        <CodexPanel a={a} />
      </div>

      {act && (
        <Modal title={act === 'tasks' ? 'มอบหมายงาน · ' + a.name : 'แก้บทบาท · ' + a.name}
          onClose={() => setAct(null)} width={480}>
          {act === 'tasks' && <AgentTasks a={a} />}
          {act === 'profile' && <AgentProfile a={a} />}
        </Modal>
      )}
    </div>
  );
}

/** Full character profile sheet */
export function CharSheet({ a, onBack }) {
  // Route to specialized sheets for CEO and Secretary
  if (a.isCeo) return <CeoSheet a={a} onBack={onBack} />;
  if (a.seniority === 'secretary') return <SecretarySheet a={a} onBack={onBack} />;

  const m      = mdl(a);
  const [sk, setSk]   = useS(0);
  const [act, setAct] = useS(null); // 'chat' | 'tasks' | 'profile'
  const navigate      = useNavigate();
  const skills = a.skills || [];
  const cur    = skills[Math.min(sk, skills.length - 1)];
  const perf   = Math.min(98, 62 + Math.round(a.lv * 1.05));
  const load   = Math.min(94, 38 + (a.lv * 7) % 48);
  const isCeo  = a.isCeo;

  return (
    <div className="cs-page">
      <div className="cs-top flex items-center gap-3">
        <span className="cs-back flex items-center gap-1.5 cursor-pointer" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> ทีม
        </span>
        <span style={{ flex: 1 }}/>
        {isCeo
          ? <button className="btn sm ghost" onClick={() => { OfficeStore.setState({ route: 'settings' }); navigate('/settings'); }}><Pencil className="w-3 h-3" /> แก้โปรไฟล์เจ้าของ</button>
          : <>
              <button className="btn sm ghost" onClick={() => setAct('chat')}><MessageSquare className="w-3 h-3" /> คุยงาน</button>
              <button className="btn sm ghost" onClick={() => setAct('tasks')}><Plus className="w-3 h-3" /> มอบงาน</button>
              <button className="btn sm ghost" onClick={() => setAct('profile')}><Pencil className="w-3 h-3" /> แก้บทบาท</button>
            </>}
      </div>

      <div className="cs-main">
        {/* left column */}
        <div className="cs-left">
          <div className="cs-frame" style={{ '--rcol': m.col, '--rglow': m.glow }}>
            <div className="inner" style={{ aspectRatio: '1 / 1' }}>
              <image-slot id={a.isCeo ? 'player-avatar' : 'card-' + a.id} editable="true" shape="rect" placeholder={a.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}/>
              <div className="slot-letter lp" style={{ fontSize: 64, color: m.col, textShadow: '0 0 26px ' + m.glow }}>{a.name[0]}</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 12 }}>
            <button className="text-[10px] text-cyan hover:underline cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('browse-assets', { detail: { id: a.isCeo ? 'player-avatar' : 'card-' + a.id } }))}>เลือกรูปจาก Assets</button>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <StatusDot s={a.status}/>
              <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 22, color: 'var(--white)' }}>{a.name}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 5 }}>{a.roleTh}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(10,14,30,.7)', border: '1px solid var(--line)', borderRadius: 6, padding: '15px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="cs-tier" style={{ '--rcol': m.col, '--rglow': m.glow, fontSize: 11 }}>{m.en}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>{a.statusTh}</span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>
                <span>ผลงานเดือนนี้</span><span style={{ fontFamily: 'var(--mono)' }}>{perf}%</span>
              </div>
              <CsBar pct={perf} from="#c79a2c" to="#ffd75e"/>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>
                <span>ภาระงาน</span><span style={{ fontFamily: 'var(--mono)' }}>{load}%</span>
              </div>
              <CsBar pct={load} from="#2f8f5a" to="#5fe39a"/>
            </div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', letterSpacing: .5 }}>ระดับ</div>
                <span style={{ fontSize: 12, color: m.col }}>{m.label}</span>
              </div>
              <CsStars a={a}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 10, color: 'var(--text-dim)', letterSpacing: .5 }}>{isCeo ? 'ประเภท' : 'โมเดล'}</div>
                {isCeo ? <span className="cs-modelchip inline-flex items-center gap-1" style={{ '--rcol': m.col }}><Crown className="w-3 h-3 text-gold" /> เจ้าของบริษัท</span> : <ModelChip a={a}/>}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 11, fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 11, color: m.col, letterSpacing: .5, lineHeight: 1.7 }}>❖ ทักษะ {skills.length} รายการ</div>
          </div>
        </div>

        {/* right column */}
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
                  <div key={s2} className={'cs-banner' + (i === sk ? ' on' : '')} onClick={() => setSk(i)} style={{ '--rcol': m.col }}>
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
                    {!isCeo && <ModelChip a={a}/>}
                  </div>
                  <p style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.68, margin: 0 }}>{abilityDesc(a, cur)}</p>
                  <div style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-mute)' }}>
                    ใช้โดย <span style={{ color: 'var(--white)' }}>{a.name}</span> · {a.roleEn}
                  </div>
                </div>
              )}
            </div>
          </div>
          <CodexPanel a={a}/>
        </div>
      </div>

      {act && (
        <Modal title={act === 'chat' ? 'คุยกับ ' + a.name : act === 'tasks' ? 'มอบหมายงาน · ' + a.name : 'แก้บทบาท · ' + a.name}
          onClose={() => setAct(null)} width={act === 'chat' ? 520 : 480}>
          <div style={{ minHeight: act === 'chat' ? 360 : 'auto' }}>
            {act === 'chat'    && <AgentChat    a={a}/>}
            {act === 'tasks'   && <AgentTasks   a={a}/>}
            {act === 'profile' && <AgentProfile a={a}/>}
          </div>
        </Modal>
      )}
    </div>
  );
}
