import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Plus } from 'lucide-react';
import { NAV } from './nav';
import { useUIStore } from '@/stores/ui.store';

const ICON_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const;

/**
 * Мобильная навигация — выдвижной FAB speed-dial в правом нижнем углу.
 * Заменяет нижнюю панель: 8 ячеек по ~47px были непопадаемы пальцем.
 * Тач-зоны пунктов 56px, единая точка входа у большого пальца.
 */
export function MobileNavFab() {
  const navigate = useNavigate();
  const location = useLocation();
  const openCapture = useUIStore((s) => s.openCapture);
  const [open, setOpen] = useState(false);

  // Закрывать при смене маршрута и по системной кнопке «назад»
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onPop = () => setOpen(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open]);

  const go = (to: string) => { navigate(to); setOpen(false); };
  const capture = () => { setOpen(false); openCapture(); };

  const currentNav = NAV.find(({ to }) => to === location.pathname);

  return (
    <>
      {/* Бэкдроп */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[55]"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Стек пунктов */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-[58] flex flex-col items-end"
            style={{
              right: 16,
              bottom: 'calc(96px + env(safe-area-inset-bottom))',
              gap: 8,
              maxHeight: 'calc(100dvh - 180px)',
              overflowY: 'auto',
            }}
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open:   { transition: { staggerChildren: 0.035, staggerDirection: -1 } },
              closed: { transition: { staggerChildren: 0.02, staggerDirection: 1 } },
            }}
          >
            {/* Создание задачи — primary */}
            <NavItem
              label="новая задача"
              active={false}
              primary
              icon={<Plus size={20} />}
              onClick={capture}
            />
            {/* Пункты навигации (в обратном порядке — частые ближе к пальцу) */}
            {[...NAV].reverse().map(({ to, label, icon: Icon }) => (
              <NavItem
                key={to}
                label={label}
                active={location.pathname === to}
                icon={<Icon size={20} />}
                onClick={() => go(to)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Основной FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.93 }}
        transition={ICON_TRANSITION}
        className="fixed z-[60] flex flex-col items-center justify-center gap-0.5"
        style={{
          right: 16,
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          width: 64,
          height: 64,
          background: 'var(--bg-surface)',
          border: '2px solid var(--accent)',
          boxShadow: '0 0 0 1px var(--accent), 0 0 20px var(--accent-glow)',
          color: 'var(--accent)',
          cursor: 'pointer',
        }}
        title={open ? 'закрыть меню' : 'меню'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              className="flex items-center justify-center neon-text"
              initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
              transition={ICON_TRANSITION}
            >
              <X size={26} />
            </motion.span>
          ) : (
            <motion.div
              key="menu"
              className="flex flex-col items-center gap-0.5"
              initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
              transition={ICON_TRANSITION}
            >
              <Menu size={22} className="neon-text" />
              {currentNav && (
                <span className="font-mono neon-text" style={{ fontSize: 7, letterSpacing: 1, lineHeight: 1, textTransform: 'uppercase' }}>
                  {currentNav.label}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */

function NavItem({
  label, icon, active, primary, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={{
        open:   { opacity: 1, x: 0,  scale: 1,   transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
        closed: { opacity: 0, x: 24, scale: 0.9, transition: { duration: 0.12 } },
      }}
      className="flex items-center justify-end gap-3 select-none"
      style={{
        height: 64,
        minWidth: 212,
        padding: '0 18px',
        background: primary ? 'var(--accent-dim)' : 'var(--bg-surface)',
        border: `1px solid ${primary || active ? 'var(--accent)' : 'var(--border)'}`,
        color: primary || active ? 'var(--accent)' : 'var(--text-secondary)',
        textShadow: primary || active ? '0 0 6px var(--accent-glow)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' }}
      >
        {label}
      </span>
      <span className="flex items-center justify-center flex-shrink-0">{icon}</span>
    </motion.button>
  );
}
