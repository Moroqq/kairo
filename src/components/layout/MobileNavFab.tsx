import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Target, LayoutDashboard, NotebookPen, MoreHorizontal,
  CalendarDays, BarChart3, Wallet, ScrollText, Trash2, Wifi, X,
  Palette, ChevronRight, SlidersHorizontal, Menu,
  ChevronUp, ChevronDown, Minus, Plus,
} from 'lucide-react';

import { ThemePicker } from '@/components/ui/ThemePicker';
import { Modal } from '@/components/ui/Modal';

const SPRING = { type: 'spring', duration: 0.25, bounce: 0 } as const;

/** Высота нижней панели в px (без safe-area). */
export const TAB_BAR_HEIGHT = 64;

// ─── Настраиваемые разделы ──────────────────────────────────────────────────

const ALL_IDS = ['focus', 'board', 'calendar', 'todo', 'weeks', 'expenses', 'log'] as const;
type TabId = (typeof ALL_IDS)[number];

interface SectionDef {
  to: string;
  label: string;
  Icon: LucideIcon;
  cmd: string;
}

const SECTION_DEF: Record<TabId, SectionDef> = {
  focus:    { to: '/',         label: 'фокус',   Icon: Target,          cmd: 'focus' },
  board:    { to: '/board',    label: 'доска',   Icon: LayoutDashboard, cmd: 'board' },
  calendar: { to: '/calendar', label: 'план',    Icon: CalendarDays,    cmd: 'plan'  },
  todo:     { to: '/todo',     label: 'листок',  Icon: NotebookPen,     cmd: 'todo'  },
  weeks:    { to: '/weeks',    label: 'итоги',   Icon: BarChart3,       cmd: 'weeks' },
  expenses: { to: '/expenses', label: 'траты',   Icon: Wallet,          cmd: 'spend' },
  log:      { to: '/log',      label: 'события', Icon: ScrollText,      cmd: 'logs'  },
};

// Всегда в «ещё», нельзя перенести в таббар
const FIXED_MORE: SectionDef[] = [
  { to: '/trash', label: 'корзина', Icon: Trash2, cmd: 'trash' },
  { to: '/sync',  label: 'синк',    Icon: Wifi,   cmd: 'sync'  },
];

const DEFAULT_TAB_IDS: TabId[] = ['focus', 'board', 'calendar', 'todo'];
const NAV_KEY = 'kairo.mobile.tabs';
const TAB_MIN = 2, TAB_MAX = 4;

function loadTabIds(): TabId[] {
  try {
    const s = JSON.parse(localStorage.getItem(NAV_KEY) ?? '');
    if (Array.isArray(s) && s.length) {
      const c = s.filter((id): id is TabId => (ALL_IDS as readonly string[]).includes(id));
      if (c.length >= TAB_MIN) return c;
    }
  } catch { /* noop */ }
  return [...DEFAULT_TAB_IDS];
}

function saveTabIds(ids: TabId[]) {
  try { localStorage.setItem(NAV_KEY, JSON.stringify(ids)); } catch { /* noop */ }
}

// ─── MenuEditorBody ─────────────────────────────────────────────────────────

