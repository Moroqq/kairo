import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number | string;
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }} />
          <motion.div
            className="relative z-10 flex flex-col"
            style={{
              width,
              maxHeight: 'calc(100vh - 80px)',
              background: 'rgba(8, 12, 8, 0.96)',
              border: '1px solid var(--accent)',
              boxShadow: '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow), 0 8px 40px rgba(0,0,0,0.8)',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="titlebar">
              <span className="neon-text">●</span>
              <span className="flex-1 truncate">{title ?? 'dialog'}</span>
              <button className="titlebar-btn" onClick={onClose} title="Close">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
