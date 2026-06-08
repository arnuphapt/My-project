import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice } from '../store';
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
  const teamFileRef = useR(null);
  const cfg = s.settings || {};

  const ceo = {
    ...(s.ceo || {}), isCeo: true, id: '__ceo',
    name:     (cfg.ownerName || '').trim() || 'YOU',
    roleEn:   (cfg.ownerRole || 'FOUNDER').toUpperCase(),
    roleTh:   'ผู้ก่อตั้ง · CEO',
    seniority: 'ceo',
  };

  const a = openId === '__ceo' ? ceo : s.agents.find(x => x.id === openId);

  useE(() => {
    if (teamFileRef.current) {
      teamFileRef.current.setAttribute('webkitdirectory', '');
      teamFileRef.current.setAttribute('directory', '');
    }
  }, []);

  // open agent requested from another page (e.g. Org Chart)
  useE(() => { if (s.openAgent) { setOpenId(s.openAgent); set({ openAgent: null }); } }, [s.openAgent]);

  // if selected agent got removed (fired), bounce back to roster
  useE(() => { if (openId && openId !== '__ceo' && !a) setOpenId(null); }, [openId, a]);

  const IMPORT_COLORS = ['#4db4ff', '#b06bff', '#3ce594', '#ff5cc8', '#3ad0ff', '#ffce4a', '#ff8a5c', '#7c9cff'];
  const onTeamSync = async (e) => {
    const files = [...(e.target.files || [])].filter(f => /\.md$/i.test(f.name));
    if (!files.length) { alert('ไม่พบไฟล์ .md ในโฟลเดอร์ที่เลือก'); e.target.value = ''; return; }
    const existing = new Set(s.agents.map(x => x.name.toLowerCase()));
    const news = [];
    for (const f of files) {
      let text = ''; try { text = await f.text(); } catch (err) { text = ''; }
      const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
      const rawName = (heading || f.name.replace(/\.md$/i, '')).trim().split('·')[0].trim();
      const name = rawName.split(/\s+/).slice(0, 2).join(' ');
      if (!name || existing.has(name.toLowerCase())) continue;
      existing.add(name.toLowerCase());
      const sub = (text.match(/^>\s+(.+)$/m) || [])[1] || 'นำเข้าจากโฟลเดอร์';
      const roleTh = sub.split('—')[0].trim().slice(0, 40);
      
      // pull skills from bold bullets, else generic
      const sk = [...text.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map(m => m[1].trim()).slice(0, 5);
      const id = 'imp-' + skHashLocal(name) + '-' + news.length;
      const color = IMPORT_COLORS[(s.agents.length + news.length) % IMPORT_COLORS.length];
      const model = 'sonnet';
      news.push({
        id, name, roleEn: 'IMPORTED', roleTh, rarity: 'rare', color,
        status: 'idle', statusTh: 'ว่าง', last: 'เพิ่งนำเข้า', lv: 10, salary: 0.8,
        desc: sub, skills: (sk.length ? sk : ['ทักษะนำเข้า']), seniority: 'mid', model, effort: 4,
        hp: 70, hpMax: 100, xp: 0, xpMax: 100, annotations: [], tasks: [], imported: true, skillMd: text
      });
    }
    if (!news.length) { alert('ไม่มีพนักงานใหม่ (อาจชื่อซ้ำกับที่มีอยู่แล้ว)'); e.target.value = ''; return; }
    const folder = (files[0].webkitRelativePath || '').split('/')[0] || 'โฟลเดอร์';
    OfficeStore.setState(st => ({
      ...st,
      agents: [...st.agents, ...news],
      syncMeta: { ...(st.syncMeta || {}), team: { folder, count: news.length, t: OfficeStore.clock() } },
      log: [{ t: OfficeStore.clock(), who: 'ระบบ', text: 'นำเข้าพนักงาน ' + news.length + ' คนจาก ' + folder, kind: 'ok' }, ...st.log].slice(0, 40)
    }), { now: true });
    e.target.value = '';
    alert('นำเข้าพนักงาน ' + news.length + ' คนเรียบร้อย ✓');
  };

  function skHashLocal(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36).slice(0, 6);
  }

  const teamMeta = (s.syncMeta && s.syncMeta.team) || null;

  if (a) return <CharSheet a={a} onBack={() => setOpenId(null)} />;

  return (
    <div className="cs-page">
      <input ref={teamFileRef} type="file" multiple accept=".md" style={{ display: 'none' }} onChange={onTeamSync} />
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '22px 24px 40px' }}>
        <PageHead
          title="TEAM"
          sub={'CEO + พนักงาน AI · ' + (s.agents.length + 1) + ' คน' + (teamMeta ? (' · ซิงค์ ' + teamMeta.count + ' คนจาก ' + teamMeta.folder) : '') + ' · กดเพื่อดูโปรไฟล์ + คัมภีร์ skill.md'}
          right={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost sm flex items-center gap-1.5" onClick={() => teamFileRef.current && teamFileRef.current.click()}>⟳ Sync โฟลเดอร์</button>
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
    </div>
  );
}

export default Team;
