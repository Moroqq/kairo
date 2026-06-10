import { useState } from 'react';
import type { Priority } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PrioritySelect } from './PrioritySelect';

export interface PlanFormValues {
  title: string;
  note: string | null;
  time: string | null;
  priority: Priority;
}

interface Props {
  initial?: Partial<PlanFormValues>;
  onSave: (values: PlanFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

/** Форма пункта плана — создание и редактирование. */
export function PlanItemForm({ initial, onSave, onCancel, loading }: Props) {
  const [title,    setTitle]    = useState(initial?.title ?? '');
  const [note,     setNote]     = useState(initial?.note ?? '');
  const [time,     setTime]     = useState(initial?.time ?? '');
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'C');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title:    title.trim(),
      note:     note.trim() || null,
      time:     time || null,
      priority,
    });
  };

  return (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      <Input
        label="название"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        data-selectable
        autoFocus
      />

      <div className="flex flex-col gap-1" style={{ maxWidth: 140 }}>
        <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> время
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-8 px-2 text-xs outline-none font-mono"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        />
      </div>

      <PrioritySelect value={priority} onChange={setPriority} />

      <Textarea
        label="заметка"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        data-selectable
      />

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} size="sm">отмена</Button>
        <Button variant="primary" onClick={handleSave} loading={loading} size="sm" disabled={!title.trim()}>
          сохранить
        </Button>
      </div>
    </div>
  );
}
