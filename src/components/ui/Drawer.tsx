import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, title, children, width = 400 }: DrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-3 right-3 bottom-3 z-40 flex flex-col"
            style={{
              width,
              background: 'var(--overlay-bg)',
              border: '1px solid var(--accent)',
              boxShadow: '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow), -8px 0 32px rgba(0,0,0,0.8)',
            }}
            initial={{ x: width + 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: width + 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="titlebar">
              <span className="neon-text">●</span>
              <span className="flex-1 truncate">{title ?? 'details'}</span>
              <button className="titlebar-btn" onClick={onClose} title="Close">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
