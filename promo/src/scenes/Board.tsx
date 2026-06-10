import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FeatureText } from '../components/FeatureText';
import { MONO } from '../fonts';
import { MATRIX, PRIO } from '../themes';

const P = MATRIX;

const COLUMNS = [
  { title: 'ОЧЕРЕДЬ',   cards: [{ t: 'деплой v2.1', p: PRIO.A }, { t: 'обновить доки', p: PRIO.C }] },
  { title: 'АКТИВНЫЕ',  cards: [{ t: 'фикс прайсинга', p: PRIO.B }, { t: 'созвон 15:00', p: PRIO.C }] },
  { title: 'БЛОК',      cards: [{ t: 'письмо клиенту', p: PRIO.D }] },
  { title: 'ВЫПОЛНЕНО', cards: [{ t: 'релиз-ноты', p: PRIO.C }] },
];

const COL_W = 252;
const GAP = 18;
const FLY_START = 58;
const FLY_END = 82;

/** Сцена: канбан-доска. Колонки въезжают, карточка перелетает в «ВЫПОЛНЕНО». */
export const Board = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fly = spring({ frame: frame - FLY_START, fps, config: { damping: 15, mass: 0.8 } });
  const flying = frame >= FLY_START;
  const landed = frame >= FLY_END;
  // Перелёт из колонки 0 (слот 0) в колонку 3 (под существующей карточкой)
  const flyX = interpolate(fly, [0, 1], [0, (COL_W + GAP) * 3]);
  const flyY = interpolate(fly, [0, 1], [0, 64]);
  const flyRot = Math.sin(fly * Math.PI) * 5;

  return (
    <AbsoluteFill style={{ background: P.bg, flexDirection: 'row', alignItems: 'center', padding: '0 110px', gap: 90 }}>
      <FeatureText
        title="Канбан-доска"
        sub="перетаскивай задачи между статусами — на компьютере и на телефоне"
        palette={P}
      />

      {/* Доска */}
      <div style={{ display: 'flex', gap: GAP, position: 'relative' }}>
        {COLUMNS.map((col, ci) => {
          const colIn = spring({ frame: frame - 6 - ci * 5, fps, config: { damping: 14, mass: 0.6 } });
          const isDone = ci === 3;
          const doneGlow = landed && isDone;
          return (
            <div
              key={ci}
              style={{
                width: COL_W,
                opacity: colIn,
                transform: `translateY(${(1 - colIn) * 60}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px',
                  background: P.surface,
                  border: `1px solid ${doneGlow ? P.accent : P.border}`,
                  boxShadow: doneGlow ? `0 0 24px ${P.glow}` : 'none',
                  fontFamily: MONO, fontSize: 17, fontWeight: 700, letterSpacing: '0.1em',
                  color: P.accent, textShadow: `0 0 10px ${P.glow}`,
                }}
              >
                <span>▸ {col.title}</span>
                <span style={{ color: P.textMuted, fontWeight: 400 }}>
                  [{String(col.cards.length + (isDone && landed ? 1 : 0)).padStart(2, '0')}]
                </span>
              </div>
              <div
                style={{
                  minHeight: 360, padding: 10,
                  display: 'flex', flexDirection: 'column', gap: 10,
                  background: 'rgba(0,0,0,0.4)', border: `1px solid ${P.border}`, borderTop: 'none',
                }}
              >
                {col.cards.map((card, idx) => {
                  const cardIn = spring({ frame: frame - 22 - (ci * 2 + idx) * 4, fps, config: { damping: 13, mass: 0.5 } });
                  const isFlyingSource = ci === 0 && idx === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 12px',
                        background: P.card,
                        border: `1px solid ${P.border}`,
                        borderLeft: `4px solid ${card.p}`,
                        fontFamily: MONO, fontSize: 17, color: P.text,
                        opacity: isFlyingSource && flying ? 0 : cardIn,
                        transform: `translateY(${(1 - cardIn) * 26}px)`,
                      }}
                    >
                      {card.t}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Летящая карточка */}
        {flying && (
          <div
            style={{
              position: 'absolute',
              left: 10, top: 56,
              width: COL_W - 20,
              padding: '14px 12px',
              background: P.card,
              border: `1px solid ${landed ? P.accent : P.border}`,
              borderLeft: `4px solid ${PRIO.A}`,
              boxShadow: landed ? `0 0 20px ${P.glow}` : '0 12px 30px rgba(0,0,0,0.6)',
              fontFamily: MONO, fontSize: 17,
              color: landed ? P.textMuted : P.text,
              textDecoration: landed ? 'line-through' : 'none',
              transform: `translate(${flyX}px, ${flyY}px) rotate(${flyRot}deg)`,
              zIndex: 5,
            }}
          >
            деплой v2.1
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
