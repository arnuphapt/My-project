import React, { useState as useS, useEffect as useE } from 'react';
import { OfficeStore, useOffice } from '../store';

/* ============ SKILL.MD CODEX — renderer + view/edit ============ */

/* tiny markdown -> html (headings, bold, italic, code, lists, quotes, hr, links) */
export function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
export function mdInline(s){
  s = escHtml(s);
  s = s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}

export function renderMd(src){
  const lines = (src||'').replace(/\r/g,'').split('\n');
  let out=[], list=null;  // list = 'ul' | 'ol' | null
  const closeList=()=>{ if(list){ out.push('</'+list+'>'); list=null; } };
  for(let raw of lines){
    const line = raw.replace(/\s+$/,'');
    if(/^\s*$/.test(line)){ closeList(); continue; }
    let m;
    if((m=line.match(/^###\s+(.*)/))){ closeList(); out.push('<h3>'+mdInline(m[1])+'</h3>'); continue; }
    if((m=line.match(/^##\s+(.*)/))){ closeList(); out.push('<h2>'+mdInline(m[1])+'</h2>'); continue; }
    if((m=line.match(/^#\s+(.*)/))){ closeList(); out.push('<h1>'+mdInline(m[1])+'</h1>'); continue; }
    if(/^(---|___|\*\*\*)\s*$/.test(line)){ closeList(); out.push('<hr/>'); continue; }
    if((m=line.match(/^>\s?(.*)/))){ closeList(); out.push('<blockquote>'+mdInline(m[1])+'</blockquote>'); continue; }
    if((m=line.match(/^\s*\d+\.\s+(.*)/))){ if(list!=='ol'){ closeList(); out.push('<ol>'); list='ol'; } out.push('<li>'+mdInline(m[1])+'</li>'); continue; }
    if((m=line.match(/^\s*[-*+]\s+(.*)/))){ if(list!=='ul'){ closeList(); out.push('<ul>'); list='ul'; } out.push('<li>'+mdInline(m[1])+'</li>'); continue; }
    closeList(); out.push('<p>'+mdInline(line)+'</p>');
  }
  closeList();
  return out.join('');
}

/* per-agent codex: rendered parchment / source / edit */
export function AgentSkillMd({ a }){
  const [s]=useOffice();
  const live = s.agents.find(x=>x.id===a.id) || a;
  const [mode,setMode]=useS('rendered');   // rendered | source
  const [editing,setEditing]=useS(false);
  const [draft,setDraft]=useS(live.skillMd||'');
  const [saved,setSaved]=useS(false);

  useE(()=>{ if(!editing) setDraft(live.skillMd||''); },[live.skillMd, editing]);

  const save=()=>{
    OfficeStore.setState(st=>({...st,
      agents: st.agents.map(x=>x.id===a.id?{...x, skillMd:draft}:x),
      log:[{t:OfficeStore.clock(),who:a.name,text:'แก้คัมภีร์ skill.md',kind:'sys'},...st.log].slice(0,40),
    }),{now:true});
    setEditing(false); setSaved(true); setTimeout(()=>setSaved(false),1600);
  };

  const fileName = a.name.toLowerCase()+'.skill.md';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {/* toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-dim)',flex:1,minWidth:120}}>
          คัมภีร์ — <span style={{color:'var(--gold)'}}>{fileName}</span>
        </span>
        {!editing && (
          <div className="codex-toggle">
            <button className={mode==='rendered'?'on':''} onClick={()=>setMode('rendered')}>RENDERED</button>
            <button className={mode==='source'?'on':''} onClick={()=>setMode('source')}>SOURCE</button>
          </div>
        )}
        {!editing
          ? <button className="btn sm gold" onClick={()=>{setDraft(live.skillMd||'');setEditing(true);}}>✎ แก้ไข</button>
          : <div style={{display:'flex',gap:6}}>
              <button className="btn sm ghost" onClick={()=>{setEditing(false);setDraft(live.skillMd||'');}}>ยกเลิก</button>
              <button className="btn sm green" onClick={save}>บันทึก</button>
            </div>}
      </div>

      {saved && <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--green)'}}>✓ บันทึกคัมภีร์แล้ว</div>}

      {/* body */}
      {editing
        ? <div>
            <textarea className="codex-edit" value={draft} onChange={e=>setDraft(e.target.value)}
              spellCheck={false} placeholder="# เขียน skill.md ของพนักงานคนนี้..."></textarea>
            <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6}}>
              รองรับ Markdown: # หัวข้อ · **ตัวหนา** · - รายการ · &gt; คำคม · --- เส้นคั่น
            </div>
          </div>
        : (mode==='rendered'
            ? <div className="parch" dangerouslySetInnerHTML={{__html: renderMd(live.skillMd||'')}}/>
            : <div className="codex-src">{live.skillMd||''}</div>)
      }
    </div>
  );
}
