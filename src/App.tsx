import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useTheme } from '@/stores/theme.store';
import { applyTheme } from '@/themes/themes';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/components/layout/AppShell';
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

/** Обёртка перехода между разделами — короткий fade + сдвиг, без блокировки ввода.
 *  Абсолютное позиционирование — старая и новая страницы накладываются друг на
 *  друга во время перехода, а не толкают layout (родитель уже position:relative). */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col min-h-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] } }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    // Без mode="wait": старая и новая страница анимируются одновременно, не
    // блокируя друг друга — если анимация где-то внутри страницы прервётся
    // (например, вложенный AnimatePresence в календаре), переход всё равно
    // завершится, а не зависнет в ожидании.
    <AnimatePresence initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<PageTransition><FocusPage /></PageTransition>} />
        <Route path="/board"    element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/calendar" element={<PageTransition><CalendarPage /></PageTransition>} />
        <Route path="/todo"     element={<PageTransition><TodoPage /></PageTransition>} />
        <Route path="/weeks"    element={<PageTransition><WeeksPage /></PageTransition>} />
        <Route path="/expenses" element={<PageTransition><ExpensesPage /></PageTransition>} />
        <Route path="/log"      element={<PageTransition><EventLog /></PageTransition>} />
        <Route path="/trash"    element={<PageTransition><TrashPage /></PageTransition>} />
        <Route path="/sync"     element={<PageTransition><LanSyncPage /></PageTransition>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const theme = useTheme();

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => { pruneTrash(); }, []);
  useEffect(() => {
    if (isDesktopHost()) {
      lanSync.initHost();
      return () => { lanSync.destroyHost(); };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppShell>
            <AnimatedRoutes />
          </AppShell>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
