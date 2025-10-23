import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { SMCanvasProvider, SMButton3D, SMCard3D, SMModal3D } from '../../../packages/react/src/index.js';

const CanvasScene = () => {
  const [open, setOpen] = useState(false);

  return (
    <SMCanvasProvider enableControls>
      <group position={[0, 0, 0]}>
        <SMCard3D
          title="Glass Control Center"
          description="React Three Fiber driven components with shimmering glass skins."
          footer="Sheeshmahal · react-three-fiber · react-spring"
        >
          <p>Interact with the floating controls to explore parallax and depth animations.</p>
        </SMCard3D>
      </group>
      <group position={[0, -2.8, 0]}>
        <SMButton3D label="Summon modal" onClick={() => setOpen(true)} />
      </group>
      <group position={[0, 2.8, 0]}>
        <SMModal3D
          open={open}
          onOpenChange={setOpen}
          title="Modal in the Clouds"
          description="Accessible content rendered inside a glassmorphic 3D shell."
        >
          <p className="text-white/80">
            Combine Shadcn patterns with Sheeshmahal&apos;s volumetric depth to craft immersive UI moments.
          </p>
        </SMModal3D>
      </group>
    </SMCanvasProvider>
  );
};

const Scene = dynamic(() => Promise.resolve(CanvasScene), { ssr: false });

export default function Page() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-100">
      <Suspense fallback={<p className="text-lg">Loading Sheeshmahal playground…</p>}>
        <Scene />
      </Suspense>
    </main>
  );
}
