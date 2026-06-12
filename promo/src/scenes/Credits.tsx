import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { LogoObserv } from '../components/LogoObserv';
import { SANS } from '../fonts';

const BG = '#141413';
const CREAM = '#FAF9F5';

/** Финальные титры: знак Observ Studio на тёмном фоне. */
export const Credits = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame: frame - 4, fps, config: { damping: 12, mass: 0.7 } });
  const nameOpacity = interpolate(frame, [16, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Слоган: слова появляются по одному
  const TAG_WORDS = ['нам', 'можно', 'такое'];
  const WORD_START = 32;  // кадр появления первого слова
  const WORD_STEP  = 9;   // интервал между словами

  return (
    <AbsoluteFill style={{ background: BG, alignItems: 'center', justifyContent: 'center', gap: 36 }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(250,249,245,0.04) 0%, transparent 60%)' }} />

      <div style={{ transform: `scale(${logoIn})`, opacity: logoIn, zIndex: 1 }}>
        <LogoObserv width={340} color={CREAM} />
      </div>

      <div
        style={{
          fontFamily: SANS, fontSize: 44, fontWeight: 700, letterSpacing: '0.22em',
          color: CREAM, zIndex: 1, opacity: nameOpacity, textTransform: 'uppercase',
        }}
      >
        Observ Studio
      </div>

      <div style={{ display: 'flex', gap: 14, zIndex: 1 }}>
        {TAG_WORDS.map((word, i) => {
          const start = WORD_START + i * WORD_STEP;
          const wordIn = spring({ frame: frame - start, fps, config: { damping: 13, mass: 0.5 } });
          return (
            <span
              key={word}
              style={{
                fontFamily: SANS, fontSize: 30, fontWeight: 600,
                color: CREAM, letterSpacing: '0.04em',
                opacity: wordIn * 0.85,
                transform: `translateY(${(1 - wordIn) * 18}px)`,
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
