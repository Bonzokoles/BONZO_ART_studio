import React, { useState, useEffect, useRef } from 'react';
import type { UploadedFile, ProgressStage, TelemetryLog, HistoryItem } from '../../types';
import { ImageUpload } from '../../components/ImageUpload';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ProgressIndicator } from '../../components/ProgressIndicator';
import { AssetLibraryPanel } from '../../components/AssetLibraryPanel';
import { ImageLightbox, LightboxMetadata } from '../../components/ImageLightbox';
import { analyzeImage } from '../../services/geminiService';
import {
  loadGenerationHistory,
  deleteHistoryItem,
  clearGenerationHistory,
} from '../../services/providerEngine';
import {
  ScanSearch,
  AlertTriangle,
  Copy,
  Check,
  Code,
  Layers,
  Palette,
  Eye,
  Sparkles,
  Sliders,
  Clock,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';

const ANALYSIS_STAGES: ProgressStage[] = [
  {
    id: 'stage-1',
    code: 'INGEST',
    label: 'IMAGE BYTE STREAM INGESTION',
    status: 'pending',
    detail: 'Reading base64 inline data & image geometry',
  },
  {
    id: 'stage-2',
    code: 'VISION',
    label: 'MULTIMODAL FEATURE SCAN',
    status: 'pending',
    detail: 'Extracting object boundaries, lighting vectors & palette',
  },
  {
    id: 'stage-3',
    code: 'INFER',
    label: 'SEMANTIC REASONING',
    status: 'pending',
    detail: 'Gemini 2.5 Flash computing contextual scene breakdown',
  },
  {
    id: 'stage-4',
    code: 'SYNTH',
    label: 'REPORT STRUCTURE GENERATION',
    status: 'pending',
    detail: 'Formatting descriptive analysis tokens',
  },
];

const getTimestamp = (): string => {
  return new Date().toTimeString().split(' ')[0];
};

interface ParsedAnalysis {
  description?: string;
  objects?: string[];
  colors?: string[];
  style?: string;
  mood?: string;
}

export const ImageAnalysisTab: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<string | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'json'>('structured');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{
    imageUrl: string;
    images: string[];
    initialIndex: number;
    metadata: LightboxMetadata;
  } | null>(null);

  // Telemetry & Stage Progress State
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stages, setStages] = useState<ProgressStage[]>(ANALYSIS_STAGES);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const stageTimerRef = useRef<NodeJS.Timeout[]>([]);

  const refreshHistory = () => {
    setHistory(loadGenerationHistory());
  };

  const clearStageTimers = () => {
    stageTimerRef.current.forEach((t) => clearTimeout(t));
    stageTimerRef.current = [];
  };

  useEffect(() => {
    refreshHistory();
    const handleUpdate = () => refreshHistory();
    window.addEventListener('bonzo-history-updated', handleUpdate);
    return () => {
      clearStageTimers();
      window.removeEventListener('bonzo-history-updated', handleUpdate);
    };
  }, []);

  const addLog = (level: TelemetryLog['level'], message: string) => {
    setTelemetryLogs((prev) => [
      ...prev,
      { timestamp: getTimestamp(), level, message },
    ]);
  };

  const handleCopy = () => {
    if (rawAnalysis) {
      navigator.clipboard.writeText(rawAnalysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectAssetForAnalysis = (item: HistoryItem) => {
    const img = item.images[0];
    setUploadedFile({
      name: `asset-${item.id}.png`,
      size: 500000,
      mimeType: 'image/png',
      preview: img,
      base64: img.replace(/^data:image\/\w+;base64,/, ''),
    });
    setRawAnalysis(null);
    setParsedAnalysis(null);
  };

  const handleOpenLightboxForSource = () => {
    if (!uploadedFile) return;
    setLightboxData({
      imageUrl: uploadedFile.preview,
      images: [uploadedFile.preview],
      initialIndex: 0,
      metadata: {
        prompt: parsedAnalysis?.description || uploadedFile.name,
        provider: 'google',
        model: 'gemini-2.5-flash',
        aspectRatio: 'SOURCE',
        timestamp: getTimestamp(),
        title: 'Multimodal Image Analysis',
        rawPayload: parsedAnalysis ? (parsedAnalysis as any) : undefined,
      },
    });
    setLightboxOpen(true);
  };

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
      },
    });
    setLightboxOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      setError('INPUT_ERROR: Please upload an image to analyze.');
      return;
    }

    clearStageTimers();
    setIsLoading(true);
    setError(null);
    setRawAnalysis(null);
    setParsedAnalysis(null);
    setCurrentStageIndex(0);
    setProgressPercent(15);

    const initialLogs: TelemetryLog[] = [
      {
        timestamp: getTimestamp(),
        level: 'RUN',
        message: `DISPATCH -> MODEL: gemini-2.5-flash | MIME: ${uploadedFile.mimeType}`,
      },
      {
        timestamp: getTimestamp(),
        level: 'INFO',
        message: `INPUT_BUFFER: ${Math.round(uploadedFile.base64.length / 1024)} KB encoded payload`,
      },
    ];
    setTelemetryLogs(initialLogs);

    const t1 = setTimeout(() => {
      setCurrentStageIndex(1);
      setProgressPercent(42);
      addLog('RUN', 'VISION_TRANSFORMER: Extracting salient objects, environment & scene composition');
    }, 1000);

    const t2 = setTimeout(() => {
      setCurrentStageIndex(2);
      setProgressPercent(74);
      addLog('RUN', 'SEMANTIC_REASONING: Decoding color balance, artistic genre & mood attributes');
    }, 2400);

    const t3 = setTimeout(() => {
      setCurrentStageIndex(3);
      setProgressPercent(92);
      addLog('INFO', 'OUTPUT_SERIALIZATION: Compiling validated JSON schema');
    }, 4000);

    stageTimerRef.current = [t1, t2, t3];

    try {
      const resultText = await analyzeImage(uploadedFile);
      clearStageTimers();
      setCurrentStageIndex(3);
      setProgressPercent(100);
      setRawAnalysis(resultText);

      try {
        const parsed = JSON.parse(resultText);
        setParsedAnalysis(parsed);
      } catch {
        setParsedAnalysis({ description: resultText });
      }

      addLog('OK', 'COMPLETED: Multimodal feature extraction verified');
    } catch (err) {
      clearStageTimers();
      const msg = err instanceof Error ? err.message : 'Vision analysis operation failed.';
      setError(msg);
      addLog('ERR', `FAILURE: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="image-analysis-tab" className="flex-1 flex flex-col md:flex-row overflow-hidden w-full font-mono text-xs select-none">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: ANALYSIS CONTROLS (320px fixed)
      ───────────────────────────────────────────────────────────── */}
      <aside
        id="image-analysis-left-panel"
        className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] bg-[#11131a] border-r border-[#1f2937] p-3 space-y-3 overflow-y-auto flex flex-col shrink-0"
      >
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Sliders size={13} className="text-[#d4a574]" />
                <span>VISION CONTROLS</span>
              </span>
              <span className="text-[#9ca3af] text-[9px]">GEMINI 2.5 FLASH</span>
            </div>

            {/* Source Image Upload */}
            <div className="space-y-1">
              <label className="text-[#9ca3af] uppercase tracking-wider text-[10px] block">
                IMAGE TO ANALYZE
              </label>
              <ImageUpload
                onImageSelect={setUploadedFile}
                selectedImage={uploadedFile}
                onClear={() => {
                  setUploadedFile(null);
                  setRawAnalysis(null);
                  setParsedAnalysis(null);
                }}
              />
            </div>

            <div className="bg-[#0b0d12] border border-[#1f2937] p-2 text-[10px] text-[#9ca3af] space-y-1">
              <span className="text-[#d4a574] font-bold block">[CAPABILITIES]</span>
              <div>• Scene description & composition</div>
              <div>• Object detection & salient elements</div>
              <div>• Hex color palette extraction</div>
              <div>• Artistic medium & lighting style</div>
              <div>• Mood & aesthetic atmosphere</div>
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

            <button
              id="execute-analysis-btn"
              type="submit"
              disabled={isLoading || !uploadedFile}
              className="w-full h-11 bg-[#d4a574] hover:bg-[#e0b585] disabled:bg-[#2a3140] text-[#0b0d12] disabled:text-[#6b7280] font-bold uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>ANALYZING IMAGE...</span>
                </>
              ) : (
                <>
                  <ScanSearch size={13} />
                  <span>ANALYZE WITH GEMINI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          CENTER CANVAS: PREVIEW & ANALYSIS CARDS (flex: 1)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="image-analysis-center-canvas"
        className="flex-1 bg-[#0b0d12] flex flex-col p-3 space-y-3 overflow-y-auto min-w-0"
      >
        {/* Main Canvas Display Area */}
        <div className="flex-1 min-h-[380px] bg-[#0e1017] border border-[#1f2937] flex flex-col items-center justify-center relative p-3 overflow-hidden">
          {isLoading && <div className="scan-laser-line" />}

          {isLoading ? (
            <div className="w-full max-w-lg space-y-3 text-center p-4">
              <div className="w-16 h-16 mx-auto border border-[#d4a574] bg-[#0b0d12] flex items-center justify-center text-[#d4a574]">
                <LoadingSpinner size="medium" />
              </div>
              <div className="space-y-1">
                <div className="text-[12px] font-bold text-[#ffffff] uppercase tracking-wider">
                  SCANNING IMAGE FEATURES
                </div>
                <div className="text-[10px] text-[#d4a574]">
                  Gemini 2.5 Flash evaluating visual geometry & semantic vectors...
                </div>
                <div className="text-[9px] text-[#6b7280]">
                  STAGE: {stages[currentStageIndex]?.code || 'VISION'} | PROGRESS: {progressPercent}%
                </div>
              </div>

              <div className="w-full bg-[#181b22] h-1 border border-[#1f2937] overflow-hidden">
                <div className="bg-[#d4a574] h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>

              {telemetryLogs.length > 0 && (
                <div className="bg-[#0b0d12] border border-[#1f2937] p-2 text-left text-[9px] text-[#9ca3af] max-h-24 overflow-y-auto space-y-0.5">
                  {telemetryLogs.map((log, i) => (
                    <div key={i} className="truncate">
                      <span className="text-[#6b7280]">[{log.timestamp}]</span>{' '}
                      <span className={log.level === 'OK' ? 'text-[#10b981]' : log.level === 'ERR' ? 'text-[#ef4444]' : 'text-[#d4a574]'}>
                        [{log.level}]
                      </span>{' '}
                      <span className="text-[#d4d4d8]">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : rawAnalysis ? (
            <div className="w-full h-full flex flex-col space-y-3 overflow-y-auto p-1">
              {/* Image Thumbnail & Summary */}
              {uploadedFile && (
                <div className="flex items-center space-x-3 bg-[#0b0d12] border border-[#1f2937] p-2">
                  <img src={uploadedFile.preview} alt="Analyzed" className="w-14 h-14 object-cover border border-[#1f2937]" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[#d4a574] text-[10px] font-bold block uppercase">[VISION SCAN COMPLETE]</span>
                    <span className="text-[#ffffff] text-[11px] truncate block">{uploadedFile.name}</span>
                    <span className="text-[#6b7280] text-[9px]">MODEL: gemini-2.5-flash</span>
                  </div>
                </div>
              )}

              {/* View Mode Content */}
              {viewMode === 'structured' && parsedAnalysis ? (
                <div className="space-y-2">
                  {/* Description */}
                  {parsedAnalysis.description && (
                    <div className="bg-[#0b0d12] border border-[#1f2937] p-3 space-y-1">
                      <span className="text-[#d4a574] text-[10px] font-bold block uppercase flex items-center space-x-1">
                        <Eye size={12} />
                        <span>SCENE DESCRIPTION</span>
                      </span>
                      <p className="text-[#d4d4d8] text-[11px] leading-relaxed font-sans">{parsedAnalysis.description}</p>
                    </div>
                  )}

                  {/* Objects Grid */}
                  {parsedAnalysis.objects && parsedAnalysis.objects.length > 0 && (
                    <div className="bg-[#0b0d12] border border-[#1f2937] p-3 space-y-1.5">
                      <span className="text-[#4285f4] text-[10px] font-bold block uppercase flex items-center space-x-1">
                        <Layers size={12} />
                        <span>SALIENT OBJECTS DETECTED [{parsedAnalysis.objects.length}]</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedAnalysis.objects.map((obj, i) => (
                          <span key={i} className="bg-[#181b22] text-[#ffffff] border border-[#1f2937] px-2 py-0.5 text-[10px]">
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Palette */}
                  {parsedAnalysis.colors && parsedAnalysis.colors.length > 0 && (
                    <div className="bg-[#0b0d12] border border-[#1f2937] p-3 space-y-1.5">
                      <span className="text-[#10b981] text-[10px] font-bold block uppercase flex items-center space-x-1">
                        <Palette size={12} />
                        <span>EXTRACTED PALETTE</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {parsedAnalysis.colors.map((col, i) => (
                          <div key={i} className="flex items-center space-x-1.5 bg-[#181b22] border border-[#1f2937] px-2 py-1">
                            <span className="w-3.5 h-3.5 border border-[#1f2937]" style={{ backgroundColor: col }} />
                            <span className="text-[#ffffff] text-[10px]">{col}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Style & Mood Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {parsedAnalysis.style && (
                      <div className="bg-[#0b0d12] border border-[#1f2937] p-3 space-y-1">
                        <span className="text-[#a855f7] text-[10px] font-bold block uppercase flex items-center space-x-1">
                          <Sparkles size={12} />
                          <span>ARTISTIC STYLE</span>
                        </span>
                        <div className="text-[#ffffff] text-[11px]">{parsedAnalysis.style}</div>
                      </div>
                    )}
                    {parsedAnalysis.mood && (
                      <div className="bg-[#0b0d12] border border-[#1f2937] p-3 space-y-1">
                        <span className="text-[#f59e0b] text-[10px] font-bold block uppercase">MOOD / ATMOSPHERE</span>
                        <div className="text-[#ffffff] text-[11px]">{parsedAnalysis.mood}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[#0b0d12] border border-[#1f2937] p-3 overflow-x-auto">
                  <pre className="text-[#10b981] text-[10px] font-mono whitespace-pre-wrap">{rawAnalysis}</pre>
                </div>
              )}
            </div>
          ) : uploadedFile ? (
            <div className="text-center p-4 space-y-2">
              <span className="text-[#9ca3af] uppercase text-[10px] block font-bold">[READY] IMAGE MOUNTED</span>
              <div
                onClick={handleOpenLightboxForSource}
                className="inline-block cursor-zoom-in group relative"
                title="Click to inspect in Lightbox"
              >
                <img src={uploadedFile.preview} alt="Source Preview" className="max-h-72 mx-auto border border-[#1f2937] group-hover:border-[#d4a574] transition-colors" />
                <div className="absolute inset-0 bg-[#0b0d12]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="bg-[#11131a]/95 border border-[#d4a574] text-[#d4a574] px-2.5 py-1 font-bold uppercase text-[10px] flex items-center space-x-1.5 shadow-xl">
                    <Maximize2 size={11} />
                    <span>[INSPECT IMAGE]</span>
                  </div>
                </div>
              </div>
              <div className="text-[#6b7280] text-[10px]">Click ANALYZE WITH GEMINI in left panel, or click image to inspect</div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-2">
              <ImageIcon size={32} className="mx-auto text-[#1f2937]" />
              <div className="text-[#6b7280] text-[11px] uppercase tracking-wider font-bold">
                Upload an image to inspect
              </div>
              <div className="text-[#525660] text-[9px] max-w-xs mx-auto">
                Use the left panel to upload an image or select an asset from the library to extract semantic intelligence.
              </div>
            </div>
          )}
        </div>

        {/* Action / View Bar */}
        {rawAnalysis && !isLoading && (
          <div className="bg-[#11131a] border border-[#1f2937] p-2 flex items-center justify-between gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#1f2937] bg-[#0b0d12]">
              <button
                type="button"
                onClick={() => setViewMode('structured')}
                className={`px-2 py-1 text-[10px] font-bold uppercase ${
                  viewMode === 'structured' ? 'bg-[#d4a574] text-[#0b0d12]' : 'text-[#9ca3af]'
                }`}
              >
                STRUCTURED
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`px-2 py-1 text-[10px] font-bold uppercase ${
                  viewMode === 'json' ? 'bg-[#d4a574] text-[#0b0d12]' : 'text-[#9ca3af]'
                }`}
              >
                RAW JSON
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-2">
              {uploadedFile && (
                <button
                  type="button"
                  onClick={handleOpenLightboxForSource}
                  className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#d4a574] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
                  title="Inspect in Lightbox"
                >
                  <Maximize2 size={11} />
                  <span>INSPECT IMAGE</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
              >
                {copied ? <Check size={11} className="text-[#10b981]" /> : <Copy size={11} />}
                <span>{copied ? 'COPIED JSON' : 'COPY JSON'}</span>
              </button>
            </div>
          </div>
        )}

        {/* History Strip */}
        <div className="bg-[#11131a] border border-[#1f2937] p-2 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center space-x-1.5">
              <Clock size={12} className="text-[#d4a574]" />
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[10px]">
                SAVED ASSETS [{history.length}]
              </span>
            </div>
            <span className="text-[#6b7280] text-[9px]">CLICK THUMBNAIL TO ANALYZE ASSET</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin pb-1 pt-0.5">
            {history.slice(0, 20).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectAssetForAnalysis(item)}
                className="w-16 h-16 min-w-[64px] min-h-[64px] bg-[#0b0d12] border border-[#1f2937] hover:border-[#d4a574] cursor-pointer relative shrink-0 overflow-hidden group"
                title={`${item.prompt} - Click to analyze, or hover to inspect`}
              >
                <img src={item.images[0]} alt={item.prompt} className="w-full h-full object-cover" />
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
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: ASSET LIBRARY (280px fixed)
      ───────────────────────────────────────────────────────────── */}
      <AssetLibraryPanel
        history={history}
        activeImage={uploadedFile?.preview}
        onSelectAsset={handleSelectAssetForAnalysis}
        onInspectAsset={handleOpenLightboxForHistory}
        onDeleteAsset={(id) => {
          deleteHistoryItem(id);
          refreshHistory();
        }}
        onClearAll={() => {
          clearGenerationHistory();
          refreshHistory();
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX MODAL
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
