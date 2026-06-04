import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice } from '../store';
import { Win, StatusDot, Rarity, PageHead } from '../components/UI.jsx';
import '../store/image-slot.js';

/* ============ SECRETARY ============ */
function Secretary() {
  const [s] = useOffice();
  const [txt, setTxt] = useS('');
  const [busy, setBusy] = useS(false);
  const boxRef = useR(null);

  // Find the agent with "เลขา" in Thai role, or "SECRETARY" in English role
  const sec = s.agents.find(a => a.roleTh.includes('เลขา') || a.roleEn.toUpperCase().includes('SECRETARY'));
  const log = s.secChat;

  useE(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [log.length, busy]);

  const push = (m) => OfficeStore.setState(st => ({ ...st, secChat: [...st.secChat, m] }), { now: true });

  const dispatch = (agentId, task) => {
    OfficeStore.setState(st => {
      const exists = st.agents.find(a => a.id === agentId);
      const id = exists ? agentId : st.agents.find(a => a.roleEn.toLowerCase().includes(agentId.toLowerCase()) || a.roleTh.includes(agentId))?.id;
      if (!id) return st;
      return {
        ...st,
        agents: st.agents.map(a => a.id === id ? { ...a, status: 'working', statusTh: 'ทำงานอยู่', last: 'เมื่อสักครู่', tasks: [{ text: task, done: false, t: OfficeStore.clock() }, ...a.tasks] } : a),
        log: [{ t: OfficeStore.clock(), who: sec ? sec.name : 'System', text: 'มอบงานให้ ' + (exists ? exists.name : id) + ': ' + task, kind: 'ok' }, ...st.log].slice(0, 40),
      };
    }, { now: true });
  };

  if (!sec) {
    return (
      <div className="max-w-[1180px] mx-auto px-[22px] py-5 h-full flex flex-col">
        <PageHead title="SECRETARY" sub="ยังไม่มีเลขาในทีม" />
        <div className="m-auto text-center text-text-mute">
          <div className="text-[40px] mb-2.5">👩‍💼</div>
          <div className="text-[16px] text-white mb-1.5">คุณยังไม่ได้จ้างเลขา</div>
          <div className="text-[14px] text-text-dim">โปรดไปที่หน้า TEAM และเพิ่มพนักงานที่มีบทบาท "เลขา" หรือ "SECRETARY"</div>
        </div>
      </div>
    );
  }

  const send = async (preset) => {
    const t = (preset || txt).trim();
    if (!t || busy) return;
    push({ from: 'u', text: t });
    setTxt('');
    setBusy(true);
    const roster = OfficeStore.getState().agents.map(a => `${a.id} (${a.name}, ${a.roleTh})`).join('; ');
    try {
      const reply = await window.claude.complete({
        messages: [{
          role: 'user', content:
            `คุณคือ "${sec.name}" ตำแหน่ง ${sec.roleTh} ของออฟฟิศ AI ส่วนตัวของเจ้านาย. บุคลิก: ขี้เล่น มีอารมณ์ขัน อบอุ่น แต่ทำงานเป๊ะ พูดไทย กระชับ ใส่อิโมจิพอประมาณ.
ทีมที่คุณสั่งงานได้: ${roster}.
หน้าที่: คุยกับเจ้านาย ช่วยวางแผน และเมื่อเจ้านายอยากให้ทำงานอะไร ให้มอบหมายงานต่อให้ AI ในทีมที่เหมาะสม.
เวลาจะมอบงาน ให้พิมพ์บรรทัดแยกในรูปแบบ: DISPATCH: <agentId> | <รายละเอียดงาน> (พิมพ์ได้หลายบรรทัดถ้ามอบหลายงาน) แล้วค่อยตามด้วยข้อความสรุปสั้นๆถึงเจ้านาย.
เจ้านายพูดว่า: "${t}"`
        }]
      });
      // parse dispatches
      const lines = reply.split('\n');
      const kept = [];
      lines.forEach(ln => {
        const m = ln.match(/DISPATCH:\s*([a-zA-Z0-9_]+)\s*\|\s*(.+)/);
        if (m) { dispatch(m[1].trim(), m[2].trim()); }
        else kept.push(ln);
      });
      const clean = kept.join('\n').trim();
      if (clean) push({ from: 'a', text: clean });
      else push({ from: 'a', text: 'จัดให้เรียบร้อยแล้วค่ะเจ้านาย ✅ ดูงานที่หน้า Team ได้เลย' });
    } catch (e) {
      push({ from: 'a', text: 'อุ๊ย ระบบสะดุดนิดนึง 😅 ลองพิมพ์อีกทีนะเจ้านาย' });
    }
    setBusy(false);
  };

  const quick = ['สรุปสถานะออฟฟิศวันนี้ให้หน่อย', 'ให้นักวิเคราะห์ดูพอร์ตหุ้นที', 'ให้นักพัฒนาทำ landing page', 'วางแผนงานสัปดาห์นี้'];

  return (
    <div className="max-w-[1180px] mx-auto px-[22px] py-5 h-full flex flex-col">
      <PageHead title="SECRETARY" sub={`คุยกับ ${sec.name} เลขาส่วนตัว — สั่งงานครั้งเดียว เธอกระจายให้ทั้งทีม AI`} />
      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-3.5 flex-1 min-h-0">
        {/* side */}
        <div className="flex flex-col gap-3 min-h-0 overflow-auto">
          <Win title={sec.name.toUpperCase()} accent="gold">
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative w-24 h-24">
                <image-slot id={`card-${sec.id}`} shape="rounded" radius="12" placeholder={sec.name} className="w-24 h-24" />
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel text-[26px]"
                  style={{ color: sec.color, textShadow: `0 0 14px ${sec.color}b3` }}
                >
                  {sec.name[0]}
                </div>
              </div>
              <Rarity r={sec.rarity} />
              <div className="text-center text-[13px] text-text-dim leading-normal">
                {sec.roleTh}<br />ขี้เล่น มีอารมณ์ขัน แต่งานเป๊ะ
              </div>
            </div>
          </Win>
          <Win title="TEAM STATUS">
            <div className="flex flex-col gap-2">
              {s.agents.filter(a => a.id !== sec.id).map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  <StatusDot s={a.status} />
                  <span className="flex-1 text-[13px] text-text">{a.name}</span>
                  <span className="font-mono text-[11px] text-text-mute">{a.tasks.filter(t => !t.done).length} งาน</span>
                </div>
              ))}
            </div>
          </Win>
        </div>

        {/* chat */}
        <Win title={`CHAT WITH ${sec.name.toUpperCase()}`} accent="gold" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div ref={boxRef} className="flex-1 overflow-auto p-[18px] flex flex-col gap-[11px] min-h-0">
            {log.length === 0 && (
              <div className="m-auto text-center text-text-mute max-w-[380px]">
                <div className="text-[40px] mb-2.5">☕</div>
                <div className="text-[15px] text-text-dim leading-relaxed">สวัสดีเจ้านาย! ฉัน {sec.name} เอง 😎<br />บอกมาได้เลยว่าอยากให้จัดการอะไร เดี๋ยวฉันสั่งทีมให้</div>
              </div>
            )}
            {log.map((m, i) => (
              <div key={i} className="max-w-[82%]" style={{ alignSelf: m.from === 'u' ? 'flex-end' : 'flex-start' }}>
                {m.from === 'a' && (
                  <div
                    className="font-mono text-[11px] mb-0.5"
                    style={{ color: sec.color }}
                  >
                    {sec.name}
                  </div>
                )}
                <div
                  className="rounded-xl px-3.5 py-2.5 text-[14.5px] leading-relaxed text-white whitespace-pre-wrap"
                  style={{
                    background: m.from === 'u' ? 'linear-gradient(180deg,#27408f,#1a2a64)' : 'rgba(40,32,12,.55)',
                    border: '1px solid ' + (m.from === 'u' ? 'var(--line-bright)' : 'rgba(255,206,74,.4)')
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <div className="self-start text-gold font-mono text-[13px]">{sec.name} กำลังคิด… ☕</div>}
          </div>
          {log.length === 0 && (
            <div className="flex gap-[7px] flex-wrap px-[18px] pb-3">
              {quick.map(q => <button key={q} className="btn ghost sm" onClick={() => send(q)}>{q}</button>)}
            </div>
          )}
          <div className="flex gap-2.5 px-[18px] py-3 border-t border-line">
            <input className="fld flex-1" placeholder={`พิมพ์สั่งงาน ${sec.name}...`} value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
            <button className="btn gold" onClick={() => send()} disabled={busy}>ส่ง ▶</button>
          </div>
        </Win>
      </div>
    </div>
  );
}

export default Secretary;
