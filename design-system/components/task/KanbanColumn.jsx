import React from 'react';

/**
 * Kanban column shell — uppercase header with a `[NN]` count and a bordered
 * drop zone. Pass TaskCard children. `over` highlights the zone (drag-over);
 * empty state shows `// пусто`.
 */
export function KanbanColumn({ title, count, over = false, width = 280, fullWidth = false, children, style }) {
  const childArr = React.Children.toArray(children);
  const n = count ?? childArr.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: fullWidth ? 1 : 0, width: fullWidth ? '100%' : width, height: '100%', ...style }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', height: 28, background: 'var(--panel-bg)', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="neon-text" style={{ fontSize: 10 }}>▸</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 1.5, textTransform: 'uppercase', textShadow: over ? '0 0 8px var(--accent-glow)' : 'none' }}>{title}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>[{String(n).padStart(2, '0')}]</span>
      </div>
      {/* Drop zone */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: 8, overflowY: 'auto', minHeight: 120,
        background: over ? 'var(--accent-dim)' : 'var(--well-bg)',
        border: '1px solid var(--border)', borderTopColor: 'var(--border-subtle)',
        boxShadow: over ? 'inset 0 0 20px var(--accent-glow)' : 'none',
        transition: 'box-shadow 160ms',
      }}>
        {childArr.length > 0 ? children : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{over ? '> бросьте сюда' : '// пусто'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
