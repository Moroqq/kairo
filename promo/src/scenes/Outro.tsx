import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoK } from '../components/LogoK';
import { SANS } from '../fonts';

const ACCENT = '#D97757';
const CREAM = '#FAF9F5';

/** Финал: большой [K] на глиняном фоне, имя и список фич. */
export const Outro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame: frame - 3, fps, config: { damping: 11, mass: 0.7 } });
  const nameIn = spring({ frame: frame - 14, fps, config: { damping: 13, mass: 0.6 } });
  const subOpacity = interpolate(frame, [26, 38], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: ACCENT, alignItems: 'center', justifyContent: 'center', gap: 30 }}>
      {/* лёгкая виньетка для глубины */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)' }} />

      <div style={{ transform: `scale(${logoIn})`, opacity: logoIn, zIndex: 1 }}>
        <LogoK size={200} color={CREAM} bracketColor="rgba(250,249,245,0.45)" cursor />
      </div>

      <div
        style={{
          fontFamily: SANS, fontSize: 92, fontWeight: 800, letterSpacing: '0.06em',
          color: CREAM, zIndex: 1,
          opacity: nameIn, transform: `translateY(${(1 - nameIn) * 36}px)`,
        }}
      >
        KAIRO
      </div>

      <div style={{ fontFamily: SANS, fontSize: 32, color: 'rgba(250,249,245,0.85)', opacity: subOpacity, zIndex: 1 }}>
        доска · план · листок · темы
      </div>
    </AbsoluteFill>
  );
};
