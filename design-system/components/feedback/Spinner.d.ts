import React from 'react';

export interface SpinnerProps {
  /** @default 18 */
  size?: number;
  /** Stroke color. @default "var(--accent)" */
  color?: string;
  style?: React.CSSProperties;
}

export interface LoadingDotsProps {
  /** Trailing label. @default "разбор…" Pass "" to hide. */
  label?: string;
}

/** Spinning ray loader. */
export function Spinner(props: SpinnerProps): JSX.Element;
/** Three-dot pulse with optional label. */
export function LoadingDots(props: LoadingDotsProps): JSX.Element;
