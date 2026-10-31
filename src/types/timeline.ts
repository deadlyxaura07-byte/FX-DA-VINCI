export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type LutPreset =
  | 'none'
  | 'cinematic-teal-orange'
  | 'cyberpunk-neon'
  | 'vintage-film-kodak'
  | 'monochrome-noir'
  | 'warm-sunset'
  | 'bleach-bypass';

export interface FilterSettings {
  exposure: number; // -100 to 100
  contrast: number; // -100 to 100
  brightness: number; // -100 to 100
  saturation: number; // -100 to 100
  temperature: number; // -100 (cool blue) to 100 (warm orange)
  tint: number; // -100 (green) to 100 (magenta)
  shadows: number; // -100 to 100
  highlights: number; // -100 to 100
  vignette: number; // 0 to 100
  lut: LutPreset;
  colorWheels?: {
    shadows: { r: number; g: number; b: number };
    midtones: { r: number; g: number; b: number };
    highlights: { r: number; g: number; b: number };
  };
}

export type TransitionType =
  | 'none'
  | 'cross-dissolve'
  | 'fade-black'
  | 'whip-pan'
  | 'glitch'
  | 'zoom-blur'
  | 'flash-cut';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // seconds
}

export type ClipType = 'video' | 'image' | 'audio' | 'text' | 'threejs_effect';

export interface TransformSettings {
  scale: number; // 0.1 to 3.0
  x: number; // percentage offset -100 to 100
  y: number; // percentage offset -100 to 100
  rotation: number; // degrees
  crop?: { top: number; bottom: number; left: number; right: number };
}

export interface TextClipConfig {
  text: string;
  fontSize: number; // px
  fontFamily: 'Inter' | 'Impact' | 'Cinzel' | 'Montserrat' | 'Playfair Display' | 'JetBrains Mono';
  color: string;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  animationStyle: 'none' | 'bounce' | 'typewriter' | 'glow' | 'karaoke' | 'slide-up';
  alignment: 'left' | 'center' | 'right';
}

export type ThreePreset =
  | 'cyber-cube-hud'
  | 'kinetic-3d-title'
  | 'particle-portal'
  | 'floating-trophy'
  | 'neon-ring-visualizer';

export interface ThreeClipConfig {
  scenePreset: ThreePreset;
  titleText: string;
  colorScheme: 'gold-lux' | 'cyber-cyan' | 'neon-magenta' | 'emerald' | 'monochrome';
  speed: number;
  wireframe: boolean;
  roughness: number;
  metalness: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  sourceUrl: string; // Blob URL, object URL, data URL, or sample URL
  thumbnailUrl?: string;
  start: number; // start time on timeline in seconds
  duration: number; // duration on timeline in seconds
  sourceOffset: number; // start offset within media file
  sourceDuration: number; // intrinsic duration of source media
  speed: number; // playback multiplier (0.2x to 5.0x)
  volume: number; // 0.0 to 2.0
  isMuted: boolean;
  opacity: number; // 0.0 to 1.0
  transform: TransformSettings;
  filter: FilterSettings;
  transitionIn: TransitionConfig;
  transitionOut: TransitionConfig;
  textConfig?: TextClipConfig;
  threeConfig?: ThreeClipConfig;
  waveformData?: number[]; // precomputed audio peaks
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'threejs';
  isMuted?: boolean;
  isLocked?: boolean;
  isHidden?: boolean;
  volume?: number;
}

export interface AutoEditStyle {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  recommendedDuration: number; // seconds
  defaultLut: LutPreset;
  targetBpm: number;
  cutInterval: [number, number]; // min and max cut seconds
  defaultTransition: TransitionType;
  aspectRatio: AspectRatio;
  description: string;
}

export interface ProjectState {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  duration: number; // total timeline length in seconds
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  beatMarkers: number[]; // beat timestamps in seconds
  autoDucking: boolean;
  playhead: number; // current playhead in seconds
  isPlaying: boolean;
  selectedClipId: string | null;
  zoom: number; // pixels per second (e.g. 50 px/s)
  history: {
    past: ProjectSnapshot[];
    future: ProjectSnapshot[];
  };
}

export type ProjectSnapshot = Pick<
  ProjectState,
  'aspectRatio' | 'width' | 'height' | 'duration' | 'tracks' | 'clips' | 'beatMarkers' | 'autoDucking'
>;

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  duration?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  thumbnailUrl?: string;
  waveformData?: number[];
}
