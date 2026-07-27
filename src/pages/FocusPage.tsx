import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, CheckCheck, Play, Forward, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks, useUpdateStatus, useUpdateTask } from '@/hooks/useTasks';
import { useDeadlineWatcher, isOverdue, isDeadlineUrgent, formatDeadline } from '@/hooks/useDeadlineWatcher';
import { useUIStore } from '@/stores/ui.store';
import { useToast } from '@/components/ui/Toast';
import type { Task } from '@/types';

/**
 * Балл для фокуса — чем меньше, тем выше задача.
 *
 * Ярусы (каждый следующий начинается на TIER выше предыдущего, поэтому
 * порядок между ярусами жёсткий, а внутри яруса сортируем по времени):
 *   0 — просрочено          (нужно разобрать в первую очередь)
 *   1 — в работе            (уже начал — доведи до конца, даже без срока)
 *   2 — есть будущий срок    (по дате, ближайший первым)
 *   3 — всё остальное        (по статусу, затем по возрасту)
 *
 * Раньше любая задача с дедлайном била любую задачу без него — поэтому
 * начатая, но бессрочная задача не могла попасть в фокус никогда. Теперь
 * «в работе» — отдельный высокий ярус независимо от наличия срока.
 */
const TIER = 1e15;

function focusScore(task: Task): number {
  const now     = Date.now();
  const dl      = task.deadline ? new Date(task.deadline).getTime() : null;
  const created = new Date(task.created_at).getTime();
  const overdue = dl !== null && dl < now;

  if (overdue)                        return 0 * TIER + dl!;
  if (task.status === 'In Progress')  return 1 * TIER + (dl ?? created);
  if (dl !== null)                    return 2 * TIER + dl;

  const statusBias: Record<string, number> = {
    'Waiting Response': 1,
    'Escalation':       2,
    'New':              3,
    'Blocked':          4,
  };
  const bias = statusBias[task.status] ?? 5;
  return 3 * TIER + bias * 1e13 + created;
}

