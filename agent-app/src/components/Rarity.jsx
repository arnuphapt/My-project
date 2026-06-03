import React from 'react';

export const RARITY = { legend:['r-legend','LEGENDARY'], epic:['r-epic','EPIC'], rare:['r-rare','RARE'], common:['r-common','COMMON'] };

export function Rarity({ r }){ 
  const [c,l]=RARITY[r]||RARITY.common; 
  return <span className={'rarity '+c}>{l}</span>; 
}
