import React from 'react';

export function Modal({ title, th, onClose, children, width=520 }){
  return (
    <div onClick={onClose} className="fixed inset-0 z-[300] bg-[#030512]/82 backdrop-blur-[6px] flex items-center justify-center p-5 animate-[caFadeIn_.18s_ease-out]">
      <div onClick={e=>e.stopPropagation()} className="w-full bg-[#0a0e1a] border border-[#1e2d50] rounded-[12px] relative overflow-hidden flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.7)] animate-[caSlideUp_.2s_ease-out]" style={{maxWidth:width}}>
        
        {/* accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-70 bg-gradient-to-r from-transparent via-cyan to-transparent" />

        {/* header */}
        <div className="px-5 py-4 border-b border-[#1e2d50] flex items-center gap-3">
          <div className="flex-1 font-pixel2 font-bold text-[14px] text-cyan tracking-wide" style={{ textShadow: '0 0 12px rgba(70,182,255,.4)' }}>
            {title}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="w-7 h-7 rounded-[6px] border border-[#2a3c6a] bg-[#141c32]/60 text-text-mute text-[14px] cursor-pointer flex items-center justify-center hover:text-white hover:border-cyan transition-colors" style={{ paddingBottom: 6 }}>_</button>
            <button onClick={onClose} className="w-7 h-7 rounded-[6px] border border-[#2a3c6a] bg-[#141c32]/60 text-text-mute text-[16px] cursor-pointer flex items-center justify-center hover:text-white hover:border-red hover:text-red transition-colors">×</button>
          </div>
        </div>

        {/* body */}
        <div className="p-5 flex flex-col gap-4">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes caFadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes caSlideUp  { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  );
}
