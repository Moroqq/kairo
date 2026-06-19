import React from 'react';

export interface ModalProps {
  /** Controls visibility. */
  open: boolean;
  /** Called on Escape, scrim click, or ✕. */
  onClose?: () => void;
  /** Title-bar text. @default "dialog" */
  title?: string;
  /** Panel width in px (or any CSS size). @default 520 */
  width?: number | string;
  children?: React.ReactNode;
}

/** Centered modal dialog with terminal chrome and a neon-bordered panel. */
export function Modal(props: ModalProps): JSX.Element | null;
