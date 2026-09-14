import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavFab } from './MobileNavFab';
import { Header } from './Header';
import { MatrixRain } from './MatrixRain';
import { TaskDrawer } from '@/components/task/TaskDrawer';
import { CaptureModal } from '@/components/capture/CaptureModal';
import { useUIStore } from '@/stores/ui.store';
import { useTheme } from '@/stores/theme.store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { initNotifications } from '@/services/notifications.service';

initNotifications().catch(() => {});

interface AppShellProps {
  children: ReactNode;
}

/**
 * Каркас приложения.
 *
 * Здесь когда-то жили два декоративных элемента десктопа: фальшивый титулбар
 * с глифами окна и нижний статусбар со счётчиками и часами. Убраны намеренно.
 * Титулбар дублировал настоящую рамку окна Tauri, а его «кнопки» ничего не
 * делали; статусбар показывал числа, которые и так видны на доске, и держал
 * два интервала (часы и обратный отсчёт), тикавших на каждом экране.
 */
export function AppShell({ children }: AppShellProps) {
  const openCapture = useUIStore((s) => s.openCapture);
  const isMobile = useIsMobile();
  const theme = useTheme();

  // Глобальный хоткей N — новая задача. Раньше слушатель жил в Dashboard и
  // работал только на /board, хотя кнопка «+ новая задача (N)» видна везде.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openCapture(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openCapture]);

  return (
    <div
      className={`win-desktop h-full flex flex-col relative ${isMobile ? '' : 'p-3 gap-3'}`}
      style={isMobile ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
    >
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
        {/* Body */}
        <div className="flex flex-1 min-h-0" style={{ padding: isMobile ? 0 : 8, gap: 8 }}>
          {!isMobile && <Sidebar />}

          <div className="flex flex-col flex-1 min-w-0 min-h-0 gap-2">
            <Header />

            <main
              className="bevel-sunken flex-1 overflow-hidden flex flex-col relative"
              style={{ background: 'var(--well-bg)', paddingBottom: isMobile ? 'calc(64px + env(safe-area-inset-bottom))' : undefined }}
            >
              {children}

              {!isMobile && (
                <button
                  onClick={openCapture}
                  className="m3-fab absolute bottom-5 right-5 z-30 flex items-center gap-2 font-medium"
                  style={{
                    background: 'var(--accent)', color: 'var(--on-accent)', border: 'none',
                    height: 56, padding: '0 22px', fontSize: 15, fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 0 24px var(--accent-glow)',
                  }}
                  title="Новая задача (N)"
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
                  <span>новая задача</span>
                </button>
              )}
            </main>
          </div>
        </div>

        {isMobile && <MobileNavFab />}
      </div>

      <TaskDrawer />
      <CaptureModal />
    </div>
  );
}
