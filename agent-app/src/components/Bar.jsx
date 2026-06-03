import React from 'react';

export function Bar({ pct, tone }){
  return <div className={'bar'+(tone?' '+tone:'')}><i style={{width:Math.max(0,Math.min(100,pct))+'%'}}></i></div>;
}
