import { describe, expect, it } from 'vitest';
import {
  createGlassTheme,
  createSheeshmahalConfig,
  defaultGlassMaterialConfig,
  getGlassMaterialConfig,
} from '../index.js';

describe('glass theme utilities', () => {
  it('merges overrides with defaults', () => {
    const theme = createGlassTheme({
      backgroundColor: '#111',
      glassLevels: {
        light: {
          ...defaultGlassMaterialConfig,
          transmission: 0.9,
        },
      },
    });

    expect(theme.backgroundColor).toBe('#111');
    expect(theme.glassLevels.light.transmission).toBe(0.9);
    expect(theme.glassLevels.medium.transmission).toBeCloseTo(0.96);
  });

  it('creates sheeshmahal config with animation presets', () => {
    const config = createSheeshmahalConfig();
    expect(config.animationPresets.hover.tension).toBe(320);
    expect(Object.keys(config.animationPresets)).toContain('glass_shimmer');
  });

  it('returns glass material config by level', () => {
    const theme = createGlassTheme();
    const heavy = getGlassMaterialConfig(theme, 'heavy');
    expect(heavy.transmission).toBeGreaterThan(theme.glassLevels.light.transmission);
  });
});
