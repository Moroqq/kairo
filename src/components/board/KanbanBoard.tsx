import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AlertCircle, Loader2 } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from '@/components/task/TaskCard';
import { useTasks, useUpdateStatus } from '@/hooks/useTasks';
import { useDeadlineWatcher, isOverdue } from '@/hooks/useDeadlineWatcher';
import { useUIStore } from '@/stores/ui.store';
import { useToast } from '@/components/ui/Toast';
import { KANBAN_COLUMNS } from '@/types';
import type { Task, KanbanColumnId, TaskStatus } from '@/types';

export function KanbanBoard() {
  const { data: allTasks, isLoading, error } = useTasks();
  const updateStatus = useUpdateStatus();
  const { toast }    = useToast();
  const searchQuery  = useUIStore((s) => s.searchQuery);
  const filterPrio   = useUIStore((s) => s.filterPriority);
  const filterCat    = useUIStore((s) => s.filterCategory);

  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  useDeadlineWatcher(allTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const filteredTasks = (allTasks ?? []).filter((t) => {
    if (filterPrio && t.priority !== filterPrio) return false;
    if (filterCat  && t.category !== filterCat)  return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.category ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const getColumnTasks = (columnId: KanbanColumnId) => {
    const col = KANBAN_COLUMNS.find((c) => c.id === columnId)!;
    return filteredTasks.filter((t) => col.statuses.includes(t.status));
  };

  // ─── KAIRO MATRIX metrics (на полном наборе, без фильтров) ────────────────
  const metrics = useMemo(() => {
    const all = allTasks ?? [];
    const active   = all.filter((t) => t.status !== 'Resolved' && t.status !== 'Archived');
    const resolved = all.filter((t) => t.status === 'Resolved').length;
    const totalCounted = active.length + resolved;
    const efficiency = totalCounted === 0 ? 0 : Math.round((resolved / totalCounted) * 100);

    // Фокус = ближайший не-просрочённый дедлайн, иначе первая «в работе», иначе первая активная
    const withDeadline = active
      .filter((t) => t.deadline && !isOverdue(t.deadline))
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    const focus =
      withDeadline[0]
      ?? active.find((t) => t.status === 'In Progress')
      ?? active[0]
      ?? null;

    return { focus, efficiency, executed: resolved };
  }, [allTasks]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = allTasks?.find((t) => t.id === active.id) ?? null;
    setDraggingTask(task);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setDraggingTask(null);
    if (!over) return;

    const taskId       = active.id as string;
    const targetColId  = over.id as KanbanColumnId;
    const targetCol    = KANBAN_COLUMNS.find((c) => c.id === targetColId);
    if (!targetCol) return;

    const task = allTasks?.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus: TaskStatus = targetCol.defaultStatus;
    if (task.status === newStatus) return;

    try {
      await updateStatus.mutateAsync({ id: taskId, status: newStatus });
    } catch {
      toast('Не удалось обновить статус', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} style={{ color: 'var(--text-muted)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
        <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>не удалось загрузить задачи</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {/* KAIRO MATRIX header */}
        <div
          className="flex items-center gap-4 px-3 py-2 font-mono"
          style={{
            background: 'linear-gradient(90deg, rgba(0,255,65,0.05) 0%, transparent 70%)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex flex-col" style={{ minWidth: 130 }}>
            <span
              className="neon-text"
              style={{ fontSize: 13, letterSpacing: 3, fontWeight: 700, lineHeight: 1.1 }}
            >
              KAIRO MATRIX
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
              <span style={{ color: 'var(--accent)' }}>›</span> система задач
            </span>
          </div>

          <Divider />

          <Metric label="ФОКУС">
            <span
              className="truncate inline-block"
              style={{
                color: metrics.focus ? 'var(--text-primary)' : 'var(--text-dim)',
                maxWidth: 280,
                verticalAlign: 'bottom',
              }}
            >
              {metrics.focus?.title ?? '— нет активных задач —'}
            </span>
          </Metric>

          <Divider />

          <Metric label="ЭФФ">
            <span className="neon-text" style={{ fontWeight: 700 }}>
              {metrics.efficiency.toString().padStart(2, '0')}%
            </span>
          </Metric>

          <Divider />

          <Metric label="ВЫПОЛНЕНО">
            <span className="neon-text" style={{ fontWeight: 700 }}>
              {metrics.executed.toString().padStart(3, '0')}
            </span>
          </Metric>
        </div>

        {/* Columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-2 h-full px-2 py-2" style={{ minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn key={col.id} column={col} tasks={getColumnTasks(col.id)} />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {draggingTask && (
          <div style={{ transform: 'scale(1.03)', opacity: 0.9, cursor: 'grabbing' }}>
            <TaskCard task={draggingTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Divider() {
  return <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>│</span>;
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ lineHeight: 1.2 }}>
      <span style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: 12 }}>{children}</span>
    </div>
  );
}
