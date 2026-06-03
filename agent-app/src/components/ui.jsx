import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, fmt } from '../store/store.js';
const RARITY = { legend:['r-legend','LEGENDARY'], epic:['r-epic','EPIC'], rare:['r-rare','RARE'], common:['r-common','COMMON'] };

function Rarity({ r }){ const [c,l]=RARITY[r]||RARITY.common; return <span className={'rarity '+c}>{l}</span>; }

/* Window / panel chrome */
function Win({ title, th, accent, right, children, style, bodyStyle, className, onClose }){
  return (
    <div className={'win'+(accent?' accent-'+accent:'')+(className?' '+className:'')} style={style}>
      <div className="win-h">
        <span className={'ttl'+(th?' th':'')}>{title}</span>
        {right}
        <div className="win-dots">
          <i>_</i>
          <i onClick={onClose}>×</i>
        </div>
      </div>
      <div className="win-b" style={bodyStyle}>{children}</div>
    </div>
  );
}

function Row({ k, v, cls }){
  return <div className="kv"><span className="k">{k}</span><span className={'v '+(cls||'')}>{v}</span></div>;
}

function Bar({ pct, tone }){
  return <div className={'bar'+(tone?' '+tone:'')}><i style={{width:Math.max(0,Math.min(100,pct))+'%'}}></i></div>;
}

function StatusDot({ s }){ return <span className={'sdot s-'+s}></span>; }

/* small pixel avatar built from initials (placeholder until user drops art) */
function Avatar({ agent, size=44, slot }){
  const id = 'agent-'+agent.id;
  return (
    <div style={{width:size,height:size,position:'relative',flex:'none'}}>
      <image-slot id={id} shape="rounded" radius="8"
        placeholder={agent.name}
        style={{width:size+'px',height:size+'px'}}></image-slot>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
        pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:(size/3.6)+'px',color:agent.color,
        textShadow:'0 0 8px '+agent.color+'88'}}>{agent.name[0]}</div>
    </div>
  );
}

/* nav bar */
const NAV = [
  ['dashboard','DASHBOARD','🏠'],
  ['warroom','WARROOM','🛰️'],
  ['portfolio','PORTFOLIO','📈'],
  ['projects','PROJECTS','💼'],
  ['team','TEAM','👥'],
  ['secretary','SECRETARY','💬'],
  ['assets','ASSETS','🗂️'],
  ['systemlogs','SYSTEM LOGS','📝'],
  ['settings','SETTINGS','⚙️'],
];
function NavBar(){
  const [s,set]=useOffice();
  const p=s.player;
  const cfg=s.settings||{};
  const logoLetter=(cfg.sysName1||'M').trim()[0]||'M';
  return (
    <div className="nav">
      <div onClick={()=>set({route:'settings'})} title="ตั้งค่าระบบ" style={{display:'flex',alignItems:'center',gap:11,marginRight:14,minWidth:0,cursor:'pointer'}}>
        <div style={{width:38,height:38,borderRadius:9,position:'relative',flex:'none',
          border:'1px solid #2f456e',boxShadow:'0 4px 12px rgba(0,0,0,.4)',overflow:'hidden',
          background:'linear-gradient(135deg,#2f4ea8,#6a4cb8)'}}>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
            pointerEvents:'none',fontFamily:'var(--pixel)',fontSize:14,color:'#fff'}}>{logoLetter}</div>
          <image-slot id="sys-logo" shape="rounded" radius="8" placeholder=""
            style={{position:'absolute',inset:0,width:'38px',height:'38px'}}></image-slot>
        </div>
        <div style={{lineHeight:1.2,minWidth:0}}>
          <div style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--white)',letterSpacing:1}}>{cfg.sysName1||'MY'}</div>
          <div style={{fontFamily:'var(--pixel)',fontSize:10,color:'var(--cyan)',letterSpacing:1}}>{cfg.sysName2||'OFFICE'}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:4,flex:1}}>
        {NAV.map(([id,lb,ic])=>(
          <div key={id} className={'nav-item'+(s.route===id?' on':'')} onClick={()=>set({route:id})}>
            <span className="ic">{ic}</span><span className="lb">{lb}</span>
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:7,fontFamily:'var(--mono)',fontSize:15,color:'var(--gold)'}}>
          <span style={{fontSize:16}}>🪙</span>{fmt.n(p.coins,0)}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,fontFamily:'var(--mono)',fontSize:15,color:'var(--purple)'}}>
          <span style={{fontSize:16}}>💎</span>{p.gems}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:42,height:42,borderRadius:9,position:'relative',flex:'none'}}>
            <image-slot id="player-avatar" shape="rounded" radius="8" placeholder="YOU"
              style={{width:'42px',height:'42px'}}></image-slot>
          </div>
          <div style={{lineHeight:1.35}}>
            <div style={{fontFamily:'var(--pixel)',fontSize:9,color:'var(--white)'}}>Lv. {p.level}</div>
            <div style={{width:96,marginTop:3}}><Bar pct={p.xp/p.xpMax*100} tone="purple"/></div>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:2}}>{fmt.n(p.xp,0)} / {fmt.n(p.xpMax,0)} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* page header used on inner pages */
function PageHead({ title, th, sub, right }){
  return (
    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,marginBottom:18,flexWrap:'wrap'}}>
      <div>
        <h1 className="title-xl" style={{fontSize:20,letterSpacing:1}}>{title}</h1>
        {sub && <div style={{color:'var(--text-dim)',fontSize:14,marginTop:8,fontFamily:'var(--thai)'}}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* modal */
function Modal({ title, th, onClose, children, width=520 }){
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(4,6,20,.72)',
      backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:width}}>
        <Win title={title} th={th} onClose={onClose} bodyStyle={{padding:18}}>{children}</Win>
      </div>
    </div>
  );
}

function ClassTag({ cls }){
  const map={SET:['#3ce594','SET'],US:['#4db4ff','US'],FUND:['#ffce4a','FUND'],CRYPTO:['#b06bff','CRYPTO']};
  const [c,l]=map[cls]||['#9aa6cf',cls];
  return <span className="chip" style={{color:c,borderColor:c+'55'}}>{l}</span>;
}

function SumCard({ label, main, sub, tone }){
  const colMap={gold:'var(--gold)',pos:'var(--green)',neg:'var(--red)',cyan:'var(--cyan)'};
  return (
    <div className="win" style={{padding:'14px 15px'}}>
      <div style={{fontFamily:'var(--pixel2)',fontSize:11,color:'var(--text-dim)',letterSpacing:.5,marginBottom:8}}>{label}</div>
      <div style={{fontFamily:'var(--mono)',fontSize:24,color:colMap[tone]||'var(--white)',lineHeight:1}}>{main}</div>
      <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--text-mute)',marginTop:6}}>{sub}</div>
    </div>
  );
}

export { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY, SumCard };
