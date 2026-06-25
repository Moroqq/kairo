import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Target, LayoutDashboard, NotebookPen, MoreHorizontal,
  CalendarDays, BarChart3, Wallet, ScrollText, Plus, X,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';

const SPRING = { type: 'spring', duration: 0.25, bounce: 0 } as const;

/** Три основные вкладки — всегда видны в нижней панели. */
const BOTTOM_TABS = [
  { to: '/',      label: 'фокус',  Icon: Target          },
  { to: '/board', label: 'доска',  Icon: LayoutDashboard },
  { to: '/todo',  label: 'листок', Icon: NotebookPen     },
] as const;

/** Дополнительные разделы в панели «Ещё». */
const MORE_ITEMS = [
  { to: '/calendar', label: 'план',    Icon: CalendarDays },
  { to: '/weeks',    label: 'итоги',   Icon: BarChart3    },
  { to: '/expenses', label: 'траты',   Icon: Wallet       },
  { to: '/log',      label: 'события', Icon: ScrollText   },
] as const;

/** Высота нижней панели в px (без safe-area). */
export const TAB_BAR_HEIGHT = 60;

export function MobileNavFab() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const openCapture = useUIStore((s) => s.openCapture);
  const [moreOpen, setMoreOpen] = useState(false);

  // Закрывать «Ещё» при смене страницы или системной кнопке «назад»
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onPop = () => setMoreOpen(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [moreOpen]);

  const isActive      = (to: string) => location.pathname === to;
  const go            = (to: string) => { navigate(to); setMoreOpen(false); };
  const anyMoreActive = MORE_ITEMS.some(({ to }) => isActive(to));

  return (
    <>
      {/* ── Backdrop панели «Ещё» ─────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-[28]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Панель «Ещё» ──────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed left-0 right-0 z-[29] flex flex-col"
            style={{
              bottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border)',
              padding: '12px 12px 10px',
              gap: 10,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={SPRING}
          >
            {/* Сетка дополнительных разделов */}
            <div className="grid grid-cols-4 gap-2">
              {MORE_ITEMS.map(({ to, label, Icon }) => {
                const active = isActive(to);
                return (
                  <motion.button
                    key={to}
                    type="button"
                    onClick={() => go(to)}
                    whileTap={{ scale: 0.96 }}
                    transition={SPRING}
                    className="flex flex-col items-center gap-1.5 py-3 select-none"
                    style={{
                      minHeight: 72,
                      background: active ? 'var(--accent-dim)' : 'var(--well-bg)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      color: active ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius)',
                      textShadow: active ? '0 0 6px var(--accent-glow)' : 'none',
                    }}
                  >
                    <Icon size={22} />
                    <span className="font-mono" style={{ fontSize: 11, letterSpacing: 0.5 }}>{label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Кнопка «новая задача» */}
            <motion.button
              type="button"
              onClick={() => { openCapture(); setMoreOpen(false); }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="flex items-center justify-center gap-2 font-mono select-none"
              style={{
                height: 52,
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                cursor: 'pointer',
                textShadow: '0 0 6px var(--accent-glow)',
                fontSize: 14,
                letterSpacing: 1,
                borderRadius: 'var(--radius)',
              }}
            >
              <Plus size={18} /> новая задача
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Нижняя вкладочная панель ──────────────────────── */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[30] flex items-stretch"
        style={{
          height: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Три основные вкладки */}
        {BOTTOM_TABS.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <motion.button
              key={to}
              type="button"
              onClick={() => { go(to); if (moreOpen) setMoreOpen(false); }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="flex-1 flex flex-col items-center justify-center gap-1 select-none"
              style={{
                background: 'transparent',
                border: 'none',
                borderTop: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                textShadow: active ? '0 0 6px var(--accent-glow)' : 'none',
              }}
            >
              {/* Spring-анимация иконки при активации (принцип #7 скилла) */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={active ? 'active' : 'idle'}
                  className="flex items-center justify-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={SPRING}
                >
                  <Icon size={active ? 23 : 21} />
                </motion.span>
              </AnimatePresence>
              <span className="font-mono" style={{ fontSize: 10, letterSpacing: 0.5, lineHeight: 1 }}>
                {label}
              </span>
            </motion.button>
          );
        })}

        {/* Вкладка «Ещё» */}
        <motion.button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          whileTap={{ scale: 0.96 }}
          transition={SPRING}
          className="flex-1 flex flex-col items-center justify-center gap-1 select-none"
          style={{
            background: 'transparent',
            border: 'none',
            borderTop: `2px solid ${moreOpen || anyMoreActive ? 'var(--accent)' : 'transparent'}`,
            color: moreOpen || anyMoreActive ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            textShadow: moreOpen || anyMoreActive ? '0 0 6px var(--accent-glow)' : 'none',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {moreOpen ? (
              <motion.span
                key="close"
                className="flex items-center justify-center"
                initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                transition={SPRING}
              >
                <X size={23} />
              </motion.span>
            ) : (
              <motion.span
                key="more"
                className="flex items-center justify-center"
                initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                transition={SPRING}
              >
                <MoreHorizontal size={23} />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: 0.5, lineHeight: 1 }}>ещё</span>
        </motion.button>
      </div>
    </>
  );
}
