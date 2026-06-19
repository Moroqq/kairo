import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text/foreground color (also tints the border). */
  color?: string;
  /** Background fill. @default "var(--bg-elevated)" */
  bg?: string;
}

/** Compact status / category pill. */
export function Badge(props: BadgeProps): JSX.Element;
