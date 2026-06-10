import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthGrid, toISODate, todayISO } from '@/lib/date';
import { MONTHS_RU, WEEKDAYS_RU, WEEKDAY_ORDER } from '@/types/plan';
import { useMonthSummary } from '@/hooks/usePlan';

interface Props {
  year: number;
  month: number;               // 0..11
  selectedDate: string;        // 'YYYY-MM-DD'
  onSelect: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthGrid({ year, month, selectedDate, onSelect, onPrev, onNext, onToday }: Props) {
  const { data: summary } = useMonthSummary(year, month);
  const weeks = monthGrid(year, month);
  const today = todayISO();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Month header */}
      <div className="flex items-center gap-2 px-2 flex-shrink-0" style={{ minHeight: 44 }}>
        <button
          type="button" onClick={onPrev}
          className="flex items-center justify-center" style={navBtn}
          title="предыдущий месяц"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="neon-text flex-1 text-center" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
          {MONTHS_RU[month]} {year}
        </span>
        <button
          type="button" onClick={onToday}
          className="bevel-raised flex items-center px-2 text-xs"
          style={{ minHeight: 32, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          title="сегодня"
        >
          сегодня
        </button>
        <button
          type="button" onClick={onNext}
          className="flex items-center justify-center" style={navBtn}
          title="следующий месяц"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid flex-shrink-0" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEKDAY_ORDER.map((wd) => (
          <div
            key={wd}
            className="text-center font-mono"
            style={{
              fontSize: 10, padding: '4px 0',
              color: wd === 0 || wd === 6 ? 'var(--text-muted)' : 'var(--text-dim)',
              textTransform: 'uppercase', letterSpacing: 1,
            }}
          >
            {WEEKDAYS_RU[wd]}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid flex-1 min-h-0" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: 2, padding: 2 }}>
        {weeks.flat().map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === month;
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const s = summary?.[iso];
          const allDone = s && s.done === s.total;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className="flex flex-col items-stretch p-1 transition-colors"
              style={{
                minHeight: 44,
                background: isSelected ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                opacity: inMonth ? 1 : 0.35,
                cursor: 'pointer',
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  textAlign: 'left',
                  color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: isToday ? 700 : 400,
                  textShadow: isToday ? '0 0 6px var(--accent-glow)' : 'none',
                }}
              >
                {d.getDate()}
              </span>
              {s && (
                <span className="flex items-center gap-1 mt-auto" style={{ minHeight: 12 }}>
                  <span
                    style={{
                      width: 6, height: 6, flexShrink: 0,
                      background: allDone ? 'var(--text-muted)' : 'var(--accent)',
                      boxShadow: allDone ? 'none' : '0 0 4px var(--accent-glow)',
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {s.done}/{s.total}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 36, height: 36,
  background: 'transparent',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
