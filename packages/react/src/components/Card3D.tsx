import { Html, RoundedBox, Text } from '@react-three/drei';
import { useSpring } from '@react-spring/web';
import { useFrame } from '@react-three/fiber';
import clsx from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { GlassLevel } from '../../../core/src/index.js';
import { useSMCanvas } from '../canvas/CanvasProvider.js';
import { useGlassMaterial } from '../hooks/useGlassMaterial.js';
import { useSpringPreset } from '../hooks/useSpringPreset.js';
import type { Group } from 'three';

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

  const glassMaterial = useGlassMaterial({ glassLevel, accentColor: theme.accentColor });
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

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox args={[3.6, 2.4, depth]} radius={0.2} smoothness={6}>
        <meshPhysicalMaterial {...glassMaterial} />
        <Html
          center
          transform
          pointerEvents="auto"
          className={clsx(
            'sm-card3d flex h-full w-full flex-col justify-between rounded-3xl border border-white/20 bg-white/8 p-6 text-left text-white backdrop-blur-xl shadow-[0_10px_60px_rgba(59,130,246,0.25)]',
            className
          )}
        >
          <div className={clsx('flex flex-1 flex-col gap-3 text-sm leading-relaxed text-white/90', contentClassName)}>
            {title ? (
              <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
            ) : null}
            {description ? <p>{description}</p> : null}
            {children}
          </div>
          {footer ? <div className="mt-6 text-xs text-white/70">{footer}</div> : null}
        </Html>
      </RoundedBox>
      <Text position={[0, 1.5, -depth]} fontSize={0.32} color={theme.accentColor} outlineWidth={0.008}>
        SMCard3D
      </Text>
    </group>
  );
};
