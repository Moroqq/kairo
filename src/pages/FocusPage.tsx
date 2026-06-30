import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, CheckCheck, Play, Forward, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks, useUpdateStatus, useUpdateTask } from '@/hooks/useTasks';
import { useDeadlineWatcher, isOverdue, isDeadlineUrgent, formatDeadline, formatRelative } from '@/hooks/useDeadlineWatcher';
import { useUIStore } from '@/stores/ui.store';
import { useToast } from '@/components/ui/Toast';
import type { Task } from '@/types';

function focusScore(task: Task): number {
  if (task.deadline) {
    return new Date(task.deadline).getTime() - Date.now();
  }
  const FUTURE = Date.now() + 1000 * 60 * 60 * 24 * 365;
  const statusBias: Record<string, number> = {
    'In Progress':      0,
    'Waiting Response': 1,
    'Escalation':       2,
    'New':              3,
    'Blocked':          4,
  };
  const bias = statusBias[task.status] ?? 5;
  const created = new Date(task.created_at).getTime();
  return FUTURE + bias * 1e10 + (created - new Date('2020-01-01').getTime());
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
    const base = current.deadline ? new Date(current.deadline) : new Date();
    base.setDate(base.getDate() + 1);
    base.setHours(23, 59, 59, 999);
    try { await updateTask.mutateAsync({ id: current.id, updates: { deadline: base.toISOString() } }); }
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
            ? '0 0 0 1px var(--danger), 0 0 18px rgba(255,0,60,0.2)'
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
              {overdue ? 'просрочено · ' : ''}{formatDeadline(current.deadline)}
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
function SectionTitle({ icon, title, meta }: { icon: React.ReactNode; title: string; meta?: string }) {
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
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
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
