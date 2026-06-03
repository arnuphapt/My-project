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

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
