import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, fmt } from '../store';
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
    <div className="relative flex-none" style={{width:size,height:size}}>
      <image-slot id={id} shape="rounded" radius="8"
        placeholder={agent.name}
        style={{width:size+'px',height:size+'px'}}></image-slot>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel"
        style={{fontSize:(size/3.6)+'px',color:agent.color, textShadow:'0 0 8px '+agent.color+'88'}}>{agent.name[0]}</div>
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
      <div onClick={()=>set({route:'settings'})} title="ตั้งค่าระบบ" className="flex items-center gap-2.5 mr-3.5 min-w-0 cursor-pointer">
        <div className="w-[38px] h-[38px] rounded-[9px] relative flex-none border border-[#2f456e] shadow-[0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden bg-gradient-to-br from-[#2f4ea8] to-[#6a4cb8]">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[14px] text-white">{logoLetter}</div>
          <image-slot id="sys-logo" shape="rounded" radius="8" placeholder=""
            className="absolute inset-0 w-[38px] h-[38px]"></image-slot>
        </div>
        <div className="leading-[1.2] min-w-0">
          <div className="font-pixel text-[10px] text-white tracking-[1px]">{cfg.sysName1||'MY'}</div>
          <div className="font-pixel text-[10px] text-cyan tracking-[1px]">{cfg.sysName2||'OFFICE'}</div>
        </div>
      </div>
      <div className="flex gap-1 flex-1">
        {NAV.map(([id,lb,ic])=>(
          <div key={id} className={'nav-item'+(s.route===id?' on':'')} onClick={()=>set({route:id})}>
            <span className="ic">{ic}</span><span className="lb">{lb}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-[7px] font-mono text-[15px] text-gold">
          <span className="text-[16px]">🪙</span>{fmt.n(p.coins,0)}
        </div>
        <div className="flex items-center gap-[7px] font-mono text-[15px] text-purple">
          <span className="text-[16px]">💎</span>{p.gems}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] rounded-[9px] relative flex-none">
            <image-slot id="player-avatar" shape="rounded" radius="8" placeholder="YOU"
              className="w-[42px] h-[42px]"></image-slot>
          </div>
          <div className="leading-[1.35]">
            <div className="font-pixel text-[9px] text-white">Lv. {p.level}</div>
            <div className="w-[96px] mt-[3px]"><Bar pct={p.xp/p.xpMax*100} tone="purple"/></div>
            <div className="font-mono text-[10px] text-text-mute mt-[2px]">{fmt.n(p.xp,0)} / {fmt.n(p.xpMax,0)} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* page header used on inner pages */
function PageHead({ title, th, sub, right }){
  return (
    <div className="flex items-end justify-between gap-4 mb-[18px] flex-wrap">
      <div>
        <h1 className="title-xl text-[20px] tracking-[1px]">{title}</h1>
        {sub && <div className="text-text-dim text-[14px] mt-2 font-thai">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* modal */
function Modal({ title, th, onClose, children, width=520 }){
  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] bg-[#040614]/72 backdrop-blur-[3px] flex items-center justify-center p-5">
      <div onClick={e=>e.stopPropagation()} className="w-full" style={{maxWidth:width}}>
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

function SumCard({ label, main, sub, tone, onClick }){
  const colMap={gold:'text-gold',pos:'text-green',neg:'text-red',cyan:'text-cyan'};
  return (
    <div className={`win p-[14px_15px] transition-colors duration-200 ${onClick ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
      onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="font-pixel2 text-[11px] text-text-dim tracking-[.5px] mb-2">{label}</div>
        {onClick && <span className="text-[12px] text-text-dim opacity-60">✎</span>}
      </div>
      <div className={`font-mono text-[24px] leading-none ${colMap[tone] || 'text-white'}`}>{main}</div>
      <div className="font-mono text-[13px] text-text-mute mt-1.5">{sub}</div>
    </div>
  );
}

export { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY, SumCard };
