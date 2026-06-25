import { useEffect, useCallback, useRef } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { pruneTrash } from '@/services/tasks.service';
import { useTrashTasks, useRestoreTask, usePermanentDelete } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';

function daysLeft(deletedAt: string | null): number {
  if (!deletedAt) return 3;
  const ms = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, 3 - Math.floor(ms / 86_400_000));
}

function dayLabel(n: number): string {
  if (n === 0) return 'удаляется сегодня';
  if (n === 1) return 'удалится завтра';
  if (n < 5)   return `удалится через ${n} дня`;
  return `удалится через ${n} дней`;
}

function useBloomPress() {
  return useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.classList.remove('bloom-press');
    void el.offsetWidth;
    el.classList.add('bloom-press');
    el.addEventListener('animationend', () => el.classList.remove('bloom-press'), { once: true });
  }, []);
}

export function TrashPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: tasks = [] } = useTrashTasks();
  const restore     = useRestoreTask();
  const permaDelete = usePermanentDelete();
  const bloom = useBloomPress();
  const removingIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    pruneTrash();
    qc.invalidateQueries({ queryKey: ['tasks', 'trash'] });
  }, [qc]);

  const handleRestore = useCallback((taskId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    bloom(e);
    removingIds.current.add(taskId);
    restore.mutate(taskId, {
      onSuccess: () => toast('Задача восстановлена'),
      onError: () => { removingIds.current.delete(taskId); toast('Ошибка восстановления', 'error'); },
    });
  }, [bloom, restore, toast]);

  const handlePermaDelete = useCallback((taskId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    bloom(e);
    removingIds.current.add(taskId);
    permaDelete.mutate(taskId, {
      onSuccess: () => toast('Удалено навсегда'),
      onError: () => { removingIds.current.delete(taskId); toast('Ошибка удаления', 'error'); },
    });
  }, [bloom, permaDelete, toast]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-3 font-mono flex-wrap">
          <span className="neon-text" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>
            КОРЗИНА
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>
            <span style={{ color: 'var(--accent)' }}>›</span> задачи удаляются автоматически через 3 дня
          </span>
          {tasks.length > 0 && (
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
              {tasks.length} задач
            </span>
          )}
        </div>

        {tasks.length === 0 && (
          <p className="font-mono py-10 text-center" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            // корзина пуста
          </p>
        )}

        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {tasks.map((task, i) => {
              const days = daysLeft(task.deleted_at);
              const urgent = days <= 1;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{
                    opacity: 0,
                    filter: 'blur(8px)',
                    scale: 0.96,
                    height: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                  }}
                  transition={{ duration: 0.14, delay: Math.min(i, 8) * 0.03 }}
                  className="flex items-center gap-2 overflow-hidden"
                  style={{
                    padding: '12px 14px',
                    border: `1px solid ${urgent ? 'var(--border-danger)' : 'var(--border-subtle)'}`,
                    background: 'var(--well-bg)',
                  }}
                >
                  <Trash2
                    size={14}
                    style={{ color: urgent ? 'var(--danger)' : 'var(--text-dim)', flexShrink: 0 }}
                  />

                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <span
                      className="font-mono truncate"
                      style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'line-through' }}
                    >
                      {task.title}
                    </span>
                    <span
                      className="flex items-center gap-1 font-mono"
                      style={{ fontSize: 11, color: urgent ? 'var(--danger)' : 'var(--text-dim)' }}
                    >
                      {urgent && <AlertTriangle size={10} />}
                      {dayLabel(days)}
                      {task.category && (
                        <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>{task.category}</span>
                      )}
                    </span>
                  </div>

                  {/* Restore */}
                  <button
                    onClick={(e) => handleRestore(task.id, e)}
                    disabled={restore.isPending}
                    title="Восстановить"
                    className="flex items-center justify-center"
                    style={{
                      width: 36, height: 36, flexShrink: 0,
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--accent)', cursor: 'pointer',
                      borderRadius: 'var(--radius)',
                      transition: 'border-color 120ms ease, background 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--accent-dim)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <RotateCcw size={14} />
                  </button>

                  {/* Delete forever */}
                  <button
                    onClick={(e) => handlePermaDelete(task.id, e)}
                    disabled={permaDelete.isPending}
                    title="Удалить навсегда"
                    className="flex items-center justify-center"
                    style={{
                      width: 36, height: 36, flexShrink: 0,
                      background: 'transparent', border: '1px solid var(--border-danger)',
                      color: 'var(--danger)', cursor: 'pointer',
                      borderRadius: 'var(--radius)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
