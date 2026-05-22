import { Activity, Loader2 } from 'lucide-react';
import { useEventLogs } from '@/hooks/useTasks';

const EVENT_LABELS: Record<string, string> = {
  created:         'Task created',
  status_changed:  'Status changed',
  priority_changed:'Priority changed',
  comment_added:   'Comment added',
  archived:        'Task archived',
  resolved:        'Task resolved',
};

const EVENT_COLORS: Record<string, string> = {
  created:          'var(--accent)',
  status_changed:   'var(--p3)',
  priority_changed: 'var(--p2)',
  comment_added:    'var(--text-muted)',
  archived:         'var(--text-muted)',
  resolved:         'var(--success)',
};

export function EventLog() {
  const { data: logs, isLoading } = useEventLogs();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Activity Log
          </h2>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 size={20} style={{ color: 'var(--text-muted)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!isLoading && (!logs || logs.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-16">
            <Activity size={32} style={{ color: 'var(--border)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events yet</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {(logs ?? []).map((log, i) => {
            const color = EVENT_COLORS[log.event_type] ?? 'var(--text-muted)';
            const label = EVENT_LABELS[log.event_type] ?? log.event_type;
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 px-4 py-3 rounded-lg transition-colors"
                style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'transparent' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {label}
                    </span>
                    {(log as { task_title?: string }).task_title && (
                      <span className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
                        · {(log as { task_title?: string }).task_title}
                      </span>
                    )}
                  </div>
                  {(log.old_value || log.new_value) && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {log.old_value && <span style={{ color: 'var(--text-muted)' }}>{log.old_value} → </span>}
                      {log.new_value}
                    </p>
                  )}
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {new Date(log.created_at).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
