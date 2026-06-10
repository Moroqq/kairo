import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FeatureText } from '../components/FeatureText';
import { HAND, MONO } from '../fonts';
import { CLAY, PRIO } from '../themes';

const P = CLAY;
const LINE_H = 76;

const LINES = [
  { t: 'позвонить маме', p: PRIO.B, strike: 60 },
  { t: 'спортзал 18:00', p: PRIO.C, strike: null },
  { t: 'код-ревью PR #42', p: PRIO.A, strike: 74 },
  { t: 'купить кофе в зёрнах', p: PRIO.C, strike: null },
  { t: 'полить кактус', p: PRIO.D, strike: 88 },
];

/** Сцена: листок дня. Рукописные строки появляются и зачёркиваются. */
export const Sheet = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: P.bg, flexDirection: 'row', alignItems: 'center', padding: '0 130px', gap: 100 }}>
      <FeatureText
        title="Листок дня"
        sub="записывай как в блокноте — и зачёркивай сделанное"
        palette={P}
      />

      {/* Бумага */}
      <div
        style={{
          width: 760,
          background: P.card,
          border: `1px solid ${P.border}`,
          borderRadius: 14,
          boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 26px 8px 96px', borderBottom: `2px solid ${P.border}` }}>
          <span style={{ fontFamily: HAND, fontSize: 46, fontWeight: 600, color: P.text }}>
            четверг, 11 июня
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            padding: '8px 26px 26px 96px',
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_H - 1}px, ${P.borderSubtle} ${LINE_H - 1}px, ${P.borderSubtle} ${LINE_H}px)`,
          }}
        >
          {/* линия полей */}
          <div style={{ position: 'absolute', left: 74, top: 0, bottom: 0, width: 2, background: P.danger, opacity: 0.35 }} />

          {LINES.map((line, i) => {
            const lineIn = spring({ frame: frame - 10 - i * 7, fps, config: { damping: 14, mass: 0.5 } });
            const strike = line.strike === null
              ? 0
              : interpolate(frame, [line.strike, line.strike + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ position: 'relative', height: LINE_H, display: 'flex', alignItems: 'center', gap: 16, opacity: lineIn, transform: `translateX(${(1 - lineIn) * 30}px)` }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: line.p, opacity: strike > 0.5 ? 0.35 : 0.85, flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: HAND,
                    fontSize: 38,
                    color: strike > 0.5 ? P.textDim : P.text,
                    transition: 'color 150ms',
                    position: 'relative',
                  }}
                >
                  {line.t}
                  {/* карандашная линия */}
                  <span
                    style={{
                      position: 'absolute', left: -4, right: -8, top: '54%', height: 3,
                      background: P.textMuted, borderRadius: 2,
                      transform: `scaleX(${strike})`, transformOrigin: 'left center',
                    }}
                  />
                </span>
              </div>
            );
          })}

          {/* строка-инпут */}
          <div style={{ height: LINE_H, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 24, color: P.textDim }}>+</span>
            <span style={{ fontFamily: HAND, fontSize: 34, color: P.textDim }}>
              дописать…
              <span style={{ opacity: Math.floor(frame / 16) % 2 === 0 ? 1 : 0, color: P.accent }}> ▏</span>
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
