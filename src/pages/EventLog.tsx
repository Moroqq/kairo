import { ScrollText, Loader2 } from 'lucide-react';
import { useEventLogs } from '@/hooks/useTasks';

const EVENT_LABELS: Record<string, string> = {
  created:          'create',
  status_changed:   'status',
  priority_changed: 'prior',
  comment_added:    'comment',
  archived:         'archive',
  resolved:         'done',
};

const EVENT_KIND: Record<string, 'ok' | 'err' | 'info'> = {
  resolved: 'ok',
  created:  'info',
  archived: 'info',
  status_changed:   'info',
  priority_changed: 'info',
  comment_added:    'info',
};

const KIND_COLOR: Record<string, string> = {
  ok:   'var(--success, var(--accent))',
  err:  'var(--danger)',
  info: 'var(--info, var(--text-muted))',
};

export function EventLog() {
  const { data: logs, isLoading } = useEventLogs();

  return (
    <div style={{ padding: '14px 14px 28px' }}>
      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px 12px' }}>
        <ScrollText size={18} color="var(--accent)" />
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 0.3, flex: 1 }}>
          события
        </span>
        {logs && (
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {logs.length} записей
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 size={16} className="neon-text" style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {!isLoading && (!logs || logs.length === 0) && (
        <div className="font-mono text-center py-10" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          // событий пока нет
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(logs ?? []).map((log, i) => {
          const kind    = EVENT_KIND[log.event_type] ?? 'info';
          const color   = KIND_COLOR[kind];
          const tag     = EVENT_LABELS[log.event_type] ?? log.event_type;
          const isLast  = i === (logs?.length ?? 0) - 1;
          const time    = new Date(log.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          const date    = new Date(log.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
          return (
            <div
              key={log.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 6px',
                borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', width: 48, flexShrink: 0, paddingTop: 1 }}>
                {time}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 12, color, width: 64, flexShrink: 0, paddingTop: 1, fontWeight: 600 }}
              >
                [{tag}]
              </span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
              </span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, paddingTop: 2 }}>
                {date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
