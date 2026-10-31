import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Upload,
  Video,
  Image as ImageIcon,
  Music,
  Trash2,
  Play,
  Film,
  Sparkles,
  Clock,
  HardDrive,
} from 'lucide-react';
import { MediaAsset, ProjectState, TimelineClip } from '../../types/timeline';

interface MediaLibraryViewProps {
  assets: MediaAsset[];
  onAddAsset: (asset: MediaAsset) => void;
  onRemoveAsset: (assetId: string) => void;
  onInsertClipToTimeline: (asset: MediaAsset) => void;
  project: ProjectState;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  assets,
  onAddAsset,
  onRemoveAsset,
  onInsertClipToTimeline,
  project,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'audio'>('all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(assets[0] || null);

  const filteredAssets = assets.filter((a) => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const isVid = file.type.startsWith('video');
      const isAud = file.type.startsWith('audio');
      const type = isVid ? 'video' : isAud ? 'audio' : 'image';

      const newAsset: MediaAsset = {
        id: `uploaded-${Date.now()}-${idx}`,
        name: file.name,
        type,
        url,
        duration: isVid ? 8 : isAud ? 20 : 5,
        thumbnailUrl: isVid || isAud ? undefined : url,
      };

      onAddAsset(newAsset);
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-950 text-zinc-300 select-none">
      {/* Assets Grid Left Pane */}
      <div className="flex-1 flex flex-col border-r border-zinc-800 overflow-hidden">
        {/* Sub-header */}
        <div className="h-12 border-b border-zinc-800 bg-zinc-900/60 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white text-xs">Project Media Pool ({filteredAssets.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              {(['all', 'video', 'image', 'audio'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    filterType === t ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Upload Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs cursor-pointer shadow-lg shadow-sky-500/20 transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Media</span>
              <input
                type="file"
                multiple
                accept="video/*,image/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Asset Cards Grid */}
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`group relative rounded-xl overflow-hidden border cursor-pointer aspect-video transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-500 shadow-xl'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {asset.type === 'image' || asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center p-3 text-center">
                      {asset.type === 'video' ? (
                        <Video className="w-8 h-8 text-sky-400/60 mb-1" />
                      ) : (
                        <Music className="w-8 h-8 text-emerald-400/60 mb-1" />
                      )}
                      <span className="text-[11px] text-zinc-400 truncate max-w-[90%] font-medium">
                        {asset.name}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay & Meta */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2.5 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 font-semibold uppercase tracking-wider text-sky-400">
                        {asset.type}
                      </span>
                      {asset.duration && (
                        <span className="text-[10px] text-zinc-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">
                          {asset.duration}s
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-white truncate">{asset.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Preview & Inspector Right Pane */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-950/80 p-5 flex flex-col justify-between overflow-y-auto">
        {selectedAsset ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asset Inspector</h3>

            {/* Preview Box */}
            <div className="aspect-video bg-black rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center">
              {selectedAsset.type === 'video' ? (
                <video
                  src={selectedAsset.url}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : selectedAsset.type === 'image' ? (
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Music className="w-10 h-10 text-emerald-400" />
                  <audio src={selectedAsset.url} controls className="w-60 h-8" />
                </div>
              )}
            </div>

            {/* Metadata Info */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">File Name</span>
                <span className="text-zinc-200 font-semibold truncate max-w-[150px]">{selectedAsset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Media Type</span>
                <span className="text-sky-400 uppercase font-mono text-[11px]">{selectedAsset.type}</span>
              </div>
              {selectedAsset.duration && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-zinc-300 font-mono">{selectedAsset.duration.toFixed(1)}s</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onInsertClipToTimeline(selectedAsset)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Insert onto Timeline at {project.playhead.toFixed(1)}s</span>
              </button>

              <button
                onClick={() => onRemoveAsset(selectedAsset.id)}
                className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 font-medium text-xs flex items-center justify-center gap-2 border border-zinc-800 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Library</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 text-xs py-10">Select an asset to inspect</div>
        )}
      </div>
    </div>
  );
};
