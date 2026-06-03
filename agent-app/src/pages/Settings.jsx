import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store/store.js';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ SETTINGS ============ */
const ACCENTS = [
  ['cyan',  '#46b6ff', 'ฟ้า'],
  ['teal',  '#2fe0c2', 'เขียวน้ำทะเล'],
  ['violet','#9d6bff', 'ม่วง'],
  ['gold',  '#ffce4a', 'ทอง'],
  ['rose',  '#ff6b9d', 'ชมพู'],
];

function Settings(){
  const [s,set]=useOffice();
  const cfg=s.settings||{};
  const upd=patch=>OfficeStore.setState(st=>({...st,settings:{...st.settings,...patch}}),{now:true});
  const F=(key,val)=>upd({[key]:val});

  const filled = ['ownerName','ownerRole','email','bio'].filter(k=>(cfg[k]||'').trim()).length;
  const pct = Math.round(filled/4*100);

  const reset=()=>{ if(confirm('คืนค่าตั้งต้นทั้งหมด? (ชื่อระบบ โลโก้ และประวัติจะถูกล้าง)')){
    OfficeStore.setState(st=>({...st,settings:{...window.SEED.settings}}),{now:true});
    window.electronAPI?.saveLog('warning', 'System reset to default settings');
  }};

  return (
    <div style={{maxWidth:1040,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="SETTINGS" sub="ตั้งค่าตัวตนของระบบ และกรอกประวัติของคุณ — ข้อมูลนี้ใช้สร้าง Resume / CV ต่อได้"
        right={<button className="btn ghost" onClick={reset}>คืนค่าตั้งต้น</button>}/>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>

        {/* ---------- SYSTEM IDENTITY ---------- */}
        <Win title="SYSTEM IDENTITY" bodyStyle={{padding:18}}>
          <SecTitle>ตัวตนของระบบ</SecTitle>

          <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:16}}>
            <div style={{flex:'none'}}>
              <label className="lbl">โลโก้</label>
              <div style={{width:88,height:88,borderRadius:12,position:'relative',overflow:'hidden',
                border:'1px solid #2f456e',background:'linear-gradient(135deg,#2f4ea8,#6a4cb8)'}}>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
                  pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:30,color:'#fff'}}>
                  {(cfg.sysName1||'M').trim()[0]||'M'}</div>
                <image-slot id="sys-logo" shape="rounded" radius="12"
                  style={{position:'absolute',inset:0,width:'88px',height:'88px'}}></image-slot>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6,textAlign:'center',width:88}}>ลากรูปมาวาง</div>
            </div>

            <div style={{flex:1}}>
              <label className="lbl">ชื่อระบบ</label>
              <div style={{display:'flex',gap:8}}>
                <input className="fld" value={cfg.sysName1||''} maxLength={10}
                  onChange={e=>F('sysName1',e.target.value)} placeholder="MY" style={{textTransform:'uppercase'}}/>
                <input className="fld" value={cfg.sysName2||''} maxLength={12}
                  onChange={e=>F('sysName2',e.target.value)} placeholder="OFFICE" style={{textTransform:'uppercase'}}/>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:5}}>2 บรรทัด — โชว์มุมซ้ายบน</div>
              <label className="lbl" style={{marginTop:13}}>คำโปรย (Tagline)</label>
              <input className="fld" value={cfg.tagline||''} onChange={e=>F('tagline',e.target.value)}
                placeholder="ระบบจัดการชีวิตของฉัน"/>
            </div>
          </div>

          <label className="lbl">สีหลักของระบบ (Accent)</label>
          <div style={{display:'flex',gap:9,marginTop:4}}>
            {ACCENTS.map(([id,hex,th])=>(
              <button key={id} onClick={()=>F('accent',id)} title={th}
                style={{width:38,height:38,borderRadius:9,cursor:'pointer',background:hex,
                  border:cfg.accent===id?'2px solid #fff':'2px solid transparent',
                  boxShadow:cfg.accent===id?'0 0 0 2px '+hex:'0 2px 6px rgba(0,0,0,.4)',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'#0b0e16',fontWeight:900}}>
                {cfg.accent===id?'✓':''}</button>
            ))}
          </div>
        </Win>

        {/* ---------- OWNER PROFILE ---------- */}
        <Win title="MY PROFILE · CV DATA" accent="gold" bodyStyle={{padding:18}}
          right={<span className="tag" style={{padding:'4px 8px'}}>{pct}% พร้อม</span>}>
          <SecTitle>ประวัติของฉัน</SecTitle>

          <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:14}}>
            <div style={{flex:'none'}}>
              <label className="lbl">รูปโปรไฟล์</label>
              <div style={{width:72,height:72,borderRadius:12,position:'relative',overflow:'hidden',border:'1px solid var(--line)'}}>
                <image-slot id="player-avatar" shape="rounded" radius="12" placeholder="YOU"
                  style={{position:'absolute',inset:0,width:'72px',height:'72px'}}></image-slot>
              </div>
            </div>
            <div style={{flex:1}}>
              <label className="lbl">ชื่อ-นามสกุล</label>
              <input className="fld" value={cfg.ownerName||''} onChange={e=>F('ownerName',e.target.value)} placeholder="ชื่อของคุณ"/>
              <label className="lbl" style={{marginTop:11}}>ตำแหน่ง / บทบาท</label>
              <input className="fld" value={cfg.ownerRole||''} onChange={e=>F('ownerRole',e.target.value)} placeholder="เช่น Founder / Developer"/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label className="lbl">อีเมล</label>
              <input className="fld" value={cfg.email||''} onChange={e=>F('email',e.target.value)} placeholder="you@email.com"/>
            </div>
            <div>
              <label className="lbl">เบอร์โทร</label>
              <input className="fld" value={cfg.phone||''} onChange={e=>F('phone',e.target.value)} placeholder="08x-xxx-xxxx"/>
            </div>
            <div>
              <label className="lbl">ที่อยู่ / เมือง</label>
              <input className="fld" value={cfg.location||''} onChange={e=>F('location',e.target.value)} placeholder="Bangkok, Thailand"/>
            </div>
            <div>
              <label className="lbl">เว็บไซต์ / พอร์ต</label>
              <input className="fld" value={cfg.website||''} onChange={e=>F('website',e.target.value)} placeholder="myportfolio.com"/>
            </div>
          </div>

          <label className="lbl" style={{marginTop:13}}>เกี่ยวกับฉัน (Bio)</label>
          <textarea className="fld" rows="4" value={cfg.bio||''} onChange={e=>F('bio',e.target.value)}
            placeholder="เล่าสั้นๆ ว่าคุณคือใคร ถนัดอะไร เป้าหมายคืออะไร... ข้อความนี้จะใช้เป็นหัว Resume"/>
        </Win>
      </div>

      {/* ---------- CV PREVIEW ---------- */}
      <Win title="RESUME PREVIEW" style={{marginTop:16}} bodyStyle={{padding:0}}
        right={<span className="tag" style={{padding:'4px 8px'}}>auto จากข้อมูล + โปรเจกต์</span>}>
        <CVPreview cfg={cfg} projects={s.projects}/>
      </Win>

      <div style={{textAlign:'center',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:11,margin:'16px 0 8px'}}>
        ทุกการแก้ไขถูกบันทึกอัตโนมัติ · เก็บไว้ในเครื่องนี้
      </div>
    </div>
  );
}