function MenuEditorBody({
  tabIds,
  setTabIds,
  onClose,
}: {
  tabIds: TabId[];
  setTabIds: (ids: TabId[]) => void;
  onClose: () => void;
}) {
  const hidden = ALL_IDS.filter(id => !tabIds.includes(id));

  const move = (id: TabId, dir: -1 | 1) => {
    const i = tabIds.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= tabIds.length) return;
    const next = [...tabIds];
    [next[i], next[j]] = [next[j], next[i]];
    setTabIds(next);
  };
  const remove = (id: TabId) => {
    if (tabIds.length <= TAB_MIN) return;
    setTabIds(tabIds.filter(x => x !== id));
  };
  const add = (id: TabId) => {
    if (tabIds.length >= TAB_MAX) return;
    setTabIds([...tabIds, id]);
  };

  const hdr: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: 1, margin: '0 2px 4px',
  };

  const RoundBtn = ({
    kind, disabled, onClick,
  }: { kind: 'add' | 'remove'; disabled: boolean; onClick: () => void }) => {
    const c = kind === 'add' ? 'var(--success)' : 'var(--danger)';
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          width: 26, height: 26, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: disabled ? 'var(--bg-input)' : `color-mix(in srgb, transparent 84%, ${c})`,
          border: `1px solid ${disabled ? 'var(--border)' : c}`,
          borderRadius: 'var(--radius-sm)',
          color: disabled ? 'var(--text-dim)' : c,
          cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        }}
      >
        {kind === 'add'
          ? <Plus size={15} strokeWidth={3} color={disabled ? 'var(--text-dim)' : 'var(--success)'} />
          : <Minus size={15} strokeWidth={3} color={disabled ? 'var(--text-dim)' : 'var(--danger)'} />}
      </button>
    );
  };

  return (
    <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Заголовок */}
      <div style={hdr}>в нижней панели · {tabIds.length}/{TAB_MAX}</div>

      {/* Активные вкладки */}
      {tabIds.map((id, i) => {
        const s = SECTION_DEF[id];
        return (
          <div
            key={id}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              minHeight: 42, padding: '4px 10px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <RoundBtn kind="remove" disabled={tabIds.length <= TAB_MIN} onClick={() => remove(id)} />
            <s.Icon size={17} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.label}
            </span>
            <span style={{ display: 'inline-flex', gap: 2, flexShrink: 0 }}>
              <button
                type="button"
                onClick={i > 0 ? () => move(id, -1) : undefined}
                aria-label="выше"
                style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: i > 0 ? 'pointer' : 'default', color: 'var(--text-muted)', opacity: i > 0 ? 1 : 0.3 }}
              >
                <ChevronUp size={17} />
              </button>
              <button
                type="button"
                onClick={i < tabIds.length - 1 ? () => move(id, 1) : undefined}
                aria-label="ниже"
                style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: i < tabIds.length - 1 ? 'pointer' : 'default', color: 'var(--text-muted)', opacity: i < tabIds.length - 1 ? 1 : 0.3 }}
              >
                <ChevronDown size={17} />
              </button>
            </span>
          </div>
        );
      })}

      {/* Вкладка «ещё» — всегда последняя, нельзя убрать */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        minHeight: 38, padding: '4px 10px',
        background: 'var(--bg-input)', border: '1px dashed var(--border)',
        borderRadius: 'var(--radius-card)', opacity: 0.7,
      }}>
        <span style={{ width: 26, flexShrink: 0 }} />
        <MoreHorizontal size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>ещё</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>всегда</span>
      </div>

      {/* Скрытые разделы — в «ещё» */}
      {hidden.length > 0 && (
        <div style={{ ...hdr, marginTop: 8 }}>скрыто · в «ещё»</div>
      )}
      {hidden.map(id => {
        const s = SECTION_DEF[id];
        const canAdd = tabIds.length < TAB_MAX;
        return (
          <div
            key={id}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              minHeight: 42, padding: '4px 10px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <RoundBtn kind="add" disabled={!canAdd} onClick={() => add(id)} />
            <s.Icon size={17} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.label}
            </span>
          </div>
        );
      })}

      {/* Готово */}
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 6, height: 44, flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'var(--accent)', color: '#000',
          border: 'none', borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 0 14px var(--accent-glow)',
        }}
      >
        готово
      </button>
    </div>
  );
}

// ─── MobileNavFab ───────────────────────────────────────────────────────────

