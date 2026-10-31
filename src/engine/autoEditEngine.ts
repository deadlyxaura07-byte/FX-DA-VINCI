import { AutoEditStyle, MediaAsset, ProjectState, TimelineClip, TimelineTrack, FilterSettings } from '../types/timeline';
import { AUTO_EDIT_STYLES, SAMPLE_MUSIC_TRACKS } from '../data/sampleAssets';

export class AutoEditEngine {
  /**
   * Generates a complete draft timeline from selected media, music, and chosen style
   */
  public generateTimeline(
    selectedMedia: MediaAsset[],
    selectedMusicId: string,
    styleId: string
  ): ProjectState {
    const style = AUTO_EDIT_STYLES.find((s) => s.id === styleId) || AUTO_EDIT_STYLES[0];
    const music = SAMPLE_MUSIC_TRACKS.find((m) => m.id === selectedMusicId) || SAMPLE_MUSIC_TRACKS[0];

    const tracks: TimelineTrack[] = [
      { id: 'v2', name: 'V2 (B-Roll & Overlays)', type: 'video' },
      { id: 'v1', name: 'V1 (Main Video)', type: 'video' },
      { id: 'fx3d', name: '3D FX / Motion Graphics', type: 'threejs' },
      { id: 'text', name: 'Titles & Captions', type: 'text' },
      { id: 'a1_dialogue', name: 'A1 (Voiceover / Speech)', type: 'audio' },
      { id: 'a2_music', name: 'A2 (Soundtrack / Beats)', type: 'audio' },
      { id: 'a3_sfx', name: 'A3 (Sound Effects)', type: 'audio' },
    ];

    const clips: TimelineClip[] = [];
    const beats = music.beats || [];
    let currentTime = 0;
    let mediaIndex = 0;
    const targetDuration = Math.min(style.recommendedDuration, 30);

    // Default filter for the style
    const baseFilter: FilterSettings = {
      exposure: style.defaultLut === 'cyberpunk-neon' ? 10 : 0,
      contrast: style.defaultLut === 'monochrome-noir' ? 35 : 12,
      brightness: 0,
      saturation: style.defaultLut === 'monochrome-noir' ? -100 : style.defaultLut === 'cyberpunk-neon' ? 30 : 15,
      temperature: style.defaultLut === 'warm-sunset' ? 35 : style.defaultLut === 'cinematic-teal-orange' ? -15 : 0,
      tint: style.defaultLut === 'cyberpunk-neon' ? 20 : 0,
      shadows: -10,
      highlights: 5,
      vignette: style.defaultLut === 'cinematic-teal-orange' || style.defaultLut === 'vintage-film-kodak' ? 25 : 10,
      lut: style.defaultLut,
    };

    // Calculate cut intervals matching beats
    let beatIndex = 0;
    while (currentTime < targetDuration && selectedMedia.length > 0) {
      const media = selectedMedia[mediaIndex % selectedMedia.length];
      mediaIndex++;

      // Determine duration for this cut:
      // For Gen-Z/Phonk/Gaming: snap to 1-2 beats
      // For Cinematic/Romantic/Doc: snap to 4-8 beats
      let clipDuration = 2.0;
      if (beats.length > beatIndex + 2) {
        if (style.id === 'gen-z-fast-cut' || style.id === 'phonk-velocity') {
          beatIndex += 2; // rapid cut every 2 beats
          clipDuration = Math.max(0.6, (beats[beatIndex] || currentTime + 1.0) - currentTime);
        } else if (style.id === 'gaming') {
          beatIndex += 3;
          clipDuration = Math.max(0.8, (beats[beatIndex] || currentTime + 1.4) - currentTime);
        } else {
          beatIndex += 6;
          clipDuration = Math.max(2.4, (beats[beatIndex] || currentTime + 3.0) - currentTime);
        }
      } else {
        clipDuration = 2.0;
      }

      // Ensure does not exceed target
      if (currentTime + clipDuration > targetDuration) {
        clipDuration = targetDuration - currentTime;
      }

      const clip: TimelineClip = {
        id: `clip-${Date.now()}-${mediaIndex}`,
        trackId: 'v1',
        type: media.type === 'video' ? 'video' : 'image',
        name: media.name,
        sourceUrl: media.url,
        thumbnailUrl: media.thumbnailUrl,
        start: parseFloat(currentTime.toFixed(2)),
        duration: parseFloat(clipDuration.toFixed(2)),
        sourceOffset: 0,
        sourceDuration: media.duration || 10,
        speed: style.id === 'gaming' && mediaIndex % 2 === 1 ? 1.5 : 1.0,
        volume: 1.0,
        isMuted: false,
        opacity: 1.0,
        transform: {
          scale: 1.0,
          x: 0,
          y: 0,
          rotation: 0,
        },
        filter: { ...baseFilter },
        transitionIn: {
          type: mediaIndex === 1 ? 'none' : style.defaultTransition,
          duration: style.id === 'gen-z-fast-cut' ? 0.25 : 0.45,
        },
        transitionOut: {
          type: 'none',
          duration: 0.3,
        },
      };

      clips.push(clip);
      currentTime += clipDuration;
    }

    // Add Music clip on A2
    clips.push({
      id: `clip-music-${Date.now()}`,
      trackId: 'a2_music',
      type: 'audio',
      name: `${music.name} (${music.genre})`,
      sourceUrl: music.id,
      start: 0,
      duration: targetDuration,
      sourceOffset: 0,
      sourceDuration: music.duration,
      speed: 1.0,
      volume: 0.85,
      isMuted: false,
      opacity: 1.0,
      transform: { scale: 1, x: 0, y: 0, rotation: 0 },
      filter: { ...baseFilter, lut: 'none' },
      transitionIn: { type: 'cross-dissolve', duration: 0.5 },
      transitionOut: { type: 'cross-dissolve', duration: 1.0 },
      waveformData: music.beats,
    });

    // Add Hook Title Caption in the first 3 seconds
    const titleText =
      style.id === 'gen-z-fast-cut'
        ? 'WAIT FOR THE DROP 🔥'
        : style.id === 'cinematic'
        ? 'CINEMATIC VISION'
        : style.id === 'travel'
        ? 'WANDERLUST ADVENTURE'
        : style.id === 'gaming'
        ? 'INSANE CLUTCH ⚡'
        : style.id === 'phonk-velocity'
        ? 'TOKYO DRIFT VIBE'
        : 'FX VERSE CREATION';

    clips.push({
      id: `clip-title-${Date.now()}`,
      trackId: 'text',
      type: 'text',
      name: 'Hook Title',
      sourceUrl: '',
      start: 0.4,
      duration: 3.2,
      sourceOffset: 0,
      sourceDuration: 3.2,
      speed: 1.0,
      volume: 1.0,
      isMuted: false,
      opacity: 1.0,
      transform: { scale: 1, x: 0, y: 0, rotation: 0 },
      filter: { ...baseFilter, lut: 'none' },
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'cross-dissolve', duration: 0.3 },
      textConfig: {
        text: titleText,
        fontSize: style.aspectRatio === '9:16' ? 58 : 64,
        fontFamily: style.id === 'cinematic' ? 'Cinzel' : style.id === 'gen-z-fast-cut' ? 'Impact' : 'Montserrat',
        color: '#ffffff',
        backgroundColor: style.id === 'gen-z-fast-cut' ? 'rgba(255, 0, 100, 0.75)' : undefined,
        animationStyle: style.id === 'gen-z-fast-cut' ? 'bounce' : 'glow',
        alignment: 'center',
      },
    });

