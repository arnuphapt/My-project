import React from 'react';

/** Toggle switch component */
export function Toggle({ on, disabled, onClick }) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      className="w-[50px] h-7 rounded-[14px] relative transition-all duration-150 flex-none"
      style={{
        cursor:     disabled ? 'not-allowed' : 'pointer',
        background: on ? 'var(--green)' : '#2a3650',
        opacity:    disabled ? 0.4 : 1,
        border:     '1px solid ' + (on ? 'var(--green)' : 'var(--line)'),
      }}
    >
      <div
        className="absolute top-0.5 w-[22px] h-[22px] rounded-[50%] bg-white transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
        style={{ left: on ? 24 : 2 }}
      />
    </div>
  );
}
