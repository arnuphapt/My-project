import React from 'react';

export function Avatar({ agent, size=44, slot }){
  const id = 'agent-'+agent.id;
  return (
    <div className="relative flex-none" style={{width:size,height:size}}>
      <image-slot id={id} shape="rounded" radius="8"
        placeholder={agent.name}
        style={{width:size+'px',height:size+'px'}}></image-slot>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none font-pixel"
        style={{fontSize:(size/3.6)+'px',color:agent.color, textShadow:'0 0 8px '+agent.color+'88'}}>{agent.name[0]}</div>
    </div>
  );
}
