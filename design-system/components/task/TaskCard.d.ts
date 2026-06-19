import React from 'react';

export interface TaskCardProps {
  /** Task title (primary line). */
  title: string;
  /** Optional category chip text. */
  category?: string;
  /** Deadline label, e.g. "сегодня 18:00". */
  deadline?: string;
  /** Drives deadline color. @default "none" */
  deadlineState?: 'none' | 'urgent' | 'overdue';
  /** Comment count; hidden when 0. @default 0 */
  comments?: number;
  /** Created-relative label, e.g. "2ч назад". */
  createdLabel?: string;
  /** Adds the red deadline pulse to the whole card. @default false */
  urgent?: boolean;
  onClick?: () => void;
  /** Shows the advance (next-stage) button when provided. */
  onAdvance?: () => void;
  /** Glyph/icon for the advance button. @default "›" */
  advanceIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Draggable-style task card for board columns and lists.
 * @startingPoint section="Task" subtitle="Board task card with deadline + advance" viewport="320x140"
 */
export function TaskCard(props: TaskCardProps): JSX.Element;
