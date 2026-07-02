import { useRef, useState } from 'react';
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
import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from '@/components/task/TaskCard';
import { useTasks, useUpdateStatus } from '@/hooks/useTasks';
import { useDeadlineWatcher } from '@/hooks/useDeadlineWatcher';
import { useUIStore } from '@/stores/ui.store';
import { useToast } from '@/components/ui/Toast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTheme } from '@/stores/theme.store';
import { KANBAN_COLUMNS } from '@/types';
import type { Task, KanbanColumnId, TaskStatus } from '@/types';

export function KanbanBoard() {
  const { data: allTasks, isLoading, error } = useTasks();
  const updateStatus = useUpdateStatus();
  const { toast }    = useToast();
  const searchQuery  = useUIStore((s) => s.searchQuery);
  // filterPriority removed — priorities are no longer shown in the UI
  const filterCat    = useUIStore((s) => s.filterCategory);
  const isMobile     = useIsMobile();
  const vocab        = useTheme().vocab;

  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [activeCol, setActiveCol] = useState<KanbanColumnId>('todo');
  const touchStartX = useRef<number | null>(null);

  useDeadlineWatcher(allTasks);

  const sensors = useSensors(
    // Desktop: тащим мышью сразу (порог 6px).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: быстрый свайп прокручивает доску, долгое нажатие (200мс) начинает drag.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const filteredTasks = (allTasks ?? []).filter((t) => {
    if (filterCat && t.category !== filterCat) return false;
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

  // ─── Мобайл: вкладки-колонки (одна колонка на весь экран, свайп между ними) ───
  if (isMobile) {
    const idx = KANBAN_COLUMNS.findIndex((c) => c.id === activeCol);
    const switchBy = (delta: number) => {
      const next = (idx + delta + KANBAN_COLUMNS.length) % KANBAN_COLUMNS.length;
      setActiveCol(KANBAN_COLUMNS[next].id);
    };
    const activeColumn = KANBAN_COLUMNS[idx] ?? KANBAN_COLUMNS[0];

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Pill tabs — горизонтальный скролл */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 14px 10px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
          {KANBAN_COLUMNS.map((col) => {
            const active = col.id === activeCol;
            const count  = getColumnTasks(col.id).length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveCol(col.id)}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  height: 38, padding: '0 12px',
                  fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, fontWeight: 600,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-pill)',
                  boxShadow: active ? '0 0 10px var(--accent-glow)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {vocab.columns[col.id] ?? col.title}
                <span style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}>
                  [{count.toString().padStart(2, '0')}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Swipe hint */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', paddingBottom: 8, flexShrink: 0 }}>
          <ChevronLeft size={12} /> свайп между колонками <ChevronRight size={12} />
        </div>

        {/* Active column */}
        <div
          className="flex-1 min-h-0"
          style={{ padding: '0 14px 28px', overflowY: 'auto' }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (dx > 50) switchBy(-1);
            else if (dx < -50) switchBy(1);
          }}
        >
          <KanbanColumn column={activeColumn} tasks={getColumnTasks(activeColumn.id)} fullWidth />
        </div>
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
