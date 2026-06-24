import { useState } from 'react';
import { Search, Lock, X, Palette } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ThemePicker } from '@/components/ui/ThemePicker';

export function Header() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearch   = useUIStore((s) => s.setSearch);
  const lock        = useAuthStore((s) => s.lock);
  const isMobile    = useIsMobile();
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <div
      className="bevel-raised flex items-center gap-2 px-2 py-2.5"
      style={{ background: 'var(--panel-bg)' }}
    >
      {/* Search field — terminal-prompt look */}
      <div
        className="flex items-center gap-2 flex-1 px-2 h-9"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {!isMobile && <span className="neon-text font-mono" style={{ fontSize: 11 }}>поиск&nbsp;»</span>}
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

      {/* Theme */}
      <button
        onClick={() => setThemesOpen(true)}
        className="bevel-raised flex items-center gap-1.5 h-9 px-3 text-xs"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        title="Режим оформления"
      >
        <Palette size={13} />
        {!isMobile && 'тема'}
      </button>

      {/* Lock */}
      <button
        onClick={lock}
        className="bevel-raised flex items-center gap-1.5 h-9 px-3 text-xs"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        title="Заблокировать сессию"
      >
        <Lock size={13} />
        {!isMobile && 'блок'}
      </button>

      <ThemePicker open={themesOpen} onClose={() => setThemesOpen(false)} />
    </div>
  );
}
