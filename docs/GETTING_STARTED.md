# Getting Started with Sheeshmahal

Welcome to **Sheeshmahal**, a Sheen-driven extension of the Shadcn/UI ecosystem for volumetric UI. This quickstart shows how to install dependencies, wire up the canvas provider, and drop in 3D components powered by React Three Fiber and React Spring.

## Installation

```bash
pnpm install three @react-three/fiber @react-three/drei @react-spring/three @react-spring/web clsx tailwindcss
```

> The core utilities live in `packages/core`, React bindings in `packages/react`, and ready-made themes inside `packages/presets`.

## Bootstrapping the Canvas Provider

```tsx
import { SMCanvasProvider } from '@sheeshmahal/react';

export function App() {
  return (
    <SMCanvasProvider enableControls>
      {/* 3D components go here */}
    </SMCanvasProvider>
  );
}
```

The provider ensures a single `<Canvas>` instance, responsive DPR, HDR environment lighting, and reduced-motion support.

## Rendering 3D Components

```tsx
import { SMButton3D, SMCard3D, SMModal3D } from '@sheeshmahal/react';

export const ControlPanel = () => (
  <SMCanvasProvider>
    <group position={[0, 0, 0]}>
      <SMCard3D
        title="Glass Command"
        description="Hover to feel the parallax tilt and depth lift."
        footer="Powered by react-three-fiber"
      />
    </group>
    <group position={[0, -2.4, 0]}>
      <SMButton3D label="Engage" onClick={() => console.log('engaged')} />
    </group>
  </SMCanvasProvider>
);
```

Each component renders an accessible HTML surface via `Html` from `drei`, so keyboard navigation and focus rings still work while the 3D shell animates independently.

> 🔬 Under the hood every front-facing surface now streams the **Liquid Glass Studio** multipass shader. The blurred background and dispersion textures are generated on-demand and pushed into a GLSL3 material, so you get the exact refraction, fresnel bloom, and glare authored in the original playground—just mapped onto R3F geometry.

## Reduced Motion & Accessibility

The provider reads `prefers-reduced-motion` and disables high-frequency rotation when users opt out of motion. Override animation presets per component via `useSpringPreset` or props.

## Next Steps

- Explore `docs/DESIGN_GUIDELINES.md` for glassmorphism and animation direction.
- Use `examples/next-app` as a reference for integrating inside a Next.js application with dynamic canvas loading.
- Add new component mappings following the naming pattern `SM<ComponentName>3D`.
