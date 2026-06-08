/* ============ SKILLS · คลังทักษะของทีม (library) ============ */
import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Rarity } from '../components/UI.jsx';
import { renderMd } from '../components/SkillMd.jsx';
import { SyncPicker } from '../components/SyncPicker.jsx';
import { syncedFromCatalog, SYNC_PATHS } from '../store/catalog.js';
import { Star } from 'lucide-react';

/* skill clusters — relatedness groups */
export const SK_CLUSTERS = [
  { id:'coord',   name:'การจัดการ & ประสานงาน', en:'COORDINATION', col:'#ffce4a', glyph:'◷' },
  { id:'finance', name:'การลงทุน & การเงิน',    en:'FINANCE',      col:'#3ce594', glyph:'฿' },
  { id:'eng',     name:'พัฒนา & เทคนิค',        en:'ENGINEERING',  col:'#4db4ff', glyph:'{ }' },
  { id:'design',  name:'ออกแบบ & สร้างสรรค์',   en:'DESIGN',       col:'#ff5cc8', glyph:'✦' },
  { id:'content', name:'คอนเทนต์ & สื่อสาร',    en:'CONTENT',      col:'#3ad0ff', glyph:'✎' },
  { id:'research',name:'ค้นคว้า & ข้อมูล',       en:'RESEARCH',     col:'#9d6bff', glyph:'⌕' },
  { id:'ops',     name:'ปฏิบัติการ',            en:'OPERATIONS',   col:'#9aa6cf', glyph:'⚙' },
];
export const SK_CLUSTER_BY = Object.fromEntries(SK_CLUSTERS.map(c=>[c.id,c]));
export const SK_MAP = {
  'วางแผนงาน':'coord','สรุปสถานะ':'coord','มอบหมายงาน':'coord','เตือนความจำ':'coord',
  'วางกลยุทธ์':'coord','ตัดสินใจ':'coord','สั่งงานเลขา':'coord','อนุมัติงบ':'finance',
  'วิเคราะห์พอร์ต':'finance','คัดหุ้น':'finance','เฝ้าราคา':'finance','รายงาน PnL':'finance',
  'ทำบัญชี':'finance','สรุปงบ':'finance','เตือนบิล':'finance',
  'เขียนโค้ด':'eng','ออโตเมชัน':'eng','ทำ prototype':'eng','แก้บั๊ก':'eng',
  'ออกแบบ UI':'design','พิกเซลอาร์ต':'design','โลโก้':'design','แบนเนอร์':'design',
  'เขียนคอนเทนต์':'content','วางแผนโพสต์':'content','คิดแคปชั่น':'content',
  'หาข้อมูล':'research','สรุปบทความ':'research','เปรียบเทียบ':'research',
  'จัดไฟล์':'ops','ตั้งนัด':'ops','เก็บกวาด':'ops',
};
/* short descriptions per skill (fallback generated) */
export const SK_DESC = {
  'วางแผนงาน':'แตกเป้าหมายใหญ่ออกเป็นงานย่อยที่ลงมือทำได้จริง พร้อมจัดลำดับความสำคัญ',
  'มอบหมายงาน':'เลือกพนักงานที่เหมาะกับงาน เขียนบรีฟให้ชัด แล้วส่งต่อ',
  'สรุปสถานะ':'รวบความคืบหน้าทั้งออฟฟิศให้เป็นรายงานสั้นอ่านง่าย',
  'เตือนความจำ':'คุมเดดไลน์ นัดหมาย และงานค้างไม่ให้หลุด',
  'วิเคราะห์พอร์ต':'มองภาพรวมความเสี่ยง การกระจาย และผลตอบแทนของพอร์ต',
  'คัดหุ้น':'สแกนหาสินทรัพย์ที่น่าสนใจตามเกณฑ์ที่ตั้งไว้',
  'เฝ้าราคา':'ตั้งจุดเตือนและจับตาการเคลื่อนไหวของราคาแบบเรียลไทม์',
  'รายงาน PnL':'สรุปกำไร-ขาดทุนรายวัน/รายสัปดาห์ให้เห็นชัด',
  'เขียนโค้ด':'สร้างฟีเจอร์ สคริปต์ และเครื่องมือจากโจทย์ที่ได้รับ',
  'ออโตเมชัน':'เปลี่ยนงานซ้ำๆ ให้ระบบทำเองอัตโนมัติ',
  'ทำ prototype':'ขึ้นต้นแบบเร็วๆ เพื่อทดลองไอเดียก่อนลงมือจริง',
  'แก้บั๊ก':'ไล่หาสาเหตุของปัญหาแล้วซ่อมให้กลับมาทำงานปกติ',
  'ออกแบบ UI':'ออกแบบหน้าจอที่สวยและใช้งานง่าย',
  'พิกเซลอาร์ต':'วาดตัวละครและไอคอนสไตล์เกมพิกเซล',
  'เขียนคอนเทนต์':'เขียนบทความ โพสต์ และสคริปต์ตามโทนแบรนด์',
  'หาข้อมูล':'รวบรวมข้อมูลจากหลายแหล่งให้พร้อมตัดสินใจ',
  'เปรียบเทียบ':'ทำตารางข้อดี-ข้อเสียของตัวเลือกต่างๆ',
};
export function skClusterId(name){ return SK_MAP[name] || 'ops'; }

function skHash(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }

/* aggregate every skill across CEO + agents into the index */
function buildSkillIndex(s){
  const cfg=s.settings||{};
  const ceo = {
    ...(s.ceo || {}),
    isCeo: true,
    id: '__ceo',
    name: (cfg.ownerName || '').trim() || 'YOU',
    color: (s.ceo && s.ceo.color) || '#ff5168',
    skills: (s.ceo && s.ceo.skills) || ['วางแผนงาน', 'ตัดสินใจ', 'อนุมัติงบ', 'สั่งงานเลขา']
  };
  const roster = [ceo, ...(s.agents||[])].filter(a=>a && a.name);
  const idx = {}; // name -> { name, cluster, users:[{agent,calls}], calls }
  roster.forEach(a=>{
    (a.skills||[]).forEach(name=>{
      if(!idx[name]) idx[name]={ name, cluster:skClusterId(name), users:[], calls:0 };
      const base = 30 + (skHash(a.id+'·'+name) % 360);
      const lvBoost = Math.round((a.lv||10) * 1.6);
      const calls = base + lvBoost;
      idx[name].users.push({ agent:a, calls });
      idx[name].calls += calls;
    });
  });
  Object.values(idx).forEach(sk=>sk.users.sort((x,y)=>y.calls-x.calls));
  return idx;
}
function skFreq(calls){
  if(calls>=600) return { label:'ใช้บ่อยมาก', en:'VERY HIGH', lvl:4 };
  if(calls>=380) return { label:'ใช้บ่อย',     en:'HIGH',      lvl:3 };
  if(calls>=200) return { label:'ปานกลาง',     en:'MEDIUM',    lvl:2 };
  return            { label:'นานๆ ครั้ง',  en:'LOW',       lvl:1 };
}

