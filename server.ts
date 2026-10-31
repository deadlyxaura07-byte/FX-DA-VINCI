import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for base64 image and audio uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to initialize Gemini SDK with required telemetry header
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. AI Editing Assistant with gemini-4-argon (ThinkingLevel.HIGH) or gemini-3.8-flash
app.post('/api/gemini/assistant', async (req, res) => {
  try {
    const { prompt, currentProject, useThinking = true } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are FX Verse AI, a senior video-editing software architect and professional filmmaker.
You receive a user's natural language video editing request along with the current project state (tracks, clips, aspect ratio, duration).
Analyze the request and return a structured JSON response containing:
1. "summary": Brief explanation of what editing decisions were made (e.g., pacing cuts, color grading choice, transition choices).
2. "style": Detected or recommended style ('gen-z-fast-cut', 'cinematic', 'travel', 'gaming', 'phonk-velocity', 'romantic', 'documentary', 'luxury', 'clean-social').
3. "operations": An array of concrete, actionable timeline operations.
Each operation must have:
- "action": One of 'SET_ASPECT_RATIO', 'ADD_CLIP', 'TRIM_CLIP', 'SPLIT_CLIP', 'REMOVE_CLIP', 'SET_COLOR_GRADE', 'SET_TRANSITION', 'ADD_TEXT_OVERLAY', 'SYNC_BEATS', 'ADJUST_SPEED', 'AUTO_DUCK'.
- "clipId": target clip ID if modifying existing clip (or null if global)
- "trackId": target track ID ('v1', 'v2', 'fx3d', 'text', 'a1_dialogue', 'a2_music', 'a3_sfx')
- "params": Object with specific parameters:
  - for SET_ASPECT_RATIO: { aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' }
  - for SET_COLOR_GRADE: { exposure, contrast, saturation, temperature, tint, vignette, lut: 'cinematic-teal-orange'|'cyberpunk-neon'|'vintage-film-kodak'|'monochrome-noir'|'warm-sunset'|'bleach-bypass'|'none' }
  - for SET_TRANSITION: { transitionIn?: string, transitionOut?: string, duration?: number }
  - for ADJUST_SPEED: { speed: number } (e.g. 0.5 for slow motion, 2.0 for speedup)
  - for ADD_TEXT_OVERLAY: { text: string, start: number, duration: number, fontStyle: string, animation: 'bounce'|'typewriter'|'glow'|'karaoke' }
  - for SYNC_BEATS: { cutInterval: number, dynamicSpeed: boolean }
4. "reasoningNotes": Professional editorial insight explaining the narrative pacing, hook retention, and color theory behind the cut.`;

    if (useThinking) {
      // Model: gemini-4-argon with thinkingLevel: HIGH
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `User request: ${prompt}\n\nCurrent Project JSON:\n${JSON.stringify(currentProject, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      const responseText = response.text || '{}';
      return res.json(JSON.parse(responseText));
    } else {
      // Fast path with gemini-3.8-flash
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User request: ${prompt}\n\nCurrent Project JSON:\n${JSON.stringify(currentProject, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      return res.json(JSON.parse(responseText));
    }
  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process editing request with AI' });
  }
});

// 2. Video Generation via Interactions API (gemini-omni-1.1-flash)
app.post('/api/gemini/generate-video', async (req, res) => {
  try {
    const { prompt, imageBase64, aspectRatio = '16:9', duration = '5s', resolution = '720p' } = req.body;
    const ai = getGeminiClient();

    let inputPayload: any;
    if (imageBase64) {
      // Image to video
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      inputPayload = [
        {
          type: 'image',
          mime_type: 'image/png',
          data: cleanBase64,
        },
        {
          type: 'text',
          text: prompt || 'Animate this scene with smooth cinematic camera motion and organic natural movement.',
        },
      ];
    } else {
      // Text to video
      inputPayload = prompt;
    }

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: inputPayload,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
          duration: duration === '10s' ? '10s' : '5s',
          resolution: resolution || '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && (videoPart.data || videoPart.uri)) {
      return res.json({
        videoBase64: videoPart.data ? `data:${videoPart.mime_type || 'video/mp4'};base64,${videoPart.data}` : null,
        videoUri: videoPart.uri || null,
        mimeType: videoPart.mime_type || 'video/mp4',
      });
    }

    res.status(500).json({ error: 'Video generation completed but no video payload was returned.' });
  } catch (error: any) {
    console.error('Video Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

// 3. High-Quality Image Generation (gemini-3-pro-image-preview or gemini-nano-banana-2.1)
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, imageSize = '1K', aspectRatio = '16:9', editImageBase64 } = req.body;
    const ai = getGeminiClient();

    if (editImageBase64) {
      // Image editing with gemini-nano-banana-2.1
      const cleanBase64 = editImageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const interaction = await ai.interactions.create({
        model: 'gemini-nano-banana-2.1',
        input: [
          {
            type: 'image',
            mime_type: 'image/png',
            data: cleanBase64,
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
        response_modalities: ['image', 'text'],
        generation_config: {
          image_config: {
            aspect_ratio: aspectRatio || '16:9',
            image_size: imageSize || '1K',
          },
        },
      });

      const outputImage = interaction.output_image;
      if (outputImage && outputImage.data) {
        return res.json({
          imageUrl: `data:${outputImage.mime_type || 'image/png'};base64,${outputImage.data}`,
        });
      }
      return res.status(500).json({ error: 'No image output received from edit model.' });
    }

    // High Quality Image generation with gemini-3-pro-image-preview
    const interaction = await ai.interactions.create({
      model: 'gemini-3-pro-image',
      input: prompt,
      response_modalities: ['image', 'text'],
      generation_config: {
        image_config: {
          aspect_ratio: aspectRatio || '16:9',
          image_size: imageSize || '1K', // '1K', '2K', '4K'
        },
      },
    });

    const outputImg = interaction.output_image;
    if (outputImg && outputImg.data) {
      return res.json({
        imageUrl: `data:${outputImg.mime_type || 'image/png'};base64,${outputImg.data}`,
      });
    }

    res.status(500).json({ error: 'Image generation completed without output.' });
  } catch (error: any) {
    console.error('Image Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// 4. Text to Speech (TTS) using gemini-3.8-flash-tts
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, speakerStyle = 'Dramatic cinematic narrator', voice = 'Puck' } = req.body;
    const ai = getGeminiClient();

    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash-tts',
      input: [
        {
          type: 'text',
          text,
          annotations: [
            {
              type: 'speech_metadata',
              style: speakerStyle,
            },
          ],
        },
      ],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [
          {
            language: 'en-US',
            voice: voice || 'Puck', // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        ],
      },
    });

    const outputAudio = interaction.output_audio;
    if (outputAudio && outputAudio.data) {
      return res.json({
        audioBase64: `data:audio/wav;base64,${outputAudio.data}`,
      });
    }

    res.status(500).json({ error: 'No audio returned from TTS model.' });
  } catch (error: any) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate voiceover audio' });
  }
});

// 5. Audio Transcription using gemini-3.5-transcribe
app.post('/api/gemini/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }
    const cleanBase64 = audioBase64.replace(/^data:[a-zA-Z0-9/+.-]+;base64,/, '');
    const ai = getGeminiClient();

    const interaction = await ai.interactions.create({
      model: 'gemini-3.5-transcribe',
      input: [
        {
          type: 'audio',
          data: cleanBase64,
          mime_type: mimeType,
        },
        {
          type: 'text',
          text: `Transcribe this speech accurately with precise word-level or sentence-level timestamps for video subtitles.
Return a structured JSON with:
{
  "fullTranscript": "string",
  "captions": [
    { "text": "string", "start": 0.0, "end": 2.5 }
  ]
}`,
        },
      ],
    });

    const textOutput = interaction.output_text || '';
    let parsed: any;
    try {
      const match = textOutput.match(/```json\s*([\s\S]*?)\s*```/) || textOutput.match(/([\{\[][\s\S]*[\}\]])/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        parsed = { fullTranscript: textOutput, captions: [{ text: textOutput, start: 0, end: 5 }] };
      }
    } catch {
      parsed = { fullTranscript: textOutput, captions: [{ text: textOutput, start: 0, end: 5 }] };
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Transcription Error:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

// 6. Search Grounding for Trending Music & Viral Editing Formats (gemini-3.8-flash with googleSearch)
app.post('/api/gemini/search-trends', async (req, res) => {
  try {
    const { query = 'trending TikTok Instagram Reels editing styles, viral audio vibes and video transitions' } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Search for the latest creator editing trends: ${query}.
Provide:
1. Top 5 viral editing formats/aesthetics currently trending on Reels and Shorts.
2. Recommended music styles, BPM ranges, and pacing tips.
3. Hook formulas that retain viewers in the first 3 seconds.
Return concise, practical advice for a video editor.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    res.json({
      trends: response.text || 'No trends available',
      searchChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    });
  } catch (error: any) {
    console.error('Search Trends Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch trending insights' });
  }
});

// 7. Live Voice Conversation Token & Session Bridge (gemini-3.8-live)
app.post('/api/gemini/live-converse', async (req, res) => {
  try {
    const { userMessage, conversationHistory = [] } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        ...conversationHistory.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      config: {
        systemInstruction: `You are the FX Verse Live Voice Assistant. You speak directly to the video editor, giving quick, punchy, real-time advice on cuts, timing, color palettes, sound design, and storytelling rhythm. Keep answers concise, natural, and conversational as if in an audio headset conversation with a director.`,
      },
    });

    res.json({
      reply: response.text || 'I hear you! What cut or adjustment should we test next?',
    });
  } catch (error: any) {
    console.error('Live Voice Error:', error);
    res.status(500).json({ error: error.message || 'Failed to converse with Live voice' });
  }
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FX Verse Editing Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
