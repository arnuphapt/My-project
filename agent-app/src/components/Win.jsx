import React from 'react';
import { Minus, X } from 'lucide-react';

export function Win({ title, th, accent, right, children, style, bodyStyle, className, onClose }){
  return (
    <div className={'win'+(accent?' accent-'+accent:'')+(className?' '+className:'')} style={style}>
      <div className="win-h">
        <span className={'ttl'+(th?' th':'')}>{title}</span>
        {right}
        <div className="win-dots">
          <i><Minus className="w-2 h-2" /></i>
          <i onClick={onClose}><X className="w-2.25 h-2.25" /></i>
        </div>
      </div>
      <div className="win-b" style={bodyStyle}>{children}</div>
    </div>
  );
}
