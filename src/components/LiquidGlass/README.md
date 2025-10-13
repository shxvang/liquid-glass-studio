## LiquidGlass Component

`LiquidGlass` encapsulates the WebGL-powered liquid glass canvas and its interactive control surface. It is designed as a composable React component that adheres to SOLID principles by separating configuration (supplied by the caller) from rendering and state management (internal to the component).

### Usage

```tsx
import { LiquidGlass } from '@/components/LiquidGlass/LiquidGlass';

// shader strings may be imported with ?raw or provided from another source
import VertexShader from '@/shaders/vertex.glsl?raw';
import FragmentBgShader from '@/shaders/fragment-bg.glsl?raw';
import FragmentBgVblurShader from '@/shaders/fragment-bg-vblur.glsl?raw';
import FragmentBgHblurShader from '@/shaders/fragment-bg-hblur.glsl?raw';
import FragmentMainShader from '@/shaders/fragment-main.glsl?raw';

const SHADERS = {
  vertex: VertexShader,
  fragmentBg: FragmentBgShader,
  fragmentBgVblur: FragmentBgVblurShader,
  fragmentBgHblur: FragmentBgHblurShader,
  fragmentMain: FragmentMainShader,
} as const;

const BACKGROUND_OPTIONS = [
  { value: 0, media: bgGrid, loadTexture: false },
  { value: 8, media: bgVideoFish, loadTexture: true, type: 'video' },
  { value: 11, loadTexture: true, type: 'custom' },
];

export function Playground() {
  return (
    <LiquidGlass
      title="Liquid Glass Studio"
      subtitle="Liquid UI exploration"
      author={{ name: 'iyinchao', url: 'https://github.com/iyinchao' }}
      githubUrl="https://github.com/iyinchao/liquid-glass-studio"
      xUrl="https://x.com/charles_yin/status/1936338569267986605"
      shaders={SHADERS}
      backgroundOptions={BACKGROUND_OPTIONS}
      showControls
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `title` | `string` | ✅ | Heading displayed above the canvas window. |
| `subtitle` | `string` | ❌ | Optional subtitle. Defaults to the i18n subtitle from Leva controls. |
| `author` | `{ name: string; url?: string }` | ✅ | Author attribution displayed next to the social links. |
| `githubUrl` | `string` | ✅ | Link target for the GitHub icon button. |
| `xUrl` | `string` | ✅ | Link target for the X (Twitter) icon button. |
| `shaders` | `{ vertex: string; fragmentBg: string; fragmentBgVblur: string; fragmentBgHblur: string; fragmentMain: string; }` | ✅ | Raw GLSL shader sources used to configure the `MultiPassRenderer`. |
| `backgroundOptions` | `LiquidGlassBackgroundOption[]` | ✅ | Options rendered inside the background picker. See below. |
| `initialCanvasSize` | `{ width: number; height: number; dpr: number }` | ❌ | Override the auto-calculated canvas size (and initial device pixel ratio). |
| `showControls` | `boolean` | ❌ | When false, hides the Leva control panel. Defaults to `true`. |

#### `LiquidGlassBackgroundOption`

```ts
type LiquidGlassBackgroundOption = {
  value: number;
  media?: string;
  loadTexture: boolean;
  type?: 'image' | 'video' | 'custom';
};
```

- `value` must align with the `bgType` keys produced by `useLevaControls`.
- `media` should be a resolved asset URL (image or video) unless `type === 'custom'`.
- When `type === 'custom'`, the component renders a file input that loads user-provided media at runtime.
- The `loadTexture` flag determines whether a URL should trigger WebGL texture management.

### Internal Responsibilities

- Initializes and manages a `MultiPassRenderer` with four passes (background, vertical blur, horizontal blur, main pass) using the supplied shader sources.
- Tracks canvas metrics and pointer movement to drive shader uniforms in sync with the reactive Leva controls.
- Handles texture lifecycle for image/video backgrounds, including custom uploads via object URLs and WebGL cleanup.
- Integrates the `ResizableWindow` wrapper to keep the canvas centered and responsive to window resize events.

### Extension Guidelines

- To add new controls, extend the `useLevaControls` configuration inside the component. Keep derived state within the `stateRef` to avoid unnecessary re-renders.
- Additional shader uniforms can be passed by updating the `renderer.setUniforms` call and exposing corresponding values in the Leva control set.
- For code-splitting or alternative layouts, consider wrapping `LiquidGlass` in a parent that decides when to mount it; the component manages its own WebGL resources on mount/unmount.

### Testing

- Run `npm run build` to ensure TypeScript types remain satisfied and Vite can bundle shader assets.
- Interactive validation (`npm run dev`) is recommended to confirm background uploads, video playback, and uniform responses remain functional after changes.
