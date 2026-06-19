import React from 'react';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default "success" */
  type?: 'success' | 'error' | 'info';
  /** Optional leading icon (lucide-react node). */
  icon?: React.ReactNode;
  /** Shows a ✕ dismiss button. */
  onClose?: () => void;
}

/** A single notification row. Encodes type via `[ок]` / `[ошибка]` / `[инфо]` tag + glow. */
export function Toast(props: ToastProps): JSX.Element;
