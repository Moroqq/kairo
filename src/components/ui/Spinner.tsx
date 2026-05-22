interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 18, color }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'var(--accent)'}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="dot-pulse flex items-center gap-1">
        <span />
        <span />
        <span />
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Parsing…</span>
    </div>
  );
}