    // Add 3D Kinetic Motion Graphics Clip if Style is Gaming or Phonk or Luxury
    if (style.id === 'gaming' || style.id === 'phonk-velocity' || style.id === 'luxury') {
      clips.push({
        id: `clip-3d-${Date.now()}`,
        trackId: 'fx3d',
        type: 'threejs_effect',
        name: '3D Quantum Core Overlay',
        sourceUrl: '',
        start: 3.5,
        duration: 4.5,
        sourceOffset: 0,
        sourceDuration: 4.5,
        speed: 1.2,
        volume: 1.0,
        isMuted: false,
        opacity: 0.9,
        transform: { scale: 1, x: 0, y: 0, rotation: 0 },
        filter: { ...baseFilter, lut: 'none' },
        transitionIn: { type: 'cross-dissolve', duration: 0.4 },
        transitionOut: { type: 'cross-dissolve', duration: 0.4 },
        threeConfig: {
          scenePreset: style.id === 'luxury' ? 'floating-trophy' : 'cyber-cube-hud',
          titleText: 'FX 3D',
          colorScheme: style.id === 'luxury' ? 'gold-lux' : 'cyber-cyan',
          speed: 1.5,
          wireframe: false,
          roughness: 0.2,
          metalness: 0.9,
        },
      });
    }

    const isVertical = style.aspectRatio === '9:16';

    return {
      id: `proj-${Date.now()}`,
      name: `${style.name} Draft Edit`,
      aspectRatio: style.aspectRatio,
      width: isVertical ? 1080 : 1920,
      height: isVertical ? 1920 : 1080,
      fps: 30,
      duration: targetDuration,
      tracks,
      clips,
      beatMarkers: beats,
      autoDucking: true,
      playhead: 0,
      isPlaying: false,
      selectedClipId: clips[0]?.id || null,
      zoom: 60, // 60 pixels per second
      history: {
        past: [],
        future: [],
      },
    };
  }
}

export const autoEditEngine = new AutoEditEngine();
