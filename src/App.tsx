import { LiquidGlass, type LiquidGlassBackgroundOption } from './components/LiquidGlass/LiquidGlass';

import VertexShader from './shaders/vertex.glsl?raw';
import FragmentBgShader from './shaders/fragment-bg.glsl?raw';
import FragmentBgVblurShader from './shaders/fragment-bg-vblur.glsl?raw';
import FragmentBgHblurShader from './shaders/fragment-bg-hblur.glsl?raw';
import FragmentMainShader from './shaders/fragment-main.glsl?raw';

import bgGrid from '@/assets/bg-grid.png';
import bgBars from '@/assets/bg-bars.png';
import bgHalf from '@/assets/bg-half.png';
import bgTimcook from '@/assets/bg-timcook.png';
import bgUI from '@/assets/bg-ui.svg';
import bgTahoeLightImg from '@/assets/bg-tahoe-light.webp';
import bgText from '@/assets/bg-text.jpg';
import bgBuildings from '@/assets/bg-buildings.png';
import bgVideoFish from '@/assets/bg-video-fish.mp4';
import bgVideo2 from '@/assets/bg-video-2.mp4';
import bgVideo3 from '@/assets/bg-video-3.mp4';

const SHADERS = {
  vertex: VertexShader,
  fragmentBg: FragmentBgShader,
  fragmentBgVblur: FragmentBgVblurShader,
  fragmentBgHblur: FragmentBgHblurShader,
  fragmentMain: FragmentMainShader,
} as const;

const BACKGROUND_OPTIONS: LiquidGlassBackgroundOption[] = [
  { value: 11, loadTexture: true, type: 'custom' },
  { value: 0, media: bgGrid, loadTexture: false },
  { value: 1, media: bgBars, loadTexture: false },
  { value: 2, media: bgHalf, loadTexture: false },
  { value: 3, media: bgTahoeLightImg, loadTexture: true },
  { value: 4, media: bgBuildings, loadTexture: true },
  { value: 5, media: bgText, loadTexture: true },
  { value: 6, media: bgTimcook, loadTexture: true },
  { value: 7, media: bgUI, loadTexture: true },
  { value: 8, media: bgVideoFish, loadTexture: true, type: 'video' },
  { value: 9, media: bgVideo2, loadTexture: true, type: 'video' },
  { value: 10, media: bgVideo3, loadTexture: true, type: 'video' },
];

function App() {
  return (
    <LiquidGlass
      title="Liquid Glass Studio"
      author={{ name: 'iyinchao' }}
      githubUrl="https://github.com/iyinchao/liquid-glass-studio"
      xUrl="https://x.com/charles_yin/status/1936338569267986605"
      shaders={SHADERS}
      backgroundOptions={BACKGROUND_OPTIONS}
      showControls={false}
    />
  );
}

export default App;