/* tiny avatar stack */
function SkAvatars({ users, max=4 }){
  const shown=users.slice(0,max), extra=users.length-shown.length;
  return (
    <div style={{display:'flex',alignItems:'center'}}>
      {shown.map((u,i)=>{
        const a=u.agent;
        return (
          <div key={a.id} title={a.name} style={{width:24,height:24,borderRadius:6,marginLeft:i?-7:0,position:'relative',
            overflow:'hidden',background:'#0a0e1c',boxShadow:'0 0 0 1.5px #0b1024, inset 0 0 0 1.5px '+a.color,zIndex:max-i}}>
            <image-slot id={(a.isCeo?'player-avatar':'card-'+a.id)} shape="rounded" radius="6" placeholder={a.name[0]}
              style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
              pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:9,color:a.color}} className="slot-letter">{a.name[0]}</div>
          </div>
        );
      })}
      {extra>0 && <span style={{marginLeft:5,fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>+{extra}</span>}
    </div>
  );
}

/* synthesize a SKILL.md document for a skill */
function skillMdDoc(sk, c, desc){
  const fr=skFreq(sk.calls);
  const users=sk.users.map(u=>'- **'+u.agent.name+'** — เรียกใช้ '+u.calls.toLocaleString()+' ครั้ง'+(u.agent.isCeo?' 👑':'')).join('\n');
  const slug=sk.name.replace(/\s+/g,'-').toLowerCase();
  return `# ${sk.name}
> ${c.name} · ${c.en} · ความถี่ ${fr.label}

${desc}

## สถิติการใช้งาน
- ถูกเรียกทั้งหมด **${sk.calls.toLocaleString()}** ครั้ง
- ใช้โดย **${sk.users.length}** คนในทีม
- ระดับความถี่: \`${fr.en}\`

## ถูกใช้โดย
${users}

## คลัสเตอร์
ทักษะนี้อยู่ในกลุ่ม **${c.name}** — เชื่อมโยงกับทักษะอื่นในกลุ่มเดียวกันผ่านคอนสเตลเลชัน

> path: \`skills/${slug}/SKILL.md\``;
}

/* ---------- detail helpers ---------- */
function skTier(calls){
  if(calls>=400) return {key:'legend', label:'LEGENDARY', col:'#ffce4a', stars:5};
  if(calls>=300) return {key:'epic',   label:'EPIC',      col:'#b06bff', stars:4};
  if(calls>=200) return {key:'rare',   label:'RARE',      col:'#4db4ff', stars:3};
  if(calls>=100) return {key:'uncommon',label:'UNCOMMON', col:'#3ce594', stars:2};
  return            {key:'common',  label:'COMMON',    col:'#9aa6cf', stars:1};
}
function skFiles(sk){
  const base=['references/overview.md','references/usage.md','references/examples.md',
    'references/frameworks.md','references/advanced.md','references/triggers.md'];
  const n=3+(skHash(sk.name)%4);
  const refs=base.slice(0,n);
  return [...refs, 'evals/evals.json', 'SKILL.md'];
}
function skInvo(sk){
  const calls=sk.calls;
  return {
    total:calls, sessions:Math.max(1,Math.round(calls/12)),
    toolUse:Math.round(calls*0.22), command:Math.round(calls*0.05),
    last:['2d ago','5h ago','1d ago','3d ago','6h ago'][skHash(sk.name)%5],
    firstSeen:'2026-0'+(1+skHash(sk.name)%5)+'-'+String(10+skHash(sk.name)%18).padStart(2,'0'),
    from:sk.users.slice(0,3).map(u=>u.agent.name),
  };
}

