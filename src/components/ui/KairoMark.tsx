interface Props {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function KairoMark({ size = 56, className, style }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-label="Kairo"
    >
      <defs>
        <linearGradient id="kairo-mark-grad" x1="18" y1="15" x2="74" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5BFFAA" />
          <stop offset="45%" stopColor="#00FF41" />
          <stop offset="100%" stopColor="#00B82E" />
        </linearGradient>
      </defs>
      {/* Left vertical bar */}
      <polygon points="18,15 30,15 30,85 18,85" fill="url(#kairo-mark-grad)" />
      {/* Upper arm */}
      <polygon points="34,46 34,35 74,15 74,28 46,46" fill="url(#kairo-mark-grad)" />
      {/* Lower arm */}
      <polygon points="46,54 74,72 74,85 34,65 34,54" fill="url(#kairo-mark-grad)" />
    </svg>
  );
}
