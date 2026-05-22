import { useState } from 'react';
import type { Task, Priority, TaskStatus } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const PRIORITIES: Priority[] = ['A', 'B', 'C', 'D'];
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
  const [priority,    setPriority]    = useState<Priority>(task.priority);
  const [status,      setStatus]      = useState<TaskStatus>(task.status);
  const [deadline,    setDeadline]    = useState(task.deadline ? task.deadline.split('T')[0] : '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title:       title.trim(),
      description: description.trim() || null,
      category:    category.trim()    || null,
      priority,
      status,
      deadline:    deadline ? new Date(deadline).toISOString() : null,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        data-selectable
        autoFocus
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        data-selectable
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="h-9 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="h-9 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Cameras" data-selectable />
        <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} data-selectable />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} size="sm">Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={loading} size="sm" disabled={!title.trim()}>Save</Button>
      </div>
    </div>
  );
}
