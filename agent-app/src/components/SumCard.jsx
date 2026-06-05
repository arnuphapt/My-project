import React from 'react';
import { Pencil } from 'lucide-react';

export function SumCard({ label, main, sub, tone, onClick }){
  const colMap={gold:'text-gold',pos:'text-green',neg:'text-red',cyan:'text-cyan'};
  return (
    <div className={`win p-[14px_15px] transition-colors duration-200 ${onClick ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
      onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="font-pixel2 text-[11px] text-text-dim tracking-[.5px] mb-2">{label}</div>
        {onClick && <Pencil className="w-3.5 h-3.5 text-text-dim opacity-60 flex-none self-center" />}
      </div>
      <div className={`font-mono text-[24px] leading-none ${colMap[tone] || 'text-white'}`}>{main}</div>
      <div className="font-mono text-[13px] text-text-mute mt-1.5">{sub}</div>
    </div>
  );
}
