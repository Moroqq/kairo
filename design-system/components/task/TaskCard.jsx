import React from 'react';

/**
 * Task card — the core board/list unit. Title row, category chip, comment
 * count, deadline (turns amber when urgent, red + glow when overdue) and a
 * created-relative footer. Hover lifts the neon border; `urgent` adds the
 * deadline pulse. Pass a lucide chevron via `advanceIcon` for the advance
 * button, or omit `onAdvance` to hide it.
 */
export function TaskCard({
  title, category, deadline, deadlineState = 'none', comments = 0, createdLabel,
  urgent = false, onClick, onAdvance, advanceIcon = '›', style,
}) {
  const dl = {
    none:    'var(--text-muted)',
    urgent:  'var(--warning)',
    overdue: 'var(--danger)',
  }[deadlineState] || 'var(--text-muted)';

  return (
    <div
      className={`row-hover${urgent ? ' deadline-pulse' : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 0 14px var(--accent-glow)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '8px 10px', cursor: 'default',
        transition: 'border-color 140ms ease-out, box-shadow 140ms ease-out', ...style,
      }}
    >
      {/* Title + advance */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <p style={{ flex: 1, minWidth: 0, fontSize: 11, lineHeight: 1.35, color: 'var(--text-primary)', fontWeight: 500 }}>{title}</p>
        {onAdvance && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            title="следующий этап"
            style={{ flexShrink: 0, width: 22, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 0 10px var(--accent-glow)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >{advanceIcon}</button>
        )}
      </div>

      {/* Meta row 1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {category && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '0 5px', color: 'var(--accent)', border: '1px solid var(--border)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category}</span>
          )}
          {comments > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>❝ {comments}</span>
          )}
        </div>
        {deadline && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, flexShrink: 0, color: dl, fontWeight: deadlineState === 'overdue' ? 600 : 400, textShadow: deadlineState === 'overdue' ? '0 0 6px rgba(255,0,60,0.6)' : 'none' }}>⏱ {deadline}</span>
        )}
      </div>

      {/* Meta row 2 */}
      {createdLabel && (
        <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>создано {createdLabel}</div>
      )}
    </div>
  );
}
