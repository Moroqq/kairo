import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useTasks } from '@/hooks/useTasks';

const NAV = [
  { to: '/',    label: 'Dashboard', icon: LayoutDashboard },
  { to: '/log', label: 'Event Log', icon: ScrollText      },
];

export function Sidebar() {
  const collapsed    = useUIStore((s) => s.sidebarCollapsed);
  const toggle       = useUIStore((s) => s.toggleSidebar);
  const { data: tasks } = useTasks();

  const p1Count = tasks?.filter((t) => t.priority === 'A' && t.status !== 'Resolved' && t.status !== 'Archived').length ?? 0;

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full transition-all duration-200"
      style={{
        width: collapsed ? 56 : 200,
        background:  'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {!collapsed && (
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--accent)' }}>
            Kairo
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'active-nav' : ''
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              color:      isActive ? 'var(--accent)'     : 'var(--text-secondary)',
            })}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* P1 counter */}
      {p1Count > 0 && !collapsed && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(251,71,71,0.1)', border: '1px solid rgba(251,71,71,0.2)' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--pa)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--pa)' }}>
            {p1Count} critical
          </span>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-10 w-full transition-opacity hover:opacity-70"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
