import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number | string;
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop отдельно — не влияет на позицию панели */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />

          {isMobile ? (
            /*
             * fixed bottom-0 left-0 right-0 — НЕ flex-ребёнок с items-end.
             * При появлении/закрытии клавиатуры viewport меняет высоту,
             * но bottom:0 всегда «над клавиатурой» без прыжка анимации.
             */
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[51] flex flex-col"
              style={{
                maxHeight: '90dvh',
                background: 'var(--overlay-bg)',
                border: '1px solid var(--accent)',
                boxShadow: '0 0 0 1px var(--accent), 0 0 32px var(--accent-glow), 0 8px 40px rgba(0,0,0,0.8)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="titlebar">
                <span className="neon-text">●</span>
                <span className="flex-1 truncate">{title ?? 'dialog'}</span>
                <button className="titlebar-btn modal-close-btn" onClick={onClose} title="Close">✕</button>
              </div>
              <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
                {children}
              </div>
            </motion.div>
          ) : (
            /* Desktop: центрированный диалог */
            <motion.div
              className="fixed inset-0 z-[51] flex items-center justify-center"
              onClick={onClose}
            >
              <motion.div
                className="relative flex flex-col"
                style={{
                  width,
                  maxWidth: 'calc(100vw - 32px)',
                  maxHeight: 'calc(100vh - 80px)',
                  background: 'var(--overlay-bg)',
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
                  <button className="titlebar-btn modal-close-btn" onClick={onClose} title="Close">✕</button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {children}
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
