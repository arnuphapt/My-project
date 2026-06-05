import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, PageHead } from '../components/UI.jsx';
import { saveSetting } from '../api/settings.js';
import { getTeamCfg } from '../components/team/teamConfig.js';
import '../store/image-slot.js';

/* ============ SETTINGS ============ */
const ACCENTS = [
  ['cyan', '#46b6ff', 'ฟ้า'],
  ['teal', '#2fe0c2', 'เขียวน้ำทะเล'],
  ['violet', '#9d6bff', 'ม่วง'],
  ['gold', '#ffce4a', 'ทอง'],
  ['rose', '#ff6b9d', 'ชมพู'],
  ['custom', '', 'กำหนดเอง'],
];

function Settings() {
  const [s] = useOffice();
  const cfg = s.settings || {};
  const [saveStatus, setSaveStatus] = useS(''); // 'saving' | 'saved' | ''
  const saveTimeout = React.useRef(null);

  const upd = patch => {
    OfficeStore.setState(st => ({ ...st, settings: { ...st.settings, ...patch } }), { now: true });
    
    // Auto-save to database with debounce
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('กำลังบันทึก...');
    
    saveTimeout.current = setTimeout(async () => {
      try {
        for (const [key, val] of Object.entries(patch)) {
          // If val is an object (like teamConfig), we must stringify it or handle it properly in backend.
          // Assuming saveSetting handles strings best, we JSON.stringify objects.
          const toSave = typeof val === 'object' ? JSON.stringify(val) : String(val);
          await saveSetting(key, toSave);
        }
        setSaveStatus('บันทึกแล้ว ✓');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus('บันทึกไม่สำเร็จ ❌');
        console.error("Save setting error:", err);
      }
    }, 1000);
  };

  const F = (key, val) => upd({ [key]: val });

  const [geminiKey, setGeminiKey] = useS('');

  useE(() => {
    if (window.electronAPI) {
      window.electronAPI.getSetting('gemini_api_key').then(k => setGeminiKey(k || ''));
    }
  }, []);

  const handleKeySave = (val) => {
    setGeminiKey(val);
    if (window.electronAPI) window.electronAPI.saveSetting('gemini_api_key', val);
  };

  const reset = async () => {
    if (confirm('คืนค่าตั้งต้นทั้งหมด? (ระบบจะถูกล้างค่ากลับเป็นค่าพื้นฐาน)')) {
      const defaultSettings = window.SEED.settings;
      OfficeStore.setState(st => ({ ...st, settings: { ...defaultSettings } }), { now: true });
      window.electronAPI?.saveLog('warning', 'System reset to default settings');
      setSaveStatus('กำลังรีเซ็ต...');
      try {
        for (const [key, val] of Object.entries(defaultSettings)) {
          await saveSetting(key, String(val));
        }
        setSaveStatus('รีเซ็ตสำเร็จ ✓');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch(err) {
        setSaveStatus('รีเซ็ตไม่สำเร็จ ❌');
      }
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-[22px] py-5 pb-20">
      <PageHead
        title="MASTER CONFIG"
        sub="ตั้งค่าตัวตนของระบบ และคัสตอมข้อมูลในระบบได้โดยไม่ต้องแก้โค้ด"
        right={
          <div className="flex items-center gap-3">
            {saveStatus && <span className="text-[12px] font-mono text-cyan">{saveStatus}</span>}
            <button className="btn ghost" onClick={reset}>คืนค่าตั้งต้น</button>
          </div>
        }
      />

      <div className="grid grid-cols-[1fr_1fr] gap-4 items-start">
        {/* ---------- LEFT COLUMN ---------- */}
        <div className="flex flex-col gap-4">
          
          <Win title="SYSTEM IDENTITY" bodyStyle={{ padding: 18 }}>
            <SecTitle>ตัวตนของระบบ</SecTitle>

            <div className="flex gap-4 items-start mb-4">
              <div className="flex-none">
                <label className="lbl">โลโก้</label>
                <div className="w-[88px] h-[88px] rounded-xl relative overflow-hidden border border-[#2f456e] bg-gradient-to-br from-[#2f4ea8] to-[#6a4cb8]">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[30px] text-white">
                    {(cfg.sysName1 || 'M').trim()[0] || 'M'}
                  </div>
                  <image-slot id="sys-logo" shape="rounded" radius="12" className="absolute inset-0 w-[88px] h-[88px]"/>
                </div>
              </div>

              <div className="flex-1">
                <label className="lbl">ชื่อระบบ</label>
                <div className="flex gap-2">
                  <input className="fld uppercase" value={cfg.sysName1 || ''} maxLength={10} onChange={e => F('sysName1', e.target.value)} placeholder="MY"/>
                  <input className="fld uppercase" value={cfg.sysName2 || ''} maxLength={12} onChange={e => F('sysName2', e.target.value)} placeholder="OFFICE"/>
                </div>
                <label className="lbl mt-3.25">คำโปรย (Tagline)</label>
                <input className="fld" value={cfg.tagline || ''} onChange={e => F('tagline', e.target.value)} placeholder="ระบบจัดการชีวิตของฉัน"/>
              </div>
            </div>

            <label className="lbl">สีหลักของระบบ (Accent Color)</label>
            <div className="flex gap-2.25 mt-1 items-center">
              {ACCENTS.map(([id, hex, th]) => (
                <button
                  key={id}
                  onClick={() => F('accent', id)}
                  title={th}
                  style={{
                    width: id === 'custom' ? 'auto' : 38,
                    height: 38,
                    padding: id === 'custom' ? '0 12px' : 0,
                    borderRadius: 9,
                    cursor: 'pointer',
                    background: id === 'custom' ? '#1a2235' : hex,
                    border: cfg.accent === id ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: cfg.accent === id ? `0 0 0 2px ${hex || '#fff'}` : '0 2px 6px rgba(0,0,0,.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: id === 'custom' ? '#fff' : '#0b0e16',
                    fontWeight: 900,
                    fontSize: id === 'custom' ? 12 : 16
                  }}
                >
                  {id === 'custom' ? '🎨 Custom' : (cfg.accent === id ? '✓' : '')}
                </button>
              ))}
              {cfg.accent === 'custom' && (
                <input 
                  type="color" 
                  value={cfg.customAccentColor || '#46b6ff'} 
                  onChange={e => F('customAccentColor', e.target.value)}
                  style={{ width: 38, height: 38, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
              )}
            </div>
            {cfg.accent === 'custom' && <div className="font-mono text-[10px] text-text-mute mt-1.5">รหัสสี: {cfg.customAccentColor || '#46b6ff'}</div>}
          </Win>

          <Win title="API CONFIGURATION" accent="purple" bodyStyle={{ padding: 18 }}>
            <SecTitle>ตั้งค่าการเชื่อมต่อ AI</SecTitle>
            <label className="lbl">Gemini API Key</label>
            <input className="fld font-mono" type="password" value={geminiKey} onChange={e => handleKeySave(e.target.value)} placeholder="AIzaSy..."/>
            <div className="font-mono text-[10px] text-text-mute mt-1.25">
              บันทึกไว้ในเครื่องของคุณเท่านั้น · จำเป็นสำหรับใช้งานระบบ AI
            </div>
          </Win>
          
          <Win title="MY PROFILE" accent="gold" bodyStyle={{ padding: 18 }}>
            <SecTitle>ประวัติของฉัน</SecTitle>
            <div className="flex gap-3.5 items-start mb-3.5">
              <div className="flex-none">
                <label className="lbl">รูปโปรไฟล์</label>
                <div className="w-[72px] h-[72px] rounded-xl relative overflow-hidden border border-line">
                  <image-slot id="player-avatar" shape="rounded" radius="12" placeholder="YOU" className="absolute inset-0 w-[72px] h-[72px]"/>
                </div>
              </div>
              <div className="flex-1">
                <label className="lbl">ชื่อ-นามสกุล</label>
                <input className="fld" value={cfg.ownerName || ''} onChange={e => F('ownerName', e.target.value)} placeholder="ชื่อของคุณ" />
                <label className="lbl mt-2.75">ตำแหน่ง / บทบาท</label>
                <input className="fld" value={cfg.ownerRole || ''} onChange={e => F('ownerRole', e.target.value)} placeholder="เช่น Founder / Developer" />
              </div>
            </div>
            <label className="lbl mt-3.25">เกี่ยวกับฉัน (Bio)</label>
            <textarea className="fld" rows="3" value={cfg.bio || ''} onChange={e => F('bio', e.target.value)} placeholder="เล่าสั้นๆ ว่าคุณคือใคร"/>
          </Win>
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="flex flex-col gap-4">
          <Win title="TEAM CONFIGURATION" accent="cyan" bodyStyle={{ padding: 18 }}>
            <SecTitle>จัดการข้อมูลการจ้างพนักงาน (Create Agent Modal)</SecTitle>
            <TeamConfigEditor teamConfig={cfg.teamConfig || getTeamCfg()} onUpdate={(newCfg) => F('teamConfig', newCfg)} />
          </Win>
        </div>
      </div>
    </div>
  );
}

/* ============ TEAM CONFIG EDITOR ============ */
function TeamConfigEditor({ teamConfig, onUpdate }) {
  const [tab, setTab] = useS('roles'); // roles | models | senior
  
  const updateRoles = (roles) => onUpdate({ ...teamConfig, ROLE_PRESETS: roles });
  const updateModels = (models) => onUpdate({ ...teamConfig, MODEL_INFO: models });
  const updateSenior = (senior) => onUpdate({ ...teamConfig, SENIOR: senior });

  return (
    <div>
      <div className="flex gap-2 mb-4 p-1.25 rounded-[11px] bg-[#080a12]/60 border border-line w-fit">
        <button className={'pf-tab' + (tab === 'roles' ? ' on' : '')} onClick={() => setTab('roles')}>บทบาท</button>
        <button className={'pf-tab' + (tab === 'models' ? ' on' : '')} onClick={() => setTab('models')}>โมเดล AI</button>
        <button className={'pf-tab' + (tab === 'senior' ? ' on' : '')} onClick={() => setTab('senior')}>ระดับ (Seniority)</button>
      </div>

      {tab === 'roles' && (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[11px] text-text-mute mb-1">ตั้งค่าตำแหน่งพนักงานที่เลือกได้ตอนจ้าง</div>
          {teamConfig.ROLE_PRESETS.map((r, i) => (
            <div key={i} className="flex gap-2 items-start bg-[#0b0e16] p-2 rounded-lg border border-line">
              <input className="fld text-center px-1" style={{ width: 45, flex: 'none' }} value={r.icon} onChange={e => { const arr = [...teamConfig.ROLE_PRESETS]; arr[i].icon = e.target.value; updateRoles(arr); }} />
              <div className="flex-1 flex flex-col gap-1.5" style={{ minWidth: 0 }}>
                <div className="flex gap-2">
                  <input className="fld" style={{ flex: 1, minWidth: 0 }} value={r.th} placeholder="ชื่อไทย" onChange={e => { const arr = [...teamConfig.ROLE_PRESETS]; arr[i].th = e.target.value; updateRoles(arr); }} />
                  <input className="fld" style={{ flex: 1, minWidth: 0 }} value={r.en} placeholder="ชื่อ ENG" onChange={e => { const arr = [...teamConfig.ROLE_PRESETS]; arr[i].en = e.target.value; updateRoles(arr); }} />
                </div>
                <input className="fld" style={{ width: '100%' }} value={r.desc} placeholder="คำอธิบายสั้นๆ" onChange={e => { const arr = [...teamConfig.ROLE_PRESETS]; arr[i].desc = e.target.value; updateRoles(arr); }} />
              </div>
              <button className="btn red sm ghost p-[4px_6px] flex-none" onClick={() => { const arr = teamConfig.ROLE_PRESETS.filter((_, idx) => idx !== i); updateRoles(arr); }}>✕</button>
            </div>
          ))}
          <button className="btn ghost sm mt-2" onClick={() => updateRoles([...teamConfig.ROLE_PRESETS, { en: 'NEW', th: 'ใหม่', icon: '✨', desc: 'รายละเอียด' }])}>＋ เพิ่มบทบาท</button>
        </div>
      )}

      {tab === 'models' && (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[11px] text-text-mute mb-1">จัดการโมเดล AI ที่มีให้เลือกใช้งาน</div>
          {Object.entries(teamConfig.MODEL_INFO).map(([key, m]) => (
            <div key={key} className="flex flex-col gap-2 bg-[#0b0e16] p-3 rounded-lg border border-line">
              <div className="flex gap-2 items-center">
                <input className="fld font-mono text-[12px] text-cyan" style={{ width: 85, flex: 'none' }} value={key} disabled title="Key หลัก (เปลี่ยนไม่ได้)" />
                <input className="fld" style={{ flex: 1, minWidth: 0 }} value={m.label} placeholder="ชื่อโมเดล" onChange={e => updateModels({ ...teamConfig.MODEL_INFO, [key]: { ...m, label: e.target.value } })} />
                <input type="color" className="w-[30px] h-[30px] rounded cursor-pointer border-none p-0 bg-transparent flex-none" value={m.col} onChange={e => updateModels({ ...teamConfig.MODEL_INFO, [key]: { ...m, col: e.target.value, glow: e.target.value + '55' } })} />
              </div>
              <div className="flex gap-2">
                <input className="fld" style={{ width: 85, flex: 'none' }} value={m.tier} placeholder="Tier" onChange={e => updateModels({ ...teamConfig.MODEL_INFO, [key]: { ...m, tier: e.target.value } })} />
                <input className="fld" style={{ flex: 1, minWidth: 0 }} value={m.desc} placeholder="คำอธิบาย" onChange={e => updateModels({ ...teamConfig.MODEL_INFO, [key]: { ...m, desc: e.target.value } })} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'senior' && (
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[11px] text-text-mute mb-1">จัดการระดับ Seniority (จำนวนดาวมีผลต่อความสามารถ)</div>
          {Object.entries(teamConfig.SENIOR).map(([key, s]) => (
            <div key={key} className="flex gap-2 items-center bg-[#0b0e16] p-2.5 rounded-lg border border-line">
              <div className="font-mono text-[11px] text-text-mute" style={{ width: 65, flex: 'none' }}>{key}</div>
              <input className="fld" style={{ flex: 1, minWidth: 0 }} value={s.label} onChange={e => updateSenior({ ...teamConfig.SENIOR, [key]: { ...s, label: e.target.value } })} />
              <input className="fld text-center" style={{ width: 45, flex: 'none' }} type="number" min="1" max="5" value={s.stars} onChange={e => updateSenior({ ...teamConfig.SENIOR, [key]: { ...s, stars: parseInt(e.target.value) || 1 } })} title="จำนวนดาว" />
              <input type="color" className="w-[30px] h-[30px] rounded cursor-pointer border-none p-0 bg-transparent flex-none" value={s.col} onChange={e => updateSenior({ ...teamConfig.SENIOR, [key]: { ...s, col: e.target.value, glow: e.target.value + '55' } })} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SecTitle({ children }) {
  return (
    <div className="font-pixel2 text-[11px] tracking-[0.5px] text-text-dim uppercase mb-3.5 pb-2.25 border-b border-line">
      {children}
    </div>
  );
}

export default Settings;