export function FocusPage() {
  const navigate    = useNavigate();
  const { data: tasks } = useTasks();
  const updateStatus = useUpdateStatus();
  const updateTask   = useUpdateTask();
  const openCapture  = useUIStore((s) => s.openCapture);
  const setActiveId  = useUIStore((s) => s.setActiveTaskId);
  const { toast }    = useToast();

  useDeadlineWatcher(tasks);

  const queue = useMemo(() => {
    return (tasks ?? [])
      .filter((t) => t.status !== 'Resolved' && t.status !== 'Archived')
      .sort((a, b) => focusScore(a) - focusScore(b));
  }, [tasks]);

  const current = queue[0] ?? null;
  const next    = queue.slice(1, 5);

  const stats = useMemo(() => {
    const all = tasks ?? [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const resolvedToday = all.filter((t) =>
      t.status === 'Resolved' && t.resolved_at &&
      new Date(t.resolved_at).getTime() >= today.getTime(),
    ).length;
    return { active: queue.length, doneToday: resolvedToday };
  }, [tasks, queue.length]);

  const handleDone = async () => {
    if (!current) return;
    try { await updateStatus.mutateAsync({ id: current.id, status: 'Resolved' }); }
    catch { toast('Не удалось выполнить', 'error'); }
  };

  const handleStart = async () => {
    if (!current) return;
    try { await updateStatus.mutateAsync({ id: current.id, status: 'In Progress' }); }
    catch { toast('Не удалось перевести в работу', 'error'); }
  };

  const handleSnooze = async () => {
    if (!current) return;
    // Отсчёт от максимума (срок, сегодня): у просроченной задачи старый дедлайн
    // в прошлом — если считать от него, «+1д» снова окажется в прошлом и кнопка
    // будет как будто не работать. Берём max, чтобы всегда получить будущее.
    const now = Date.now();
    const from = current.deadline ? Math.max(new Date(current.deadline).getTime(), now) : now;
    const base = new Date(from);
    base.setDate(base.getDate() + 1);
    base.setHours(23, 59, 59, 999);
    try {
      await updateTask.mutateAsync({ id: current.id, updates: { deadline: base.toISOString() } });
      toast(`Отложено на ${formatDeadline(base.toISOString())}`);
    }
    catch { toast('Не удалось отложить', 'error'); }
  };

  /* ── Empty state ──────────────────────────────────────── */
  if (!current) {
    return (
      <div style={{ padding: '14px 14px 28px' }}>
        <SectionTitle icon={<Target size={18} color="var(--accent)" />} title="фокус на сегодня" meta={`${stats.active} активных`} />
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          padding: '40px 0',
        }}>
          <CheckCheck size={36} style={{ color: 'var(--accent)', opacity: 0.7 }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>всё сделано</p>
            <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              {stats.doneToday > 0 ? `сегодня выполнено ${stats.doneToday} задач` : 'активных задач нет'}
            </p>
          </div>
          <button
            onClick={openCapture}
            className="font-mono"
            style={{
              height: 48, padding: '0 28px', fontSize: 14,
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent)', cursor: 'pointer',
            }}
          >
            + новая задача
          </button>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(current.deadline);
  const urgent  = isDeadlineUrgent(current.deadline);

  return (
    <div style={{ padding: '14px 14px 28px' }}>
      {/* Section title */}
      <SectionTitle
        icon={<Target size={18} color="var(--accent)" />}
        title="фокус на сегодня"
        meta={`${stats.active} активных`}
      />

      {/* ── Hero card ─────────────────────────────────────── */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${overdue ? 'var(--danger)' : 'var(--accent)'}`,
          borderRadius: 'var(--radius-card)',
          boxShadow: overdue
            ? '0 0 0 1px var(--danger), 0 0 22px rgba(255,0,60,0.5)'
            : '0 0 0 1px var(--accent), 0 0 18px var(--accent-glow)',
          padding: 16,
          marginBottom: 12,
        }}
      >
        {/* Header: blinking LED + "СЕЙЧАС В ФОКУСЕ" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <span className="led led-blink" style={{ width: 7, height: 7, flexShrink: 0 }} />
          <span
            className="neon-text"
            style={{ letterSpacing: 1.5, fontSize: 11 }}
          >
            СЕЙЧАС В ФОКУСЕ
          </span>
          {current.category && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
              #{current.category}
            </span>
          )}
        </div>

        {/* Title */}
        <div
          onClick={() => setActiveId(current.id)}
          style={{
            fontSize: 21, fontWeight: 700, lineHeight: 1.3,
            color: 'var(--text-bright)', margin: '12px 0 14px',
            cursor: 'pointer',
          }}
        >
          {current.title}
        </div>

        {/* Footer: deadline + done button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {current.deadline && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: overdue ? 'var(--danger)' : urgent ? 'var(--warning)' : 'var(--text-muted)',
              fontWeight: overdue ? 700 : 400,
            }}>
              <Clock size={14} />
              {(() => {
                const label = formatDeadline(current.deadline!);
                // formatDeadline сам возвращает «просрочено Nд» при diff < -1 —
                // не дублируем слово, префикс добавляем только для «сегодня/вчера».
                return overdue && !label.startsWith('просрочено') ? `просрочено · ${label}` : label;
              })()}
            </span>
          )}
          <button
            onClick={handleDone}
            disabled={updateStatus.isPending}
            style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 44, padding: '0 16px',
              background: 'var(--accent)', color: '#000',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600,
              cursor: updateStatus.isPending ? 'wait' : 'pointer',
              boxShadow: '0 0 12px var(--accent-glow)',
              opacity: updateStatus.isPending ? 0.6 : 1,
            }}
          >
            <CheckCheck size={16} strokeWidth={2.5} /> готово
          </button>
        </div>
      </motion.div>

      {/* ── Secondary actions ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {current.status !== 'In Progress' && (
          <SecBtn
            icon={<Play size={13} />}
            label="в работу"
            onClick={handleStart}
            disabled={updateStatus.isPending}
          />
        )}
        <SecBtn
          icon={<Forward size={13} />}
          label="отложить +1д"
          onClick={handleSnooze}
          disabled={updateTask.isPending}
        />
        <SecBtn
          icon={<span style={{ fontSize: 12 }}>↗</span>}
          label="открыть"
          onClick={() => setActiveId(current.id)}
        />
      </div>

      {/* ── Queue ─────────────────────────────────────────── */}
      {next.length > 0 && (
        <>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: 1, margin: '4px 2px 10px',
          }}>
            далее в очереди
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {next.map((t) => {
              const od = isOverdue(t.deadline);
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    minHeight: 56, padding: '10px 12px', cursor: 'pointer',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 20, height: 20, flexShrink: 0, borderRadius: '50%',
                    border: `1.5px solid var(--border-strong)`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }} />
                  <span style={{ flex: 1, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.3, textAlign: 'left' }}>
                    {t.title}
                  </span>
                  {t.deadline && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, flexShrink: 0,
                      color: od ? 'var(--danger)' : 'var(--text-muted)',
                    }}>
                      {formatDeadline(t.deadline)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/board')}
            className="font-mono"
            style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: 12,
            }}
          >
            открыть всю доску <ChevronRight size={12} />
          </button>
        </>
      )}
    </div>
  );
}

/* ── SectionTitle ──────────────────────────────────────── */
function SectionTitle({ icon, title, meta }: { icon: ReactNode; title: string; meta?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px 12px' }}>
      {icon}
      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 0.3, flex: 1 }}>
        {title}
      </span>
      {meta != null && (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
          {meta}
        </span>
      )}
    </div>
  );
}

/* ── Secondary action button ───────────────────────────── */
function SecBtn({ icon, label, onClick, disabled }: {
  icon: ReactNode; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-mono"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 38, padding: '0 12px', fontSize: 12,
        background: 'transparent', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
        cursor: disabled ? 'wait' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'border-color 150ms, color 150ms',
      }}
    >
      {icon} {label}
    </button>
  );
}
