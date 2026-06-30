import { useState, useEffect } from 'react';
import { Search, Lock, X, Palette, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ThemePicker } from '@/components/ui/ThemePicker';
import { KairoMark } from '@/components/ui/KairoMark';

const ROUTE_CMD: Record<string, string> = {
  '/':         'focus',
  '/board':    'board',
  '/calendar': 'plan',
  '/todo':     'todo',
  '/weeks':    'weeks',
  '/expenses': 'spend',
  '/log':      'logs',
  '/trash':    'trash',
  '/sync':     'sync',
};

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</>;
}

export function Header() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearch   = useUIStore((s) => s.setSearch);
  const openCapture = useUIStore((s) => s.openCapture);
  const lock        = useAuthStore((s) => s.lock);
  const isMobile    = useIsMobile();
  const [themesOpen, setThemesOpen] = useState(false);
  const location    = useLocation();

  const cmd = ROUTE_CMD[location.pathname] ?? location.pathname.slice(1);

  /* ── Mobile: design TopBar ──────────────────────────────── */
  if (isMobile) {
    return (
      <header style={{
        position: 'relative', zIndex: 95, flexShrink: 0,
        background: 'var(--panel-bg)', borderBottom: '1px solid var(--border)',
        padding: '10px 12px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="neon-text" style={{ fontSize: 13, lineHeight: 1 }}>●</span>
          <KairoMark size={22} style={{ filter: 'drop-shadow(0 0 5px var(--accent-glow))' }} />
          <span
            className="neon-text font-mono"
            style={{ fontWeight: 700, letterSpacing: 2, fontSize: 17, flex: 1 }}
          >
            KAIRO
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setThemesOpen(true)}
              aria-label="тема"
              style={{
                width: 44, height: 44,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              <Palette size={19} />
            </button>
            <button
              onClick={openCapture}
              aria-label="новая задача"
              style={{
                width: 44, height: 44,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent)', border: '1px solid var(--accent)',
                color: '#000', cursor: 'pointer',
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
            >
              <Plus size={22} />
            </button>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginTop: 7,
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
        }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>[kairo@matrix:~]$ </span>
            <span style={{ color: 'var(--text-secondary)' }}>{cmd}</span>
            <span style={{ color: 'var(--text-dim)' }}> --online</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', flexShrink: 0 }}>
            <span className="led led-blink" style={{ width: 6, height: 6 }} />
            <LiveClock />
          </span>
        </div>
        <ThemePicker open={themesOpen} onClose={() => setThemesOpen(false)} />
      </header>
    );
  }

  /* ── Desktop: search + theme + lock ────────────────────── */
  return (
    <div
      className="bevel-raised flex items-center gap-2 px-2 py-2.5"
      style={{ background: 'var(--panel-bg)' }}
    >
      <div
        className="flex items-center gap-2 flex-1 px-2 h-9"
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
      >
        <span className="neon-text font-mono" style={{ fontSize: 11 }}>поиск&nbsp;»</span>
        <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          className="flex-1 h-full bg-transparent text-xs outline-none font-mono"
          style={{ color: 'var(--text-primary)' }}
          placeholder="поиск задач..."
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          data-selectable
        />
        {searchQuery && (
          <button
            onClick={() => setSearch('')}
            className="flex items-center justify-center"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            title="Очистить"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <button
        onClick={() => setThemesOpen(true)}
        className="bevel-raised flex items-center gap-1.5 h-9 px-3 text-xs"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        title="Режим оформления"
      >
        <Palette size={13} /> тема
      </button>

      <button
        onClick={lock}
        className="bevel-raised flex items-center gap-1.5 h-9 px-3 text-xs"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        title="Заблокировать сессию"
      >
        <Lock size={13} /> блок
      </button>

      <ThemePicker open={themesOpen} onClose={() => setThemesOpen(false)} />
    </div>
  );
}
