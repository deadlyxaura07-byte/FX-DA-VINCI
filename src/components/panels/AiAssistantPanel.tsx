import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Video,
  Image as ImageIcon,
  Search,
  MessageSquare,
  CheckCircle2,
  Undo2,
  Loader2,
  Send,
  Zap,
} from 'lucide-react';
import { ProjectState, TimelineClip } from '../../types/timeline';

interface AiAssistantPanelProps {
  project: ProjectState;
  onUpdateProject: (updater: (prev: ProjectState) => ProjectState) => void;
  onAddMediaAsset?: (asset: any) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  project,
  onUpdateProject,
  onAddMediaAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'assistant' | 'video-gen' | 'image-gen' | 'trends' | 'live-voice'>('assistant');

  // Assistant State
  const [prompt, setPrompt] = useState('');
  const [useThinking, setUseThinking] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<any | null>(null);

  // Video Gen State (gemini-omni-1.1-flash via Interactions API)
  const [videoPrompt, setVideoPrompt] = useState('Cinematic aerial drone shot flying over neon cyber skyscraper in rain, 4k 60fps');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [videoDuration, setVideoDuration] = useState<'5s' | '10s'>('5s');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoResult, setGeneratedVideoResult] = useState<string | null>(null);

  // Image Gen State (gemini-3-pro-image-preview with 1K/2K/4K)
  const [imagePrompt, setImagePrompt] = useState('Epic futuristic cyber armor movie poster, dramatic studio lighting');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageResult, setGeneratedImageResult] = useState<string | null>(null);

  // Search Grounding State (gemini-3.8-flash with googleSearch)
  const [trendQuery, setTrendQuery] = useState('viral TikTok Reels editing styles, fast cuts, trending audio vibes 2026');
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);
  const [trendResults, setTrendResults] = useState<any | null>(null);

  // Live Voice State (gemini-3.8-live)
  const [liveMessage, setLiveMessage] = useState('');
  const [liveChatHistory, setLiveChatHistory] = useState<{ role: string; text: string }[]>([
    { role: 'assistant', text: "Hey! I'm your live editing co-director. Want me to analyze your pacing, recommend transitions, or grade a look?" },
  ]);
  const [isLiveTalking, setIsLiveTalking] = useState(false);

  // Execute Assistant Edit
  const handleRunAssistant = async () => {
    if (!prompt.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          currentProject: {
            aspectRatio: project.aspectRatio,
            duration: project.duration,
            clipsCount: project.clips.length,
            clips: project.clips.map((c) => ({
              id: c.id,
              type: c.type,
              start: c.start,
              duration: c.duration,
              speed: c.speed,
              lut: c.filter.lut,
            })),
          },
          useThinking,
        }),
      });

      const data = await response.json();
      setLastResponse(data);

      // Auto-apply operations to timeline
      if (data.operations && Array.isArray(data.operations)) {
        applyOperationsToTimeline(data.operations);
      }
    } catch (err) {
      console.error('AI assistant error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Applies AI operations cleanly to ProjectState
  const applyOperationsToTimeline = (operations: any[]) => {
    onUpdateProject((prev) => {
      let updatedClips = [...prev.clips];
      let updatedAspectRatio = prev.aspectRatio;
      let updatedWidth = prev.width;
      let updatedHeight = prev.height;

      operations.forEach((op: any) => {
        if (op.action === 'SET_ASPECT_RATIO' && op.params?.aspectRatio) {
          updatedAspectRatio = op.params.aspectRatio;
          const isVert = updatedAspectRatio === '9:16';
          updatedWidth = isVert ? 1080 : 1920;
          updatedHeight = isVert ? 1920 : 1080;
        } else if (op.action === 'SET_COLOR_GRADE' && op.params) {
          updatedClips = updatedClips.map((c) => {
            if (c.type === 'video' || c.type === 'image') {
              return {
                ...c,
                filter: {
                  ...c.filter,
                  ...op.params,
                },
              };
            }
            return c;
          });
        } else if (op.action === 'ADJUST_SPEED' && op.params?.speed) {
          updatedClips = updatedClips.map((c) => {
            if (c.type === 'video') {
              return { ...c, speed: op.params.speed };
            }
            return c;
          });
        } else if (op.action === 'SET_TRANSITION' && op.params) {
          updatedClips = updatedClips.map((c) => {
            if (c.type === 'video') {
              return {
                ...c,
                transitionIn: {
                  type: op.params.transitionIn || 'zoom-blur',
                  duration: op.params.duration || 0.35,
                },
              };
            }
            return c;
          });
        } else if (op.action === 'ADD_TEXT_OVERLAY' && op.params) {
          const textClip: TimelineClip = {
            id: `ai-text-${Date.now()}`,
            trackId: 'text',
            type: 'text',
            name: op.params.text.slice(0, 16),
            sourceUrl: '',
            start: op.params.start || 0.5,
            duration: op.params.duration || 3.0,
            sourceOffset: 0,
            sourceDuration: 3.0,
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
            transitionOut: { type: 'cross-dissolve', duration: 0.3 },
            textConfig: {
              text: op.params.text,
              fontSize: 54,
              fontFamily: 'Inter',
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.7)',
              animationStyle: op.params.animation || 'bounce',
              alignment: 'center',
            },
          };
          updatedClips.push(textClip);
        }
      });

      return {
        ...prev,
        aspectRatio: updatedAspectRatio,
        width: updatedWidth,
        height: updatedHeight,
        clips: updatedClips,
      };
    });
  };

  // Video Generation Call (gemini-omni-1.1-flash)
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isGeneratingVideo) return;
    setIsGeneratingVideo(true);
    setGeneratedVideoResult(null);

    try {
      const response = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          duration: videoDuration,
        }),
      });

      const data = await response.json();
      if (data.videoBase64) {
        setGeneratedVideoResult(data.videoBase64);
        // Add to media library
        onAddMediaAsset?.({
          id: `ai-video-${Date.now()}`,
          name: 'AI Generated Scene.mp4',
          type: 'video',
          url: data.videoBase64,
          duration: 5,
        });
      }
    } catch (err) {
      console.error('Video generation error:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Image Generation Call (gemini-3-pro-image-preview with 1K/2K/4K)
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImageResult(null);

    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          imageSize,
          aspectRatio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImageResult(data.imageUrl);
        onAddMediaAsset?.({
          id: `ai-img-${Date.now()}`,
          name: `AI Photo (${imageSize}).png`,
          type: 'image',
          url: data.imageUrl,
          duration: 5,
        });
      }
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Search Trends Call
  const handleSearchTrends = async () => {
    setIsSearchingTrends(true);
    try {
      const response = await fetch('/api/gemini/search-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trendQuery }),
      });
      const data = await response.json();
      setTrendResults(data);
    } catch (err) {
      console.error('Search trends error:', err);
    } finally {
      setIsSearchingTrends(false);
    }
  };

  // Live Voice Assistant Conversation
  const handleSendLiveMessage = async () => {
    if (!liveMessage.trim() || isLiveTalking) return;
    const userText = liveMessage;
    setLiveMessage('');
    setLiveChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLiveTalking(true);

    try {
      const response = await fetch('/api/gemini/live-converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
          conversationHistory: liveChatHistory,
        }),
      });
      const data = await response.json();
      setLiveChatHistory((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      console.error('Live voice error:', err);
    } finally {
      setIsLiveTalking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-xs text-zinc-300 overflow-hidden">
      {/* Sub-nav tabs */}
      <div className="h-11 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'assistant'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Timeline Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('video-gen')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'video-gen'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-sky-400" />
          <span>AI Video Gen</span>
        </button>

        <button
          onClick={() => setActiveTab('image-gen')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'image-gen'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Image 4K</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'trends'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span>Search Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('live-voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
            activeTab === 'live-voice'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
          <span>Live Co-Director</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {/* 1. TIMELINE COPILOT (gemini-4-argon with thinkingLevel: HIGH) */}
        {activeTab === 'assistant' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-fuchsia-400" />
                  <span className="font-semibold text-white">AI Video Editing Architect</span>
                </div>

                {/* Thinking Mode Toggle */}
                <button
                  onClick={() => setUseThinking(!useThinking)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition ${
                    useThinking
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Thinking Mode (Gemini 4 Argon)</span>
                </button>
              </div>

              <p className="text-zinc-400 text-xs">
                Request intelligent cuts, pacing changes, color grading, beat sync, or subtitle hooks.
                The assistant produces actual, reviewable timeline operations.
              </p>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  'Sync cuts to phonk beats and add glitch impact transitions',
                  'Grade with a moody cyberpunk teal & orange look and reframe for 9:16 vertical',
                  'Make this montage faster (1.5x velocity ramp) with a bold hook title',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(q)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAssistant()}
                  placeholder="e.g. Create a 30-second travel edit with warm sunset grading and energetic cuts..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-fuchsia-500"
                />
                <button
                  onClick={handleRunAssistant}
                  disabled={isProcessing || !prompt.trim()}
                  className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-2 transition"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Execute Cut</span>
                </button>
              </div>
            </div>

            {/* AI Reviewable Operations Result */}
            {lastResponse && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold text-white">Editorial Decisions Applied</span>
                </div>

                <p className="text-zinc-300 leading-relaxed">{lastResponse.summary}</p>

                {lastResponse.reasoningNotes && (
                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400">
                    <span className="font-semibold text-zinc-300 block mb-1">Director's Insight:</span>
                    {lastResponse.reasoningNotes}
                  </div>
                )}

                {/* Operations List */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Applied Timeline Operations ({lastResponse.operations?.length || 0}):
                  </span>
                  {lastResponse.operations?.map((op: any, i: number) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between font-mono text-[11px]"
                    >
                      <span className="text-sky-400 font-semibold">{op.action}</span>
                      <span className="text-zinc-500 truncate max-w-[280px]">
                        {JSON.stringify(op.params)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. AI VIDEO GENERATION (gemini-omni-1.1-flash via Interactions API) */}
        {activeTab === 'video-gen' && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-white">Generate Video (Gemini Omni Flash)</span>
            </div>
            <p className="text-zinc-400 text-xs">
              Generate full video clips from natural language prompts using the official Interactions API with model{' '}
              <code className="text-sky-400 font-mono">gemini-omni-1.1-flash</code>.
            </p>

            <textarea
              rows={3}
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Describe the cinematic scene you want to generate..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-sky-500 resize-none"
            />

            <div className="flex flex-wrap items-center gap-4">
              {/* Aspect Ratio */}
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Aspect Ratio</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`px-3 py-1.5 rounded-md border text-xs transition ${
                      videoAspectRatio === '9:16'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    9:16 (Vertical Reel)
                  </button>
                  <button
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`px-3 py-1.5 rounded-md border text-xs transition ${
                      videoAspectRatio === '16:9'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    16:9 (Widescreen)
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Clip Duration</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoDuration('5s')}
                    className={`px-3 py-1.5 rounded-md border text-xs transition ${
                      videoDuration === '5s'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    5 Seconds
                  </button>
                  <button
                    onClick={() => setVideoDuration('10s')}
                    className={`px-3 py-1.5 rounded-md border text-xs transition ${
                      videoDuration === '10s'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    10 Seconds
                  </button>
                </div>
              </div>

              <div className="flex-1 flex justify-end items-end pt-4">
                <button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-2 transition"
                >
                  {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                  <span>{isGeneratingVideo ? 'Generating Video...' : 'Generate AI Video'}</span>
                </button>
              </div>
            </div>

            {generatedVideoResult && (
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-emerald-400 font-semibold mb-2">Generated Video Result:</p>
                <video
                  src={generatedVideoResult}
                  controls
                  className="max-h-72 rounded-lg border border-zinc-800"
                />
              </div>
            )}
          </div>
        )}

        {/* 3. AI IMAGE GENERATION (gemini-3-pro-image-preview with 1K, 2K, 4K) */}
        {activeTab === 'image-gen' && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white">High-Quality Image Generator</span>
            </div>
            <p className="text-zinc-400 text-xs">
              Generate ultra-sharp stills using <code className="text-amber-400 font-mono">gemini-3-pro-image-preview</code>{' '}
              with selectable resolution (1K, 2K, or 4K) or prompt-edit with <code className="text-amber-400 font-mono">gemini-nano-banana-2.1</code>.
            </p>

            <textarea
              rows={3}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe image subject, lighting, camera lens..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
            />

            <div className="flex items-center justify-between">
              {/* Resolution selection */}
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Output Resolution</label>
                <div className="flex gap-2">
                  {(['1K', '2K', '4K'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setImageSize(sz)}
                      className={`px-3 py-1.5 rounded-md border text-xs font-mono font-semibold transition ${
                        imageSize === sz
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold text-xs flex items-center gap-2 transition"
              >
                {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                <span>{isGeneratingImage ? 'Rendering Image...' : `Generate ${imageSize} Image`}</span>
              </button>
            </div>

            {generatedImageResult && (
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-emerald-400 font-semibold mb-2">Generated Asset:</p>
                <img
                  src={generatedImageResult}
                  alt="Generated asset"
                  className="max-h-80 rounded-lg border border-zinc-800"
                />
              </div>
            )}
          </div>
        )}

        {/* 4. SEARCH GROUNDING (gemini-3.8-flash with googleSearch) */}
        {activeTab === 'trends' && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">Google Search Grounding (Live Creator Trends)</span>
            </div>
            <p className="text-zinc-400 text-xs">
              Powered by <code className="text-emerald-400 font-mono">gemini-3.8-flash</code> with live web search to discover
              current trending editing formats, viral hook formulas, and BPM music vibes.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={trendQuery}
                onChange={(e) => setTrendQuery(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSearchTrends}
                disabled={isSearchingTrends}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-2 transition"
              >
                {isSearchingTrends ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Discover Trends</span>
              </button>
            </div>

            {trendResults && (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="text-emerald-400 font-semibold block">Grounded Intelligence:</span>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">
                  {trendResults.trends}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 5. LIVE VOICE CO-DIRECTOR (gemini-3.8-live) */}
        {activeTab === 'live-voice' && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col h-[460px]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-white">Live Voice Co-Director (Gemini Live)</span>
            </div>
            <p className="text-zinc-400 text-xs">
              Chat in real-time with an expert editorial co-director for rapid-fire feedback on your cut.
            </p>

            {/* Chat history list */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              {liveChatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white'
                        : 'bg-zinc-800 border border-zinc-700/60 text-zinc-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={liveMessage}
                onChange={(e) => setLiveMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendLiveMessage()}
                placeholder="Ask your director: 'How can I make the hook more engaging?'..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleSendLiveMessage}
                disabled={isLiveTalking || !liveMessage.trim()}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
