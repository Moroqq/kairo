import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FeatureText } from '../components/FeatureText';
import { SANS, MONO } from '../fonts';
import { CLAUDE, PRIO } from '../themes';

const P = CLAUDE;
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const CELL_W = 128;
const CELL_H = 96;

// Содержимое ячеек: колонки ср(2) и пт(4) — повторы; остальные — случайные пункты
const bars = (r: number, c: number): { color: string; repeat?: boolean }[] => {
  if (c === 2 || c === 4) return [{ color: P.accent, repeat: true }];
  if ((r * 7 + c) % 5 === 0) return [{ color: PRIO.B }, { color: PRIO.C }];
  if ((r * 7 + c) % 7 === 3) return [{ color: PRIO.C }];
  return [];
};

/** Сцена: календарь-план. Сетка собирается каскадом, повторы вспыхивают на ср/пт. */
export const Calendar = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: P.bg, flexDirection: 'row', alignItems: 'center', padding: '0 110px', gap: 90 }}>
      {/* Календарь слева */}
      <div
        style={{
          background: P.surface,
          border: `1px solid ${P.border}`,
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
          padding: 22,
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 26, fontWeight: 700, color: P.text, textAlign: 'center', marginBottom: 14 }}>
          ‹ &nbsp;июнь 2026&nbsp; ›
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${CELL_W}px)`, gap: 6 }}>
          {WEEKDAYS.map((wd) => (
            <div key={wd} style={{ fontFamily: SANS, fontSize: 16, color: P.textMuted, textAlign: 'center', textTransform: 'uppercase' }}>
              {wd}
            </div>
          ))}
          {Array.from({ length: 28 }).map((_, i) => {
            const r = Math.floor(i / 7);
            const c = i % 7;
            const cellIn = spring({ frame: frame - 8 - (r + c) * 2, fps, config: { damping: 14, mass: 0.5 } });
            const isToday = r === 1 && c === 2;
            const cellBars = bars(r, c);
            return (
              <div
                key={i}
                style={{
                  width: CELL_W, height: CELL_H,
                  background: P.card,
                  border: `2px solid ${isToday ? P.accent : P.borderSubtle}`,
                  borderRadius: 10,
                  padding: '6px 8px',
                  opacity: cellIn,
                  transform: `scale(${0.8 + cellIn * 0.2})`,
                  boxShadow: isToday ? `0 0 0 4px ${P.accentDim}` : 'none',
                }}
              >
                <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: isToday ? 700 : 400, color: isToday ? P.accent : P.text }}>
                  {i + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                  {cellBars.map((b, bi) => {
                    const barIn = interpolate(
                      frame, [46 + (r * 7 + c) * 1.2 + bi * 4, 56 + (r * 7 + c) * 1.2 + bi * 4], [0, 1],
                      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                    );
                    return (
                      <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: barIn }}>
                        <div style={{ flex: 1, height: 7, background: b.color, opacity: 0.65, borderRadius: 4, transform: `scaleX(${barIn})`, transformOrigin: 'left' }} />
                        {b.repeat && (
                          <span style={{ fontFamily: MONO, fontSize: 12, color: P.accent, lineHeight: 1 }}>↻</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FeatureText
        title="План на каждый день"
        sub="расписания по дням недели: задал «каждую среду» — появляется само ↻"
        palette={P}
      />
    </AbsoluteFill>
  );
};
