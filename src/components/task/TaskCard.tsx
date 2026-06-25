import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, ChevronRight } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { useUIStore } from '@/stores/ui.store';
import { useUpdateStatus } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { formatDeadline, isDeadlineUrgent, isOverdue, formatRelative } from '@/hooks/useDeadlineWatcher';

interface TaskCardProps {
  task: Task;
}

/**
 * Следующий статус в линейном workflow:
 *   New → In Progress → Resolved
 *   Waiting / Escalation → Resolved
 *   Blocked → In Progress (unblock)
 *   Resolved / Archived → null (terminal)
 */
const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  'New':              'In Progress',
  'In Progress':      'Resolved',
  'Waiting Response': 'Resolved',
  'Escalation':       'Resolved',
  'Blocked':          'In Progress',
  'Resolved':         null,
  'Archived':         null,
};

export function TaskCard({ task }: TaskCardProps) {
  const setActiveTaskId = useUIStore((s) => s.setActiveTaskId);
  const updateStatus    = useUpdateStatus();
  const { toast }       = useToast();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const urgent     = isDeadlineUrgent(task.deadline);
  const overdue    = isOverdue(task.deadline);
  const hasDeadline = !!task.deadline;
  const nextStatus = NEXT_STATUS[task.status];

  const style: React.CSSProperties = {
    transform:  CSS.Translate.toString(transform),
    opacity:    isDragging ? 0.7 : 1,
    cursor:     isDragging ? 'grabbing' : 'default',
    background: 'var(--bg-card)',
    border:     '1px solid var(--border)',
    boxShadow:  isDragging
      ? '0 0 0 1px var(--accent), 0 0 20px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.6)'
      : 'none',
    transition: isDragging ? 'none' : 'border-color 140ms ease-out, box-shadow 140ms ease-out, background 140ms ease-out',
  };

  const handleAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextStatus) return;
    try {
      await updateStatus.mutateAsync({ id: task.id, status: nextStatus });
    } catch {
      toast('Не удалось продвинуть задачу', 'error');
    }
  };

  const NEXT_LABELS: Record<string, string> = {
    'New':              'новая',
    'In Progress':      'в работе',
    'Waiting Response': 'ожидание',
    'Escalation':       'эскалация',
    'Blocked':          'блок',
    'Resolved':         'выполнена',
    'Archived':         'архив',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14 }}
      className={`row-hover task-card ${urgent ? 'deadline-pulse' : ''}`}
      onClick={() => setActiveTaskId(task.id)}
      onMouseEnter={(e) => {
        if (isDragging) return;
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent), 0 0 14px var(--accent-glow)';
      }}
      onMouseLeave={(e) => {
        if (isDragging) return;
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      {...listeners}
      {...attributes}
    >
      <div style={{ padding: '8px 10px' }}>
        {/* Title row + advance button */}
        <div className="flex items-start gap-2" style={{ marginBottom: 6 }}>
          <p
            className="text-xs leading-snug flex-1 min-w-0"
            style={{
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          >
            {task.title}
          </p>

          {nextStatus && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleAdvance}
              disabled={updateStatus.isPending}
              className="advance-btn flex items-center justify-center flex-shrink-0"
              style={{
                /* Hit-area 44×44px, визуальный span увеличен до 32×32 (был 22×18 — слишком мал).
                   Принцип #16 скилла: минимальная тач-зона 40×40px. */
                width: 44,
                height: 44,
                margin: -6,
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                cursor: updateStatus.isPending ? 'wait' : 'pointer',
                padding: 0,
              }}
              title={`следующий этап: ${NEXT_LABELS[nextStatus] ?? nextStatus}`}
            >
              <span
                className="flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  transition: 'border-color 140ms ease-out, background 140ms ease-out, box-shadow 140ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background  = 'var(--accent-dim)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow   = '0 0 0 1px var(--accent), 0 0 10px var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              >
                <ChevronRight size={16} />
              </span>
            </button>
          )}
        </div>

        {/* Meta row 1: категория + дедлайн справа */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {task.category && (
              <span
                className="font-mono truncate"
                style={{
                  fontSize: 10,
                  padding: '0 5px',
                  background: 'transparent',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                  maxWidth: 120,
                }}
              >
                {task.category}
              </span>
            )}
            {task.comments.length > 0 && (
              <span className="flex items-center gap-0.5 font-mono" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                <MessageSquare size={10} />
                {task.comments.length}
              </span>
            )}
          </div>

          {hasDeadline && (
            <span
              className="flex items-center gap-1 font-mono flex-shrink-0"
              style={{
                fontSize: 10,
                color: overdue ? 'var(--danger)' : urgent ? 'var(--warning)' : 'var(--text-muted)',
                fontWeight: overdue ? 600 : 400,
                textShadow: overdue ? '0 0 6px rgba(255,0,60,0.6)' : 'none',
              }}
            >
              <Clock size={10} />
              {formatDeadline(task.deadline!)}
            </span>
          )}
        </div>

        {/* Meta row 2: created relative */}
        <div
          className="flex items-center justify-between gap-2 font-mono"
          style={{ marginTop: 4, fontSize: 9, color: 'var(--text-dim)' }}
        >
          <span>создано {formatRelative(task.created_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}
