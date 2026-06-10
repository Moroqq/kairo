import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence } from 'framer-motion';
import { TaskCard } from '@/components/task/TaskCard';
import { useTheme } from '@/stores/theme.store';
import type { Task, KanbanColumn as KanbanColumnType } from '@/types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: Task[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const vocab = useTheme().vocab;

  const sorted = [...tasks].sort((a, b) => {
    if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ width: 280 }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-2 h-7"
        style={{
          background: 'var(--panel-bg)',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="neon-text" style={{ fontSize: 10 }}>▸</span>
          <span
            className="text-xs font-bold"
            style={{
              color: 'var(--text-bright)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textShadow: isOver ? '0 0 8px var(--accent-glow)' : 'none',
            }}
          >
            {vocab.columns[column.id] ?? column.title}
          </span>
        </div>
        <span
          className="font-mono"
          style={{
            color: 'var(--text-muted)',
            fontSize: 11,
          }}
        >
          [{tasks.length.toString().padStart(2, '0')}]
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 flex-1 p-2 overflow-y-auto"
        style={{
          background: isOver ? 'var(--accent-dim)' : 'var(--well-bg)',
          border: '1px solid var(--border)',
          borderTopColor: 'var(--border-subtle)',
          boxShadow: isOver ? 'inset 0 0 20px var(--accent-glow)' : 'none',
          minHeight: 120,
          transition: 'background 160ms, box-shadow 160ms',
        }}
      >
        <AnimatePresence initial={false}>
          {sorted.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-xs font-mono"
              style={{ color: 'var(--text-dim)' }}
            >
              {isOver ? '> бросьте сюда' : '// пусто'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
