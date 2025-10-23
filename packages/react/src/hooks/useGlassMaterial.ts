import { useMemo } from 'react';
import type { MeshPhysicalMaterialParameters } from 'three';
import { getGlassMaterialConfig, type GlassLevel } from '../../../core/src/index.js';
import { useSMCanvas } from '../canvas/CanvasProvider.js';

export interface UseGlassMaterialOptions {
  glassLevel?: GlassLevel;
  accentColor?: string;
}

export const useGlassMaterial = (
  options: UseGlassMaterialOptions = {}
): MeshPhysicalMaterialParameters => {
  const { theme } = useSMCanvas();
  const { glassLevel = 'medium', accentColor } = options;

  const config = useMemo(
    () => getGlassMaterialConfig(theme, glassLevel),
    [theme, glassLevel]
  );

  return useMemo(() => {
    return {
      color: accentColor ?? config.color,
      transmission: config.transmission,
      thickness: config.thickness,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity,
      ior: config.ior,
      attenuationColor: config.attenuationColor,
      attenuationDistance: config.attenuationDistance,
      transparent: true,
      metalness: 0,
      reflectivity: 1,
    } satisfies MeshPhysicalMaterialParameters;
  }, [accentColor, config]);
};