function SecTitle({ children }){
  return <div style={{fontFamily:'var(--pixel2)',fontSize:11,letterSpacing:.5,color:'var(--text-dim)',
    textTransform:'uppercase',marginBottom:14,paddingBottom:9,borderBottom:'1px solid var(--line)'}}>{children}</div>;
}

function CVPreview({ cfg, projects }){
  const name=(cfg.ownerName||'').trim()||'— ยังไม่ได้กรอกชื่อ —';
  const contacts=[cfg.email,cfg.phone,cfg.location,cfg.website].filter(x=>(x||'').trim());
  const skills=[...new Set(projects.flatMap(p=>p.tags))];
  const done=projects.filter(p=>p.status==='เสร็จแล้ว');
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:0}}>
      {/* left rail */}
      <div style={{background:'rgba(8,10,18,.55)',borderRight:'1px solid var(--line)',padding:'22px 20px'}}>
        <div style={{width:64,height:64,borderRadius:12,position:'relative',overflow:'hidden',
          border:'1px solid var(--line)',marginBottom:14}}>
          <image-slot id="player-avatar" shape="rounded" radius="12" placeholder="YOU"
            style={{position:'absolute',inset:0,width:'64px',height:'64px'}}></image-slot>
        </div>
        <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:20,color:'var(--white)',lineHeight:1.2}}>{name}</div>
        <div style={{color:'var(--cyan)',fontFamily:'var(--mono)',fontSize:13,marginTop:5}}>{(cfg.ownerRole||'').trim()||'ตำแหน่ง'}</div>

        {contacts.length>0 && <>
          <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 8px'}}>CONTACT</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {contacts.map((c,i)=><div key={i} style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)'}}>{c}</div>)}
          </div>
        </>}

        {skills.length>0 && <>
          <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 8px'}}>SKILLS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {skills.map(sk=><span key={sk} className="chip" style={{fontSize:10,color:'var(--cyan)',borderColor:'rgba(70,182,255,.35)'}}>{sk}</span>)}
          </div>
        </>}
      </div>

      {/* right body */}
      <div style={{padding:'22px 22px'}}>
        <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,marginBottom:8}}>ABOUT</div>
        <p style={{margin:0,fontSize:13.5,lineHeight:1.65,color:(cfg.bio||'').trim()?'var(--text)':'var(--text-mute)'}}>
          {(cfg.bio||'').trim()||'เขียนแนะนำตัวในช่อง Bio ด้านบน แล้วจะมาแสดงตรงนี้'}</p>

        <div style={{fontFamily:'var(--pixel2)',fontSize:10,color:'var(--text-dim)',letterSpacing:.5,margin:'22px 0 10px'}}>PROJECTS · ผลงาน</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {projects.length===0 && <div className="empty">ยังไม่มีโปรเจกต์ — เพิ่มที่หน้า Projects</div>}
          {projects.map(p=>(
            <div key={p.id} style={{borderLeft:'2px solid var(--cyan)',paddingLeft:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
                <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:14,color:'var(--white)'}}>{p.title}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',flex:'none'}}>{p.period}</span>
              </div>
              <div style={{fontFamily:'var(--mono)',fontSize:11.5,color:'var(--cyan)',marginTop:2}}>{p.role}</div>
              <div style={{fontSize:12.5,color:'var(--text-dim)',marginTop:5,lineHeight:1.5}}>{p.summary}</div>
              {p.highlights&&p.highlights.length>0 &&
                <ul style={{margin:'7px 0 0',paddingLeft:16,color:'var(--text)',fontSize:12.5,lineHeight:1.6}}>
                  {p.highlights.slice(0,3).map((h,i)=><li key={i}>{h}</li>)}
                </ul>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





export default Settings;
