# 🔮 Liquid Glass Studio

![frontPhoto](./.github/assets/title.png)

[English](README.md) | [简体中文](README-zh.md)

The Ultimate Web Recreation of Apple’s Liquid Glass UI, powered by WebGL2 and shaders. Includes most Liquid Glass features with fine-grained controls for detailed customization.

## Online Demo

https://liquid-glass-studio.vercel.app/

For users in mainland China, please visit:
https://liquid-glass.iyinchao.cn/

## Sheeshmahal: 3D Shadcn Extensions

Alongside the playground we now ship **Sheeshmahal** – a monorepo that translates Shadcn/UI components into fully volumetric, glassmorphic counterparts rendered in React Three Fiber.

### Quickstart

```bash
pnpm install
pnpm dev
```

Open the developer playground and explore the new `packages/` directory to inspect the reusable Sheeshmahal packages. The fastest path is the Next.js integration example under `examples/next-app`.

### Packages Overview

- `packages/core`: Material and animation primitives shared across runtimes.
- `packages/react`: React bindings, `<SMCanvasProvider>`, and 3D component implementations (`SMButton3D`, `SMCard3D`, `SMModal3D`).
- `packages/presets`: Glass themes and animation preset exports.
- All React components reuse the Liquid Glass Studio multipass shader, so the refraction and glare you tweak in the playground appear identically inside Sheeshmahal scenes.

### Documentation

- [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) – installation guide and usage snippets.
- [`docs/DESIGN_GUIDELINES.md`](docs/DESIGN_GUIDELINES.md) – glassmorphism palette, motion rules, accessibility notes.
- [`docs/COMPONENT_MAP.md`](docs/COMPONENT_MAP.md) – snapshot of Shadcn/UI to Sheeshmahal mappings.

## ScreenShots

<table align="center">
  <tr>
    <td><img src="./.github/assets/title-video.gif" width="240" ></td>
    <td><img src="./.github/assets/screen-shot-1.png" width="240" /></td>
    <td><img src="./.github/assets/screen-shot-2.png" width="240" /></td>
  </tr>
  <tr>
    <td><img src="./.github/assets/screen-shot-3.png" width="240" /></td>
    <td><img src="./.github/assets/screen-shot-4.png" width="240" /></td>
  </tr>
</table>

## Features

**✨ Apple Liquid Glass Effects:**

- Refraction
- Dispersion
- Fresnel reflection
- Superellipse shapes
- Blob effect (shape merging)
- Glare with customizable angle
- Gaussian blur masking
- Anti-aliasing

**⚙️ Interactive Controls:**

- Comprehensive real-time parameter adjustments via an intuitive UI

**🖼 Background Options:**

- Support for both images and videos as dynamic backgrounds

**🎞 Animation Support:**

- Spring-based shape animations with configurable behavior

## Technical Highlights

- WebGL-based rendering for high-performance graphics
- Multipass rendering for high-quality & performant Gaussian blur
- Using SDF Defined shapes and smooth merge function
- Custom shader implementations for realistic glass effects
- Custom Leva UI components for intuitive parameter controls

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## TODO

- [x] More Glare Controls (hardness / color / size etc.)
- [x] Custom Background
- [ ] Render with WebGPU
- [ ] Editor mode
- [ ] Glass Text Rendering
- [ ] Glass Presets
- [ ] Self-illumination
- [ ] HDR illumination
- [ ] Control parameter import / export
- [x] Render Step view to show intermediate results
- [ ] UI Content inside of shape

## Credits

Thanks to the following resources and inspirations:

- [SDF functions](https://iquilezles.org/articles/distfunctions2d/) and [smooth merge function](https://iquilezles.org/articles/smin/) by [Inigo Quilez](https://iquilezles.org/)
- Sample photo (Buildings) by <a href="https://unsplash.com/@anewevisual?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Adrian Newell</a> on <a href="https://unsplash.com/photos/a-row-of-multicolored-houses-on-a-street-UtfxJZ-uy5Q?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>
- Sample video (Fish / Traffic) by Tom Fisk from [Pexels](https://www.pexels.com/video/light-city-road-traffic-4062991/)
- Sample video (Flower) by Pixabay from [Pexels](https://www.pexels.com/video/orange-flowers-856383/)
- Sample Photo by Apple and Tim Cook

## License

[MIT License](LICENSE)
