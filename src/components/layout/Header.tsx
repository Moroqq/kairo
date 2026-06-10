import { Search, Lock, X } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useIsMobile } from '@/hooks/useMediaQuery';

export function Header() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearch   = useUIStore((s) => s.setSearch);
  const lock        = useAuthStore((s) => s.lock);
  const isMobile    = useIsMobile();

  return (
    <div
      className="bevel-raised flex items-center gap-2 px-2 py-1.5"
      style={{ background: 'rgba(8, 12, 8, 0.7)' }}
    >
      {/* Search field — terminal-prompt look */}
      <div
        className="flex items-center gap-2 flex-1 px-2 h-7"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {!isMobile && <span className="neon-text font-mono" style={{ fontSize: 11 }}>поиск&nbsp;»</span>}
        <Search size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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

      {/* Lock */}
      <button
        onClick={lock}
        className="bevel-raised flex items-center gap-1.5 h-7 px-2.5 text-xs"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        title="Заблокировать сессию"
      >
        <Lock size={11} />
        {!isMobile && 'блок'}
      </button>
    </div>
  );
}
