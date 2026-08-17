import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { PageHead, Win, SumCard } from '../components/UI.jsx';

/* ============ HEALTH · สถานะเส้น API ต่างๆ ============ */

const HSTAT = {
  op:       { label: 'ใช้งานได้',    col: '#3ce594' },
  degraded: { label: 'หน่วง',        col: '#ffce4a' },
  down:     { label: 'ขัดข้อง',      col: '#ff5168' },
  idle:     { label: 'ไม่ได้เชื่อม', col: '#9aa6cf' },
  checking: { label: 'กำลังตรวจ',    col: '#46b6ff' },
};


const BASE_URL = 'http://127.0.0.1:8000';

function buildEndpoints(s) {
  const L = s.live || {};
  const ex = L.exchange || 'Binance';
  const exHost = { Binance: 'api.binance.com', Bybit: 'api.bybit.com', OKX: 'www.okx.com', MT5: 'mt5.broker.net' }[ex] || 'api.exchange.com';
  return [
    { id: 'claude_cli', group: 'AI · Worker Engines', name: 'Claude Code CLI (Yuri)', url: 'cli://claude --version', icon: '👑', isCli: true, worker: 'claude' },
    { id: 'codex_cli',  group: 'AI · Worker Engines', name: 'OpenAI Codex CLI',       url: 'cli://codex --version',  icon: '⚡', isCli: true, worker: 'codex' },
    { id: 'agy_cli',    group: 'AI · Worker Engines', name: 'Google Antigravity CLI',  url: 'cli://agy --version',    icon: '🔮', isCli: true, worker: 'agy' },
    { id: 'backend',    group: 'ระบบหลังบ้าน',        name: 'FastAPI Backend',        url: BASE_URL + '/',           icon: '🤖', realUrl: BASE_URL + '/' },
    { id: 'storage',    group: 'ระบบ',                name: 'Local Storage',          url: 'browser://localStorage', icon: '💾', localStorage: true },
    { id: 'exchange',   group: 'การลงทุน',            name: ex + ' API',              url: exHost + '/api/v3',       icon: '📈', base: 120, gated: !L.connected },
    { id: 'webhook',    group: 'การลงทุน',            name: 'TradingView Webhook',    url: 'my-office.app/hook/…-tv', icon: '🪝', base: 95,  gated: !L.connected },
  ];
}

