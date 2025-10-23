import {
  AnimationPresetMap,
  AnimationPresetName,
  GlassLevel,
  GlassTheme,
  createGlassTheme,
} from '../../core/src/index.js';

export const glassTheme = createGlassTheme();

export const animationPresetNames: AnimationPresetName[] = [
  'hover',
  'press',
  'entrance',
  'glass_shimmer',
];

export const animationPresetMap: AnimationPresetMap = {
  hover: { tension: 320, friction: 28, mass: 1 },
  press: { tension: 420, friction: 30, mass: 1.1 },
  entrance: { tension: 260, friction: 24, mass: 0.9 },
  glass_shimmer: { tension: 200, friction: 18, loop: true },
};

export const glassLevels: GlassLevel[] = ['light', 'medium', 'heavy'];

export type { GlassTheme };
