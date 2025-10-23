import { Html, RoundedBox } from '@react-three/drei';
import { useSpring } from '@react-spring/web';
import { useFrame } from '@react-three/fiber';
import clsx from 'clsx';
import { Fragment, useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GlassLevel } from '../../../core/src/index.js';
import { useSMCanvas } from '../canvas/CanvasProvider.js';
import { useGlassMaterial } from '../hooks/useGlassMaterial.js';
import { useSpringPreset } from '../hooks/useSpringPreset.js';
import { SMButton3D } from './Button3D.js';
import type { Group } from 'three';

export interface SMModal3DProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  glassLevel?: GlassLevel;
  depth?: number;
  closeLabel?: string;
}

export const SMModal3D = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  glassLevel = 'heavy',
  depth = 0.6,
  closeLabel = 'Close',
}: SMModal3DProps) => {
  const { theme, reducedMotion } = useSMCanvas();
  const glassMaterial = useGlassMaterial({ glassLevel, accentColor: theme.accentColor });
  const { config, immediate } = useSpringPreset('entrance');
  const headingId = useId();
  const descriptionId = useId();
  const groupRef = useRef<Group>(null);

  const [springs, api] = useSpring(() => ({
    rotationX: 0,
    positionZ: -1.5,
    config,
    immediate,
  }));

  useEffect(() => {
    api.start({
      rotationX: reducedMotion ? 0 : open ? 0.12 : -0.18,
      positionZ: open ? depth * 1.4 : -1.5,
      config,
      immediate,
    });
  }, [api, config, depth, immediate, open, reducedMotion]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.x = springs.rotationX.get();
    group.position.z = springs.positionZ.get();
  });

  return (
    <Fragment>
      <group ref={groupRef}>
        <RoundedBox args={[4.2, 2.8, depth]} radius={0.22} smoothness={8}>
          <meshPhysicalMaterial {...glassMaterial} />
        </RoundedBox>
        <Html
          center
          transform
          pointerEvents="auto"
          className={clsx(
            'sm-modal3d flex h-full w-full flex-col gap-4 rounded-3xl border border-white/25 bg-white/12 p-8 text-left text-white/90 shadow-[0_0_90px_rgba(56,189,248,0.45)] backdrop-blur-2xl',
            open ? 'pointer-events-auto' : 'pointer-events-none'
          )}
          style={{ opacity: open ? 1 : 0 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? headingId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            className="flex h-full flex-1 flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              {title ? (
                <h2 id={headingId} className="text-2xl font-semibold tracking-tight text-white">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="text-sm text-white/80">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex-1 text-sm leading-relaxed text-white/85">{children}</div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </Html>
      </group>
      {!open ? (
        <group position={[0, -1.8, 0]}>
          <SMButton3D
            label="Open Modal"
            onClick={() => onOpenChange?.(true)}
            glassLevel="medium"
            depth={0.35}
          />
        </group>
      ) : null}
    </Fragment>
  );
};
