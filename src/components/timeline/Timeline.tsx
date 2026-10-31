import React, { useRef, useState } from 'react';
import {
  Scissors,
  Trash2,
  Copy,
  Magnet,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Music,
  Video,
  Type,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ProjectState, TimelineClip, TimelineTrack } from '../../types/timeline';

interface TimelineProps {
  project: ProjectState;
  onUpdateProject: (updater: (prev: ProjectState) => ProjectState) => void;
  onSelectClip: (clipId: string | null) => void;
  onUpdatePlayhead: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  onUpdateProject,
  onSelectClip,
  onUpdatePlayhead,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [trimSide, setTrimSide] = useState<'left' | 'right' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [clipInitialStart, setClipInitialStart] = useState(0);
  const [clipInitialDuration, setClipInitialDuration] = useState(0);

  const zoom = project.zoom || 60; // pixels per second
  const timelineWidth = Math.max(1200, project.duration * zoom + 300);

  // Ruler seconds markers
  const secondMarkers: number[] = [];
  const step = zoom < 40 ? 5 : zoom < 80 ? 2 : 1;
  for (let s = 0; s <= Math.ceil(project.duration) + 5; s += step) {
    secondMarkers.push(s);
  }

  // Handle Playhead Scrub Click
  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    let newTime = Math.max(0, clickX / zoom);

    if (snapToGrid) {
      // Check snap to beats
      for (const beat of project.beatMarkers) {
        if (Math.abs(beat - newTime) < 0.15) {
          newTime = beat;
          break;
        }
      }
    }

