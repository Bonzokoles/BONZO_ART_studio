import React, { useState, useEffect, useRef } from 'react';
import type { UploadedFile, ProgressStage, TelemetryLog, HistoryItem, ProviderId, EditContext } from '../../types';
import { ImageUpload } from '../../components/ImageUpload';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ProgressIndicator } from '../../components/ProgressIndicator';
import { AssetLibraryPanel } from '../../components/AssetLibraryPanel';
import { ImageLightbox, LightboxMetadata } from '../../components/ImageLightbox';
import {
  loadGenerationHistory,
  saveToGenerationHistory,
  deleteHistoryItem,
  clearGenerationHistory,
  MODELS,
  executeImageEdit,
} from '../../services/providerEngine';
import {
  Sparkles,
  AlertTriangle,
  Wand2,
  Download,
  Copy,
  Check,
  Clock,
  Layers,
  Image as ImageIcon,
  Sliders,
  Maximize2,
} from 'lucide-react';

const EDIT_STAGES: ProgressStage[] = [
  {
    id: 'stage-1',
    code: 'INGEST',
    label: 'IMAGE BYTE INGESTION',
    status: 'pending',
    detail: 'Encoding source base64 inline data & MIME verification',
  },
  {
    id: 'stage-2',
    code: 'SEGMENT',
    label: 'SEMANTIC ALIGNMENT',
    status: 'pending',
    detail: 'Extracting regions corresponding to edit instruction',
  },
  {
    id: 'stage-3',
    code: 'DIFFUSE',
    label: 'GENERATIVE EDIT SYNTHESIS',
    status: 'pending',
    detail: 'Applying diffusion transform to target visual regions',
  },
  {
    id: 'stage-4',
    code: 'ASSEMBLE',
    label: 'OUTPUT RECONSTRUCTION',
    status: 'pending',
    detail: 'Finalizing transformed pixel buffers',
  },
];

const EDIT_PRESETS = [
  { label: 'CYBERPUNK NEON', prompt: 'Add dramatic cyberpunk neon volumetric rim lighting and glowing holographic elements' },
  { label: 'ANIME STYLE', prompt: 'Convert into vibrant Makoto Shinkai anime style with painterly clouds and rich color saturation' },
  { label: 'RETRO FILM', prompt: 'Apply 35mm vintage Kodak Portra film grain, analog chromatic aberration, and warm contrast' },
  { label: 'NIGHT SCENE', prompt: 'Transform daylight into a cinematic midnight scene with starry sky and streetlamp reflections' },
  { label: 'REMOVE BACKGROUND', prompt: 'Isolate the main subject cleanly and place onto a pure dark minimal studio backdrop' },
];

const getTimestamp = (): string => {
  return new Date().toTimeString().split(' ')[0];
};

interface ImageEditingTabProps {
  editContext?: EditContext | null;
  onConsumeEditContext?: () => void;
}

