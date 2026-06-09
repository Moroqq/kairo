import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> {label}
        </label>
      )}
      <input
        ref={ref}
        className={`h-7 px-2 text-xs outline-none font-mono ${className}`}
        style={{
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
          ...style,
        }}
        {...props}
      />
      {error && (
        <p className="text-xs font-mono" style={{ color: 'var(--danger)', textShadow: '0 0 6px rgba(255,0,60,0.5)' }}>
          [error] {error}
        </p>
      )}
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
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>›</span> {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`px-2 py-1.5 text-xs outline-none resize-none font-mono ${className}`}
        style={{
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
          ...style,
        }}
        {...props}
      />
      {error && (
        <p className="text-xs font-mono" style={{ color: 'var(--danger)' }}>[error] {error}</p>
      )}
    </div>
  )
);
Textarea.displayName = 'Textarea';
