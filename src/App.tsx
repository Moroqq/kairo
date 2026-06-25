import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/stores/theme.store';
import { applyTheme } from '@/themes/themes';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { LockScreen } from '@/pages/LockScreen';
import { FocusPage } from '@/pages/FocusPage';
import { Dashboard } from '@/pages/Dashboard';
import { CalendarPage } from '@/pages/CalendarPage';
import { TodoPage } from '@/pages/TodoPage';
import { WeeksPage } from '@/pages/WeeksPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { EventLog } from '@/pages/EventLog';
import { TrashPage } from '@/pages/TrashPage';
import { LanSyncPage } from '@/pages/LanSyncPage';
import { pruneTrash } from '@/services/tasks.service';
import lanSync, { isDesktopHost } from '@/services/lan-sync.service';

export default function App() {
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const theme = useTheme();

  // Тема применяется до раннего return — работает и на lock-экране
  useEffect(() => applyTheme(theme), [theme]);

  // Автоочистка корзины при запуске
  useEffect(() => { pruneTrash(); }, []);

  // WS-хост стартует сразу, а не только на странице /sync
  useEffect(() => {
    if (isDesktopHost()) {
      lanSync.initHost();
      return () => { lanSync.destroyHost(); };
    }
  }, []);

  if (!isUnlocked) {
    return (
      <ToastProvider>
        <LockScreen />
      </ToastProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/"         element={<FocusPage />} />
              <Route path="/board"    element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/todo"     element={<TodoPage />} />
              <Route path="/weeks"    element={<WeeksPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/log"      element={<EventLog />} />
              <Route path="/trash"    element={<TrashPage />} />
              <Route path="/sync"     element={<LanSyncPage />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
