import React from 'react';

/**
 * Compact status pill. Defaults to a neutral elevated chip; pass `color`
 * (and optionally `bg`) for a tinted variant. In terminal themes the border
 * uses a faint tint of the text color.
 */
export function Badge({ color, bg, style, children, ...props }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '1px 8px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500,
        borderRadius: 'var(--radius-pill)',
        color: color ?? 'var(--text-secondary)',
        background: bg ?? 'var(--bg-elevated)',
        border: `1px solid ${color ?? 'var(--border)'}22`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