async function pingEndpoint(ep) {
  // CLI status check via electronAPI
  if (ep.isCli && window.electronAPI?.checkCliStatus) {
    const t = performance.now();
    try {
      const res = await window.electronAPI.checkCliStatus();
      const st = res ? res[ep.worker] : null;
      const lat = Math.round(performance.now() - t);
      if (st && st.installed) {
        return { status: 'op', latency: lat, detail: st.version };
      }
      return { status: 'down', latency: 0, detail: 'Not installed or not on PATH' };
    } catch (e) {
      return { status: 'down', latency: 0 };
    }
  }
  // localStorage — real sync test
  if (ep.localStorage) {
    const t = performance.now();
    try {
      localStorage.setItem('__hp_ping', '1');
      localStorage.getItem('__hp_ping');
      localStorage.removeItem('__hp_ping');
      return { status: 'op', latency: Math.max(1, Math.round((performance.now() - t) * 10) / 10) };
    } catch (e) { return { status: 'down', latency: 0 }; }
  }
  // gated (not configured)
  if (ep.gated) return { status: 'idle', latency: 0 };
  // real HTTP ping
  if (ep.realUrl) {
    const t = performance.now();
    try {
      const res = await fetch(ep.realUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
      const lat = Math.round(performance.now() - t);
      if (!res.ok && res.status !== 401 && res.status !== 403) return { status: 'down', latency: lat };
      return { status: lat > 800 ? 'degraded' : 'op', latency: lat };
    } catch (e) {
      if (e.name === 'TimeoutError' || e.name === 'AbortError') return { status: 'down', latency: 5000 };
      return { status: 'down', latency: 0 };
    }
  }
  // mock fallback (CORS-blocked external endpoints)
  return { status: 'idle', latency: 0 };
}

function HDot({ status, pulse }) {
  const c = HSTAT[status]?.col || '#9aa6cf';
  return (
    <span className={'hp-dot' + (pulse ? ' pulse' : '')}
      style={{ background: c, boxShadow: status === 'idle' ? 'none' : '0 0 8px ' + c }} />
  );
}

function HPill({ status }) {
  const st = HSTAT[status] || HSTAT.idle;
  return (
    <span className="hp-pill" style={{ color: st.col, borderColor: st.col + '66', background: st.col + '14' }}>
      <HDot status={status} pulse={status === 'checking'} />{st.label}
    </span>
  );
}

function HSpark({ history, status }) {
  const c = HSTAT[status]?.col || '#46b6ff';
  const max = Math.max(60, ...history.map(h => h.latency || 0));
  const slots = 12, pad = Math.max(0, slots - history.length);
  return (
    <div className="hp-spark" title="ประวัติ latency">
      {Array.from({ length: pad }).map((_, i) => <i key={'p' + i} style={{ height: 2, opacity: .18, background: 'var(--text-mute)' }} />)}
      {history.slice(-slots).map((h, i) => {
        const dc = HSTAT[h.status]?.col || c;
        const hgt = h.status === 'down' ? 26 : (h.status === 'idle' ? 2 : Math.max(3, Math.round((h.latency / max) * 26)));
        return <i key={i} style={{ height: hgt, background: dc, opacity: h.status === 'down' ? .5 : .85 }} />;
      })}
    </div>
  );
}

export default function Health() {
  const [s] = useOffice();
  const eps = React.useMemo(() => buildEndpoints(s), [s.live]); // eslint-disable-line react-hooks/exhaustive-deps
  const [res, setRes] = useS({});
  const [checking, setChecking] = useS({});
  const [lastFull, setLastFull] = useS('—');
  const [auto, setAuto] = useS(false);


  const runOne = (ep) => {
    setChecking(c => ({ ...c, [ep.id]: true }));
    pingEndpoint(ep).then(r => {
      setRes(prev => {
        const old = prev[ep.id] || { history: [] };
        const history = [...(old.history || []), { status: r.status, latency: r.latency }].slice(-24);
        return { ...prev, [ep.id]: { status: r.status, latency: r.latency, history, last: OfficeStore.clock() } };
      });
      setChecking(c => ({ ...c, [ep.id]: false }));
    });
  };

  const runAll = () => { eps.forEach(ep => runOne(ep)); setLastFull(OfficeStore.clock()); };

  useE(() => { runAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useE(() => {
    if (!auto) return;
    const iv = setInterval(() => runAll(), 12000);
    return () => clearInterval(iv);
  }, [auto, eps]); // eslint-disable-line react-hooks/exhaustive-deps

  const statuses = eps.map(ep => checking[ep.id] ? 'checking' : (res[ep.id]?.status || 'idle'));
  const cnt = k => statuses.filter(x => x === k).length;
  const opN = cnt('op'), degN = cnt('degraded'), downN = cnt('down'), idleN = cnt('idle'), chkN = cnt('checking');
  const lats = eps.map(ep => res[ep.id]).filter(r => r && r.status !== 'idle' && r.status !== 'down').map(r => r.latency);
  const avgLat = lats.length ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length) : 0;

  const overall = chkN > 0 ? 'checking' : (downN > 0 ? 'down' : (degN > 0 ? 'degraded' : 'op'));
  const banner = {
    op:       { t: 'ทุกระบบทำงานปกติ',       d: 'เส้น API ทั้งหมดตอบสนองภายในเกณฑ์' },
    degraded: { t: 'บางบริการตอบสนองช้า',     d: degN + ' บริการมีอาการหน่วง — ติดตามอาการต่อ' },
    down:     { t: 'มีบริการขัดข้อง',         d: downN + ' บริการไม่ตอบสนอง ตรวจสอบการเชื่อมต่อ' },
    checking: { t: 'กำลังตรวจสอบระบบ…',       d: 'กำลัง ping เส้น API ทั้งหมด' },
  }[overall];
  const bc = HSTAT[overall].col;
  const groups = [...new Set(eps.map(e => e.group))];

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 22px' }}>
      <PageHead title="HEALTH" sub="ศูนย์ตรวจสอบสถานะ — เช็คว่าเส้น API และบริการต่างๆ ยังออนไลน์อยู่ไหม"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={'btn sm ' + (auto ? '' : 'ghost')} onClick={() => setAuto(a => !a)}
              style={auto ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}>
              {auto ? '● Auto 12s' : '○ Auto'}
            </button>
            <button className="btn" onClick={runAll} disabled={chkN > 0}>
              {chkN > 0 ? 'กำลังตรวจ…' : '↻ ตรวจสอบทั้งหมด'}
            </button>
          </div>
        }
      />

      {/* overall banner */}
      <div className="hp-banner" style={{ borderColor: bc + '66', background: bc + '10' }}>
        <HDot status={overall} pulse={overall === 'checking'} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 17, color: 'var(--white)' }}>{banner.t}</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{banner.d}</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)' }}>
          <div>ตรวจล่าสุด</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>{lastFull}</div>
        </div>
      </div>

      {/* summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <SumCard label="ใช้งานได้"       main={opN + ''}            sub={'จาก ' + eps.length + ' บริการ'}    tone="pos" />
        <SumCard label="หน่วง / ขัดข้อง" main={(degN + downN) + ''} sub={degN + ' หน่วง · ' + downN + ' ขัดข้อง'} tone={(degN + downN) > 0 ? 'gold' : 'cyan'} />
        <SumCard label="ไม่ได้เชื่อมต่อ"  main={idleN + ''}           sub="รอการตั้งค่า"                        tone="cyan" />
        <SumCard label="Latency เฉลี่ย"   main={avgLat > 0 ? avgLat + 'ms' : '—'} sub="เฉพาะบริการที่ออนไลน์"  tone={avgLat > 300 ? 'gold' : 'pos'} />
      </div>

      {/* grouped endpoints */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.map(g => (
          <Win key={g} title={g} bodyStyle={{ padding: '4px 16px 8px' }}>
            {eps.filter(e => e.group === g).map(ep => {
              const st = checking[ep.id] ? 'checking' : (res[ep.id]?.status || 'idle');
              const r = res[ep.id];
              const c = HSTAT[st].col;
              return (
                <div key={ep.id} className="hp-row">
                  <div style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{ep.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14.5, color: 'var(--white)' }}>{ep.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.url}</div>
                  </div>
                  <HSpark history={r?.history || []} status={st} />
                  <div style={{ textAlign: 'right', minWidth: 64 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 15, color: (st === 'idle' || st === 'down') ? 'var(--text-mute)' : c }}>
                      {st === 'checking' ? '···' : (st === 'idle' ? '—' : (st === 'down' ? 'timeout' : r?.latency + 'ms'))}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>{r?.last || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', minWidth: 150 }}>
                    <HPill status={st} />
                    <button className="btn ghost sm" onClick={() => runOne(ep)} disabled={checking[ep.id]} title="ตรวจซ้ำ"
                      style={{ padding: '5px 9px' }}>↻</button>
                  </div>
                </div>
              );
            })}
          </Win>
        ))}
      </div>

      {eps.some(e => e.gated) && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-mute)', marginTop: 14, lineHeight: 1.6 }}>
          ℹ️ บริการที่ขึ้น <span style={{ color: '#9aa6cf' }}>ไม่ได้เชื่อม</span> ยังไม่ได้ตั้งค่า — ไปเชื่อมต่อได้ที่หน้า <span style={{ color: 'var(--cyan)' }}>Portfolio → ลงทุนจริง</span>
        </div>
      )}
    </div>
  );
}
