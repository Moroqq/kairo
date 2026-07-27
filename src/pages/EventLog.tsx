import { ScrollText, Loader2 } from 'lucide-react';
import { useEventLogs } from '@/hooks/useTasks';
import { STATUS_LABELS } from '@/types';
import type { TaskStatus } from '@/types';

/** Английские значения статусов в логе → русские подписи (для status_changed). */
function ruValue(v: string | null | undefined): string | null {
  if (!v) return null;
  return STATUS_LABELS[v as TaskStatus] ?? v;
}

const EVENT_LABELS: Record<string, string> = {
  created:          'создано',
  status_changed:   'статус',
  priority_changed: 'приоритет',
  comment_added:    'коммент',
  trashed:          'в корзину',
  restored:         'возврат',
  archived:         'архив',
  resolved:         'готово',
};

const EVENT_KIND: Record<string, 'ok' | 'err' | 'info'> = {
  resolved:         'ok',
  restored:         'ok',
  created:          'info',
  archived:         'info',
  trashed:          'err',
  status_changed:   'info',
  priority_changed: 'info',
  comment_added:    'info',
};

const KIND_COLOR: Record<string, string> = {
  ok:   'var(--success, var(--accent))',
  err:  'var(--danger)',
  info: 'var(--info, var(--text-muted))',
};

/** «сегодня / вчера / 25 июля» — заголовок группы дня. */
function dayLabel(iso: string): string {
  const d     = new Date(iso);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff  = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** Группируем подряд идущие записи по календарному дню (логи уже по времени). */
function groupByDay<T extends { created_at: string }>(rows: T[]) {
  const groups: { key: string; label: string; items: T[] }[] = [];
  let cur: { key: string; label: string; items: T[] } | null = null;
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!cur || cur.key !== key) {
      cur = { key, label: dayLabel(r.created_at), items: [] };
      groups.push(cur);
    }
    cur.items.push(r);
  }
  return groups;
}

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
        {groupByDay(logs ?? []).map(({ key, label, items }) => (
          <div key={key}>
            {/* Заголовок дня — вместо мелкой даты у каждой строки */}
            <div
              className="font-mono"
              style={{
                position: 'sticky', top: 0, zIndex: 1,
                fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
                color: 'var(--text-muted)', background: 'var(--well-bg)',
                padding: '10px 6px 6px', borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {label}
            </div>
            {items.map((log) => {
              const kind  = EVENT_KIND[log.event_type] ?? 'info';
              const color = KIND_COLOR[kind];
              const tag   = EVENT_LABELS[log.event_type] ?? log.event_type;
              const time  = new Date(log.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={log.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 6px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', width: 42, flexShrink: 0, paddingTop: 1 }}>
                    {time}
                  </span>
                  <span
                    className="font-mono"
                    style={{ fontSize: 12, color, width: 84, flexShrink: 0, paddingTop: 1, fontWeight: 600 }}
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
                        {log.old_value && <span>{ruValue(log.old_value)} → </span>}
                        <span style={{ color: 'var(--text-bright)' }}>{ruValue(log.new_value)}</span>
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