export function MobileNavFab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen,       setMoreOpen]       = useState(false);
  const [themesOpen,     setThemesOpen]     = useState(false);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);

  // Динамические вкладки из localStorage
  const [tabIdsRaw, setTabIdsRaw] = useState<TabId[]>(loadTabIds);
  const setTabIds = (next: TabId[]) => { setTabIdsRaw(next); saveTabIds(next); };

  // Вычисляем нижний таббар и разделы «ещё»
  const bottomTabs = tabIdsRaw.map(id => SECTION_DEF[id]);
  const hiddenIds  = ALL_IDS.filter(id => !tabIdsRaw.includes(id));
  const moreItems  = [
    ...hiddenIds.map(id => SECTION_DEF[id]),
    ...FIXED_MORE,
  ];

  // Закрывать «Ещё» при смене страницы или кнопке «назад»
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onPop = () => setMoreOpen(false);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [moreOpen]);

  const isActive      = (to: string) => location.pathname === to;
  const go            = (to: string) => { navigate(to); setMoreOpen(false); };
  const anyMoreActive = moreItems.some(({ to }) => isActive(to));

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
            className="fixed left-0 right-0 z-[29]"
            style={{
              bottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border)',
              padding: '14px 14px 10px',
              maxHeight: `calc(100dvh - ${TAB_BAR_HEIGHT}px - env(safe-area-inset-bottom) - 20px)`,
              overflowY: 'auto',
              overscrollBehavior: 'none',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={SPRING}
          >
            {/* Заголовок */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12 }}>
              <Menu size={18} color="var(--accent)" />
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-bright)', letterSpacing: 0.3 }}>
                ещё
              </span>
            </div>

            {/* Настраиваемые разделы (скрытые из таббара) */}
            {moreItems.length > FIXED_MORE.length && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {hiddenIds.map(id => {
                  const { to, label, cmd, Icon } = SECTION_DEF[id];
                  const active = isActive(to);
                  return (
                    <motion.button
                      key={to}
                      type="button"
                      onClick={() => go(to)}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        width: '100%', minHeight: 60, padding: '12px 14px', textAlign: 'left',
                        background: active ? 'color-mix(in srgb, var(--accent-dim) 80%, transparent)' : 'var(--bg-card)',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-card)', cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: 38, height: 38, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <Icon size={19} color="var(--accent)" />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 15, color: 'var(--text-primary)' }}>{label}</span>
                        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          <span style={{ color: 'var(--text-dim)' }}>$ </span>{cmd}
                        </span>
                      </span>
                      <ChevronRight size={18} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Фиксированные разделы (корзина, синк) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FIXED_MORE.map(({ to, label, cmd, Icon }) => {
                const active = isActive(to);
                return (
                  <motion.button
                    key={to}
                    type="button"
                    onClick={() => go(to)}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      width: '100%', minHeight: 60, padding: '12px 14px', textAlign: 'left',
                      background: active ? 'color-mix(in srgb, var(--accent-dim) 80%, transparent)' : 'var(--bg-card)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-card)', cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 38, height: 38, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <Icon size={19} color="var(--accent)" />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, color: 'var(--text-primary)' }}>{label}</span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        <span style={{ color: 'var(--text-dim)' }}>$ </span>{cmd}
                      </span>
                    </span>
                    <ChevronRight size={18} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                  </motion.button>
                );
              })}
            </div>

            {/* Секция «система» */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 2px 8px' }}>
              система
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Оформление */}
              <motion.button
                type="button"
                onClick={() => { setThemesOpen(true); }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 60, padding: '12px 14px', textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', cursor: 'pointer' }}
              >
                <span style={{ width: 38, height: 38, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <Palette size={19} color="var(--accent)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--text-primary)' }}>оформление</span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span style={{ color: 'var(--text-dim)' }}>$ </span>theme
                  </span>
                </span>
                <ChevronRight size={18} color="var(--text-dim)" style={{ flexShrink: 0 }} />
              </motion.button>

              {/* Настроить меню */}
              <motion.button
                type="button"
                onClick={() => { setMenuEditorOpen(true); setMoreOpen(false); }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 60, padding: '12px 14px', textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', cursor: 'pointer' }}
              >
                <span style={{ width: 38, height: 38, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <SlidersHorizontal size={19} color="var(--accent)" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--text-primary)' }}>настроить меню</span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span style={{ color: 'var(--text-dim)' }}>$ </span>config --tabs
                  </span>
                </span>
                <ChevronRight size={18} color="var(--text-dim)" style={{ flexShrink: 0 }} />
              </motion.button>
            </div>

            <ThemePicker open={themesOpen} onClose={() => setThemesOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Редактор нижнего меню ─────────────────────────── */}
      <Modal open={menuEditorOpen} onClose={() => setMenuEditorOpen(false)} title="настроить меню">
        <MenuEditorBody
          tabIds={tabIdsRaw}
          setTabIds={setTabIds}
          onClose={() => setMenuEditorOpen(false)}
        />
      </Modal>

      {/* ── Нижняя вкладочная панель ──────────────────────── */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[30] flex items-stretch"
        style={{
          height: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'var(--statusbar-bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Динамические вкладки */}
        {bottomTabs.map(({ to, label, Icon }) => {
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
                background: 'transparent', border: 'none',
                borderTop: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                textShadow: active ? '0 0 6px var(--accent-glow)' : 'none',
              }}
            >
              <motion.span
                className="flex items-center justify-center"
                animate={{ scale: active ? 1.1 : 1, opacity: active ? 1 : 0.65 }}
                transition={SPRING}
              >
                <Icon size={22} />
              </motion.span>
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
            background: 'transparent', border: 'none',
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
                animate={{ scale: 1.1, opacity: 1, filter: 'blur(0px)' }}
                exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                transition={SPRING}
              >
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span
                key="more"
                className="flex items-center justify-center"
                initial={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                animate={{ scale: moreOpen || anyMoreActive ? 1.1 : 1, opacity: moreOpen || anyMoreActive ? 1 : 0.65, filter: 'blur(0px)' }}
                exit={{ scale: 0.25, opacity: 0, filter: 'blur(4px)' }}
                transition={SPRING}
              >
                <MoreHorizontal size={22} />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: 0.5, lineHeight: 1 }}>ещё</span>
        </motion.button>
      </div>
    </>
  );
}
