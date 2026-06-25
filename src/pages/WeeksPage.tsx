import { useState, useRef, useCallback } from 'react';
import { CheckCheck, ListChecks, Plus, CircleSlash, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getWeeklyReviews, formatWeekRange, type WeekReview } from '@/services/review.service';
import { useUIStore } from '@/stores/ui.store';
import { useTrashTask } from '@/hooks/useTasks';
import { formatRelative } from '@/hooks/useDeadlineWatcher';
import { useToast } from '@/components/ui/Toast';

export function WeeksPage() {
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
          <span className="neon-text" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>
            ИТОГИ
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>
            <span style={{ color: 'var(--accent)' }}>›</span> ретроспектива по неделям
          </span>
        </div>

        {list.length === 0 && (
          <p className="font-mono py-10 text-center" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            // активности пока не было
          </p>
        )}

        <div className="flex flex-col gap-3">
          {list.map((week, i) => (
            <motion.div
              key={week.weekStart}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(i, 5) * 0.04 }}
            >
              <WeekBlock week={week} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function WeekBlock({ week }: { week: WeekReview }) {
  const setActiveTaskId = useUIStore((s) => s.setActiveTaskId);
  const trashTask = useTrashTask();
  const { toast } = useToast();
  const [trashingId, setTrashingId] = useState<string | null>(null);
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleTrash = useCallback((id: string) => {
    setTrashingId(id);
    trashTask.mutate(id, {
      onSuccess: () => toast('В корзину'),
      onError: () => setTrashingId(null),
    });
  }, [trashTask, toast]);

  const triggerBloom = useCallback((btn: HTMLButtonElement | null) => {
    if (!btn) return;
    btn.classList.remove('bloom-press');
    void btn.offsetWidth;
    btn.classList.add('bloom-press');
    btn.addEventListener('animationend', () => btn.classList.remove('bloom-press'), { once: true });
  }, []);

  const range = formatWeekRange(week.weekStart, week.weekEnd);
  const totalDone = week.resolvedTasks.length + week.planDoneCount;

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
        className="flex items-center gap-2 px-4 flex-wrap"
        style={{
          minHeight: 48,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(90deg, var(--accent-dim) 0%, transparent 60%)',
        }}
      >
        <span className="font-mono font-bold" style={{ fontSize: 16, color: 'var(--text-bright)', letterSpacing: 0.5 }}>
          {range}
        </span>
        {week.isCurrent && (
          <span
            className="font-mono"
            style={{
              fontSize: 11, padding: '2px 8px', letterSpacing: 1,
              color: 'var(--accent)', border: '1px solid var(--border)',
            }}
          >
            текущая
          </span>
        )}
        <div className="flex-1" />
        <span className="font-mono" style={{ fontSize: 14, color: totalDone > 0 ? 'var(--accent)' : 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
          {totalDone > 0 ? `сделано: ${totalDone}` : 'пусто'}
        </span>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-2.5 font-mono" style={{ fontSize: 13 }}>
        <Metric icon={<CheckCheck size={12} />} label="задач закрыто" value={week.resolvedTasks.length} highlight={week.resolvedTasks.length > 0} />
        <Metric icon={<ListChecks size={12} />} label="пунктов плана" value={week.planDoneCount} highlight={week.planDoneCount > 0} />
        <Metric icon={<Plus size={12} />} label="задач создано" value={week.createdCount} />
        {week.planMissedCount > 0 && (
          <Metric icon={<CircleSlash size={12} />} label="пропущено" value={week.planMissedCount} danger />
        )}
      </div>

      {/* Resolved tasks */}
      {week.resolvedTasks.length > 0 && (
        <div className="px-3 pb-2">
          <div className="font-mono mb-1" style={{ fontSize: 12, letterSpacing: 1, color: 'var(--text-muted)' }}>
            ▸ ЗАКРЫТЫЕ ЗАДАЧИ
          </div>
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {week.resolvedTasks.map((t) => {
                const isTrashing = trashingId === t.id;
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{
                      opacity: isTrashing ? 0.4 : 1,
                      filter: isTrashing ? 'blur(5px)' : 'blur(0px)',
                      scale: isTrashing ? 0.98 : 1,
                    }}
                    exit={{
                      opacity: 0,
                      filter: 'blur(8px)',
                      scale: 0.96,
                      height: 0,
                      transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
                    }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="row-hover flex items-center gap-2 font-mono overflow-hidden"
                    style={{
                      borderLeft: '2px solid var(--accent)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <button
                      onClick={() => setActiveTaskId(t.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      style={{
                        fontSize: 14, padding: '8px 12px', minHeight: 44,
                        background: 'transparent', border: 'none',
                        color: 'inherit', cursor: 'pointer',
                      }}
                      title="открыть задачу"
                    >
                      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                      <span className="flex-1 truncate">{t.title}</span>
                      {t.category && (
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{t.category}</span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatRelative(t.resolved_at!)}
                      </span>
                    </button>
                    <button
                      ref={(el) => {
                        if (el) btnRefs.current.set(t.id, el);
                        else btnRefs.current.delete(t.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerBloom(btnRefs.current.get(t.id) ?? null);
                        handleTrash(t.id);
                      }}
                      title="В корзину"
                      style={{
                        width: 36, height: 36, flexShrink: 0, marginRight: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-dim)', cursor: 'pointer', opacity: 0.6,
                        transition: 'opacity 120ms ease, color 120ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-dim)'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Plan done */}
      {week.planDone.length > 0 && (
        <div className="px-3 pb-3">
          <div className="font-mono mb-1" style={{ fontSize: 12, letterSpacing: 1, color: 'var(--text-muted)' }}>
            ▸ ПЛАН / ЛИСТОК
          </div>
          <div className="flex flex-wrap gap-1.5">
            {planVisible.map((p) => (
              <span
                key={p.title}
                className="font-mono"
                style={{
                  fontSize: 12, padding: '3px 10px',
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
    <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
      <span style={{ color: danger ? 'var(--danger)' : highlight ? 'var(--accent)' : 'var(--text-dim)' }}>{icon}</span>
      {label}{' '}
      <b style={{ color: danger ? 'var(--danger)' : highlight ? 'var(--text-bright)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </b>
    </span>
  );
}