    onUpdatePlayhead(Math.min(project.duration, parseFloat(newTime.toFixed(2))));
  };

  // Split clip at playhead
  const handleSplitAtPlayhead = () => {
    const playhead = project.playhead;
    const clipToSplit = project.clips.find(
      (c) => c.start < playhead && playhead < c.start + c.duration
    );

    if (!clipToSplit) return;

    const firstDuration = playhead - clipToSplit.start;
    const secondDuration = clipToSplit.duration - firstDuration;

    const firstClip: TimelineClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_split1`,
      duration: parseFloat(firstDuration.toFixed(2)),
    };

    const secondClip: TimelineClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_split2`,
      start: parseFloat(playhead.toFixed(2)),
      duration: parseFloat(secondDuration.toFixed(2)),
      sourceOffset: clipToSplit.sourceOffset + firstDuration * (clipToSplit.speed || 1),
    };

    onUpdateProject((prev) => ({
      ...prev,
      clips: prev.clips
        .filter((c) => c.id !== clipToSplit.id)
        .concat([firstClip, secondClip]),
      selectedClipId: secondClip.id,
    }));
    onSelectClip(secondClip.id);
  };

  // Delete selected clip
  const handleDeleteSelected = () => {
    if (!project.selectedClipId) return;
    onUpdateProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== prev.selectedClipId),
      selectedClipId: null,
    }));
    onSelectClip(null);
  };

  // Duplicate selected clip
  const handleDuplicateSelected = () => {
    const selected = project.clips.find((c) => c.id === project.selectedClipId);
    if (!selected) return;

    const newClip: TimelineClip = {
      ...selected,
      id: `clip-${Date.now()}`,
      start: parseFloat((selected.start + selected.duration + 0.1).toFixed(2)),
    };

    onUpdateProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
    }));
    onSelectClip(newClip.id);
  };

  // Ripple delete (closes the gap)
  const handleRippleDelete = () => {
    const selected = project.clips.find((c) => c.id === project.selectedClipId);
    if (!selected) return;

    const gap = selected.duration;
    const deletedStart = selected.start;
    const trackId = selected.trackId;

    onUpdateProject((prev) => ({
      ...prev,
      clips: prev.clips
        .filter((c) => c.id !== selected.id)
        .map((c) => {
          if (c.trackId === trackId && c.start > deletedStart) {
            return {
              ...c,
              start: Math.max(0, parseFloat((c.start - gap).toFixed(2))),
            };
          }
          return c;
        }),
      selectedClipId: null,
    }));
    onSelectClip(null);
  };

  // Start Trim Left/Right or Move Clip
  const handleClipMouseDown = (
    e: React.MouseEvent,
    clip: TimelineClip,
    side: 'left' | 'right' | 'move'
  ) => {
    e.stopPropagation();
    onSelectClip(clip.id);
    setDraggedClipId(clip.id);
    setTrimSide(side === 'move' ? null : side);
    setDragStartX(e.clientX);
    setClipInitialStart(clip.start);
    setClipInitialDuration(clip.duration);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - e.clientX;
      const deltaTime = deltaPx / zoom;

      onUpdateProject((prev) => {
        return {
          ...prev,
          clips: prev.clips.map((c) => {
            if (c.id !== clip.id) return c;

            if (side === 'move') {
              let newStart = Math.max(0, clipInitialStart + deltaTime);
              if (snapToGrid) {
                // Beat snapping
                for (const beat of prev.beatMarkers) {
                  if (Math.abs(beat - newStart) < 0.15) {
                    newStart = beat;
                    break;
                  }
                }
              }
              return { ...c, start: parseFloat(newStart.toFixed(2)) };
            } else if (side === 'left') {
              const maxDelta = clipInitialDuration - 0.2;
              const safeDelta = Math.min(deltaTime, maxDelta);
              const newStart = Math.max(0, clipInitialStart + safeDelta);
              const newDur = clipInitialDuration - safeDelta;
              return {
                ...c,
                start: parseFloat(newStart.toFixed(2)),
                duration: parseFloat(newDur.toFixed(2)),
                sourceOffset: Math.max(0, c.sourceOffset + safeDelta),
              };
            } else if (side === 'right') {
              const newDur = Math.max(0.2, clipInitialDuration + deltaTime);
              return { ...c, duration: parseFloat(newDur.toFixed(2)) };
            }
            return c;
          }),
        };
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setDraggedClipId(null);
      setTrimSide(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Track Icon & Color helper
  const getTrackIcon = (track: TimelineTrack) => {
    switch (track.type) {
      case 'threejs':
        return <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Video className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  // Clip styling by type
  const getClipStyle = (clip: TimelineClip) => {
    const isSelected = clip.id === project.selectedClipId;
    let bg = 'bg-sky-950/80 border-sky-600 text-sky-200';

    if (clip.type === 'threejs_effect') {
      bg = 'bg-fuchsia-950/80 border-fuchsia-600 text-fuchsia-200';
    } else if (clip.type === 'text') {
      bg = 'bg-amber-950/80 border-amber-600 text-amber-200';
    } else if (clip.type === 'audio') {
      bg = 'bg-emerald-950/80 border-emerald-600 text-emerald-200';
    }

    return `${bg} ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-black z-20' : 'opacity-90 hover:opacity-100'}`;
  };

  return (
    <div className="h-64 border-t border-zinc-800 bg-zinc-950 flex flex-col select-none">
      {/* Timeline Action Bar */}
      <div className="h-10 px-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Split at Playhead */}
          <button
            onClick={handleSplitAtPlayhead}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700/60 transition"
          >
            <Scissors className="w-3.5 h-3.5 text-sky-400" />
            <span>Split</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicateSelected}
            disabled={!project.selectedClipId}
            title="Duplicate Selected Clip"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-200 border border-zinc-700/60 transition"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Duplicate</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDeleteSelected}
            disabled={!project.selectedClipId}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-40 text-xs text-zinc-300 border border-zinc-700/60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Ripple Delete */}
          <button
            onClick={handleRippleDelete}
            disabled={!project.selectedClipId}
            title="Ripple Delete (Closes the gap)"
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs text-zinc-300 border border-zinc-700/60 transition"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Ripple Del</span>
          </button>

          {/* Snap toggle */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Toggle Beat & Clip Magnetic Snapping"
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition ${
              snapToGrid
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateProject((p) => ({ ...p, zoom: Math.max(20, (p.zoom || 60) - 15) }))}
            className="p-1 rounded text-zinc-400 hover:text-white transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-zinc-400 w-12 text-center">
            {zoom}px/s
          </span>
          <button
            onClick={() => onUpdateProject((p) => ({ ...p, zoom: Math.min(180, (p.zoom || 60) + 15) }))}
            className="p-1 rounded text-zinc-400 hover:text-white transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Multitrack Canvas & Headers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left Pane) */}
        <div className="w-44 border-r border-zinc-800 bg-zinc-950/95 flex flex-col z-10 select-none">
          {/* Header ruler placeholder */}
          <div className="h-6 border-b border-zinc-800/80 bg-zinc-900/80 px-2 flex items-center text-[10px] uppercase font-semibold text-zinc-500">
            Tracks
          </div>

          {/* Track Labels */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {project.tracks.map((track) => (
              <div
                key={track.id}
                className="h-10 px-2 flex items-center justify-between text-xs text-zinc-300 bg-zinc-950 hover:bg-zinc-900/40 transition"
              >
                <div className="flex items-center gap-2 truncate">
                  {getTrackIcon(track)}
                  <span className="truncate text-[11px] font-medium">{track.name}</span>
                </div>

                <div className="flex items-center gap-1 text-zinc-500">
                  <button
                    onClick={() =>
                      onUpdateProject((p) => ({
                        ...p,
                        tracks: p.tracks.map((t) => (t.id === track.id ? { ...t, isMuted: !t.isMuted } : t)),
                      }))
                    }
                    className="p-1 hover:text-zinc-200 transition"
                  >
                    {track.isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() =>
                      onUpdateProject((p) => ({
                        ...p,
                        tracks: p.tracks.map((t) => (t.id === track.id ? { ...t, isLocked: !t.isLocked } : t)),
                      }))
                    }
                    className="p-1 hover:text-zinc-200 transition"
                  >
                    {track.isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Tracks Lane (Right Pane) */}
        <div
          ref={timelineRef}
          onClick={handleTimelineScrub}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-zinc-950 cursor-pointer"
        >
          <div style={{ width: `${timelineWidth}px` }} className="relative h-full flex flex-col">
            {/* Timecode Ruler & Beat Markers */}
            <div className="h-6 border-b border-zinc-800 bg-zinc-900/90 relative select-none">
              {/* Second Markers */}
              {secondMarkers.map((sec) => (
                <div
                  key={sec}
                  style={{ left: `${sec * zoom}px` }}
                  className="absolute top-0 bottom-0 border-l border-zinc-700/60 pl-1 text-[9px] font-mono text-zinc-400"
                >
                  {sec}s
                </div>
              ))}

              {/* Beat Markers (Glowing Dots) */}
              {project.beatMarkers.map((beat, idx) => (
                <div
                  key={`beat-${idx}`}
                  style={{ left: `${beat * zoom}px` }}
                  title={`Musical Beat: ${beat}s`}
                  className="absolute bottom-0 w-1 h-2 bg-amber-400 rounded-t-sm shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                />
              ))}
            </div>

            {/* Playhead Vertical Line */}
            <div
              style={{ left: `${project.playhead * zoom}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.9)]"
            >
              {/* Playhead scrubber head */}
              <div className="w-3 h-3 bg-rose-500 rounded-sm -ml-1.5 rotate-45 transform" />
            </div>

            {/* Track Lanes */}
            <div className="flex-1 flex flex-col divide-y divide-zinc-900">
              {project.tracks.map((track) => {
                const trackClips = project.clips.filter((c) => c.trackId === track.id);

                return (
                  <div
                    key={track.id}
                    className="h-10 relative bg-zinc-950/60 hover:bg-zinc-900/20 transition"
                  >
                    {/* Render Clips on this track */}
                    {trackClips.map((clip) => {
                      const leftPx = clip.start * zoom;
                      const widthPx = Math.max(20, clip.duration * zoom);

                      return (
                        <div
                          key={clip.id}
                          style={{
                            left: `${leftPx}px`,
                            width: `${widthPx}px`,
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, clip, 'move')}
                          className={`absolute top-1 bottom-1 rounded border px-2 flex items-center justify-between text-xs cursor-grab active:cursor-grabbing transition-shadow ${getClipStyle(
                            clip
                          )}`}
                        >
                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={(e) => handleClipMouseDown(e, clip, 'left')}
                            className="absolute left-0 top-0 bottom-0 w-2 bg-white/20 hover:bg-white/60 cursor-ew-resize rounded-l"
                          />

                          {/* Clip Label */}
                          <div className="flex items-center gap-1.5 truncate pointer-events-none pl-1">
                            <span className="truncate text-[11px] font-semibold">{clip.name}</span>
                            {clip.speed !== 1 && (
                              <span className="text-[10px] px-1 rounded bg-black/40 text-amber-300">
                                {clip.speed}x
                              </span>
                            )}
                          </div>

                          {/* Audio Waveform visualization */}
                          {clip.type === 'audio' && (
                            <div className="flex items-center gap-0.5 opacity-60 ml-2">
                              <div className="w-0.5 h-3 bg-emerald-300 rounded-full"></div>
                              <div className="w-0.5 h-5 bg-emerald-300 rounded-full"></div>
                              <div className="w-0.5 h-2 bg-emerald-300 rounded-full"></div>
                              <div className="w-0.5 h-6 bg-emerald-300 rounded-full"></div>
                              <div className="w-0.5 h-4 bg-emerald-300 rounded-full"></div>
                            </div>
                          )}

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={(e) => handleClipMouseDown(e, clip, 'right')}
                            className="absolute right-0 top-0 bottom-0 w-2 bg-white/20 hover:bg-white/60 cursor-ew-resize rounded-r"
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
