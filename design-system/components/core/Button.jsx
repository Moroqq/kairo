import React from 'react';

/**
 * Kairo terminal button. Flat surface, 1px translucent-accent border, neon
 * glow on hover/focus. Four variants, three sizes. Hover/active states are
 * driven by the global `.btn-flat` rules in effects.css.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon = null,
  disabled,
  children,
  style,
  ...props
}) {
  const sizes = {
    sm: { height: 'var(--control-sm)', padding: '0 12px', fontSize: 11 },
    md: { height: 'var(--control-md)', padding: '0 16px', fontSize: 11 },
    lg: { height: 'var(--control-lg)', padding: '0 24px', fontSize: 12 },
  };

  const variants = {
    primary: {
      background: 'var(--accent-dim)', color: 'var(--accent)',
      border: '1px solid var(--accent)', textShadow: '0 0 6px var(--accent-glow)',
      boxShadow: '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)', letterSpacing: 1,
    },
    secondary: {
      background: 'transparent', color: 'var(--text-secondary)',
      border: '1px solid var(--border)', letterSpacing: 0.5,
    },
    ghost: {
      background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent',
    },
    danger: {
      background: 'transparent', color: 'var(--danger)',
      border: '1px solid var(--border-danger)', textShadow: '0 0 6px rgba(255,0,60,0.5)', letterSpacing: 0.5,
    },
  };

  return (
    <button
      className="btn-flat"
      data-variant={variant}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: 'var(--font-mono)', userSelect: 'none', cursor: 'pointer',
        opacity: disabled || loading ? 0.4 : 1, whiteSpace: 'nowrap',
        ...sizes[size], ...variants[variant], ...style,
      }}
      {...props}
    >
      {loading ? (
        <span className="dot-pulse" style={{ display: 'inline-flex', gap: 4 }}>
          <span /><span /><span />
        </span>
      ) : (
        <>{icon}{children}</>
      )}
    </button>
  );
}
