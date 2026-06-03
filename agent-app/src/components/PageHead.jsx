import React from 'react';

export function PageHead({ title, th, sub, right }){
  return (
    <div className="flex items-end justify-between gap-4 mb-[18px] flex-wrap">
      <div>
        <h1 className="title-xl text-[20px] tracking-[1px]">{title}</h1>
        {sub && <div className="text-text-dim text-[14px] mt-2 font-thai">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
