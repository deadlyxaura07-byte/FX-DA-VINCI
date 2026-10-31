import React, { useState } from 'react';
import {
  Wand2,
  Check,
  Music,
  Video,
  Upload,
  Sparkles,
  ArrowRight,
  X,
  Play,
  Film,
  Zap,
  Compass,
  Gamepad2,
  Flame,
  Heart,
  BookOpen,
  Smartphone,
} from 'lucide-react';
import { AUTO_EDIT_STYLES, SAMPLE_MEDIA_ASSETS, SAMPLE_MUSIC_TRACKS } from '../../data/sampleAssets';
import { autoEditEngine } from '../../engine/autoEditEngine';
import { MediaAsset, ProjectState } from '../../types/timeline';
import { audioEngine } from '../../engine/audioEngine';

interface AutoEditWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedProject: (newProject: ProjectState) => void;
}

export const AutoEditWizardModal: React.FC<AutoEditWizardModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedProject,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset[]>([
    SAMPLE_MEDIA_ASSETS[0],
    SAMPLE_MEDIA_ASSETS[1],
    SAMPLE_MEDIA_ASSETS[2],
  ]);
  const [selectedMusicId, setSelectedMusicId] = useState<string>('track-phonk');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('gen-z-fast-cut');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Toggle media asset selection
  const toggleMediaSelection = (asset: MediaAsset) => {
    if (selectedMedia.some((m) => m.id === asset.id)) {
      if (selectedMedia.length > 1) {
        setSelectedMedia(selectedMedia.filter((m) => m.id !== asset.id));
      }
    } else {
      setSelectedMedia([...selectedMedia, asset]);
    }
  };

  // Upload custom video/photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAssets: MediaAsset[] = Array.from(files).map((file, idx) => {
      const url = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video');
      return {
        id: `user-upload-${Date.now()}-${idx}`,
        name: file.name,
        type: isVid ? 'video' : 'image',
        url,
        thumbnailUrl: isVid ? undefined : url,
        duration: isVid ? 10 : 5,
      };
    });

    setSelectedMedia((prev) => [...newAssets, ...prev]);
  };

  // Generate timeline
  const handleGenerateEdit = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generatedProject = autoEditEngine.generateTimeline(
        selectedMedia,
        selectedMusicId,
        selectedStyleId
      );
      onApplyGeneratedProject(generatedProject);
      setIsGenerating(false);
      onClose();
    }, 600);
  };

  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Film':
        return <Film className="w-5 h-5 text-sky-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-fuchsia-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-teal-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Auto Edit Generator</h2>
              <p className="text-xs text-zinc-400">Step {step} of 3 • Intelligent automatic video creation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="flex border-b border-zinc-800 text-xs font-semibold select-none bg-zinc-900/30">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              step === 1 ? 'border-sky-500 text-sky-400 bg-sky-500/10' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. Select Footage ({selectedMedia.length})
          </button>
          <button
            onClick={() => setStep(2)}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              step === 2 ? 'border-sky-500 text-sky-400 bg-sky-500/10' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Choose Music & Beats
          </button>
          <button
            onClick={() => setStep(3)}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              step === 3 ? 'border-sky-500 text-sky-400 bg-sky-500/10' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. Aesthetic Style
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: SELECT FOOTAGE */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">
                  Select video clips or photos for your edit:
                </span>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white cursor-pointer border border-zinc-700 transition">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Upload Local Videos / Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="video/*,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SAMPLE_MEDIA_ASSETS.map((asset) => {
                  const isSelected = selectedMedia.some((m) => m.id === asset.id);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleMediaSelection(asset)}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer aspect-video transition ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500'
                          : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-2.5 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-sky-500 text-white' : 'bg-black/50 text-transparent border border-white/40'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white truncate">{asset.name}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">{asset.duration}s</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE MUSIC */}
          {step === 2 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-300 block mb-2">
                Pick a beat-analyzed soundtrack (all audio is procedurally synthesized with zero 404 dependencies):
              </span>

              <div className="space-y-2.5">
                {SAMPLE_MUSIC_TRACKS.map((track) => {
                  const isSelected = selectedMusicId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => setSelectedMusicId(track.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const buffer = await audioEngine.generateTrackBuffer(track.audioGeneratorType, 6);
                            const ctx = audioEngine.getContext();
                            const src = ctx.createBufferSource();
                            src.buffer = buffer;
                            src.connect(ctx.destination);
                            src.start();
                          }}
                          className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-sky-500 text-white flex items-center justify-center transition shadow"
                        >
                          <Play className="w-4 h-4 ml-0.5" />
                        </button>
                        <div>
                          <h4 className="text-xs font-bold text-white">{track.name}</h4>
                          <p className="text-[11px] text-zinc-400">
                            {track.genre} • <span className="text-amber-400 font-mono">{track.bpm} BPM</span> • {track.beats.length} beat sync points
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-sky-500 text-white' : 'border border-zinc-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: AESTHETIC STYLE */}
          {step === 3 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-300 block mb-2">
                Choose an editorial style preset:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AUTO_EDIT_STYLES.map((style) => {
                  const isSelected = selectedStyleId === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyleId(style.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-zinc-800/80">
                            {getStyleIcon(style.icon)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{style.name}</h4>
                            <span className="text-[10px] text-sky-400 font-mono font-medium">
                              {style.aspectRatio} • {style.recommendedDuration}s
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-sky-500 text-white' : 'border border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-snug">{style.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium transition"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs text-white font-semibold shadow-lg shadow-sky-500/20 transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleGenerateEdit}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-xs text-white font-bold shadow-xl shadow-sky-500/30 transition active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGenerating ? 'Synthesizing Edit...' : 'Generate Polished Edit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
