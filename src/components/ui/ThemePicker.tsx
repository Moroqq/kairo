import { Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { THEME_LIST } from '@/themes/themes';
import { useThemeStore } from '@/stores/theme.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Выбор режима оформления. Каждая тема меняет и палитру, и лексику интерфейса. */
export function ThemePicker({ open, onClose }: Props) {
  const themeId  = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <Modal open={open} onClose={onClose} title="режим оформления" width={420}>
      <div className="flex flex-col gap-1.5" style={{ padding: 12 }}>
        {THEME_LIST.map((t) => {
          const active = t.id === themeId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className="row-hover flex items-center gap-3 px-3 text-left"
              style={{
                minHeight: 52,
                background: 'transparent',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
                boxShadow: active ? '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)' : 'none',
                cursor: 'pointer',
              }}
            >
              {/* Свотчи */}
              <span className="flex gap-1 flex-shrink-0">
                {t.preview.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 14, height: 14,
                      background: c,
                      border: '1px solid rgba(128,128,128,0.4)',
                    }}
                  />
                ))}
              </span>

              <span className="flex flex-col flex-1 min-w-0 py-1.5">
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 12, letterSpacing: 2, color: 'var(--text-primary)' }}
                >
                  {t.name}
                </span>
                <span className="font-mono truncate" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {t.tagline}
                </span>
              </span>

              {active && <Check size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            </button>
          );
        })}

        <p className="font-mono" style={{ fontSize: 10, color: 'var(--text-dim)', padding: '6px 2px 0' }}>
          // тема меняет не только цвета — колонки и заголовки говорят на её языке
        </p>
      </div>
    </Modal>
  );
}
