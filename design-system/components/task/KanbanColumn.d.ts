import React from 'react';

export interface KanbanColumnProps {
  /** Column heading (rendered uppercase). */
  title: string;
  /** Count shown as `[NN]`. Defaults to the number of children. */
  count?: number;
  /** Highlight as an active drop target. @default false */
  over?: boolean;
  /** Fixed column width in px. @default 280 */
  width?: number;
  /** Stretch to fill (mobile single-column mode). @default false */
  fullWidth?: boolean;
  /** TaskCard nodes. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** A single kanban column: header with count + bordered drop zone. */
export function KanbanColumn(props: KanbanColumnProps): JSX.Element;
