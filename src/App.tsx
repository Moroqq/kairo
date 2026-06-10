import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
import { LockScreen } from '@/pages/LockScreen';
import { Dashboard } from '@/pages/Dashboard';
import { CalendarPage } from '@/pages/CalendarPage';
import { EventLog } from '@/pages/EventLog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: 1 },
  },
});

export default function App() {
  const isUnlocked = useAuthStore((s) => s.isUnlocked);

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
              <Route path="/"         element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/log"      element={<EventLog />} />
              <Route path="*"    element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
