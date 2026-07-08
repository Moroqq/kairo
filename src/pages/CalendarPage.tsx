import { useState, useRef, useEffect } from 'react';
import { CalendarDays, CalendarClock } from 'lucide-react';
import { todayISO, fromISODate } from '@/lib/date';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { DayView } from '@/components/calendar/DayView';
import { DaySheet, DAY_SHEET_PEEK } from '@/components/calendar/DaySheet';
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

  // Реальная высота мобильного body-контейнера — нужна DaySheet, чтобы
  // посчитать развёрнутое положение (доля от него, не от всего окна).
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState(0);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setBodyHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
        <div ref={bodyRef} className="flex-1 min-h-0" style={{ position: 'relative' }}>
          <div className="h-full flex flex-col overflow-hidden" style={{ paddingBottom: DAY_SHEET_PEEK }}>
            <MonthGrid
              year={cursor.year} month={cursor.month} direction={direction}
              selectedDate={selectedDate} onSelect={handleSelect}
              onPrev={goPrev} onNext={goNext} onToday={goToday}
            />
          </div>
          {bodyHeight > 0 && <DaySheet date={selectedDate} containerHeight={bodyHeight} />}
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
