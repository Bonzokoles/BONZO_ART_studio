import React, { useState, useEffect, useRef } from 'react';
import type {
  ProviderId,
  AspectRatio,
  ProgressStage,
  TelemetryLog,
  PollingStats,
  HistoryItem,
} from '../../types';
import {
  MODELS,
  ASPECT_RATIO_DIMENSIONS,
  executeMultiProviderGeneration,
  loadGenerationHistory,
  saveToGenerationHistory,
  deleteHistoryItem,
  clearGenerationHistory,
} from '../../services/providerEngine';
import { enhancePromptWithGemini } from '../../services/geminiService';
import {
  PROVIDER_LABELS,
  PROVIDER_COLORS,
  hasProviderKey,
} from '../../services/keyStorage';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ProgressIndicator } from '../../components/ProgressIndicator';
import { RightStudioPanel } from '../../components/RightStudioPanel';
import { SaveStyleModal } from '../../components/SaveStyleModal';
import { ImageLightbox, LightboxMetadata } from '../../components/ImageLightbox';
import {
  getArtistPromptAddition,
  type SavedStylePreset,
  type Artist,
} from '../../data/artistsData';
import { findArtistById } from '../../data/allArtists';
import {
  Wand2,
  Sparkles,
  Sliders,
  Download,
  Copy,
  Check,
  RefreshCw,
  XCircle,
  Clock,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Hash,
  Maximize2,
  DollarSign,
  Bookmark,
} from 'lucide-react';

const PROVIDER_LIST: ProviderId[] = ['google', 'fal', 'replicate', 'openai'];
const ASPECT_RATIOS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const getTimestamp = (): string => {
  return new Date().toTimeString().split(' ')[0];
};

