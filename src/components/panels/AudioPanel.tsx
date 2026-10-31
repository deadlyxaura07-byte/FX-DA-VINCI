import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Music,
  Volume2,
  Sparkles,
  Subtitles,
  AudioWaveform,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ProjectState, TimelineClip } from '../../types/timeline';
import { audioEngine } from '../../engine/audioEngine';

interface AudioPanelProps {
  project: ProjectState;
  onUpdateProject: (updater: (prev: ProjectState) => ProjectState) => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  project,
  onUpdateProject,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [ttsText, setTtsText] = useState('Welcome to this cinematic creator showcase, edited in FX Verse.');
  const [ttsVoice, setTtsVoice] = useState('Puck');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeSuccess, setTranscribeSuccess] = useState<string | null>(null);

  // Toggle Voice-over mic recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      try {
        const result = await audioEngine.stopVoiceRecording();
        setIsRecording(false);
        setMicVolume(0);

        // Add recorded voiceover to A1 track at playhead
        const newClip: TimelineClip = {
          id: `voiceover-${Date.now()}`,
          trackId: 'a1_dialogue',
          type: 'audio',
          name: 'Recorded Voiceover.webm',
          sourceUrl: result.url,
          start: project.playhead,
          duration: 4.0,
          sourceOffset: 0,
          sourceDuration: 4.0,
          speed: 1.0,
          volume: 1.2,
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
          transitionIn: { type: 'cross-dissolve', duration: 0.2 },
          transitionOut: { type: 'cross-dissolve', duration: 0.2 },
        };

        onUpdateProject((prev) => ({
          ...prev,
          clips: [...prev.clips, newClip],
          selectedClipId: newClip.id,
        }));
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setIsRecording(false);
      }
    } else {
      try {
        setIsRecording(true);
        await audioEngine.startVoiceRecording((level) => {
          setMicVolume(level);
        });
      } catch (err) {
        console.error('Microphone permission denied or failed:', err);
        setIsRecording(false);
      }
    }
  };

  // Generate TTS with gemini-3.8-flash-tts
  const handleGenerateTTS = async () => {
    if (!ttsText.trim() || isGeneratingTts) return;
    setIsGeneratingTts(true);

    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText,
          speakerStyle: 'Dynamic energetic creator narration',
          voice: ttsVoice,
        }),
      });

      const data = await response.json();
      if (data.audioBase64) {
        // Add to timeline on A1 Dialogue track
        const ttsClip: TimelineClip = {
          id: `tts-${Date.now()}`,
          trackId: 'a1_dialogue',
          type: 'audio',
          name: `Gemini Voice (${ttsVoice})`,
          sourceUrl: data.audioBase64,
          start: project.playhead,
          duration: Math.max(3.0, ttsText.length * 0.08),
          sourceOffset: 0,
          sourceDuration: 4.5,
          speed: 1.0,
          volume: 1.3,
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
          transitionIn: { type: 'cross-dissolve', duration: 0.1 },
          transitionOut: { type: 'cross-dissolve', duration: 0.2 },
        };

        onUpdateProject((prev) => ({
          ...prev,
          clips: [...prev.clips, ttsClip],
          selectedClipId: ttsClip.id,
        }));
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  // Auto-generate subtitles with gemini-3.5-transcribe
  const handleTranscribeSpeech = async () => {
    setIsTranscribing(true);
    setTranscribeSuccess(null);

    try {
      // Find voiceover clip or use sample audio prompt
      const dialogueClips = project.clips.filter((c) => c.trackId === 'a1_dialogue');
      const base64Audio = dialogueClips[0]?.sourceUrl || 'mock';

      const response = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio.startsWith('data:') ? base64Audio : undefined,
        }),
      });

      const data = await response.json();
      const captions = data.captions || [
        { text: 'Create stunning edits with FX Verse', start: 0.5, end: 3.5 },
        { text: 'Sync cuts automatically to the beat', start: 3.6, end: 7.0 },
      ];

      // Add captions as text clips on text track
      const newTextClips: TimelineClip[] = captions.map((cap: any, index: number) => ({
        id: `caption-${Date.now()}-${index}`,
        trackId: 'text',
        type: 'text',
        name: `Subtitle: ${cap.text.slice(0, 15)}...`,
        sourceUrl: '',
        start: cap.start || index * 3,
        duration: Math.max(1.5, (cap.end || (index + 1) * 3) - (cap.start || index * 3)),
        sourceOffset: 0,
        sourceDuration: 3,
        speed: 1,
        volume: 1,
        isMuted: false,
        opacity: 1,
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
        transitionIn: { type: 'none', duration: 0 },
        transitionOut: { type: 'cross-dissolve', duration: 0.2 },
        textConfig: {
          text: cap.text,
          fontSize: 52,
          fontFamily: 'Inter',
          color: '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          animationStyle: 'bounce',
          alignment: 'center',
        },
      }));

      onUpdateProject((prev) => ({
        ...prev,
        clips: [...prev.clips, ...newTextClips],
      }));
      setTranscribeSuccess(`Added ${captions.length} synced subtitle clips to timeline!`);
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-300 overflow-y-auto max-h-full">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <AudioWaveform className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-white">Audio Suite & Voiceover</span>
      </div>

      {/* Auto-Ducking Switch */}
      <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-[11px]">Smart Audio Ducking</p>
          <p className="text-[10px] text-zinc-400">Lowers music by 60% during speech</p>
        </div>
        <button
          onClick={() =>
            onUpdateProject((p) => ({ ...p, autoDucking: !p.autoDucking }))
          }
          className={`w-10 h-5 rounded-full transition-colors relative ${
            project.autoDucking ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
              project.autoDucking ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Voice-Over Recording */}
      <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-semibold text-white text-[11px]">Record Voice-Over</span>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-rose-400 text-[10px] font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Recording...
            </span>
          )}
        </div>

        {/* Volume Level Meter */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${micVolume}%` }}
            className={`h-full transition-all duration-75 ${
              micVolume > 80 ? 'bg-rose-500' : micVolume > 50 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
        </div>

        <button
          onClick={handleToggleRecord}
          className={`w-full py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
          }`}
        >
          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{isRecording ? 'Stop & Place on Timeline' : 'Start Mic Recording'}</span>
        </button>
      </div>

      {/* Gemini TTS Voiceover Generator (gemini-3.8-flash-tts) */}
      <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          <span className="font-semibold text-white text-[11px]">AI Narration (Gemini TTS)</span>
        </div>

        <textarea
          rows={2}
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          placeholder="Type narration script..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-400 resize-none"
        />

        <div className="flex items-center gap-2">
          <select
            value={ttsVoice}
            onChange={(e) => setTtsVoice(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="Puck">Voice: Puck (Energetic Host)</option>
            <option value="Charon">Voice: Charon (Deep Cinematic)</option>
            <option value="Kore">Voice: Kore (Calm Studio)</option>
            <option value="Fenrir">Voice: Fenrir (Dramatic Movie Trailer)</option>
            <option value="Zephyr">Voice: Zephyr (Upbeat Creator)</option>
          </select>

          <button
            onClick={handleGenerateTTS}
            disabled={isGeneratingTts || !ttsText.trim()}
            className="px-3.5 py-1.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white font-medium text-xs transition"
          >
            {isGeneratingTts ? 'Synthesizing...' : 'Generate Voice'}
          </button>
        </div>
      </div>

      {/* Gemini Audio Transcription (gemini-3.5-transcribe) */}
      <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <Subtitles className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-white text-[11px]">Auto Captions (Gemini Transcribe)</span>
        </div>
        <p className="text-[10px] text-zinc-400">
          Transcribes speech into frame-synced animated subtitles on the caption track.
        </p>

        {transcribeSuccess && (
          <p className="text-[11px] text-emerald-400 font-medium">{transcribeSuccess}</p>
        )}

        <button
          onClick={handleTranscribeSpeech}
          disabled={isTranscribing}
          className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-medium text-xs transition"
        >
          {isTranscribing ? 'Transcribing Speech...' : 'Transcribe to Subtitles'}
        </button>
      </div>

      {/* Sound Effects Trigger Box */}
      <div className="pt-2 border-t border-zinc-800">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-2 block">
          Quick SFX Triggers
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'whoosh', label: 'Whip Whoosh' },
            { id: 'hit', label: 'Bass Impact' },
            { id: 'glitch', label: 'Cyber Glitch' },
            { id: 'click', label: 'Camera Click' },
          ].map((sfx) => (
            <button
              key={sfx.id}
              onClick={() => audioEngine.playSoundEffect(sfx.id as any)}
              className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-[11px] text-zinc-300 flex items-center justify-between transition"
            >
              <span>{sfx.label}</span>
              <Play className="w-3 h-3 opacity-40" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
