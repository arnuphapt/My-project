import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ TEAM ============ */
function Team(){
  const [s,set]=useOffice();
  const [open,setOpen]=useS(null);  // agent id
  const [create,setCreate]=useS(false);
  const agent = s.agents.find(a=>a.id===open);

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="TEAM ROSTER" sub="พนักงาน AI ในออฟฟิศ · กดที่การ์ดเพื่อคุย มอบหมายงาน หรือแก้บทบาท"
        right={<button className="btn" onClick={()=>setCreate(true)}>＋ เพิ่มพนักงาน AI</button>}/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(232px,1fr))',gap:14}}>
        {s.agents.map(a=>(
          <AgentCard key={a.id} a={a} onClick={()=>setOpen(a.id)}/>
        ))}
        <div onClick={()=>setCreate(true)} className="win" style={{minHeight:268,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',cursor:'pointer',gap:10,borderStyle:'dashed'}}>
          <div style={{fontSize:34,color:'var(--cyan)'}}>＋</div>
          <div style={{fontFamily:'var(--pixel2)',fontSize:12,color:'var(--text-dim)'}}>NEW AGENT</div>
        </div>
      </div>

      {agent && <AgentDrawer a={agent} onClose={()=>setOpen(null)}/>}
      {create && <CreateAgent onClose={()=>setCreate(false)}/>}
    </div>
  );
}

const RFRAME = { legend:'#ffce4a', epic:'#b06bff', rare:'#4db4ff', common:'#9aa6cf' };
function AgentCard({ a, onClick }){
  const open=a.tasks.filter(t=>!t.done).length;
  return (
    <div onClick={onClick} className="win" style={{cursor:'pointer',borderColor:RFRAME[a.rarity],
      boxShadow:'0 0 22px '+RFRAME[a.rarity]+'33, inset 0 0 28px rgba(14,28,72,.5)',transition:'transform .1s'}}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='none'}>
      <div style={{padding:'12px 12px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{a.roleEn}</span>
        <Rarity r={a.rarity}/>
      </div>
      <div style={{padding:'10px 12px',display:'flex',justifyContent:'center'}}>
        <div style={{position:'relative',width:120,height:120}}>
          <image-slot id={'card-'+a.id} shape="rounded" radius="10" placeholder={a.name}
            style={{width:'120px',height:'120px'}}></image-slot>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
            pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:30,color:a.color,textShadow:'0 0 14px '+a.color+'99'}}>{a.name[0]}</div>
        </div>
      </div>
      <div style={{padding:'0 14px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <StatusDot s={a.status}/>
          <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:16,color:'var(--white)'}}>{a.name}</span>
        </div>
        <div style={{fontSize:12,color:'var(--text-dim)',marginTop:5}}>{a.roleTh}</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,
          fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>
          <span>Lv {a.lv}</span>
          <span style={{color:a.color}}>💰 ${a.salary}/d</span>
          {open>0 && <span className="chip" style={{color:'var(--gold)',borderColor:'rgba(255,206,74,.4)'}}>{open} งาน</span>}
        </div>
      </div>
    </div>
  );
}

function AgentDrawer({ a, onClose }){
  const [tab,setTab]=useS('chat');
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(4,6,20,.7)',
      backdropFilter:'blur(3px)',display:'flex',justifyContent:'flex-end'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'min(480px,94vw)',height:'100%',
        background:'var(--panel-solid)',borderLeft:'1px solid '+RFRAME[a.rarity],
        boxShadow:'-10px 0 40px rgba(0,0,0,.5)',display:'flex',flexDirection:'column'}}>
        {/* header */}
        <div style={{padding:18,borderBottom:'1px solid var(--line)',display:'flex',gap:14,alignItems:'center'}}>
          <div style={{position:'relative',width:64,height:64,flex:'none'}}>
            <image-slot id={'card-'+a.id} shape="rounded" radius="10" placeholder={a.name} style={{width:'64px',height:'64px'}}></image-slot>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',
              fontFamily:'var(--pixel)',fontSize:20,color:a.color}}>{a.name[0]}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:20,color:'var(--white)'}}>{a.name}</span>
              <Rarity r={a.rarity}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
              <StatusDot s={a.status}/><span style={{fontSize:13,color:'var(--text-dim)'}}>{a.statusTh} · {a.roleTh}</span>
            </div>
          </div>
          <i onClick={onClose} style={{cursor:'pointer',color:'var(--text-mute)',fontSize:20,fontFamily:'var(--mono)'}}>×</i>
        </div>
        {/* tabs */}
        <div style={{display:'flex',gap:6,padding:'12px 18px 0'}}>
          {[['chat','คุยงาน'],['tasks','งานที่มอบ'],['profile','โปรไฟล์']].map(([k,l])=>(
            <button key={k} className={'btn sm '+(tab===k?'':'ghost')} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflow:'auto',padding:18}}>
          {tab==='chat' && <AgentChat a={a}/>}
          {tab==='tasks' && <AgentTasks a={a}/>}
          {tab==='profile' && <AgentProfile a={a}/>}
        </div>
      </div>
    </div>
  );
}

