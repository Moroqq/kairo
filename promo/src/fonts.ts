import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { loadFont as loadHand } from '@remotion/google-fonts/Caveat';

const mono = loadMono('normal', { weights: ['400', '700'], subsets: ['latin', 'cyrillic'] });
const hand = loadHand('normal', { weights: ['400', '600', '700'], subsets: ['latin', 'cyrillic'] });

export const MONO = mono.fontFamily;
export const HAND = hand.fontFamily;
export const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
