import { useState } from 'react';
import { Calendar, Tag, Flag } from 'lucide-react';
import type { TaskPreview, Priority } from '@/types';
import { PRIORITY_CONFIG } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

interface ParsedPreviewProps {
  preview: TaskPreview;
  onConfirm: (preview: TaskPreview) => void;
  onBack: () => void;
  loading?: boolean;
}

const PRIORITIES: Priority[] = ['A', 'B', 'C', 'D'];

export function ParsedPreview({ preview, onConfirm, onBack, loading }: ParsedPreviewProps) {
  const [draft, setDraft] = useState<TaskPreview>(preview);

  const update = <K extends keyof TaskPreview>(key: K, value: TaskPreview[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const deadlineValue = draft.deadline
    ? new Date(draft.deadline).toISOString().split('T')[0]
    : '';

  return (
    <div className="flex flex-col gap-4 p-5">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(0,240,202,0.15)' }}
      >
        Parsed · Review and confirm
      </div>

      <Input
        label="Title"
        value={draft.title}
        onChange={(e) => update('title', e.target.value)}
        data-selectable
        autoFocus
      />

      <Textarea
        label="Description"
        value={draft.description}
        onChange={(e) => update('description', e.target.value)}
        rows={2}
        data-selectable
      />

      <Textarea
        label="Summary"
        value={draft.summary}
        onChange={(e) => update('summary', e.target.value)}
        rows={2}
        data-selectable
        style={{ color: 'var(--text-secondary)' }}
      />

      <div className="grid grid-cols-3 gap-3">
        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Flag size={11} /> Priority
          </label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => update('priority', p)}
                className="flex-1 h-8 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: draft.priority === p ? PRIORITY_CONFIG[p].bgColor : 'var(--bg-card)',
                  color:      draft.priority === p ? PRIORITY_CONFIG[p].color   : 'var(--text-muted)',
                  border:     `1px solid ${draft.priority === p ? PRIORITY_CONFIG[p].color : 'var(--border)'}`,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="col-span-1">
          <Input
            label={<span className="flex items-center gap-1"><Tag size={11} /> Category</span> as unknown as string}
            value={draft.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder="e.g. Cameras"
            data-selectable
          />
        </div>

        {/* Deadline */}
        <div className="col-span-1">
          <Input
            label={<span className="flex items-center gap-1"><Calendar size={11} /> Deadline</span> as unknown as string}
            type="date"
            value={deadlineValue}
            onChange={(e) =>
              update('deadline', e.target.value ? new Date(e.target.value).toISOString() : null)
            }
            data-selectable
          />
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onConfirm(draft)}
          loading={loading}
          disabled={!draft.title.trim()}
        >
          Create Task
        </Button>
      </div>
    </div>
  );
}
