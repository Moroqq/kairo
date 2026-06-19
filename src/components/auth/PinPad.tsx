import { Delete } from 'lucide-react';
import { PIN_LENGTH } from '@/lib/auth';

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Подсветить точки красным (неверный PIN). */
  error?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Цифровой PIN-пад «как на телефоне»: сетка 3×3 + ряд (пусто / 0 / backspace). */
export function PinPad({ value, onChange, error }: Props) {
  const press = (d: string) => {
    if (value.length >= PIN_LENGTH) return;
    onChange(value + d);
  };
  const back = () => onChange(value.slice(0, -1));

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Точки-индикаторы */}
      <div className="flex items-center gap-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const filled = i < value.length;
          const color = error ? 'var(--danger)' : 'var(--accent)';
          return (
            <span
              key={i}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${filled ? color : 'var(--border-strong)'}`,
                background: filled ? color : 'transparent',
                boxShadow: filled ? `0 0 8px ${error ? 'rgba(255,0,60,0.6)' : 'var(--accent-glow)'}` : 'none',
                transition: 'all 120ms ease-out',
              }}
            />
          );
        })}
      </div>

      {/* Клавиатура */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 64px)', gap: 14 }}>
        {KEYS.map((d) => (
          <Key key={d} onClick={() => press(d)}>{d}</Key>
        ))}
        {/* Нижний ряд: пусто / 0 / backspace */}
        <span />
        <Key onClick={() => press('0')}>0</Key>
        <Key onClick={back} disabled={value.length === 0} aria-label="стереть">
          <Delete size={22} />
        </Key>
      </div>
    </div>
  );
}

function Key({
  children, onClick, disabled, ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center font-mono select-none active:scale-95 transition-transform"
      style={{
        width: 64, height: 64,
        fontSize: 24, fontWeight: 600,
        color: 'var(--text-primary)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
