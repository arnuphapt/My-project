import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store/store.js';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY } from '../components/UI.jsx';
import '../../../image-slot.js';
import TestGemini from '../TestGemini.jsx';

/* ============ DASHBOARD / WARROOM ============ */
function Dashboard(){
  const [s,set]=useOffice();
  const v = OfficeStore.valuation();
  const FX = OfficeStore.FX;

  return (
    <div style={{height:'100%',display:'grid',gridTemplateColumns:'288px minmax(0,1fr) 322px',
      gap:12,padding:12,boxSizing:'border-box'}}>
      {/* LEFT RAIL */}
      <div style={{display:'flex',flexDirection:'column',gap:12,minHeight:0,overflow:'auto',paddingRight:2}}>
        <NetWorthPanel v={v}/>
        <AgentsPanel/>
        <QuantBotPanel v={v}/>
      </div>

      {/* CENTER STAGE */}
      <div style={{position:'relative',minHeight:0,display:'flex',flexDirection:'column'}}>
        <div style={{position:'relative',flex:1,minHeight:340}}>
          <image-slot id="office-scene" shape="rounded" radius="12"
            placeholder="วางรูป pixel-art ออฟฟิศที่นี่ (isometric office scene)"
            style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
          <Bubble name="Mira" x="30%" y="20%" color="#ffce4a" text="วันนี้พอร์ตเขียวนะเจ้านาย ☕"/>
          <Bubble name="Quant" x="62%" y="12%" color="#b06bff" text="NVDA +2.5% เฝ้าให้อยู่"/>
          <Bubble name="Devin" x="20%" y="62%" color="#4db4ff" text="กำลังคอมไพล์... 555"/>
        </div>
        {/* bottom floating windows */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12,flex:'none'}}>
          <TradingPanel v={v}/>
          <TeamChatMini/>
        </div>
        
        {/* Gemini Test Panel */}
        <TestGemini />
      </div>

      {/* RIGHT RAIL */}
      <div style={{display:'flex',flexDirection:'column',gap:12,minHeight:0,overflow:'auto',paddingRight:2}}>
        <CompanyStatusPanel v={v}/>
        <MarketPanel/>
        <LofiPanel/>
      </div>
    </div>
  );
}

function Bubble({ name, x, y, color, text }){
  return (
    <div style={{position:'absolute',left:x,top:y,transform:'translate(-50%,-50%)',maxWidth:180,zIndex:5}}>
      <div style={{background:'rgba(10,16,44,.92)',border:'1px solid '+color,borderRadius:10,padding:'8px 11px',
        boxShadow:'0 0 16px '+color+'55',backdropFilter:'blur(4px)'}}>
        <div style={{fontFamily:'var(--mono)',fontSize:11,color:color,marginBottom:3}}>{name}</div>
        <div contentEditable suppressContentEditableWarning style={{fontSize:13,color:'var(--white)',outline:'none'}}>{text}</div>
      </div>
    </div>
  );
}

function NetWorthPanel({ v }){
  const FX=OfficeStore.FX;
  const totalTHB = v.totalUSD*FX;
  const dayPos = v.dayPnlUSD>=0;
  return (
    <Win title="NET WORTH" th={false} right={<span className="tag" style={{marginRight:6}}>วันนี้</span>}>
      <div style={{fontFamily:'var(--mono)',fontSize:30,color:'var(--gold)',letterSpacing:.5,lineHeight:1}}>
        ฿{fmt.n(totalTHB,2)}
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:17,color:'var(--white)',marginTop:6}}>
        ${fmt.n(v.totalUSD,2)} <span style={{color:'var(--text-mute)',fontSize:12}}>USD</span>
      </div>
      <div style={{fontSize:12,color:'var(--text-mute)',marginTop:6,fontFamily:'var(--mono)'}}>@ {FX} THB/USD · sim</div>
      <div style={{marginTop:10,borderTop:'1px solid rgba(39,66,146,.4)',paddingTop:8}}>
        <Row k="กำไร/ขาดทุนวันนี้" v={fmt.money(v.dayPnlUSD,'USD')} cls={dayPos?'pos':'neg'}/>
        <Row k="เงินสดพร้อมลงทุน" v={fmt.money(v.cashUSD,'USD')}/>
      </div>
    </Win>
  );
}