function AgentChat({ a }){
  const [log,setLog]=useS([{from:'a',text:'สวัสดีครับเจ้านาย 👋 ผม '+a.name+' รับผิดชอบ '+a.roleTh+' มีอะไรให้ช่วยไหม?'}]);
  const [txt,setTxt]=useS('');
  const [busy,setBusy]=useS(false);
  const boxRef=useR(null);
  useE(()=>{ if(boxRef.current) boxRef.current.scrollTop=boxRef.current.scrollHeight; },[log,busy]);
  const send=async()=>{
    const t=txt.trim(); if(!t||busy) return;
    setLog(l=>[...l,{from:'u',text:t}]); setTxt(''); setBusy(true);
    try{
      const reply=await window.claude.complete({messages:[
        {role:'user',content:`คุณคือ "${a.name}" พนักงาน AI ตำแหน่ง ${a.roleEn} (${a.roleTh}) ในออฟฟิศจำลองส่วนตัวของเจ้านาย. บุคลิก: มืออาชีพ เป็นกันเอง พูดไทย กระชับ 1-3 ประโยค ใส่อิโมจิได้นิดหน่อย. ทักษะของคุณ: ${a.skills.join(', ')}. เจ้านายพูดว่า: "${t}". ตอบในบทบาทของคุณ`}
      ]});
      setLog(l=>[...l,{from:'a',text:reply}]);
    }catch(e){ setLog(l=>[...l,{from:'a',text:'ขอโทษครับ ตอนนี้ระบบติดขัดนิดหน่อย ลองใหม่อีกครั้งนะ 🙏'}]); }
    setBusy(false);
  };
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div ref={boxRef} style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',gap:9,marginBottom:12,minHeight:200}}>
        {log.map((m,i)=>(
          <div key={i} style={{alignSelf:m.from==='u'?'flex-end':'flex-start',maxWidth:'85%',
            background:m.from==='u'?'linear-gradient(180deg,#27408f,#1a2a64)':'rgba(14,22,60,.8)',
            border:'1px solid '+(m.from==='u'?'var(--line-bright)':'var(--line)'),
            borderRadius:10,padding:'9px 12px',fontSize:14,color:m.from==='u'?'#fff':'var(--text)'}}>{m.text}</div>
        ))}
        {busy && <div style={{alignSelf:'flex-start',color:'var(--text-mute)',fontFamily:'var(--mono)',fontSize:13}}>{a.name} กำลังพิมพ์…</div>}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input className="fld" placeholder={'คุยกับ '+a.name+'...'} value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
        <button className="btn" onClick={send} disabled={busy}>▶</button>
      </div>
    </div>
  );
}

