import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const CONFIG: Record<ToastType, { icon: ReactNode; color: string; tag: string; glow: string }> = {
  success: {
    icon:  <CheckCircle size={12} />,
    color: 'var(--accent)',
    tag:   '[ок]',
    glow:  'var(--accent-glow)',
  },
  error: {
    icon:  <AlertCircle size={12} />,
    color: 'var(--danger)',
    tag:   '[ошибка]',
    glow:  'rgba(255,0,60,0.5)',
  },
  info: {
    icon:  <Info size={12} />,
    color: 'var(--info)',
    tag:   '[инфо]',
    glow:  'rgba(0,229,255,0.5)',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-3 right-3 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const cfg = CONFIG[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 16, scale: 0.97 }}
                animate={{ opacity: 1, x: 0,  scale: 1    }}
                exit={{    opacity: 0, x: 16, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-auto flex items-center gap-2 px-3 py-2 font-mono text-xs"
                style={{
                  background: 'rgba(5, 8, 5, 0.96)',
                  border: `1px solid ${cfg.color}`,
                  boxShadow: `0 0 0 1px ${cfg.color}, 0 0 18px ${cfg.glow}`,
                  color: 'var(--text-primary)',
                }}
              >
                <span style={{ color: cfg.color, textShadow: `0 0 6px ${cfg.glow}` }}>{cfg.icon}</span>
                <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.tag}</span>
                <span className="flex-1 leading-tight">{t.message}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="flex-shrink-0"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={11} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