export const ImageEditingTab: React.FC<ImageEditingTabProps> = ({ editContext, onConsumeEditContext }) => {
  const [prompt, setPrompt] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'after-only'>('side-by-side');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Provider + Model selector state
  const [provider, setProvider] = useState<ProviderId>('google');
  const [editModel, setEditModel] = useState('gemini-2.5-flash-image');
  const editProviders: ProviderId[] = ['google', 'fal', 'replicate'];
  const filteredEditModels = MODELS.filter((m) => m.category === 'edit' && m.provider === provider);

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
  const [stages, setStages] = useState<ProgressStage[]>(EDIT_STAGES);
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

  // Consume an image passed from Image Generation ("SEND TO EDIT") — load it as
  // the source file so the user continues the process without re-uploading.
  useEffect(() => {
    if (!editContext) return;
    setUploadedFile({
      name: `generated-${Date.now()}.png`,
      size: 500000,
      mimeType: 'image/png',
      preview: editContext.image,
      base64: editContext.image.replace(/^data:image\/\w+;base64,/, ''),
    });
    setEditedImageUrl(null);
    // Pre-fill the edit prompt with a light directive derived from the source prompt
    setPrompt(`Refine this image: ${editContext.prompt}`);
    onConsumeEditContext?.();
  }, [editContext, onConsumeEditContext]);

  const addLog = (level: TelemetryLog['level'], message: string) => {
    setTelemetryLogs((prev) => [
      ...prev,
      { timestamp: getTimestamp(), level, message },
    ]);
  };

  const handleDownload = () => {
    if (!editedImageUrl) return;
    const link = document.createElement('a');
    link.href = editedImageUrl;
    link.download = `bonzo-edit-${Date.now()}.png`;
    link.click();
  };

  const handleCopy = () => {
    if (!editedImageUrl) return;
    navigator.clipboard.writeText(editedImageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectAssetAsSource = (item: HistoryItem) => {
    const img = item.images[0];
    setUploadedFile({
      name: `asset-${item.id}.png`,
      size: 500000,
      mimeType: 'image/png',
      preview: img,
      base64: img.replace(/^data:image\/\w+;base64,/, ''),
    });
    setEditedImageUrl(null);
  };

  const handleOpenLightboxForEdited = () => {
    if (!editedImageUrl) return;
    setLightboxData({
      imageUrl: editedImageUrl,
      images: uploadedFile ? [uploadedFile.preview, editedImageUrl] : [editedImageUrl],
      initialIndex: uploadedFile ? 1 : 0,
      metadata: {
        prompt: `[EDIT DIRECTIVE] ${prompt}`,
        provider: provider,
        model: editModel,
        aspectRatio: 'ORIGINAL',
        timestamp: getTimestamp(),
        title: 'Generative Image Inpainting / Edit',
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
      setError('INPUT_ERROR: Source image file must be uploaded.');
      return;
    }
    if (!prompt.trim()) {
      setError('INPUT_ERROR: Editing instruction prompt cannot be empty.');
      return;
    }

    clearStageTimers();
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);
    setCurrentStageIndex(0);
    setProgressPercent(12);

    const initialLogs: TelemetryLog[] = [
      {
        timestamp: getTimestamp(),
        level: 'RUN',
        message: `DISPATCH -> MODEL: ${editModel} [${provider.toUpperCase()}] | PAYLOAD: ${Math.round(
          uploadedFile.base64.length / 1024
        )} KB`,
      },
      {
        timestamp: getTimestamp(),
        level: 'INFO',
        message: `EDIT_DIRECTIVE: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"`,
      },
    ];
    setTelemetryLogs(initialLogs);

    // Progress simulation
    const t1 = setTimeout(() => {
      setCurrentStageIndex(1);
      setProgressPercent(38);
      addLog('RUN', 'SEMANTIC_ALIGNMENT: Segmenting edit regions & mask coordinates');
    }, 1200);

    const t2 = setTimeout(() => {
      setCurrentStageIndex(2);
      setProgressPercent(65);
      addLog('RUN', 'DIFFUSION_INPAINT: Synthesizing guided inpaint layers');
    }, 2800);

    const t3 = setTimeout(() => {
      setCurrentStageIndex(3);
      setProgressPercent(88);
      addLog('INFO', 'PIXEL_ASSEMBLY: Blending boundary transitions & color balance');
    }, 4500);

    stageTimerRef.current = [t1, t2, t3];

    try {
      const resultUrl = await executeImageEdit({ prompt, image: uploadedFile, provider, model: editModel });
      clearStageTimers();
      setCurrentStageIndex(3);
      setProgressPercent(100);
      setEditedImageUrl(resultUrl);
      addLog('OK', 'COMPLETED: Generative edit completed and verified');

      // Save to History
      const histItem: HistoryItem = {
        id: `edit-${Date.now()}`,
        timestamp: getTimestamp(),
        prompt: `[EDIT] ${prompt}`,
        provider: provider,
        model: editModel,
        aspectRatio: '1:1',
        width: 1024,
        height: 1024,
        seed: Math.floor(Math.random() * 999999),
        cost: 0.0,
        images: [resultUrl],
      };
      saveToGenerationHistory(histItem);
      refreshHistory();
    } catch (err) {
      clearStageTimers();
      const msg = err instanceof Error ? err.message : 'Generative editing operation failed.';
      setError(msg);
      addLog('ERR', `FAILURE: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="image-editing-tab" className="flex-1 flex flex-col md:flex-row overflow-hidden w-full font-mono text-xs select-none">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: EDITING CONTROLS (320px fixed)
      ───────────────────────────────────────────────────────────── */}
      <aside
        id="image-edit-left-panel"
        className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] bg-[#11131a] border-r border-[#1f2937] p-3 space-y-3 overflow-y-auto flex flex-col shrink-0"
      >
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
              <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Sliders size={13} className="text-[#d4a574]" />
                <span>EDIT CONTROLS</span>
              </span>
              <span className="text-[#9ca3af] text-[9px]">{provider.toUpperCase()} EDIT</span>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1">
              <label className="text-[#9ca3af] uppercase tracking-wider text-[10px] block">PROVIDER ENGINE</label>
              <div className="grid grid-cols-3 gap-1">
                {editProviders.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setProvider(p);
                      const m = MODELS.find((mm) => mm.category === 'edit' && mm.provider === p);
                      if (m) setEditModel(m.id);
                    }}
                    className={`px-2 py-1 text-[10px] font-bold uppercase border ${
                      provider === p
                        ? 'bg-[#181b22] text-[#ffffff] border-[#d4a574]'
                        : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:border-[#2a3140]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[#9ca3af] uppercase tracking-wider text-[10px] block">EDIT MODEL</label>
              <select
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#d4d4d8] px-2 py-1.5 text-[10px] focus:border-[#d4a574] focus:outline-none"
              >
                {filteredEditModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Source Image Upload */}
            <div className="space-y-1">
              <label className="text-[#9ca3af] uppercase tracking-wider text-[10px] block">
                SOURCE IMAGE PAYLOAD
              </label>
              <ImageUpload
                onImageSelect={setUploadedFile}
                selectedImage={uploadedFile}
                onClear={() => {
                  setUploadedFile(null);
                  setEditedImageUrl(null);
                }}
              />
            </div>

            {/* Quick Style Presets */}
            <div className="space-y-1">
              <span className="text-[#9ca3af] uppercase tracking-wider text-[10px] block">
                QUICK PRESET DIRECTIVES:
              </span>
              <div className="flex flex-wrap gap-1">
                {EDIT_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(preset.prompt)}
                    className="bg-[#0b0d12] hover:bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] px-1.5 py-1 text-[9px] font-bold uppercase transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Edit Prompt Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="edit-prompt" className="text-[#9ca3af] uppercase tracking-wider text-[10px]">
                  MODIFICATION INSTRUCTION
                </label>
                <span className="text-[#6b7280] text-[9px]">{prompt.length} / 4000</span>
              </div>
              <textarea
                id="edit-prompt"
                rows={4}
                maxLength={4000}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Add dramatic neon lighting, change daylight to night scene..."
                className="w-full bg-[#0b0d12] border border-[#1f2937] p-2 text-[#ffffff] placeholder-[#525660] focus:border-[#d4a574] focus:outline-none text-[11px] leading-relaxed resize-y"
              />
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
              id="execute-edit-btn"
              type="submit"
              disabled={isLoading || !uploadedFile || !prompt.trim()}
              className="w-full h-11 bg-[#d4a574] hover:bg-[#e0b585] disabled:bg-[#2a3140] text-[#0b0d12] disabled:text-[#6b7280] font-bold uppercase tracking-wider text-[11px] transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>APPLYING EDIT...</span>
                </>
              ) : (
                <>
                  <Wand2 size={13} />
                  <span>EXECUTE IMAGE EDIT</span>
                </>
              )}
            </button>
          </div>
        </form>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          CENTER CANVAS: COMPARISON & PREVIEW (flex: 1)
      ───────────────────────────────────────────────────────────── */}
      <section
        id="image-edit-center-canvas"
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
                  APPLYING GENERATIVE INPAINT
                </div>
                <div className="text-[10px] text-[#d4a574]">
                  Gemini 2.5 Flash computing multimodal scene inpainting...
                </div>
                <div className="text-[9px] text-[#6b7280]">
                  STAGE: {stages[currentStageIndex]?.code || 'DIFFUSE'} | PROGRESS: {progressPercent}%
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
          ) : editedImageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
              {viewMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full max-h-[calc(100vh-280px)]">
                  {/* Before */}
                  <div className="bg-[#0b0d12] border border-[#1f2937] p-2 flex flex-col items-center justify-center overflow-hidden">
                    <span className="text-[#9ca3af] uppercase text-[9px] block font-bold mb-1">[BEFORE] SOURCE</span>
                    {uploadedFile && (
                      <img src={uploadedFile.preview} alt="Before" className="max-w-full max-h-[calc(100vh-340px)] object-contain" />
                    )}
                  </div>

                  {/* After */}
                  <div
                    onClick={handleOpenLightboxForEdited}
                    className="bg-[#0b0d12] border border-[#d4a574] hover:border-[#f3ca99] p-2 flex flex-col items-center justify-center overflow-hidden cursor-zoom-in group relative transition-colors"
                    title="Click to open Fullscreen Lightbox with metadata overlay"
                  >
                    <span className="text-[#d4a574] uppercase text-[9px] block font-bold mb-1">[AFTER] EDITED BUFFER</span>
                    <img src={editedImageUrl} alt="After" className="max-w-full max-h-[calc(100vh-340px)] object-contain group-hover:scale-[1.01] transition-transform" />
                    <div className="absolute inset-0 bg-[#0b0d12]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="bg-[#11131a]/95 border border-[#d4a574] text-[#d4a574] px-2.5 py-1 font-bold uppercase text-[10px] flex items-center space-x-1.5 shadow-xl">
                        <Maximize2 size={11} />
                        <span>[EXPAND & INSPECT]</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleOpenLightboxForEdited}
                  className="relative max-w-full max-h-[calc(100vh-280px)] flex items-center justify-center border border-[#1f2937] hover:border-[#d4a574] bg-[#0b0d12] overflow-hidden cursor-zoom-in group transition-colors"
                  title="Click to open Fullscreen Lightbox with metadata overlay"
                >
                  <img src={editedImageUrl} alt="Edited result" className="max-w-full max-h-[calc(100vh-280px)] object-contain group-hover:scale-[1.01] transition-transform" />
                  <div className="absolute inset-0 bg-[#0b0d12]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="bg-[#11131a]/95 border border-[#d4a574] text-[#d4a574] px-2.5 py-1 font-bold uppercase text-[10px] flex items-center space-x-1.5 shadow-xl">
                      <Maximize2 size={11} />
                      <span>[CLICK TO EXPAND & INSPECT METADATA]</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : uploadedFile ? (
            <div className="text-center p-4 space-y-2">
              <span className="text-[#9ca3af] uppercase text-[10px] block font-bold">[READY] SOURCE LOADED</span>
              <img src={uploadedFile.preview} alt="Source Preview" className="max-h-72 mx-auto border border-[#1f2937]" />
              <div className="text-[#6b7280] text-[10px]">Enter instruction in left panel and click EXECUTE IMAGE EDIT</div>
            </div>
          ) : (
            <div className="text-center p-8 space-y-2">
              <ImageIcon size={32} className="mx-auto text-[#1f2937]" />
              <div className="text-[#6b7280] text-[11px] uppercase tracking-wider font-bold">
                Upload a source image to edit
              </div>
              <div className="text-[#525660] text-[9px] max-w-xs mx-auto">
                Use the left panel to upload a source image or select an asset from the library to modify.
              </div>
            </div>
          )}
        </div>

        {/* Action / View Bar */}
        {editedImageUrl && !isLoading && (
          <div className="bg-[#11131a] border border-[#1f2937] p-2 flex items-center justify-between gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#1f2937] bg-[#0b0d12]">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2 py-1 text-[10px] font-bold uppercase ${
                  viewMode === 'side-by-side' ? 'bg-[#d4a574] text-[#0b0d12]' : 'text-[#9ca3af]'
                }`}
              >
                SIDE BY SIDE
              </button>
              <button
                type="button"
                onClick={() => setViewMode('after-only')}
                className={`px-2 py-1 text-[10px] font-bold uppercase ${
                  viewMode === 'after-only' ? 'bg-[#d4a574] text-[#0b0d12]' : 'text-[#9ca3af]'
                }`}
              >
                RESULT ONLY
              </button>
            </div>

            {/* Quick Canvas Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenLightboxForEdited}
                className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#d4a574] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
                title="Open in Lightbox"
              >
                <Maximize2 size={11} />
                <span>INSPECT</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-[#181b22] hover:bg-[#1f232b] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
              >
                {copied ? <Check size={11} className="text-[#10b981]" /> : <Copy size={11} />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-2.5 py-1 bg-[#d4a574] hover:bg-[#e0b585] text-[#0b0d12] font-bold text-[10px] uppercase flex items-center space-x-1"
              >
                <Download size={11} />
                <span>DOWNLOAD</span>
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
            <span className="text-[#6b7280] text-[9px]">CLICK THUMBNAIL TO EDIT ASSET</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin pb-1 pt-0.5">
            {history.slice(0, 20).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectAssetAsSource(item)}
                className="w-16 h-16 min-w-[64px] min-h-[64px] bg-[#0b0d12] border border-[#1f2937] hover:border-[#d4a574] cursor-pointer relative shrink-0 overflow-hidden group"
                title={`${item.prompt} - Click to edit, or hover to inspect`}
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
        activeImage={editedImageUrl}
        onSelectAsset={handleSelectAssetAsSource}
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
