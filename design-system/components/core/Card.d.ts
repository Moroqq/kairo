import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** When set, renders a terminal title bar above the body. */
  title?: string;
  /** Recessed/sunken surface instead of a raised card. @default false */
  well?: boolean;
  /** Apply hover glow (for clickable cards). @default false */
  interactive?: boolean;
  /** Shows a ✕ button in the title bar. */
  onClose?: () => void;
  /** Override padding/layout of the body wrapper. */
  bodyStyle?: React.CSSProperties;
}

/**
 * Flat terminal surface, optionally with a title bar.
 * @startingPoint section="Core" subtitle="Bordered surface with optional terminal title bar" viewport="700x200"
 */
export function Card(props: CardProps): JSX.Element;
