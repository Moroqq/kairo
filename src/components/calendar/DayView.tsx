import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { fromISODate } from '@/lib/date';
import { Modal } from '@/components/ui/Modal';
import {
  useDayItems, usePatterns,
  useAddPlanItem, useUpdatePlanItem, useDeletePlanItem,
  useTogglePlanDone, useRemoveOccurrence, useDetachOccurrence,
} from '@/hooks/usePlan';
import type { DisplayItem } from '@/types/plan';
import { PlanItemRow } from './PlanItemRow';
import { PlanItemForm, type PlanFormValues } from './PlanItemForm';

interface Props {
  date: string;            // 'YYYY-MM-DD'
  onClose?: () => void;    // если задан — рисуем кнопку закрытия (мобильный sheet)
}

type Editing =
  | { mode: 'add' }
  | { mode: 'edit'; item: DisplayItem }
  | null;

/** Список пунктов на день + создание/редактирование. Используется и в панели, и в sheet. */
export function DayView({ date, onClose }: Props) {
  const { data: items } = useDayItems(date);
  const { data: patterns } = usePatterns();

  const addItem    = useAddPlanItem();
  const updateItem = useUpdatePlanItem();
  const deleteItem = useDeletePlanItem();
  const toggleDone = useTogglePlanDone();
  const removeOcc  = useRemoveOccurrence();
  const detachOcc  = useDetachOccurrence();

  const [editing, setEditing] = useState<Editing>(null);

  const d = fromISODate(date);
  const title = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const list = items ?? [];
  const doneCount = list.filter((i) => i.done).length;

  const handleDelete = (item: DisplayItem) => {
    if (item.kind === 'item') deleteItem.mutate(item.id);
    else removeOcc.mutate({ patternId: item.pattern_id, date });
  };

  const handleSave = (values: PlanFormValues) => {
    if (editing?.mode === 'edit') {
      const item = editing.item;
      if (item.kind === 'item') {
        updateItem.mutate({ id: item.id, updates: values });
      } else {
        // Правка вхождения шаблона → отвязываем на этот день
        const pattern = patterns?.find((p) => p.id === item.pattern_id);
        if (pattern) {
          detachOcc.mutate({ pattern, date, edits: { ...values, done: item.done } });
        }
      }
    } else {
      addItem.mutate({ date, ...values });
    }
    setEditing(null);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{ minHeight: 40, borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="neon-text" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
          {title}
        </span>
        {list.length > 0 && (
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            [{doneCount}/{list.length}]
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setEditing({ mode: 'add' })}
          className="bevel-raised flex items-center gap-1 px-2 text-xs"
          style={{ minHeight: 32, background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          title="добавить пункт"
        >
          <Plus size={13} className="neon-text" /> пункт
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            title="закрыть"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5 p-2 overflow-y-auto flex-1">
        {list.length === 0 ? (
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: 80 }}>
            <p className="font-mono text-xs" style={{ color: 'var(--text-dim)' }}>// на этот день пусто</p>
          </div>
        ) : (
          list.map((item) => (
            <PlanItemRow
              key={item.id}
              item={item}
              onToggle={() => toggleDone.mutate(item)}
              onEdit={() => setEditing({ mode: 'edit', item })}
              onDelete={() => handleDelete(item)}
            />
          ))
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'изменить пункт' : 'новый пункт'}
        width={420}
      >
        {editing && (
          <PlanItemForm
            initial={editing.mode === 'edit' ? editing.item : undefined}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
