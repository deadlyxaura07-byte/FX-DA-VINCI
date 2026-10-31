import React from 'react';
import {
  Film,
  Sparkles,
  Sliders,
  FolderOpen,
  Undo2,
  Redo2,
  Download,
  ShieldCheck,
  Wand2,
  Tv,
} from 'lucide-react';
import { ProjectState } from '../../types/timeline';

interface HeaderProps {
  project: ProjectState;
  activeView: 'auto-edit' | 'pro-studio' | 'media-library' | 'ai-lab';
  setActiveView: (view: 'auto-edit' | 'pro-studio' | 'media-library' | 'ai-lab') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenPrivacy: () => void;
  onOpenAutoWizard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeView,
  setActiveView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenPrivacy,
  onOpenAutoWizard,
}) => {
  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">FX VERSE</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-sky-400 border border-zinc-700/60">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[140px] md:max-w-[200px]">
              {project.name}
            </p>
          </div>
        </div>

        {/* Project Spec Pill */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
          <span className="text-sky-400 font-semibold">{project.aspectRatio}</span>
          <span className="text-zinc-600">|</span>
          <span>{project.width}x{project.height}</span>
          <span className="text-zinc-600">|</span>
          <span>{project.fps} FPS</span>
          <span className="text-zinc-600">|</span>
          <span>{project.duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 text-xs">
        <button
          onClick={() => setActiveView('pro-studio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeView === 'pro-studio'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Pro Editor</span>
        </button>

        <button
          onClick={onOpenAutoWizard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Auto Edit</span>
        </button>

        <button
          onClick={() => setActiveView('ai-lab')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeView === 'ai-lab'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          <span className="hidden sm:inline">AI Studio Lab</span>
        </button>

        <button
          onClick={() => setActiveView('media-library')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeView === 'media-library'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Assets</span>
        </button>
      </div>

      {/* Actions: Undo/Redo & Export */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-zinc-800 rounded-lg bg-zinc-900/60 p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy & Trust Badge */}
        <button
          onClick={onOpenPrivacy}
          title="Privacy & Media Processing Details"
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 transition"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-lg shadow-sky-500/25 transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
