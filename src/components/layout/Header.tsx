import { Search, Lock } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';

const PRIORITIES = ['A', 'B', 'C', 'D'] as const;

export function Header() {
  const searchQuery     = useUIStore((s) => s.searchQuery);
  const setSearch       = useUIStore((s) => s.setSearch);
  const filterPriority  = useUIStore((s) => s.filterPriority);
  const setFilterPriority = useUIStore((s) => s.setFilterPriority);
  const lock            = useAuthStore((s) => s.lock);
  return (
    <header
      className="flex items-center gap-3 px-6 h-14 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          className="w-full h-8 pl-8 pr-3 rounded-lg text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border:     '1px solid var(--border)',
            color:      'var(--text-primary)',
          }}
          placeholder="Search tasks…"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          data-selectable
        />
      </div>

      {/* Priority filters */}
      <div className="flex gap-1">
        {PRIORITIES.map((p) => {
          const active = filterPriority === p;
          const colors: Record<string, string> = { A: '#FB4747', B: '#FF7917', C: '#3E89FF', D: '#707886' };
          return (
            <button
              key={p}
              onClick={() => setFilterPriority(active ? null : p)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: active ? `${colors[p]}22` : 'var(--bg-card)',
                color:      active ? colors[p]        : 'var(--text-muted)',
                border:     `1px solid ${active ? colors[p] : 'var(--border)'}`,
              }}
            >
              {p}
            </button>
          );
        })}
        {filterPriority && (
          <button
            onClick={() => setFilterPriority(null)}
            className="px-2 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div className="flex-1" />

      {/* Lock */}
      <button
        onClick={lock}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        title="Lock app"
      >
        <Lock size={13} />
        Lock
      </button>
    </header>
  );
}
