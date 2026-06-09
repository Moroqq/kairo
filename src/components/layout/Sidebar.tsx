import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';

const NAV = [
  { to: '/',    label: 'панель',   cmd: 'panel', icon: LayoutDashboard },
  { to: '/log', label: 'события',  cmd: 'logs',  icon: ScrollText      },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle    = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className="bevel-raised flex flex-col flex-shrink-0 h-full"
      style={{
        width: collapsed ? 44 : 180,
        background: 'rgba(8, 12, 8, 0.7)',
        padding: 6,
        gap: 4,
      }}
    >
      {/* Brand */}
      <button
        onClick={toggle}
        className="flex items-center gap-2 px-1.5 h-7 text-xs"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? (
          <img
            src="/logo.png"
            alt="Kairo"
            width={20}
            height={20}
            style={{
              display: 'block',
              filter: 'drop-shadow(0 0 4px var(--accent-glow))',
            }}
          />
        ) : (
          <>
            <img
              src="/logo.png"
              alt=""
              width={18}
              height={18}
              style={{
                display: 'block',
                filter: 'drop-shadow(0 0 4px var(--accent-glow))',
                flexShrink: 0,
              }}
            />
            <span
              className="flex-1 text-left font-bold neon-text"
              style={{ letterSpacing: 2, fontSize: 13 }}
            >
              KAIRO
            </span>
            <ChevronLeft size={12} style={{ color: 'var(--text-muted)' }} />
          </>
        )}
      </button>

      {!collapsed && (
        <div
          style={{
            height: 1,
            background: 'var(--border-subtle)',
            margin: '2px 0',
          }}
        />
      )}

      {/* Nav — terminal-style commands */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ to, label, cmd, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className="flex items-center gap-2 px-2 h-7 text-xs select-none transition-colors"
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              textShadow: isActive ? '0 0 6px var(--accent-glow)' : 'none',
            })}
            title={collapsed ? label : undefined}
          >
            <Icon size={13} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span className="flex-1 truncate">
                <span style={{ color: 'var(--text-dim)' }}>$ </span>
                {cmd}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer prompt */}
      {!collapsed && (
        <div
          className="text-xs font-mono cursor-blink"
          style={{ color: 'var(--text-dim)', padding: '0 4px' }}
        >
          <span style={{ color: 'var(--accent)' }}>$</span>
        </div>
      )}

      {collapsed && (
        <button
          onClick={toggle}
          className="flex items-center justify-center h-6 text-xs"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title="Expand"
        >
          <ChevronRight size={12} />
        </button>
      )}
    </aside>
  );
}
