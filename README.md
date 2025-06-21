# 🔮 Liquid Glass Studio

[English](README.md) | [简体中文](README-zh.md)

The ultimate Apple Liquid Glass UI replica for the Web, powered by WebGL2 and shaders. Includes most Liquid Glass features with fine-grained controls for detailed customization.

## Online Demo

## ScreenShots

## Features

- **Full features of Apple Liquid Glass Effects**:
  - Refraction
  - Dispersion
  - Fresnel reflection
  - SuperEllipse shape
  - Blob Effect (Shape Merge)
  - Glare
  - Gussian Blur Mask
  - Shadow
  - Self-illumination
  - Anti-aliasing
- **Interactive Controls**: Real-time parameter adjustments with intuitive UI
- **Background Options**: Multiple background types including images and videos
- **Animation Support**: Spring-based animations with configurable parameters

## Technical Highlights

- Built with React 19 and TypeScript for robust type safety
- WebGL-based rendering for high-performance graphics
- Custom shader implementations for realistic glass effects
- Modular component architecture for maintainability
- Custom Leva UI components for intuitive parameter controls
- Vite-powered development environment for fast iteration

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

- [ ] More Glare Controls (hardness / color / size etc.)
- [ ] Custom Background
- [ ] Self-illumination
- [ ] Control parameter import / export
- [ ] Render Step view to show intermediate results
- [ ] UI Content inside of shape

## License

[MIT License](LICENSE)
