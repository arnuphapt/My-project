import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store/store.js';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY, SumCard } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ PROJECTS / CV DATA ============ */
const PSTATUS = {
  'กำลังทำ':   ['#ffce4a','r-legend'],
  'เสร็จแล้ว': ['#3ce594','r-rare'],
  'พัก':       ['#9aa6cf','r-common'],
};

function Projects(){
  const [s,set]=useOffice();
  const [open,setOpen]=useS(null);   // project id
  const [create,setCreate]=useS(false);
  const proj = s.projects.find(p=>p.id===open);

  const done = s.projects.filter(p=>p.status==='เสร็จแล้ว').length;
  const skills = [...new Set(s.projects.flatMap(p=>p.tags))];

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="PROJECTS" sub="คลังผลงาน — เก็บสะสมไว้เป็นข้อมูลสร้าง Resume / CV ในอนาคต"
        right={<button className="btn" onClick={()=>setCreate(true)}>＋ เพิ่มโปรเจกต์</button>}/>

      {/* stat strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        <SumCard label="โปรเจกต์ทั้งหมด" main={s.projects.length+''} sub="ในคลังผลงาน" tone="cyan"/>
        <SumCard label="เสร็จสมบูรณ์" main={done+''} sub={'จาก '+s.projects.length+' โปรเจกต์'} tone="pos"/>
        <SumCard label="ทักษะที่สะสม" main={skills.length+''} sub="แท็กไม่ซ้ำ" tone="gold"/>
        <SumCard label="พร้อมทำ CV" main={done>0?'✓':'…'} sub={done>0?'ส่งออกได้':'ยังไม่พอ'} tone={done>0?'pos':'cyan'}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
        {s.projects.map(p=>(
          <ProjectCard key={p.id} p={p} onClick={()=>setOpen(p.id)}/>
        ))}
        <div onClick={()=>setCreate(true)} className="win" style={{minHeight:260,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',cursor:'pointer',gap:10,borderStyle:'dashed'}}>
          <div style={{fontSize:34,color:'var(--cyan)'}}>＋</div>
          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)'}}>NEW PROJECT</div>
        </div>
      </div>

      {/* skill cloud */}
      <Win title="SKILL CLOUD" th={false} style={{marginTop:18}} right={<span className="tag" style={{marginRight:6}}>auto จากแท็ก</span>}>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {skills.length===0 && <div className="empty">ยังไม่มีแท็ก — เพิ่มโปรเจกต์เพื่อสะสมทักษะ</div>}
          {skills.map(sk=>{
            const n=s.projects.filter(p=>p.tags.includes(sk)).length;
            return <span key={sk} className="chip" style={{fontSize:12,padding:'5px 11px',color:'var(--cyan)',borderColor:'rgba(58,208,255,.4)'}}>{sk}<span style={{color:'var(--text-mute)',marginLeft:4}}>×{n}</span></span>;
          })}
        </div>
      </Win>

      {proj && <ProjectDrawer p={proj} onClose={()=>setOpen(null)}/>}
      {create && <CreateProject onClose={()=>setCreate(false)}/>}
    </div>
  );
}

