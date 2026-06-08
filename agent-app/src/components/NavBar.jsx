import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOffice, fmt } from '../store';
import { Bar } from './Bar';
import {
  LayoutDashboard,
  Radio,
  TrendingUp,
  Briefcase,
  Users,
  Network,
  MessageSquare,
  FolderOpen,
  FileText,
  Settings as SettingsIcon,
  Coins,
  Gem,
  CheckSquare,
  Activity,
  BookOpen,
} from 'lucide-react';

const NAV = [
  ['dashboard','DASHBOARD'],
  ['warroom','WARROOM'],
  ['tasks','TASKS'],
  ['portfolio','PORTFOLIO'],
  ['projects','PROJECTS'],
  ['team','TEAM'],
  ['orgchart','ORG CHART'],
  ['secretary','SECRETARY'],
  ['skills','SKILLS'],
  ['health','HEALTH'],
  ['assets','ASSETS'],
  ['systemlogs','SYSTEM LOGS'],
  ['settings','SETTINGS'],
];

function NavIcon({ id, className }) {
  switch (id) {
    case 'dashboard': return <LayoutDashboard className={className} />;
    case 'warroom': return <Radio className={className} />;
    case 'tasks': return <CheckSquare className={className} />;
    case 'portfolio': return <TrendingUp className={className} />;
    case 'projects': return <Briefcase className={className} />;
    case 'team': return <Users className={className} />;
    case 'orgchart': return <Network className={className} />;
    case 'secretary': return <MessageSquare className={className} />;
    case 'skills': return <BookOpen className={className} />;
    case 'health': return <Activity className={className} />;
    case 'assets': return <FolderOpen className={className} />;
    case 'systemlogs': return <FileText className={className} />;
    case 'settings': return <SettingsIcon className={className} />;
    default: return null;
  }
}

export function NavBar(){
  const [s, set] = useOffice();
  const navigate = useNavigate();
  const location = useLocation();
  const p = s.player;
  const cfg = s.settings || {};

  let playerLevel = p.level;
  let xp = p.xp;
  let xpMax = p.xpMax;
  if (cfg.ownerBirth || cfg.birthdate) {
    const birth = new Date(cfg.ownerBirth || cfg.birthdate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hadBirthday = (now.getMonth() > birth.getMonth()) ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hadBirthday) age--;
    if (age >= 0) {
      playerLevel = age;
      const lastBday = new Date(birth);
      lastBday.setFullYear(now.getFullYear() - (hadBirthday ? 0 : 1));
      const daysSince = Math.floor((now - lastBday) / 86400000);
      xp = daysSince;
      xpMax = 365;
    }
  }

  const logoLetter = (cfg.sysName1 || 'M').trim()[0] || 'M';

  // Active route is determined from URL, not store, so it always matches
  const activeRoute = location.pathname.replace(/^\//, '') || 'dashboard';

  const goTo = (id) => {
    navigate('/' + id);
    set({ route: id });
  };

  return (
    <div className="nav">
      <div onClick={() => goTo('settings')} title="ตั้งค่าระบบ" className="flex items-center gap-2.5 mr-3.5 min-w-0 cursor-pointer">
        <div className="w-[38px] h-[38px] rounded-[9px] relative flex-none border border-[#2f456e] shadow-[0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden bg-gradient-to-br from-[#2f4ea8] to-[#6a4cb8]">
          <image-slot id="sys-logo" shape="rounded" radius="8" placeholder=""
            className="absolute inset-0 w-[38px] h-[38px]"></image-slot>
          <div className="slot-letter absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[14px] text-white">{logoLetter}</div>
        </div>
        <div className="leading-[1.2] min-w-0">
          <div className="font-pixel text-[10px] text-white tracking-[1px]">{cfg.sysName1 || 'MY'}</div>
          <div className="font-pixel text-[10px] text-cyan tracking-[1px]">{cfg.sysName2 || 'OFFICE'}</div>
        </div>
      </div>
      <div className="flex gap-1 flex-1">
        {NAV.map(([id, lb]) => (
          <div
            key={id}
            className={'nav-item' + (activeRoute === id ? ' on' : '')}
            onClick={() => goTo(id)}
          >
            <span className="ic flex items-center justify-center"><NavIcon id={id} className="w-4 h-4" /></span><span className="lb">{lb}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-[7px] font-mono text-[15px] text-gold">
          <Coins className="w-4 h-4 text-gold" />{fmt.n(p.coins, 0)}
        </div>
        <div className="flex items-center gap-[7px] font-mono text-[15px] text-purple">
          <Gem className="w-4 h-4 text-purple" />{p.gems}
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] rounded-[9px] relative flex-none">
            <image-slot id="player-avatar" shape="rounded" radius="8" placeholder="YOU"
              className="w-[42px] h-[42px]"></image-slot>
          </div>
          <div className="leading-[1.35]">
            <div className="font-pixel text-[9px] text-white">Lv. {playerLevel}</div>
            <div className="w-[96px] mt-[3px]"><Bar pct={xp/xpMax*100} tone="purple"/></div>
            <div className="font-mono text-[10px] text-text-mute mt-[2px]">{fmt.n(xp,0)} / {fmt.n(xpMax,0)} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
