import { Canvas } from '@react-three/fiber';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import type { EnvironmentProps } from '@react-three/drei';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Suspense } from 'react';
import type { Group } from 'three';
import {
  AnimationPresetMap,
  GlassTheme,
  createSheeshmahalConfig,
} from '../../../core/src/index.js';

export interface SMCanvasProviderProps {
  theme?: GlassTheme;
  animationPresets?: AnimationPresetMap;
  dpr?: [number, number];
  enableControls?: boolean;
  environmentPreset?: EnvironmentProps['preset'];
}

export interface CanvasContextValue {
  theme: GlassTheme;
  animationPresets: AnimationPresetMap;
  reducedMotion: boolean;
  portalRoot: Group | null;
  setPortalRoot: (group: Group | null) => void;
}

export const SMCanvasContext = createContext<CanvasContextValue | null>(null);

export const useSMCanvas = (): CanvasContextValue => {
  const context = useContext(SMCanvasContext);
  if (!context) {
    throw new Error('useSMCanvas must be used within an SMCanvasProvider');
  }
  return context;
};

const ScenePortalRoot = () => {
  const { setPortalRoot } = useSMCanvas();
  const ref = useRef<Group>(null);

  useEffect(() => {
    const node = ref.current;
    setPortalRoot(node);
    return () => setPortalRoot(null);
  }, [setPortalRoot]);

  return <group ref={ref} />;
};

export const SMCanvasProvider = ({
  children,
  theme,
  animationPresets,
  dpr = [1, 1.8],
  enableControls = false,
  environmentPreset = 'city',
}: PropsWithChildren<SMCanvasProviderProps>) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [portalRoot, setPortalRoot] = useState<Group | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const config = useMemo(
    () =>
      createSheeshmahalConfig({
        theme,
        animationPresets,
      }),
    [theme, animationPresets]
  );

  const contextValue = useMemo<CanvasContextValue>(
    () => ({
      theme: config.theme,
      animationPresets: config.animationPresets,
      reducedMotion,
      portalRoot,
      setPortalRoot,
    }),
    [config, reducedMotion, portalRoot]
  );

  return (
    <SMCanvasContext.Provider value={contextValue}>
      <div className="sm-canvas-provider" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Canvas
          dpr={dpr}
          gl={{ antialias: true, toneMappingExposure: 0.95 }}
          camera={{ position: [0, 0, 6], fov: 45 }}
        >
          <color attach="background" args={[config.theme.backgroundColor]} />
          <Suspense fallback={<Html center className="sm-loading">Loading Sheeshmahal…</Html>}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 6, 4]} intensity={2.5} />
            <Environment preset={environmentPreset} />
            <ScenePortalRoot />
            {children}
            {enableControls ? <OrbitControls makeDefault enablePan={false} /> : null}
          </Suspense>
        </Canvas>
      </div>
    </SMCanvasContext.Provider>
  );
};
