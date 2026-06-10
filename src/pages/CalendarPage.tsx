import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
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
  const [sheetOpen, setSheetOpen] = useState(false); // mobile day-sheet

  const goPrev = () =>
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }));
  const goNext = () =>
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }));
  const goToday = () => {
    const d = fromISODate(today);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(today);
  };

  const handleSelect = (date: string) => {
    setSelectedDate(date);
    if (isMobile) setSheetOpen(true);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0 font-mono"
        style={{ minHeight: 40, borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(90deg, rgba(0,255,65,0.05) 0%, transparent 70%)' }}
      >
        <span className="neon-text" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
          ПЛАН
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1 }}>
          <span style={{ color: 'var(--accent)' }}>›</span> ежедневник
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setPatternsOpen(true)}
          className="bevel-raised flex items-center gap-1.5 px-2 text-xs"
          style={{ minHeight: 32, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          title="шаблоны-расписания"
        >
          <CalendarClock size={13} /> расписание
        </button>
      </div>

      {/* Body */}
      {isMobile ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MonthGrid
            year={cursor.year} month={cursor.month}
            selectedDate={selectedDate} onSelect={handleSelect}
            onPrev={goPrev} onNext={goNext} onToday={goToday}
          />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0" style={{ borderRight: '1px solid var(--border-subtle)' }}>
            <MonthGrid
              year={cursor.year} month={cursor.month}
              selectedDate={selectedDate} onSelect={handleSelect}
              onPrev={goPrev} onNext={goNext} onToday={goToday}
            />
          </div>
          <div className="flex flex-col" style={{ width: 360, minWidth: 0 }}>
            <DayView date={selectedDate} />
          </div>
        </div>
      )}

      {/* Mobile day sheet */}
      <AnimatePresence>
        {isMobile && sheetOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setSheetOpen(false)}
          >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} />
            <motion.div
              className="relative flex flex-col"
              style={{
                maxHeight: '80vh',
                background: 'rgba(8, 12, 8, 0.98)',
                borderTop: '1px solid var(--accent)',
                boxShadow: '0 0 32px var(--accent-glow)',
              }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <DayView date={selectedDate} onClose={() => setSheetOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PatternManager open={patternsOpen} onClose={() => setPatternsOpen(false)} />
    </div>
  );
}