function AgentsPanel(){
  const [s,set]=useOffice();
  return (
    <Win title="AI AGENTS" right={<span className="win-dots" style={{marginRight:4}}><i onClick={()=>set({route:'team'})}>+</i></span>}>
      <div style={{display:'flex',flexDirection:'column',gap:2}}>
        {s.agents.slice(0,6).map(a=>(
          <div key={a.id} onClick={()=>set({route:'team'})} style={{display:'flex',alignItems:'center',gap:9,
            padding:'7px 4px',cursor:'pointer',borderRadius:7}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(40,60,140,.25)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <StatusDot s={a.status}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:'var(--white)',fontSize:14,fontWeight:600}}>{a.name}</div>
              <div style={{color:'var(--text-mute)',fontSize:11,fontFamily:'var(--mono)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.statusTh} · {a.last}</div>
            </div>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:a.color}}>Lv{a.lv}</span>
          </div>
        ))}
      </div>
      <button className="btn ghost sm" style={{width:'100%',marginTop:8}} onClick={()=>set({route:'team'})}>จัดการทีม →</button>
    </Win>
  );
}

function QuantBotPanel({ v }){
  const running=true;
  return (
    <Win title="QUANT BOT" accent="purple">
      <Row k="ROI รวม" v={fmt.pct(v.unrealPct)} cls={v.unrealPct>=0?'pos':'neg'}/>
      <Row k="กำไรลอยตัว" v={fmt.money(v.unrealUSD,'USD')} cls={v.unrealUSD>=0?'pos':'neg'}/>
      <Row k="มูลค่าถือครอง" v={fmt.money(v.mvUSD,'USD')}/>
      <Row k="จำนวนสินทรัพย์" v={v.rows.length+' รายการ'}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:10,
        paddingTop:8,borderTop:'1px solid rgba(39,66,146,.4)'}}>
        <span className="k" style={{color:'var(--text-dim)',fontSize:13}}>สถานะ</span>
        <span style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--green)',textShadow:'0 0 10px rgba(60,229,148,.6)'}}>RUNNING</span>
      </div>
    </Win>
  );
}

function CompanyStatusPanel({ v }){
  const FX=OfficeStore.FX;
  const realizedUSD = v && (OfficeStore.getState().realized.usd + OfficeStore.getState().realized.thb/FX);
  const totalPnl = v.unrealUSD + realizedUSD;
  return (
    <Win title="COMPANY STATUS">
      <Row k="Realized PnL" v={fmt.money(realizedUSD,'USD')} cls={realizedUSD>=0?'pos':'neg'}/>
      <Row k="Total PnL" v={fmt.money(totalPnl,'USD')} cls={totalPnl>=0?'pos':'neg'}/>
      <Row k="Net Worth" v={fmt.money(v.totalUSD,'USD')} cls="gold"/>
      <Row k="Holdings" v={fmt.money(v.mvUSD,'USD')}/>
      <Row k="Cash" v={fmt.money(v.cashUSD,'USD')}/>
      <Row k="วันนี้" v={fmt.money(v.dayPnlUSD,'USD')} cls={v.dayPnlUSD>=0?'pos':'neg'}/>
      <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:8}}>อัปเดต {new Date().toTimeString().slice(0,5)}</div>
    </Win>
  );
}

function MarketPanel(){
  const [s]=useOffice();
  const items = Object.values(s.market);
  return (
    <Win title="MARKET PRICES" style={{minHeight:0}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:'2px 12px',fontFamily:'var(--mono)',fontSize:13}}>
        <div style={{color:'var(--text-mute)',fontSize:11}}>สินทรัพย์</div>
        <div style={{color:'var(--text-mute)',fontSize:11,textAlign:'right'}}>ราคา</div>
        <div style={{color:'var(--text-mute)',fontSize:11,textAlign:'right'}}>24ชม</div>
        {items.map(m=>{
          const ch=(m.price-m.prevClose)/m.prevClose*100;
          return (
            <React.Fragment key={m.symbol}>
              <div style={{color:'var(--white)',padding:'4px 0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.symbol}</div>
              <div style={{textAlign:'right',color:'var(--text)'}}>{m.cur==='USD'?'$':'฿'}{fmt.n(m.price, m.price<1?4:2)}</div>
              <div style={{textAlign:'right',color:ch>=0?'var(--green)':'var(--red)'}}>{fmt.pct(ch,1)}</div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:8}}>อัปเดต {new Date().toTimeString().slice(0,5)} · live</div>
    </Win>
  );
}

const TRACKS=['Pixel Rain','Midnight Build','Neon Focus','Lo-Fi Ledger','8-bit Dreams'];
function LofiPanel(){
  const [playing,setPlaying]=useS(true);
  const [pos,setPos]=useS(105);
  const [ti,setTi]=useS(0);
  const len=210;
  useE(()=>{
    if(!playing) return;
    const id=setInterval(()=>setPos(p=>{ if(p>=len){ setTi(t=>(t+1)%TRACKS.length); return 0;} return p+1; }),1000);
    return ()=>clearInterval(id);
  },[playing]);
  const mmss=x=>Math.floor(x/60)+':'+String(x%60).padStart(2,'0');
  return (
    <Win title="LOFI BEATS TO CODE" accent="purple">
      <div style={{display:'flex',gap:11,alignItems:'center'}}>
        <div style={{width:50,height:50,borderRadius:9,background:'linear-gradient(135deg,#6a4cb8,#2f4ea8)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flex:'none',
          boxShadow:'0 4px 12px rgba(0,0,0,.4)'}}>🎧</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,color:'var(--text-mute)',fontFamily:'var(--mono)'}}>Now Playing</div>
          <div style={{fontSize:15,color:'var(--white)',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{TRACKS[ti]}</div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-dim)',marginTop:2}}>{mmss(pos)} / {mmss(len)}</div>
        </div>
      </div>
      <div style={{marginTop:9}}><Bar pct={pos/len*100} tone="purple"/></div>
      <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:10,fontSize:18,color:'var(--text-dim)'}}>
        <span style={{cursor:'pointer'}} onClick={()=>setTi(t=>(t+TRACKS.length-1)%TRACKS.length)}>⏮</span>
        <span style={{cursor:'pointer',color:'var(--cyan)'}} onClick={()=>setPlaying(p=>!p)}>{playing?'⏸':'▶'}</span>
        <span style={{cursor:'pointer'}} onClick={()=>{setTi(t=>(t+1)%TRACKS.length);setPos(0);}}>⏭</span>
      </div>
    </Win>
  );
}

