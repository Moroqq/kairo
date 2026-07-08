import { NotebookPen } from 'lucide-react';
import { DailyList } from '@/components/todo/DailyList';

export function TodoPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{
          minHeight: 56,
          borderBottom: '1px solid var(--border-subtle)',
          padding: '8px 14px',
        }}
      >
        <NotebookPen size={18} color="var(--accent)" />
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 0.3 }}>
          листок
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <DailyList />
      </div>
    </div>
  );
}
