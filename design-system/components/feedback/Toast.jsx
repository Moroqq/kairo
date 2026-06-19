import React from 'react';

const CONFIG = {
  success: { color: 'var(--accent)', glow: 'var(--accent-glow)',  tag: '[ок]' },
  error:   { color: 'var(--danger)', glow: 'rgba(255,0,60,0.5)',  tag: '[ошибка]' },
  info:    { color: 'var(--info)',   glow: 'rgba(0,229,255,0.5)', tag: '[инфо]' },
};

/**
 * Presentational toast row. The `tag` prefix and glowing border encode type.
 * Pair with your own queue/timeout logic; pass a lucide icon via `icon`.
 */
export function Toast({ type = 'success', icon = null, onClose, children, style, ...props }) {
  const cfg = CONFIG[type] ?? CONFIG.success;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        fontFamily: 'var(--font-mono)', fontSize: 11, maxWidth: 340,
        background: 'var(--overlay-bg)', color: 'var(--text-primary)',
        border: `1px solid ${cfg.color}`, borderRadius: 'var(--radius)',
        boxShadow: `0 0 0 1px ${cfg.color}, 0 0 18px ${cfg.glow}`,
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ color: cfg.color, textShadow: `0 0 6px ${cfg.glow}`, display: 'inline-flex' }}>{icon}</span>}
      <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.tag}</span>
      <span style={{ flex: 1, lineHeight: 1.3 }}>{children}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex' }}>✕</button>
      )}
    </div>
  );
}
