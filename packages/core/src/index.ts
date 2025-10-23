export type GlassLevel = 'light' | 'medium' | 'heavy';

export interface GlassMaterialConfig {
  color: string;
  transmission: number;
  thickness: number;
  roughness: number;
  envMapIntensity: number;
  ior: number;
  attenuationColor: string;
  attenuationDistance: number;
}

export interface GlassTheme {
  backgroundColor: string;
  foregroundColor: string;
  accentColor: string;
  glassLevels: Record<GlassLevel, GlassMaterialConfig>;
}

export interface AnimationPresetConfig {
  tension: number;
  friction: number;
  mass?: number;
  clamp?: boolean;
  loop?: boolean;
}

export type AnimationPresetName =
  | 'hover'
  | 'press'
  | 'entrance'
  | 'glass_shimmer';

export type AnimationPresetMap = Record<AnimationPresetName, AnimationPresetConfig>;

export interface SheeshmahalConfig {
  theme: GlassTheme;
  animationPresets: AnimationPresetMap;
}

export const defaultGlassMaterialConfig: GlassMaterialConfig = {
  color: '#b1d6ff',
  transmission: 0.95,
  thickness: 0.4,
  roughness: 0.05,
  envMapIntensity: 1.2,
  ior: 1.45,
  attenuationColor: '#a7e1ff',
  attenuationDistance: 2.5,
};

export const createGlassTheme = (overrides: Partial<GlassTheme> = {}): GlassTheme => {
  const baseLevels: Record<GlassLevel, GlassMaterialConfig> = {
    light: {
      ...defaultGlassMaterialConfig,
      transmission: 0.92,
      roughness: 0.08,
    },
    medium: {
      ...defaultGlassMaterialConfig,
      transmission: 0.96,
      roughness: 0.06,
      envMapIntensity: 1.5,
    },
    heavy: {
      ...defaultGlassMaterialConfig,
      transmission: 0.98,
      roughness: 0.04,
      envMapIntensity: 1.8,
    },
  };

  return {
    backgroundColor: '#030712',
    foregroundColor: '#f8fafc',
    accentColor: '#60a5fa',
    glassLevels: baseLevels,
    ...overrides,
    glassLevels: {
      ...baseLevels,
      ...(overrides.glassLevels ?? {}),
    },
  };
};

export const createSheeshmahalConfig = (
  config: Partial<SheeshmahalConfig> = {}
): SheeshmahalConfig => {
  const theme = createGlassTheme(config.theme);
  const animationPresets: AnimationPresetMap = {
    hover: { tension: 320, friction: 28, mass: 1 },
    press: { tension: 420, friction: 30, mass: 1.1 },
    entrance: { tension: 260, friction: 24, mass: 0.9 },
    glass_shimmer: { tension: 200, friction: 18, loop: true },
    ...(config.animationPresets ?? {}),
  };

  return {
    theme,
    animationPresets,
  };
};

export const getGlassMaterialConfig = (
  theme: GlassTheme,
  level: GlassLevel = 'medium'
): GlassMaterialConfig => {
  return theme.glassLevels[level] ?? defaultGlassMaterialConfig;
};
