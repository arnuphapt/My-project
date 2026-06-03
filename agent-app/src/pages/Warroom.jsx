import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ WARROOM · IMMERSIVE ISOMETRIC OFFICE ============ */
function WarRoom(){
  const [s,set]=useOffice();
  const [bubbles,setBubbles]=useS({});   // ephemeral speech {agentId:text}
  const [open,setOpen]=useS(null);        // popover agent id
  const [cmd,setCmd]=useS('');
  const [place,setPlace]=useS(false);     // place-characters mode
  const [drag,setDrag]=useS(null);        // {id} being dragged
  const [live,setLive]=useS(null);        // {id,x,y} live drag pos
  const [clock,setClock]=useS(nowHM());
  const stageRef=useR(null);

  useE(()=>{ const id=setInterval(()=>setClock(nowHM()),30000); return ()=>clearInterval(id); },[]);

  // ambient thoughts
  useE(()=>{
    if(place) return;
    const id=setInterval(()=>{
      const a=s.agents[Math.floor(Math.random()*s.agents.length)];
      popBubble(a.id, IDLE_THOUGHTS[Math.floor(Math.random()*IDLE_THOUGHTS.length)]);
    }, 5000);
    return ()=>clearInterval(id);
  },[s.agents.length, place]);

  function popBubble(id,text){
    setBubbles(b=>({...b,[id]:text}));
    setTimeout(()=>setBubbles(b=>{ const n={...b}; if(n[id]===text) delete n[id]; return n; }), 4200);
  }

  const broadcast=()=>{
    const t=cmd.trim(); if(!t) return;
    OfficeStore.setState(st=>({...st,
      teamChat:[...st.teamChat,{who:'you',text:'📢 '+t,t:OfficeStore.clock()}],
      log:[{t:OfficeStore.clock(),who:'You',text:'สั่งงานรวม: '+t,kind:'sys'},...st.log].slice(0,40),
    }),{now:true});
    s.agents.forEach((a,i)=>setTimeout(()=>popBubble(a.id, ACK[Math.floor(Math.random()*ACK.length)]), 200+i*160));
    setCmd('');
  };

  /* ----- drag handling ----- */
  const pos=(id)=> (live&&live.id===id) ? live : (s.warroomPos[id]||{x:50,y:50});
  function onDown(e,id){
    if(!place) return;
    e.preventDefault(); e.stopPropagation();
    setDrag({id});
    setLive({id, ...(s.warroomPos[id]||{x:50,y:50})});
  }
  function onMove(e){
    if(!drag) return;
    const r=stageRef.current.getBoundingClientRect();
    const x=Math.max(4,Math.min(96,((e.clientX-r.left)/r.width)*100));
    const y=Math.max(10,Math.min(96,((e.clientY-r.top)/r.height)*100));
    setLive({id:drag.id,x,y});
  }
  function onUp(){
    if(drag&&live){ OfficeStore.setState(st=>({...st,warroomPos:{...st.warroomPos,[live.id]:{x:live.x,y:live.y}}}),{now:true}); }
    setDrag(null); setLive(null);
  }

  return (
    <div style={{height:'100%',position:'relative',overflow:'hidden'}}
      ref={stageRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>

      {/* ===== ROOM BACKDROP ===== */}
      <image-slot id="office-scene" shape="rect"
        placeholder="วางรูปห้องออฟฟิศ isometric ที่นี่ (พื้นไม้ · หน้าต่าง · โต๊ะทำงาน — เต็มห้อง)"
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(120% 90% at 50% 18%, transparent 40%, rgba(6,8,14,.72) 100%)'}}></div>

      {/* ===== CHARACTER TOKENS ===== */}
      {s.agents.map(a=>{
        const p=pos(a.id);
        return <CharToken key={a.id} a={a} x={p.x} y={p.y} bubble={bubbles[a.id]} place={place}
          dragging={drag&&drag.id===a.id}
          onDown={e=>onDown(e,a.id)} onClick={()=>{ if(!place) setOpen(a.id); }}/>;
      })}

      {/* ===== TOP TOOLBAR ===== */}
      <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:30,
        display:'flex',alignItems:'center',gap:14,padding:'8px 14px',borderRadius:11,
        background:'rgba(12,15,24,.82)',border:'1px solid var(--line-bright)',backdropFilter:'blur(6px)',
        boxShadow:'0 8px 24px rgba(0,0,0,.5)'}}>
        <span style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--cyan)',letterSpacing:1.5,textShadow:'0 0 8px rgba(70,182,255,.4)'}}>WARROOM</span>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--white)'}}>🕐 {clock}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--green)'}}>🟢 {s.agents.filter(a=>a.status!=='idle').length}/{s.agents.length}</span>
        <button className={'btn sm '+(place?'green':'ghost')} onClick={()=>setPlace(p=>!p)} style={{whiteSpace:'nowrap'}}>
          {place?'✓ เสร็จแล้ว':'🧩 จัดวางตัวละคร'}
        </button>
      </div>

      {/* place-mode hint */}
      {place &&
        <div style={{position:'absolute',top:58,left:'50%',transform:'translateX(-50%)',zIndex:30,
          fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',background:'rgba(12,15,24,.8)',
          padding:'5px 12px',borderRadius:8,border:'1px solid var(--line)'}}>
          ลากตัวละครไปวางตำแหน่งบนโต๊ะในห้องได้เลย
        </div>}

      {/* ===== ORDER BAR ===== */}
      <div style={{position:'absolute',left:'50%',bottom:12,transform:'translateX(-50%)',zIndex:30,
        display:'flex',alignItems:'center',gap:9,padding:'8px 10px',borderRadius:11,width:'min(560px,86%)',
        background:'rgba(12,15,24,.86)',border:'1px solid var(--line)',backdropFilter:'blur(6px)'}}>
        <span style={{fontFamily:'var(--pixel)',fontSize:8,color:'var(--cyan)',letterSpacing:1,flex:'none'}}>ORDER ALL ▸</span>
        <input className="fld" placeholder="ออกคำสั่งให้ทุกคนในออฟฟิศ..." value={cmd}
          onChange={e=>setCmd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&broadcast()} style={{padding:'8px 11px',fontSize:13}}/>
        <button className="btn sm" onClick={broadcast}>📢</button>
      </div>

      {open && <DeskPopover agent={s.agents.find(a=>a.id===open)} onClose={()=>setOpen(null)}
        onAssigned={txt=>popBubble(open,txt)}/>}
    </div>
  );
}

