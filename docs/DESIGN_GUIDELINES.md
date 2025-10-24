# Sheeshmahal Design Guidelines

These guidelines help maintain visual and experiential coherence across Sheeshmahal components.

## Glassmorphism Palette

- **Backgrounds**: Start from deep midnight tones (`#030712`) that allow glass layers to sparkle. Gradients with subtle blues (`#0f172a` → `#1d4ed8`) reinforce depth.
- **Glass Levels**:
  - `light`: Use for secondary surfaces; higher roughness and lower transmission to avoid overwhelming scenes.
  - `medium`: Default interactive surfaces; balances clarity with blur for legibility.
  - `heavy`: Hero surfaces; maximize transmission and env-map intensity, pair with emissive outlines.
- **Accents**: Derive accent color from brand palette but keep saturation high enough to catch reflections (`#60a5fa` by default).

## Motion Principles

- **Parallax Tilt**: Clamp rotations to ±10° for comfort. Combine with depth lift of 0.05–0.1 units to avoid motion sickness.
- **Micro Interactions**: Press states should overshoot slightly (scale 0.94 → 1.02) with tension ≥ 400 for snappy feel.
- **Entrance**: Stagger multiple components by 60–120ms to prevent simultaneous peaks in GPU load.
- **Reduced Motion**: Honor `prefers-reduced-motion` by disabling rotation and shimmer loops while keeping opacity transitions.

## Lighting & Materials

- Use a three-point setup: warm key light, cool fill, and subtle rim light to outline silhouettes.
- Load HDR environments lazily (`drei/Environment`) to keep initial bundle lean.
- Share geometries and materials when possible to leverage GPU instancing.
- All foreground panels should consume the shared Liquid Glass shader material (`useLiquidGlassSurface`) so dispersion, fresnel bloom, and glare stay visually consistent across components.

## Accessibility

- Always mirror interactive 3D surfaces with semantic HTML via `Html` overlays.
- Provide visible focus rings using emissive outlines or overlay CSS.
- Maintain readable contrast (WCAG AA) by mixing blurred background layers with crisp type.

## Performance Checklist

- Track frame timings with `drei/Perf` during development.
- Memoize geometry-heavy components and minimize work inside `useFrame`.
- Use `adaptiveDpr` and `frameloop="demand"` to yield idle frames back to the browser.
