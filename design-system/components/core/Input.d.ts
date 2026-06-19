import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label, rendered with a `›` chevron prompt. */
  label?: string;
  /** Error message — turns the border red and shows an `[error]` line. */
  error?: string;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** @default 3 */
  rows?: number;
}

/** Single-line terminal text field. */
export function Input(props: InputProps): JSX.Element;
/** Multi-line terminal text field. */
export function Textarea(props: TextareaProps): JSX.Element;
