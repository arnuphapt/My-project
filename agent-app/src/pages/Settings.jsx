import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, PageHead } from '../components/UI.jsx';
import { saveSetting } from '../api/settings.js';
import { getTeamCfg } from '../components/team/teamConfig.js';
import '../store/image-slot.js';
import { Check, XCircle, Palette, Sliders, Star, X, Plus } from 'lucide-react';

/* ============ SETTINGS ============ */
const ACCENTS = [
  ['cyan', '#46b6ff', 'ฟ้า'],
  ['teal', '#2fe0c2', 'เขียวน้ำทะเล'],
  ['violet', '#9d6bff', 'ม่วง'],
  ['gold', '#ffce4a', 'ทอง'],
  ['rose', '#ff6b9d', 'ชมพู'],
  ['custom', '', 'กำหนดเอง'],
];
const PALETTE = ['#ff5168','#ff8a3d','#ffce4a','#3ce594','#2fe0c2','#46b6ff','#7c5cff','#b06bff','#ff6b9d','#9aa6cf'];

function Swatch({ value, onChange }) {
  const [open, setOpen] = useS(false);
  return (
    <div className="relative flex-none">
      <button onClick={() => setOpen(o => !o)} title="เลือกสี"
        className="w-[30px] h-[30px] rounded-[7px] cursor-pointer"
        style={{ background: value, border: '2px solid ' + (open ? '#fff' : 'rgba(255,255,255,.25)'), boxShadow: '0 0 10px ' + value + '66' }}></button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-[40]"></div>
          <div className="absolute top-[36px] left-0 z-[41] grid grid-cols-5 gap-1.5 p-2 bg-panel-solid border border-line-bright rounded-[9px] shadow-[0_8px_24px_rgba(0,0,0,.5)] w-[166px]">
            {PALETTE.map(c => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                className="w-6 h-6 rounded-md cursor-pointer"
                style={{ background: c, border: value === c ? '2px solid #fff' : '2px solid transparent' }}></button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
          const toSave = typeof val === 'object' ? JSON.stringify(val) : String(val);
          await saveSetting(key, toSave);
        }
        setSaveStatus(<span className="flex items-center gap-1 text-green"><Check className="w-3.5 h-3.5" /> บันทึกแล้ว</span>);
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus(<span className="flex items-center gap-1 text-red"><XCircle className="w-3.5 h-3.5" /> บันทึกไม่สำเร็จ</span>);
        console.error("Save setting error:", err);
      }
    }, 1000);
  };

  const F = (key, val) => upd({ [key]: val });
  
  // Helpers for nested team config
  const tc = cfg.teamConfig || getTeamCfg();
  const setSeniority = (tier, field, val) => {
    const updated = { ...tc.SENIOR, [tier]: { ...tc.SENIOR[tier], [field]: val } };
    F('teamConfig', { ...tc, SENIOR: updated });
  };
  const setModel = (m, field, val) => {
    const updated = { ...tc.MODEL_INFO, [m]: { ...tc.MODEL_INFO[m], [field]: val } };
    F('teamConfig', { ...tc, MODEL_INFO: updated });
  };
  const setPStatus = (k, val) => {
    const updated = { ...tc.PSTATUS, [k]: [val, tc.PSTATUS[k][1]] };
    F('teamConfig', { ...tc, PSTATUS: updated });
  };
  
  const presets = Array.isArray(tc.ROLE_PRESETS) && tc.ROLE_PRESETS.length ? tc.ROLE_PRESETS : (window.ROLE_PRESETS || []);
  const ps = tc.PSTATUS || window.PSTATUS || {};

  const [npEn, setNpEn] = useS(''); const [npTh, setNpTh] = useS('');
  const addPreset = () => { 
    const en = (npEn.trim() || npTh.trim()).toUpperCase(); 
    const th = npTh.trim() || npEn.trim();
    if (!th) return; 
    F('teamConfig', { ...tc, ROLE_PRESETS: [...presets, { en, th, icon: '✨', desc: 'รายละเอียด' }] }); 
    setNpEn(''); setNpTh(''); 
  };
  const delPreset = i => F('teamConfig', { ...tc, ROLE_PRESETS: presets.filter((_, j) => j !== i) });

  const [geminiKey, setGeminiKey] = useS('');

  useE(() => {
    if (cfg.gemini_api_key) {
      setGeminiKey(cfg.gemini_api_key);
    } else if (window.electronAPI) {
      window.electronAPI.getSetting('gemini_api_key').then(k => {
        if (k) {
          setGeminiKey(k);
          saveSetting('gemini_api_key', k);
        }
      });
    }
  }, [cfg.gemini_api_key]);

  const handleKeySave = async (val) => {
    setGeminiKey(val);
    if (window.electronAPI) {
      window.electronAPI.saveSetting('gemini_api_key', val);
    }
    try {
      await saveSetting('gemini_api_key', val);
    } catch (err) {
      console.error("Failed to save gemini_api_key to backend DB:", err);
    }
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
        setSaveStatus(<span className="flex items-center gap-1 text-green"><Check className="w-3.5 h-3.5" /> รีเซ็ตสำเร็จ</span>);
        setTimeout(() => setSaveStatus(''), 2000);
      } catch(err) {
        setSaveStatus(<span className="flex items-center gap-1 text-red"><XCircle className="w-3.5 h-3.5" /> รีเซ็ตไม่สำเร็จ</span>);
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
                  <image-slot id="sys-logo" editable="true" shape="rounded" radius="12" className="absolute inset-0 w-[88px] h-[88px]"/>
                  <div className="slot-letter absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[30px] text-white">
                    {(cfg.sysName1 || 'M').trim()[0] || 'M'}
                  </div>
                </div>
                <div className="flex flex-col items-center mt-1.5 w-[88px]">
                  <div className="font-mono text-[10px] text-text-mute">ลากรูปมาวาง</div>
                  <button className="text-[10px] text-cyan hover:underline mt-0.5" onClick={() => window.dispatchEvent(new CustomEvent('browse-assets', { detail: { id: 'sys-logo' } }))}>เลือกจาก Assets</button>
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
                  {id === 'custom' ? <span className="flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Custom</span> : (cfg.accent === id ? <Check className="w-4 h-4 text-[#0a0e1c] fill-current" /> : '')}
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
          </Win>

          <Win title="API CONFIGURATION" accent="purple" bodyStyle={{ padding: 18 }}>
            <SecTitle>ตั้งค่าการเชื่อมต่อ AI</SecTitle>
            <label className="lbl">Gemini API Key</label>
            <input className="fld font-mono" type="password" value={geminiKey} onChange={e => handleKeySave(e.target.value)} placeholder="AIzaSy..."/>
            <div className="font-mono text-[10px] text-text-mute mt-1.25">
              บันทึกไว้ในเครื่องของคุณเท่านั้น · จำเป็นสำหรับใช้งานระบบ AI
            </div>
          </Win>
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="flex flex-col gap-4">
          <Win title="CEO · เจ้าของบริษัท" accent="rose" bodyStyle={{ padding: 18 }}>
            <SecTitle>ข้อมูลเจ้าของ</SecTitle>
            <div className="flex gap-3.5 items-start mb-3.5">
              <div className="flex-none">
                <label className="lbl">รูปโปรไฟล์</label>
                <div className="w-[72px] h-[72px] rounded-xl relative overflow-hidden border-2 border-[#ff5168] shadow-[0_0_14px_rgba(255,81,104,0.4)]">
                  <image-slot id="player-avatar" editable="true" shape="rounded" radius="12" placeholder="YOU" className="absolute inset-0 w-[72px] h-[72px]"/>
                </div>
                <div className="flex justify-center mt-1.5 w-[72px]">
                  <button className="text-[10px] text-cyan hover:underline leading-tight text-center" onClick={() => window.dispatchEvent(new CustomEvent('browse-assets', { detail: { id: 'player-avatar' } }))}>เลือกจาก<br/>Assets</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="lbl">ชื่อ-นามสกุล</label>
                <input className="fld" value={cfg.ownerName || ''} onChange={e => F('ownerName', e.target.value)} placeholder="ชื่อของคุณ" />
                <label className="lbl mt-2.75">ตำแหน่ง / บทบาท</label>
                <input className="fld" value={cfg.ownerRole || ''} onChange={e => F('ownerRole', e.target.value)} placeholder="เช่น Founder / CEO" />
              </div>
            </div>
            <label className="lbl">เกี่ยวกับฉัน (Bio)</label>
            <textarea className="fld" rows="3" value={cfg.bio || ''} onChange={e => F('bio', e.target.value)} placeholder="เล่าสั้นๆ ว่าคุณคือใคร ถนัดอะไร..."/>
            <div className="font-mono text-[10.5px] text-text-mute mt-2">
              ชื่อ/รูปนี้จะไปแสดงเป็นการ์ด CEO ในหน้า Team, Org Chart
            </div>
          </Win>

          <Win title="WARROOM CONFIGURATION" accent="teal" bodyStyle={{ padding: 18 }}>
            <SecTitle>ฉากหลังห้องทำงาน (Warroom Background)</SecTitle>
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-full h-[140px] rounded-xl relative overflow-hidden border border-[#2f456e] bg-[#0a0e1c] flex items-center justify-center">
                <image-slot id="office-scene" editable="true" shape="rounded" radius="12" className="absolute inset-0 w-full h-full"/>
                <div className="slot-letter absolute inset-0 flex items-center justify-center pointer-events-none font-mono text-[11.5px] text-text-mute px-4 text-center">
                  ลากรูปภาพแผนผังหรือห้อง Isometric มาวางที่นี่
                </div>
              </div>
              <div className="flex justify-between items-center w-full mt-1">
                <span className="font-mono text-[10px] text-text-mute">ขนาดแนะนำ: 16:9 (เช่น 1920x1080)</span>
                <button className="text-[10px] text-cyan hover:underline cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('browse-assets', { detail: { id: 'office-scene' } }))}>เลือกจาก Assets</button>
              </div>
            </div>
          </Win>
        </div>
      </div>

      {/* ===================== SYSTEM CUSTOMIZATION ===================== */}
      <div className="font-pixel text-[11px] tracking-[1px] text-gold my-[26px] flex items-center gap-[9px] [text-shadow:0_0_8px_rgba(255,206,74,.25)]">
        <Sliders className="w-4 h-4 text-gold flex-none" /> ปรับแต่งระบบ <span className="flex-1 h-[1px] bg-line"></span>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-4 items-start">
        
        {/* ---------- SENIORITY TIERS ---------- */}
        <Win title="ระดับตำแหน่ง · SENIORITY" bodyStyle={{ padding: 18 }}
          right={<span className="tag mr-1.5">สี + ชื่อ</span>}>
          <div className="font-mono text-[11px] text-text-mute mb-3.25 leading-[1.5]">
            ปรับชื่อและสีของแต่ละระดับ — มีผลทันทีกับการ์ดในหน้า Team และ Org Chart
          </div>
          <div className="flex flex-col gap-2.5">
            {Object.keys(window.SENIOR_ORDER ? window.SENIOR_ORDER : tc.SENIOR).map(k => {
              const t = tc.SENIOR[k];
              if (!t) return null;
              return (
                <div key={k} className="flex items-center gap-[11px]">
                  <Swatch value={t.col} onChange={c => setSeniority(k, 'col', c)}/>
                  <input className="fld px-2.75 py-1.75 text-[13px]" value={t.label} onChange={e => setSeniority(k, 'label', e.target.value)} style={{ flex: 1, minWidth: 0 }}/>
                  <span className="font-pixel text-[8px] tracking-[0.5px] w-[74px] text-right flex-none" style={{color: t.col}}>{t.en}</span>
                </div>
              );
            })}
          </div>
        </Win>

        {/* ---------- MODELS ---------- */}
        <Win title="โมเดล AI · MODELS" bodyStyle={{ padding: 18 }}
          right={<span className="tag mr-1.5">ชื่อ · สี · effort</span>}>
          <div className="font-mono text-[11px] text-text-mute mb-3.25 leading-[1.5]">
            ตั้งชื่อโมเดล + สี และ <span className="text-gold">เพดาน effort (ดาวสูงสุด)</span> ของแต่ละรุ่น — Opus แรงสุดได้ดาวเยอะกว่า
          </div>
          <div className="flex flex-col gap-3.25">
            {Object.keys(tc.MODEL_INFO).map(k => {
              const m = tc.MODEL_INFO[k];
              return (
                <div key={k} className="flex flex-col gap-1.75 p-[11px_12px] bg-[#080c1a]/50 border border-line rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <Swatch value={m.col} onChange={c => setModel(k, 'col', c)}/>
                    <input className="fld px-2.5 py-1.75 text-[13px]" value={m.label} onChange={e => setModel(k, 'label', e.target.value)} placeholder="ชื่อย่อ" style={{ width: 90, flex: 'none' }}/>
                    <input className="fld px-2.5 py-1.75 text-[13px]" value={m.full || m.label} onChange={e => setModel(k, 'full', e.target.value)} placeholder="ชื่อเต็ม" style={{ flex: 1, minWidth: 0 }}/>
                  </div>
                  <div className="flex items-center gap-2.25 mt-1">
                    <span className="font-pixel2 font-bold text-[10px] text-text-dim tracking-[0.5px] flex-none">เพดาน EFFORT</span>
                    <button onClick={() => setModel(k, 'max', 0)} title="ไม่มี effort"
                      className="cursor-pointer bg-transparent rounded-[5px] px-1.75 py-0.5 font-mono text-[11px]"
                      style={{ border: '1px solid ' + ((m.max || 0) === 0 ? m.col : 'var(--line)'), color: (m.max || 0) === 0 ? m.col : 'var(--text-mute)' }}>ปิด</button>
                    <div className="flex gap-1 items-center">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => setModel(k, 'max', v)}
                          className="cursor-pointer bg-transparent border-none p-0 text-[17px] leading-none"
                          style={{ color: v <= (m.max || 0) ? m.col : '#2a3450', textShadow: v <= (m.max || 0) ? '0 0 6px ' + m.col + '77' : 'none' }}>
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                    <span className="font-mono text-[12px] ml-auto" style={{ color: m.col }}>{(m.max || 0) > 0 ? ('สูงสุด ' + m.max + '★') : 'ไม่มี effort'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Win>

        {/* ---------- PROJECT STATUS ---------- */}
        <Win title="สถานะโปรเจกต์ · STATUS" bodyStyle={{ padding: 18 }}
          right={<span className="tag mr-1.5">สี</span>}>
          <div className="font-mono text-[11px] text-text-mute mb-3.25 leading-[1.5]">
            สีประจำสถานะ ใช้กับการ์ดและหน้ารายละเอียดโปรเจกต์
          </div>
          <div className="flex flex-col gap-[11px]">
            {Object.keys(ps).map(k => (
              <div key={k} className="flex items-center gap-3">
                <Swatch value={ps[k][0]} onChange={c => setPStatus(k, c)}/>
                <span className="chip px-3 py-1.25 text-[13px]" style={{ color: ps[k][0], borderColor: ps[k][0] + '66' }}>{k}</span>
              </div>
            ))}
          </div>
        </Win>

        {/* ---------- ROLE PRESETS ---------- */}
        <Win title="ตำแหน่งงานเริ่มต้น · ROLES" bodyStyle={{ padding: 18 }}
          right={<span className="tag mr-1.5">{presets.length}</span>}>
          <div className="font-mono text-[11px] text-text-mute mb-3.25 leading-[1.5]">
            ตัวเลือกบทบาทเวลา “เพิ่มพนักงาน” — เพิ่ม/ลบได้เอง
          </div>
          <div className="flex flex-wrap gap-1.75 mb-3.5">
            {presets.map((r, i) => (
              <span key={i} className="chip text-[12.5px] p-[6px_9px_6px_11px] text-cyan border-cyan/40 gap-1.75">
                {r.th}<span className="font-mono text-[9px] text-text-mute">{r.en}</span>
                <i onClick={() => delPreset(i)} className="cursor-pointer text-text-mute hover:text-red flex items-center justify-center"><X className="w-3 h-3" /></i>
              </span>
            ))}
            {presets.length === 0 && <div className="empty w-full text-center py-2">ยังไม่มีตำแหน่ง</div>}
          </div>
          <div className="flex gap-2">
            <input className="fld px-2.75 py-2 text-[13px]" placeholder="ชื่อไทย เช่น นักการตลาด" value={npTh}
              onChange={e => setNpTh(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPreset()} style={{ flex: 1, minWidth: 0 }}/>
            <input className="fld px-2.75 py-2 text-[13px] uppercase" placeholder="EN" value={npEn} onChange={e => setNpEn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPreset()} style={{ width: 80, flex: 'none' }}/>
            <button className="btn green sm px-3 flex items-center justify-center" onClick={addPreset}><Plus className="w-3.5 h-3.5" /></button>
          </div>
        </Win>
      </div>

      <div className="text-center text-text-mute font-mono text-[11px] mt-[18px] mb-2">
        ทุกการแก้ไขถูกบันทึกอัตโนมัติ · เก็บไว้ในเครื่องนี้
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
