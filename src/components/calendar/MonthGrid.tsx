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

  const navBtn: React.CSSProperties = {
    width: isMobile ? 44 : 36,
    height: isMobile ? 44 : 36,
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Month header */}
      <div className="flex items-center gap-2 px-2 flex-shrink-0" style={{ minHeight: isMobile ? 52 : 44 }}>
        <button type="button" onClick={onPrev} className="flex items-center justify-center" style={navBtn} title="предыдущий месяц">
          <ChevronLeft size={isMobile ? 22 : 18} />
        </button>
        <span
          className="neon-text flex-1 text-center"
          style={{ fontSize: isMobile ? 17 : 14, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}
        >
          {MONTHS_RU[month]} {year}
        </span>
        <button
          type="button" onClick={onToday}
          className="bevel-raised flex items-center px-3 text-xs"
          style={{ minHeight: isMobile ? 44 : 32, background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          title="сегодня"
        >
          сегодня
        </button>
        <button type="button" onClick={onNext} className="flex items-center justify-center" style={navBtn} title="следующий месяц">
          <ChevronRight size={isMobile ? 22 : 18} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid flex-shrink-0" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEKDAY_ORDER.map((wd) => (
          <div
            key={wd}
            className="text-center font-mono"
            style={{
              fontSize: isMobile ? 11 : 10, padding: isMobile ? '6px 0' : '4px 0',
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
        className="grid flex-1 min-h-0"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: isMobile ? 'minmax(58px, 1fr)' : '1fr',
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
          const doneCount = dayItems.filter((i) => i.done).length;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className="flex flex-col items-stretch transition-colors text-left"
              style={{
                minHeight: isMobile ? 58 : 64,
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
                padding: isMobile ? '5px 5px 6px' : '3px 4px 4px',
                gap: 3,
                overflow: 'hidden',
              }}
            >
              {/* Day number */}
              <div className="flex items-center justify-between" style={{ minHeight: 14 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: isMobile ? 15 : 11,
                    color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: isToday ? 700 : 400,
                    textShadow: isToday ? '0 0 6px var(--accent-glow)' : 'none',
                    lineHeight: 1,
                  }}
                >
                  {d.getDate()}
                </span>
                {total > 0 && (
                  <span className="font-mono" style={{ fontSize: isMobile ? 10 : 8, color: 'var(--text-dim)', lineHeight: 1 }}>
                    {doneCount}/{total}
                  </span>
                )}
              </div>

              {/* Items: точки на мобиле, мини-бары на десктопе */}
              {total > 0 && (
                isMobile ? <DayDots items={dayItems} /> : <DayBars items={dayItems} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Мобайл: точки-индикаторы приоритета ──────────────────────── */

function DayDots({ items }: { items: DisplayItem[] }) {
  const MAX = 4;
  // Просроченные/высокий приоритет — первыми
  const sorted = [...items].sort((a, b) => {
    const ao = a.kind === 'task' && a.overdue && !a.done ? 0 : 1;
    const bo = b.kind === 'task' && b.overdue && !b.done ? 0 : 1;
    return ao - bo;
  });
  const visible = sorted.slice(0, MAX);
  const hidden = items.length - visible.length;

  return (
    <div className="flex flex-wrap items-center" style={{ gap: 3 }}>
      {visible.map((item) => {
        const overdue = item.kind === 'task' && item.overdue && !item.done;
        const color = overdue ? 'var(--danger)' : PRIORITY_CONFIG[item.priority].color;
        return (
          <span
            key={item.id}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: color,
              opacity: item.done ? 0.35 : 1,
              boxShadow: overdue ? '0 0 4px rgba(255,0,60,0.6)' : 'none',
            }}
          />
        );
      })}
      {hidden > 0 && (
        <span className="font-mono" style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>
          +{hidden}
        </span>
      )}
    </div>
  );
}

/* ── Десктоп: текстовые мини-бары (как было) ──────────────────── */

function DayBars({ items }: { items: DisplayItem[] }) {
  const visible = items.slice(0, 3);
  const hidden = items.length - visible.length;
  return (
    <div className="flex flex-col" style={{ gap: 1 }}>
      {visible.map((item) => <MiniBar key={item.id} item={item} />)}
      {hidden > 0 && (
        <span className="font-mono" style={{ fontSize: 8, color: 'var(--text-muted)', paddingLeft: 4, lineHeight: 1.1 }}>
          +{hidden}
        </span>
      )}
    </div>
  );
}

function MiniBar({ item }: { item: DisplayItem }) {
  const cfg = PRIORITY_CONFIG[item.priority];
  const overdue = item.kind === 'task' && item.overdue && !item.done;
  const stripeColor = overdue ? 'var(--danger)' : cfg.color;
  const stripeGlow  = overdue ? 'rgba(255,0,60,0.6)' : `${cfg.color}80`;

  return (
    <div
      className="font-mono"
      style={{
        display: 'flex', alignItems: 'center', gap: 3,
        fontSize: 9, lineHeight: 1.15, paddingLeft: 4,
        borderLeft: `2px solid ${stripeColor}`,
        boxShadow: overdue ? `-1px 0 4px ${stripeGlow}` : 'none',
        color: item.done ? 'var(--text-dim)' : 'var(--text-secondary)',
        textDecoration: item.done ? 'line-through' : 'none',
        opacity: item.done ? 0.6 : 1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        minHeight: 11,
      }}
      title={item.title}
    >
      {item.time && <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.time}</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
    </div>
  );
}
