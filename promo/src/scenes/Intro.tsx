import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoK } from '../components/LogoK';
import { MONO } from '../fonts';
import { MATRIX } from '../themes';

const TITLE = 'KAIRO';

/** Интро: матричный дождь, [K] печатается, KAIRO разлетается, тэглайн. */
export const Intro = () => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  const logoIn = spring({ frame: frame - 6, fps, config: { damping: 11, mass: 0.7 } });
  const tagOpacity = interpolate(frame, [52, 66], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: MATRIX.bg, alignItems: 'center', justifyContent: 'center' }}>
      {/* Матричный дождь — детерминированные полосы */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = ((i * 397) % 96) / 96; // псевдослучайное 0..1
        const speed = 6 + ((i * 131) % 7);
        const len = 220 + ((i * 211) % 260);
        const y = ((frame * speed + i * 173) % (height + len)) - len;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x * width,
              top: y,
              width: 3,
              height: len,
              background: `linear-gradient(to bottom, transparent, ${MATRIX.accent})`,
              opacity: 0.14,
            }}
          />
        );
      })}

      {/* Виньетка */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, zIndex: 1 }}>
        <div style={{ transform: `scale(${logoIn})`, opacity: logoIn }}>
          <LogoK size={220} color={MATRIX.accent} glow={MATRIX.glow} cursor />
        </div>

        {/* KAIRO — буквы со stagger */}
        <div style={{ display: 'flex', gap: 10 }}>
          {TITLE.split('').map((ch, i) => {
            const s = spring({ frame: frame - 28 - i * 3, fps, config: { damping: 13, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: MONO,
                  fontSize: 86,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: MATRIX.text,
                  textShadow: `0 0 18px ${MATRIX.glow}`,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 30}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>

        <div style={{ fontFamily: MONO, fontSize: 30, color: MATRIX.textMuted, opacity: tagOpacity, letterSpacing: '0.08em' }}>
          <span style={{ color: MATRIX.accent }}>$</span> задачи под контролем
        </div>
      </div>
    </AbsoluteFill>
  );
};
