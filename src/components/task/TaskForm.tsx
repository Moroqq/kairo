import { useState } from 'react';
import type { Task, TaskStatus } from '@/types';
import { STATUS_LABELS } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { DayMonthInput } from '@/components/ui/DayMonthInput';
import { Button } from '@/components/ui/Button';
import { deadlineISOFromDate } from '@/lib/date';

const STATUSES: TaskStatus[] = ['New', 'In Progress', 'Waiting Response', 'Escalation', 'Blocked', 'Resolved'];

interface TaskFormProps {
  task: Task;
  onSave: (updates: Partial<Pick<Task, 'title' | 'description' | 'category' | 'deadline' | 'priority' | 'status'>>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskForm({ task, onSave, onCancel, loading }: TaskFormProps) {
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [category,    setCategory]    = useState(task.category ?? '');
  const [status,      setStatus]      = useState<TaskStatus>(task.status);
  const [deadline,    setDeadline]    = useState(task.deadline ? task.deadline.split('T')[0] : '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title:       title.trim(),
      description: description.trim() || null,
      category:    category.trim()    || null,
      status,
      deadline:    deadline ? deadlineISOFromDate(deadline) : null,
    });
  };

  return (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      <Input label="название" value={title} onChange={(e) => setTitle(e.target.value)} data-selectable autoFocus />
      <Textarea label="описание" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} data-selectable />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)' }}>›</span> статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="h-7 px-2 text-xs outline-none font-mono"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        <Input label="категория" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="напр. камеры" data-selectable />
      </div>

      <DayMonthInput label="срок" value={deadline} onChange={setDeadline} data-selectable />

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} size="sm">отмена</Button>
        <Button variant="primary" onClick={handleSave} loading={loading} size="sm" disabled={!title.trim()}>сохранить</Button>
      </div>
    </div>
  );
}
