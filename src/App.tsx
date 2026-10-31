import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/navigation/Header';
import { VideoPlayer } from './components/preview/VideoPlayer';
import { Timeline } from './components/timeline/Timeline';
import { ColorGradingPanel } from './components/panels/ColorGradingPanel';
import { TransformPanel } from './components/panels/TransformPanel';
import { AudioPanel } from './components/panels/AudioPanel';
import { AiAssistantPanel } from './components/panels/AiAssistantPanel';
import { MediaLibraryView } from './components/views/MediaLibraryView';
import { AutoEditWizardModal } from './components/modals/AutoEditWizardModal';
import { ExportModal } from './components/modals/ExportModal';
import { PrivacyModal } from './components/modals/PrivacyModal';
import { ProjectState, TimelineClip, MediaAsset, FilterSettings } from './types/timeline';
import { autoEditEngine } from './engine/autoEditEngine';
import { SAMPLE_MEDIA_ASSETS } from './data/sampleAssets';
import { Palette, Move, AudioWaveform, Sliders } from 'lucide-react';

export default function App() {
  // Initialize with a high-energy Gen-Z / Cinematic starter edit
  const [project, setProject] = useState<ProjectState>(() => {
    return autoEditEngine.generateTimeline(
      [SAMPLE_MEDIA_ASSETS[0], SAMPLE_MEDIA_ASSETS[1], SAMPLE_MEDIA_ASSETS[2], SAMPLE_MEDIA_ASSETS[3]],
      'track-phonk',
      'gen-z-fast-cut'
    );
  });

  const [activeView, setActiveView] = useState<'pro-studio' | 'auto-edit' | 'media-library' | 'ai-lab'>('pro-studio');
  const [inspectorTab, setInspectorTab] = useState<'color' | 'transform' | 'audio'>('color');

  // Modals
  const [isAutoWizardOpen, setIsAutoWizardOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Media Library pool
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(SAMPLE_MEDIA_ASSETS);

  // Undo / Redo with history snapshot
  const updateProjectWithHistory = useCallback((updater: (prev: ProjectState) => ProjectState) => {
    setProject((prev) => {
      const next = updater(prev);
      const snapshot = {
        aspectRatio: prev.aspectRatio,
        width: prev.width,
        height: prev.height,
        duration: prev.duration,
        tracks: prev.tracks,
        clips: prev.clips,
        beatMarkers: prev.beatMarkers,
        autoDucking: prev.autoDucking,
      };

      return {
        ...next,
        history: {
          past: [...prev.history.past.slice(-20), snapshot],
          future: [],
        },
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    setProject((prev) => {
      if (prev.history.past.length === 0) return prev;
      const lastSnapshot = prev.history.past[prev.history.past.length - 1];
      const newPast = prev.history.past.slice(0, -1);
      const currentSnapshot = {
        aspectRatio: prev.aspectRatio,
        width: prev.width,
        height: prev.height,
        duration: prev.duration,
        tracks: prev.tracks,
        clips: prev.clips,
        beatMarkers: prev.beatMarkers,
        autoDucking: prev.autoDucking,
      };

      return {
        ...prev,
        ...lastSnapshot,
        history: {
          past: newPast,
          future: [currentSnapshot, ...prev.history.future],
        },
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setProject((prev) => {
      if (prev.history.future.length === 0) return prev;
      const nextSnapshot = prev.history.future[0];
      const newFuture = prev.history.future.slice(1);
      const currentSnapshot = {
        aspectRatio: prev.aspectRatio,
        width: prev.width,
        height: prev.height,
        duration: prev.duration,
        tracks: prev.tracks,
        clips: prev.clips,
        beatMarkers: prev.beatMarkers,
        autoDucking: prev.autoDucking,
      };

      return {
        ...prev,
        ...nextSnapshot,
        history: {
          past: [...prev.history.past, currentSnapshot],
          future: newFuture,
        },
      };
    });
  }, []);

  // Keyboard Shortcuts (Space: Play/Pause, Ctrl+Z: Undo, Ctrl+Y: Redo, S: Split)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setProject((p) => ({ ...p, isPlaying: !p.isPlaying }));
      } else if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.code === 'KeyY') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const selectedClip = project.clips.find((c) => c.id === project.selectedClipId) || null;

  // Insert clip from library onto timeline
  const handleInsertClipFromLibrary = (asset: MediaAsset) => {
    const isAudio = asset.type === 'audio';
    const trackId = isAudio ? 'a1_dialogue' : 'v1';

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId,
      type: asset.type === 'video' ? 'video' : asset.type === 'audio' ? 'audio' : 'image',
      name: asset.name,
      sourceUrl: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      start: project.playhead,
      duration: asset.duration || 4.0,
      sourceOffset: 0,
      sourceDuration: asset.duration || 10.0,
      speed: 1.0,
      volume: 1.0,
      isMuted: false,
      opacity: 1.0,
      transform: { scale: 1, x: 0, y: 0, rotation: 0 },
      filter: {
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
      },
      transitionIn: { type: 'cross-dissolve', duration: 0.3 },
      transitionOut: { type: 'none', duration: 0.3 },
    };

    updateProjectWithHistory((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
    }));
    setActiveView('pro-studio');
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-950 text-white font-sans overflow-hidden select-none">
      {/* Top Application Header */}
      <Header
        project={project}
        activeView={activeView}
        setActiveView={setActiveView}
        canUndo={project.history.past.length > 0}
        canRedo={project.history.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenAutoWizard={() => setIsAutoWizardOpen(true)}
      />

      {/* Main Workspace Area */}
      {activeView === 'pro-studio' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Half: Video Preview Viewport + Right Inspector Panels */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center Video Player Viewport */}
            <VideoPlayer
              project={project}
              onUpdatePlayhead={(time) => setProject((p) => ({ ...p, playhead: time }))}
              onTogglePlay={() => setProject((p) => ({ ...p, isPlaying: !p.isPlaying }))}
            />

            {/* Right Inspector Drawer */}
            <div className="w-80 lg:w-96 border-l border-zinc-800 bg-zinc-950 flex flex-col">
              {/* Tab Selector */}
              <div className="h-10 border-b border-zinc-800 bg-zinc-900/60 px-2 flex items-center gap-1 select-none">
                <button
                  onClick={() => setInspectorTab('color')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    inspectorTab === 'color'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Color & LUT</span>
                </button>

                <button
                  onClick={() => setInspectorTab('transform')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    inspectorTab === 'transform'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 text-amber-400" />
                  <span>Transform</span>
                </button>

                <button
                  onClick={() => setInspectorTab('audio')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    inspectorTab === 'audio'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <AudioWaveform className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audio Suite</span>
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto">
                {inspectorTab === 'color' && (
                  <ColorGradingPanel
                    selectedClip={selectedClip}
                    onUpdateFilter={(f) =>
                      updateProjectWithHistory((prev) => ({
                        ...prev,
                        clips: prev.clips.map((c) => (c.id === selectedClip?.id ? { ...c, filter: f } : c)),
                      }))
                    }
                    onApplyToAllClips={(f) =>
                      updateProjectWithHistory((prev) => ({
                        ...prev,
                        clips: prev.clips.map((c) =>
                          c.type === 'video' || c.type === 'image' ? { ...c, filter: { ...f } } : c
                        ),
                      }))
                    }
                  />
                )}

                {inspectorTab === 'transform' && (
                  <TransformPanel
                    selectedClip={selectedClip}
                    onUpdateClip={(updated) =>
                      updateProjectWithHistory((prev) => ({
                        ...prev,
                        clips: prev.clips.map((c) => (c.id === selectedClip?.id ? { ...c, ...updated } : c)),
                      }))
                    }
                  />
                )}

                {inspectorTab === 'audio' && (
                  <AudioPanel
                    project={project}
                    onUpdateProject={updateProjectWithHistory}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Half: Professional Multitrack Timeline */}
          <Timeline
            project={project}
            onUpdateProject={updateProjectWithHistory}
            onSelectClip={(clipId) => setProject((p) => ({ ...p, selectedClipId: clipId }))}
            onUpdatePlayhead={(time) => setProject((p) => ({ ...p, playhead: time }))}
          />
        </div>
      )}

      {/* AI Creative Lab View */}
      {activeView === 'ai-lab' && (
        <AiAssistantPanel
          project={project}
          onUpdateProject={updateProjectWithHistory}
          onAddMediaAsset={(asset) => setMediaAssets((prev) => [asset, ...prev])}
        />
      )}

      {/* Media Library View */}
      {activeView === 'media-library' && (
        <MediaLibraryView
          assets={mediaAssets}
          onAddAsset={(asset) => setMediaAssets((prev) => [asset, ...prev])}
          onRemoveAsset={(id) => setMediaAssets((prev) => prev.filter((a) => a.id !== id))}
          onInsertClipToTimeline={handleInsertClipFromLibrary}
          project={project}
        />
      )}

      {/* Modals */}
      <AutoEditWizardModal
        isOpen={isAutoWizardOpen}
        onClose={() => setIsAutoWizardOpen(false)}
        onApplyGeneratedProject={(genProj) => {
          setProject(genProj);
          setActiveView('pro-studio');
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        onLoadProject={(loaded) => setProject(loaded)}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
