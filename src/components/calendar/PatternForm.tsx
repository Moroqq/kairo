import { useState } from 'react';
import type { Priority } from '@/types';
import { WEEKDAYS_RU, WEEKDAY_ORDER } from '@/types/plan';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PrioritySelect } from './PrioritySelect';

export interface PatternFormValues {
  title: string;
  time: string | null;
  priority: Priority;
  weekdays: number[];
}

interface Props {
  initial?: Partial<PatternFormValues>;
  onSave: (values: PatternFormValues) => void;
  onCancel: () => void;
}

/** Форма шаблона-расписания: название, время, приоритет, дни недели. */
export function PatternForm({ initial, onSave, onCancel }: Props) {
  const [title,    setTitle]    = useState(initial?.title ?? '');
  const [time,     setTime]     = useState(initial?.time ?? '');
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'C');
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? []);

  const toggleDay = (wd: number) =>
    setWeekdays((prev) => prev.includes(wd) ? prev.filter((d) => d !== wd) : [...prev, wd]);

  const canSave = title.trim() && weekdays.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ title: title.trim(), time: time || null, priority, weekdays });
  };

  return (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      <Input label="название" value={title} onChange={(e) => setTitle(e.target.value)} data-selectable autoFocus />

      {/* Weekday chips */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> повтор по дням
        </label>
        <div className="flex gap-1">
          {WEEKDAY_ORDER.map((wd) => {
            const active = weekdays.includes(wd);
            return (
              <button
                key={wd}
                type="button"
                onClick={() => toggleDay(wd)}
                className="flex-1 font-mono select-none transition-all"
                style={{
                  minHeight: 40,
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 8px var(--accent-glow)' : 'none',
                  textTransform: 'uppercase', fontSize: 11,
                }}
              >
                {WEEKDAYS_RU[wd]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1" style={{ maxWidth: 140 }}>
        <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> время
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-8 px-2 text-xs outline-none font-mono"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
      </div>

      <PrioritySelect value={priority} onChange={setPriority} />

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} size="sm">отмена</Button>
        <Button variant="primary" onClick={handleSave} size="sm" disabled={!canSave}>сохранить</Button>
      </div>
    </div>
  );
}
