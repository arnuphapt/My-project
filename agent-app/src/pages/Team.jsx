import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice } from '../store';
import { PageHead } from '../components/UI.jsx';
import '../store/image-slot.js';
import { SyncPicker } from '../components/SyncPicker.jsx';
import { SYNC_PATHS } from '../store/catalog.js';
import { Plus } from 'lucide-react';
import { CharCard }    from '../components/team/CharCard.jsx';
import { CharSheet }   from '../components/team/CharSheet.jsx';
import { CreateAgent } from '../components/team/CreateAgent.jsx';

/* ============ TEAM — page root ============ */
function Team() {
  const [s, set]       = useOffice();
  const [openId, setOpenId] = useS(null);
  const [create, setCreate] = useS(false);
  const [showPicker, setShowPicker] = useS(false);
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

  const IMPORT_COLORS = ['#4db4ff', '#b06bff', '#3ce594', '#ff5cc8', '#3ad0ff', '#ffce4a', '#ff8a5c', '#7c9cff'];
  const onImportAgents=(items)=>{
    const existing=new Set(s.agents.map(x=>x.name.toLowerCase()));
    const news=[];
    items.forEach((it)=>{
      if(existing.has(it.name.toLowerCase())) return;
      existing.add(it.name.toLowerCase());
      const model=it.model||'sonnet';
      const color=IMPORT_COLORS[(s.agents.length+news.length)%IMPORT_COLORS.length];
      news.push({ id:'imp-'+it.id+'-'+news.length, name:it.name, roleEn:'IMPORTED',
        roleTh:it.role||'นำเข้า', rarity:'rare', color,
        status:'idle', statusTh:'ว่าง', last:'เพิ่งนำเข้า', lv:10, salary:0.8,
        desc:it.desc, skills:(it.skills&&it.skills.length?it.skills:['ทักษะนำเข้า']),
        seniority:'mid', model, effort:4,
        hp:70, hpMax:100, xp:0, xpMax:100, annotations:[], tasks:[], imported:true, skillMd:it.md });
    });
    if(!news.length){ alert('ไม่มีพนักงานใหม่ (อาจชื่อซ้ำกับที่มีอยู่แล้ว)'); return; }
    OfficeStore.setState(st=>({...st, agents:[...st.agents,...news],
      syncMeta:{...(st.syncMeta||{}), team:{ folder:SYNC_PATHS.agents, count:news.length, t:OfficeStore.clock() }},
      log:[{t:OfficeStore.clock(),who:'ระบบ',text:'นำเข้าพนักงาน '+news.length+' คนจาก claude-master/agents',kind:'ok'},...st.log].slice(0,40)}),{now:true});
  };

  const teamMeta = (s.syncMeta && s.syncMeta.team) || null;

  if (a) return <CharSheet a={a} onBack={() => setOpenId(null)} />;

  return (
    <div className="cs-page">
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '22px 24px 40px' }}>
        <PageHead
          title="TEAM"
          sub={'CEO + พนักงาน AI · ' + (s.agents.length + 1) + ' คน' + (teamMeta ? (' · ซิงค์ ' + teamMeta.count + ' คนจาก agents') : '') + ' · กดเพื่อดูโปรไฟล์'}
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost sm flex items-center gap-1.5" onClick={() => setShowPicker(true)}>⟳ Sync</button>
              <button className="btn gold sm flex items-center gap-1.5" onClick={() => setCreate(true)}><Plus className="w-3.5 h-3.5" /> เพิ่มพนักงาน</button>
            </div>
          }
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
      {showPicker && <SyncPicker kind="agents" existing={new Set(s.agents.map(x=>x.name.toLowerCase()))}
        onClose={()=>setShowPicker(false)} onImport={onImportAgents}/>}
    </div>
  );
}

export default Team;