function ProjectCard({ p, onClick }){
  const [c,rcls]=PSTATUS[p.status]||PSTATUS['พัก'];
  return (
    <div onClick={onClick} className="win" style={{cursor:'pointer',transition:'transform .1s'}}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}>
      <div style={{position:'relative',height:128}}>
        <image-slot id={'proj-'+p.id} shape="rect" placeholder={'cover · '+p.title}
          style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
        <div style={{position:'absolute',top:9,right:9}}>
          <span className="chip" style={{color:c,borderColor:c+'66',background:'rgba(6,10,30,.8)'}}>{p.status}</span>
        </div>
        <div style={{position:'absolute',left:0,right:0,bottom:0,height:46,
          background:'linear-gradient(180deg,transparent,rgba(8,12,36,.92))'}}></div>
      </div>
      <div style={{padding:'12px 14px 14px'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8}}>
          <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:16,color:'var(--white)'}}>{p.title}</span>
          <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',flex:'none'}}>{p.period}</span>
        </div>
        <div style={{fontSize:12,color:'var(--cyan)',marginTop:4,fontFamily:'var(--mono)'}}>{p.role}</div>
        <div style={{fontSize:13,color:'var(--text-dim)',marginTop:8,lineHeight:1.5,
          display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.summary}</div>
        <div style={{margin:'11px 0 9px'}}><Bar pct={p.progress} tone={p.progress>=100?'green':''}/></div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {p.tags.slice(0,3).map(t=><span key={t} className="chip" style={{fontSize:10,padding:'2px 7px'}}>{t}</span>)}
            {p.tags.length>3 && <span style={{fontSize:11,color:'var(--text-mute)',fontFamily:'var(--mono)'}}>+{p.tags.length-3}</span>}
          </div>
          <span style={{fontFamily:'var(--mono)',fontSize:12,color:c}}>{p.progress}%</span>
        </div>
      </div>
    </div>
  );
}

function ProjectDrawer({ p, onClose }){
  const [c]=PSTATUS[p.status]||PSTATUS['พัก'];
  const [hl,setHl]=useS('');
  const live=OfficeStore.getState().projects.find(x=>x.id===p.id)||p;
  const upd=patch=>OfficeStore.setState(st=>({...st,projects:st.projects.map(x=>x.id===p.id?{...x,...patch}:x)}),{now:true});
  const addHl=()=>{ const t=hl.trim(); if(!t) return; upd({highlights:[...live.highlights,t]}); setHl(''); };
  const delHl=i=>upd({highlights:live.highlights.filter((_,j)=>j!==i)});
  const del=()=>{ if(confirm('ลบโปรเจกต์ "'+p.title+'"?')){ OfficeStore.setState(st=>({...st,projects:st.projects.filter(x=>x.id!==p.id)}),{now:true}); onClose(); } };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(4,6,20,.7)',
      backdropFilter:'blur(3px)',display:'flex',justifyContent:'flex-end'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(540px,96vw)',height:'100%',
        background:'var(--panel-solid)',borderLeft:'1px solid var(--line-bright)',
        boxShadow:'-10px 0 40px rgba(0,0,0,.5)',display:'flex',flexDirection:'column'}}>
        <div style={{position:'relative',height:150,flex:'none'}}>
          <image-slot id={'proj-'+p.id} shape="rect" placeholder={'cover · '+p.title}
            style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
          <i onClick={onClose} style={{position:'absolute',top:12,right:14,cursor:'pointer',color:'#fff',fontSize:22,
            fontFamily:'var(--mono)',textShadow:'0 0 8px #000',zIndex:2}}>×</i>
          <div style={{position:'absolute',left:0,right:0,bottom:0,padding:'24px 20px 14px',
            background:'linear-gradient(180deg,transparent,rgba(8,12,36,.95))'}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontFamily:'var(--pixel)',fontSize:16,color:'var(--white)',textShadow:'0 0 12px rgba(58,140,255,.5)'}}>{p.title}</span>
              <span className="chip" style={{color:c,borderColor:c+'66'}}>{p.status}</span>
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',marginTop:6}}>{p.role} · {p.period}</div>
          </div>
        </div>

        <div style={{flex:1,overflow:'auto',padding:'18px 20px'}}>
          <p style={{fontSize:14.5,color:'var(--text)',lineHeight:1.65,marginTop:0}}>{p.summary}</p>

          <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0'}}>
            <div style={{flex:1}}><Bar pct={live.progress} tone={live.progress>=100?'green':''}/></div>
            <span style={{fontFamily:'var(--mono)',fontSize:13,color:c}}>{live.progress}%</span>
          </div>

          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)',letterSpacing:.5,margin:'18px 0 9px'}}>HIGHLIGHTS · ผลงานเด่น</div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {live.highlights.map((h,i)=>(
              <div key={i} style={{display:'flex',gap:9,alignItems:'flex-start',padding:'9px 11px',
                background:'rgba(6,10,30,.5)',border:'1px solid var(--line)',borderRadius:8}}>
                <span style={{color:'var(--green)',fontFamily:'var(--mono)',flex:'none'}}>▸</span>
                <span style={{flex:1,fontSize:13.5,color:'var(--text)',lineHeight:1.5}}>{h}</span>
                <i onClick={()=>delHl(i)} style={{cursor:'pointer',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:14}}>×</i>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:9}}>
            <input className="fld" placeholder="เพิ่มผลงานเด่น / ตัวเลขที่ทำได้..." value={hl}
              onChange={e=>setHl(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addHl()} style={{padding:'8px 11px',fontSize:13}}/>
            <button className="btn green sm" onClick={addHl}>＋</button>
          </div>

          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 9px'}}>TECH / SKILLS</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {p.tags.map(t=><span key={t} className="chip" style={{color:'var(--cyan)',borderColor:'rgba(58,208,255,.4)'}}>{t}</span>)}
          </div>

          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)',letterSpacing:.5,margin:'20px 0 9px'}}>ความคืบหน้า</div>
          <div style={{display:'flex',gap:6}}>
            {[25,50,75,100].map(v=>(
              <button key={v} className={'btn sm '+(live.progress===v?'':'ghost')} onClick={()=>upd({progress:v, status:v>=100?'เสร็จแล้ว':'กำลังทำ'})} style={{flex:1}}>{v}%</button>
            ))}
          </div>

          <button className="btn red" style={{width:'100%',marginTop:24}} onClick={del}>ลบโปรเจกต์นี้</button>
        </div>
      </div>
    </div>
  );
}

