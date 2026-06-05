import React from 'react';
import { StatusDot } from '../UI.jsx';
import { mdl, mdlMod } from './teamConfig.js';

function CsStars({ a }) {
  const m = mdl(a);
  return (
    <span className="cs-stars">
      {[0,1,2,3,4].map(i => <span key={i} className={i < m.stars ? '' : 'off'}>★</span>)}
    </span>
  );
}

/** Roster card shown in the Team grid */
export function CharCard({ a, onClick }) {
  const m = mdl(a);
  return (
    <div className="cs-rcard" onClick={onClick} style={{ '--rcol': m.col, '--rglow': m.glow }}>
      <span className="corner" style={{ top: -1, left: -1 }}/>
      <span className="corner" style={{ top: -1, right: -1 }}/>
      <span className="corner" style={{ bottom: -1, left: -1 }}/>
      <span className="corner" style={{ bottom: -1, right: -1 }}/>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#0a0e1c' }}>
        <image-slot id={a.isCeo ? 'player-avatar' : 'card-' + a.id} shape="rect" placeholder={a.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}/>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', fontFamily: 'var(--pixel)', fontSize: 40, color: m.col, textShadow: '0 0 18px ' + m.glow,
        }}>{a.name[0]}</div>
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <span className="cs-tier" style={{ '--rcol': m.col, '--rglow': m.glow }}>{m.en}</span>
        </div>
        {a.isCeo
          ? <div style={{ position: 'absolute', top: 8, right: 9, fontSize: 13 }}>👑</div>
          : <div style={{
              position: 'absolute', top: 8, right: 9, fontFamily: 'var(--mono)', fontSize: 10,
              color: mdlMod(a).col, background: 'rgba(8,12,26,.7)',
              border: '1px solid ' + mdlMod(a).col + '66', borderRadius: 5, padding: '2px 6px',
            }}>{mdlMod(a).label}</div>}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: '22px 10px 9px',
          background: 'linear-gradient(180deg,transparent,rgba(6,9,18,.95))',
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
        borderTop: '1px solid rgba(0,0,0,.5)', background: 'rgba(8,12,26,.5)',
      }}>
        <CsStars a={a} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
          {a.isCeo ? 'ผู้นำสูงสุด' : (a.skills || []).length + ' ทักษะ'}
        </span>
      </div>
    </div>
  );
}