/* ---------------- skill detail ---------------- */
function SkillDetail({ name, onBack, onOpenSkill }){
  const [s]=useOffice();
  const [mode,setMode]=useS('rendered');
  const [tab,setTab]=useS('details');
  const [copied,setCopied]=useS(false);
  // annotation state
  const [popup,setPopup]=useS(null);
  const [pending,setPending]=useS('');
  const [note,setNote]=useS('');
  const docRef=useR(null), noteRef=useR(null);

  const idx=buildSkillIndex(s);
  const sk=idx[name];
  if(!sk) return (
    <div className="sk-wrap"><div className="cs-top"><span className="cs-back" onClick={onBack}>← คลังความรู้</span></div>
      <div className="empty" style={{marginTop:40}}>ไม่พบทักษะนี้แล้ว</div></div>
  );
  const c=SK_CLUSTER_BY[sk.cluster]||SK_CLUSTER_BY.ops;
  const fr=skFreq(sk.calls);
  const tier=skTier(sk.calls);
  const related=Object.values(idx).filter(x=>x.cluster===sk.cluster && x.name!==sk.name).sort((a,b)=>b.calls-a.calls);
  const desc=SK_DESC[sk.name] || ('ทักษะในกลุ่ม'+c.name+' ที่ทีมเรียกใช้เป็นประจำ');
  const md=skillMdDoc(sk,c,desc);
  const slug=sk.name.replace(/\s+/g,'-').toLowerCase();
  const path='skills/'+slug+'/SKILL.md';
  const lines=120+(skHash(sk.name)%420);
  const files=skFiles(sk);
  const invo=skInvo(sk);
  const lv=Math.max(1,Math.min(9, Math.floor(sk.calls/80)+1));
  const xpPct=Math.round((sk.calls%80)/80*100);
  const annos=(s.skillAnno&&s.skillAnno[name])||[];

  const patchAnno=fn=>OfficeStore.setState(st=>({...st, skillAnno:{...(st.skillAnno||{}), [name]:fn((st.skillAnno||{})[name]||[])}}),{now:true});
  const onSelect=()=>{
    const selc=window.getSelection();
    if(!selc||selc.isCollapsed||!selc.rangeCount){ setPopup(null); return; }
    const txt=selc.toString().trim();
    const within=docRef.current&&docRef.current.contains(selc.anchorNode)&&docRef.current.contains(selc.focusNode);
    if(!txt||!within){ setPopup(null); return; }
    const r=selc.getRangeAt(0).getBoundingClientRect();
    const wrap=docRef.current.closest('.sk-wrap').getBoundingClientRect();
    setPopup({ quote:txt.length>140?txt.slice(0,140)+'…':txt, x:r.left+r.width/2-wrap.left, y:r.top-wrap.top });
  };
  const startNote=()=>{ setPending(popup.quote); setNote(''); setPopup(null); if(window.getSelection) window.getSelection().removeAllRanges(); setTimeout(()=>noteRef.current&&noteRef.current.focus(),30); };
  const addNote=()=>{ const n=note.trim(); if(!n) return; patchAnno(arr=>[{id:Date.now(),quote:pending,note:n,t:OfficeStore.clock()},...arr]); setPending(''); setNote(''); };
  const delNote=id=>patchAnno(arr=>arr.filter(a=>a.id!==id));
  const copyPath=()=>{ try{navigator.clipboard.writeText('D:/'+path);}catch(e){} setCopied(true); setTimeout(()=>setCopied(false),1200); };

  return (
    <div className="sk-wrap sk-detailpage">
      <div className="cs-top" style={{padding:'14px 0'}}>
        <span className="cs-back" onClick={onBack}>← คลังความรู้</span>
      </div>

      {/* header */}
      <div className="skd-kicker">🔒 PRIVATE · {(s.settings&&s.settings.sysName1||'MY')+' '+(s.settings&&s.settings.sysName2||'OFFICE')} (CENTRAL LIBRARY)</div>
      <div style={{display:'flex',alignItems:'flex-start',gap:18,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:280}}>
          <h1 className="skd-title">{sk.name}</h1>
          <p className="skd-desc">{desc} ทริกเกอร์เมื่อทีมต้องใช้งานในกลุ่ม <strong>{c.name}</strong> — เชื่อมโยงกับอีก {related.length} ทักษะในคลัสเตอร์เดียวกัน</p>
        </div>
        <div className="skd-rarity" style={{'--tc':tier.col}}>
          <div style={{letterSpacing:'2px'}}>{'★'.repeat(tier.stars)}</div>
          <div style={{fontFamily:'var(--pixel)',fontSize:9,marginTop:5}}>{tier.label}</div>
        </div>
      </div>

      {/* meta chips */}
      <div className="skd-meta">
        <span className="skd-chip" style={{color:c.col,borderColor:c.col+'55'}}>{c.glyph} {c.name}</span>
        <span className="skd-chip">{lines} lines</span>
        <span className="skd-chip">{files.length} files</span>
        <span className="skd-chip act" onClick={copyPath}>{copied?'✓ คัดลอกแล้ว':'⧉ Copy path'}</span>
      </div>

      {/* tabs */}
      <div className="skd-tabs">
        {[['details','Details','ⓘ'],['activity','Activity','◷'],['history','History','⎇']].map(([k,l,g])=>(
          <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{g} {l}</button>
        ))}
      </div>

      {tab==='details' && (
      <div className="skd-grid">
        {/* LEFT */}
        <div style={{minWidth:0}}>
          <div className="skd-panel">
            <div className="skd-panel-h">STRUCTURE</div>
            <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
              <span className="skd-folder" style={{color:c.col}}>📁 references/</span>
              <span className="skd-folder" style={{color:'#b06bff'}}>🧪 evals/</span>
            </div>
          </div>
          <div className="skd-panel">
            <div className="skd-panel-h">FILES ({files.length})</div>
            <div style={{display:'flex',flexDirection:'column'}}>
              {files.map(f=>(
                <div key={f} className={'skd-file'+(f==='SKILL.md'?' on':'')}>
                  <span style={{color:f==='SKILL.md'?c.col:'var(--text-mute)'}}>📄</span>
                  <span style={{color:f==='SKILL.md'?'var(--white)':'var(--text-dim)'}}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SKILL.md */}
          <div className="skd-panel" style={{padding:0,overflow:'hidden'}}>
            <div className="skd-mdbar">
              <span style={{fontFamily:'var(--pixel)',fontSize:9,letterSpacing:1,color:'var(--text-dim)'}}>SKILL.MD</span>
              <div className="codex-toggle" style={{marginLeft:6}}>
                <button className={mode==='rendered'?'on':''} onClick={()=>setMode('rendered')}>RENDERED</button>
                <button className={mode==='source'?'on':''} onClick={()=>setMode('source')}>SOURCE</button>
              </div>
              <span style={{flex:1}}></span>
              <span style={{fontFamily:'var(--mono)',fontSize:10.5,color:'var(--text-mute)'}}>D:/{path}</span>
            </div>
            <div style={{padding:'14px 15px'}}>
              {mode==='rendered'
                ? <div className="skd-mdsplit">
                    <div className="cs-codex-frame"><div className="parch" ref={docRef} onMouseUp={onSelect}
                      dangerouslySetInnerHTML={{__html: renderMd(md)}}/></div>
                    <div className="skd-annobox">
                      <div style={{fontFamily:'var(--pixel)',fontSize:8,letterSpacing:1,color:'var(--text-dim)',marginBottom:10}}>ANNOTATIONS — SKILL.MD</div>
                      {pending && (
                        <div style={{border:'1px solid var(--gold)',borderRadius:7,padding:'9px 10px',background:'rgba(255,206,74,.06)',marginBottom:9}}>
                          <div className="cs-anno-quote" style={{marginBottom:7}}>“{pending}”</div>
                          <textarea ref={noteRef} className="fld" rows="2" placeholder="เขียนโน้ต…" value={note}
                            onChange={e=>setNote(e.target.value)} style={{fontSize:12.5,padding:'7px 9px'}}></textarea>
                          <div style={{display:'flex',gap:6,marginTop:7}}>
                            <button className="btn sm green" style={{flex:1}} onClick={addNote}>＋ เพิ่ม</button>
                            <button className="btn sm ghost" onClick={()=>{setPending('');setNote('');}}>ยกเลิก</button>
                          </div>
                        </div>
                      )}
                      {!pending && annos.length===0 && (
                        <div style={{fontFamily:'var(--mono)',fontSize:11.5,color:'var(--text-mute)',lineHeight:1.6}}>
                          ยังไม่มีโน้ต — <span style={{color:'var(--gold)'}}>ไฮไลต์ข้อความ</span>เพื่อจดบันทึก
                        </div>
                      )}
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {annos.map(an=>(
                          <div key={an.id} className="cs-anno-item">
                            <div className="cs-anno-quote">“{an.quote}”</div>
                            <div className="cs-anno-note">{an.note}</div>
                            <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)'}}>{an.t}</span>
                              <span onClick={()=>delNote(an.id)} style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--red)',cursor:'pointer'}}>ลบ</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                : <div className="codex-src">{md}</div>}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="skd-panel">
            <div className="skd-panel-h">⚔ ABILITY STATS</div>
            <div style={{fontFamily:'var(--pixel)',fontSize:30,color:'var(--white)',marginBottom:14}}>Lv {lv}</div>
            <div className="skd-stat"><span>XP</span><div className="skd-bar"><i style={{width:xpPct+'%',background:c.col}}></i></div></div>
            <div className="skd-stat"><span>HP</span><div className="skd-bar"><i style={{width:'100%',background:'linear-gradient(90deg,#ff5d72,#ff8a5c)'}}></i></div></div>
            <div style={{marginTop:14,fontFamily:'var(--pixel2)',fontWeight:700,fontSize:10,color:'var(--text-dim)',letterSpacing:.5}}>RARITY</div>
            <div style={{color:tier.col,fontFamily:'var(--mono)',fontSize:14,marginTop:5}}>{'★'.repeat(tier.stars)} {tier.label}</div>
          </div>

          <div className="skd-panel">
            <div className="skd-panel-h">👥 EQUIPPED BY</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {sk.users.map(u=>(
                <div key={u.agent.id} className="skd-equip" onClick={()=>OfficeStore.setState({route:'team',openAgent:u.agent.isCeo?'__ceo':u.agent.id})}>
                  <div style={{width:28,height:28,borderRadius:7,position:'relative',overflow:'hidden',flex:'none',background:'#0a0e1c',boxShadow:'0 0 0 1.5px '+u.agent.color}}>
                    <image-slot id={(u.agent.isCeo?'player-avatar':'card-'+u.agent.id)} shape="rounded" radius="7" placeholder={u.agent.name[0]}
                      style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',
                      fontFamily:'var(--pixel)',fontSize:10,color:u.agent.color}} className="slot-letter">{u.agent.name[0]}</div>
                  </div>
                  <span style={{flex:1,fontSize:13,color:'var(--white)'}}>{u.agent.name}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:11.5,color:c.col}}>{u.calls.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="skd-panel">
            <div className="skd-panel-h" style={{display:'flex',justifyContent:'space-between'}}><span>⚡ INVOCATIONS</span><span style={{color:'var(--text-mute)'}}>{invo.last}</span></div>
            <div style={{fontFamily:'var(--pixel)',fontSize:28,color:c.col,textShadow:'0 0 14px '+c.col+'55'}}>{invo.total.toLocaleString()}</div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:4,marginBottom:13}}>across {invo.sessions} sessions · last invoked {invo.last}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9,marginBottom:13}}>
              <div className="skd-mini"><div className="skd-mini-l">TOOL USE</div><div className="skd-mini-v">{invo.toolUse}</div></div>
              <div className="skd-mini"><div className="skd-mini-l">/COMMAND</div><div className="skd-mini-v">{invo.command}</div></div>
            </div>
            <div style={{fontFamily:'var(--pixel)',fontSize:8,letterSpacing:1,color:'var(--text-dim)',marginBottom:8}}>INVOKED FROM</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {invo.from.map(n=><span key={n} className="skd-chip" style={{fontSize:11}}>{n}</span>)}
              <span className="skd-chip" style={{fontSize:11}}>subagents</span>
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:10.5,color:'var(--text-mute)',marginTop:11}}>first seen {invo.firstSeen}</div>
          </div>

          <div className="skd-panel">
            <div className="skd-panel-h">ⓘ CURATION</div>
            <div style={{fontFamily:'var(--pixel)',fontSize:8,letterSpacing:1,color:c.col,marginBottom:6}}>SCOPE_NOTE</div>
            <div style={{fontSize:13,color:'var(--text)',lineHeight:1.6,marginBottom:13}}>ใช้เมื่อทีมต้องการ{desc}</div>
            <div style={{fontFamily:'var(--pixel)',fontSize:8,letterSpacing:1,color:'var(--red)',marginBottom:6}}>OUT_OF_SCOPE</div>
            <div style={{fontSize:13,color:'var(--text-dim)',lineHeight:1.6}}>งานนอกกลุ่ม {c.name} — ใช้ทักษะอื่นที่เหมาะกว่าในคอนสเตลเลชัน</div>
          </div>

          <div className="skd-panel">
            <div className="skd-panel-h">◆ ทักษะที่เกี่ยวข้อง</div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {related.slice(0,6).map(r=>(
                <div key={r.name} className="sk-related" style={{'--sc':c.col,padding:'9px 11px'}} onClick={()=>onOpenSkill(r.name)}>
                  <span style={{width:7,height:7,borderRadius:'50%',background:c.col,boxShadow:'0 0 6px '+c.col,flex:'none'}}></span>
                  <span style={{flex:1,fontSize:13,color:'var(--white)'}}>{r.name}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:11,color:c.col}}>{r.calls.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {tab==='activity' && (
        <div className="skd-panel" style={{maxWidth:680}}>
          <div className="skd-panel-h">◷ ACTIVITY · การเรียกใช้ล่าสุด</div>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {sk.users.flatMap((u,ui)=>[0,1].map(j=>({u,j,k:ui*2+j})).filter(x=>x.k<8)).map(({u,j,k})=>(
              <div key={k} className="skd-actrow">
                <span className="sk-leg-dot" style={{background:u.agent.color,boxShadow:'0 0 6px '+u.agent.color}}></span>
                <span style={{flex:1,fontSize:13,color:'var(--text)'}}>เรียกใช้โดย <strong style={{color:'var(--white)'}}>{u.agent.name}</strong></span>
                <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{['2h','5h','1d','2d','3d','4d','6d','1w'][k]} ago</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='history' && (
        <div className="skd-panel" style={{maxWidth:680}}>
          <div className="skd-panel-h">⎇ HISTORY · ประวัติการแก้ไข</div>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {[['สร้างสกิล + โครงสร้างไฟล์',invo.firstSeen],['เพิ่ม references/ + ตัวอย่าง','2026-04-02'],
              ['ปรับ triggers + scope note','2026-04-18'],['อัปเดต SKILL.md ล่าสุด','2026-05-08']].map(([t,d],i)=>(
              <div key={i} className="skd-actrow">
                <span style={{fontFamily:'var(--mono)',fontSize:12,color:c.col,width:84,flex:'none'}}>{d}</span>
                <span style={{flex:1,fontSize:13,color:'var(--text)'}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {popup && (
        <button className="cs-annobtn" style={{left:popup.x,top:popup.y}}
          onMouseDown={e=>{e.preventDefault();e.stopPropagation();startNote();}}>✎ จดโน้ต</button>
      )}
    </div>
  );
}

/* ---------------- synced .md viewer ---------------- */
function SyncedDoc({ doc, onBack }){
  const [mode,setMode]=useS('rendered');
  const [active,setActive]=useS(0);
  const files = doc.files || [{path:'SKILL.md', main:true, md:doc.md}];
  const cur = files[active] || files[0];
  const cl = SK_CLUSTER_BY[doc.cluster]||SK_CLUSTER_BY.ops;
  const isJson = cur.json || /\.json$/i.test(cur.path);
  const hasFolders = files.some(f=>f.path.includes('/'));
  const folders = [...new Set(files.filter(f=>f.path.includes('/')).map(f=>f.path.split('/')[0]))];
  const folderIcon = { references:'📁', evals:'🧪' };

  return (
    <div className="sk-wrap">
      <div className="cs-top">
        <span className="cs-back" onClick={onBack}>← คลังความรู้</span>
        <span style={{flex:1}}></span>
        <span className="chip" style={{color:cl.col,borderColor:cl.col+'66'}}>{cl.glyph} {cl.name}</span>
        {!isJson && <div className="codex-toggle" style={{marginLeft:8}}>
          <button className={mode==='rendered'?'on':''} onClick={()=>setMode('rendered')}>RENDERED</button>
          <button className={mode==='source'?'on':''} onClick={()=>setMode('source')}>SOURCE</button>
        </div>}
      </div>

      {/* title */}
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:1,color:'var(--gold)',marginBottom:5}}>SYNCED · claude-master/skills</div>
        <h1 style={{fontFamily:'var(--pixel)',fontSize:24,color:'var(--white)',margin:0,letterSpacing:.3}}>{doc.name}</h1>
        {doc.desc && <p style={{fontSize:14,color:'var(--text)',lineHeight:1.6,margin:'10px 0 0',maxWidth:640}}>{doc.desc}</p>}
      </div>

      <div className="syd-grid">
        {/* main viewer */}
        <div style={{minWidth:0}}>
          <div style={{fontFamily:'var(--mono)',fontSize:12,color:cl.col,marginBottom:10}}>
            📄 skills/{doc.catId||doc.id}/{cur.path}{cur.main?'  · ไฟล์หลัก':''}</div>
          {isJson
            ? <div className="codex-src">{cur.md}</div>
            : (mode==='rendered'
                ? <div className="cs-codex-frame"><div className="parch" dangerouslySetInnerHTML={{__html: renderMd(cur.md||'')}}/></div>
                : <div className="codex-src">{cur.md||''}</div>)}
        </div>

        {/* sidebar: structure + files */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {hasFolders && (
            <div className="skd-panel">
              <div className="skd-panel-h">STRUCTURE</div>
              <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
                {folders.map(fd=>(
                  <span key={fd} className="skd-folder" style={{color:fd==='evals'?'#b06bff':cl.col}}>{folderIcon[fd]||'📁'} {fd}/</span>
                ))}
              </div>
            </div>
          )}
          <div className="skd-panel">
            <div className="skd-panel-h">FILES ({files.length})</div>
            <div style={{display:'flex',flexDirection:'column'}}>
              {files.map((f,i)=>(
                <div key={f.path} className={'skd-file'+(i===active?' on':'')} style={{cursor:'pointer'}} onClick={()=>setActive(i)}>
                  <span style={{color:i===active?cl.col:'var(--text-mute)'}}>{f.json||/\.json$/i.test(f.path)?'⚙':'📄'}</span>
                  <span style={{color:i===active?'var(--white)':'var(--text-dim)'}}>{f.path}</span>
                  {f.main && <span style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:9.5,color:cl.col}}>MAIN</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- node shape generators ---------- */
function skStar(cx,cy,R,points,inner){
  const n=points*2, ir=R*(inner||0.42); let d='';
  for(let i=0;i<n;i++){ const ang=i*Math.PI/points - Math.PI/2; const rad=i%2===0?R:ir;
    d+=(i?'L':'M')+(cx+Math.cos(ang)*rad).toFixed(1)+','+(cy+Math.sin(ang)*rad).toFixed(1); }
  return d+'Z';
}
function skPoly(cx,cy,R,sides,rot){
  let d=''; for(let i=0;i<sides;i++){ const ang=i*2*Math.PI/sides - Math.PI/2 + (rot||0);
    d+=(i?'L':'M')+(cx+Math.cos(ang)*R).toFixed(1)+','+(cy+Math.sin(ang)*R).toFixed(1); }
  return d+'Z';
}
/* render a tier-styled node glyph */
function SkNodeGlyph({ x, y, r, col, tier, sel }){
  const glow={filter:'drop-shadow(0 0 '+(sel?10:5)+'px '+col+')'};
  const stroke=sel?'#fff':'none', sw=sel?1.4:0;
  if(tier==='legend'){
    return <g style={glow}>
      <path d={skStar(x,y,r+3,4,0.34)} fill={col} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <circle cx={x} cy={y} r={r*0.42} fill="#fff" opacity="0.95"/>
    </g>;
  }
  if(tier==='epic'){
    return <g style={glow}>
      <path d={skPoly(x,y,r+1.5,4)} fill={col} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <circle cx={x} cy={y} r={r*0.32} fill="#fff" opacity="0.8"/>
    </g>;
  }
  if(tier==='rare'){
    return <g style={glow}>
      <path d={skPoly(x,y,r+1,6,Math.PI/6)} fill={col} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
    </g>;
  }
  if(tier==='uncommon'){
    return <g style={glow}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={col} strokeWidth={2}/>
      <circle cx={x} cy={y} r={r*0.42} fill={col}/>
      {sel && <circle cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeWidth="1"/>}
    </g>;
  }
  // common — small dot
  return <circle cx={x} cy={y} r={Math.max(2.6,r*0.7)} fill={col} stroke={stroke} strokeWidth={sw} style={glow}/>;
}

/* ---------------- constellation layout ---------------- */
const SK_ANCHOR = {
  coord:   {x:0.30,y:0.28}, finance:{x:0.72,y:0.30}, eng:{x:0.20,y:0.60},
  design:  {x:0.49,y:0.18}, content:{x:0.80,y:0.60}, research:{x:0.45,y:0.74}, ops:{x:0.63,y:0.82},
};
function computeGraph(s, idx, seed){
  const W=1000,H=640;
  const cfg = s.settings || {};
  const ceo = {
    ...(s.ceo || {}),
    isCeo: true,
    id: '__ceo',
    name: (cfg.ownerName || '').trim() || 'YOU',
    color: (s.ceo && s.ceo.color) || '#ff5168',
    skills: (s.ceo && s.ceo.skills) || ['วางแผนงาน', 'ตัดสินใจ', 'อนุมัติงบ', 'สั่งงานเลขา']
  };
  const roster = [ceo, ...(s.agents||[])].filter(a=>a&&a.name);
  const skills=Object.values(idx);
  const byCl={}; skills.forEach(k=>{ (byCl[k.cluster]=byCl[k.cluster]||[]).push(k); });
  const pos={}, cen={};
  Object.entries(byCl).forEach(([cid,list])=>{
    const an=SK_ANCHOR[cid]||{x:0.5,y:0.5}; const cx=an.x*W, cy=an.y*H; cen[cid]={x:cx,y:cy,n:list.length};
    list.sort((a,b)=>b.calls-a.calls);
    list.forEach((k,i)=>{
      if(i===0){ pos[k.name]={x:cx,y:cy}; return; }
      const jitter=(skHash(k.name+seed)%1000)/1000;
      const r=30+i*15+jitter*14;
      const ang=i*2.39996+ (skHash(k.name)%100)/100*0.6 + seed*0.7;
      pos[k.name]={ x:Math.max(40,Math.min(W-40, cx+Math.cos(ang)*r)), y:Math.max(34,Math.min(H-30, cy+Math.sin(ang)*r)) };
    });
  });
  const links=[]; const adj={};
  const addAdj=(a,b)=>{ (adj[a]=adj[a]||new Set()).add(b); (adj[b]=adj[b]||new Set()).add(a); };
  // within-cluster: star to hub
  Object.values(byCl).forEach(list=>{ const hub=list[0]; for(let i=1;i<list.length;i++){ links.push({a:hub.name,b:list[i].name,kind:'cluster'}); addAdj(hub.name,list[i].name);} });
  // agent chains (cross-cluster web)
  roster.forEach(a=>{ const sk=(a.skills||[]).filter(n=>idx[n]); for(let i=0;i<sk.length-1;i++){ if(sk[i]!==sk[i+1]){ links.push({a:sk[i],b:sk[i+1],kind:'agent'}); addAdj(sk[i],sk[i+1]); } } });
  return { pos, links, adj, cen, W, H };
}
const SK_WIN = { '7D':0.06,'1M':0.2,'1Q':0.45,'1Y':0.8,'ALL':1 };

/* ---------------- skills (constellation) ---------------- */
function Skills(){
  const [s]=useOffice();
  const [open,setOpen]=useS(null);       // skill detail name
  const [openDoc,setOpenDoc]=useS(null);
  const [sel,setSel]=useS(null);         // selected node (highlight + card)
  const [hover,setHover]=useS(null);     // hovered node
  const [query,setQuery]=useS('');
  const [win,setWin]=useS('ALL');
  const [seed,setSeed]=useS(0);
  const [showSync,setShowSync]=useS(false);
  const [showPicker,setShowPicker]=useS(false);
  const [view,setView]=useS({k:1,x:0,y:0});
  const svgRef=useR(null);
  const dragRef=useR(null);

  // wheel zoom (centered on cursor) + drag pan
  const svgPt=(ev)=>{ const r=svgRef.current.getBoundingClientRect(); const gW=1000,gH=640;
    const scale=Math.min(r.width/gW, r.height/gH); const offX=(r.width-gW*scale)/2, offY=(r.height-gH*scale)/2;
    return { x:(ev.clientX-r.left-offX)/scale, y:(ev.clientY-r.top-offY)/scale }; };
  const onWheel=(e)=>{ e.preventDefault(); const p=svgPt(e);
    setView(v=>{ const nk=Math.max(0.5,Math.min(4, v.k*(e.deltaY<0?1.12:0.89)));
      const wx=(p.x - v.x)/v.k, wy=(p.y - v.y)/v.k;
      return { k:nk, x:p.x-wx*nk, y:p.y-wy*nk }; }); };
  const onDown=(e)=>{ if(e.target.closest('.sk-node')) return; dragRef.current={sx:e.clientX,sy:e.clientY,vx:view.x,vy:view.y,moved:false}; };
  const onMove=(e)=>{ const d=dragRef.current; if(!d) return; const dx=e.clientX-d.sx, dy=e.clientY-d.sy;
    if(Math.abs(dx)+Math.abs(dy)>3) d.moved=true;
    const r=svgRef.current.getBoundingClientRect(); const scale=Math.min(r.width/1000,r.height/640);
    setView(v=>({...v, x:d.vx+dx/scale, y:d.vy+dy/scale})); };
  const onUp=()=>{ dragRef.current=null; };
  const zoomBy=(f)=>setView(v=>{ const nk=Math.max(0.5,Math.min(4,v.k*f)); const cx=500,cy=320;
    const wx=(cx-v.x)/v.k, wy=(cy-v.y)/v.k; return {k:nk,x:cx-wx*nk,y:cy-wy*nk}; });
  const resetView=()=>setView({k:1,x:0,y:0});

  const idx=buildSkillIndex(s);
  const allSkills=Object.values(idx);
  const synced=s.syncedSkills||[];
  const meta=(s.syncMeta&&s.syncMeta.skills)||null;
  const g=React.useMemo(()=>computeGraph(s,idx,seed),[s.agents,s.ceo,seed]);
  const wf=SK_WIN[win];
  const wc=k=>Math.max(1,Math.round(idx[k].calls*wf));
  const maxW=allSkills.length ? Math.max(...allSkills.map(x=>wc(x.name))) : 1;
  const minW=allSkills.length ? Math.min(...allSkills.map(x=>wc(x.name))) : 1;
  const usedClusters=new Set(allSkills.map(x=>x.cluster));
  const top=[...allSkills].sort((a,b)=>b.calls-a.calls).slice(0,12);

  const onImportSkills=(items)=>{
    const recs=items.map(syncedFromCatalog);
    OfficeStore.setState(st=>{
      const have=new Set((st.syncedSkills||[]).map(x=>x.name.toLowerCase()));
      const merged=[...(st.syncedSkills||[]), ...recs.filter(r=>!have.has(r.name.toLowerCase()))];
      return {...st, syncedSkills:merged,
        syncMeta:{...(st.syncMeta||{}), skills:{ folder:SYNC_PATHS.skills, count:merged.length, t:OfficeStore.clock() }}};
    },{now:true});
    setShowSync(true);
  };
  const clearSync=()=>OfficeStore.setState(st=>({...st, syncedSkills:[], syncMeta:{...(st.syncMeta||{}),skills:null}}),{now:true});

  if(open) return <SkillDetail name={open} onBack={()=>setOpen(null)} onOpenSkill={setOpen}/>;
  if(openDoc){ const d=synced.find(x=>x.id===openDoc); if(d) return <SyncedDoc doc={d} onBack={()=>setOpenDoc(null)}/>; }

  const q=query.trim().toLowerCase();
  const selSk = sel ? idx[sel] : null;
  const selC = selSk ? (SK_CLUSTER_BY[selSk.cluster]||SK_CLUSTER_BY.ops) : null;
  const neigh = sel ? (g.adj[sel]||new Set()) : null;
  const hoverNeigh = hover ? (g.adj[hover]||new Set()) : null;
  const focus = sel || hover;
  const focusC = sel ? selC : (hover ? (SK_CLUSTER_BY[idx[hover].cluster]||SK_CLUSTER_BY.ops) : null);
  const isActive = name => !sel || name===sel || (neigh&&neigh.has(name));
  const isQ = name => !q || name.toLowerCase().includes(q);

  return (
    <div className="sk-cons">

      {/* graph */}
      <svg ref={svgRef} className="sk-svg" viewBox={'0 0 '+g.W+' '+g.H} preserveAspectRatio="xMidYMid meet"
        onClick={()=>{ if(!(dragRef.current&&dragRef.current.moved)) setSel(null); }}
        onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
        style={{cursor:dragRef.current?'grabbing':'grab',touchAction:'none'}}>
        <defs>
          <radialGradient id="skvig" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#16243f" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#070b16" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={g.W} height={g.H} fill="url(#skvig)"/>

        <g transform={'translate('+view.x+','+view.y+') scale('+view.k+')'}>
        {/* region labels */}
        {Object.entries(g.cen).map(([cid,c])=>{
          const cl=SK_CLUSTER_BY[cid]; if(!cl) return null;
          return <text key={cid} x={c.x} y={c.y-46} textAnchor="middle" className="sk-region"
            style={{fill:cl.col,opacity: sel?0.12:0.22}}>{cl.en}</text>;
        })}

        {/* links */}
        {g.links.map((l,i)=>{
          const pa=g.pos[l.a], pb=g.pos[l.b]; if(!pa||!pb) return null;
          const on = focus && (l.a===focus||l.b===focus);
          const dim = sel && !on;
          const col = l.kind==='agent' ? '#5f6f9c' : '#3a6bff';
          return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
            stroke={on?(focusC?focusC.col:col):col}
            strokeWidth={(on?1.4:0.6)/view.k} strokeOpacity={dim?0.05:(on?0.85:0.16)}
            strokeDasharray={on?(4/view.k)+' '+(4/view.k):'none'} className={on?'sk-link-on':''}/>;
        })}

        {/* nodes */}
        {allSkills.map(k=>{
          const p=g.pos[k.name]; if(!p) return null;
          const cl=SK_CLUSTER_BY[k.cluster]||SK_CLUSTER_BY.ops;
          const norm=maxW>minW ? (wc(k.name)-minW)/(maxW-minW) : 0.5;
          const r=4.5+Math.pow(norm,0.62)*19;
          const active=isActive(k.name)&&isQ(k.name);
          const isSel=k.name===sel;
          const isHov=k.name===hover;
          const showLabel = isSel || isHov || (sel&&neigh&&neigh.has(k.name)) || (hover&&hoverNeigh&&hoverNeigh.has(k.name)) || (!sel && (r>11 || (q&&isQ(k.name)) || view.k>1.5));
          return (
            <g key={k.name} className="sk-node" style={{cursor:'pointer',opacity:active?1:(isHov?0.85:0.18),transition:'opacity .15s'}}
              onClick={e=>{ e.stopPropagation(); if(dragRef.current&&dragRef.current.moved) return; setSel(k.name===sel?null:k.name); }}
              onPointerEnter={()=>setHover(k.name)} onPointerLeave={()=>setHover(h=>h===k.name?null:h)}>
              {(isSel||isHov||r>11) && <circle cx={p.x} cy={p.y} r={r+(isHov&&!isSel?11:8)} fill={cl.col} opacity={isSel?0.2:(isHov?0.16:0.08)} style={{transition:'r .15s,opacity .15s'}}/>}
              {isHov && !isSel && <circle cx={p.x} cy={p.y} r={r+4} fill="none" stroke={cl.col} strokeWidth={1.4/view.k} strokeOpacity="0.8"/>}
              <SkNodeGlyph x={p.x} y={p.y} r={isHov&&!isSel?r+1.5:r} col={cl.col} tier={skTier(k.calls).key} sel={isSel}/>
              {showLabel && <text x={p.x} y={p.y+r+13} textAnchor="middle" className="sk-nlabel"
                style={{fill:(isSel||isHov)?'#fff':'#c2cad9',opacity:(isSel||isHov)?1:0.7,fontSize:(8.5/Math.max(1,view.k*0.7))+'px'}}>{k.name}</text>}
              {isHov && !isSel && <text x={p.x} y={p.y-r-7} textAnchor="middle" className="sk-nlabel"
                style={{fill:cl.col,opacity:0.95,fontSize:(8/Math.max(1,view.k*0.7))+'px'}}>⚡{wc(k.name).toLocaleString()}</text>}
            </g>
          );
        })}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="sk-ov sk-zoom">
        <button onClick={()=>zoomBy(1.25)} title="ซูมเข้า">＋</button>
        <button onClick={()=>zoomBy(0.8)} title="ซูมออก">－</button>
        <button onClick={resetView} title="รีเซ็ต" style={{fontSize:11}}>⟲</button>
      </div>

      {/* top-left title */}
      <div className="sk-ov sk-ov-tl">
        <div className="sk-title">คลังความรู้</div>
        <div className="sk-sub">{allSkills.length} ทักษะ · {usedClusters.size} คลัสเตอร์ · ลาก/สกอลล์เพื่อสำรวจ</div>
      </div>

      {/* top-right controls */}
      <div className="sk-ov sk-ov-tr">
        <button className="sk-recompute" onClick={()=>{setSeed(x=>x+1);setSel(null);}}>✦ จัดกลุ่มใหม่</button>
        <div className="sk-winseg">
          {Object.keys(SK_WIN).map(w=>(
            <button key={w} className={win===w?'on':''} onClick={()=>setWin(w)}>{w}</button>
          ))}
        </div>
      </div>

      {/* search + sync row */}
      <div className="sk-ov sk-ov-search">
        <input className="fld" placeholder="ค้นหาโหนด…" value={query} onChange={e=>setQuery(e.target.value)}
          style={{width:150,padding:'7px 11px',fontSize:13}}/>
        <button className="btn gold sm" onClick={()=>setShowPicker(true)}>⟳ Sync</button>
        {synced.length>0 && <button className="btn ghost sm" onClick={()=>setShowSync(v=>!v)}>📄 {synced.length}</button>}
      </div>

      {/* legend (regions + links) */}
      <div className="sk-ov sk-ov-legend">
        <div className="sk-leg-h">คลัสเตอร์ · REGIONS</div>
        {SK_CLUSTERS.filter(c=>usedClusters.has(c.id)).map(c=>(
          <div key={c.id} className="sk-leg-row" onClick={()=>{ const f=allSkills.find(x=>x.cluster===c.id); if(f) setSel(f.name); }}>
            <span className="sk-leg-dot" style={{background:c.col,boxShadow:'0 0 7px '+c.col}}></span>
            <span style={{flex:1}}>{c.name}</span>
          </div>
        ))}
        <div className="sk-leg-h" style={{marginTop:12}}>LINKS</div>
        <div className="sk-leg-row"><span className="sk-leg-line" style={{background:'#3a6bff'}}></span><span>คลัสเตอร์</span></div>
        <div className="sk-leg-row"><span className="sk-leg-line" style={{background:'#5f6f9c'}}></span><span>ใช้ร่วมกัน (agent)</span></div>
        <div className="sk-leg-h" style={{marginTop:12}}>รูปทรง · TIER</div>
        <svg width="176" height="26" style={{display:'block',marginBottom:4}}>
          <g><path d={skStar(13,13,7,4,0.34)} fill="#ffce4a"/><text x="25" y="17" className="sk-leg-tg">LEGEND</text></g>
          <g><path d={skPoly(78,13,6,4)} fill="#b06bff"/><text x="89" y="17" className="sk-leg-tg">EPIC</text></g>
          <g><path d={skPoly(133,13,6,6,Math.PI/6)} fill="#4db4ff"/><text x="144" y="17" className="sk-leg-tg">RARE</text></g>
        </svg>
        <div className="sk-leg-note">ขนาด + แสง = จำนวนการเรียก</div>
      </div>

      {/* top skills */}
      <div className="sk-ov sk-ov-top">
        <div className="sk-top-h"><span>TOP SKILLS</span><span style={{color:'var(--text-mute)'}}>{win}</span></div>
        {top.map((k,i)=>{
          const cl=SK_CLUSTER_BY[k.cluster]||SK_CLUSTER_BY.ops;
          return (
            <div key={k.name} className={'sk-top-row'+(k.name===sel?' on':'')} onClick={()=>setSel(k.name)}>
              <span style={{width:16,fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{i+1}</span>
              <span className="sk-leg-dot" style={{background:cl.col,boxShadow:'0 0 6px '+cl.col}}></span>
              <span style={{flex:1,fontSize:12.5,color:'var(--white)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{k.name}</span>
              <span style={{fontFamily:'var(--mono)',fontSize:12,color:cl.col}}>{wc(k.name).toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* node card */}
      {selSk && (
        <div className="sk-ov sk-nodecard" style={{'--sc':selC.col}}>
          <div style={{fontFamily:'var(--mono)',fontSize:10.5,letterSpacing:1,color:selC.col,marginBottom:4}}>{selC.en}</div>
          <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:18,color:'var(--white)',marginBottom:9}}>{selSk.name}</div>
          <div style={{display:'flex',gap:14,marginBottom:11,fontFamily:'var(--mono)',fontSize:12}}>
            <span style={{color:selC.col}}>⚡ {wc(selSk.name).toLocaleString()} เรียก</span>
            <span style={{color:'var(--text-dim)'}}>👥 {selSk.users.length} คน</span>
          </div>
          <div style={{fontSize:13,color:'var(--text)',lineHeight:1.6,marginBottom:10}}>
            {SK_DESC[selSk.name] || ('ทักษะในกลุ่ม'+selC.name)}
          </div>
          <div style={{marginBottom:13}}>
            <div style={{fontFamily:'var(--mono)',fontSize:10.5,color:'var(--text-mute)',marginBottom:6}}>เชื่อมกับ {(neigh?neigh.size:0)} ทักษะ</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {[...(neigh||[])].slice(0,6).map(n=>(
                <span key={n} className="chip" style={{fontSize:11,cursor:'pointer'}} onClick={()=>setSel(n)}>{n}</span>
              ))}
            </div>
          </div>
          <button className="sk-opencard" style={{'--sc':selC.col}} onClick={()=>setOpen(selSk.name)}>เปิดการ์ดทักษะ →</button>
        </div>
      )}

      {/* synced docs panel */}
      {showSync && synced.length>0 && (
        <div className="sk-ov sk-syncpanel">
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:12,color:'var(--gold)',flex:1}}>📄 ซิงค์จากโฟลเดอร์</span>
            <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)'}}>{meta?meta.folder:''}</span>
            <i onClick={clearSync} style={{cursor:'pointer',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:13}} title="ล้าง">×</i>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:220,overflow:'auto'}}>
            {synced.map(d=>(
              <div key={d.id} className="sk-syncitem" onClick={()=>setOpenDoc(d.id)}>
                <span style={{flex:1,fontSize:12.5,color:'var(--white)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.name}</span>
                <span style={{color:'var(--gold)',fontSize:12}}>→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPicker && <SyncPicker kind="skills" existing={new Set((synced||[]).map(x=>x.name.toLowerCase()))}
        onClose={()=>setShowPicker(false)} onImport={onImportSkills}/>}
    </div>
  );
}

export default Skills;
