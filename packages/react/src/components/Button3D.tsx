import { Html, RoundedBox } from '@react-three/drei';
import { useSpring } from '@react-spring/web';
import { useFrame } from '@react-three/fiber';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Group } from 'three';
import { Color, MathUtils } from 'three';
import { useSMCanvas } from '../canvas/CanvasProvider.js';
import { useSpringPreset } from '../hooks/useSpringPreset.js';
import type { GlassLevel } from '../../../core/src/index.js';
import { useLiquidGlassSurface } from '../hooks/useLiquidGlassSurface.js';

export interface SMButton3DProps extends ComponentPropsWithoutRef<'button'> {
  label?: ReactNode;
  glassLevel?: GlassLevel;
  depth?: number;
  animationPreset?: 'hover' | 'press';
}

export const SMButton3D = ({
  label,
  glassLevel = 'medium',
  depth = 0.4,
  animationPreset = 'hover',
  className,
  onPointerOver,
  onPointerOut,
  onPointerMove,
  onPointerDown,
  onPointerUp,
  ...buttonProps
}: SMButton3DProps) => {
  const { theme, reducedMotion } = useSMCanvas();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const groupRef = useRef<Group>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const surface = useLiquidGlassSurface({
    width: 2.4,
    height: 0.84,
    radius: 0.38,
    glassLevel,
    theme,
  });
  const { config, immediate } = useSpringPreset(animationPreset);
  const { children: buttonChildren, type, ...restProps } = buttonProps;
  const resolvedType = (type as SMButton3DProps['type']) ?? 'button';
  const content = label ?? buttonChildren ?? 'Interact';

  const [springs, api] = useSpring(() => ({
    rotationX: 0,
    rotationY: 0,
    positionZ: 0,
    scale: 1,
    config,
    immediate,
  }));

  useEffect(() => {
    api.start({
      rotationX: reducedMotion ? 0 : tilt.y * -0.25,
      rotationY: reducedMotion ? 0 : tilt.x * 0.25,
      positionZ: hovered ? depth : 0,
      scale: pressed ? 0.96 : hovered ? 1.02 : 1,
      config,
      immediate,
    });
  }, [api, config, depth, hovered, immediate, pressed, reducedMotion, tilt]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.x = springs.rotationX.get();
    group.rotation.y = springs.rotationY.get();
    group.position.z = springs.positionZ.get();
    const scaleValue = springs.scale.get();
    group.scale.set(scaleValue, scaleValue, scaleValue);
  });

  const handlePointerFromButton = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1);
    surface.setPointer({ x, y });
    setTilt({ x: (x - 0.5) * 2, y: (y - 0.5) * 2 });
    return { x, y };
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    surface.setPointer(null);
    setTilt({ x: 0, y: 0 });
    setPressed(false);
    onPointerOut?.(event);
  };

  return (
    <group
      ref={groupRef}
      onPointerOver={() => {
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
        surface.setPointer(null);
      }}
    >
      <RoundedBox args={[2.7, 0.92, depth]} radius={0.22} smoothness={8}>
        <meshStandardMaterial color={mixSurfaceColor(theme.backgroundColor, theme.accentColor)} roughness={0.45} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0, depth / 2 + 0.01]}>
        <planeGeometry args={[2.4, 0.84]} />
        <primitive attach="material" object={surface.material} />
      </mesh>
      <Html center transform occlude pointerEvents="auto">
        <button
          ref={buttonRef}
          type={resolvedType}
          className={clsx(
            'sm-button3d relative inline-flex min-w-[8rem] items-center justify-center rounded-full border border-white/30 bg-transparent px-6 py-2 text-sm font-semibold text-white/95 backdrop-blur-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70',
            className
          )}
          style={{ background: 'transparent' }}
          onPointerOver={(event) => {
            handlePointerFromButton(event);
            setHovered(true);
            onPointerOver?.(event);
          }}
          onPointerMove={(event) => {
            if (reducedMotion) {
              onPointerMove?.(event);
              return;
            }
            const coords = handlePointerFromButton(event);
            if (coords) {
              onPointerMove?.(event);
            }
          }}
          onPointerLeave={(event) => {
            setHovered(false);
            handlePointerLeave(event);
          }}
          onPointerDown={(event) => {
            setPressed(true);
            onPointerDown?.(event);
          }}
          onPointerUp={(event) => {
            setPressed(false);
            onPointerUp?.(event);
          }}
          {...restProps}
        >
          {content}
        </button>
      </Html>
    </group>
  );
};

const mixSurfaceColor = (background: string, accent: string) => {
  const base = new Color(background);
  const tint = new Color(accent);
  base.lerp(tint, 0.12);
  return `#${base.convertLinearToSRGB().getHexString()}`;
};
