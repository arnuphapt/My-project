import React from 'react';
import { Win } from './Win';

export function Modal({ title, th, onClose, children, width=520 }){
  return (
    <div onClick={onClose} className="fixed inset-0 z-[200] bg-[#040614]/72 backdrop-blur-[3px] flex items-center justify-center p-5">
      <div onClick={e=>e.stopPropagation()} className="w-full" style={{maxWidth:width}}>
        <Win title={title} th={th} onClose={onClose} bodyStyle={{padding:18}}>{children}</Win>
      </div>
    </div>
  );
}
