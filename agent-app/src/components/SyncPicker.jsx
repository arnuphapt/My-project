import React, { useState as useS, useEffect as useE } from 'react';
import { SK_CLUSTER_BY } from '../pages/Skills';
import { SYNC_PATHS, SKILL_CATALOG, AGENT_CATALOG } from '../store/catalog';

/* ---------------- import picker modal ---------------- */
export function SyncPicker({ kind, existing, onClose, onImport }) {
  const isSkill = kind === 'skills';
  const isProject = kind === 'projects';
  const isTask = kind === 'tasks';
  const path = isSkill ? SYNC_PATHS.skills : (isProject ? SYNC_PATHS.projects : (isTask ? SYNC_PATHS.tasks : SYNC_PATHS.agents));
  const exist = existing || new Set();
  const [catalog, setCatalog] = useS([]);
  const [scanning, setScanning] = useS(true);
  const [requiresWeb, setRequiresWeb] = useS(false);
  const [sel, setSel] = useS(() => new Set());
  const [q, setQ] = useS('');
  const fileRef = React.useRef(null);

  useE(() => {
    if (fileRef.current) {
      fileRef.current.setAttribute('webkitdirectory', '');
      fileRef.current.setAttribute('directory', '');
    }
  }, [requiresWeb]);

  useE(() => {
    if (window.electronAPI && window.electronAPI.scanSyncFolder) {
      window.electronAPI.scanSyncFolder(path).then((files) => {
        if (isSkill) {
          const folderMap = new Map();
          for (const f of files) {
            const parts = f.path.split('/');
            const folderName = parts.length > 1 ? parts[0] : f.name.replace(/\.(md|json)$/i, '');
            if (!folderMap.has(folderName)) {
              folderMap.set(folderName, []);
            }
            folderMap.get(folderName).push(f);
          }

          const parsed = [];
          for (const [folderName, fList] of folderMap.entries()) {
            const mainFile = fList.find(x => x.name.toUpperCase() === 'SKILL.MD') || fList.find(x => x.name.toLowerCase().endsWith('.md')) || fList[0];
            const text = mainFile ? mainFile.text : '';
            const rawHeading = (text.match(/^#\s+(.+)$/m) || [])[1] || folderName;
            // Trim leading/trailing slashes and whitespace
            const cleanHeading = rawHeading.replace(/^\/+|\/+$/g, '').trim();
            const name = (cleanHeading || folderName).trim();
            const desc = (text.match(/^>\s+(.+)$/m) || [])[1] || `ทักษะ ${name} ในระบบ`;
            
            parsed.push({
              id: folderName.toLowerCase(),
              name: name,
              cluster: 'ops',
              kind: 'skill',
              desc: desc,
              md: text,
              files: fList.map(f => ({ path: f.path, main: f === mainFile, md: f.text, json: f.name.endsWith('.json') }))
            });
          }
          setCatalog(parsed.length > 0 ? parsed : SKILL_CATALOG);
          setScanning(false);
        } else if (isProject) {
          const folderMap = new Map();
          for (const f of files) {
            const parts = f.path.split('/');
            const folderName = parts.length > 1 ? parts[0] : f.name.replace(/\.(md|json)$/i, '');
            if (!folderMap.has(folderName)) {
              folderMap.set(folderName, []);
            }
            folderMap.get(folderName).push(f);
          }

          const parsed = [];
          for (const [folderName, fList] of folderMap.entries()) {
            // Check relative path inside project folder (e.g. "overview.md" vs "be/overview.md")
            const relPath = f => f.path.startsWith(folderName + '/') ? f.path.slice(folderName.length + 1) : f.path;
            
            const mainFile = fList.find(x => relPath(x).toLowerCase() === 'overview.md')
                          || fList.find(x => relPath(x).toLowerCase() === 'index.md')
                          || fList.find(x => x.name.toLowerCase() === 'overview.md')
                          || fList.find(x => !relPath(x).includes('/') && x.name.toLowerCase().endsWith('.md'))
                          || fList[0];
            const text = mainFile ? mainFile.text : '';
            
            // Title is strictly derived from the project subfolder name
            const title = folderName.trim();
            
            // Extract summary strictly from ## Project Summary section, with fallbacks
            const summarySecMatch = (text.match(/##\s+Project Summary\s+([\s\S]*?)(?=\n##|\n#|$)/i) || [])[1];
            const cleanSummarySec = summarySecMatch ? summarySecMatch.trim().split('\n\n')[0].replace(/\n/g, ' ') : null;
            const quoteMatch = (text.match(/^>\s+(.+)$/m) || [])[1];
            const headingMatch = (text.match(/^#\s+(.+)$/m) || [])[1];
            const sub = cleanSummarySec || quoteMatch || (headingMatch ? headingMatch.trim() : `โปรเจกต์ ${title}`);
            
            // Extract tags array from frontmatter `tags: [...]` or `tags:\n  - ...`
            let parsedTags = [];
            const inlineTagsMatch = text.match(/^tags:\s*\[(.*?)\]/m);
            if (inlineTagsMatch && inlineTagsMatch[1]) {
              parsedTags = inlineTagsMatch[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
            } else {
              const listTagsMatch = [...text.matchAll(/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m)];
              if (listTagsMatch.length && listTagsMatch[0][1]) {
                parsedTags = listTagsMatch[0][1].split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
              }
            }
            const finalTags = parsedTags.length > 0 ? parsedTags : ['Project', 'Dev'];

            parsed.push({
              id: 'p-' + folderName.toLowerCase(),
              title: title,
              name: title,
              role: 'Builder / Dev',
              status: 'กำลังทำ',
              progress: 50,
              period: '2026',
              tags: finalTags,
              summary: sub,
              highlights: [],
              cluster: 'eng',
              desc: sub,
              files: fList.map(f => ({ path: f.path, main: f === mainFile, md: f.text }))
            });
          }
          setCatalog(parsed);
          setScanning(false);
        } else if (isTask) {
          const parsed = [];
          for (const f of files) {
            if (!f.name.toLowerCase().endsWith('.md')) continue;
            const text = f.text;
            const titleMatch = text.match(/title:\s*["']?([^"'\n]+)["']?/i);
            const title = titleMatch ? titleMatch[1].trim() : f.name.replace(/\.md$/i, '');
            
            const projectMatch = text.match(/project:\s*["']?([^"'\n]+)["']?/i);
            const project = projectMatch ? projectMatch[1].trim() : 'General';
            
            const statusMatch = text.match(/status:\s*["']?([^"'\n]+)["']?/i);
            const rawStatus = statusMatch ? statusMatch[1].trim().toLowerCase() : 'open';
            let status = 'open';
            if (rawStatus.includes('progress') || rawStatus.includes('doing')) status = 'progress';
            else if (rawStatus.includes('pending') || rawStatus.includes('hold')) status = 'pending';
            else if (rawStatus.includes('done') || rawStatus.includes('complete') || rawStatus.includes('close')) status = 'done';

            const prioMatch = text.match(/priority:\s*["']?([^"'\n]+)["']?/i);
            const priority = prioMatch && prioMatch[1] !== 'null' ? prioMatch[1].trim().toLowerCase() : 'medium';

            parsed.push({
              id: 't-' + (f.name.replace(/\.md$/i, '').toLowerCase()),
              text: title,
              name: title,
              title: title,
              project,
              cat: project,
              status,
              priority,
              desc: `Task ${project} · ${status}`,
              cluster: 'ops',
              md: text,
              files: [{ path: f.name, main: true, md: text }]
            });
          }
          setCatalog(parsed);
          setScanning(false);
        } else {
          const parsed = [];
          for (const f of files) {
            if (!f.name.toLowerCase().endsWith('.md')) continue;
            const text = f.text;
            const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
            const rawName = (heading || f.name.replace(/\.md$/i, '')).trim().split('·')[0].trim();
            const name = rawName.split(/\s+/).slice(0, 2).join(' ');
            if (!name) continue;
            const sub = (text.match(/^>\s+(.+)$/m) || [])[1] || 'นำเข้าจากโฟลเดอร์';
            const roleTh = sub.split('—')[0].trim().slice(0, 40);
            const sk = [...text.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map(m => m[1].trim()).slice(0, 5);
            parsed.push({
              id: f.name.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '-'),
              name,
              role: roleTh,
              cluster: 'ops',
              model: 'sonnet',
              skills: sk,
              desc: sub,
              md: text,
              files: [{ path: f.name, main: true, md: text }]
            });
          }
          setCatalog(parsed);
          setScanning(false);
        }
      }).catch(err => {
        console.error(err);
        setRequiresWeb(true);
        setScanning(false);
      });
    } else {
      setRequiresWeb(true);
      setScanning(false);
    }
  }, [path, isSkill]);

  const onWebSync = async (e) => {
    const files = [...(e.target.files || [])].filter(f => /\.md$/i.test(f.name));
    if (!files.length) {
      alert('ไม่พบไฟล์ .md ในโฟลเดอร์ที่เลือก');
      e.target.value = '';
      return;
    }
    setScanning(true);
    if (isSkill) {
      setCatalog(SKILL_CATALOG);
      setRequiresWeb(false);
      setScanning(false);
    } else {
      const parsed = [];
      for (const f of files) {
        let text = ''; try { text = await f.text(); } catch (err) { text = ''; }
        const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
        const rawName = (heading || f.name.replace(/\.md$/i, '')).trim().split('·')[0].trim();
        const name = rawName.split(/\s+/).slice(0, 2).join(' ');
        if (!name) continue;
        const sub = (text.match(/^>\s+(.+)$/m) || [])[1] || 'นำเข้าจากโฟลเดอร์';
        const roleTh = sub.split('—')[0].trim().slice(0, 40);
        const sk = [...text.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map(m => m[1].trim()).slice(0, 5);
        parsed.push({
          id: f.name.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '-'),
          name, role: roleTh, cluster: 'ops', model: 'sonnet', skills: sk, desc: sub, md: text,
          files: [{ path: f.name, main: true, md: text }]
        });
      }
      setCatalog(parsed);
      setRequiresWeb(false);
      setScanning(false);
    }
  };

  const list = catalog.filter(it => !q || it.name.toLowerCase().includes(q.toLowerCase()) || (it.id || '').includes(q.toLowerCase()));
  const selectable = list.filter(it => !exist.has(it.name.toLowerCase()));
  const allSel = selectable.length > 0 && selectable.every(it => sel.has(it.id));
  
  const toggle = (id) => setSel(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  
  const toggleAll = () => setSel(s => {
    if (allSel) return new Set();
    return new Set(selectable.map(it => it.id));
  });
  
  const doImport = () => {
    const items = catalog.filter(it => sel.has(it.id));
    if (items.length) onImport(items);
    onClose();
  };

  return (
    <div className="syp-back" onClick={onClose}>
      <div className="syp-modal" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="syp-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="syp-title">{isSkill ? '⟳ ซิงค์ SKILLS' : (isProject ? '⟳ ซิงค์ PROJECTS' : (isTask ? '⟳ ซิงค์ TASKS' : '⟳ ซิงค์ AGENTS'))}</div>
            <div className="syp-path">📂 {path}</div>
          </div>
          <i className="syp-x" onClick={onClose}>×</i>
        </div>

        {requiresWeb ? (
          <div className="syp-scan">
            <div className="syp-scan-t" style={{marginBottom: 10, color: 'var(--text-mute)'}}>โหมด Web Browser</div>
            <button className="btn ghost" style={{border: '1px solid var(--line)', padding: '10px 20px'}} onClick={() => fileRef.current && fileRef.current.click()}>
              📁 เลือกโฟลเดอร์ {isSkill ? 'skills' : (isProject ? 'projects' : (isTask ? 'tasks' : 'agents'))}
            </button>
            <input ref={fileRef} type="file" multiple accept=".md" style={{ display: 'none' }} onChange={onWebSync} />
            <div className="syp-scan-s" style={{marginTop: 10}}>เลือกโฟลเดอร์ {path} ในเครื่องของคุณ</div>
          </div>
        ) : scanning ? (
          <div className="syp-scan">
            <div className="syp-spin"></div>
            <div className="syp-scan-t">กำลังสแกนโฟลเดอร์…</div>
            <div className="syp-scan-s">{path}</div>
          </div>
        ) : (
          <>
            {/* toolbar */}
            <div className="syp-toolbar">
              <span className="syp-found">พบ {list.length} {isSkill ? 'สกิล' : (isProject ? 'โปรเจกต์' : (isTask ? 'งาน' : 'เอเจนต์'))}</span>
              <input className="fld" placeholder="ค้นหา…" value={q} onChange={e => setQ(e.target.value)}
                style={{ flex: 1, padding: '7px 11px', fontSize: 13 }} />
              <button className="syp-selall" onClick={toggleAll}>{allSel ? '✓ ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}</button>
            </div>

            {/* list */}
            <div className="syp-list">
              {list.map(it => {
                const dup = exist.has(it.name.toLowerCase());
                const on = sel.has(it.id);
                const cl = SK_CLUSTER_BY[it.cluster] || SK_CLUSTER_BY.ops;
                const nFiles = it.files ? it.files.length : 1;
                return (
                  <div key={it.id} className={'syp-row' + (on ? ' on' : '') + (dup ? ' dup' : '')}
                    style={{ '--cc': cl.col }} onClick={() => !dup && toggle(it.id)}>
                    <span className={'syp-check' + (on ? ' on' : '')} style={{ borderColor: on ? cl.col : '', background: on ? cl.col : '' }}>
                      {on ? '✓' : ''}
                    </span>
                    <span className="syp-glyph" style={{ color: cl.col }}>{isSkill ? '📄' : '🤖'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="syp-name">
                        {it.name}
                        {dup && <span className="syp-dupbadge">มีแล้ว</span>}
                      </div>
                      <div className="syp-desc">{it.desc}</div>
                    </div>
                    <div className="syp-meta">
                      <span className="syp-tag" style={{ color: cl.col, borderColor: cl.col + '55' }}>{cl.name}</span>
                      {isSkill || isProject
                        ? <span className="syp-files">📁 {nFiles} ไฟล์</span>
                        : <span className="syp-files" style={{ color: 'var(--text-dim)' }}>{(it.model || '').toUpperCase()} · {(it.skills || []).length} ทักษะ</span>}
                    </div>
                  </div>
                );
              })}
              {list.length === 0 && <div className="empty" style={{ padding: 30 }}>ไม่พบรายการที่ตรงกับ "{q}"</div>}
            </div>

            {/* footer */}
            <div className="syp-foot">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-dim)' }}>เลือกแล้ว {sel.size} รายการ</span>
              <span style={{ flex: 1 }}></span>
              <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
              <button className="btn gold" disabled={sel.size === 0} onClick={doImport}
                style={{ opacity: sel.size === 0 ? 0.4 : 1, pointerEvents: sel.size === 0 ? 'none' : 'auto' }}>
                ⬇ นำเข้า {sel.size > 0 ? '(' + sel.size + ')' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
