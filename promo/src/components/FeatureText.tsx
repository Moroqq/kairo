import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MONO, SANS } from '../fonts';
import type { Palette } from '../themes';

interface Props {
  title: string;
  sub: string;
  palette: Palette;
  delay?: number;
}

/** Текстовый блок фичи: заголовок + подзаголовок, въезжают со spring. */
export const FeatureText = ({ title, sub, palette, delay = 8 }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });
  const subOpacity = interpolate(frame, [delay + 10, delay + 22], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const font = palette.soft ? SANS : MONO;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 560 }}>
      <div
        style={{
          fontFamily: font,
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.1,
          color: palette.text,
          letterSpacing: palette.soft ? '-0.01em' : '0.04em',
          textShadow: palette.soft ? 'none' : `0 0 24px ${palette.glow}`,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 40}px)`,
        }}
      >
        <span style={{ color: palette.accent }}>›</span> {title}
      </div>
      <div
        style={{
          fontFamily: font,
          fontSize: 30,
          lineHeight: 1.4,
          color: palette.textMuted,
          opacity: subOpacity,
        }}
      >
        {sub}
      </div>
    </div>
  );
};
