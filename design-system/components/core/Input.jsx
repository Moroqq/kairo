import React from 'react';

/**
 * Terminal text field. Optional chevron label (`› label`) and an `[error]`
 * line below. Focus ring is the global neon rule in effects.css.
 */
export function Input({ label, error, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> {label}
        </label>
      )}
      <input
        style={{
          height: 'var(--control-sm)', padding: '0 8px', fontSize: 11,
          fontFamily: 'var(--font-mono)', outline: 'none',
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', ...style,
        }}
        {...props}
      />
      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)', textShadow: '0 0 6px rgba(255,0,60,0.5)' }}>
          [error] {error}
        </p>
      )}
    </div>
  );
}

/** Multi-line variant of {@link Input}. */
export function Textarea({ label, error, rows = 3, style, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> {label}
        </label>
      )}
      <textarea
        rows={rows}
        style={{
          padding: '6px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
          outline: 'none', resize: 'none',
          background: 'var(--bg-input)', color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', ...style,
        }}
        {...props}
      />
      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--danger)' }}>[error] {error}</p>
      )}
    </div>
  );
}
