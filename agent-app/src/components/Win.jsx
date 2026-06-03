import React from 'react';

export function Win({ title, th, accent, right, children, style, bodyStyle, className, onClose }){
  return (
    <div className={'win'+(accent?' accent-'+accent:'')+(className?' '+className:'')} style={style}>
      <div className="win-h">
        <span className={'ttl'+(th?' th':'')}>{title}</span>
        {right}
        <div className="win-dots">
          <i>_</i>
          <i onClick={onClose}>×</i>
        </div>
      </div>
      <div className="win-b" style={bodyStyle}>{children}</div>
    </div>
  );
}
