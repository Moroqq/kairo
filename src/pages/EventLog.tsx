import { Loader2 } from 'lucide-react';
import { useEventLogs } from '@/hooks/useTasks';

const EVENT_LABELS: Record<string, string> = {
  created:          'СОЗДАНА',
  status_changed:   'СТАТУС',
  priority_changed: 'ПРИОР',
  comment_added:    'КОММ',
  archived:         'АРХИВ',
  resolved:         'ВЫПОЛН',
};

const EVENT_COLORS: Record<string, string> = {
  created:          'var(--accent)',
  status_changed:   'var(--info)',
  priority_changed: 'var(--warning)',
  comment_added:    'var(--text-muted)',
  archived:         'var(--text-muted)',
  resolved:         'var(--accent)',
};

export function EventLog() {
  const { data: logs, isLoading } = useEventLogs();

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ border: '1px solid var(--border)', background: 'var(--well-bg)' }}>
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="neon-text">▸</span>
          <span style={{ color: 'var(--text-bright)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            журнал событий
          </span>
          <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            — tail -f /var/log/kairo
          </span>
        </div>

        {/* Column header */}
        <div
          className="flex items-center px-3 py-1 font-mono"
          style={{
            background: 'var(--accent-dim)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: 10,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          <div style={{ width: 72 }}>тип</div>
          <div className="flex-1">событие</div>
          <div style={{ width: 120, textAlign: 'right' }}>время</div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="neon-text" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!isLoading && (!logs || logs.length === 0) && (
          <div className="text-center py-10 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            // событий пока нет
          </div>
        )}

        <div className="flex flex-col">
          {(logs ?? []).map((log) => {
            const color = EVENT_COLORS[log.event_type] ?? 'var(--text-muted)';
            const label = EVENT_LABELS[log.event_type] ?? log.event_type.toUpperCase();
            return (
              <div
                key={log.id}
                className="row-hover flex items-start gap-2 px-3 py-1.5 font-mono"
                style={{
                  fontSize: 11,
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div
                  style={{
                    width: 72,
                    color,
                    textShadow: `0 0 4px ${color}40`,
                    fontWeight: 600,
                  }}
                >
                  [{label}]
                </div>
                <div className="flex-1 min-w-0">
                  {(log as { task_title?: string }).task_title && (
                    <span style={{ color: 'var(--text-primary)' }}>
                      {(log as { task_title?: string }).task_title}
                    </span>
                  )}
                  {(log.old_value || log.new_value) && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {' '}
                      {log.old_value && <span>{log.old_value} → </span>}
                      <span style={{ color: 'var(--text-bright)' }}>{log.new_value}</span>
                    </span>
                  )}
                </div>
                <div style={{ width: 120, textAlign: 'right', color: 'var(--text-muted)', fontSize: 10 }}>
                  {new Date(log.created_at).toLocaleString('ru-RU', {
                    day: '2-digit', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
