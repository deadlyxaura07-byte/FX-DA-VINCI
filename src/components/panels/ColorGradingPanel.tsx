import React from 'react';
import { Palette, Sparkles, Sliders, RotateCcw, CheckCheck } from 'lucide-react';
import { FilterSettings, LutPreset, TimelineClip } from '../../types/timeline';

interface ColorGradingPanelProps {
  selectedClip: TimelineClip | null;
  onUpdateFilter: (filter: FilterSettings) => void;
  onApplyToAllClips?: (filter: FilterSettings) => void;
}

const LUT_PRESETS: { id: LutPreset; label: string; desc: string; previewColor: string }[] = [
  { id: 'none', label: 'Standard Rec.709', desc: 'Natural balanced profile', previewColor: 'bg-zinc-700' },
  { id: 'cinematic-teal-orange', label: 'Teal & Orange (Kodak 2383)', desc: 'Warm skin tones & cyan shadows', previewColor: 'bg-gradient-to-r from-cyan-600 to-amber-600' },
  { id: 'cyberpunk-neon', label: 'Cyberpunk Neon', desc: 'Vibrant magenta, electric cyan', previewColor: 'bg-gradient-to-r from-pink-600 to-cyan-500' },
  { id: 'vintage-film-kodak', label: 'Vintage 35mm Film', desc: 'Golden nostalgia & soft grain', previewColor: 'bg-gradient-to-r from-amber-700 to-yellow-600' },
  { id: 'monochrome-noir', label: 'Monochrome Noir', desc: 'Punchy high-contrast black & white', previewColor: 'bg-gradient-to-r from-black to-zinc-200' },
  { id: 'warm-sunset', label: 'Sunset Glow', desc: 'Golden hour honey highlights', previewColor: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  { id: 'bleach-bypass', label: 'Bleach Bypass', desc: 'Desaturated gritty silver halide', previewColor: 'bg-gradient-to-r from-zinc-800 to-zinc-400' },
];

export const ColorGradingPanel: React.FC<ColorGradingPanelProps> = ({
  selectedClip,
  onUpdateFilter,
  onApplyToAllClips,
}) => {
  if (!selectedClip) {
    return (
      <div className="p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center h-full">
        <Palette className="w-8 h-8 mb-2 opacity-30" />
        <p className="font-medium text-zinc-400">No Clip Selected</p>
        <p className="text-[11px] mt-1">Select a video or image clip in the timeline to grade colors.</p>
      </div>
    );
  }

  const filter = selectedClip.filter;

  const handleChange = (key: keyof FilterSettings, value: any) => {
    onUpdateFilter({
      ...filter,
      [key]: value,
    });
  };

  const handleReset = () => {
    onUpdateFilter({
      exposure: 0,
      contrast: 0,
      brightness: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      shadows: 0,
      highlights: 0,
      vignette: 0,
      lut: 'none',
    });
  };

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-300 overflow-y-auto max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-white">Color Grade & LUTs</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1-Click LUT Presets */}
      <div>
        <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-2.5 block">
          Cinematic LUT Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {LUT_PRESETS.map((lut) => (
            <button
              key={lut.id}
              onClick={() => handleChange('lut', lut.id)}
              className={`p-2 rounded-lg border text-left transition flex flex-col gap-1.5 ${
                filter.lut === lut.id
                  ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className={`w-full h-3 rounded ${lut.previewColor}`} />
              <div>
                <p className="font-semibold text-white text-[11px] truncate">{lut.label}</p>
                <p className="text-[10px] text-zinc-400 truncate">{lut.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Adjustments Sliders */}
      <div className="space-y-3.5 pt-2 border-t border-zinc-800">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">
          Tone & Exposure
        </label>

        {/* Exposure */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Exposure</span>
            <span className="font-mono text-zinc-300">{filter.exposure}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filter.exposure}
            onChange={(e) => handleChange('exposure', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Contrast</span>
            <span className="font-mono text-zinc-300">{filter.contrast}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filter.contrast}
            onChange={(e) => handleChange('contrast', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Saturation</span>
            <span className="font-mono text-zinc-300">{filter.saturation}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filter.saturation}
            onChange={(e) => handleChange('saturation', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Temperature (Cool Blue vs Warm Orange) */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Temperature (Kelvin)</span>
            <span className="font-mono text-zinc-300">
              {filter.temperature > 0 ? `+${filter.temperature} (Warm)` : filter.temperature < 0 ? `${filter.temperature} (Cool)` : '0'}
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={filter.temperature}
            onChange={(e) => handleChange('temperature', parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Vignette */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-zinc-400">Vignette Falloff</span>
            <span className="font-mono text-zinc-300">{filter.vignette}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={filter.vignette}
            onChange={(e) => handleChange('vignette', parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Apply to All Clips button */}
      {onApplyToAllClips && (
        <div className="pt-3">
          <button
            onClick={() => onApplyToAllClips(filter)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700/80 transition"
          >
            <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Apply Grade to All Video Clips</span>
          </button>
        </div>
      )}
    </div>
  );
};
