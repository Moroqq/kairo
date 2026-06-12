import { CheckCheck, ListChecks, Plus, CircleSlash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getWeeklyReviews, formatWeekRange, type WeekReview } from '@/services/review.service';
import { useUIStore } from '@/stores/ui.store';
import { formatRelative } from '@/hooks/useDeadlineWatcher';

export function WeeksPage() {
  // Через React Query: пересчитается при инвалидации plan/tasks (общие мутации это делают)
  const { data: reviews } = useQuery({
    queryKey: ['tasks', 'weekly-reviews'],
    queryFn: () => getWeeklyReviews(12),
    staleTime: 10_000,
  });

  const list = reviews ?? [];

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-3 font-mono">
          <span className="neon-text" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
            ИТОГИ
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
            <span style={{ color: 'var(--accent)' }}>›</span> ретроспектива по неделям
          </span>
        </div>

        {list.length === 0 && (
          <p className="font-mono text-xs py-10 text-center" style={{ color: 'var(--text-dim)' }}>
            // активности пока не было
          </p>
        )}

        <div className="flex flex-col gap-3">
          {list.map((week) => (
            <WeekBlock key={week.weekStart} week={week} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function WeekBlock({ week }: { week: WeekReview }) {
  const setActiveTaskId = useUIStore((s) => s.setActiveTaskId);

  const range = formatWeekRange(week.weekStart, week.weekEnd);
  const totalDone = week.resolvedTasks.length + week.planDoneCount;

  // Сколько показать пунктов плана сразу (остальное в +N)
  const PLAN_VISIBLE = 8;
  const planVisible = week.planDone.slice(0, PLAN_VISIBLE);
  const planHidden  = week.planDone.length - planVisible.length;

  return (
    <section
      style={{
        border: `1px solid ${week.isCurrent ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        background: 'var(--well-bg)',
      }}
    >
      {/* Week header */}
      <div
        className="flex items-center gap-2 px-3 flex-wrap"
        style={{
          minHeight: 38,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(90deg, var(--accent-dim) 0%, transparent 60%)',
        }}
      >
        <span className="font-mono font-bold" style={{ fontSize: 13, color: 'var(--text-bright)', letterSpacing: 0.5 }}>
          {range}
        </span>
        {week.isCurrent && (
          <span
            className="font-mono"
            style={{
              fontSize: 9, padding: '1px 6px', letterSpacing: 1,
              color: 'var(--accent)', border: '1px solid var(--border)',
            }}
          >
            текущая
          </span>
        )}
        <div className="flex-1" />
        <span className="font-mono" style={{ fontSize: 11, color: totalDone > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
          {totalDone > 0 ? `сделано: ${totalDone}` : 'пусто'}
        </span>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-3 py-2 font-mono" style={{ fontSize: 11 }}>
        <Metric icon={<CheckCheck size={11} />} label="задач закрыто" value={week.resolvedTasks.length} highlight={week.resolvedTasks.length > 0} />
        <Metric icon={<ListChecks size={11} />} label="пунктов плана" value={week.planDoneCount} highlight={week.planDoneCount > 0} />
        <Metric icon={<Plus size={11} />} label="задач создано" value={week.createdCount} />
        {week.planMissedCount > 0 && (
          <Metric icon={<CircleSlash size={11} />} label="пропущено" value={week.planMissedCount} danger />
        )}
      </div>

      {/* Resolved tasks */}
      {week.resolvedTasks.length > 0 && (
        <div className="px-3 pb-2">
          <div className="font-mono mb-1" style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)' }}>
            ▸ ЗАКРЫТЫЕ ЗАДАЧИ
          </div>
          <div className="flex flex-col">
            {week.resolvedTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTaskId(t.id)}
                className="row-hover flex items-center gap-2 font-mono text-left"
                style={{
                  fontSize: 12, padding: '4px 8px',
                  background: 'transparent', border: 'none',
                  borderLeft: '2px solid var(--accent)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                title="открыть задачу"
              >
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                <span className="flex-1 truncate">{t.title}</span>
                {t.category && (
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{t.category}</span>
                )}
                <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>
                  {formatRelative(t.resolved_at!)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan done */}
      {week.planDone.length > 0 && (
        <div className="px-3 pb-3">
          <div className="font-mono mb-1" style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)' }}>
            ▸ ПЛАН / ЛИСТОК
          </div>
          <div className="flex flex-wrap gap-1.5">
            {planVisible.map((p) => (
              <span
                key={p.title}
                className="font-mono"
                style={{
                  fontSize: 11, padding: '2px 8px',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--accent-dim)',
                }}
              >
                ✓ {p.title}{p.count > 1 ? ` ×${p.count}` : ''}
              </span>
            ))}
            {planHidden > 0 && (
              <span className="font-mono" style={{ fontSize: 11, padding: '2px 4px', color: 'var(--text-dim)' }}>
                +{planHidden}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({
  icon, label, value, highlight, danger,
}: {
  icon: React.ReactNode; label: string; value: number; highlight?: boolean; danger?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
      <span style={{ color: danger ? 'var(--danger)' : highlight ? 'var(--accent)' : 'var(--text-dim)' }}>{icon}</span>
      {label}{' '}
      <b style={{ color: danger ? 'var(--danger)' : highlight ? 'var(--text-bright)' : 'var(--text-secondary)' }}>
        {value}
      </b>
    </span>
  );
}
