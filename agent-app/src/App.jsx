import React, { useEffect as useE } from 'react';
import './assets/index.css';
import '../../image-slot.js';
import { OfficeStore, useOffice } from './store/store.js';
import { NavBar } from './components/UI.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WarRoom from './pages/Warroom.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Team from './pages/Team.jsx';
import Secretary from './pages/Secretary.jsx';
import Projects from './pages/Projects.jsx';
import Assets from './pages/Assets.jsx';
import Settings from './pages/Settings.jsx';
import SystemLogs from './SystemLogs.jsx';


/* ============ APP ROOT ============ */
function App(){
  const [s]=useOffice();
  useE(()=>{ OfficeStore.startTicker(); },[]);

  // apply accent color globally
  const accent=(s.settings&&s.settings.accent)||'cyan';
  useE(()=>{
    const map={cyan:'#46b6ff',teal:'#2fe0c2',violet:'#9d6bff',gold:'#ffce4a',rose:'#ff6b9d'};
    document.documentElement.style.setProperty('--cyan', map[accent]||map.cyan);
  },[accent]);

  const route=s.route;
  const Page = {
    dashboard: Dashboard,
    warroom:   WarRoom,
    portfolio: Portfolio,
    projects:  Projects,
    team:      Team,
    secretary: Secretary,
    assets:    Assets,
    systemlogs: SystemLogs,
    settings:  Settings,
  }[route] || Dashboard;

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column'}}>
      <NavBar/>
      <div className="view flicker" key={route}>
        <Page/>
      </div>
    </div>
  );
}




export default App;
