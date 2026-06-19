import React from 'react';

export type Priority = 'A' | 'B' | 'C' | 'D';

export interface PriorityBadgeProps {
  /** A=critical, B=high, C=normal, D=low. @default "C" */
  priority?: Priority;
  /** Append the Russian label after the letter. @default true */
  showLabel?: boolean;
  style?: React.CSSProperties;
}

/** Priority pill (letter grade + color). */
export function PriorityBadge(props: PriorityBadgeProps): JSX.Element;
/** Glowing left-edge stripe for cards/rows (needs a positioned parent). */
export function PriorityStripe(props: { priority?: Priority }): JSX.Element;
