import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ProviderId, AspectRatio } from '../types';
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../services/keyStorage';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Sliders,
  Cpu,
  Hash,
  DollarSign,
  Clock,
  Code,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  Compass,
} from 'lucide-react';

export interface LightboxMetadata {
  prompt: string;
  negativePrompt?: string;
  provider?: ProviderId | string;
  model?: string;
  aspectRatio?: AspectRatio | string;
  width?: number;
  height?: number;
  seed?: number;
  cost?: number;
  timeMs?: number;
  timestamp?: string;
  guidanceScale?: number;
  steps?: number;
  numOutputs?: number;
  rawPayload?: Record<string, any>;
  title?: string;
}

export interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  images?: string[];
  initialIndex?: number;
  metadata: LightboxMetadata;
  onSelectImageIndex?: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  images = [],
  initialIndex = 0,
  metadata,
  onSelectImageIndex,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [activeMetaTab, setActiveMetaTab] = useState<'params' | 'json'>('params');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex]);

  const activeImageList = images.length > 0 ? images : [imageUrl];
  const activeImageSrc = activeImageList[currentIndex] || imageUrl;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = () => {
    if (!activeImageSrc) return;
    const link = document.createElement('a');
    link.href = activeImageSrc;
    const modelTag = (metadata.model || 'ai-asset').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `bonzo_${modelTag}_${metadata.seed || Date.now()}.png`;
    link.click();
  };

  const handlePrev = useCallback(() => {
    if (activeImageList.length <= 1) return;
    const nextIdx = (currentIndex - 1 + activeImageList.length) % activeImageList.length;
    setCurrentIndex(nextIdx);
    onSelectImageIndex?.(nextIdx);
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  }, [activeImageList.length, currentIndex, onSelectImageIndex]);

  const handleNext = useCallback(() => {
    if (activeImageList.length <= 1) return;
    const nextIdx = (currentIndex + 1) % activeImageList.length;
    setCurrentIndex(nextIdx);
    onSelectImageIndex?.(nextIdx);
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  }, [activeImageList.length, currentIndex, onSelectImageIndex]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setShowMetadataPanel((prev) => !prev);
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          handleDownload();
          break;
        case 'p':
        case 'P':
          if (metadata.prompt) {
            e.preventDefault();
            handleCopy(metadata.prompt, 'prompt');
          }
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, metadata.prompt]);

  // Mouse drag pan support when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  if (!isOpen) return null;

  const providerKey = (metadata.provider as ProviderId) || 'google';
  const providerColor = PROVIDER_COLORS[providerKey] || '#d4a574';
  const providerLabel = PROVIDER_LABELS[providerKey] || (metadata.provider || 'UNKNOWN').toUpperCase();

  const formattedJson = JSON.stringify(
    {
      prompt: metadata.prompt,
      negativePrompt: metadata.negativePrompt || undefined,
      provider: metadata.provider,
      model: metadata.model,
      aspectRatio: metadata.aspectRatio,
      dimensions: metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : undefined,
      seed: metadata.seed,
      cost: metadata.cost !== undefined ? `$${metadata.cost.toFixed(4)}` : undefined,
      latency: metadata.timeMs ? `${metadata.timeMs}ms` : undefined,
      timestamp: metadata.timestamp,
      guidanceScale: metadata.guidanceScale,
      steps: metadata.steps,
      outputIndex: activeImageList.length > 1 ? `${currentIndex + 1}/${activeImageList.length}` : undefined,
      ...metadata.rawPayload,
    },
    null,
    2
  );

  return (
    <div
      id="bonzo-image-lightbox"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="fixed inset-0 z-50 bg-[#0a0a0ae6] backdrop-blur-md flex flex-col font-mono text-xs select-none animate-fadeIn"
      style={{ margin: 0, padding: 0 }}
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP CONTROL BAR (Dense hacker toolbar)
      ───────────────────────────────────────────────────────────── */}
      <header
        id="lightbox-top-bar"
        className="h-11 bg-[#11131a] border-b border-[#1f2937] px-3 flex items-center justify-between shrink-0 z-20"
      >
        {/* Left: Model & Provider Indicators */}
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div
            className="px-2 py-0.5 font-bold uppercase text-[#ffffff] text-[10px] flex items-center space-x-1 shrink-0"
            style={{ backgroundColor: providerColor }}
          >
            <span>[{providerLabel}]</span>
          </div>

          <div className="text-[#ffffff] font-bold text-[11px] truncate flex items-center space-x-1.5">
            <Cpu size={12} className="text-[#d4a574] shrink-0" />
            <span className="truncate">{metadata.model || 'SYNTHETIC_GENERATIVE_IMAGE'}</span>
          </div>

          {metadata.aspectRatio && (
            <span className="hidden sm:inline-block text-[#9ca3af] border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12] text-[10px]">
              {metadata.aspectRatio}
            </span>
          )}

          {metadata.width && metadata.height && (
            <span className="hidden md:inline-block text-[#6b7280] border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12] text-[10px]">
              {metadata.width}x{metadata.height}
            </span>
          )}

          {metadata.seed !== undefined && (
            <span className="hidden lg:inline-block text-[#d4a574] border border-[#1f2937] px-1.5 py-0.5 bg-[#0b0d12] text-[10px]">
              SEED:{metadata.seed}
            </span>
          )}
        </div>

        {/* Right: Viewport Controls & Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center border border-[#1f2937] bg-[#0b0d12]">
            <button
              id="lightbox-zoom-out"
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1 text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#181b22] disabled:opacity-30 disabled:hover:bg-transparent"
              title="Zoom Out (-)"
            >
              <ZoomOut size={13} />
            </button>
            <button
              id="lightbox-zoom-reset"
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-[10px] text-[#d4a574] font-bold hover:bg-[#181b22]"
              title="Reset Zoom (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              id="lightbox-zoom-in"
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1 text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#181b22] disabled:opacity-30 disabled:hover:bg-transparent"
              title="Zoom In (+)"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Rotate Button */}
          <button
            id="lightbox-rotate-btn"
            type="button"
            onClick={handleRotate}
            className="p-1.5 bg-[#0b0d12] hover:bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574]"
            title="Rotate 90° (R)"
          >
            <RotateCw size={13} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="lightbox-fullscreen-btn"
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 bg-[#0b0d12] hover:bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574]"
            title="Fullscreen Toggle (F)"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Toggle Metadata Overlay HUD */}
          <button
            id="lightbox-toggle-hud-btn"
            type="button"
            onClick={() => setShowMetadataPanel((prev) => !prev)}
            className={`px-2 py-1 border text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 ${
              showMetadataPanel
                ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:text-[#ffffff]'
            }`}
            title="Toggle Metadata Overlay HUD (H)"
          >
            {showMetadataPanel ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="hidden md:inline">{showMetadataPanel ? 'METADATA HUD [ON]' : 'METADATA HUD [OFF]'}</span>
          </button>

          {/* Download Button */}
          <button
            id="lightbox-download-btn"
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1 bg-[#181b22] hover:bg-[#252b38] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center space-x-1"
            title="Download PNG (D)"
          >
            <Download size={12} className="text-[#d4a574]" />
            <span className="hidden sm:inline">DOWNLOAD</span>
          </button>

          {/* Close Button */}
          <button
            id="lightbox-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#ef4444]/20 hover:bg-[#ef4444] text-[#ef4444] hover:text-[#0b0d12] border border-[#ef4444]/40 font-bold"
            title="Close Lightbox (ESC)"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN VIEWPORT & METADATA OVERLAY WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {/* CENTER IMAGE VIEWPORT CANVAS */}
        <div
          id="lightbox-viewport"
          className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#07080c] cursor-grab active:cursor-grabbing p-2"
          onMouseDown={handleMouseDown}
        >
          {/* Subtle background tech grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #d4a574 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Previous / Next Batch Navigation Arrows */}
          {activeImageList.length > 1 && (
            <>
              <button
                id="lightbox-prev-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-12 bg-[#11131a]/90 hover:bg-[#181b22] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] flex items-center justify-center transition-all"
                title="Previous Image (←)"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                id="lightbox-next-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-12 bg-[#11131a]/90 hover:bg-[#181b22] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] flex items-center justify-center transition-all"
                title="Next Image (→)"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Target Image Frame */}
          <div
            className="relative transition-transform duration-75 flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              ref={imageRef}
              src={activeImageSrc}
              alt={metadata.prompt || 'Synthesized Artwork'}
              className="max-w-[calc(100vw-360px)] max-h-[calc(100vh-140px)] object-contain shadow-2xl border border-[#1f2937] bg-[#0b0d12] pointer-events-none select-none"
              style={{
                maxWidth: showMetadataPanel ? 'min(calc(100vw - 380px), 85vw)' : '95vw',
                maxHeight: 'calc(100vh - 120px)',
              }}
            />
          </div>

          {/* Batch Thumbnails Floating Bar (if variations exist) */}
          {activeImageList.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-[#11131a]/90 border border-[#1f2937] p-1.5 flex items-center space-x-2 backdrop-blur-md">
              <span className="text-[9px] text-[#9ca3af] uppercase font-bold px-1">
                VARIATION [{currentIndex + 1}/{activeImageList.length}]:
              </span>
              {activeImageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                    onSelectImageIndex?.(idx);
                    setZoom(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className={`w-8 h-8 border overflow-hidden p-0.5 transition-all ${
                    currentIndex === idx
                      ? 'border-[#d4a574] ring-1 ring-[#d4a574] bg-[#181b22]'
                      : 'border-[#1f2937] bg-[#0b0d12] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Var ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT PANEL: HIGH-DENSITY METADATA OVERLAY HUD
        ───────────────────────────────────────────────────────────── */}
        {showMetadataPanel && (
          <aside
            id="lightbox-metadata-overlay-panel"
            className="w-full md:w-[360px] md:min-w-[360px] md:max-w-[360px] bg-[#11131a] border-l border-[#1f2937] flex flex-col p-3 space-y-3 overflow-y-auto shrink-0 z-20 animate-fadeIn"
          >
            {/* Panel Tab Selector */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1f2937]">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveMetaTab('params')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 border ${
                    activeMetaTab === 'params'
                      ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                      : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:text-[#ffffff]'
                  }`}
                >
                  <Sliders size={11} />
                  <span>PARAMETERS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMetaTab('json')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 border ${
                    activeMetaTab === 'json'
                      ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                      : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:text-[#ffffff]'
                  }`}
                >
                  <Code size={11} />
                  <span>RAW JSON</span>
                </button>
              </div>

              <span className="text-[#6b7280] text-[9px] uppercase font-bold">
                [METADATA HUD]
              </span>
            </div>

            {/* TAB CONTENT 1: STRUCTURED PARAMETERS */}
            {activeMetaTab === 'params' ? (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {/* Prompt Section */}
                <div className="bg-[#0b0d12] border border-[#1f2937] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#d4a574] font-bold text-[10px] uppercase flex items-center space-x-1">
                      <Sparkles size={11} />
                      <span>GENERATIVE PROMPT</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(metadata.prompt, 'prompt')}
                      className="text-[9px] text-[#9ca3af] hover:text-[#ffffff] uppercase font-bold flex items-center space-x-1"
                    >
                      {copiedField === 'prompt' ? (
                        <>
                          <Check size={10} className="text-[#10b981]" />
                          <span className="text-[#10b981]">[COPIED]</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>[COPY]</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[#ffffff] text-[11px] leading-relaxed font-mono select-text break-words">
                    {metadata.prompt || '(No prompt text recorded)'}
                  </p>
                </div>

                {/* Negative Prompt (if exists) */}
                {metadata.negativePrompt && (
                  <div className="bg-[#0b0d12] border border-[#1f2937] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#ef4444] font-bold text-[10px] uppercase">
                        NEGATIVE PROMPT
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(metadata.negativePrompt!, 'neg_prompt')}
                        className="text-[9px] text-[#9ca3af] hover:text-[#ffffff] uppercase font-bold flex items-center space-x-1"
                      >
                        {copiedField === 'neg_prompt' ? (
                          <span className="text-[#10b981]">[COPIED]</span>
                        ) : (
                          <span>[COPY]</span>
                        )}
                      </button>
                    </div>
                    <p className="text-[#d4d4d8] text-[10px] leading-relaxed font-mono select-text break-words">
                      {metadata.negativePrompt}
                    </p>
                  </div>
                )}

                {/* Model & Engine Card */}
                <div className="bg-[#0b0d12] border border-[#1f2937] p-2.5 space-y-2">
                  <span className="text-[#9ca3af] font-bold text-[10px] uppercase block pb-1 border-b border-[#1f2937]">
                    MODEL & COMPUTE ENGINE
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-[#6b7280] block text-[9px] uppercase">PROVIDER:</span>
                      <span className="text-[#ffffff] font-bold uppercase">{providerLabel}</span>
                    </div>

                    <div>
                      <span className="text-[#6b7280] block text-[9px] uppercase">TIMESTAMP:</span>
                      <span className="text-[#ffffff]">{metadata.timestamp || 'RECENT'}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[#6b7280] block text-[9px] uppercase">MODEL IDENTIFIER:</span>
                    <div className="text-[#d4a574] font-bold text-[11px] truncate bg-[#181b22] px-1.5 py-1 border border-[#1f2937] mt-0.5">
                      {metadata.model || 'Default Pipeline'}
                    </div>
                  </div>
                </div>

                {/* Technical Geometry & Inference Parameters */}
                <div className="bg-[#0b0d12] border border-[#1f2937] p-2.5 space-y-2">
                  <span className="text-[#9ca3af] font-bold text-[10px] uppercase block pb-1 border-b border-[#1f2937]">
                    INFERENCE PARAMETERS
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[#181b22] p-1.5 border border-[#1f2937]">
                      <span className="text-[#6b7280] block text-[8px] uppercase">ASPECT RATIO:</span>
                      <span className="text-[#ffffff] font-bold">{metadata.aspectRatio || '1:1'}</span>
                    </div>

                    <div className="bg-[#181b22] p-1.5 border border-[#1f2937]">
                      <span className="text-[#6b7280] block text-[8px] uppercase">DIMENSIONS:</span>
                      <span className="text-[#ffffff] font-bold">
                        {metadata.width && metadata.height ? `${metadata.width}x${metadata.height}` : '1024x1024'}
                      </span>
                    </div>

                    <div className="bg-[#181b22] p-1.5 border border-[#1f2937]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] block text-[8px] uppercase">SEED:</span>
                        {metadata.seed !== undefined && (
                          <button
                            type="button"
                            onClick={() => handleCopy(String(metadata.seed), 'seed')}
                            className="text-[#d4a574] text-[8px] uppercase font-bold"
                          >
                            {copiedField === 'seed' ? 'COPIED' : 'COPY'}
                          </button>
                        )}
                      </div>
                      <span className="text-[#ffffff] font-bold">{metadata.seed ?? 'RANDOM'}</span>
                    </div>

                    <div className="bg-[#181b22] p-1.5 border border-[#1f2937]">
                      <span className="text-[#6b7280] block text-[8px] uppercase">ESTIMATED COST:</span>
                      <span className="text-[#10b981] font-bold">
                        {metadata.cost !== undefined ? `$${metadata.cost.toFixed(3)}` : '$0.000'}
                      </span>
                    </div>

                    {metadata.timeMs !== undefined && (
                      <div className="bg-[#181b22] p-1.5 border border-[#1f2937]">
                        <span className="text-[#6b7280] block text-[8px] uppercase">LATENCY:</span>
                        <span className="text-[#ffffff] font-bold">{metadata.timeMs} ms</span>
                      </div>
                    )}

                    {metadata.guidanceScale !== undefined && (
                      <div className="bg-[#181b22] p-1.5 border border-[#1f2937]">
                        <span className="text-[#6b7280] block text-[8px] uppercase">GUIDANCE SCALE:</span>
                        <span className="text-[#ffffff] font-bold">{metadata.guidanceScale}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Matrix */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(activeImageSrc, 'image_base64')}
                    className="w-full h-8 bg-[#181b22] hover:bg-[#222733] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] text-[10px] uppercase font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    {copiedField === 'image_base64' ? (
                      <Check size={12} className="text-[#10b981]" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>
                      {copiedField === 'image_base64'
                        ? 'BUFFER COPIED TO CLIPBOARD'
                        : 'COPY IMAGE DATA URI / BASE64'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full h-9 bg-[#d4a574] hover:bg-[#e0b585] text-[#0b0d12] font-bold text-[11px] uppercase flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Download size={13} />
                    <span>DOWNLOAD HIGH-RES PNG</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB CONTENT 2: RAW JSON INSPECTOR */
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <span className="text-[#9ca3af] text-[9px] uppercase font-bold">
                    SERIALIZED PAYLOAD
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(formattedJson, 'json')}
                    className="px-2 py-0.5 bg-[#181b22] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574] text-[9px] uppercase font-bold flex items-center space-x-1"
                  >
                    {copiedField === 'json' ? <Check size={10} className="text-[#10b981]" /> : <Copy size={10} />}
                    <span>{copiedField === 'json' ? 'COPIED' : 'COPY JSON'}</span>
                  </button>
                </div>

                <div className="flex-1 bg-[#0b0d12] border border-[#1f2937] p-2 overflow-auto font-mono text-[10px]">
                  <pre className="text-[#10b981] whitespace-pre-wrap leading-relaxed select-text">
                    {formattedJson}
                  </pre>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Helper in Footer */}
            <div className="pt-2 border-t border-[#1f2937] text-[8px] text-[#6b7280] space-y-0.5">
              <div className="text-[#9ca3af] font-bold uppercase">[KEYBOARD SHORTCUTS]</div>
              <div className="grid grid-cols-2 gap-x-2">
                <div>• [ESC] CLOSE</div>
                <div>• [←/→] VARIATIONS</div>
                <div>• [+/-] ZOOM IN/OUT</div>
                <div>• [0] RESET ZOOM</div>
                <div>• [H] TOGGLE HUD</div>
                <div>• [P] COPY PROMPT</div>
                <div>• [D] DOWNLOAD</div>
                <div>• [F] FULLSCREEN</div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM STATUS STRIP
      ───────────────────────────────────────────────────────────── */}
      <footer
        id="lightbox-status-footer"
        className="h-6 bg-[#0e1017] border-t border-[#1f2937] px-3 flex items-center justify-between text-[9px] text-[#6b7280] shrink-0"
      >
        <div className="flex items-center space-x-3">
          <span>
            BONZO STUDIO // LIGHTBOX INSPECTOR [STATUS: <span className="text-[#10b981]">ONLINE</span>]
          </span>
          <span className="hidden sm:inline">
            ZOOM: {Math.round(zoom * 100)}% | ROT: {rotation}°
          </span>
        </div>

        <div>
          {activeImageList.length > 1 && (
            <span className="text-[#d4a574] font-bold">
              FRAME {currentIndex + 1} OF {activeImageList.length}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};
