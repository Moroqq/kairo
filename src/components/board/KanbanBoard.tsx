import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AlertCircle, Loader2 } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from '@/components/task/TaskCard';
import { useTasks, useUpdateStatus } from '@/hooks/useTasks';
import { useDeadlineWatcher } from '@/hooks/useDeadlineWatcher';
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
    // Desktop: тащим мышью сразу (порог 6px).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: быстрый свайп прокручивает доску, долгое нажатие (200мс) начинает drag.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-2 h-full px-2 py-2" style={{ minWidth: 'max-content' }}>
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn key={col.id} column={col} tasks={getColumnTasks(col.id)} />
          ))}
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
