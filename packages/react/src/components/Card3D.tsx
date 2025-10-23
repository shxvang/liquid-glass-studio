import { Html, RoundedBox, Text } from '@react-three/drei';
import { useSpring } from '@react-spring/web';
import { useFrame } from '@react-three/fiber';
import clsx from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Color, MathUtils, type Group } from 'three';
import type { GlassLevel } from '../../../core/src/index.js';
import { useSMCanvas } from '../canvas/CanvasProvider.js';
import { useSpringPreset } from '../hooks/useSpringPreset.js';
import { useLiquidGlassSurface } from '../hooks/useLiquidGlassSurface.js';

export interface SMCard3DProps {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  glassLevel?: GlassLevel;
  depth?: number;
  className?: string;
  contentClassName?: string;
}

export const SMCard3D = ({
  title,
  description,
  footer,
  glassLevel = 'light',
  depth = 0.35,
  className,
  contentClassName,
  children,
}: PropsWithChildren<SMCard3DProps>) => {
  const { theme, reducedMotion } = useSMCanvas();
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<Group>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const surface = useLiquidGlassSurface({
    width: 3.4,
    height: 2.2,
    radius: 0.32,
    glassLevel,
    theme,
  });
  const { config, immediate } = useSpringPreset('hover');

  const [springs, api] = useSpring(() => ({
    rotationX: 0,
    rotationY: 0,
    positionY: 0,
    positionZ: 0,
    scale: 1,
    config,
    immediate,
  }));

  useEffect(() => {
    api.start({
      rotationX: reducedMotion ? 0 : hovered ? 0.1 : 0,
      rotationY: reducedMotion ? 0 : hovered ? -0.04 : 0,
      positionY: hovered ? 0.1 : 0,
      positionZ: hovered ? depth * 1.2 : 0,
      scale: hovered ? 1.01 : 1,
      config,
      immediate,
    });
  }, [api, config, depth, hovered, immediate, reducedMotion]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.x = springs.rotationX.get();
    group.rotation.y = springs.rotationY.get();
    group.position.y = springs.positionY.get();
    group.position.z = springs.positionZ.get();
    const scaleValue = springs.scale.get();
    group.scale.set(scaleValue, scaleValue, scaleValue);
  });

  const updatePointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1);
    surface.setPointer({ x, y });
  }, [surface]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    surface.setPointer(null);
  }, [surface]);

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={handlePointerLeave}
    >
      <RoundedBox args={[3.7, 2.5, depth]} radius={0.26} smoothness={7}>
        <meshStandardMaterial
          color={mixSurfaceColor(theme.backgroundColor, theme.accentColor, 0.08)}
          roughness={0.48}
          metalness={0.18}
        />
      </RoundedBox>
      <mesh position={[0, 0, depth / 2 + 0.01]}>
        <planeGeometry args={[3.4, 2.2]} />
        <primitive attach="material" object={surface.material} />
      </mesh>
      <Html
        center
        transform
        pointerEvents="auto"
        className={clsx(
          'sm-card3d flex h-full w-full flex-col justify-between rounded-[26px] border border-white/15 bg-transparent p-6 text-left text-white',
          className
        )}
      >
        <div
          ref={containerRef}
          className={clsx('flex flex-1 flex-col gap-3 text-sm leading-relaxed text-white/90', contentClassName)}
          onPointerMove={(event) => {
            if (!reducedMotion) {
              updatePointer(event);
            }
          }}
          onPointerLeave={handlePointerLeave}
        >
          {title ? (
            <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
          ) : null}
          {description ? <p>{description}</p> : null}
          {children}
        </div>
        {footer ? <div className="mt-6 text-xs text-white/70">{footer}</div> : null}
      </Html>
      <Text position={[0, 1.5, -depth]} fontSize={0.32} color={theme.accentColor} outlineWidth={0.008}>
        SMCard3D
      </Text>
    </group>
  );
};

const mixSurfaceColor = (background: string, accent: string, factor: number) => {
  const base = new Color(background);
  const tint = new Color(accent);
  base.lerp(tint, factor);
  return `#${base.convertLinearToSRGB().getHexString()}`;
};
