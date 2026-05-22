import { useEffect } from 'react';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { useUIStore } from '@/stores/ui.store';

export function Dashboard() {
  const openCapture = useUIStore((s) => s.openCapture);

  // Global keyboard shortcut: N = new task
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') openCapture();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openCapture]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <KanbanBoard />
    </div>
  );
}
