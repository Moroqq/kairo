import { useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { fromISODate, todayISO } from '@/lib/date';
import { useToast } from '@/components/ui/Toast';
import {
  useDayItems, useAddPlanItem, useDeletePlanItem,
  useTogglePlanDone, useRemoveOccurrence, useCarryOver,
} from '@/hooks/usePlan';
import type { DisplayItem } from '@/types/plan';
import { SheetLine, LINE_HEIGHT } from './SheetLine';

interface Props {
  date: string; // 'YYYY-MM-DD'
}

/** «Листок» дня: бумага с линовкой, рукописные записи, зачёркивание по тапу. */
export function DailySheet({ date }: Props) {
  const { data: items } = useDayItems(date);
  const { toast } = useToast();

  const addItem    = useAddPlanItem();
  const deleteItem = useDeletePlanItem();
  const toggleDone = useTogglePlanDone();
  const removeOcc  = useRemoveOccurrence();
  const carryOver  = useCarryOver();

  const [draft, setDraft] = useState('');

  const d = fromISODate(date);
  const isToday = date === todayISO();
  const heading = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const list = items ?? [];
  const doneCount = list.filter((i) => i.done).length;

  const handleAdd = () => {
    const title = draft.trim();
    if (!title) return;
    addItem.mutate({ date, title, priority: 'C' });
    setDraft('');
  };

  const handleDelete = (item: DisplayItem) => {
    if (item.kind === 'item') deleteItem.mutate(item.id);
    else if (item.kind === 'occurrence') removeOcc.mutate({ patternId: item.pattern_id, date });
  };

  const handleCarryOver = async () => {
    const moved = await carryOver.mutateAsync(date);
    toast(moved > 0 ? `перенесено: ${moved}` : 'нечего переносить', moved > 0 ? 'success' : 'info');
  };

  return (
    <div className="flex justify-center w-full" style={{ padding: '12px 8px 24px' }}>
      <div
        className="flex flex-col w-full"
        style={{
          maxWidth: 560,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
        }}
      >
        {/* Шапка листа */}
        <div
          className="flex items-end justify-between gap-2"
          style={{ padding: '14px 16px 6px 56px', borderBottom: '2px solid var(--border)' }}
        >
          <span className="font-hand" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-bright)', lineHeight: 1.1 }}>
            {heading}
          </span>
          <span className="font-mono flex-shrink-0" style={{ fontSize: 10, color: 'var(--text-muted)', paddingBottom: 6 }}>
            {doneCount}/{list.length}
          </span>
        </div>

        {/* Тело листа: линовка + «поля» */}
        <div
          className="relative"
          style={{
            padding: '8px 12px 8px 56px',
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_HEIGHT - 1}px, var(--border-subtle) ${LINE_HEIGHT - 1}px, var(--border-subtle) ${LINE_HEIGHT}px)`,
            backgroundOrigin: 'content-box',
            minHeight: LINE_HEIGHT * 6,
          }}
        >
          {/* Вертикальная линия полей */}
          <span
            className="absolute pointer-events-none"
            style={{ left: 44, top: 0, bottom: 0, width: 1, background: 'var(--border-danger)', opacity: 0.5 }}
          />

          {list.length === 0 && (
            <p className="font-hand" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: `${LINE_HEIGHT}px` }}>
              пока пусто — запиши что-нибудь…
            </p>
          )}

          {list.map((item) => (
            <SheetLine
              key={item.id}
              item={item}
              onToggle={() => toggleDone.mutate(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}

          {/* Строка-инпут «дописать» */}
          <div className="flex items-center gap-2" style={{ height: LINE_HEIGHT }}>
            <span style={{ width: 7, flexShrink: 0, color: 'var(--text-dim)', fontSize: 14, lineHeight: 1 }}>+</span>
            <input
              className="font-hand flex-1 min-w-0 outline-none"
              style={{
                fontSize: 13,
                height: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
              }}
              placeholder="дописать…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              data-selectable
            />
          </div>
        </div>

        {/* Подвал листа */}
        {isToday && (
          <div className="flex justify-end" style={{ padding: '6px 12px 10px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handleCarryOver}
              disabled={carryOver.isPending}
              className="flex items-center gap-1.5 px-2 text-xs"
              style={{ minHeight: 32, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              title="перенести незавершённое с прошлых дней"
            >
              <ArrowDownToLine size={12} /> перенести незавершённое
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
