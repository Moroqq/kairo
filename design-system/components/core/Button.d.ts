import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. `primary` is the glowing accent CTA. @default "secondary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Replaces label with an animated dot-pulse and disables the button. */
  loading?: boolean;
  /** Leading icon node (pass a lucide-react icon, e.g. `<Plus size={12} />`). */
  icon?: React.ReactNode;
}

/**
 * Terminal command button — flat with a neon glow on hover/focus.
 * @startingPoint section="Core" subtitle="Primary / secondary / ghost / danger buttons" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
