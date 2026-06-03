import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store/store.js';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ SECRETARY ============ */
function Secretary(){
  const [s,set]=useOffice();
  const [txt,setTxt]=useS('');
  const [busy,setBusy]=useS(false);
  const boxRef=useR(null);
  
  // Find the agent with "เลขา" in Thai role, or "SECRETARY" in English role
  const sec = s.agents.find(a=>a.roleTh.includes('เลขา') || a.roleEn.toUpperCase().includes('SECRETARY'));
  const log = s.secChat;

  useE(()=>{ if(boxRef.current) boxRef.current.scrollTop=boxRef.current.scrollHeight; },[log.length,busy]);

  const push=(m)=>OfficeStore.setState(st=>({...st,secChat:[...st.secChat,m]}),{now:true});

  const dispatch=(agentId,task)=>{
    OfficeStore.setState(st=>{
      const exists=st.agents.find(a=>a.id===agentId);
      const id = exists? agentId : st.agents.find(a=>a.roleEn.toLowerCase().includes(agentId.toLowerCase()) || a.roleTh.includes(agentId))?.id;
      if(!id) return st;
      return {...st,
        agents:st.agents.map(a=>a.id===id?{...a,status:'working',statusTh:'ทำงานอยู่',last:'เมื่อสักครู่',tasks:[{text:task,done:false,t:OfficeStore.clock()},...a.tasks]}:a),
        log:[{t:OfficeStore.clock(),who:sec?sec.name:'System',text:'มอบงานให้ '+(exists?exists.name:id)+': '+task,kind:'ok'},...st.log].slice(0,40),
      };
    },{now:true});
  };

  if(!sec){
    return (
      <div style={{maxWidth:1180,margin:'0 auto',padding:'20px 22px',height:'100%',display:'flex',flexDirection:'column'}}>
        <PageHead title="SECRETARY" sub="ยังไม่มีเลขาในทีม"/>
        <div style={{margin:'auto',textAlign:'center',color:'var(--text-mute)'}}>
          <div style={{fontSize:40,marginBottom:10}}>👩‍💼</div>
          <div style={{fontSize:16,color:'var(--white)',marginBottom:6}}>คุณยังไม่ได้จ้างเลขา</div>
          <div style={{fontSize:14,color:'var(--text-dim)'}}>โปรดไปที่หน้า TEAM และเพิ่มพนักงานที่มีบทบาท "เลขา" หรือ "SECRETARY"</div>
        </div>
      </div>
    );
  }

  const send=async(preset)=>{
    const t=(preset||txt).trim(); if(!t||busy) return;
    push({from:'u',text:t}); setTxt(''); setBusy(true);
    const roster=OfficeStore.getState().agents.map(a=>`${a.id} (${a.name}, ${a.roleTh})`).join('; ');
    try{
      const reply=await window.claude.complete({messages:[{role:'user',content:
`คุณคือ "${sec.name}" ตำแหน่ง ${sec.roleTh} ของออฟฟิศ AI ส่วนตัวของเจ้านาย. บุคลิก: ขี้เล่น มีอารมณ์ขัน อบอุ่น แต่ทำงานเป๊ะ พูดไทย กระชับ ใส่อิโมจิพอประมาณ.
ทีมที่คุณสั่งงานได้: ${roster}.
หน้าที่: คุยกับเจ้านาย ช่วยวางแผน และเมื่อเจ้านายอยากให้ทำงานอะไร ให้มอบหมายงานต่อให้ AI ในทีมที่เหมาะสม.
เวลาจะมอบงาน ให้พิมพ์บรรทัดแยกในรูปแบบ: DISPATCH: <agentId> | <รายละเอียดงาน> (พิมพ์ได้หลายบรรทัดถ้ามอบหลายงาน) แล้วค่อยตามด้วยข้อความสรุปสั้นๆถึงเจ้านาย.
เจ้านายพูดว่า: "${t}"`}]});
      // parse dispatches
      const lines=reply.split('\n');
      const kept=[];
      lines.forEach(ln=>{
        const m=ln.match(/DISPATCH:\s*([a-zA-Z0-9_]+)\s*\|\s*(.+)/);
        if(m){ dispatch(m[1].trim(), m[2].trim()); }
        else kept.push(ln);
      });
      const clean=kept.join('\n').trim();
      if(clean) push({from:'a',text:clean});
      else push({from:'a',text:'จัดให้เรียบร้อยแล้วค่ะเจ้านาย ✅ ดูงานที่หน้า Team ได้เลย'});
    }catch(e){ push({from:'a',text:'อุ๊ย ระบบสะดุดนิดนึง 😅 ลองพิมพ์อีกทีนะเจ้านาย'}); }
    setBusy(false);
  };

  const quick=['สรุปสถานะออฟฟิศวันนี้ให้หน่อย','ให้นักวิเคราะห์ดูพอร์ตหุ้นที','ให้นักพัฒนาทำ landing page','วางแผนงานสัปดาห์นี้'];

  return (
    <div style={{maxWidth:1180,margin:'0 auto',padding:'20px 22px',height:'100%',display:'flex',flexDirection:'column'}}>
      <PageHead title="SECRETARY" sub={`คุยกับ ${sec.name} เลขาส่วนตัว — สั่งงานครั้งเดียว เธอกระจายให้ทั้งทีม AI`}/>
      <div style={{display:'grid',gridTemplateColumns:'260px minmax(0,1fr)',gap:14,flex:1,minHeight:0}}>
        {/* side */}
        <div style={{display:'flex',flexDirection:'column',gap:12,minHeight:0,overflow:'auto'}}>
          <Win title={sec.name.toUpperCase()} accent="gold">
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
              <div style={{position:'relative',width:96,height:96}}>
                <image-slot id={`card-${sec.id}`} shape="rounded" radius="12" placeholder={sec.name} style={{width:'96px',height:'96px'}}></image-slot>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none',
                  fontFamily:'var(--pixel)',fontSize:26,color:sec.color,textShadow:`0 0 14px ${sec.color}b3`}}>{sec.name[0]}</div>
              </div>
              <Rarity r={sec.rarity}/>
              <div style={{textAlign:'center',fontSize:13,color:'var(--text-dim)',lineHeight:1.5}}>
                {sec.roleTh}<br/>ขี้เล่น มีอารมณ์ขัน แต่งานเป๊ะ
              </div>
            </div>
          </Win>
          <Win title="TEAM STATUS">
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {s.agents.filter(a=>a.id!==sec.id).map(a=>(
                <div key={a.id} style={{display:'flex',alignItems:'center',gap:8}}>
                  <StatusDot s={a.status}/>
                  <span style={{flex:1,fontSize:13,color:'var(--text)'}}>{a.name}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)'}}>{a.tasks.filter(t=>!t.done).length} งาน</span>
                </div>
              ))}
            </div>
          </Win>
        </div>

        {/* chat */}
        <Win title={`CHAT WITH ${sec.name.toUpperCase()}`} accent="gold" bodyStyle={{padding:0,display:'flex',flexDirection:'column',minHeight:0}}>
          <div ref={boxRef} style={{flex:1,overflow:'auto',padding:18,display:'flex',flexDirection:'column',gap:11,minHeight:0}}>
            {log.length===0 && (
              <div style={{margin:'auto',textAlign:'center',color:'var(--text-mute)',maxWidth:380}}>
                <div style={{fontSize:40,marginBottom:10}}>☕</div>
                <div style={{fontSize:15,color:'var(--text-dim)',lineHeight:1.6}}>สวัสดีเจ้านาย! ฉัน {sec.name} เอง 😎<br/>บอกมาได้เลยว่าอยากให้จัดการอะไร เดี๋ยวฉันสั่งทีมให้</div>
              </div>
            )}
            {log.map((m,i)=>(
              <div key={i} style={{alignSelf:m.from==='u'?'flex-end':'flex-start',maxWidth:'82%'}}>
                {m.from==='a' && <div style={{fontFamily:'var(--mono)',fontSize:11,color:sec.color,marginBottom:3}}>{sec.name}</div>}
                <div style={{background:m.from==='u'?'linear-gradient(180deg,#27408f,#1a2a64)':'rgba(40,32,12,.55)',
                  border:'1px solid '+(m.from==='u'?'var(--line-bright)':'rgba(255,206,74,.4)'),
                  borderRadius:12,padding:'11px 14px',fontSize:14.5,lineHeight:1.55,color:'var(--white)',whiteSpace:'pre-wrap'}}>{m.text}</div>
              </div>
            ))}
            {busy && <div style={{alignSelf:'flex-start',color:'var(--gold)',fontFamily:'var(--mono)',fontSize:13}}>{sec.name} กำลังคิด… ☕</div>}
          </div>
          {log.length===0 &&
          <div style={{display:'flex',gap:7,flexWrap:'wrap',padding:'0 18px 12px'}}>
            {quick.map(q=><button key={q} className="btn ghost sm" onClick={()=>send(q)}>{q}</button>)}
          </div>}
          <div style={{display:'flex',gap:9,padding:'12px 18px',borderTop:'1px solid var(--line)'}}>
            <input className="fld" placeholder={`พิมพ์สั่งงาน ${sec.name}...`} value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}/>
            <button className="btn gold" onClick={()=>send()} disabled={busy}>ส่ง ▶</button>
          </div>
        </Win>
      </div>
    </div>
  );
}

export default Secretary;