function nowHM(){ return new Date().toTimeString().slice(0,5); }
const IDLE_THOUGHTS=['☕','พิมพ์ๆ...','📊','อืม น่าสน','เกือบเสร็จละ','555','focus 🎧','เช็คตลาดแป๊บ','📝','✦'];
const ACK=['รับทราบ! 💪','จัดให้เลย','โอเค ลุยต่อ','555 ได้เลย','กำลังทำ ✦','เคลียร์ทันที'];

/* floating glass panel positioner (legacy) */
function Float({ x, y, w, children }){
  const st={position:'absolute',width:w,zIndex:18};
  if(x==='left') st.left=10; else st.right=10;
  if(y==='top') st.top=10;
  else if(y==='mid') st.top=190;
  else if(y==='mid2') st.top=176;
  else if(y==='bot') st.bottom=10;
  return <div style={st}>{children}</div>;
}

/* ---- speech bubble ---- */
function Speech({ text, color }){
  if(!text) return null;
  return (
    <div className="wr-speech" style={{borderColor:(color||'#46b6ff')+'aa'}}>
      {text}
      <span className="wr-speech-tail"></span>
    </div>
  );
}

/* ---- draggable character token ---- */
function CharToken({ a, x, y, bubble, place, dragging, onDown, onClick }){
  return (
    <div onPointerDown={onDown} onClick={onClick}
      style={{position:'absolute',left:x+'%',top:y+'%',transform:'translate(-50%,-100%)',zIndex:dragging?40:10,
        cursor:place?'grab':'pointer',userSelect:'none',touchAction:'none',
        filter:dragging?'drop-shadow(0 10px 16px rgba(0,0,0,.6))':'none',transition:dragging?'none':'filter .1s'}}>
      <Speech text={place?null:bubble} color={a.color}/>

      {/* character */}
      <div style={{position:'relative',width:74,height:84,margin:'0 auto'}}>
        <div style={{position:'absolute',left:'50%',bottom:0,transform:'translateX(-50%)',width:60,height:12,
          background:'radial-gradient(ellipse,rgba(0,0,0,.5),transparent 70%)',borderRadius:'50%'}}></div>
        <div style={{position:'absolute',inset:0,bottom:8,display:'flex',alignItems:'center',justifyContent:'center',
          pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:26,color:a.color,textShadow:'0 0 12px '+a.color+'66'}}>{a.name[0]}</div>
        <image-slot id={'agent-'+a.id} shape="rect"
          style={{position:'absolute',left:0,right:0,top:0,bottom:8,width:'74px',height:'76px',
            border:place?'1.5px dashed '+a.color:'none',background:place?'rgba(10,14,24,.4)':'transparent'}}></image-slot>
        <span className={'sdot s-'+a.status} style={{position:'absolute',right:6,top:2,width:11,height:11,border:'2px solid #0c0f18'}}></span>
      </div>

      {/* nameplate */}
      <div style={{marginTop:2,padding:'2px 8px',borderRadius:7,background:'rgba(12,15,24,.9)',
        border:'1px solid '+a.color+'55',textAlign:'center',whiteSpace:'nowrap'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--white)'}}>{a.name}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:10,color:a.color,marginLeft:5}}>Lv{a.lv}</span>
      </div>
    </div>
  );
}

/* ---- popover: assign task / set status / chat ---- */
function DeskPopover({ agent, onClose, onAssigned }){
  const [task,setTask]=useS(agent.task||'');
  const [,set]=useOffice();
  const upd=patch=>OfficeStore.setState(st=>({...st,agents:st.agents.map(x=>x.id===agent.id?{...x,...patch}:x)}),{now:true});
  const assign=()=>{
    const t=task.trim(); if(!t) return;
    upd({task:t,status:'working',statusTh:t,last:'เมื่อสักครู่'});
    OfficeStore.setState(st=>({...st,
      teamChat:[...st.teamChat,{who:'you',text:'@'+agent.name+' '+t,t:OfficeStore.clock()},
        {who:agent.id,text:ACK[Math.floor(Math.random()*ACK.length)],t:OfficeStore.clock()}],
      log:[{t:OfficeStore.clock(),who:agent.name,text:'รับงาน: '+t,kind:'ok'},...st.log].slice(0,40),
    }),{now:true});
    onAssigned&&onAssigned(ACK[Math.floor(Math.random()*ACK.length)]);
    onClose();
  };
  return (
    <Modal title={agent.roleEn+' · '+agent.name} onClose={onClose} width={460}>
      <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:14}}>
        <div style={{width:64,height:70,borderRadius:12,position:'relative',overflow:'hidden',flex:'none',
          border:'2px solid '+agent.color+'66',background:'linear-gradient(160deg,#1b2236,#10141f)'}}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
            pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:24,color:agent.color}}>{agent.name[0]}</div>
          <image-slot id={'agent-'+agent.id} shape="rounded" radius="12"
            style={{position:'absolute',inset:0,width:'64px',height:'70px'}}></image-slot>
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Rarity r={agent.rarity}/>
            <span style={{fontFamily:'var(--mono)',fontSize:12,color:agent.color}}>Lv{agent.lv}</span>
          </div>
          <div style={{fontSize:13,color:'var(--text-dim)',marginTop:6,lineHeight:1.5}}>{agent.roleTh}</div>
          <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
            <span className={'sdot s-'+agent.status}></span>
            <span style={{fontSize:12,color:'var(--text)'}}>{agent.statusTh}</span>
          </div>
        </div>
      </div>
      <label className="lbl">มอบหมายงาน</label>
      <textarea className="fld" rows="2" placeholder={'สั่งงาน '+agent.name+'...'} value={task}
        onChange={e=>setTask(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)) assign(); }}/>
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',alignSelf:'center'}}>สถานะ:</span>
        {[['working','ทำงาน','#3ce594'],['thinking','คิดอยู่','#46b6ff'],['idle','ว่าง','#9aa6cf']].map(([st,lb,c])=>(
          <button key={st} className={'btn sm '+(agent.status===st?'':'ghost')}
            onClick={()=>upd({status:st,statusTh:lb})} style={{flex:1,color:agent.status===st?'#0b0e16':c}}>{lb}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginTop:16}}>
        <button className="btn green" style={{flex:1}} onClick={assign}>มอบหมายงาน</button>
        <button className="btn ghost" onClick={()=>{ onClose(); set({route:'team'}); }}>ดูโปรไฟล์</button>
      </div>
    </Modal>
  );
}





export default WarRoom;
