import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, PageHead } from '../components/UI.jsx';
import '../store/image-slot.js';

/* ============ SETTINGS ============ */
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
  const upd = patch => OfficeStore.setState(st => ({ ...st, settings: { ...st.settings, ...patch } }), { now: true });
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

  const filled = ['ownerName', 'ownerRole', 'email', 'bio'].filter(k => (cfg[k] || '').trim()).length;
  const pct = Math.round(filled / 4 * 100);

  const reset = () => {
    if (confirm('คืนค่าตั้งต้นทั้งหมด? (ชื่อระบบ โลโก้ และประวัติจะถูกล้าง)')) {
      OfficeStore.setState(st => ({ ...st, settings: { ...window.SEED.settings } }), { now: true });
      window.electronAPI?.saveLog('warning', 'System reset to default settings');
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-[22px] py-5">
      <PageHead
        title="SETTINGS"
        sub="ตั้งค่าตัวตนของระบบ และกรอกประวัติของคุณ — ข้อมูลนี้ใช้สร้าง Resume / CV ต่อได้"
        right={<button className="btn ghost" onClick={reset}>คืนค่าตั้งต้น</button>}
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
                  <image-slot
                    id="sys-logo"
                    shape="rounded"
                    radius="12"
                    className="absolute inset-0 w-[88px] h-[88px]"
                  />
                </div>
                <div className="font-mono text-[10px] text-text-mute mt-1.5 text-center w-[88px]">ลากรูปมาวาง</div>
              </div>

              <div className="flex-1">
                <label className="lbl">ชื่อระบบ</label>
                <div className="flex gap-2">
                  <input
                    className="fld uppercase"
                    value={cfg.sysName1 || ''}
                    maxLength={10}
                    onChange={e => F('sysName1', e.target.value)}
                    placeholder="MY"
                  />
                  <input
                    className="fld uppercase"
                    value={cfg.sysName2 || ''}
                    maxLength={12}
                    onChange={e => F('sysName2', e.target.value)}
                    placeholder="OFFICE"
                  />
                </div>
                <div className="font-mono text-[10px] text-text-mute mt-1.25">2 บรรทัด — โชว์มุมซ้ายบน</div>
                <label className="lbl mt-3.25">คำโปรย (Tagline)</label>
                <input
                  className="fld"
                  value={cfg.tagline || ''}
                  onChange={e => F('tagline', e.target.value)}
                  placeholder="ระบบจัดการชีวิตของฉัน"
                />
              </div>
            </div>

            <label className="lbl">สีหลักของระบบ (Accent)</label>
            <div className="flex gap-2.25 mt-1">
              {ACCENTS.map(([id, hex, th]) => (
                <button
                  key={id}
                  onClick={() => F('accent', id)}
                  title={th}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    cursor: 'pointer',
                    background: hex,
                    border: cfg.accent === id ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: cfg.accent === id ? '0 0 0 2px ' + hex : '0 2px 6px rgba(0,0,0,.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b0e16',
                    fontWeight: 900
                  }}
                >
                  {cfg.accent === id ? '✓' : ''}
                </button>
              ))}
            </div>
          </Win>

          {/* ---------- API CONFIG ---------- */}
          <Win title="API CONFIGURATION" accent="purple" bodyStyle={{ padding: 18 }}>
            <SecTitle>ตั้งค่าการเชื่อมต่อ AI</SecTitle>
            <label className="lbl">Gemini API Key</label>
            <input
              className="fld font-mono"
              type="password"
              value={geminiKey}
              onChange={e => handleKeySave(e.target.value)}
              placeholder="AIzaSy..."
            />
            <div className="font-mono text-[10px] text-text-mute mt-1.25">
              บันทึกไว้ในเครื่องของคุณเท่านั้น · จำเป็นสำหรับใช้งานระบบ AI
            </div>
          </Win>
        </div>

        {/* ---------- OWNER PROFILE ---------- */}
        <Win
          title="MY PROFILE · CV DATA"
          accent="gold"
          bodyStyle={{ padding: 18 }}
          right={<span className="tag px-2 py-1">{pct}% พร้อม</span>}
        >
          <SecTitle>ประวัติของฉัน</SecTitle>

          <div className="flex gap-3.5 items-start mb-3.5">
            <div className="flex-none">
              <label className="lbl">รูปโปรไฟล์</label>
              <div className="w-[72px] h-[72px] rounded-xl relative overflow-hidden border border-line">
                <image-slot
                  id="player-avatar"
                  shape="rounded"
                  radius="12"
                  placeholder="YOU"
                  className="absolute inset-0 w-[72px] h-[72px]"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="lbl">ชื่อ-นามสกุล</label>
              <input className="fld" value={cfg.ownerName || ''} onChange={e => F('ownerName', e.target.value)} placeholder="ชื่อของคุณ" />
              <label className="lbl mt-2.75">ตำแหน่ง / บทบาท</label>
              <input className="fld" value={cfg.ownerRole || ''} onChange={e => F('ownerRole', e.target.value)} placeholder="เช่น Founder / Developer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="lbl">อีเมล</label>
              <input className="fld" value={cfg.email || ''} onChange={e => F('email', e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label className="lbl">เบอร์โทร</label>
              <input className="fld" value={cfg.phone || ''} onChange={e => F('phone', e.target.value)} placeholder="08x-xxx-xxxx" />
            </div>
            <div>
              <label className="lbl">ที่อยู่ / เมือง</label>
              <input className="fld" value={cfg.location || ''} onChange={e => F('location', e.target.value)} placeholder="Bangkok, Thailand" />
            </div>
            <div>
              <label className="lbl">เว็บไซต์ / พอร์ต</label>
              <input className="fld" value={cfg.website || ''} onChange={e => F('website', e.target.value)} placeholder="myportfolio.com" />
            </div>
            <div>
              <label className="lbl">วันเกิด (คำนวณ Level)</label>
              <input className="fld" type="date" value={cfg.birthdate || ''} onChange={e => F('birthdate', e.target.value)} />
            </div>
          </div>

          <label className="lbl mt-3.25">เกี่ยวกับฉัน (Bio)</label>
          <textarea
            className="fld"
            rows="4"
            value={cfg.bio || ''}
            onChange={e => F('bio', e.target.value)}
            placeholder="เล่าสั้นๆ ว่าคุณคือใคร ถนัดอะไร เป้าหมายคืออะไร... ข้อความนี้จะใช้เป็นหัว Resume"
          />
        </Win>
      </div>

      {/* ---------- CV PREVIEW ---------- */}
      <Win
        title="RESUME PREVIEW"
        className="mt-4"
        bodyStyle={{ padding: 0 }}
        right={<span className="tag px-2 py-1">auto จากข้อมูล + โปรเจกต์</span>}
      >
        <CVPreview cfg={cfg} projects={s.projects} />
      </Win>

      <div className="text-center text-text-mute font-mono text-[11px] my-4 mb-2">
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

function CVPreview({ cfg, projects }) {
  const name = (cfg.ownerName || '').trim() || '— ยังไม่ได้กรอกชื่อ —';
  const contacts = [cfg.email, cfg.phone, cfg.location, cfg.website].filter(x => (x || '').trim());
  const skills = [...new Set(projects.flatMap(p => p.tags))];
  return (
    <div className="grid grid-cols-[1fr_1.4fr] gap-0">
      {/* left rail */}
      <div className="bg-[#080a12]/55 border-r border-line p-[22px_20px]">
        <div className="w-16 h-16 rounded-xl relative overflow-hidden border border-line mb-3.5">
          <image-slot
            id="player-avatar"
            shape="rounded"
            radius="12"
            placeholder="YOU"
            className="absolute inset-0 w-16 h-16"
          />
        </div>
        <div className="font-pixel2 font-bold text-[20px] text-white leading-tight">{name}</div>
        <div className="text-cyan font-mono text-[13px] mt-1.25">{(cfg.ownerRole || '').trim() || 'ตำแหน่ง'}</div>

        {contacts.length > 0 && (
          <>
            <div className="font-pixel2 text-[10px] text-text-dim tracking-[0.5px] mt-5 mb-2">CONTACT</div>
            <div className="flex flex-col gap-1.5">
              {contacts.map((c, i) => <div key={i} className="font-mono text-[12px] text-text">{c}</div>)}
            </div>
          </>
        )}

        {skills.length > 0 && (
          <>
            <div className="font-pixel2 text-[10px] text-text-dim tracking-[0.5px] mt-5 mb-2">SKILLS</div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map(sk => <span key={sk} className="chip text-[10px] text-cyan border-cyan/35">{sk}</span>)}
            </div>
          </>
        )}
      </div>

      {/* right body */}
      <div className="p-[22px]">
        <div className="font-pixel2 text-[10px] text-text-dim tracking-[0.5px] mb-2">ABOUT</div>
        <p
          className="m-0 text-[13.5px] leading-relaxed"
          style={{ color: (cfg.bio || '').trim() ? 'var(--text)' : 'var(--text-mute)' }}
        >
          {(cfg.bio || '').trim() || 'เขียนแนะนำตัวในช่อง Bio ด้านบน แล้วจะมาแสดงตรงนี้'}
        </p>

        <div className="font-pixel2 text-[10px] text-text-dim tracking-[0.5px] mt-[22px] mb-2.5">PROJECTS · ผลงาน</div>
        <div className="flex flex-col gap-3">
          {projects.length === 0 && <div className="empty">ยังไม่มีโปรเจกต์ — เพิ่มที่หน้า Projects</div>}
          {projects.map(p => (
            <div key={p.id} className="border-l-2 border-cyan pl-3">
              <div className="flex justify-between items-baseline gap-2">
                <span className="font-pixel2 font-bold text-[14px] text-white">{p.title}</span>
                <span className="font-mono text-[11px] text-text-mute flex-none">{p.period}</span>
              </div>
              <div className="font-mono text-[11.5px] text-cyan mt-0.5">{p.role}</div>
              <div className="text-[12.5px] text-text-dim mt-1.25 leading-normal">{p.summary}</div>
              {p.highlights && p.highlights.length > 0 && (
                <ul className="mt-1.75 mb-0 pl-4 text-text text-[12.5px] leading-relaxed">
                  {p.highlights.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Settings;
