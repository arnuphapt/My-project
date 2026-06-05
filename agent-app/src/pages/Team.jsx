import React, { useState as useS, useEffect as useE } from 'react';
import { useOffice } from '../store';
import { PageHead } from '../components/UI.jsx';
import '../store/image-slot.js';
import { Plus } from 'lucide-react';
import { CharCard }    from '../components/team/CharCard.jsx';
import { CharSheet }   from '../components/team/CharSheet.jsx';
import { CreateAgent } from '../components/team/CreateAgent.jsx';

/* ============ TEAM — page root ============ */
function Team() {
  const [s, set]       = useOffice();
  const [openId, setOpenId] = useS(null);
  const [create, setCreate] = useS(false);
  const cfg = s.settings || {};

  const ceo = {
    ...(s.ceo || {}), isCeo: true, id: '__ceo',
    name:     (cfg.ownerName || '').trim() || 'YOU',
    roleEn:   (cfg.ownerRole || 'FOUNDER').toUpperCase(),
    roleTh:   'ผู้ก่อตั้ง · CEO',
    seniority: 'ceo',
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
        <PageHead
          title="TEAM"
          sub={'CEO + พนักงาน AI · ' + (s.agents.length + 1) + ' คน · กดเพื่อดูโปรไฟล์ + คัมภีร์ skill.md'}
          right={<button className="btn gold flex items-center gap-1.5" onClick={() => setCreate(true)}><Plus className="w-3.5 h-3.5" /> เพิ่มพนักงาน</button>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(214px,1fr))', gap: 16 }}>
          <CharCard a={ceo} onClick={() => setOpenId('__ceo')} />
          {s.agents.map(ag => <CharCard key={ag.id} a={ag} onClick={() => setOpenId(ag.id)} />)}
          {/* add-new slot */}
          <div onClick={() => setCreate(true)} className="cs-rcard" style={{
            '--rcol': '#33406a', '--rglow': 'rgba(51,64,106,.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 268, gap: 10,
          }}>
            <div style={{ color: 'var(--cyan)' }}><Plus className="w-10 h-10" /></div>
            <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 12, color: 'var(--text-dim)' }}>เพิ่มพนักงาน</div>
          </div>
        </div>
      </div>

      {create && <CreateAgent onClose={() => setCreate(false)} />}
    </div>
  );
}

export default Team;
