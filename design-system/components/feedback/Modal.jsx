import React from 'react';

/**
 * Modal dialog with terminal title bar, neon-bordered panel and a blurred
 * scrim. Closes on Escape and scrim click. Renders nothing when `open` is
 * false. (No animation library — keeps the bundle React-only.)
 */
export function Modal({ open, onClose, title = 'dialog', width = 520, children }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 10, width, maxWidth: '100%',
          maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
          background: 'var(--overlay-bg)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow), 0 8px 40px rgba(0,0,0,0.8)',
        }}
      >
        <div className="titlebar">
          <span className="neon-text">●</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          <button className="titlebar-btn" onClick={onClose} title="Close">✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