export const ImageGenerationTab: React.FC = () => {
  // Primary Generation Parameters
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [provider, setProvider] = useState<ProviderId>('fal');
  const [model, setModel] = useState<string>('fal-ai/flux/schnell');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [numOutputs, setNumOutputs] = useState<number>(1);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));
  const [autoRandomize, setAutoRandomize] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Execution & Output State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastGenInfo, setLastGenInfo] = useState<{
    cost: number;
    timeMs: number;
    dimensions: string;
    modelLabel: string;
    seed: number;
    provider: ProviderId;
    aspectRatio: AspectRatio;
  } | null>(null);

  // Lightbox Inspection State
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string;
    images: string[];
    initialIndex: number;
    metadata: LightboxMetadata;
  } | null>(null);

  // Save Style Preset Modal State
  const [saveStyleModalOpen, setSaveStyleModalOpen] = useState<boolean>(false);

  // Prompt Modification Handlers from Wildcards & Templates
  const handleAppendPrompt = (text: string) => {
    setPrompt((prev) => {
      const clean = prev.trim();
      if (!clean) return text;
      if (clean.endsWith(',')) return `${clean} ${text}`;
      return `${clean}, ${text}`;
    });
  };

  const handleSetPrompt = (text: string) => {
    setPrompt(text);
  };

  const handleApplyStylePreset = (preset: SavedStylePreset) => {
    if (preset.prompt) setPrompt(preset.prompt);
    if (preset.negativePrompt !== undefined) setNegativePrompt(preset.negativePrompt);
    if (preset.provider) setProvider(preset.provider);
    if (preset.model) setModel(preset.model);
    if (preset.aspectRatio) setAspectRatio(preset.aspectRatio);
    if (preset.seed !== undefined) setSeed(preset.seed);
  };

  // Telemetry & Stage Progress
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [pollingStats, setPollingStats] = useState<PollingStats | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refreshHistory = () => {
    setHistory(loadGenerationHistory());
  };

  useEffect(() => {
    refreshHistory();
    const handleKeyChange = () => {
      // Re-trigger render
      setHistory(loadGenerationHistory());
    };
    window.addEventListener('bonzo-keys-updated', handleKeyChange);
    window.addEventListener('bonzo-history-updated', handleKeyChange);

    // Cross-window postMessage listener from dedicated Wildcards window
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'WILDCARD_ADD_ARTIST') {
        const artistId = event.data.artistId;
        const artist = findArtistById(artistId);
        if (artist) {
          const addition = getArtistPromptAddition(artist);
          handleAppendPrompt(addition);
          addLog('INFO', `[WILDCARD] Applied style: ${artist.name}`);
        }
      }
    };

    // Custom DOM event listener
    const handleAppendCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<{ text: string; artist?: Artist }>;
      if (custom.detail?.text) {
        handleAppendPrompt(custom.detail.text);
        if (custom.detail.artist) {
          addLog('INFO', `[WILDCARD] Applied style: ${custom.detail.artist.name}`);
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    window.addEventListener('bonzo-append-prompt', handleAppendCustomEvent);

    return () => {
      window.removeEventListener('bonzo-keys-updated', handleKeyChange);
      window.removeEventListener('bonzo-history-updated', handleKeyChange);
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('bonzo-append-prompt', handleAppendCustomEvent);
    };
  }, []);

  const addLog = (level: TelemetryLog['level'], message: string) => {
    setTelemetryLogs((prev) => [
      ...prev,
      { timestamp: getTimestamp(), level, message },
    ]);
  };

  // Provider Selection Handler
  const handleSelectProvider = (p: ProviderId) => {
    setProvider(p);
    const available = MODELS.filter((m) => m.provider === p);
    if (available.length > 0) {
      setModel(available[0].id);
    }
  };

  // Prompt Enhancer Handler
  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    addLog('INFO', `ENHANCE_PROMPT: Expanding concept "${prompt.slice(0, 40)}..."`);
    try {
      const enhanced = await enhancePromptWithGemini(prompt);
      setPrompt(enhanced);
      addLog('OK', `PROMPT_EXPANDED: Generated ${enhanced.length} characters`);
    } catch (err) {
      addLog('WARN', 'Prompt enhancement fallback applied');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Randomize Seed
  const handleRandomizeSeed = () => {
    const nextSeed = Math.floor(Math.random() * 999999);
    setSeed(nextSeed);
  };

  // Cancel Handler
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('WARN', 'USER_ABORT: Generation aborted by user request');
      setIsLoading(false);
    }
  };

  // Submit Generation Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('INPUT_ERROR: Please enter a prompt describing the image to generate.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgressPercent(10);
    setTelemetryLogs([]);

    const modelDef = MODELS.find((m) => m.id === model) || MODELS[0];
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];

    const controller = new AbortController();
    abortControllerRef.current = controller;

    addLog('RUN', `DISPATCH -> PROVIDER: ${provider.toUpperCase()} | MODEL: ${model}`);
    addLog('INFO', `GEOMETRY: ${dims.width}x${dims.height} (${aspectRatio}) | SEED: ${seed} | BATCH: ${numOutputs}`);

    try {
      const result = await executeMultiProviderGeneration(
        {
          provider,
          model,
          prompt,
          negativePrompt: modelDef.supportsNegativePrompt ? negativePrompt : undefined,
          aspectRatio,
          width: dims.width,
          height: dims.height,
          numOutputs,
          seed,
          guidanceScale: 7.5,
          steps: 28,
        },
        {
          signal: controller.signal,
          onProgress: (stats) => {
            setPollingStats(stats);
            setProgressPercent(stats.estimatedProgress);
            if (stats.stage === 'COMPLETED') {
              addLog('OK', stats.message);
            } else {
              addLog('RUN', `[${stats.stage}] ${stats.message}`);
            }
          },
        }
      );

      setGeneratedImages(result.images);
      setActiveImageIndex(0);
      setLastGenInfo({
        cost: result.cost,
        timeMs: result.generationTimeMs,
        dimensions: `${result.width}x${result.height}`,
        modelLabel: modelDef.label,
        seed: result.seed,
        provider,
        aspectRatio,
      });

      // Save to History
      const histItem: HistoryItem = {
        id: `gen-${Date.now()}`,
        timestamp: getTimestamp(),
        prompt,
        negativePrompt,
        provider,
        model,
        aspectRatio,
        width: result.width,
        height: result.height,
        seed,
        cost: result.cost,
        images: result.images,
      };
      saveToGenerationHistory(histItem);
      refreshHistory();
      
      // Auto-randomize seed for the next generation to prevent duplicate outputs
      if (autoRandomize) {
        setSeed(Math.floor(Math.random() * 999999));
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setError('Generation cancelled.');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown generation fault.';
        setError(msg);
        addLog('ERR', `FAILURE: ${msg}`);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Restore State from History Item
  const handleRestoreHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    if (item.negativePrompt) setNegativePrompt(item.negativePrompt);
    setProvider(item.provider);
    setModel(item.model);
    setAspectRatio(item.aspectRatio);
    setSeed(item.seed);
    setGeneratedImages(item.images);
    setActiveImageIndex(0);
    setLastGenInfo({
      cost: item.cost,
      timeMs: item.timeMs || 1200,
      dimensions: `${item.width}x${item.height}`,
      modelLabel: item.model,
      seed: item.seed,
      provider: item.provider,
      aspectRatio: item.aspectRatio,
    });
  };

  // Open Lightbox for Active Output
  const handleOpenLightboxForActive = () => {
    if (!activeImage) return;
    const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || { width: 1024, height: 1024 };
    setLightboxData({
      imageUrl: activeImage,
      images: generatedImages.length > 0 ? generatedImages : [activeImage],
      initialIndex: activeImageIndex,
      metadata: {
        prompt,
        negativePrompt: negativePrompt || undefined,
        provider: lastGenInfo?.provider || provider,
        model: lastGenInfo?.modelLabel || model,
        aspectRatio: lastGenInfo?.aspectRatio || aspectRatio,
        width: lastGenInfo ? parseInt(lastGenInfo.dimensions.split('x')[0], 10) : dims.width,
        height: lastGenInfo ? parseInt(lastGenInfo.dimensions.split('x')[1], 10) : dims.height,
        seed: lastGenInfo?.seed !== undefined ? lastGenInfo.seed : seed,
        cost: lastGenInfo?.cost,
        timeMs: lastGenInfo?.timeMs,
        timestamp: getTimestamp(),
        guidanceScale: 7.5,
        steps: 28,
        numOutputs: generatedImages.length,
      },
    });
    setLightboxOpen(true);
  };

  // Open Lightbox for a specific History Item
  const handleOpenLightboxForHistory = (item: HistoryItem) => {
    setLightboxData({
      imageUrl: item.images[0],
      images: item.images,
      initialIndex: 0,
      metadata: {
        prompt: item.prompt,
        negativePrompt: item.negativePrompt,
        provider: item.provider,
        model: item.model,
        aspectRatio: item.aspectRatio,
        width: item.width,
        height: item.height,
        seed: item.seed,
        cost: item.cost,
        timeMs: item.timeMs,
        timestamp: item.timestamp,
        guidanceScale: 7.5,
        steps: 28,
        numOutputs: item.images.length,
      },
    });
    setLightboxOpen(true);
  };

  // Download Single Image
  const handleDownload = (imgUrl: string) => {
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = `bonzo-art-${Date.now()}.png`;
    link.click();
  };

  // Copy Image Data
  const handleCopyData = (imgUrl: string) => {
    navigator.clipboard.writeText(imgUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredModels = MODELS.filter((m) => m.provider === provider);
  const selectedModelDef = MODELS.find((m) => m.id === model) || filteredModels[0] || MODELS[0];
  const dims = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  const activeImage = generatedImages[activeImageIndex] || null;

  return (
    <div id="image-generation-tab" className="flex-1 flex flex-col md:flex-row overflow-hidden w-full font-mono text-xs select-none">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: GENERATION CONTROLS (320px fixed)
      ───────────────────────────────────────────────────────────── */}
      <aside
        id="image-gen-left-panel"
        className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] bg-[#11131a] border-r border-[#1f2937] p-3 space-y-3 overflow-y-auto flex flex-col shrink-0"
      >
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Panel Title */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Sliders size={13} className="text-[#d4a574]" />
                <span>PARAMETERS</span>
              </span>
              <span className="text-[#9ca3af] text-[9px]">INFERENCE CONFIG</span>
            </div>

            {/* Provider Selector (Pills with 3px left border) */}
            <div className="space-y-1">
              <label className="text-[#9ca3af] uppercase tracking-wider text-[10px] block">
                PROVIDER ENGINE
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PROVIDER_LIST.map((p) => {
                  const isSelected = provider === p;
                  const isConfigured = hasProviderKey(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectProvider(p)}
                      className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors flex items-center justify-between border text-left ${
                        isSelected
                          ? 'bg-[#181b22] text-[#ffffff] border-[#1f2937]'
                          : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:border-[#2a3140] hover:text-[#ffffff]'
                      }`}
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftColor: isSelected ? '#d4a574' : PROVIDER_COLORS[p],
                      }}
                    >
                      <span className="truncate">{PROVIDER_LABELS[p]}</span>
                      {!isConfigured && p !== 'local' && (
                        <span className="text-[8px] text-[#ef4444] font-normal shrink-0 ml-1">
                          [NO KEY]
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="model-select" className="text-[#9ca3af] uppercase tracking-wider text-[10px]">
                  MODEL
                </label>
                <span className="text-[#d4a574] text-[9px]">
                  ${(selectedModelDef.costPerImage || 0).toFixed(3)}/IMG
                </span>
              </div>
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#0b0d12] border border-[#1f2937] px-2 py-1.5 text-[#ffffff] focus:border-[#d4a574] focus:outline-none text-[11px]"
              >
                {filteredModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio Selector (Touching edge pills, 0 gap, 0 radius) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[#9ca3af] uppercase tracking-wider text-[10px]">
                  ASPECT RATIO
                </label>
                <span className="text-[#6b7280] text-[9px]">
                  {dims.width}x{dims.height}
                </span>
              </div>
              <div className="flex w-full border border-[#1f2937]">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = aspectRatio === ratio;
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`flex-1 py-1 text-center text-[10px] font-bold uppercase transition-colors ${
                        isSelected
                          ? 'bg-[#d4a574] text-[#0b0d12]'
                          : 'bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
                      }`}
                    >
                      {ratio}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt-input" className="text-[#9ca3af] uppercase tracking-wider text-[10px]">
                  PROMPT
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-[#6b7280] text-[9px]">
                    {prompt.length}/8000
                  </span>
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={isEnhancing || !prompt.trim()}
                    className="flex items-center space-x-1 text-[#d4a574] hover:text-[#e0b585] disabled:text-[#4b5563] text-[9px] uppercase font-bold"
                    title="Expand prompt semantics with Gemini"
                  >
                    <Sparkles size={10} className={isEnhancing ? 'animate-spin' : ''} />
                    <span>{isEnhancing ? 'EXPANDING...' : '[ENHANCE]'}</span>
                  </button>
                </div>
              </div>
              <textarea
                id="prompt-input"
                rows={4}
                maxLength={8000}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Detailed description of visual subject, lighting, mood, artistic medium..."
                className="w-full bg-[#0b0d12] border border-[#1f2937] p-2 text-[#ffffff] placeholder-[#525660] focus:border-[#d4a574] focus:outline-none text-[11px] leading-relaxed resize-y"
              />
            </div>

            {/* Advanced Settings Toggle */}
            <div className="border border-[#1f2937] bg-[#0b0d12]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-2 py-1.5 flex items-center justify-between text-[#9ca3af] hover:text-[#ffffff] text-[10px] uppercase font-bold"
              >
                <span>ADVANCED SETTINGS</span>
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showAdvanced && (
                <div className="p-2 border-t border-[#1f2937] space-y-2.5 bg-[#0e1017]">
                  {/* Negative Prompt */}
                  <div className="space-y-1">
                    <label htmlFor="negative-prompt" className="text-[#9ca3af] uppercase tracking-wider text-[9px] block">
                      NEGATIVE PROMPT
                    </label>
                    <input
                      id="negative-prompt"
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="blurry, distorted, low quality, artifacts..."
                      className="w-full bg-[#0b0d12] border border-[#1f2937] px-2 py-1 text-[#ffffff] placeholder-[#525660] focus:border-[#d4a574] focus:outline-none text-[10px]"
                    />
                  </div>

                  {/* Number of Outputs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-[#9ca3af] uppercase">NUM OUTPUTS</span>
                      <span className="text-[#ffffff] font-bold">{numOutputs}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={1}
                      value={numOutputs}
                      onChange={(e) => setNumOutputs(Number(e.target.value))}
                      className="w-full accent-[#d4a574] bg-[#0b0d12] cursor-pointer"
                    />
                  </div>

                  {/* Seed Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-[#9ca3af] uppercase">SEED</span>
                      <button
                        type="button"
                        onClick={handleRandomizeSeed}
                        className="text-[#d4a574] hover:text-[#e0b585] text-[9px] uppercase font-bold"
                      >
                        [RANDOM]
                      </button>
                    </div>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      className="w-full bg-[#0b0d12] border border-[#1f2937] px-2 py-1 text-[#ffffff] focus:border-[#d4a574] focus:outline-none text-[10px]"
                    />
                    
                    {/* Auto-randomize Seed Checkbox */}
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        id="auto-randomize-checkbox"
                        type="checkbox"
                        checked={autoRandomize}
                        onChange={(e) => setAutoRandomize(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#d4a574] rounded-none cursor-pointer border border-[#1f2937] bg-[#0b0d12]"
                      />
                      <label
                        htmlFor="auto-randomize-checkbox"
                        className="text-[#9ca3af] uppercase text-[9px] tracking-wider cursor-pointer select-none"
                      >
                        Auto-randomize Seed
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#1f2937]">
            {error && (
              <div className="bg-[#1f1315] border border-[#ef4444] text-[#ef4444] p-2 text-[10px] leading-tight flex items-start space-x-1.5">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Generate Button (44px, full width, gold bg) */}
            <button
              id="generate-button"
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full h-11 bg-[#d4a574] hover:bg-[#e0b585] disabled:bg-[#2a3140] text-[#0b0d12] disabled:text-[#6b7280] font-bold uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <Wand2 size={13} />
                  <span>GENERATE WITH {PROVIDER_LABELS[provider].toUpperCase()}</span>
                </>
              )}
            </button>

            {/* Cancel Button */}
            {isLoading && (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full h-8 bg-[#181b22] hover:bg-[#1f232b] text-[#ef4444] border border-[#ef4444]/40 font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center space-x-1.5"
              >
                <XCircle size={12} />
                <span>CANCEL GENERATION</span>
              </button>
            )}
          </div>
        </form>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          CENTER CANVAS: PREVIEW & HISTORY (flex: 1)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="image-gen-center-canvas"
        className="flex-1 bg-[#0b0d12] flex flex-col p-3 space-y-3 overflow-y-auto min-w-0"
      >
        {/* Main Canvas Display Area */}
        <div className="flex-1 min-h-[380px] bg-[#0e1017] border border-[#1f2937] flex flex-col items-center justify-center relative p-3 overflow-hidden">
          {/* Laser Scan Line during active synthesis */}
          {isLoading && <div className="scan-laser-line" />}

          {/* Canvas Content */}
          {isLoading ? (
            <div className="w-full max-w-lg space-y-3 text-center p-4">
              <div className="w-16 h-16 mx-auto border border-[#d4a574] bg-[#0b0d12] flex items-center justify-center text-[#d4a574]">
                <LoadingSpinner size="medium" />
              </div>
              <div className="space-y-1">
                <div className="text-[12px] font-bold text-[#ffffff] uppercase tracking-wider">
                  GENERATING SYNTHETIC FRAME BUFFER
                </div>
                <div className="text-[10px] text-[#d4a574]">
                  {pollingStats?.message || 'Dispatching neural weights to compute cluster...'}
                </div>
                <div className="text-[9px] text-[#6b7280]">
                  STAGE: {pollingStats?.stage || 'PROCESSING'} | PROGRESS: {progressPercent}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#181b22] h-1 border border-[#1f2937] overflow-hidden">
                <div
                  className="bg-[#d4a574] h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Telemetry Log Stream */}
              {telemetryLogs.length > 0 && (
                <div className="bg-[#0b0d12] border border-[#1f2937] p-2 text-left text-[9px] text-[#9ca3af] max-h-24 overflow-y-auto space-y-0.5">
                  {telemetryLogs.map((log, i) => (
                    <div key={i} className="truncate">
                      <span className="text-[#6b7280]">[{log.timestamp}]</span>{' '}
                      <span
                        className={
                          log.level === 'OK'
                            ? 'text-[#10b981]'
                            : log.level === 'ERR'
                            ? 'text-[#ef4444]'
                            : log.level === 'RUN'
                            ? 'text-[#d4a574]'
                            : 'text-[#9ca3af]'
                        }
                      >
                        [{log.level}]
                      </span>{' '}
                      <span className="text-[#d4d4d8]">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeImage ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
              {/* Generated Image Container with Click-to-Inspect */}
              <div
                id="active-generated-image-container"
                onClick={handleOpenLightboxForActive}
                className="relative max-w-full max-h-[calc(100vh-280px)] flex items-center justify-center border border-[#1f2937] hover:border-[#d4a574] bg-[#0b0d12] overflow-hidden cursor-zoom-in group transition-all"
                title="Click to open Fullscreen Lightbox with metadata overlay"
              >
                <img
                  src={activeImage}
                  alt={prompt}
                  className="max-w-full max-h-[calc(100vh-280px)] object-contain group-hover:scale-[1.01] transition-transform duration-200"
                />

                {/* Hover Inspect Indicator */}
                <div className="absolute inset-0 bg-[#0b0d12]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-[#11131a]/95 border border-[#d4a574] text-[#d4a574] px-3 py-1.5 font-bold uppercase text-[10px] flex items-center space-x-1.5 shadow-2xl backdrop-blur-sm">
                    <Maximize2 size={12} />
                    <span>[CLICK TO EXPAND & INSPECT METADATA]</span>
                  </div>
                </div>

                {/* Corner quick inspect badge */}
                <div className="absolute top-2 right-2 bg-[#11131a]/90 text-[#d4a574] border border-[#1f2937] p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={12} />
                </div>
              </div>

              {/* Batch Variations Row (if multiple images generated) */}
              {generatedImages.length > 1 && (
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-[9px] text-[#6b7280] uppercase">VARIATIONS:</span>
                  {generatedImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-9 h-9 border overflow-hidden p-0.5 ${
                        activeImageIndex === idx
                          ? 'border-[#d4a574] bg-[#181b22]'
                          : 'border-[#1f2937] bg-[#0b0d12] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Var ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center p-8 space-y-2">
              <ImageIcon size={32} className="mx-auto text-[#1f2937]" />
              <div className="text-[#6b7280] text-[11px] uppercase tracking-wider font-bold">
                Generate an image to preview
              </div>
              <div className="text-[#525660] text-[9px] max-w-xs mx-auto">
                Configure your prompt and model parameters in the left panel to synthesize high-resolution artwork.
              </div>
            </div>
          )}
        </div>

        {/* Info Row & Canvas Action Bar */}
        {activeImage && lastGenInfo && !isLoading && (
          <div className="bg-[#11131a] border border-[#1f2937] p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
            {/* Metadata Badges */}
            <div className="flex items-center flex-wrap gap-2 text-[10px]">
              <span
                className="px-1.5 py-0.5 font-bold uppercase text-[#ffffff]"
                style={{ backgroundColor: PROVIDER_COLORS[lastGenInfo.provider] }}
              >
                {PROVIDER_LABELS[lastGenInfo.provider]}
              </span>
              <span className="text-[#9ca3af] border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12]">
                {lastGenInfo.modelLabel}
              </span>
              <span className="text-[#9ca3af] border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12]">
                {lastGenInfo.dimensions}
              </span>
              <span className="text-[#9ca3af] border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12]">
                {lastGenInfo.aspectRatio}
              </span>
              <span className="text-[#6b7280] text-[9px]">
                SEED: {lastGenInfo.seed}
              </span>
              <span className="text-[#d4a574] text-[9px]">
                ${lastGenInfo.cost.toFixed(3)} ({lastGenInfo.timeMs}ms)
              </span>
            </div>

            {/* Quick Canvas Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                id="canvas-save-style-btn"
                type="button"
                onClick={() => setSaveStyleModalOpen(true)}
                className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#d4a574] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
                title="Save current parameters as a Style Preset"
              >
                <Bookmark size={11} />
                <span>SAVE AS STYLE</span>
              </button>

              <button
                id="canvas-inspect-btn"
                type="button"
                onClick={handleOpenLightboxForActive}
                className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#d4a574] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
                title="Inspect in Fullscreen Lightbox"
              >
                <Maximize2 size={11} />
                <span>INSPECT</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyData(activeImage)}
                className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
              >
                {copied ? <Check size={11} className="text-[#10b981]" /> : <Copy size={11} />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(activeImage)}
                className="px-2.5 py-1 bg-[#d4a574] hover:bg-[#e0b585] text-[#0b0d12] font-bold text-[10px] uppercase flex items-center space-x-1"
              >
                <Download size={11} />
                <span>DOWNLOAD</span>
              </button>
            </div>
          </div>
        )}

        {/* Center Canvas Bottom: History Strip */}
        <div className="bg-[#11131a] border border-[#1f2937] p-2 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-1.5">
              <Clock size={12} className="text-[#d4a574]" />
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[10px]">
                RECENT HISTORY [{history.length}]
              </span>
            </div>
            <span className="text-[#6b7280] text-[9px]">CLICK THUMBNAIL TO LOAD OR HOVER TO INSPECT</span>
          </div>

          {history.length === 0 ? (
            <div className="py-3 text-center text-[#6b7280] text-[9px] uppercase tracking-wider">
              No previous generation runs
            </div>
          ) : (
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin pb-1 pt-0.5">
              {history.slice(0, 20).map((item) => {
                const thumb = item.images[0];
                const isActive = activeImage === thumb;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleRestoreHistory(item)}
                    className={`w-16 h-16 min-w-[64px] min-h-[64px] bg-[#0b0d12] border cursor-pointer relative group shrink-0 overflow-hidden transition-all ${
                      isActive ? 'border-[#d4a574] ring-1 ring-[#d4a574]' : 'border-[#1f2937] hover:border-[#d4a574]'
                    }`}
                    title={`${item.prompt} (${item.model}) - Click to restore`}
                  >
                    <img src={thumb} alt={item.prompt} className="w-full h-full object-cover" />
                    <span
                      className="absolute top-0.5 left-0.5 w-1.5 h-1.5"
                      style={{ backgroundColor: PROVIDER_COLORS[item.provider] }}
                    />
                    {/* Hover Inspect Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLightboxForHistory(item);
                      }}
                      className="absolute inset-0 bg-[#0b0d12]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#d4a574] transition-opacity"
                      title="Inspect in Lightbox"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: SUB-TABS (ASSETS, WILDCARDS, STYLES)
      ───────────────────────────────────────────────────────────── */}
      <RightStudioPanel
        history={history}
        activeImage={activeImage}
        currentPrompt={prompt}
        onSelectAsset={handleRestoreHistory}
        onInspectAsset={handleOpenLightboxForHistory}
        onDeleteAsset={(id) => {
          deleteHistoryItem(id);
          refreshHistory();
        }}
        onClearAllAssets={() => {
          clearGenerationHistory();
          refreshHistory();
        }}
        onAppendPrompt={handleAppendPrompt}
        onSetPrompt={handleSetPrompt}
        onApplyStylePreset={handleApplyStylePreset}
      />

      {/* ─────────────────────────────────────────────────────────────
          SAVE AS STYLE PRESET MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeImage && lastGenInfo && (
        <SaveStyleModal
          isOpen={saveStyleModalOpen}
          onClose={() => setSaveStyleModalOpen(false)}
          prompt={prompt}
          negativePrompt={negativePrompt}
          provider={lastGenInfo.provider}
          model={lastGenInfo.modelLabel || model}
          aspectRatio={lastGenInfo.aspectRatio}
          seed={lastGenInfo.seed}
          previewImage={activeImage}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          FULLSCREEN LIGHTBOX MODAL WITH METADATA OVERLAY
      ───────────────────────────────────────────────────────────── */}
      {lightboxData && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={lightboxData.imageUrl}
          images={lightboxData.images}
          initialIndex={lightboxData.initialIndex}
          metadata={lightboxData.metadata}
        />
      )}
    </div>
  );
};
