import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, PageHead } from '../components/UI.jsx';
import { saveSetting } from '../api/settings.js';
import '../store/image-slot.js';
import { getRolePresets, getModelInfo } from '../components/team/teamConfig.js';

/* ============ SETTINGS (MASTER CONFIG) ============ */
const ACCENTS = [
  ['cyan', '#46b6ff', 'ฟ้า'],
  ['teal', '#2fe0c2', 'เขียวน้ำทะเล'],
  ['violet', '#9d6bff', 'ม่วง'],
  ['gold', '#ffce4a', 'ทอง'],
  ['rose', '#ff6b9d', 'ชมพู'],
];

function Settings() {
  const [s] = useOffice();
  const cfg = s.settings || {};
  const [saveStatus, setSaveStatus] = useS(''); // 'saving' | 'saved' | ''
  const saveTimeout = React.useRef(null);

  const upd = patch => {
    OfficeStore.setState(st => ({ ...st, settings: { ...st.settings, ...patch } }), { now: true });
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaveStatus('กำลังบันทึก...');
    
    saveTimeout.current = setTimeout(async () => {
      try {
        for (const [key, val] of Object.entries(patch)) {
          // If the value is an object (like customRoles), stringify it for DB, 
          // or assume backend supports JSON. For safety:
          const storeVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          await saveSetting(key, storeVal);
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
    if (confirm('คืนค่าตั้งต้นทั้งหมด? (ข้อมูลการตั้งค่าจะถูกล้าง)')) {
      const defaultSettings = window.SEED?.settings || {};
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

  // Team Config State
  const roles = getRolePresets();
  const models = getModelInfo();

  return (
    <div className="max-w-[1040px] mx-auto px-[22px] py-5">
      <PageHead
        title="MASTER CONFIG"
        sub="ตั้งค่าและปรับแต่งระบบ — ตัวตน, โทนสี, ข้อมูล Modal และการเชื่อมต่อ AI"
        right={
          <div className="flex items-center gap-3">
            {saveStatus && <span className="text-[12px] font-mono text-cyan">{saveStatus}</span>}
            <button className="btn ghost" onClick={reset}>คืนค่าตั้งต้น</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4">
          {/* ---------- SYSTEM IDENTITY ---------- */}
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
                <div className="font-mono text-[10px] text-text-mute mt-1.25">2 บรรทัด — โชว์มุมซ้ายบน</div>
                <label className="lbl mt-3.25">คำโปรย (Tagline)</label>
                <input className="fld" value={cfg.tagline || ''} onChange={e => F('tagline', e.target.value)} placeholder="ระบบจัดการชีวิตของฉัน"/>
              </div>
            </div>

            <label className="lbl">สีหลักของระบบ (Accent Color)</label>
            <div className="flex gap-2.25 mt-1 items-center">
              {ACCENTS.map(([id, hex, th]) => (
                <button key={id} onClick={() => F('accent', id)} title={th} style={{
                    width: 38, height: 38, borderRadius: 9, cursor: 'pointer', background: hex,
                    border: cfg.accent === id ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: cfg.accent === id ? '0 0 0 2px ' + hex : '0 2px 6px rgba(0,0,0,.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0e16', fontWeight: 900
                  }}>
                  {cfg.accent === id ? '✓' : ''}
                </button>
              ))}
              <div className="w-[1px] h-6 bg-line mx-1"/>
              <div className="flex items-center gap-2">
                <div style={{
                  width: 38, height: 38, borderRadius: 9, overflow: 'hidden', cursor: 'pointer',
                  border: cfg.accent?.startsWith('#') ? '2px solid #fff' : '1px solid var(--line)',
                  boxShadow: cfg.accent?.startsWith('#') ? '0 0 0 2px ' + cfg.accent : 'none',
                  position: 'relative'
                }}>
                  <input 
                    type="color" 
                    value={cfg.accent?.startsWith('#') ? cfg.accent : '#ffffff'} 
                    onChange={e => F('accent', e.target.value)}
                    style={{ position: 'absolute', inset: -5, width: 50, height: 50, cursor: 'pointer' }}
                    title="Custom Color"
                  />
                </div>
                <span className="font-mono text-[11px] text-text-mute">Custom</span>
              </div>
            </div>
          </Win>

          {/* ---------- API CONFIG ---------- */}
          <Win title="API CONFIGURATION" accent="purple" bodyStyle={{ padding: 18 }}>
            <SecTitle>ตั้งค่าการเชื่อมต่อ AI</SecTitle>
            <label className="lbl">Gemini API Key</label>
            <input className="fld font-mono" type="password" value={geminiKey} onChange={e => handleKeySave(e.target.value)} placeholder="AIzaSy..."/>
            <div className="font-mono text-[10px] text-text-mute mt-1.25">
              บันทึกไว้ในเครื่องของคุณเท่านั้น · จำเป็นสำหรับใช้งานระบบ AI
            </div>
          </Win>
        </div>

        {/* ---------- TEAM MODAL CONFIG ---------- */}
        <div className="flex flex-col gap-4">
          <Win title="TEAM MODAL (NO-CODE)" accent="gold" bodyStyle={{ padding: 18 }}>
            <SecTitle>ปรับแต่งตัวเลือกเพิ่มพนักงาน</SecTitle>
            
            <label className="lbl flex justify-between items-center mb-2">
              <span>ตำแหน่งหน้าที่ (Roles)</span>
              <button className="text-cyan text-[11px] hover:underline cursor-pointer" onClick={() => {
                const newRoles = [...roles, { en: 'NEW_ROLE', th: 'ตำแหน่งใหม่', icon: '✨', desc: 'รายละเอียด' }];
                F('customRoles', newRoles);
              }}>+ เพิ่มตำแหน่ง</button>
            </label>
            <div className="flex flex-col gap-2 mb-4 max-h-[160px] overflow-y-auto pr-2">
              {roles.map((r, i) => (
                <div key={i} className="flex gap-2 items-center bg-[#080c1a] p-2 rounded-lg border border-line">
                  <input className="fld w-12 text-center !p-[6px]" value={r.icon} onChange={e => {
                    const nr = [...roles]; nr[i].icon = e.target.value; F('customRoles', nr);
                  }}/>
                  <div className="flex flex-col gap-1 flex-1">
                    <input className="fld !p-[4px_8px] text-[12px]" value={r.th} onChange={e => {
                      const nr = [...roles]; nr[i].th = e.target.value; F('customRoles', nr);
                    }}/>
                    <input className="fld !p-[4px_8px] text-[10px] text-text-mute" value={r.desc} placeholder="คำอธิบาย" onChange={e => {
                      const nr = [...roles]; nr[i].desc = e.target.value; F('customRoles', nr);
                    }}/>
                  </div>
                  <button className="w-6 h-6 text-red opacity-50 hover:opacity-100 flex items-center justify-center" onClick={() => {
                    if(confirm('ลบตำแหน่งนี้?')) {
                      const nr = roles.filter((_, idx) => idx !== i); F('customRoles', nr);
                    }
                  }}>✕</button>
                </div>
              ))}
            </div>

            <label className="lbl mt-2 mb-2">โมเดล AI (Models)</label>
            <div className="flex flex-col gap-2">
              {Object.entries(models).map(([k, m]) => (
                <div key={k} className="flex gap-2 items-center bg-[#080c1a] p-2 rounded-lg border border-line" style={{ borderLeft: `3px solid ${m.col}` }}>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex gap-2">
                      <input className="fld !p-[4px_8px] text-[12px] flex-1" value={m.label} onChange={e => {
                        const nm = { ...models, [k]: { ...m, label: e.target.value } }; F('customModelInfo', nm);
                      }}/>
                      <input className="fld !p-[4px_8px] text-[11px] w-20" value={m.tier} onChange={e => {
                        const nm = { ...models, [k]: { ...m, tier: e.target.value } }; F('customModelInfo', nm);
                      }}/>
                    </div>
                    <input className="fld !p-[4px_8px] text-[10px] text-text-mute" value={m.desc} onChange={e => {
                      const nm = { ...models, [k]: { ...m, desc: e.target.value } }; F('customModelInfo', nm);
                    }}/>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--line)', position: 'relative', flexShrink: 0 }}>
                    <input type="color" value={m.col} onChange={e => {
                      const nm = { ...models, [k]: { ...m, col: e.target.value } }; F('customModelInfo', nm);
                    }} style={{ position: 'absolute', inset: -5, width: 40, height: 40, cursor: 'pointer' }}/>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center text-text-mute font-mono text-[10px] mt-4 mb-1">
              การเปลี่ยนแปลงจะมีผลในหน้า Team &gt; เพิ่มพนักงาน ทันที
            </div>
          </Win>
        </div>
      </div>
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
