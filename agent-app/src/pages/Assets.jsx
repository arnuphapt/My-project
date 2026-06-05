import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, SEED } from '../store';
import { PageHead, Bar } from '../components/UI.jsx';
import '../store/image-slot.js';
import { Image, Tag, Gamepad2, FileText, Folder, Minus, Plus, RefreshCw } from 'lucide-react';

/* ============ ASSETS ============ */
function Assets() {
  const [s] = useOffice();
  const [active, setActive] = useS('ALL');
  const [filesByGroup, setFilesByGroup] = useS({});
  const slots = s.assetSlots || {};
  const groups = SEED.assetGroups;

  const fetchFiles = () => {
    fetch('http://127.0.0.1:8000/assets/list')
      .then(res => res.json())
      .then(data => setFilesByGroup(data))
      .catch(err => console.error(err));
  };

  useE(() => {
    fetchFiles();
    const tm = setInterval(fetchFiles, 3000);
    return () => clearInterval(tm);
  }, []);

  const setCount = (gid, delta) => OfficeStore.setState(st => {
    const cur = (st.assetSlots && st.assetSlots[gid]) != null ? st.assetSlots[gid] : (groups.find(g => g.id === gid)?.count || 4);
    return { ...st, assetSlots: { ...(st.assetSlots || {}), [gid]: Math.max(1, Math.min(40, cur + delta)) } };
  }, { now: true });

  const countOf = g => (slots[g.id] != null ? slots[g.id] : g.count);
  const total = groups.reduce((a, g) => a + countOf(g), 0);
  const shown = active === 'ALL' ? groups : groups.filter(g => g.id === active);

  return (
    <div className="max-w-[1280px] mx-auto px-[22px] py-5">
      <PageHead
        title="ASSETS"
        sub="คลังเก็บไฟล์ — ลากรูป โลโก้ พิกเซลอาร์ต หรือเอกสารมาวางในช่องได้เลย"
        right={
          <div className="flex items-center gap-3">
            <button className="btn ghost sm flex items-center gap-1" onClick={fetchFiles}><RefreshCw className="w-3.5 h-3.5" /> รีเฟรช</button>
            <span className="tag px-2.5 py-1.5">ทั้งหมด {total} ช่อง</span>
          </div>
        }
      />

      {/* group filter */}
      <div className="flex gap-[7px] flex-wrap mb-[18px]">
        <button className={'btn sm ' + (active === 'ALL' ? '' : 'ghost')} onClick={() => setActive('ALL')}>ทั้งหมด</button>
        {groups.map(g => (
          <button key={g.id} className={'btn sm ' + (active === g.id ? '' : 'ghost')} onClick={() => setActive(g.id)}>{g.name}</button>
        ))}
      </div>

      <div className="flex flex-col gap-[22px]">
        {shown.map(g => (
          <AssetGroup key={g.id} g={g} count={countOf(g)} onAdd={() => setCount(g.id, 1)} onRemove={() => setCount(g.id, -1)} files={filesByGroup[g.id] || []} />
        ))}
      </div>
    </div>
  );
}

const GROUP_ICON = { img: Image, logo: Tag, pix: Gamepad2, doc: FileText };
const GROUP_SHAPE = { img: 'rect', logo: 'rounded', pix: 'rect', doc: 'rounded' };

function AssetGroup({ g, count, onAdd, onRemove, files }) {
  const shape = GROUP_SHAPE[g.id] || 'rounded';
  const IconComponent = GROUP_ICON[g.id] || Folder;
  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[11px]">
        <IconComponent className="w-5 h-5 text-cyan" />
        <span className="font-pixel text-[11px] text-cyan tracking-[1px] [text-shadow:0_0_8px_rgba(58,208,255,0.4)]">{g.name}</span>
        <span className="text-[13px] text-text-dim">{g.th}</span>
        <span className="font-mono text-[12px] text-text-mute">· {files.length} ไฟล์ / {count} ช่องอัปโหลด</span>
        <div className="flex-1"></div>
        <button className="btn ghost sm flex items-center justify-center" onClick={onRemove} disabled={count <= 1}><Minus className="w-3 h-3" /></button>
        <button className="btn sm flex items-center gap-1.5" onClick={onAdd}><Plus className="w-3.5 h-3.5" /> เพิ่มช่อง</button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {files.map((url, i) => (
          <div key={`file-${i}`} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#1e2d50] bg-[#141c32] group">
            <img src={url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
          </div>
        ))}
        {Array.from({ length: count }).map((_, i) => (
          <div key={`slot-${i}`} className="relative aspect-square">
            <image-slot
              id={'asset-' + g.id + '-' + i}
              editable="true"
              shape={shape}
              radius="10"
              placeholder={g.name + ' #' + (i + 1)}
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Assets;
