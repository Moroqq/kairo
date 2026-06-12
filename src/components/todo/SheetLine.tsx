import { X, Repeat, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import { PRIORITY_CONFIG } from '@/types';
import type { DisplayItem } from '@/types/plan';
import { useIsMobile } from '@/hooks/useMediaQuery';

export const LINE_HEIGHT = 36; // шаг линовки листа

interface Props {
  item: DisplayItem;
  onToggle: () => void;
  onDelete: () => void;
}

/** Строка на «листке»: рукописный текст, тап зачёркивает карандашной линией. */
export function SheetLine({ item, onToggle, onDelete }: Props) {
  const isMobile = useIsMobile();
  const cfg = PRIORITY_CONFIG[item.priority];
  const canDelete = item.kind !== 'task';

  return (
    <div
      className="sheet-line group flex items-center gap-2"
      style={{ height: LINE_HEIGHT, paddingRight: 4 }}
    >
      {/* Маркер приоритета на «полях» */}
      <span
        className="flex-shrink-0"
        style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, opacity: item.done ? 0.4 : 0.9 }}
        title={cfg.label}
      />

      {/* Текст — кликом зачёркиваем */}
      <button
        type="button"
        onClick={onToggle}
        className="relative flex items-baseline gap-2 flex-1 min-w-0 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', height: '100%', padding: 0 }}
        title={item.done ? 'снять отметку' : 'зачеркнуть'}
      >
        <span
          className="font-hand truncate"
          style={{
            fontSize: 14,
            lineHeight: `${LINE_HEIGHT}px`,
            color: item.done ? 'var(--text-dim)' : 'var(--text-primary)',
            transition: 'color 200ms',
          }}
        >
          {item.title}
        </span>
        {item.time && (
          <span className="font-mono flex-shrink-0" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {item.time}
          </span>
        )}

        {/* Карандашная линия зачёркивания */}
        <motion.span
          className="absolute pointer-events-none"
          style={{
            left: -2, right: '15%', top: '52%', height: 2,
            background: 'var(--text-secondary)',
            transformOrigin: 'left center',
            borderRadius: 2,
          }}
          initial={false}
          animate={{ scaleX: item.done ? 1 : 0, opacity: item.done ? 0.8 : 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </button>

      {/* Бейджи источника */}
      {item.kind === 'occurrence' && (
        <Repeat size={11} style={{ color: 'var(--text-dim)', flexShrink: 0 }} aria-label="из расписания" />
      )}
      {item.kind === 'task' && (
        <ListChecks size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-label="из канбана" />
      )}

      {/* Удаление: на мобиле всегда, на десктопе по hover строки */}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`flex items-center justify-center flex-shrink-0 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'}`}
          style={{
            width: 32, height: 32,
            background: 'transparent', border: 'none',
            color: 'var(--text-dim)', cursor: 'pointer',
            transition: 'opacity 150ms, color 150ms',
          }}
          title={item.kind === 'occurrence' ? 'убрать на этот день' : 'удалить'}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
