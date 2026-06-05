import React from 'react';
import { fmt } from '../../store';

/** Labelled range-slider row */
export function SliderRow({ label, value, unit, min, max, step, onChange, compact }) {
  return (
    <div style={{ marginBottom: compact ? 0 : 12 }}>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[13px] text-text-dim">{label}</span>
        <span className="font-mono text-[14px] text-cyan">
          {unit === '$' ? '$' + fmt.compact(value) : value + unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--cyan)' }}
      />
    </div>
  );
}
