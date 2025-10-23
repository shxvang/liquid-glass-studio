import { Html, RoundedBox } from '@react-three/drei';
import { useSpring } from '@react-spring/web';
import { useFrame } from '@react-three/fiber';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { Group } from 'three';
import { useSMCanvas } from '../canvas/CanvasProvider.js';
import { useGlassMaterial } from '../hooks/useGlassMaterial.js';
import { useSpringPreset } from '../hooks/useSpringPreset.js';
import type { GlassLevel } from '../../../core/src/index.js';

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

  const glassMaterial = useGlassMaterial({ glassLevel, accentColor: theme.accentColor });
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

  return (
    <group
      ref={groupRef}
      onPointerOver={(event) => {
        setHovered(true);
        onPointerOver?.(event);
      }}
      onPointerOut={(event) => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
        setPressed(false);
        onPointerOut?.(event);
      }}
      onPointerMove={(event) => {
        if (reducedMotion) return;
        if (event.uv) {
          const x = (event.uv.x - 0.5) * 2;
          const y = (event.uv.y - 0.5) * 2;
          setTilt({ x: x, y: y });
        }
        onPointerMove?.(event);
      }}
      onPointerDown={(event) => {
        setPressed(true);
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setPressed(false);
        onPointerUp?.(event);
      }}
    >
      <RoundedBox args={[2.6, 0.9, depth]} radius={0.18} smoothness={8}>
        <meshPhysicalMaterial {...glassMaterial} />
      </RoundedBox>
      <Html
        center
        transform
        occlude
        pointerEvents="auto"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <button
          type={resolvedType}
          className={clsx(
            'sm-button3d inline-flex min-w-[8rem] items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-2 text-sm font-medium text-white shadow-[0_0_40px_rgba(96,165,250,0.45)] backdrop-blur-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80',
            className
          )}
          {...restProps}
        >
          {content}
        </button>
      </Html>
    </group>
  );
};
