import React from 'react';
import { useOffice, fmt } from '../store';
import { Bar } from './Bar';

const NAV = [
  ['dashboard','DASHBOARD','🏠'],
  ['warroom','WARROOM','🛰️'],
  ['portfolio','PORTFOLIO','📈'],
  ['projects','PROJECTS','💼'],
  ['team','TEAM','👥'],
  ['orgchart','ORG CHART','📊'],
  ['secretary','SECRETARY','💬'],
  ['assets','ASSETS','🗂️'],
  ['systemlogs','SYSTEM LOGS','📝'],
  ['settings','SETTINGS','⚙️'],
];

export function NavBar(){
  const [s,set]=useOffice();
  const p=s.player;
  const cfg=s.settings||{};
  let playerLevel = p.level;
  if (cfg.birthdate) {
    const ageDifMs = Date.now() - new Date(cfg.birthdate).getTime();
    if (ageDifMs > 0) {
      const ageDate = new Date(ageDifMs);
      playerLevel = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
  }
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
            <div className="font-pixel text-[9px] text-white">Lv. {playerLevel}</div>
            <div className="w-[96px] mt-[3px]"><Bar pct={p.xp/p.xpMax*100} tone="purple"/></div>
            <div className="font-mono text-[10px] text-text-mute mt-[2px]">{fmt.n(p.xp,0)} / {fmt.n(p.xpMax,0)} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
