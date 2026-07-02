import { Check, Pencil, Trash2, Repeat, ListChecks, Clock } from 'lucide-react';
import { motion, type PanInfo } from 'framer-motion';
import { PRIORITY_CONFIG } from '@/types';
import type { DisplayItem } from '@/types/plan';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface Props {
  item: DisplayItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = 80;

/** Строка пункта плана: чекбокс «сделано», время, название, приоритет, действия.
 *  На мобиле — свайп вправо = «сделано», влево = удалить/убрать. */
export function PlanItemRow({ item, onToggle, onEdit, onDelete }: Props) {
  const cfg = PRIORITY_CONFIG[item.priority];
  const isMobile  = useIsMobile();
  const recurring = item.kind === 'occurrence';
  const isTask    = item.kind === 'task';
  const isOverdue = isTask && item.overdue;
  const canDelete = !isTask; // задачу канбана из календаря не удаляем

  const rowStyle: React.CSSProperties = {
    minHeight: 52,
    // На мобиле — непрозрачный фон, чтобы слой действий не просвечивал до свайпа
    background: isMobile ? 'var(--bg-card)' : 'var(--well-bg)',
    borderLeft: `3px solid ${isOverdue ? 'var(--danger)' : cfg.color}`,
    border: `1px solid ${isOverdue ? 'var(--border-danger)' : 'var(--border-subtle)'}`,
    borderLeftWidth: 3,
    borderRadius: 'var(--radius)',
    opacity: item.done ? 0.55 : 1,
    boxShadow: isOverdue ? 'inset 0 0 12px rgba(255,0,60,0.08)' : 'none',
  };

  const inner = (
    <>
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 24, height: 24,
          border: `1px solid ${item.done ? 'var(--accent)' : 'var(--border)'}`,
          background: item.done ? 'var(--accent-dim)' : 'transparent',
          color: 'var(--accent)',
          borderRadius: 'var(--radius)',
        }}
        title={item.done ? 'снять отметку' : 'отметить выполненным'}
      >
        {item.done && <Check size={15} />}
      </button>

      {/* Time */}
      {item.time && (
        <span className="font-mono flex-shrink-0" style={{ fontSize: 13, color: 'var(--text-bright)', minWidth: 42 }}>
          {item.time}
        </span>
      )}

      {/* Title + note */}
      <div className="flex flex-col flex-1 min-w-0 gap-0.5" style={{ paddingBlock: 6 }}>
        <span
          className="truncate"
          style={{
            fontSize: 15,
            lineHeight: 1.3,
            color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: item.done ? 'line-through' : 'none',
          }}
        >
          {item.title}
        </span>
        {item.note && (
          <span className="truncate" style={{ fontSize: 12, lineHeight: 1.3, color: 'var(--text-dim)' }}>
            {item.note}
          </span>
        )}
      </div>

      {/* Source badges */}
      {recurring && (
        <Repeat size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-label="из расписания" />
      )}
      {isTask && (
        <ListChecks
          size={12}
          style={{
            color: isOverdue ? 'var(--danger)' : 'var(--accent)',
            flexShrink: 0,
            textShadow: isOverdue ? '0 0 6px rgba(255,0,60,0.6)' : '0 0 6px var(--accent-glow)',
          }}
          aria-label="из канбана"
        />
      )}
      {isOverdue && (
        <Clock size={12} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-label="просрочено" />
      )}

      {/* Actions — на мобиле прячем (свайп), оставляем только правку */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center"
          style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title={isTask ? 'открыть задачу' : 'изменить'}
        >
          <Pencil size={13} />
        </button>
        {!isTask && !isMobile && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            title={recurring ? 'убрать на этот день' : 'удалить'}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </>
  );

  // Десктоп — обычная строка с кнопками
  if (!isMobile) {
    return (
      <div className="row-hover flex items-center gap-2 px-2 group" style={rowStyle}>
        {inner}
      </div>
    );
  }

  // Мобайл — свайп влево/вправо
  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) onToggle();
    else if (info.offset.x < -SWIPE_THRESHOLD && canDelete) onDelete();
  };

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', isolation: 'isolate' }}>
      {/* Слой действий под строкой */}
      <div
        className="absolute inset-0 flex items-center justify-between px-4"
        style={{ background: 'var(--bg-elevated)', zIndex: 0 }}
      >
        <Check size={18} style={{ color: 'var(--success)' }} />
        {canDelete
          ? <Trash2 size={18} style={{ color: 'var(--danger)' }} />
          : <span style={{ width: 18 }} />}
      </div>

      {/* zIndex:1 гарантирует рендер поверх action-слоя на Android WebView */}
      <motion.div
        className="flex items-center gap-2 px-2"
        style={{ ...rowStyle, touchAction: 'pan-y', position: 'relative', zIndex: 1 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {inner}
      </motion.div>
    </div>
  );
}
