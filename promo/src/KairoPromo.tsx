import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Intro } from './scenes/Intro';
import { Board } from './scenes/Board';
import { Calendar } from './scenes/Calendar';
import { Sheet } from './scenes/Sheet';
import { Themes } from './scenes/Themes';
import { Outro } from './scenes/Outro';

const T = 12; // длительность перехода

// Сцены: 87+117+117+117+102+60 = 600; минус 5 переходов по 12 = 540 кадров (18s @ 30fps)
const SCENES = [
  { C: Intro,    d: 87 },
  { C: Board,    d: 117 },
  { C: Calendar, d: 117 },
  { C: Sheet,    d: 117 },
  { C: Themes,   d: 102 },
  { C: Outro,    d: 60 },
];

export const PROMO_DURATION = SCENES.reduce((s, x) => s + x.d, 0) - (SCENES.length - 1) * T;

export const KairoPromo = () => (
  <TransitionSeries>
    {SCENES.map(({ C, d }, i) => [
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={d}>
        <C />
      </TransitionSeries.Sequence>,
      i < SCENES.length - 1 ? (
        <TransitionSeries.Transition
          key={`t${i}`}
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />
      ) : null,
    ])}
  </TransitionSeries>
);