function CreateProject({ onClose }){
  const [title,setTitle]=useS('');
  const [role,setRole]=useS('');
  const [period,setPeriod]=useS('2026');
  const [summary,setSummary]=useS('');
  const [tags,setTags]=useS('');
  const create=()=>{
    const t=title.trim()||'โปรเจกต์ใหม่';
    const id='p'+Date.now().toString().slice(-6);
    OfficeStore.setState(st=>({...st,projects:[{
      id, title:t, role:role.trim()||'Builder', status:'กำลังทำ', progress:10, period:period.trim()||'2026',
      tags: tags.split(',').map(x=>x.trim()).filter(Boolean), cover:'', summary:summary.trim()||'รายละเอียดโปรเจกต์...',
      highlights:[],
    },...st.projects]}),{now:true});
    onClose();
  };
  return (
    <Modal title="เพิ่มโปรเจกต์ใหม่" onClose={onClose} width={500}>
      <label className="lbl">ชื่อโปรเจกต์</label>
      <input className="fld" placeholder="เช่น AI Trading Dashboard" value={title} onChange={e=>setTitle(e.target.value)}/>
      <div style={{display:'flex',gap:10,marginTop:12}}>
        <div style={{flex:1}}>
          <label className="lbl">บทบาทของคุณ</label>
          <input className="fld" placeholder="Developer / Designer" value={role} onChange={e=>setRole(e.target.value)}/>
        </div>
        <div style={{width:130}}>
          <label className="lbl">ช่วงเวลา</label>
          <input className="fld" placeholder="2026" value={period} onChange={e=>setPeriod(e.target.value)}/>
        </div>
      </div>
      <label className="lbl" style={{marginTop:12}}>สรุปสั้นๆ</label>
      <textarea className="fld" rows="2" placeholder="โปรเจกต์นี้ทำอะไร แก้ปัญหาอะไร..." value={summary} onChange={e=>setSummary(e.target.value)}/>
      <label className="lbl" style={{marginTop:12}}>แท็ก / ทักษะ <span style={{color:'var(--text-mute)'}}>(คั่นด้วย ,)</span></label>
      <input className="fld" placeholder="React, Python, UX" value={tags} onChange={e=>setTags(e.target.value)}/>
      <button className="btn" style={{width:'100%',marginTop:18}} onClick={create}>เพิ่มเข้าคลังผลงาน</button>
    </Modal>
  );
}





export default Projects;
