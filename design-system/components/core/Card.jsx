import React from 'react';

/**
 * Flat terminal surface. With `title`, renders a terminal title bar (●  TITLE
 * ✕) above the body. Use `well` for the recessed/sunken variant. Hover glow
 * is opt-in via `interactive`.
 */
export function Card({ title, well = false, interactive = false, onClose, children, style, bodyStyle, ...props }) {
  return (
    <div
      className={interactive ? 'bevel-raised' : ''}
      style={{
        background: well ? 'var(--well-bg)' : 'var(--bg-card)',
        border: `1px solid ${well ? 'var(--border-subtle)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        boxShadow: well ? 'inset 0 0 0 1px rgba(0,0,0,0.4)' : 'var(--shadow-card)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {title && (
        <div className="titlebar">
          <span className="neon-text">●</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          {onClose && <button className="titlebar-btn" onClick={onClose} title="Close">✕</button>}
        </div>
      )}
      <div style={{ padding: 12, ...bodyStyle }}>{children}</div>
    </div>
  );
}
