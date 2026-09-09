import React, { useState } from 'react';
import { Video, Settings2, Play, Sparkles, Wand2, Database, AlertTriangle } from 'lucide-react';
import { generateVideo, pollVideoOperation, getVideoUrl } from '../../services/geminiService';
import type { VideoAspectRatio, PollingStats, VeoOperationContext } from '../../types';

interface VideoGenerationTabProps {
  setVeoContext?: (ctx: VeoOperationContext) => void;
}

// Veo 3.1 Standard pricing: $0.40/sec with audio, default 8s clip
// 20% margin for future credit-based billing
const VEO_COST_PER_SECOND = 0.4;
const VEO_DEFAULT_SECONDS = 8;
const VEO_MARGIN = 1.2;
const VEO_BASE_COST = VEO_COST_PER_SECOND * VEO_DEFAULT_SECONDS;       // $3.20
const VEO_RETAIL_PRICE = VEO_BASE_COST * VEO_MARGIN;                    // $3.84

export const VideoGenerationTab: React.FC<VideoGenerationTabProps> = ({ setVeoContext }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [pollStats, setPollStats] = useState<PollingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setPollStats(null);

    try {
      setPollStats({
        pollCount: 0,
        elapsedSeconds: 0,
        estimatedProgress: 5,
        stage: 'DISPATCHING',
        message: 'Queuing Veo 3.1 video render...',
        statusText: 'Initializing',
      });

      const operation = await generateVideo(prompt, aspectRatio);

      if (setVeoContext) {
        setVeoContext({ operation, prompt });
      }

      const completed = await pollVideoOperation(operation, (stats, op) => {
        setPollStats(stats);
      });

      const videos = completed?.response?.generatedVideos || [];
      const urls: string[] = [];
      for (const v of videos) {
        if (v?.video?.uri) {
          try {
            const url = await getVideoUrl(v.video.uri);
            urls.push(url);
          } catch (e) {
            console.warn('Failed to fetch video URI:', e);
          }
        }
      }
      setGeneratedVideos(urls);
      setPollStats({
        pollCount: (pollStats?.pollCount || 0) + 1,
        elapsedSeconds: 0,
        estimatedProgress: 100,
        stage: 'COMPLETED',
        message: `Video ready (${urls.length} output)`,
        statusText: 'Done',
      });
    } catch (err: any) {
      setError(err?.message || 'Video generation failed');
      console.error('Veo generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full font-mono text-xs select-none bg-[#0b0d12] animate-fade-in">
      {/* Left Configuration Panel */}
      <aside className="w-[350px] bg-[#11131a] border-r border-[#1f2937] flex flex-col">
        <div className="p-4 border-b border-[#1f2937] flex items-center space-x-2 text-white">
          <Settings2 size={16} className="text-[#10b981]" />
          <span className="font-bold uppercase tracking-widest text-[11px]">GENERATOR CONFIG</span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Engine Provider</label>
            <select
              value="veo-3.1"
              disabled
              className="bg-[#0b0d12] border border-[#1f2937] text-white p-2 outline-none opacity-70"
            >
              <option value="veo-3.1">Google Veo 3.1 (High Fidelity)</option>
            </select>
            <span className="text-[8px] text-[#6b7280] uppercase">Veo 3.1 — live via Google AI API</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Cinematic Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the camera movement, lighting, and action..."
              className="bg-[#0b0d12] border border-[#1f2937] text-white p-3 h-32 outline-none focus:border-[#10b981] transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-[#9ca3af] font-bold uppercase tracking-wider">Aspect Ratio</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
              className="bg-[#0b0d12] border border-[#1f2937] text-white p-2 outline-none focus:border-[#10b981]"
            >
              <option value="16:9">16:9 (Cinematic)</option>
              <option value="9:16">9:16 (Vertical)</option>
            </select>
          </div>

          {/* Estimated Pricing */}
          <div className="bg-[#0e1017] border border-[#1f2937] p-2.5 space-y-1.5">
            <span className="text-[9px] text-[#6b7280] font-bold uppercase tracking-wider block">
              Estimated Price (8s clip)
            </span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9ca3af]">API cost</span>
              <span className="text-[#ffffff] font-bold">${VEO_BASE_COST.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9ca3af]">Retail (+20% margin)</span>
              <span className="text-[#d4a574] font-bold">${VEO_RETAIL_PRICE.toFixed(2)}</span>
            </div>
            <span className="text-[8px] text-[#6b7280] block">
              $0.40/sec incl. audio · margin for future credit billing
            </span>
          </div>

          {pollStats && isGenerating && (
            <div className="space-y-1.5 bg-[#0e1017] border border-[#1f2937] p-2">
              <div className="flex justify-between text-[9px]">
                <span className="text-[#10b981] font-bold uppercase">{pollStats.stage}</span>
                <span className="text-[#9ca3af]">{pollStats.estimatedProgress}%</span>
              </div>
              <div className="w-full bg-[#181b22] h-1 overflow-hidden">
                <div
                  className="bg-[#10b981] h-full transition-all duration-300"
                  style={{ width: `${pollStats.estimatedProgress}%` }}
                />
              </div>
              <span className="text-[8px] text-[#6b7280] block">{pollStats.message}</span>
            </div>
          )}

          {error && (
            <div className="bg-[#1f1315] border border-[#ef4444] text-[#ef4444] p-2 text-[10px] flex items-start space-x-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1f2937] bg-[#0e1017]">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-3 flex items-center justify-center space-x-2 font-bold uppercase tracking-wider transition-all
              ${isGenerating || !prompt.trim() ? 'bg-[#1f2937] text-[#6b7280] cursor-not-allowed' : 'bg-[#10b981] hover:bg-[#059669] text-black'}`}
          >
            {isGenerating ? <Sparkles size={14} className="animate-spin" /> : <Wand2 size={14} />}
            <span>{isGenerating ? 'RENDERING...' : 'GENERATE VIDEO'}</span>
          </button>
        </div>
      </aside>

      {/* Center Preview Panel */}
      <main className="flex-1 flex flex-col bg-[#0b0d12] relative items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1f2937]/30 to-[#0b0d12]">
        {generatedVideos.length > 0 ? (
          <div className="w-full max-w-4xl flex flex-col items-center gap-4">
            <video
              src={generatedVideos[0]}
              controls
              autoPlay
              loop
              className="w-full aspect-video border border-[#1f2937] bg-black shadow-2xl"
            />
            {generatedVideos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 w-full">
                {generatedVideos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => { const v = generatedVideos[0]; /* primary preview */ }}
                    className="w-40 aspect-video border border-[#1f2937] bg-[#11131a] hover:border-[#10b981] cursor-pointer overflow-hidden"
                  >
                    <video src={url} muted className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <span className="text-[10px] text-[#10b981] uppercase font-bold">
              GENERATED — pass to Timeline Studio for continuation
            </span>
          </div>
        ) : (
          <>
            <div className="w-full max-w-4xl aspect-video border border-[#1f2937] bg-black shadow-2xl flex flex-col items-center justify-center text-[#1f2937]">
              <Video size={48} className="mb-4 opacity-50" />
              <span className="font-bold tracking-widest uppercase text-xl">WAITING FOR GENERATION</span>
              <span className="text-[10px] mt-2 opacity-50">Output will be passed automatically to the Timeline Studio</span>
            </div>

            {/* Recent Generations Gallery */}
            <div className="w-full max-w-4xl mt-8 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#6b7280] flex items-center gap-1">
                <Database size={10} /> RECENT GENERATIONS
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {generatedVideos.length === 0 && (
                  <span className="text-[10px] text-[#6b7280] italic">No generations yet</span>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
