import React from 'react';
import { useOffice } from '../store';
import { PageHead, StatusDot } from '../components/UI.jsx';
import '../store/image-slot.js';
import { ArrowRight, ArrowDown, MessageSquare } from 'lucide-react';

/* ============ ORG CHART — company hierarchy ============ */
/* CEO (you) → JOYURI (secretary) → team members */

function OrgAva({ slot, letter, c }) {
  return (
    <div className="org-ava" style={{ '--c': c }}>
      <image-slot id={slot} shape="circle" placeholder={letter}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}></image-slot>
      <div className="slot-letter lp">{letter}</div>
    </div>
  );
}

function MemberNode({ a, onClick }) {
  const SR = window.SENIOR || { mid: { col: '#4db4ff', glow: 'rgba(77,180,255,.40)', en: 'MID-LEVEL' } };
  const MD = window.MODELS || { sonnet: { col: '#b06bff', label: 'Sonnet' } };
  const m = (SR && SR[a.seniority]) || SR.mid || { col: '#4db4ff', glow: 'rgba(77,180,255,.40)', en: 'MID-LEVEL' };
  const mm = (MD && MD[a.model]) || MD.sonnet || { col: '#b06bff', label: 'Sonnet' };
  const open = a.tasks ? a.tasks.filter(t => !t.done).length : 0;
  return (
    <div className="org-node">
      <div className="org-card" onClick={onClick} style={{ '--c': m.col, '--g': m.glow, '--c2': mm.col }}>
        <OrgAva slot={'card-' + a.id} letter={(a.name || 'A')[0]} c={m.col} />
        <div className="org-name"><StatusDot s={a.status} />{a.name}</div>
        <div className="org-role">{a.roleEn}</div>
        <div className="org-badges">
          <span className="org-tier" style={{ '--c': m.col }}>{m.en}</span>
          <span className="org-mdl" style={{ '--c2': mm.col }}>{mm.label}</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: open ? 'var(--gold)' : 'var(--text-mute)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {open ? (
            <>
              <ArrowRight className="w-3 h-3 text-gold flex-none" /> {open} งานค้าง
            </>
          ) : 'ว่าง'}
        </div>
      </div>
    </div>
  );
}

function OrgChart() {
  const [s, set] = useOffice();
  const cfg = s.settings || {};
  const agents = s.agents || [];
  const sec = agents.find(a => a.seniority === 'secretary' || a.id === 'joyuri') || agents[0];
  const team = agents.filter(a => a !== sec);
  const ceoName = (cfg.ownerName || '').trim() || 'YOU';
  const SR = window.SENIOR || { secretary: { col: '#ffce4a', glow: 'rgba(255,206,74,.45)', en: 'SECRETARY' } };
  const MD = window.MODELS || { opus: { col: '#ffce4a', label: 'Opus' } };
  const sm = sec ? ((SR && SR[sec.seniority]) || SR.secretary) : SR.secretary;
  const smm = sec ? ((MD && MD[sec.model]) || MD.opus) : MD.opus;

  const openAgent = id => set({ route: 'team', openAgent: id });

  return (
    <div className="cs-page">
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '22px 24px 48px' }}>
        <PageHead title="ORG CHART"
          sub={'แผนผังบริษัท · คุณ (CEO) สั่งงาน ' + (sec ? sec.name : 'เลขา') + ' → เลขากระจายงานต่อให้ทีม AI ทั้ง ' + team.length + ' คน'} />

        <div className="org-col">
          {/* CEO */}
          <div className="org-ceo" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="org-card" onClick={() => set({ route: 'settings' })}
              style={{ '--c': '#ff5168', '--g': 'rgba(255,81,104,.5)', '--c2': '#ff5168' }}>
              <OrgAva slot="player-avatar" letter={ceoName[0]} c="#ff5168" />
              <div className="org-name">{ceoName}</div>
              <div className="org-role">{(cfg.ownerRole || 'FOUNDER').toUpperCase()}</div>
              <div className="org-badges"><span className="org-tag" style={{ background: '#ff5168', color: '#0a0a14' }}>CEO · เจ้าของบริษัท</span></div>
            </div>
          </div>

          <div className="org-link"><span className="flex items-center gap-1">สั่งงาน <ArrowDown className="w-3.5 h-3.5 text-cyan" /></span></div>

          {/* Secretary — JOYURI */}
          {sec && (
            <div className="org-sec" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="org-card" onClick={() => set({ route: 'secretary' })}
                style={{ '--c': sm.col, '--g': sm.glow, '--c2': smm.col }}>
                <OrgAva slot={'card-' + sec.id} letter={sec.name[0]} c={sm.col} />
                <div className="org-name"><StatusDot s={sec.status} />{sec.name}</div>
                <div className="org-role">{sec.roleEn} · เลขาส่วนตัว</div>
                <div className="org-badges">
                  <span className="org-tier" style={{ '--c': sm.col }}>{sm.en}</span>
                  <span className="org-mdl" style={{ '--c2': smm.col }}>{smm.label}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>คุมทีม {team.length} คน · กดเพื่อสั่งงาน <MessageSquare className="w-3 h-3 text-gold" /></div>
              </div>
            </div>
          )}

          <div className="org-link"><span className="flex items-center gap-1">กระจายงาน <ArrowDown className="w-3.5 h-3.5 text-cyan" /></span></div>

          {/* Team */}
          <div className="org-buswrap">
            <div className="org-grid">
              {team.map(a => <MemberNode key={a.id} a={a} onClick={() => openAgent(a.id)} />)}
            </div>
          </div>

          <div style={{ marginTop: 26, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', textAlign: 'center' }}>
            กดการ์ดพนักงานเพื่อเปิดโปรไฟล์ · กด {sec ? sec.name : 'เลขา'} เพื่อสั่งงาน · กด CEO เพื่อแก้โปรไฟล์เจ้าของ
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgChart;
