import React from 'react';
import { Move, Crop, Sparkles, FastForward, PlaySquare, Type } from 'lucide-react';
import { TimelineClip, TransitionType } from '../../types/timeline';

interface TransformPanelProps {
  selectedClip: TimelineClip | null;
  onUpdateClip: (updated: Partial<TimelineClip>) => void;
}

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'none', label: 'Cut (None)' },
  { id: 'cross-dissolve', label: 'Cross Dissolve' },
  { id: 'fade-black', label: 'Dip to Black' },
  { id: 'whip-pan', label: 'Whip Pan' },
  { id: 'glitch', label: 'RGB Glitch' },
  { id: 'zoom-blur', label: 'Zoom Punch' },
  { id: 'flash-cut', label: 'Flash Cut' },
];

export const TransformPanel: React.FC<TransformPanelProps> = ({
  selectedClip,
  onUpdateClip,
}) => {
  if (!selectedClip) {
    return (
      <div className="p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center h-full">
        <Move className="w-8 h-8 mb-2 opacity-30" />
        <p className="font-medium text-zinc-400">No Clip Selected</p>
        <p className="text-[11px] mt-1">Select a clip in the timeline to adjust scale, speed, transitions, or text.</p>
      </div>
    );
  }

  // Text Clip Custom Inspector
  if (clipIsText(selectedClip)) {
    const textCfg = selectedClip.textConfig || {
      text: 'Subtitle',
      fontSize: 48,
      fontFamily: 'Inter',
      color: '#ffffff',
      animationStyle: 'bounce',
      alignment: 'center',
    };

    return (
      <div className="p-4 space-y-4 text-xs text-zinc-300 overflow-y-auto max-h-full">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Type className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">Title & Caption Settings</span>
        </div>

        {/* Text string */}
        <div>
          <label className="text-[11px] text-zinc-400 mb-1 block">Caption Text</label>
          <input
            type="text"
            value={textCfg.text}
            onChange={(e) =>
              onUpdateClip({
                textConfig: { ...textCfg, text: e.target.value },
              })
            }
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Font size */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Font Size</span>
            <span className="font-mono text-zinc-300">{textCfg.fontSize}px</span>
          </div>
          <input
            type="range"
            min="24"
            max="120"
            value={textCfg.fontSize}
            onChange={(e) =>
              onUpdateClip({
                textConfig: { ...textCfg, fontSize: parseInt(e.target.value, 10) },
              })
            }
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="text-[11px] text-zinc-400 mb-1 block">Typography Style</label>
          <select
            value={textCfg.fontFamily}
            onChange={(e) =>
              onUpdateClip({
                textConfig: { ...textCfg, fontFamily: e.target.value as any },
              })
            }
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
          >
            <option value="Inter">Modern Sans (Inter)</option>
            <option value="Impact">Bold Gen-Z Meme (Impact)</option>
            <option value="Cinzel">Cinematic Serif (Cinzel)</option>
            <option value="Montserrat">Editorial Clean (Montserrat)</option>
            <option value="Playfair Display">Luxury Romance (Playfair)</option>
            <option value="JetBrains Mono">Tech Cyber (Monospace)</option>
          </select>
        </div>

        {/* Animation */}
        <div>
          <label className="text-[11px] text-zinc-400 mb-1 block">Kinetic Motion</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'bounce', label: 'TikTok Bounce' },
              { id: 'typewriter', label: 'Typewriter' },
              { id: 'glow', label: 'Neon Glow' },
              { id: 'none', label: 'Static' },
            ].map((anim) => (
              <button
                key={anim.id}
                onClick={() =>
                  onUpdateClip({
                    textConfig: { ...textCfg, animationStyle: anim.id as any },
                  })
                }
                className={`py-1.5 px-2 rounded-md border text-center transition ${
                  textCfg.animationStyle === anim.id
                    ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[11px] text-zinc-400 mb-1 block">Text Color</label>
            <input
              type="color"
              value={textCfg.color || '#ffffff'}
              onChange={(e) =>
                onUpdateClip({
                  textConfig: { ...textCfg, color: e.target.value },
                })
              }
              className="w-8 h-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 mb-1 block">Highlight Box</label>
            <button
              onClick={() =>
                onUpdateClip({
                  textConfig: {
                    ...textCfg,
                    backgroundColor: textCfg.backgroundColor ? undefined : 'rgba(255, 0, 80, 0.8)',
                  },
                })
              }
              className={`px-3 py-1.5 rounded text-xs border transition ${
                textCfg.backgroundColor
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {textCfg.backgroundColor ? 'Box Active' : 'No Box'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const transform = selectedClip.transform || { scale: 1, x: 0, y: 0, rotation: 0 };

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-300 overflow-y-auto max-h-full">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Move className="w-4 h-4 text-sky-400" />
        <span className="font-semibold text-white">Transform & Speed</span>
      </div>

      {/* Speed multiplier / Ramping */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Playback Speed</span>
          </span>
          <span className="font-mono text-amber-300">{selectedClip.speed || 1}x</span>
        </div>
        <div className="flex items-center gap-2">
          {[0.5, 1.0, 1.5, 2.0].map((spd) => (
            <button
              key={spd}
              onClick={() => onUpdateClip({ speed: spd })}
              className={`flex-1 py-1 rounded text-xs border transition ${
                selectedClip.speed === spd
                  ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-400">Scale / Zoom</span>
          <span className="font-mono text-zinc-300">{(transform.scale * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.05"
          value={transform.scale}
          onChange={(e) =>
            onUpdateClip({
              transform: { ...transform, scale: parseFloat(e.target.value) },
            })
          }
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Pan X and Y */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Pan X</span>
            <span className="font-mono text-zinc-300">{transform.x}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={transform.x}
            onChange={(e) =>
              onUpdateClip({
                transform: { ...transform, x: parseInt(e.target.value, 10) },
              })
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Pan Y</span>
            <span className="font-mono text-zinc-300">{transform.y}%</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={transform.y}
            onChange={(e) =>
              onUpdateClip({
                transform: { ...transform, y: parseInt(e.target.value, 10) },
              })
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-400">Rotation</span>
          <span className="font-mono text-zinc-300">{transform.rotation}°</span>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          value={transform.rotation}
          onChange={(e) =>
            onUpdateClip({
              transform: { ...transform, rotation: parseInt(e.target.value, 10) },
            })
          }
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Transitions */}
      <div className="pt-2 border-t border-zinc-800 space-y-3">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">
          Transition In
        </label>
        <select
          value={selectedClip.transitionIn?.type || 'none'}
          onChange={(e) =>
            onUpdateClip({
              transitionIn: {
                type: e.target.value as any,
                duration: selectedClip.transitionIn?.duration || 0.4,
              },
            })
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
        >
          {TRANSITIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

function clipIsText(clip: TimelineClip): boolean {
  return clip.type === 'text';
}
