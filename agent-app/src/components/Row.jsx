import React from 'react';

export function Row({ k, v, cls }){
  return <div className="kv"><span className="k">{k}</span><span className={'v '+(cls||'')}>{v}</span></div>;
}
