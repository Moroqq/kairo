import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Clock, MessageSquare, ChevronRight, CheckCheck, Play, Forward } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks, useUpdateStatus, useUpdateTask } from '@/hooks/useTasks';
import { useDeadlineWatcher, isOverdue, isDeadlineUrgent, formatDeadline, formatRelative } from '@/hooks/useDeadlineWatcher';
import { useUIStore } from '@/stores/ui.store';
import { useToast } from '@/components/ui/Toast';
import { STATUS_LABELS } from '@/types';
import type { Task } from '@/types';

/* ──────────────────────────────────────────────────────────────
   Алгоритм выбора задачи фокуса.
   Меньший score = выше приоритет.
   ──────────────────────────────────────────────────────────── */
function focusScore(task: Task): number {
  // Просроченные / с дедлайном — сортируем по дельте до дедлайна.
  // Просроченные получают отрицательный score (самые «глубокие» в минусе = первыми).
  if (task.deadline) {
    return new Date(task.deadline).getTime() - Date.now();
  }
  // Без дедлайна — ранжируем по статусу, привязываем к будущей точке.
  // База — далеко в будущем, чтобы любая задача с дедлайном опередила.
  const FUTURE = Date.now() + 1000 * 60 * 60 * 24 * 365; // +1 год
  const statusBias: Record<string, number> = {
    'In Progress':      0,
    'Waiting Response': 1,
    'Escalation':       2,
    'New':              3,
    'Blocked':          4,
  };
  const bias = statusBias[task.status] ?? 5;
  // Старые задачи без дедлайна — выше (created раньше = меньше число = выше).
  const created = new Date(task.created_at).getTime();
  return FUTURE + bias * 1e10 + (created - new Date('2020-01-01').getTime());
}

