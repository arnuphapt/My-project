import React from 'react';

export function ClassTag({ cls }){
  const map={SET:['#3ce594','SET'],US:['#4db4ff','US'],FUND:['#ffce4a','FUND'],CRYPTO:['#b06bff','CRYPTO']};
  const [c,l]=map[cls]||['#9aa6cf',cls];
  return <span className="chip" style={{color:c,borderColor:c+'55'}}>{l}</span>;
}
