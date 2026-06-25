import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, disabled, children, className = '', style, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-1.5 font-mono select-none transition-[border-color,box-shadow,background,color,transform,opacity] duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96]';

    const sizes: Record<string, string> = {
      sm: 'h-7  px-3 text-xs',
      md: 'h-8  px-4 text-xs',
      lg: 'h-10 px-6 text-sm',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'var(--accent-dim)',
        color: 'var(--accent)',
        border: '1px solid var(--accent)',
        textShadow: '0 0 6px var(--accent-glow)',
        boxShadow: '0 0 0 1px var(--accent), 0 0 12px var(--accent-glow)',
        letterSpacing: 1,
      },
      secondary: {
        background: 'transparent',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        letterSpacing: 0.5,
      },
      ghost: {
        background: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid transparent',
      },
      danger: {
        background: 'transparent',
        color: 'var(--danger)',
        border: '1px solid var(--border-danger)',
        textShadow: '0 0 6px rgba(255,0,60,0.5)',
        letterSpacing: 0.5,
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`btn-flat ${base} ${sizes[size]} ${className}`}
        data-variant={variant}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading ? (
          <span className="dot-pulse flex gap-1">
            <span /><span /><span />
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
