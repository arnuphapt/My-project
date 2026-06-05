import React, { useState as useS, useRef as useR, useEffect as useE } from 'react';
import { OfficeStore } from '../../store';
import { createAgent } from '../../api/agents.js';
import { SENIOR, MODEL_INFO, ROLE_PRESETS } from './teamConfig.js';

/* ── Live preview card ── */
function PreviewCard({ name, roleEn, roleTh, seniority, model }) {
  const m  = SENIOR[seniority] || SENIOR.mid;
  const mm = MODEL_INFO[model] || MODEL_INFO.sonnet;
  const initial = (name.trim() || '?')[0].toUpperCase();
  return (
    <div style={{
      position: 'relative', background: 'linear-gradient(180deg, rgba(14,20,44,.98), rgba(8,12,26,.98))',
      border: `2px solid ${m.col}`, borderRadius: 10, overflow: 'hidden',
      boxShadow: `0 0 0 1px #000, 0 0 28px ${m.glow}, inset 0 0 30px rgba(8,14,34,.6)`,
      width: '100%', aspectRatio: '3/4', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, background: `radial-gradient(ellipse at 50% 30%, ${m.col}22 0%, transparent 65%), #070a1c`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 9, left: 9, fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: '#0a0a14', background: m.col, padding: '4px 8px', borderRadius: 4, boxShadow: `0 2px 0 #000, 0 0 12px ${m.glow}` }}>{m.en}</div>
        <div style={{ position: 'absolute', top: 9, right: 9, fontFamily: 'var(--mono)', fontSize: 9, color: mm.col, background: 'rgba(8,12,26,.8)', border: `1px solid ${mm.col}66`, borderRadius: 5, padding: '3px 7px' }}>{mm.tier}</div>
        <div style={{ fontFamily: 'var(--pixel)', fontSize: 64, color: m.col, textShadow: `0 0 30px ${m.glow}, 0 0 60px ${m.glow}44`, lineHeight: 1, userSelect: 'none', animation: 'caPreviewPulse 3s ease-in-out infinite' }}>{initial}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: 'linear-gradient(180deg, transparent, rgba(6,9,18,.95))' }}/>
      </div>
      <div style={{ padding: '10px 12px 12px', borderTop: `1px solid ${m.col}44` }}>
        <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 16, color: 'var(--white)', letterSpacing: .3 }}>{name.trim() || '???'}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3, letterSpacing: .3 }}>{roleEn} · {roleTh}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          {[0,1,2,3,4].map(i => <span key={i} style={{ fontSize: 12, color: i < m.stars ? m.col : '#2a3450', textShadow: i < m.stars ? `0 0 6px ${m.glow}` : 'none' }}>★</span>)}
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: mm.col, marginLeft: 4 }}>◇ {mm.label}</span>
        </div>
      </div>
    </div>
  );
}

