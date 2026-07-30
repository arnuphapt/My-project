import React, { useEffect as useE, useState as useS } from 'react';
import './assets/index.css';
import './store/image-slot.js';
import { OfficeStore, useOffice } from './store';
import { NavBar } from './components/UI.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WarRoom from './pages/Warroom.jsx';
import WebLive from './pages/WebLive.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Team from './pages/Team.jsx';
import OrgChart from './pages/OrgChart.jsx';
import Secretary from './pages/Secretary.jsx';
import Skills from './pages/Skills.jsx';
import Projects from './pages/Projects.jsx';
import Assets from './pages/Assets.jsx';
import Settings from './pages/Settings.jsx';
import SystemLogs from './pages/SystemLogs.jsx';
import Tasks from './pages/Tasks.jsx';
import Health from './pages/Health.jsx';
import { AssetBrowser } from './components/AssetBrowser.jsx';
import { ToastContainer } from './components/Toast.jsx';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

/* ============ ROUTE SYNC ============
   Keeps s.route in-sync with the URL so existing pages that read
   s.route (e.g. Dashboard quick-links) still work correctly.
   Navigation goes through the router; store is updated reactively.
 ============================================ */
function RouteSync() {
  const [s, set] = useOffice();
  const navigate = useNavigate();
  const location = useLocation();

  // When store route changes (e.g. a button inside Dashboard calls set({route:'team'}))
  // push that route into the URL.
  useE(() => {
    const targetPath = '/' + s.route;
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: false });
    }
  }, [s.route]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the URL changes (back/forward, or direct hash navigation)
  // update the store so all components see the right route.
  useE(() => {
    const routeFromUrl = location.pathname.replace(/^\//, '') || 'dashboard';
    if (s.route !== routeFromUrl) {
      set({ route: routeFromUrl });
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/* ============ APP ROOT ============ */
function App() {
  const [s] = useOffice();
  const [abTarget, setAbTarget] = useS(null);

  useE(() => { OfficeStore.startTicker(); }, []);

  useE(() => {
    const handleBrowse = (e) => {
      if (e.detail && e.detail.id) setAbTarget(e.detail.id);
    };
    window.addEventListener('browse-assets', handleBrowse);
    return () => window.removeEventListener('browse-assets', handleBrowse);
  }, []);

  // apply accent color globally
  const accent = s.settings?.accent || 'cyan';
  const customColor = s.settings?.customAccentColor;
  useE(() => {
    const map = { cyan: '#46b6ff', teal: '#2fe0c2', violet: '#9d6bff', gold: '#ffce4a', rose: '#ff6b9d' };
    const color = (accent === 'custom' && customColor) ? customColor : (map[accent] || map.cyan);
    document.documentElement.style.setProperty('--cyan', color);
  }, [accent, customColor]);

  return (
    <HashRouter>
      <RouteSync />
      <div className="h-screen flex flex-col">
        <NavBar />
        <div className="view flicker">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/warroom" element={<WarRoom />} />
            <Route path="/weblive" element={<WebLive />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/team" element={<Team />} />
            <Route path="/orgchart" element={<OrgChart />} />
            <Route path="/secretary" element={<Secretary />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/systemlogs" element={<SystemLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/health" element={<Health />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <ToastContainer />
      {abTarget && (
        <AssetBrowser 
          onClose={() => setAbTarget(null)} 
          onSelect={(url) => window.setImageSlot(abTarget, { u: url, s: 1, x: 0, y: 0 })} 
        />
      )}
    </HashRouter>
  );
}

export default App;