export function FocusPage() {
  const navigate = useNavigate();
  const { data: tasks } = useTasks();
  const updateStatus = useUpdateStatus();
  const updateTask   = useUpdateTask();
  const openCapture  = useUIStore((s) => s.openCapture);
  const setActiveId  = useUIStore((s) => s.setActiveTaskId);
  const { toast }    = useToast();

  useDeadlineWatcher(tasks);

  // Активные + отсортированные по приоритету
  const queue = useMemo(() => {
    return (tasks ?? [])
      .filter((t) => t.status !== 'Resolved' && t.status !== 'Archived')
      .sort((a, b) => focusScore(a) - focusScore(b));
  }, [tasks]);

  const current = queue[0] ?? null;
  const next3   = queue.slice(1, 4);

  // Метрики дня
  const stats = useMemo(() => {
    const all = tasks ?? [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const resolvedToday = all.filter((t) =>
      t.status === 'Resolved' &&
      t.resolved_at &&
      new Date(t.resolved_at).getTime() >= today.getTime(),
    ).length;
    return {
      active:   queue.length,
      doneToday: resolvedToday,
      total:    all.length,
    };
  }, [tasks, queue.length]);

  /* ── Actions ────────────────────────────────────────────── */
  const handleDone = async () => {
    if (!current) return;
    try {
      await updateStatus.mutateAsync({ id: current.id, status: 'Resolved' });
    } catch {
      toast('Не удалось выполнить', 'error');
    }
  };

  const handleStart = async () => {
    if (!current) return;
    try {
      await updateStatus.mutateAsync({ id: current.id, status: 'In Progress' });
    } catch {
      toast('Не удалось перевести в работу', 'error');
    }
  };

  const handleSnooze = async () => {
    if (!current) return;
    // Берём дату дедлайна (или сегодня), сдвигаем на +1 день и ставим конец того дня (локально).
    const base = current.deadline ? new Date(current.deadline) : new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(23, 59, 59, 999);
    try {
      await updateTask.mutateAsync({
        id: current.id,
        updates: { deadline: base.toISOString() },
      });
    } catch {
      toast('Не удалось отложить', 'error');
    }
  };

  /* ── Empty state ────────────────────────────────────────── */
  if (!current) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center" style={{ padding: 24 }}>
        <div className="text-center flex flex-col items-center gap-6" style={{ maxWidth: 560 }}>
          <pre
            className="font-mono neon-text leading-tight"
            style={{ fontSize: 20, letterSpacing: 1 }}
          >
{`╔══════════════════════════╗
║     С И С Т Е М А       ║
║      В   П О К О Е      ║
╚══════════════════════════╝`}
          </pre>
          <p className="font-mono" style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
            активных задач нет
          </p>
          <p className="font-mono" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {stats.doneToday > 0
              ? `сегодня выполнено: ${stats.doneToday}`
              : 'начни новую задачу — мозг готов'}
          </p>
          <button
            onClick={openCapture}
            className="bevel-raised font-mono"
            style={{ height: 58, padding: '0 40px', fontSize: 17, background: 'var(--bg-surface)', color: 'var(--accent)' }}
          >
            <span style={{ color: 'var(--accent)' }}>$</span> создать задачу
          </button>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(current.deadline);
  const urgent  = isDeadlineUrgent(current.deadline);

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '16px 16px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div
              className="neon-text font-mono"
              style={{ fontSize: 13, letterSpacing: 3, fontWeight: 700 }}
            >
              › ФОКУС
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
              что делать сейчас
            </div>
          </div>
          <div className="font-mono text-right" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            <div>в очереди: <span style={{ color: 'var(--text-bright)' }}>{stats.active.toString().padStart(2, '0')}</span></div>
            <div>сегодня: <span style={{ color: 'var(--accent)' }}>+{stats.doneToday}</span></div>
          </div>
        </div>

        {/* ── Current task card ──────────────────────────── */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="cursor-pointer"
          onClick={() => setActiveId(current.id)}
          style={{
            background: 'var(--bg-card)',
            border: `1px solid ${overdue ? 'var(--danger)' : 'var(--accent)'}`,
            boxShadow: overdue
              ? '0 0 0 1px var(--danger), 0 0 32px rgba(255,0,60,0.25), 0 0 80px rgba(255,0,60,0.08)'
              : '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow), 0 0 80px rgba(0,255,65,0.08)',
            padding: '20px 22px',
          }}
        >
          {/* Meta line */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                padding: '1px 6px',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
              }}
            >
              {STATUS_LABELS[current.status]}
            </span>
            {current.category && (
              <span className="flex items-center gap-1 font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                <Tag size={10} /> {current.category}
              </span>
            )}
            {current.deadline && (
              <span
                className="flex items-center gap-1 font-mono"
                style={{
                  fontSize: 10,
                  color: overdue ? 'var(--danger)' : urgent ? 'var(--warning)' : 'var(--text-muted)',
                  fontWeight: overdue ? 700 : 400,
                  textShadow: overdue ? '0 0 6px rgba(255,0,60,0.6)' : 'none',
                }}
              >
                <Clock size={10} />
                {overdue ? 'просрочено · ' : ''}{formatDeadline(current.deadline)}
              </span>
            )}
            {current.comments.length > 0 && (
              <span className="flex items-center gap-0.5 font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                <MessageSquare size={10} /> {current.comments.length}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 24,
              lineHeight: 1.25,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: current.description ? 12 : 6,
              letterSpacing: 0.2,
            }}
          >
            {current.title}
          </h1>

          {/* Description preview */}
          {current.description && (
            <p
              className="font-mono"
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                marginBottom: 6,
                whiteSpace: 'pre-wrap',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {current.description}
            </p>
          )}

          {/* Created */}
          <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>
            создано {formatRelative(current.created_at)}
          </p>
        </motion.div>

        {/* ── Action bar ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mt-4">
          <ActionBtn
            icon={<CheckCheck size={13} />}
            label="выполнено"
            onClick={handleDone}
            primary
            disabled={updateStatus.isPending}
          />
          {current.status !== 'In Progress' && (
            <ActionBtn
              icon={<Play size={13} />}
              label="в работу"
              onClick={handleStart}
              disabled={updateStatus.isPending}
            />
          )}
          <ActionBtn
            icon={<Forward size={13} />}
            label="отложить +1д"
            onClick={handleSnooze}
            disabled={updateTask.isPending}
          />
        </div>

        {/* ── Up next ────────────────────────────────────── */}
        {next3.length > 0 && (
          <div className="mt-8">
            <div
              className="font-mono mb-2"
              style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-muted)' }}
            >
              ▸ ДАЛЬШЕ В ОЧЕРЕДИ
            </div>
            <div className="flex flex-col">
              {next3.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className="row-hover text-left font-mono flex items-center gap-2"
                  style={{
                    fontSize: 12,
                    padding: '7px 10px',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderBottom: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>·</span>
                  <span className="flex-1 truncate">{t.title}</span>
                  {t.deadline && (
                    <span
                      style={{
                        fontSize: 10,
                        color: isOverdue(t.deadline) ? 'var(--danger)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      {formatDeadline(t.deadline)}
                    </span>
                  )}
                </button>
              ))}
              <div style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            </div>
            <button
              onClick={() => navigate('/board')}
              className="font-mono mt-3 flex items-center gap-1"
              style={{
                fontSize: 11,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              открыть всю доску
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function ActionBtn({
  icon, label, onClick, primary, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 h-8 px-3 font-mono transition-all"
      style={{
        fontSize: 11,
        background: primary ? 'var(--accent-dim)' : 'transparent',
        color: primary ? 'var(--accent)' : 'var(--text-secondary)',
        border: `1px solid ${primary ? 'var(--accent)' : 'var(--border)'}`,
        textShadow: primary ? '0 0 6px var(--accent-glow)' : 'none',
        boxShadow: primary ? '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)' : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'wait' : 'pointer',
        letterSpacing: 0.5,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 0 14px var(--accent-glow)';
        e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (primary) return;
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {icon}
      {label}
    </button>
  );
}
