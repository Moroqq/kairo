import { forwardRef, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, disabled, children, className = '', style, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed select-none';

    const variants: Record<string, string> = {
      primary:   'text-black font-semibold',
      secondary: 'border',
      ghost:     'hover:opacity-80',
      danger:    'border',
    };

    const sizes: Record<string, string> = {
      sm: 'h-7  px-3  text-xs',
      md: 'h-9  px-4  text-sm',
      lg: 'h-11 px-6  text-sm',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary:   { background: 'var(--accent)', color: '#000' },
      secondary: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' },
      ghost:     { background: 'transparent', color: 'var(--text-secondary)' },
      danger:    { background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
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
