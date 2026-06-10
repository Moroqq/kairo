import { useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/types';
import { WEEKDAYS_RU, WEEKDAY_ORDER } from '@/types/plan';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  usePatterns, useCreatePattern, useTogglePattern, useDeletePattern,
} from '@/hooks/usePlan';
import { PatternForm, type PatternFormValues } from './PatternForm';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Управление шаблонами-расписаниями: список + создание. */
export function PatternManager({ open, onClose }: Props) {
  const { data: patterns } = usePatterns();
  const createPattern = useCreatePattern();
  const togglePattern = useTogglePattern();
  const deletePattern = useDeletePattern();

  const [creating, setCreating] = useState(false);

  const handleCreate = (values: PatternFormValues) => {
    createPattern.mutate(values);
    setCreating(false);
  };

  const list = patterns ?? [];

  return (
    <Modal open={open} onClose={onClose} title="расписание // шаблоны" width={460}>
      <div className="flex flex-col gap-2" style={{ padding: 12 }}>
        {list.length === 0 && !creating && (
          <p className="font-mono text-xs" style={{ color: 'var(--text-dim)', padding: '8px 0' }}>
            // нет шаблонов. Создайте повтор по дням недели — пункты появятся автоматически.
          </p>
        )}

        {list.map((p) => {
          const cfg = PRIORITY_CONFIG[p.priority];
          const days = WEEKDAY_ORDER.filter((wd) => p.weekdays.includes(wd))
            .map((wd) => WEEKDAYS_RU[wd]).join(' ');
          return (
            <div
              key={p.id}
              className="flex items-center gap-2 px-2"
              style={{
                minHeight: 48,
                border: '1px solid var(--border-subtle)',
                borderLeft: `3px solid ${cfg.color}`,
                opacity: p.active ? 1 : 0.5,
              }}
            >
              <div className="flex flex-col flex-1 min-w-0 py-1">
                <span className="truncate" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                  {p.title}{p.time ? ` · ${p.time}` : ''}
                </span>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {days || '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => togglePattern.mutate(p.id)}
                className="flex items-center justify-center"
                style={{ width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer', color: p.active ? 'var(--accent)' : 'var(--text-dim)' }}
                title={p.active ? 'выключить' : 'включить'}
              >
                <Power size={15} />
              </button>
              <button
                type="button"
                onClick={() => deletePattern.mutate(p.id)}
                className="flex items-center justify-center"
                style={{ width: 36, height: 36, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="удалить шаблон"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}

        {creating ? (
          <div style={{ border: '1px solid var(--border)', marginTop: 4 }}>
            <PatternForm onSave={handleCreate} onCancel={() => setCreating(false)} />
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setCreating(true)} className="mt-1" style={{ minHeight: 40 }}>
            <Plus size={14} /> новый шаблон
          </Button>
        )}
      </div>
    </Modal>
  );
}
