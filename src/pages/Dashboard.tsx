import { KanbanBoard } from '@/components/board/KanbanBoard';

export function Dashboard() {
  // Хоткей N (новая задача) поднят в AppShell — работает на всех экранах.
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <KanbanBoard />
    </div>
  );
}
