import { useMemo } from 'react';
import type { SpringConfig } from '@react-spring/core';
import { type AnimationPresetName } from '../../../core/src/index.js';
import { useSMCanvas } from '../canvas/CanvasProvider.js';

export interface SpringPresetResult {
  config: SpringConfig;
  immediate: boolean;
}

export const useSpringPreset = (
  name: AnimationPresetName,
  overrides?: SpringConfig
): SpringPresetResult => {
  const { animationPresets, reducedMotion } = useSMCanvas();

  return useMemo(() => {
    const preset = animationPresets[name];
    const config: SpringConfig = {
      ...preset,
      ...(overrides ?? {}),
    };

    return {
      config,
      immediate: reducedMotion && name !== 'press',
    } satisfies SpringPresetResult;
  }, [animationPresets, name, overrides, reducedMotion]);
};
