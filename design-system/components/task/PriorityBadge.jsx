import React from 'react';

const PRIO = {
  A: { color: 'var(--prio-a)', label: 'критично' },
  B: { color: 'var(--prio-b)', label: 'высокий' },
  C: { color: 'var(--prio-c)', label: 'обычный' },
  D: { color: 'var(--prio-d)', label: 'низкий' },
};

/** Priority pill — letter grade A–D with its semantic color. */
export function PriorityBadge({ priority = 'C', showLabel = true, style }) {
  const cfg = PRIO[priority] ?? PRIO.C;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '1px 8px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
        color: cfg.color, background: `${cfg.color}1A`,
        border: `1px solid ${cfg.color}55`, borderRadius: 'var(--radius-pill)', ...style,
      }}
    >
      {priority}{showLabel && ` · ${cfg.label}`}
    </span>
  );
}

/** Left edge stripe used on task cards / rows to flag priority at a glance. */
export function PriorityStripe({ priority = 'C' }) {
  const cfg = PRIO[priority] ?? PRIO.C;
  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
      background: cfg.color, boxShadow: `0 0 6px ${cfg.color}, inset 0 0 2px rgba(255,255,255,0.5)`,
    }} />
  );
}
