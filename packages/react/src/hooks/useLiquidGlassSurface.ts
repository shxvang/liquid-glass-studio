import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CanvasTexture,
  Color,
  DataTexture,
  GLSL3,
  LinearFilter,
  MathUtils,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  Vector4,
} from 'three';
import { getGlassMaterialConfig, type GlassLevel, type GlassTheme } from '../../../core/src/index.js';
import { liquidGlassFragmentShader, liquidGlassVertexShader } from '../shaders/liquidGlassSurface.js';

const PX_PER_UNIT = 260;

const clamp01 = (value: number) => MathUtils.clamp(value, 0, 1);

const createFallbackTexture = (color: string): DataTexture => {
  const c = new Color(color).convertLinearToSRGB();
  const data = new Uint8Array([
    Math.round(clamp01(c.r) * 255),
    Math.round(clamp01(c.g) * 255),
    Math.round(clamp01(c.b) * 255),
    255,
  ]);
  const texture = new DataTexture(data, 1, 1, RGBAFormat, UnsignedByteType);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const mixHex = (source: string, target: string, factor: number) => {
  const base = new Color(source);
  const tint = new Color(target);
  base.lerp(tint, clamp01(factor));
  return `#${base.convertLinearToSRGB().getHexString()}`;
};

const createBackgroundTextures = (background: string, accent: string) => {
  if (typeof document === 'undefined') {
    const fallback = createFallbackTexture(background);
    return {
      base: fallback,
      blurred: fallback,
      cleanup: () => {
        fallback.dispose();
      },
    };
  }

  const size = 512;
  const gradientCanvas = document.createElement('canvas');
  gradientCanvas.width = size;
  gradientCanvas.height = size;
  const gradientCtx = gradientCanvas.getContext('2d');
  if (!gradientCtx) {
    const fallback = createFallbackTexture(background);
    return {
      base: fallback,
      blurred: fallback,
      cleanup: () => fallback.dispose(),
    };
  }

  const gradient = gradientCtx.createLinearGradient(0, size, size, 0);
  gradient.addColorStop(0, mixHex(background, '#ffffff', 0.25));
  gradient.addColorStop(1, background);
  gradientCtx.fillStyle = gradient;
  gradientCtx.fillRect(0, 0, size, size);

  gradientCtx.globalAlpha = 0.6;
  gradientCtx.fillStyle = mixHex(accent, '#ffffff', 0.15);
  gradientCtx.beginPath();
  gradientCtx.ellipse(size * 0.65, size * 0.32, size * 0.38, size * 0.48, Math.PI / 5, 0, Math.PI * 2);
  gradientCtx.fill();
  gradientCtx.globalAlpha = 0.9;
  gradientCtx.fillStyle = accent;
  gradientCtx.beginPath();
  gradientCtx.ellipse(size * 0.28, size * 0.75, size * 0.22, size * 0.18, Math.PI / 12, 0, Math.PI * 2);
  gradientCtx.fill();

  const baseTexture = new CanvasTexture(gradientCanvas);
  baseTexture.colorSpace = SRGBColorSpace;
  baseTexture.minFilter = LinearFilter;
  baseTexture.magFilter = LinearFilter;
  baseTexture.needsUpdate = true;

  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = size;
  blurCanvas.height = size;
  const blurCtx = blurCanvas.getContext('2d');
  if (!blurCtx) {
    baseTexture.dispose();
    const fallback = createFallbackTexture(background);
    return {
      base: fallback,
      blurred: fallback,
      cleanup: () => fallback.dispose(),
    };
  }
  blurCtx.filter = 'blur(42px)';
  blurCtx.drawImage(gradientCanvas, 0, 0, size, size);
  blurCtx.filter = 'none';

  const blurredTexture = new CanvasTexture(blurCanvas);
  blurredTexture.colorSpace = SRGBColorSpace;
  blurredTexture.minFilter = LinearFilter;
  blurredTexture.magFilter = LinearFilter;
  blurredTexture.needsUpdate = true;

  return {
    base: baseTexture,
    blurred: blurredTexture,
    cleanup: () => {
      baseTexture.dispose();
      blurredTexture.dispose();
    },
  };
};

export interface UseLiquidGlassSurfaceOptions {
  width: number;
  height: number;
  radius: number;
  glassLevel: GlassLevel;
  theme: GlassTheme;
}

export interface LiquidGlassSurfaceAPI {
  material: ShaderMaterial;
  setPointer: (uv: { x: number; y: number } | null) => void;
  resolution: { width: number; height: number };
}

export const useLiquidGlassSurface = ({
  width,
  height,
  radius,
  glassLevel,
  theme,
}: UseLiquidGlassSurfaceOptions): LiquidGlassSurfaceAPI => {
  const { gl } = useThree();
  const level = getGlassMaterialConfig(theme, glassLevel);

  const pxWidth = Math.max(120, Math.round(width * PX_PER_UNIT));
  const pxHeight = Math.max(120, Math.round(height * PX_PER_UNIT));
  const pxRadius = Math.min(pxWidth, pxHeight) * radius;
  const resolution = useMemo(() => new Vector2(pxWidth * 1.6, pxHeight * 1.6), [pxHeight, pxWidth]);

  const fallbackTexture = useMemo(() => createFallbackTexture(theme.backgroundColor), [theme.backgroundColor]);

  const uniforms = useMemo(
    () => ({
      u_blurredBg: { value: fallbackTexture },
      u_bg: { value: fallbackTexture },
      u_resolution: { value: resolution.clone() },
      u_dpr: { value: gl.getPixelRatio() },
      u_mouse: { value: new Vector2(0, 0) },
      u_mouseSpring: { value: new Vector2(0, 0) },
      u_mergeRate: { value: 0.08 },
      u_shapeWidth: { value: pxWidth },
      u_shapeHeight: { value: pxHeight },
      u_shapeRadius: { value: pxRadius },
      u_shapeRoundness: { value: 4.6 },
      u_tint: {
        value: new Vector4(
          ...new Color(level.color).convertLinearToSRGB().toArray(),
          MathUtils.clamp(level.transmission * 0.75, 0.45, 0.92),
        ),
      },
      u_refThickness: { value: 14 + level.thickness * 28 },
      u_refFactor: { value: MathUtils.clamp(level.ior, 1.1, 2.4) },
      u_refDispersion: { value: 6 + (1 - level.roughness) * 18 },
      u_refFresnelRange: { value: 32 },
      u_refFresnelFactor: { value: 18 + level.envMapIntensity * 3.2 },
      u_refFresnelHardness: { value: 18 },
      u_glareRange: { value: 38 },
      u_glareConvergence: { value: 40 },
      u_glareOppositeFactor: { value: 48 },
      u_glareFactor: { value: 72 },
      u_glareHardness: { value: 14 },
      u_glareAngle: { value: -0.65 },
      u_showShape1: { value: 0 },
      STEP: { value: 9 },
    }),
    [fallbackTexture, gl, level.color, level.envMapIntensity, level.ior, level.roughness, level.thickness, level.transmission, pxHeight, pxRadius, pxWidth, resolution],
  );

  const material = useMemo(() => {
    const shaderMaterial = new ShaderMaterial({
      uniforms,
      vertexShader: liquidGlassVertexShader,
      fragmentShader: liquidGlassFragmentShader,
      transparent: true,
    });
    shaderMaterial.glslVersion = GLSL3;
    return shaderMaterial;
  }, [uniforms]);

  const pointerTarget = useRef(new Vector2(0, 0));
  const pointerSpring = useRef(new Vector2(0, 0));

  useEffect(() => {
    uniforms.u_shapeWidth.value = pxWidth;
    uniforms.u_shapeHeight.value = pxHeight;
    uniforms.u_shapeRadius.value = pxRadius;
    uniforms.u_resolution.value.set(resolution.x, resolution.y);
  }, [pxHeight, pxRadius, pxWidth, resolution, uniforms]);

  useEffect(() => {
    const { base, blurred, cleanup } = createBackgroundTextures(theme.backgroundColor, theme.accentColor);
    uniforms.u_bg.value = base;
    uniforms.u_blurredBg.value = blurred;
    return () => {
      cleanup();
    };
  }, [theme.accentColor, theme.backgroundColor, uniforms]);

  useEffect(() => {
    const tint = uniforms.u_tint.value as Vector4;
    const tintColor = new Color(level.color).convertLinearToSRGB();
    tint.set(tintColor.r, tintColor.g, tintColor.b, MathUtils.clamp(level.transmission * 0.75, 0.45, 0.92));
  }, [level.color, level.transmission, uniforms.u_tint]);

  useFrame((state, delta) => {
    const dpr = state.gl.getPixelRatio();
    if (uniforms.u_dpr.value !== dpr) {
      uniforms.u_dpr.value = dpr;
    }

    pointerSpring.current.lerp(pointerTarget.current, 1 - Math.exp(-delta * 6.5));
    (uniforms.u_mouse.value as Vector2).copy(pointerTarget.current);
    (uniforms.u_mouseSpring.value as Vector2).copy(pointerSpring.current);
  });

  useEffect(() => {
    return () => {
      material.dispose();
      const base = uniforms.u_bg.value;
      const blur = uniforms.u_blurredBg.value;
      base?.dispose?.();
      if (blur && blur !== base) {
        blur.dispose?.();
      }
      fallbackTexture.dispose();
    };
  }, [fallbackTexture, material, uniforms.u_bg, uniforms.u_blurredBg]);

  const setPointer = useCallback(
    (uv: { x: number; y: number } | null) => {
      if (!uv) {
        pointerTarget.current.set(0, 0);
        return;
      }
      const x = clamp01(uv.x) - 0.5;
      const y = 0.5 - clamp01(uv.y);
      pointerTarget.current.set(x * pxWidth, y * pxHeight);
    },
    [pxHeight, pxWidth],
  );

  return {
    material,
    setPointer,
    resolution: { width: pxWidth, height: pxHeight },
  };
};
