import { useCurrentFrame } from 'remotion';
import { MONO } from '../fonts';

interface Props {
  size: number;           // высота буквы, px
  color: string;
  glow?: string;          // цвет свечения; не задан — без неона
  cursor?: boolean;       // мигающий курсор после ]
  bracketColor?: string;  // цвет скобок (по умолчанию приглушённый color)
}

/** Терминальный логомарк: [K] с опциональным курсором. */
export const LogoK = ({ size, color, glow, cursor, bracketColor }: Props) => {
  const frame = useCurrentFrame();
  const cursorOn = Math.floor(frame / 16) % 2 === 0;

  const bracketStyle: React.CSSProperties = {
    color: bracketColor ?? color,
    opacity: bracketColor ? 1 : 0.45,
    fontWeight: 400,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        fontFamily: MONO,
        fontSize: size,
        lineHeight: 1,
        color,
        textShadow: glow ? `0 0 ${size * 0.18}px ${glow}` : 'none',
        userSelect: 'none',
      }}
    >
      <span style={bracketStyle}>[</span>
      <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>K</span>
      <span style={bracketStyle}>]</span>
      {cursor && (
        <span
          style={{
            display: 'inline-block',
            width: size * 0.26,
            height: size * 0.68,
            marginLeft: size * 0.12,
            background: color,
            opacity: cursorOn ? 1 : 0,
            boxShadow: glow ? `0 0 ${size * 0.12}px ${glow}` : 'none',
          }}
        />
      )}
    </div>
  );
};
