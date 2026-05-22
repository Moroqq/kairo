import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { TaskCard } from '@/components/task/TaskCard';
import type { Task, KanbanColumn as KanbanColumnType } from '@/types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const sorted = [...tasks].sort((a, b) => {
    const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
    const pDiff  = pOrder[a.priority] - pOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 280 }}>
      {/* Column header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {column.title}
          </h3>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-mono font-medium"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 flex-1 min-h-20 rounded-card p-2 transition-colors duration-150"
        style={{
          background:  isOver ? 'rgba(0,229,192,0.04)' : 'var(--bg-surface)',
          border:      `1px solid ${isOver ? 'rgba(0,229,192,0.2)' : 'var(--border-subtle)'}`,
          minHeight:   120,
        }}
      >
        <AnimatePresence initial={false}>
          {sorted.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isOver ? 'Drop here' : 'Empty'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
