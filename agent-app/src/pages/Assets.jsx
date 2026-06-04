import React, { useState as useS, useEffect as useE, useRef as useR } from 'react';
import { OfficeStore, useOffice, SEED } from '../store';
import { PageHead, Bar } from '../components/UI.jsx';
import '../store/image-slot.js';

/* ============ ASSETS ============ */
function Assets() {
  const [s] = useOffice();
  const [active, setActive] = useS('ALL');
  const slots = s.assetSlots || {};
  const groups = SEED.assetGroups;

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
        right={<span className="tag px-2.5 py-1.5">ทั้งหมด {total} ช่อง</span>}
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
          <AssetGroup key={g.id} g={g} count={countOf(g)} onAdd={() => setCount(g.id, 1)} onRemove={() => setCount(g.id, -1)} />
        ))}
      </div>
    </div>
  );
}

const GROUP_ICON = { img: '🖼️', logo: '🏷️', pix: '👾', doc: '📄' };
const GROUP_SHAPE = { img: 'rect', logo: 'rounded', pix: 'rect', doc: 'rounded' };

function AssetGroup({ g, count, onAdd, onRemove }) {
  const shape = GROUP_SHAPE[g.id] || 'rounded';
  return (
    <div>
      <div className="flex items-center gap-[10px] mb-[11px]">
        <span className="text-[18px]">{GROUP_ICON[g.id] || '📁'}</span>
        <span className="font-pixel text-[11px] text-cyan tracking-[1px] [text-shadow:0_0_8px_rgba(58,208,255,0.4)]">{g.name}</span>
        <span className="text-[13px] text-text-dim">{g.th}</span>
        <span className="font-mono text-[12px] text-text-mute">· {count} ช่อง</span>
        <div className="flex-1"></div>
        <button className="btn ghost sm" onClick={onRemove} disabled={count <= 1}>－</button>
        <button className="btn sm" onClick={onAdd}>＋ เพิ่มช่อง</button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="relative aspect-square">
            <image-slot
              id={'asset-' + g.id + '-' + i}
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
