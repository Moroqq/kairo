import { Check, Pencil, Trash2, Repeat } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/types';
import type { DisplayItem } from '@/types/plan';

interface Props {
  item: DisplayItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Строка пункта плана: чекбокс «сделано», время, название, приоритет, действия. */
export function PlanItemRow({ item, onToggle, onEdit, onDelete }: Props) {
  const cfg = PRIORITY_CONFIG[item.priority];
  const recurring = item.kind === 'occurrence';

  return (
    <div
      className="row-hover flex items-center gap-2 px-2 group"
      style={{
        minHeight: 44,
        background: 'rgba(0,0,0,0.35)',
        borderLeft: `3px solid ${cfg.color}`,
        border: '1px solid var(--border-subtle)',
        borderLeftWidth: 3,
        opacity: item.done ? 0.55 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 22, height: 22,
          border: `1px solid ${item.done ? 'var(--accent)' : 'var(--border)'}`,
          background: item.done ? 'var(--accent-dim)' : 'transparent',
          color: 'var(--accent)',
        }}
        title={item.done ? 'снять отметку' : 'отметить выполненным'}
      >
        {item.done && <Check size={14} />}
      </button>

      {/* Time */}
      {item.time && (
        <span
          className="font-mono flex-shrink-0"
          style={{ fontSize: 11, color: 'var(--text-bright)', minWidth: 38 }}
        >
          {item.time}
        </span>
      )}

      {/* Title + note */}
      <div className="flex flex-col flex-1 min-w-0 py-1">
        <span
          className="truncate"
          style={{
            fontSize: 13,
            color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: item.done ? 'line-through' : 'none',
          }}
        >
          {item.title}
        </span>
        {item.note && (
          <span className="truncate" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            {item.note}
          </span>
        )}
      </div>

      {/* Recurring badge */}
      {recurring && (
        <Repeat size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-label="из расписания" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center"
          style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title="изменить"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center"
          style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title={recurring ? 'убрать на этот день' : 'удалить'}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
