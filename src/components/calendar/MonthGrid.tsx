import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthGrid, toISODate, todayISO } from '@/lib/date';
import { MONTHS_RU, WEEKDAYS_RU, WEEKDAY_ORDER } from '@/types/plan';
import type { DisplayItem } from '@/types/plan';
import { PRIORITY_CONFIG } from '@/types';
import { useMonthItems } from '@/hooks/usePlan';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  const { data: itemsByDate } = useMonthItems(year, month);
  const isMobile = useIsMobile();
  const weeks = monthGrid(year, month);
  const today = todayISO();

  const MAX_VISIBLE = isMobile ? 2 : 3;

  return (
    <div className={`flex flex-col min-h-0 ${isMobile ? '' : 'h-full'}`}>
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
      <div
        className={`grid ${isMobile ? '' : 'flex-1 min-h-0'}`}
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: isMobile ? '46px' : '1fr',
          gap: 2,
          padding: 2,
        }}
      >
        {weeks.flat().map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === month;
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const dayItems = itemsByDate?.[iso] ?? [];
          const hasOverdue = dayItems.some((i) => i.kind === 'task' && i.overdue && !i.done);
          const total = dayItems.length;
          const visible = dayItems.slice(0, MAX_VISIBLE);
          const hiddenCount = total - visible.length;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className="flex flex-col items-stretch transition-colors text-left"
              style={{
                minHeight: isMobile ? 0 : 64,
                background: isSelected ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${
                  isSelected ? 'var(--accent)'
                  : hasOverdue ? 'var(--border-danger)'
                  : isToday ? 'var(--border-strong)'
                  : 'var(--border-subtle)'
                }`,
                boxShadow: hasOverdue && !isSelected ? 'inset 0 0 12px rgba(255,0,60,0.08)' : 'none',
                opacity: inMonth ? 1 : 0.35,
                cursor: 'pointer',
                padding: '3px 4px 4px',
                gap: 2,
                overflow: 'hidden',
              }}
            >
              {/* Day number */}
              <div className="flex items-center justify-between" style={{ minHeight: 14 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: isToday ? 700 : 400,
                    textShadow: isToday ? '0 0 6px var(--accent-glow)' : 'none',
                    lineHeight: 1,
                  }}
                >
                  {d.getDate()}
                </span>
                {total > 0 && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 8,
                      color: 'var(--text-dim)',
                      lineHeight: 1,
                    }}
                  >
                    {dayItems.filter((i) => i.done).length}/{total}
                  </span>
                )}
              </div>

              {/* Item mini-bars */}
              {visible.length > 0 && (
                <div className="flex flex-col" style={{ gap: 1 }}>
                  {visible.map((item) => (
                    <MiniBar key={item.id} item={item} />
                  ))}
                  {hiddenCount > 0 && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 8,
                        color: 'var(--text-muted)',
                        paddingLeft: 4,
                        lineHeight: 1.1,
                      }}
                    >
                      +{hiddenCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */

function MiniBar({ item }: { item: DisplayItem }) {
  const cfg = PRIORITY_CONFIG[item.priority];
  const overdue = item.kind === 'task' && item.overdue && !item.done;
  const stripeColor = overdue ? 'var(--danger)' : cfg.color;
  const stripeGlow  = overdue ? 'rgba(255,0,60,0.6)' : `${cfg.color}80`;

  return (
    <div
      className="font-mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 9,
        lineHeight: 1.15,
        paddingLeft: 4,
        borderLeft: `2px solid ${stripeColor}`,
        boxShadow: overdue ? `-1px 0 4px ${stripeGlow}` : 'none',
        color: item.done ? 'var(--text-dim)' : 'var(--text-secondary)',
        textDecoration: item.done ? 'line-through' : 'none',
        opacity: item.done ? 0.6 : 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minHeight: 11,
      }}
      title={item.title}
    >
      {item.time && (
        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.time}</span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.title}
      </span>
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
