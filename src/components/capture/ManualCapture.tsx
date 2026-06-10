import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { DayMonthInput } from '@/components/ui/DayMonthInput';
import { Button } from '@/components/ui/Button';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { useUIStore } from '@/stores/ui.store';
import { deadlineISOFromDate } from '@/lib/date';

export function ManualCapture() {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [deadline,    setDeadline]    = useState('');

  const { toast }    = useToast();
  const createTask   = useCreateTask();
  const closeCapture = useUIStore((s) => s.closeCapture);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createTask.mutateAsync({
        title:       title.trim(),
        description: description.trim() || undefined,
        priority:    'C',
        category:    category.trim() || undefined,
        deadline:    deadline ? deadlineISOFromDate(deadline) : null,
      });
      toast('Задача создана');
      closeCapture();
    } catch {
      toast('Не удалось создать задачу', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      <Input
        label="название"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="что нужно сделать?"
        autoFocus
        data-selectable
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCreate(); }}
      />
      <Textarea
        label="описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="дополнительные детали..."
        data-selectable
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="напр. работа"
          data-selectable
        />
        <DayMonthInput
          label="срок"
          value={deadline}
          onChange={setDeadline}
          data-selectable
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>$</span> ctrl+enter — создать
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreate}
          loading={createTask.isPending}
          disabled={!title.trim()}
        >
          создать
        </Button>
      </div>
    </div>
  );
}
