import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Clock, MessageSquare } from 'lucide-react';
import type { Task } from '@/types';
import { PRIORITY_CONFIG, STATUS_LABELS } from '@/types';
import { PriorityStripe } from './PriorityBadge';
import { Badge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/ui.store';
import { formatDeadline, isDeadlineUrgent, isOverdue } from '@/hooks/useDeadlineWatcher';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const setActiveTaskId = useUIStore((s) => s.setActiveTaskId);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style: React.CSSProperties = {
    transform:  CSS.Translate.toString(transform),
    opacity:    isDragging ? 0.4 : 1,
    cursor:     isDragging ? 'grabbing' : 'grab',
    position:   'relative',
    background: 'var(--bg-card)',
    border:     '1px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    boxShadow:  isDragging ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
    transition: isDragging ? 'none' : 'box-shadow 200ms ease-out',
    overflow:   'hidden',
    paddingLeft: 16,
  };

  const urgent   = isDeadlineUrgent(task.deadline);
  const overdue  = isOverdue(task.deadline);
  const hasDeadline = !!task.deadline;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={urgent ? 'deadline-pulse' : ''}
      onClick={() => setActiveTaskId(task.id)}
      {...listeners}
      {...attributes}
    >
      <PriorityStripe priority={task.priority} />

      <div className="p-3 pl-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p
            className="text-sm font-medium leading-snug flex-1 min-w-0"
            style={{ color: 'var(--text-primary)' }}
          >
            {task.title}
          </p>
          <Badge
            color={PRIORITY_CONFIG[task.priority].color}
            bg="transparent"
            style={{ flexShrink: 0, border: 'none', padding: '0 4px', fontSize: 11 }}
          >
            {task.priority}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {task.category && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {task.category}
              </span>
            )}
            <Badge
              style={{ fontSize: 10, border: 'none', padding: '2px 6px', background: 'var(--bg-elevated)' }}
            >
              {STATUS_LABELS[task.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {task.comments.length > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MessageSquare size={11} />
                {task.comments.length}
              </span>
            )}
            {hasDeadline && (
              <span
                className="flex items-center gap-1 text-xs font-mono"
                style={{ color: overdue ? 'var(--p1)' : urgent ? 'var(--p2)' : 'var(--text-muted)' }}
              >
                <Clock size={11} />
                {formatDeadline(task.deadline!)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
