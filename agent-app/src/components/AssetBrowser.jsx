import React, { useState as useS, useEffect as useE } from 'react';
import { Modal } from './Modal.jsx';
import { Image, Loader2 } from 'lucide-react';

export function AssetBrowser({ onClose, onSelect }) {
  const [assets, setAssets] = useS([]);
  const [loading, setLoading] = useS(true);

  useE(() => {
    fetch('http://127.0.0.1:8000/settings/')
      .then(res => res.json())
      .then(arr => {
        const item = arr.find(x => x.key === 'image_slots');
        if (item && item.value) {
          const slots = JSON.parse(item.value);
          const urls = [];
          for (const key in slots) {
            if (key.startsWith('asset-')) {
              const val = slots[key];
              const u = typeof val === 'string' ? val : val.u;
              if (u) urls.push(u);
            }
          }
          // Remove duplicates
          setAssets([...new Set(urls)].reverse());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load assets', err);
        setLoading(false);
      });
  }, []);

  return (
    <Modal title="ASSET BROWSER" width={640} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="font-thai text-[13px] text-text-mute">
          เลือกรูปภาพจากคลัง Assets ที่คุณเคยอัปโหลดไว้
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="w-8 h-8 text-cyan animate-spin opacity-50" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 gap-3 border border-dashed border-[#1e2d50] rounded-lg bg-[#0a0e1c]/50">
            <Image className="w-10 h-10 text-[#1e2d50]" />
            <div className="font-thai text-[13px] text-text-mute text-center">
              ยังไม่มีรูปภาพใน Assets<br/>
              อัปโหลดรูปภาพได้ที่หน้า <span className="text-cyan">Assets</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll">
            {assets.map((u, i) => (
              <div 
                key={i} 
                onClick={() => { onSelect(u); onClose(); }}
                className="aspect-square rounded-lg bg-[#141c32] border border-[#1e2d50] overflow-hidden cursor-pointer hover:border-cyan hover:shadow-[0_0_12px_rgba(70,182,255,0.4)] transition-all relative group"
              >
                <img src={u} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e2d50; border-radius: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #2a3c6a; }
      `}</style>
    </Modal>
  );
}
