import { useState, useRef } from 'react';
import { CalendarDays, CalendarClock } from 'lucide-react';
import { todayISO, fromISODate } from '@/lib/date';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { DayView } from '@/components/calendar/DayView';
import { PatternManager } from '@/components/calendar/PatternManager';

export function CalendarPage() {
  const isMobile = useIsMobile();
  const today = todayISO();

  const [selectedDate, setSelectedDate] = useState(today);
  const [cursor, setCursor] = useState(() => {
    const d = fromISODate(today);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  const goPrev = () => {
    setDirection(-1);
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }));
  };
  const goNext = () => {
    setDirection(1);
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }));
  };
  const goToday = () => {
    const d = fromISODate(today);
    const cy = cursorRef.current;
    const diff = (d.getFullYear() * 12 + d.getMonth()) - (cy.year * 12 + cy.month);
    setDirection(diff >= 0 ? 1 : -1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(today);
  };

  const handleSelect = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{ minHeight: 56, borderBottom: '1px solid var(--border-subtle)', padding: '8px 14px' }}
      >
        <CalendarDays size={18} color="var(--accent)" />
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 0.3, flex: 1 }}>
          план
        </span>
        <div className="flex-1" />
        {/* На мобиле — только иконка (текстовая кнопка случайно нажималась вместо "перенести") */}
        {isMobile ? (
          <button
            type="button"
            onClick={() => setPatternsOpen(true)}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            title="шаблоны расписания"
          >
            <CalendarClock size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPatternsOpen(true)}
            className="bevel-raised flex items-center gap-1.5 px-3"
            style={{ minHeight: 40, fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            title="шаблоны-расписания"
          >
            <CalendarClock size={15} /> расписание
          </button>
        )}
      </div>

      {/* Body */}
      {isMobile ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-shrink-0 overflow-hidden" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <MonthGrid
              year={cursor.year} month={cursor.month} direction={direction}
              selectedDate={selectedDate} onSelect={handleSelect}
              onPrev={goPrev} onNext={goNext} onToday={goToday}
            />
          </div>
          <div className="flex-1 min-h-0">
            <DayView date={selectedDate} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 overflow-hidden" style={{ borderRight: '1px solid var(--border-subtle)', paddingTop: 10 }}>
            <MonthGrid
              year={cursor.year} month={cursor.month} direction={direction}
              selectedDate={selectedDate} onSelect={handleSelect}
              onPrev={goPrev} onNext={goNext} onToday={goToday}
            />
          </div>
          <div className="flex flex-col" style={{ width: 300, minWidth: 0 }}>
            <DayView date={selectedDate} />
          </div>
        </div>
      )}

      <PatternManager open={patternsOpen} onClose={() => setPatternsOpen(false)} />
    </div>
  );
}
