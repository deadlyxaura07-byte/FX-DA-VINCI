import { ProjectState, TimelineClip, FilterSettings } from '../types/timeline';
import { audioEngine } from './audioEngine';

export interface ExportProgress {
  status: 'idle' | 'rendering' | 'encoding' | 'completed' | 'error';
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  message: string;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /**
   * Preloads image and video media elements
   */
  private async preloadMedia(clips: TimelineClip[]): Promise<void> {
    const promises = clips.map(async (clip) => {
      if (clip.type === 'image' || clip.type === 'video') {
        if (!this.imageCache.has(clip.sourceUrl) && !this.videoCache.has(clip.sourceUrl)) {
          // If video URL, create video element
          if (clip.sourceUrl.endsWith('.mp4') || clip.sourceUrl.endsWith('.webm') || clip.sourceUrl.startsWith('data:video')) {
            const vid = document.createElement('video');
            vid.src = clip.sourceUrl;
            vid.crossOrigin = 'anonymous';
            vid.muted = true;
            vid.playsInline = true;
            await new Promise((resolve) => {
              vid.onloadeddata = () => resolve(true);
              vid.onerror = () => resolve(false);
            });
            this.videoCache.set(clip.sourceUrl, vid);
          } else {
            // Image element
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = clip.sourceUrl;
            await new Promise((resolve) => {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
            });
            this.imageCache.set(clip.sourceUrl, img);
          }
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Applies CSS / Canvas color grading and filter pipeline
   */
  private applyFilterToContext(filter: FilterSettings, ctx: CanvasRenderingContext2D, width: number, height: number) {
    const exposureVal = 100 + filter.exposure;
    const contrastVal = 100 + filter.contrast;
    const brightnessVal = 100 + filter.brightness;
    const saturateVal = 100 + filter.saturation;

    // Build CSS filter string
    ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%)`;

    // LUT color temperature & tint emulation
    if (filter.lut === 'cinematic-teal-orange') {
      ctx.fillStyle = 'rgba(255, 140, 20, 0.12)';
      ctx.fillRect(0, 0, width, height);
    } else if (filter.lut === 'cyberpunk-neon') {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 0, 120, 0.08)';
      ctx.fillRect(0, 0, width, height);
    } else if (filter.lut === 'vintage-film-kodak') {
      ctx.fillStyle = 'rgba(240, 200, 140, 0.14)';
      ctx.fillRect(0, 0, width, height);
    } else if (filter.lut === 'monochrome-noir') {
      ctx.filter += ' grayscale(100%)';
    }

    // Temperature (cool blue vs warm orange)
    if (filter.temperature > 0) {
      ctx.fillStyle = `rgba(255, 160, 50, ${(filter.temperature / 100) * 0.25})`;
      ctx.fillRect(0, 0, width, height);
    } else if (filter.temperature < 0) {
      ctx.fillStyle = `rgba(60, 140, 255, ${(Math.abs(filter.temperature) / 100) * 0.25})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Vignette
    if (filter.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${(filter.vignette / 100) * 0.85})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /**
   * Renders a single frame at a specific timeline timestamp
   */
  public renderFrame(
    project: ProjectState,
    time: number,
    targetCanvas: HTMLCanvasElement = this.canvas
  ): void {
    const ctx = targetCanvas.getContext('2d')!;
    const { width, height } = project;

    targetCanvas.width = width;
    targetCanvas.height = height;

    // Background fill
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    // 1. Render Video / Base Clips (tracks v1, v2)
    const activeClips = project.clips.filter(
      (c) => c.start <= time && time <= c.start + c.duration && (c.type === 'video' || c.type === 'image')
    );

    // Sort by track order (v1 behind v2)
    activeClips.sort((a, b) => (a.trackId === 'v1' ? -1 : 1));

    activeClips.forEach((clip) => {
      ctx.save();

      // Transform
      const scale = clip.transform?.scale || 1;
      const posX = ((clip.transform?.x || 0) / 100) * width;
      const posY = ((clip.transform?.y || 0) / 100) * height;
      const rotation = ((clip.transform?.rotation || 0) * Math.PI) / 180;

      ctx.translate(width / 2 + posX, height / 2 + posY);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.globalAlpha = clip.opacity ?? 1;

      // Handle Transitions (Fade in / Whip pan / Flash)
      const clipElapsed = time - clip.start;
      const clipRemaining = clip.start + clip.duration - time;

      if (clip.transitionIn && clipElapsed < clip.transitionIn.duration) {
        const t = clipElapsed / clip.transitionIn.duration;
        if (clip.transitionIn.type === 'cross-dissolve' || clip.transitionIn.type === 'fade-black') {
          ctx.globalAlpha *= t;
        } else if (clip.transitionIn.type === 'flash-cut') {
          ctx.filter = `brightness(${100 + (1 - t) * 300}%)`;
        } else if (clip.transitionIn.type === 'zoom-blur') {
          ctx.scale(1 + (1 - t) * 0.4, 1 + (1 - t) * 0.4);
        }
      }

      if (clip.transitionOut && clipRemaining < clip.transitionOut.duration) {
        const t = clipRemaining / clip.transitionOut.duration;
        if (clip.transitionOut.type === 'cross-dissolve' || clip.transitionOut.type === 'fade-black') {
          ctx.globalAlpha *= t;
        }
      }

      // Draw Media
      const img = this.imageCache.get(clip.sourceUrl);
      const vid = this.videoCache.get(clip.sourceUrl);

      if (vid && vid.readyState >= 2) {
        // Compute time inside video
        const mediaTime = clip.sourceOffset + (clipElapsed * (clip.speed || 1));
        vid.currentTime = mediaTime % (vid.duration || 10);
        ctx.drawImage(vid, -width / 2, -height / 2, width, height);
      } else if (img) {
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
      } else {
        // Fallback procedural visualizer
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-width / 2, -height / 2, width, height);
        ctx.fillStyle = '#64748b';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(clip.name, 0, 0);
      }

      // Apply color filter
      this.applyFilterToContext(clip.filter, ctx, width, height);
      ctx.restore();
    });

    // 2. Render Text & Captions
    const activeTextClips = project.clips.filter(
      (c) => c.start <= time && time <= c.start + c.duration && c.type === 'text'
    );

    activeTextClips.forEach((clip) => {
      if (!clip.textConfig) return;
      const { text, fontSize, color, fontFamily, animationStyle, backgroundColor } = clip.textConfig;
      ctx.save();

      const elapsed = time - clip.start;
      const progress = elapsed / clip.duration;

      // Font
      ctx.font = `bold ${fontSize * (width / 1080)}px ${fontFamily || 'Inter'}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let yPos = height * 0.78; // default subtitle position
      let scale = 1;

      // Kinetic animations
      if (animationStyle === 'bounce') {
        const bounce = Math.sin(Math.min(1, elapsed * 4) * Math.PI) * 0.2;
        scale += bounce;
      } else if (animationStyle === 'typewriter') {
        const charCount = Math.floor(text.length * Math.min(1, elapsed * 3));
        const displayText = text.slice(0, charCount);
        ctx.fillStyle = color || '#ffffff';
        ctx.fillText(displayText, width / 2, yPos);
        ctx.restore();
        return;
      }

      ctx.translate(width / 2, yPos);
      ctx.scale(scale, scale);

      // Optional text background tag
      if (backgroundColor) {
        const textMetrics = ctx.measureText(text);
        const padX = 20;
        const padY = 12;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(
          -textMetrics.width / 2 - padX,
          -fontSize / 2 - padY,
          textMetrics.width + padX * 2,
          fontSize + padY * 2
        );
      }

      // Stroke / Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = color || '#ffffff';
      ctx.fillText(text, 0, 0);

      ctx.restore();
    });
  }

  /**
   * Exports full project to a downloadable video file (WebM / MP4)
   */
  public async exportVideo(
    project: ProjectState,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob> {
    onProgress({
      status: 'rendering',
      progress: 5,
      currentFrame: 0,
      totalFrames: Math.ceil(project.duration * project.fps),
      message: 'Preloading media assets...',
    });

    await this.preloadMedia(project.clips);

    const fps = project.fps || 30;
    const totalFrames = Math.ceil(project.duration * fps);
    this.canvas.width = project.width;
    this.canvas.height = project.height;

    // Prepare Web Audio mixed destination
    const audioCtx = audioEngine.getContext();
    const dest = audioCtx.createMediaStreamDestination();

    // Check for audio clips and connect them
    const musicTrack = await audioEngine.generateTrackBuffer('phonk', project.duration);
    const audioSource = audioCtx.createBufferSource();
    audioSource.buffer = musicTrack;
    audioSource.connect(dest);

    // Canvas stream
    const videoStream = this.canvas.captureStream(fps);
    const combinedTracks = [...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()];
    const combinedStream = new MediaStream(combinedTracks);

    // MediaRecorder options
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        onProgress({
          status: 'completed',
          progress: 100,
          currentFrame: totalFrames,
          totalFrames,
          message: 'Video export completed successfully!',
        });
        resolve(finalBlob);
      };

      recorder.onerror = (e) => {
        reject(e);
      };

      recorder.start();
      try {
        audioSource.start(0);
      } catch (e) {
        // ignore already started
      }

      // Render frame by frame
      let frame = 0;
      const frameDuration = 1 / fps;

      const renderNext = () => {
        if (frame >= totalFrames) {
          recorder.stop();
          try {
            audioSource.stop();
          } catch (e) {}
          return;
        }

        const currentTime = frame * frameDuration;
        this.renderFrame(project, currentTime, this.canvas);

        frame++;
        const percent = Math.min(98, Math.round((frame / totalFrames) * 95) + 5);
        onProgress({
          status: 'rendering',
          progress: percent,
          currentFrame: frame,
          totalFrames,
          message: `Rendering frame ${frame} of ${totalFrames} (${currentTime.toFixed(1)}s)`,
        });

        // Use requestAnimationFrame for steady capture
        requestAnimationFrame(renderNext);
      };

      renderNext();
    });
  }

  /**
   * Captures high-res still image frame as PNG data URL
   */
  public captureStillFrame(project: ProjectState, time: number): string {
    this.renderFrame(project, time, this.canvas);
    return this.canvas.toDataURL('image/png', 1.0);
  }
}

export const videoExporter = new VideoExporter();
