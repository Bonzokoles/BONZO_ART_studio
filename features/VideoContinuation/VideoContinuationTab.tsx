import React, { useState, useEffect } from 'react';
import type {
  VeoOperationContext,
  HistoryItem,
} from '../../types';
import { AssetLibraryPanel } from '../../components/AssetLibraryPanel';
import {
  loadGenerationHistory,
  deleteHistoryItem,
  clearGenerationHistory,
} from '../../services/providerEngine';
import {
  Film,
  Sliders,
  Sparkles,
  Clock,
  Play,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface VideoContinuationTabProps {
  veoContext: VeoOperationContext | null;
  setVeoContext: (context: VeoOperationContext) => void;
}

export const VideoContinuationTab: React.FC<VideoContinuationTabProps> = ({
  veoContext,
  setVeoContext,
}) => {
  const [continuationPrompt, setContinuationPrompt] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refreshHistory = () => {
    setHistory(loadGenerationHistory());
  };

  useEffect(() => {
    refreshHistory();
    const handleUpdate = () => refreshHistory();
    window.addEventListener('bonzo-history-updated', handleUpdate);
    return () => window.removeEventListener('bonzo-history-updated', handleUpdate);
  }, []);

  return (
    <div id="video-continuation-tab" className="flex-1 flex flex-col md:flex-row overflow-hidden w-full font-mono text-xs select-none">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: VIDEO CONTINUATION CONTROLS (320px fixed)
      ───────────────────────────────────────────────────────────── */}
      <aside
        id="video-cont-left-panel"
        className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] bg-[#11131a] border-r border-[#1f2937] p-3 space-y-3 overflow-y-auto flex flex-col shrink-0"
      >
        <div className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Sliders size={13} className="text-[#f59e0b]" />
                <span>CONTINUATION</span>
              </span>
              <span className="text-[#9ca3af] text-[9px]">VEO EXTENSION</span>
            </div>

            {/* Context Status */}
            <div className="bg-[#0b0d12] border border-[#1f2937] p-2 space-y-1">
              <span className="text-[#f59e0b] font-bold block text-[10px] uppercase">[SOURCE VIDEO STREAM]</span>
              <div className="text-[#9ca3af] text-[9px]">
                {veoContext ? `Active session attached: ${veoContext.operationName}` : 'No source video buffer loaded in memory'}
              </div>
            </div>

            {/* Extension Prompt */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="cont-prompt" className="text-[#9ca3af] uppercase tracking-wider text-[10px]">
                  EXTENSION DIRECTIVE
                </label>
                <span className="text-[#6b7280] text-[9px]">{continuationPrompt.length} / 2000</span>
              </div>
              <textarea
                id="cont-prompt"
                rows={4}
                maxLength={2000}
                value={continuationPrompt}
                onChange={(e) => setContinuationPrompt(e.target.value)}
                placeholder="Describe how the scene continues and evolves in the next temporal segment..."
                className="w-full bg-[#0b0d12] border border-[#1f2937] p-2 text-[#ffffff] placeholder-[#525660] focus:border-[#f59e0b] focus:outline-none text-[11px] leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-[#1f2937]">
            <button
              id="extend-video-btn"
              type="button"
              disabled={true}
              className="w-full h-11 bg-[#181b22] text-[#6b7280] border border-[#1f2937] font-bold uppercase tracking-wider text-[11px] flex items-center justify-center space-x-2 cursor-not-allowed"
            >
              <ArrowRight size={13} />
              <span>EXTEND VIDEO [COMING SOON]</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          CENTER CANVAS: PREVIEW & PLACEHOLDER (flex: 1)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="video-cont-center-canvas"
        className="flex-1 bg-[#0b0d12] flex flex-col p-3 space-y-3 overflow-y-auto min-w-0"
      >
        {/* Main Canvas Display Area */}
        <div className="flex-1 min-h-[380px] bg-[#0e1017] border border-[#1f2937] flex flex-col items-center justify-center relative p-6 text-center">
          <div className="max-w-md space-y-3 p-6 border border-[#1f2937] bg-[#0b0d12]">
            <div className="w-12 h-12 mx-auto bg-[#181b22] border border-[#1f2937] flex items-center justify-center text-[#f59e0b]">
              <Film size={24} />
            </div>

            <div className="space-y-1">
              <div className="text-[12px] font-bold text-[#ffffff] uppercase tracking-wider">
                VIDEO CONTINUATION PIPELINE
              </div>
              <div className="text-[11px] text-[#6b7280]">
                Coming Soon: Prompt-to-video via VEO API will be available here.
              </div>
            </div>

            <div className="text-[9px] text-[#525660] leading-relaxed border-t border-[#1f2937] pt-2">
              Extend previously synthesized video segments with seamless motion coherence and lighting consistency across continuous temporal shots.
            </div>
          </div>
        </div>

        {/* History Strip */}
        <div className="bg-[#11131a] border border-[#1f2937] p-2 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-1.5">
              <Clock size={12} className="text-[#d4a574]" />
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[10px]">
                SAVED ASSETS [{history.length}]
              </span>
            </div>
            <span className="text-[#6b7280] text-[9px]">LOCAL ASSETS</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin pb-1 pt-0.5">
            {history.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="w-16 h-16 min-w-[64px] min-h-[64px] bg-[#0b0d12] border border-[#1f2937] shrink-0 overflow-hidden"
              >
                <img src={item.images[0]} alt={item.prompt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: ASSET LIBRARY (280px fixed)
      ───────────────────────────────────────────────────────────── */}
      <AssetLibraryPanel
        history={history}
        onSelectAsset={() => {}}
        onDeleteAsset={(id) => {
          deleteHistoryItem(id);
          refreshHistory();
        }}
        onClearAll={() => {
          clearGenerationHistory();
          refreshHistory();
        }}
      />
    </div>
  );
};
