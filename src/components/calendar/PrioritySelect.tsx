import type { Priority } from '@/types';
import { PRIORITY_CONFIG } from '@/types';

const ORDER: Priority[] = ['A', 'B', 'C'];

interface Props {
  value: Priority;
  onChange: (p: Priority) => void;
  label?: string;
}

/** Чипы выбора приоритета A/B/C/D в палитре PRIORITY_CONFIG. */
export function PrioritySelect({ value, onChange, label = 'приоритет' }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>›</span> {label}
      </label>
      <div className="flex gap-1.5">
        {ORDER.map((p) => {
          const cfg = PRIORITY_CONFIG[p];
          const active = value === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="flex-1 flex flex-col items-center justify-center font-mono select-none transition-all"
              style={{
                minHeight: 40,
                padding: '4px 2px',
                background: active ? cfg.bgColor : 'transparent',
                border: `1px solid ${active ? cfg.color : 'var(--border)'}`,
                color: active ? cfg.color : 'var(--text-muted)',
                boxShadow: active ? `0 0 8px ${cfg.glow}` : 'none',
              }}
              title={cfg.label}
            >
              <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{p}</span>
              <span style={{ fontSize: 8, opacity: 0.8 }}>{cfg.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
