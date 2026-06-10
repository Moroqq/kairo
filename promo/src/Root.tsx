import { Composition } from 'remotion';
import { KairoPromo, PROMO_DURATION } from './KairoPromo';

export const RemotionRoot = () => (
  <Composition
    id="KairoPromo"
    component={KairoPromo}
    durationInFrames={PROMO_DURATION}
    fps={30}
    width={1920}
    height={1080}
  />
);
