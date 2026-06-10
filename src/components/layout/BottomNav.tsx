import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { NAV } from './nav';

/** Нижняя навигация для мобильных: пункты NAV + центральная кнопка захвата задачи. */
export function BottomNav() {
  const openCapture = useUIStore((s) => s.openCapture);

  return (
    <nav
      className="flex items-stretch flex-shrink-0"
      style={{
        height: 56,
        background: '#020402',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className="flex-1 flex flex-col items-center justify-center gap-1 select-none"
          style={({ isActive }) => ({
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            textShadow: isActive ? '0 0 8px var(--accent-glow)' : 'none',
            borderTop: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
          })}
        >
          <Icon size={18} />
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: 1 }}>{label}</span>
        </NavLink>
      ))}

      {/* Capture */}
      <button
        type="button"
        onClick={openCapture}
        className="flex-1 flex flex-col items-center justify-center gap-1"
        style={{ background: 'transparent', border: 'none', borderTop: '2px solid transparent', color: 'var(--accent)', cursor: 'pointer' }}
        title="новая задача"
      >
        <Plus size={20} className="neon-text" />
        <span className="font-mono" style={{ fontSize: 9, letterSpacing: 1 }}>задача</span>
      </button>
    </nav>
  );
}
