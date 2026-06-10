import { AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MONO, SANS, HAND } from '../fonts';
import { MATRIX, CLAUDE, CLAY, PALETTES, PRIO, type Palette } from '../themes';

const KEYS = [0, 28, 35, 64, 71, 100];

function lerp(frame: number, pick: (p: Palette) => string): string {
  const seq = [MATRIX, MATRIX, CLAUDE, CLAUDE, CLAY, CLAY].map(pick);
  return interpolateColors(frame, KEYS, seq);
}

/** Сцена: переключение тем. Один мини-UI трижды перекрашивается. */
export const Themes = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const seg = frame < 31 ? 0 : frame < 67 ? 1 : 2;
  const active = PALETTES[seg];
  const soft = seg > 0;

  const bg      = lerp(frame, (p) => p.bg);
  const surface = lerp(frame, (p) => p.surface);
  const card    = lerp(frame, (p) => p.card);
  const border  = lerp(frame, (p) => p.border);
  const text    = lerp(frame, (p) => p.text);
  const muted   = lerp(frame, (p) => p.textMuted);
  const accent  = lerp(frame, (p) => p.accent);

  const radius = interpolate(frame, [26, 36], [0, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const enter = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ background: bg, alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      <div
        style={{
          fontFamily: soft ? SANS : MONO,
          fontSize: 58, fontWeight: 700, color: text,
          textShadow: soft ? 'none' : `0 0 22px ${MATRIX.glow}`,
          opacity: enter, transform: `translateY(${(1 - enter) * 30}px)`,
        }}
      >
        <span style={{ color: accent }}>›</span> Твоя тема
      </div>

      {/* Мини-UI: окно с фрагментом доски и листка */}
      <div
        style={{
          width: 1080, opacity: enter,
          background: surface, border: `1px solid ${border}`, borderRadius: radius,
          overflow: 'hidden', boxShadow: '0 20px 70px rgba(0,0,0,0.35)',
        }}
      >
        {/* титлбар */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: `1px solid ${border}` }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />
          <span style={{ fontFamily: soft ? SANS : MONO, fontSize: 18, color: muted }}>
            {soft ? 'Kairo' : '[kairo@matrix:~]$'}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO, fontSize: 16, color: accent, fontWeight: 700, letterSpacing: '0.08em' }}>
            {active.name}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 26, padding: 26 }}>
          {/* карточки доски */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ t: 'деплой v2.1', p: PRIO.A }, { t: 'созвон 15:00', p: PRIO.C }].map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 16px', background: card,
                  border: `1px solid ${border}`, borderLeft: `4px solid ${c.p}`,
                  borderRadius: radius * 0.8,
                  fontFamily: soft ? SANS : MONO, fontSize: 21, color: text,
                }}
              >
                {c.t}
              </div>
            ))}
            <div style={{ fontFamily: soft ? SANS : MONO, fontSize: 15, color: muted, paddingLeft: 4 }}>доска</div>
          </div>

          {/* листок */}
          <div style={{ flex: 1, background: card, border: `1px solid ${border}`, borderRadius: radius * 0.8, padding: '14px 20px' }}>
            {['позвонить маме', 'спортзал 18:00'].map((t, i) => (
              <div key={i} style={{ fontFamily: HAND, fontSize: 30, color: i === 0 ? muted : text, textDecoration: i === 0 ? 'line-through' : 'none', lineHeight: 1.7 }}>
                {t}
              </div>
            ))}
            <div style={{ fontFamily: soft ? SANS : MONO, fontSize: 15, color: muted, marginTop: 6 }}>листок</div>
          </div>

          {/* мини-календарь */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 54px)', gap: 8, alignContent: 'start' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 54, height: 46, background: card,
                  border: `1px solid ${i === 4 ? accent : border}`, borderRadius: radius * 0.6,
                  fontFamily: soft ? SANS : MONO, fontSize: 15,
                  color: i === 4 ? accent : muted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {i + 8}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* свотчи */}
      <div style={{ display: 'flex', gap: 22 }}>
        {PALETTES.map((p, i) => {
          const isActive = i === seg;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px',
                border: `2px solid ${isActive ? accent : border}`,
                borderRadius: soft ? 999 : 0,
                transform: `scale(${isActive ? 1.1 : 1})`,
                opacity: isActive ? 1 : 0.55,
              }}
            >
              <span style={{ width: 18, height: 18, background: p.bg, border: '1px solid rgba(128,128,128,0.5)', borderRadius: soft ? 9 : 0 }} />
              <span style={{ width: 18, height: 18, background: p.accent, borderRadius: soft ? 9 : 0 }} />
              <span style={{ fontFamily: soft ? SANS : MONO, fontSize: 17, color: text, fontWeight: 600 }}>{p.name}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
