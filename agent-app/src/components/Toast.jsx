import React, { useState, useEffect, useCallback } from 'react';

let _push = null;

export function toast(msg, type = 'error') {
  if (_push) _push({ id: Date.now() + Math.random(), msg, type });
}

export function ToastContainer() {
  const [items, setItems] = useState([]);

  const push = useCallback((t) => {
    setItems(prev => [...prev, t]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 4000);
  }, []);

  useEffect(() => { _push = push; return () => { _push = null; }; }, [push]);

  if (!items.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 72, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
    }}>
      {items.map(t => (
        <div key={t.id} style={{
          fontFamily: 'var(--mono)', fontSize: 13,
          padding: '10px 16px', borderRadius: 10,
          background: t.type === 'error' ? '#2a0f14' : t.type === 'warn' ? '#2a2008' : '#0d2018',
          border: `1px solid ${t.type === 'error' ? '#ff516866' : t.type === 'warn' ? '#ffce4a66' : '#3ce59466'}`,
          color: t.type === 'error' ? '#ff8a97' : t.type === 'warn' ? '#ffce4a' : '#3ce594',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          maxWidth: 360, lineHeight: 1.5,
          animation: 'toast-in 0.2s ease',
          pointerEvents: 'auto',
        }}>
          {t.type === 'error' ? '✕ ' : t.type === 'warn' ? '⚠ ' : '✓ '}{t.msg}
        </div>
      ))}
    </div>
  );
}
