import { useState } from 'react';
import { ChevronLeft, ChevronRight, Archive, NotebookPen, NotebookText } from 'lucide-react';
import { todayISO, toISODate, fromISODate } from '@/lib/date';
import { DailySheet } from '@/components/todo/DailySheet';
import { ArchiveView } from '@/components/todo/ArchiveView';

type View = 'sheet' | 'archive';

export function TodoPage() {
  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState<View>('sheet');

  const shiftDay = (delta: number) => {
    const d = fromISODate(date);
    d.setDate(d.getDate() + delta);
    setDate(toISODate(d));
  };

  const isToday = date === todayISO();

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
        <NotebookText size={18} color="var(--accent)" />
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 0.3 }}>
          листок
        </span>
        <div className="flex-1" />

        {view === 'sheet' && (
          <>
            <button type="button" onClick={() => shiftDay(-1)} style={navBtn} title="предыдущий день">
              <ChevronLeft size={16} />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={() => setDate(todayISO())}
                className="bevel-raised px-2 text-xs"
                style={{ minHeight: 32, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
              >
                сегодня
              </button>
            )}
            <button type="button" onClick={() => shiftDay(1)} style={navBtn} title="следующий день">
              <ChevronRight size={16} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setView(view === 'sheet' ? 'archive' : 'sheet')}
          className="bevel-raised flex items-center gap-1.5 px-2 text-xs"
          style={{
            minHeight: 32,
            background: view === 'archive' ? 'var(--accent-dim)' : 'var(--bg-surface)',
            color: view === 'archive' ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title={view === 'sheet' ? 'архив выполненного' : 'к листку'}
        >
          {view === 'sheet' ? <Archive size={13} /> : <NotebookPen size={13} />}
          {view === 'sheet' ? 'архив' : 'листок'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {view === 'sheet' ? <DailySheet date={date} /> : <ArchiveView />}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 40, height: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