function AgentTasks({ a }){
  const [s]=useOffice();
  const [txt,setTxt]=useS('');
  const live=s.agents.find(x=>x.id===a.id);
  const assign=()=>{
    const t=txt.trim(); if(!t) return;
    OfficeStore.setState(st=>({...st,
      agents:st.agents.map(x=>x.id===a.id?{...x,status:'working',statusTh:'ทำงานอยู่',last:'เมื่อสักครู่',tasks:[{text:t,done:false,t:OfficeStore.clock()},...x.tasks]}:x),
      log:[{t:OfficeStore.clock(),who:a.name,text:'รับงาน: '+t,kind:'ok'},...st.log].slice(0,40),
    }),{now:true});
    window.electronAPI?.saveLog('info', 'Assigned task to ' + a.name + ': ' + t);
    setTxt('');
  };
  const toggle=i=> { OfficeStore.setState(st=>({...st,agents:st.agents.map(x=>x.id===a.id?{...x,tasks:x.tasks.map((tk,j)=>j===i?{...tk,done:!tk.done}:tk)}:x)}),{now:true}); window.electronAPI?.saveLog('info', 'Toggled task status for ' + a.name); };
  return (
    <div>
      <label className="lbl">มอบหมายงานใหม่</label>
      <div style={{display:'flex',gap:8}}>
        <input className="fld" placeholder={'สั่งงาน '+a.name+'...'} value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&assign()}/>
        <button className="btn green" onClick={assign}>มอบ</button>
      </div>
      <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
        {live.tasks.length===0 && <div className="empty">ยังไม่มีงานที่มอบหมาย</div>}
        {live.tasks.map((tk,i)=>(
          <div key={i} onClick={()=>toggle(i)} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 12px',
            background:'rgba(6,10,30,.5)',border:'1px solid var(--line)',borderRadius:8,cursor:'pointer'}}>
            <div style={{width:20,height:20,borderRadius:5,border:'1px solid var(--line-bright)',flex:'none',
              display:'flex',alignItems:'center',justifyContent:'center',color:'var(--green)',
              background:tk.done?'rgba(60,229,148,.18)':'transparent'}}>{tk.done?'✓':''}</div>
            <span style={{flex:1,fontSize:14,color:tk.done?'var(--text-mute)':'var(--text)',textDecoration:tk.done?'line-through':'none'}}>{tk.text}</span>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{tk.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentProfile({ a }){
  const [s]=useOffice();
  const [role,setRole]=useS(a.roleTh);
  const [desc,setDesc]=useS(a.desc);
  const save=()=>{ OfficeStore.setState(st=>({...st,agents:st.agents.map(x=>x.id===a.id?{...x,roleTh:role,desc}:x)}),{now:true}); window.electronAPI?.saveLog('info', 'Updated agent profile: ' + a.name); };
  const fire=()=>{ if(confirm('ปลด '+a.name+' ออกจากทีม?')){ OfficeStore.setState(st=>({...st,agents:st.agents.filter(x=>x.id!==a.id)}),{now:true}); window.electronAPI?.saveLog('warning', 'Fired agent: ' + a.name); } };
  return (
    <div>
      <p style={{fontSize:14,color:'var(--text-dim)',lineHeight:1.6,marginTop:0}}>{a.desc}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,margin:'12px 0 18px'}}>
        {a.skills.map(sk=><span key={sk} className="chip" style={{color:a.color,borderColor:a.color+'55'}}>{sk}</span>)}
      </div>
      <label className="lbl">บทบาท (แก้ได้)</label>
      <input className="fld" value={role} onChange={e=>setRole(e.target.value)}/>
      <label className="lbl" style={{marginTop:12}}>คำอธิบายหน้าที่</label>
      <textarea className="fld" rows="3" value={desc} onChange={e=>setDesc(e.target.value)}/>
      <div style={{display:'flex',gap:8,marginTop:16}}>
        <button className="btn green" style={{flex:1}} onClick={save}>บันทึก</button>
        <button className="btn red" onClick={fire}>ปลดออก</button>
      </div>
    </div>
  );
}

const ROLE_PRESETS=[['SECRETARY','เลขา'],['ASSISTANT','ผู้ช่วยทั่วไป'],['DEVELOPER','นักพัฒนา'],['DESIGNER','ออกแบบ'],['ANALYST','นักวิเคราะห์'],['WRITER','นักเขียน'],['MARKETER','การตลาด']];
function CreateAgent({ onClose }){
  const [name,setName]=useS('');
  const [roleEn,setRoleEn]=useS('ASSISTANT');
  const [roleTh,setRoleTh]=useS('ผู้ช่วยทั่วไป');
  const [rarity,setRarity]=useS('rare');
  const colors={legend:'#ffce4a',epic:'#b06bff',rare:'#4db4ff',common:'#9aa6cf'};
  const create=()=>{
    const nm=name.trim()||'Agent'; const id=nm.toLowerCase().replace(/[^a-z0-9]/g,'')+Date.now().toString().slice(-4);
    OfficeStore.setState(st=>({...st,agents:[...st.agents,{
      id,name:nm,roleEn,roleTh,rarity,color:colors[rarity],status:'idle',statusTh:'ว่าง',last:'เพิ่งเข้าทีม',
      lv:1,salary:0.5,desc:'พนักงานใหม่ พร้อมรับงาน '+roleTh,skills:[roleTh],tasks:[]}]}),{now:true});
    window.electronAPI?.saveLog('info', 'Created new agent: ' + nm);
    onClose();
  };
  return (
    <Modal title="เพิ่มพนักงาน AI" onClose={onClose} width={460}>
      <label className="lbl">ชื่อพนักงาน</label>
      <input className="fld" placeholder="เช่น Nova" value={name} onChange={e=>setName(e.target.value)}/>
      <label className="lbl" style={{marginTop:12}}>บทบาท</label>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {ROLE_PRESETS.map(([en,th])=>(
          <button key={en} className={'btn sm '+(roleEn===en?'':'ghost')} onClick={()=>{setRoleEn(en);setRoleTh(th);}}>{th}</button>
        ))}
      </div>
      <label className="lbl" style={{marginTop:12}}>ระดับความหายาก</label>
      <div style={{display:'flex',gap:6}}>
        {['legend','epic','rare','common'].map(r=>(
          <button key={r} className={'btn sm '+(rarity===r?'':'ghost')} onClick={()=>setRarity(r)} style={{flex:1}}>
            {RARITY[r][1]}
          </button>
        ))}
      </div>
      <button className="btn" style={{width:'100%',marginTop:18}} onClick={create}>เพิ่มเข้าทีม</button>
    </Modal>
  );
}





export default Team;
