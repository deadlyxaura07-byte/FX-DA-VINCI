import React, { useState } from 'react';
import {
  Download,
  Film,
  Camera,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { ProjectState } from '../../types/timeline';
import { ExportProgress, videoExporter } from '../../engine/videoExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectState;
  onLoadProject: (loadedProject: ProjectState) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onLoadProject,
}) => {
  const [exportPreset, setExportPreset] = useState<'vertical' | 'horizontal' | 'square'>('vertical');
  const [fps, setFps] = useState<30 | 60>(30);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stillFrameDataUrl, setStillFrameDataUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real canvas video export
  const handleStartExport = async () => {
    setDownloadUrl(null);

    // Compute dimensions according to preset
    const width = exportPreset === 'vertical' ? 1080 : exportPreset === 'square' ? 1080 : 1920;
    const height = exportPreset === 'vertical' ? 1920 : exportPreset === 'square' ? 1080 : 1080;

    const exportProject: ProjectState = {
      ...project,
      width,
      height,
      fps,
      aspectRatio: exportPreset === 'vertical' ? '9:16' : exportPreset === 'square' ? '1:1' : '16:9',
    };

    try {
      const videoBlob = await videoExporter.exportVideo(exportProject, (p) => {
        setExportProgress(p);
      });

      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      setExportProgress({
        status: 'error',
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        message: err.message || 'Failed to render video',
      });
    }
  };

  // Export Still Frame
  const handleExportStill = () => {
    const pngUrl = videoExporter.captureStillFrame(project, project.playhead);
    setStillFrameDataUrl(pngUrl);

    // Trigger instant download
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `${project.name.replace(/\s+/g, '_')}_frame_${project.playhead.toFixed(2)}s.png`;
    a.click();
  };

  // Export Project JSON backup
  const handleExportProjectJSON = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}.fxverse.json`;
    a.click();
  };

  // Import Project JSON
  const handleImportProjectJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onLoadProject(parsed);
        onClose();
      } catch (err) {
        alert('Invalid FX Verse project file format.');
      }
    };
    reader.readAsText(file);
  };

  // Estimated file size calculation
  const estMb = ((project.duration * 8000000) / (8 * 1024 * 1024)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Creator Export & Delivery</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-300">
          {/* Preset Buttons */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-2 block">
              Destination Format Preset
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'vertical', label: 'Vertical (9:16)', desc: '1080x1920 • Reels / Shorts / TikTok' },
                { id: 'horizontal', label: 'Standard (16:9)', desc: '1920x1080 • YouTube / Landscape' },
                { id: 'square', label: 'Square (1:1)', desc: '1080x1080 • Instagram Feed' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setExportPreset(p.id as any)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    exportPreset === p.id
                      ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="font-semibold text-white text-[11px]">{p.label}</span>
                  <span className="text-[10px] text-zinc-400 mt-1">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Framerate & Quality Stats */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Frame Rate</span>
              <div className="flex gap-2">
                {[30, 60].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setFps(rate as any)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-medium border transition ${
                      fps === rate
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {rate} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center text-right font-mono text-[11px] text-zinc-400">
              <span className="text-zinc-300 font-semibold">{project.duration.toFixed(1)}s Total Duration</span>
              <span className="flex items-center justify-end gap-1 text-[10px] text-zinc-500 mt-0.5">
                <HardDrive className="w-3 h-3" />
                Est. Size: ~{estMb} MB (8 Mbps VP9)
              </span>
            </div>
          </div>

          {/* Progress or Download Callout */}
          {exportProgress && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white flex items-center gap-2">
                  {exportProgress.status === 'rendering' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  ) : exportProgress.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{exportProgress.message}</span>
                </span>
                <span className="font-mono text-zinc-400">{exportProgress.progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${exportProgress.progress}%` }}
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-100"
                />
              </div>

              {downloadUrl && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={downloadUrl}
                    download={`${project.name.replace(/\s+/g, '_')}_rendered.webm`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Rendered Video</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
            {/* Still Frame & Project JSON */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportStill}
                title="Capture high-resolution still image at current playhead"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Snap Still (PNG)</span>
              </button>

              <button
                onClick={handleExportProjectJSON}
                title="Save non-destructive editing decisions as project file"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                <span>Save Project JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition">
                <span>Restore JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportProjectJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Main Video Render Button */}
            <button
              onClick={handleStartExport}
              disabled={exportProgress?.status === 'rendering'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-bold text-xs shadow-xl shadow-sky-500/25 transition active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>{exportProgress?.status === 'rendering' ? 'Rendering Video...' : 'Start Video Render'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
