import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Grid,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ProjectState } from '../../types/timeline';
import { videoExporter } from '../../engine/videoExporter';
import { ThreeViewport } from '../three/ThreeViewport';

interface VideoPlayerProps {
  project: ProjectState;
  onUpdatePlayhead: (time: number) => void;
  onTogglePlay: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  onUpdatePlayhead,
  onTogglePlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Active 3D clip check at current playhead
  const active3DClip = project.clips.find(
    (c) =>
      c.type === 'threejs_effect' &&
      c.start <= project.playhead &&
      project.playhead <= c.start + c.duration
  );

  // Render video frame onto canvas whenever playhead or project state updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    videoExporter.renderFrame(project, project.playhead, canvas);
  }, [project.playhead, project.clips, project.aspectRatio, project.width, project.height]);

  // Handle play loop
  useEffect(() => {
    if (!project.isPlaying) return;

    let animId: number;
    let lastStamp = performance.now();

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastStamp) / 1000;
      lastStamp = timestamp;

      const nextTime = project.playhead + delta;
      if (nextTime >= project.duration) {
        onUpdatePlayhead(0);
      } else {
        onUpdatePlayhead(nextTime);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [project.isPlaying, project.playhead, project.duration, onUpdatePlayhead]);

  // Format timecode
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * project.fps);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(
      frames
    ).padStart(2, '0')}`;
  };

  // Compute player aspect ratio box
  const isVertical = project.aspectRatio === '9:16';
  const isSquare = project.aspectRatio === '1:1';

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-zinc-950 flex flex-col items-center justify-center p-3 select-none overflow-hidden"
    >
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          {formatTimecode(project.playhead)} / {formatTimecode(project.duration)}
        </span>

        {active3DClip && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-fuchsia-950/80 border border-fuchsia-800/60 text-[11px] text-fuchsia-300">
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            <span>3D VFX Active</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 rounded-lg p-1 text-zinc-400">
        <button
          onClick={() => setShowSafeZones(!showSafeZones)}
          title="Toggle Social Media Safe Zones (TikTok/Reels UI)"
          className={`p-1.5 rounded transition ${
            showSafeZones ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Rule of Thirds Grid"
          className={`p-1.5 rounded transition ${
            showGrid ? 'bg-zinc-800 text-sky-400' : 'hover:text-zinc-200'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded hover:text-zinc-200 transition"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Viewport Box */}
      <div
        className={`relative flex items-center justify-center bg-black border border-zinc-800 shadow-2xl rounded-lg overflow-hidden transition-all duration-300 max-h-[82%] ${
          isVertical ? 'aspect-[9/16] w-auto h-full max-w-[380px]' : isSquare ? 'aspect-square h-full max-w-[500px]' : 'aspect-video w-full max-w-[840px]'
        }`}
      >
        {/* Main 2D Video / Image / Composite Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Live 3D Three.js Layer when active */}
        {active3DClip && active3DClip.threeConfig && (
          <div className="absolute inset-0 pointer-events-auto">
            <ThreeViewport
              config={active3DClip.threeConfig}
              isOverlayMode={true}
            />
          </div>
        )}

        {/* Rule of Thirds Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-sky-400/20">
            <div className="border-r border-b border-sky-400/25"></div>
            <div className="border-r border-b border-sky-400/25"></div>
            <div className="border-b border-sky-400/25"></div>
            <div className="border-r border-b border-sky-400/25"></div>
            <div className="border-r border-b border-sky-400/25"></div>
            <div className="border-b border-sky-400/25"></div>
            <div className="border-r border-sky-400/25"></div>
            <div className="border-r border-sky-400/25"></div>
            <div></div>
          </div>
        )}

        {/* Social Media Safe Zones (TikTok / Reels / Shorts UI borders) */}
        {showSafeZones && isVertical && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 border-2 border-dashed border-amber-400/40">
            {/* Header safe margin */}
            <div className="h-14 border-b border-amber-400/30 flex items-center justify-between text-[10px] text-amber-300/60 font-mono">
              <span>Following | For You</span>
              <span>Search</span>
            </div>
            {/* Side icons safe margin */}
            <div className="self-end flex flex-col gap-3 py-6 pr-1 text-[10px] text-amber-300/60 font-mono">
              <span>● Like</span>
              <span>● Comment</span>
              <span>● Bookmark</span>
              <span>● Share</span>
            </div>
            {/* Bottom caption safe margin */}
            <div className="h-20 border-t border-amber-400/30 flex flex-col justify-end text-[10px] text-amber-300/60 font-mono">
              <span>@creator_handle • captions safe area</span>
            </div>
          </div>
        )}
      </div>

      {/* Playback Transport Floating Bar */}
      <div className="absolute bottom-4 z-20 flex items-center gap-3 px-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-full shadow-xl">
        <button
          onClick={() => onUpdatePlayhead(0)}
          title="Jump to Start (Home)"
          className="p-1.5 rounded-full text-zinc-400 hover:text-white transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          title="Play / Pause (Space)"
          className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 transition active:scale-95"
        >
          {project.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="text-xs font-mono text-zinc-400">
          {formatTimecode(project.playhead)}
        </div>
      </div>
    </div>
  );
};
