import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`h-9 px-3 rounded-lg text-sm outline-none transition-all ${className}`}
        style={{
          background:  'var(--bg-card)',
          border:      `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          color:       'var(--text-primary)',
          ...style,
        }}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', style, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all ${className}`}
        style={{
          background: 'var(--bg-card)',
          border:     `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          color:      'var(--text-primary)',
          ...style,
        }}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
