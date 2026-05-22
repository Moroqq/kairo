import { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TaskDrawer } from '@/components/task/TaskDrawer';
import { CaptureModal } from '@/components/capture/CaptureModal';
import { useUIStore } from '@/stores/ui.store';
import { initNotifications } from '@/services/notifications.service';

// Init notifications once on mount
initNotifications().catch(() => {});

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const openCapture = useUIStore((s) => s.openCapture);

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Header />

        <main className="flex-1 overflow-hidden flex flex-col relative">
          {children}

          {/* Floating action button */}
          <button
            onClick={openCapture}
            className="absolute bottom-6 right-6 z-30 flex items-center justify-center rounded-full shadow-elevated transition-all hover:scale-105 active:scale-95"
            style={{
              width:      52,
              height:     52,
              background: 'var(--accent)',
              boxShadow:  '0 4px 24px rgba(0,229,192,0.35)',
            }}
            title="New Task (N)"
          >
            <Plus size={22} style={{ color: '#000' }} strokeWidth={2.5} />
          </button>
        </main>
      </div>

      <TaskDrawer />
      <CaptureModal />
    </div>
  );
}
