import React from 'react';

/** Spinning terminal loader (CSS `spin` keyframe from effects.css). */
export function Spinner({ size = 18, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'var(--accent)'} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite', ...style }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/** Three-dot pulse with an optional trailing label — used for AI "parsing" states. */
export function LoadingDots({ label = 'разбор…' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="dot-pulse" style={{ display: 'inline-flex', gap: 4 }}>
        <span /><span /><span />
      </span>
      {label && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  );
}