/* ── 3-step wizard modal ── */
export function CreateAgent({ onClose }) {
  const [step,      setStep]      = useS(0);
  const [name,      setName]      = useS('');
  const [roleEn,    setRoleEn]    = useS('ASSISTANT');
  const [roleTh,    setRoleTh]    = useS('ผู้ช่วยทั่วไป');
  const [seniority, setSeniority] = useS('mid');
  const [model,     setModel]     = useS('sonnet');
  const [saving,    setSaving]    = useS(false);
  const [done,      setDone]      = useS(false);
  const inputRef = useR(null);

  useE(() => { if (step === 0 && inputRef.current) inputRef.current.focus(); }, [step]);

  const m  = SENIOR[seniority]    || SENIOR.mid;
  const mm = MODEL_INFO[model]    || MODEL_INFO.sonnet;
  const STEPS = ['ตัวตน', 'โมเดล', 'ยืนยัน'];

  const create = async () => {
    if (saving) return;
    setSaving(true);
    const nm = name.trim() || 'Agent';
    const id = nm.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4);
    const rarityMap = { ceo: 'legend', secretary: 'legend', senior: 'legend', mid: 'epic', junior: 'rare', newgrad: 'common' };
    const newAgent  = { id, name: nm, roleEn, roleTh, rarity: rarityMap[seniority] || 'rare', seniority, status: 'idle', lv: 1, salary: 0.5, desc: 'พนักงานใหม่ พร้อมรับงาน ' + roleTh, model, skillMd: `# ${nm}'s Skills\n\n- **${roleTh}** — ทักษะพื้นฐาน` };
    try {
      await createAgent(newAgent);
      window.electronAPI?.saveLog('info', 'Created new agent: ' + nm);
      setDone(true);
      setTimeout(() => { OfficeStore.syncBackendData(); onClose(); }, 1200);
    } catch (err) { console.error(err); alert('Error connecting to backend API'); setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(3,5,18,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'caFadeIn .18s ease-out' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 780, background: 'linear-gradient(180deg, rgba(14,20,44,.99), rgba(8,11,26,.99))', border: '1px solid #2a3c6a', borderRadius: 14, boxShadow: '0 0 0 1px #000, 0 32px 80px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04)', overflow: 'hidden', animation: 'caSlideUp .2s ease-out', position: 'relative' }}>
        {/* accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${m.col}, transparent)`, opacity: .7 }}/>

        {/* header + steps */}
        <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid #1e2d50', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontFamily: 'var(--pixel)', fontSize: 12, color: m.col, letterSpacing: 1, textShadow: `0 0 12px ${m.glow}` }}>RECRUIT NEW AGENT</div>
          <div style={{ flex: 1, display: 'flex', gap: 0 }}>
            {STEPS.map((lb, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: i < step ? 'pointer' : 'default', padding: '4px 10px', borderRadius: 6, background: step === i ? 'rgba(40,60,110,.5)' : 'transparent' }} onClick={() => i < step && setStep(i)}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--mono)', background: i < step ? m.col : step === i ? 'rgba(40,60,110,.8)' : 'rgba(20,28,50,.6)', color: i < step ? '#000' : step === i ? m.col : 'var(--text-mute)', border: `1px solid ${i <= step ? m.col + '88' : '#23304a'}`, boxShadow: i === step ? `0 0 10px ${m.glow}` : 'none', transition: '.2s' }}>{i < step ? '✓' : i + 1}</div>
                  <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 11, color: step === i ? 'var(--white)' : 'var(--text-mute)', letterSpacing: .3 }}>{lb}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 28, height: 1, background: i < step ? m.col + '66' : '#1e2d50', margin: '0 2px' }}/>}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid #2a3c6a', background: 'rgba(10,14,34,.7)', color: 'var(--text-mute)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 210px', minHeight: 380 }}>
          {/* form */}
          <div style={{ padding: '24px 26px', borderRight: '1px solid #1a2540', display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* STEP 0 — identity */}
            {step === 0 && (
              <div style={{ animation: 'caStepIn .18s ease-out', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 8 }}>ชื่อพนักงาน</div>
                  <input ref={inputRef} className="fld" placeholder="เช่น Nova, Atlas, Mira…" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && setStep(1)} style={{ fontSize: 18, padding: '12px 14px', letterSpacing: .4 }}/>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 10 }}>บทบาทหน้าที่</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {ROLE_PRESETS.map(r => (
                      <button key={r.en} onClick={() => { setRoleEn(r.en); setRoleTh(r.th); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: roleEn === r.en ? 'rgba(40,60,110,.55)' : 'rgba(12,16,32,.6)', border: `1px solid ${roleEn === r.en ? m.col + '88' : '#1e2d50'}`, cursor: 'pointer', transition: '.15s', textAlign: 'left', boxShadow: roleEn === r.en ? `inset 0 0 16px ${m.glow}22` : 'none' }}>
                        <span style={{ fontSize: 18 }}>{r.icon}</span>
                        <div>
                          <div style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 12, color: roleEn === r.en ? 'var(--white)' : 'var(--text-dim)' }}>{r.th}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-mute)', marginTop: 1 }}>{r.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 10 }}>ระดับประสบการณ์</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {['senior','mid','junior','newgrad'].map(s => {
                      const sm = SENIOR[s]; const active = seniority === s;
                      return (
                        <button key={s} onClick={() => setSeniority(s)} style={{ flex: 1, padding: '10px 4px', borderRadius: 8, cursor: 'pointer', transition: '.15s', background: active ? 'rgba(40,52,80,.7)' : 'rgba(10,14,28,.6)', border: `1px solid ${active ? sm.col + '99' : '#1e2d50'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, boxShadow: active ? `0 0 14px ${sm.glow}44` : 'none' }}>
                          <span style={{ fontSize: 13, color: active ? sm.col : 'var(--text-mute)' }}>{'★'.repeat(sm.stars)}</span>
                          <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 9, color: active ? 'var(--white)' : 'var(--text-dim)', letterSpacing: .3, textAlign: 'center' }}>{sm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1 — model */}
            {step === 1 && (
              <div style={{ animation: 'caStepIn .18s ease-out', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 6 }}>เลือก AI Model</div>
                {['opus','sonnet','haiku'].map(mk => {
                  const mi = MODEL_INFO[mk]; const active = model === mk;
                  return (
                    <button key={mk} onClick={() => setModel(mk)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', borderRadius: 10, background: active ? 'linear-gradient(135deg, rgba(20,28,60,.9), rgba(14,20,44,.9))' : 'rgba(10,14,28,.6)', border: `1px solid ${active ? mi.col : '#1e2d50'}`, cursor: 'pointer', transition: '.2s', textAlign: 'left', position: 'relative', overflow: 'hidden', boxShadow: active ? `0 0 0 1px ${mi.col}33, inset 0 0 24px ${mi.glow}22` : 'none' }}>
                      {active && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${mi.col}, transparent)` }}/>}
                      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: active ? `radial-gradient(circle, ${mi.col}33, ${mi.col}11)` : 'rgba(14,18,36,.7)', border: `1px solid ${mi.col}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--pixel)', fontSize: 9, color: mi.col, boxShadow: active ? `0 0 16px ${mi.glow}` : 'none' }}>◇</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 15, color: active ? 'var(--white)' : 'var(--text-dim)' }}>{mi.label}</span>
                          <span style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, padding: '3px 7px', borderRadius: 4, color: '#000', background: mi.col }}>{mi.tier}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--thai)', fontSize: 13, color: 'var(--text-mute)', lineHeight: 1.4 }}>{mi.desc}</div>
                      </div>
                      {active && <div style={{ color: mi.col, fontSize: 18 }}>✓</div>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 2 — confirm */}
            {step === 2 && (
              <div style={{ animation: 'caStepIn .18s ease-out', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontFamily: 'var(--pixel)', fontSize: 8, letterSpacing: 1, color: 'var(--text-mute)' }}>สรุปข้อมูลพนักงาน</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'ชื่อ',     value: name.trim() || 'Agent', col: m.col },
                    { label: 'บทบาท',   value: roleTh + ' · ' + roleEn, col: 'var(--white)' },
                    { label: 'ระดับ',   value: m.label + ' (' + '★'.repeat(m.stars) + ')', col: m.col },
                    { label: 'AI Model', value: mm.label, col: mm.col },
                  ].map(row => (
                    <div key={row.label} style={{ background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '11px 13px' }}>
                      <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)', marginBottom: 6 }}>{row.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: row.col, fontWeight: 600 }}>{row.value}</div>
                    </div>
                  ))}
                </div>
                {done && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 10, border: `1px solid ${m.col}66`, background: 'rgba(60,229,148,.08)', animation: 'caFadeIn .2s ease-out' }}>
                    <span style={{ fontSize: 20 }}>✓</span>
                    <span style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 13, color: 'var(--green)' }}>เพิ่มพนักงานสำเร็จ!</span>
                  </div>
                )}
              </div>
            )}

            {/* nav buttons */}
            <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 12, color: 'var(--text-dim)', background: 'rgba(14,18,36,.8)', border: '1px solid #2a3c6a', borderRadius: 8, padding: '11px 18px', cursor: 'pointer' }}>← ย้อนกลับ</button>
              )}
              <div style={{ flex: 1 }}/>
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !name.trim()} style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 13, color: step === 0 && !name.trim() ? 'var(--text-mute)' : '#000', background: step === 0 && !name.trim() ? 'rgba(20,28,50,.8)' : `linear-gradient(180deg, ${m.col}, ${m.col}cc)`, border: `1px solid ${step === 0 && !name.trim() ? '#2a3c6a' : m.col}`, borderRadius: 8, padding: '11px 22px', cursor: step === 0 && !name.trim() ? 'not-allowed' : 'pointer', boxShadow: step === 0 && !name.trim() ? 'none' : `0 4px 14px ${m.glow}`, opacity: step === 0 && !name.trim() ? .5 : 1, transition: '.15s' }}>ถัดไป →</button>
              ) : (
                <button onClick={create} disabled={saving} style={{ fontFamily: 'var(--pixel2)', fontWeight: 700, fontSize: 14, color: '#000', background: done ? 'linear-gradient(180deg, #3ce594, #1f9a5e)' : `linear-gradient(180deg, ${m.col}, ${m.col}bb)`, border: `1px solid ${done ? '#3ce594' : m.col}`, borderRadius: 8, padding: '13px 28px', cursor: saving ? 'wait' : 'pointer', boxShadow: `0 4px 18px ${done ? 'rgba(60,229,148,.4)' : m.glow}`, opacity: saving ? .7 : 1, transition: '.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saving && !done ? <><span style={{ animation: 'caSpinner .8s linear infinite', display: 'inline-block' }}>◌</span> กำลังสร้าง…</> : done ? '✓ สำเร็จ!' : '🚀 เพิ่มเข้าทีม'}
                </button>
              )}
            </div>
          </div>

          {/* preview */}
          <div style={{ padding: '20px 18px', background: 'rgba(6,9,20,.5)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--pixel)', fontSize: 7, letterSpacing: 1, color: 'var(--text-mute)' }}>PREVIEW</div>
            <PreviewCard name={name} roleEn={roleEn} roleTh={roleTh} seniority={seniority} model={model}/>
            <div style={{ width: '100%', background: 'rgba(10,14,28,.7)', border: '1px solid #1e2d50', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-mute)', lineHeight: 1.6 }}>
              <span style={{ color: mm.col }}>◇ {mm.label}</span><br/>
              <span style={{ color: m.col }}>{'★'.repeat(m.stars)}</span> {m.label}<br/>
              <span style={{ color: 'var(--text-dim)' }}>STATUS:</span> <span style={{ color: 'var(--green)' }}>IDLE</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes caFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes caSlideUp  { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes caStepIn   { from { opacity:0; transform:translateX(10px) } to { opacity:1; transform:none } }
        @keyframes caPreviewPulse { 0%,100%{opacity:1} 50%{opacity:.78} }
        @keyframes caSpinner  { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
