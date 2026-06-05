import React, { useState as useS } from 'react';
import { OfficeStore } from '../../store';
import { StatusDot, Modal } from '../UI.jsx';
import { mdl, mdlMod, abilityDesc } from './teamConfig.js';
import { CodexPanel } from './CodexPanel.jsx';
import { AgentChat, AgentTasks, AgentProfile } from './AgentActions.jsx';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, MessageSquare, Plus, Star, Crown, Gem } from 'lucide-react';

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

/** Full character profile sheet */
export function CharSheet({ a, onBack }) {
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
              <image-slot id={a.isCeo ? 'player-avatar' : 'card-' + a.id} shape="rect" placeholder={a.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}/>
              <div className="slot-letter lp" style={{ fontSize: 64, color: m.col, textShadow: '0 0 26px ' + m.glow }}>{a.name[0]}</div>
            </div>
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
