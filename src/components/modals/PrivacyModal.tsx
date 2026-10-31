import React, { useState } from 'react';
import { ShieldCheck, HardDrive, Cloud, Music, Lock, X } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  const [cloudConsent, setCloudConsent] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">AI & Media Privacy Architecture</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-zinc-300">
          {/* On Device vs Cloud */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <HardDrive className="w-3.5 h-3.5" />
                <span>100% On-Device</span>
              </div>
              <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                <li>Timeline trimming & cutting</li>
                <li>WebGL 60fps color grading & LUTs</li>
                <li>Web Audio peak beat detection</li>
                <li>Canvas frame video export</li>
                <li>Three.js procedural 3D effects</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
                <Cloud className="w-3.5 h-3.5" />
                <span>Gemini Cloud Services</span>
              </div>
              <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                <li>Gemini 4 Argon timeline copilot</li>
                <li>Gemini Omni Flash video generation</li>
                <li>Gemini 3 Pro 4K image generation</li>
                <li>Gemini 3.8 Flash TTS Voiceover</li>
                <li>Gemini 3.5 audio transcription</li>
              </ul>
            </div>
          </div>

          {/* User Consent Toggle */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div className="pr-3">
              <p className="font-semibold text-white text-[11px]">Consent for Cloud AI Operations</p>
              <p className="text-[10px] text-zinc-400">
                Grant permission to transmit prompts, audio, or frames to Gemini models when requesting AI features.
              </p>
            </div>
            <button
              onClick={() => setCloudConsent(!cloudConsent)}
              className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                cloudConsent ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  cloudConsent ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Music & Media Ownership Advisory */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-[11px] text-zinc-400">
            <Music className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold text-zinc-300">Licensing Transparency: </span>
              Soundtracks included in FX Verse are procedurally synthesized in Web Audio or royalty-free. When uploading commercial audio, ensure you hold distribution rights for social media publishing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex justify-end bg-zinc-900/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
