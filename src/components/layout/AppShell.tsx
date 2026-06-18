import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavFab } from './MobileNavFab';
import { Header } from './Header';
import { MatrixRain } from './MatrixRain';
import { TaskDrawer } from '@/components/task/TaskDrawer';
import { CaptureModal } from '@/components/capture/CaptureModal';
import { useUIStore } from '@/stores/ui.store';
import { useTheme } from '@/stores/theme.store';
import { useTasks } from '@/hooks/useTasks';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { initNotifications } from '@/services/notifications.service';
import { isOverdue } from '@/hooks/useDeadlineWatcher';

initNotifications().catch(() => {});

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const openCapture = useUIStore((s) => s.openCapture);
  const isMobile = useIsMobile();
  const theme = useTheme();
  const { data: tasks } = useTasks();

  const active   = (tasks ?? []).filter((t) => t.status !== 'Resolved' && t.status !== 'Archived');
  const total    = tasks?.length ?? 0;
  const open     = active.length;
  const resolved = tasks?.filter((t) => t.status === 'Resolved').length ?? 0;
  const overdue  = active.filter((t) => isOverdue(t.deadline)).length;

  // Ближайший дедлайн среди активных (не просрочённых)
  const nextDeadline = active
    .filter((t) => t.deadline && !isOverdue(t.deadline))
    .map((t) => new Date(t.deadline!).getTime())
    .sort((a, b) => a - b)[0];

  return (
    <div className={`win-desktop h-full flex flex-col relative ${isMobile ? '' : 'p-3 gap-3'}`}>
      {theme.fx && <MatrixRain mobile={isMobile} />}

      <div
        className="bevel-raised flex-1 flex flex-col min-h-0 relative"
        style={{
          background: 'var(--shell-bg)',
          boxShadow: isMobile ? 'none' : 'var(--shadow-elevated)',
          border: isMobile ? 'none' : undefined,
          zIndex: 3,
        }}
      >
        {/* Terminal title bar */}
        <div className="titlebar">
          <span className="neon-text">●</span>
          <span className="flex-1 truncate cursor-blink">
            {isMobile ? theme.vocab.titlebarShort : theme.vocab.titlebar}
          </span>
          {!isMobile && (
            <>
              <button className="titlebar-btn" title="Свернуть">_</button>
              <button className="titlebar-btn" title="Развернуть">□</button>
              <button className="titlebar-btn" title="Закрыть">✕</button>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0" style={{ padding: isMobile ? 4 : 8, gap: 8 }}>
          {!isMobile && <Sidebar />}

          <div className="flex flex-col flex-1 min-w-0 min-h-0 gap-2">
            <Header />

            <main
              className="bevel-sunken flex-1 overflow-hidden flex flex-col relative"
              style={{ background: 'var(--well-bg)' }}
            >
              {children}

              {!isMobile && (
                <button
                  onClick={openCapture}
                  className="bevel-raised absolute bottom-3 right-3 z-30 flex items-center gap-2 px-3 h-8 text-xs font-medium"
                  style={{ background: 'var(--bg-surface)' }}
                  title="Новая задача (N)"
                >
                  <span className="neon-text" style={{ fontSize: 14, lineHeight: 1 }}>+</span>
                  <span style={{ color: 'var(--text-primary)' }}>новая задача</span>
                </button>
              )}
            </main>
          </div>
        </div>

        {/* Status bar — desktop only (на мобиле вместо него BottomNav) */}
        {!isMobile && (
        <div
          className="flex items-center gap-2 px-2 py-1 text-xs"
          style={{ background: 'var(--statusbar-bg)', borderTop: '1px solid var(--border-subtle)' }}
        >
          <span className="flex items-center gap-1.5">
            <span className="led led-blink" />
            <span className="neon-text" style={{ letterSpacing: 1 }}>В СЕТИ</span>
          </span>
          <Sep />
          <span style={{ color: 'var(--text-muted)' }}>
            всего <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{pad(total)}</span>
          </span>
          <Sep />
          <span style={{ color: 'var(--text-muted)' }}>
            активных <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{pad(open)}</span>
          </span>
          <Sep />
          <span style={{ color: 'var(--text-muted)' }}>
            выполнено <span className="font-mono" style={{ color: 'var(--text-bright)' }}>{pad(resolved)}</span>
          </span>
          {overdue > 0 && (
            <>
              <Sep />
              <span className="flex items-center gap-1.5">
                <span className="led led-red led-blink" />
                <span className="neon-pink-text font-bold">ПРОСРОЧЕНО {pad(overdue)}</span>
              </span>
            </>
          )}
          <div className="flex-1" />
          {nextDeadline !== undefined && (
            <span style={{ color: 'var(--text-muted)' }}>
              ближайший дедлайн{' '}
              <span className="font-mono" style={{ color: 'var(--text-bright)' }}>
                <Countdown to={nextDeadline} />
              </span>
              <span style={{ color: 'var(--text-dim)' }}> │ </span>
            </span>
          )}
          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
            <Clock />
          </span>
        </div>
        )}

        {isMobile && <MobileNavFab />}
      </div>

      <TaskDrawer />
      <CaptureModal />
    </div>
  );
}

function Sep() {
  return <span style={{ color: 'var(--text-dim)' }}>│</span>;
}

function pad(n: number) {
  return n.toString().padStart(3, '0');
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</>;
}

/** Обратный отсчёт «12ч 34м» до целевой timestamp. */
function Countdown({ to }: { to: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, to - now);
  const min  = Math.floor(diff / 60_000);
  const days = Math.floor(min / (60 * 24));
  const hrs  = Math.floor((min % (60 * 24)) / 60);
  const m    = min % 60;
  if (days > 0) return <>{days}д {hrs}ч</>;
  if (hrs > 0)  return <>{hrs}ч {m}м</>;
  return <>{m}м</>;
}