function TradingPanel({ v }){
  const [s,set]=useOffice();
  const today=v.dayPnlUSD;
  const wins=v.rows.filter(r=>r.dayPnl>=0).length, losses=v.rows.length-wins;
  return (
    <Win title="V2 TRADING" right={<span className="tag" style={{marginRight:6}}>sim</span>}>
      <Row k="PnL วันนี้" v={fmt.money(today,'USD')} cls={today>=0?'pos':'neg'}/>
      <Row k="กำไรลอยตัว" v={fmt.money(v.unrealUSD,'USD')} cls={v.unrealUSD>=0?'pos':'neg'}/>
      <Row k="W / L วันนี้" v={wins+'W / '+losses+'L · '+(v.rows.length?Math.round(wins/v.rows.length*100):0)+'%'}/>
      <div style={{marginTop:8,fontFamily:'var(--pixel)',fontSize:9,color:'var(--text-dim)',letterSpacing:.5}}>
        OPEN POSITIONS ({v.rows.length})
      </div>
      <button className="btn sm" style={{width:'100%',marginTop:8}} onClick={()=>set({route:'portfolio'})}>เปิดพอร์ต →</button>
    </Win>
  );
}

function TeamChatMini(){
  const [s,set]=useOffice();
  const [txt,setTxt]=useS('');
  const boxRef=useR(null);
  useE(()=>{ if(boxRef.current) boxRef.current.scrollTop=boxRef.current.scrollHeight; },[s.teamChat.length]);
  const send=()=>{
    const t=txt.trim(); if(!t) return;
    OfficeStore.setState(st=>({...st, teamChat:[...st.teamChat,{who:'you',text:t,t:OfficeStore.clock()}]}),{now:true});
    setTxt('');
    setTimeout(()=>{
      const a=s.agents[Math.floor(Math.random()*4)];
      const reps=['รับทราบครับเจ้านาย!','จัดให้เลย 💪','โอเค เดี๋ยวลุยต่อ','555 ได้เลย','กำลังทำอยู่นะ'];
      OfficeStore.setState(st=>({...st, teamChat:[...st.teamChat,{who:a.id,text:reps[Math.floor(Math.random()*reps.length)],t:OfficeStore.clock()}]}),{now:true});
    },700);
  };
  const nameOf=id=>id==='you'?'คุณ':(s.agents.find(a=>a.id===id)?.name||id);
  const colOf=id=>id==='you'?'var(--cyan)':(s.agents.find(a=>a.id===id)?.color||'var(--text-dim)');
  return (
    <Win title="TEAM CHAT" bodyStyle={{padding:0,display:'flex',flexDirection:'column'}}>
      <div ref={boxRef} style={{flex:1,overflow:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:7,maxHeight:130}}>
        {s.teamChat.map((m,i)=>(
          <div key={i} style={{fontSize:13,lineHeight:1.4}}>
            <span style={{fontFamily:'var(--mono)',fontSize:11,color:colOf(m.who)}}>{nameOf(m.who)}: </span>
            <span style={{color:'var(--text)'}}>{m.text}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:7,padding:'9px 11px',borderTop:'1px solid var(--line)'}}>
        <input className="fld" placeholder="พิมพ์ข้อความ..." value={txt}
          onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} style={{padding:'8px 10px',fontSize:13}}/>
        <button className="btn sm" onClick={send}>▶</button>
      </div>
    </Win>
  );
}


Object.assign(window, { NetWorthPanel, AgentsPanel, QuantBotPanel, CompanyStatusPanel, MarketPanel, LofiPanel, TradingPanel, TeamChatMini, Bubble });



export default Dashboard;
