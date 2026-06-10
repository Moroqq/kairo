import { Repeat, ListChecks } from 'lucide-react';
import { fromISODate } from '@/lib/date';
import { useArchive } from '@/hooks/usePlan';
import { PRIORITY_CONFIG } from '@/types';

/** Архив выполненного: стопка мини-листков по дням, новые сверху. */
export function ArchiveView() {
  const { data: days } = useArchive();
  const list = days ?? [];

  if (list.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 160 }}>
        <p className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // архив пуст — нечего вспоминать
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full" style={{ padding: '12px 8px 24px' }}>
      {list.map(({ date, entries }) => {
        const d = fromISODate(date);
        const heading = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
        return (
          <div
            key={date}
            className="flex flex-col w-full"
            style={{
              maxWidth: 560,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-card)',
              padding: '10px 14px 12px',
            }}
          >
            <div className="flex items-baseline justify-between gap-2" style={{ marginBottom: 4 }}>
              <span className="font-hand" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {heading}
              </span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                ✓ {entries.length}
              </span>
            </div>

            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-2" style={{ minHeight: 28 }}>
                <span
                  className="flex-shrink-0"
                  style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_CONFIG[e.priority].color, opacity: 0.45 }}
                />
                <span
                  className="font-hand truncate flex-1 min-w-0"
                  style={{ fontSize: 18, color: 'var(--text-muted)', textDecoration: 'line-through', textDecorationColor: 'var(--text-dim)' }}
                >
                  {e.title}
                </span>
                {e.time && (
                  <span className="font-mono flex-shrink-0" style={{ fontSize: 9, color: 'var(--text-dim)' }}>{e.time}</span>
                )}
                {e.kind === 'occurrence' && <Repeat size={10} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />}
                {e.kind === 'task' && <ListChecks size={10} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
