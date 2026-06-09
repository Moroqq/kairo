import { useState } from 'react';
import type { TaskPreview } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { DayMonthInput } from '@/components/ui/DayMonthInput';

interface ParsedPreviewProps {
  preview: TaskPreview;
  onConfirm: (preview: TaskPreview) => void;
  onBack: () => void;
  loading?: boolean;
}

export function ParsedPreview({ preview, onConfirm, onBack, loading }: ParsedPreviewProps) {
  const [draft, setDraft] = useState<TaskPreview>({ ...preview, priority: 'C' });

  const update = <K extends keyof TaskPreview>(key: K, value: TaskPreview[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const deadlineValue = draft.deadline
    ? new Date(draft.deadline).toISOString().split('T')[0]
    : '';

  return (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      <div
        className="px-2 py-1 text-xs font-mono neon-text"
        style={{
          background: 'rgba(0, 255, 65, 0.06)',
          border: '1px solid var(--border)',
        }}
      >
        ▶ AI разобрал · проверьте и подтвердите
      </div>

      <Input
        label="название"
        value={draft.title}
        onChange={(e) => update('title', e.target.value)}
        data-selectable
        autoFocus
      />

      <Textarea
        label="описание"
        value={draft.description}
        onChange={(e) => update('description', e.target.value)}
        rows={2}
        data-selectable
      />

      <Textarea
        label="резюме"
        value={draft.summary}
        onChange={(e) => update('summary', e.target.value)}
        rows={2}
        data-selectable
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="категория"
          value={draft.category}
          onChange={(e) => update('category', e.target.value)}
          placeholder="напр. камеры"
          data-selectable
        />
        <DayMonthInput
          label="срок"
          value={deadlineValue}
          onChange={(v) => update('deadline', v ? new Date(v).toISOString() : null)}
          data-selectable
        />
      </div>

      <div className="flex justify-between gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onBack}>← назад</Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onConfirm(draft)}
          loading={loading}
          disabled={!draft.title.trim()}
        >
          создать
        </Button>
      </div>
    </div>
  );
}
