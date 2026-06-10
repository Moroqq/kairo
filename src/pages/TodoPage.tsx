import { useState } from 'react';
import { ChevronLeft, ChevronRight, Archive, NotebookPen } from 'lucide-react';
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
        className="flex items-center gap-2 px-3 flex-shrink-0 font-mono"
        style={{
          minHeight: 40,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(90deg, var(--accent-dim) 0%, transparent 70%)',
        }}
      >
        <span className="neon-text" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ЛИСТОК
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
          <span style={{ color: 'var(--accent)' }}>›</span> задачи дня
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
  width: 32, height: 32,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
