import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { DailyWithState } from '@/types/daily';

interface Props {
  daily: DailyWithState;
  onToggle: () => void;
  onDelete: () => void;
}

/** Строка дэйлика: кружок-чекбокс слева (как в «Тратах»), название, крестик удаления. */
export function DailyRow({ daily, onToggle, onDelete }: Props) {
  return (
    <motion.div
      layout
      animate={{ opacity: daily.done ? 0.6 : 1 }}
      transition={{ duration: 0.32, ease: 'easeInOut', layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
      style={{
        display: 'flex', alignItems: 'stretch',
        background: 'var(--bg-card)',
        border: `1px solid ${daily.done ? 'var(--border-subtle)' : 'var(--border)'}`,
        borderRadius: 'var(--shape-full)',
        overflow: 'hidden',
        transition: 'border-color 320ms ease',
      }}
    >
      {/* Чекбокс */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={daily.done ? 'снять отметку' : 'отметить сделанным'}
        style={{
          width: 46, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none',
          borderRight: '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${daily.done ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: daily.done ? 'var(--accent)' : 'transparent',
          boxShadow: daily.done ? '0 0 10px var(--accent-glow)' : 'none',
          transform: daily.done ? 'scale(1.05)' : 'scale(1)',
          transition: 'background 260ms var(--ease-spring), border-color 260ms ease, box-shadow 260ms ease, transform 260ms var(--ease-spring)',
        }}>
          {daily.done && <Check size={13} color="#000" strokeWidth={3} style={{ animation: 'km-pop 240ms ease-out' }} />}
        </span>
      </button>

      {/* Название */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'center',
          padding: '10px 12px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 15,
          color: 'var(--text-primary)',
          opacity: daily.done ? 0.55 : 1,
          textDecorationLine: 'line-through',
          textDecorationColor: daily.done ? 'var(--text-muted)' : 'transparent',
          transition: 'opacity 320ms ease, text-decoration-color 320ms ease',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {daily.title}
        </span>
      </button>

      {/* Удалить насовсем */}
      <button
        type="button"
        onClick={onDelete}
        aria-label="убрать дэйлик насовсем"
        style={{
          width: 44, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none',
          borderLeft: '1px solid var(--border-subtle)',
          color: 'var(--text-dim)', cursor: 'pointer',
        }}
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}
