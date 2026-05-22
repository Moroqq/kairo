import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  bg?: string;
}

export function Badge({ color, bg, className = '', style, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        color:      color ?? 'var(--text-secondary)',
        background: bg    ?? 'var(--bg-elevated)',
        border:     `1px solid ${color ?? 'var(--border)'}22`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
