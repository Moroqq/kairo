import { useState } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingDots } from '@/components/ui/Spinner';
import { ParsedPreview } from './ParsedPreview';
import { parseText } from '@/services/parser.service';
import { useCreateTask } from '@/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { useUIStore } from '@/stores/ui.store';
import type { TaskPreview } from '@/types';

export function TextCapture() {
  const [text,     setText]    = useState('');
  const [parsing,  setParsing] = useState(false);
  const [preview,  setPreview] = useState<TaskPreview | null>(null);
  const { toast }   = useToast();
  const createTask  = useCreateTask();
  const closeCapture = useUIStore((s) => s.closeCapture);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const result = await parseText(text);
      setPreview(result);
    } catch {
      toast('Не удалось разобрать', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async (p: TaskPreview) => {
    try {
      await createTask.mutateAsync({
        title:       p.title,
        description: p.description,
        priority:    p.priority,
        category:    p.category,
        deadline:    p.deadline,
        ai_summary:  p.summary,
        source_type: 'text',
      });
      toast('Задача создана');
      closeCapture();
    } catch {
      toast('Не удалось создать задачу', 'error');
    }
  };

  if (preview) {
    return (
      <ParsedPreview
        preview={preview}
        onConfirm={handleConfirm}
        onBack={() => setPreview(null)}
        loading={createTask.isPending}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <Textarea
        label="опишите задачу"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="напр. Проверить камеры на складе завтра, высокий приоритет"
        autoFocus
        data-selectable
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse();
        }}
      />
      <div className="flex items-center justify-between">
        {parsing ? (
          <LoadingDots />
        ) : (
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)' }}>$</span> ctrl+enter — разобрать
          </p>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={handleParse}
          loading={parsing}
          disabled={!text.trim()}
        >
          разобрать
        </Button>
      </div>
    </div>
  );
}
