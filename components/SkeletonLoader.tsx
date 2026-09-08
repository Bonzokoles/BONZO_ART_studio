import React from 'react';
import type { AspectRatio, VideoAspectRatio, UploadedFile } from '../types';
import { Film, Image as ImageIcon, Sparkles, Scan, Activity, Terminal } from 'lucide-react';

interface SkeletonLoaderProps {
  type: 'image' | 'video' | 'dual-image' | 'analysis' | 'video-continuation';
  aspectRatio?: AspectRatio | VideoAspectRatio;
  sourceImage?: UploadedFile | null;
  previousVideoUrl?: string | null;
  promptText?: string;
  statusMessage?: string;
  resolutionText?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  aspectRatio = '1:1',
  sourceImage,
  previousVideoUrl,
  promptText,
  statusMessage,
  resolutionText,
}) => {
  // Compute aspect ratio CSS classes
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16] max-w-[320px] mx-auto';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4] max-w-[400px] mx-auto';
      case '1:1':
      default:
        return 'aspect-square max-w-[500px] mx-auto';
    }
  };

  if (type === 'image') {
    return (
      <div className="w-full bg-[#111111] border border-[#333333] p-3 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] text-[#888888]">
          <div className="flex items-center space-x-2">
            <ImageIcon size={14} className="text-[#00e5ff]" />
            <span className="text-[#e0e0e0] font-bold uppercase">SKELETON BUFFER: IMAGE_CANVAS</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#00e5ff]">
              RATIO: {aspectRatio}
            </span>
            <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#aaaaaa]">
              {resolutionText || '1024 x 1024'}
            </span>
          </div>
        </div>

        {/* Aspect Ratio Canvas Skeleton */}
        <div
          className={`w-full ${getAspectRatioClass(
            aspectRatio
          )} bg-[#0a0a0a] border border-[#333333] relative overflow-hidden grid-matrix flex flex-col items-center justify-center`}
        >
          {/* Animated Laser Scanning Line */}
          <div className="scan-laser-line" />

          {/* Corner Crosshairs */}
          <span className="absolute top-2 left-2 text-[#444444] select-none text-[10px]">[+] TL_00</span>
          <span className="absolute top-2 right-2 text-[#444444] select-none text-[10px]">TR_01 [+]</span>
          <span className="absolute bottom-2 left-2 text-[#444444] select-none text-[10px]">[+] BL_10</span>
          <span className="absolute bottom-2 right-2 text-[#444444] select-none text-[10px]">BR_11 [+]</span>

          {/* Shimmering Center Matrix */}
          <div className="w-3/4 h-3/4 border border-[#222222] skeleton-shimmer flex flex-col items-center justify-center p-4 relative opacity-60">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 border border-dashed border-[#00e5ff]/30 flex items-center justify-center animate-spin" style={{ animationDuration: '12s' }}>
                <div className="w-8 h-8 border border-[#00ff66]/40" />
              </div>
            </div>
          </div>

          {/* Overlay Status Box */}
          <div className="absolute bottom-4 left-4 right-4 bg-[#0e0e0e]/90 border border-[#333333] px-3 py-2 flex items-center justify-between z-20">
            <div className="flex items-center space-x-2 truncate">
              <Activity size={13} className="text-[#00ff66] animate-pulse shrink-0" />
              <span className="text-[#00ff66] truncate font-semibold">
                {statusMessage || '[SYNTHESIS] Generative Imagen diffusion active...'}
              </span>
            </div>
            <span className="text-[#666666] shrink-0 text-[10px] ml-2">FRAME_BUFFER_0</span>
          </div>
        </div>

        {promptText && (
          <div className="mt-2 p-2 bg-[#0d0d0d] border border-[#262626] text-[#888888] truncate text-[11px]">
            <span className="text-[#00e5ff]">INPUT_PROMPT: </span>
            <span className="text-[#cccccc]">{promptText}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="w-full bg-[#111111] border border-[#333333] p-3 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] text-[#888888]">
          <div className="flex items-center space-x-2">
            <Film size={14} className="text-[#00e5ff]" />
            <span className="text-[#e0e0e0] font-bold uppercase">SKELETON BUFFER: VEO_VIDEO_STREAM</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#ffb700]">
              RATIO: {aspectRatio}
            </span>
            <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#00ff66]">
              720P @ 24FPS
            </span>
          </div>
        </div>

        {/* Video Canvas Skeleton with Frame Overlay */}
        <div
          className={`w-full ${getAspectRatioClass(
            aspectRatio
          )} bg-[#0a0a0a] border border-[#333333] relative overflow-hidden grid-matrix flex flex-col justify-between p-3`}
        >
          {/* Laser Scanning Line */}
          <div className="scan-laser-line" />

          {/* Top Video Stats */}
          <div className="flex items-center justify-between z-20 text-[10px] text-[#888888]">
            <span className="bg-[#000000]/80 border border-[#333333] px-1.5 py-0.5 text-[#00e5ff]">
              [REC_BUFFER] 00:00:00:00
            </span>
            <span className="bg-[#000000]/80 border border-[#333333] px-1.5 py-0.5 text-[#ffb700] animate-pulse">
              [VEO TEMPORAL SYNTHESIS]
            </span>
            <span className="bg-[#000000]/80 border border-[#333333] px-1.5 py-0.5 text-[#888888]">
              TARGET: 00:00:05:00
            </span>
          </div>

          {/* Center Raster Pattern */}
          <div className="w-full flex-grow my-2 border border-[#222222] skeleton-shimmer relative opacity-50 flex items-center justify-center">
            <div className="grid grid-cols-6 gap-1 w-full h-full p-2 opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border border-[#444444] h-full" />
              ))}
            </div>
          </div>

          {/* Video Control Bar Skeleton */}
          <div className="bg-[#0d0d0d]/90 border border-[#333333] p-2 z-20 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#00ff66] font-semibold">
                {statusMessage || '[RENDERING] Interpolating frame motion vectors...'}
              </span>
              <span className="text-[#888888]">BUFFERING 720p H.264</span>
            </div>
            {/* Scrubber Bar Placeholder */}
            <div className="w-full bg-[#1e1e1e] h-1.5 border border-[#333333] overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[#00e5ff] via-[#ffb700] to-[#00ff66] w-2/3 skeleton-shimmer" />
            </div>
          </div>
        </div>

        {promptText && (
          <div className="mt-2 p-2 bg-[#0d0d0d] border border-[#262626] text-[#888888] truncate text-[11px]">
            <span className="text-[#00e5ff]">VEO_PROMPT: </span>
            <span className="text-[#cccccc]">{promptText}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'dual-image') {
    return (
      <div className="w-full bg-[#111111] border border-[#333333] p-3 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] text-[#888888]">
          <div className="flex items-center space-x-2">
            <Scan size={14} className="text-[#00e5ff]" />
            <span className="text-[#e0e0e0] font-bold uppercase">DUAL SKELETON: EDIT_TRANSFORM_PIPELINE</span>
          </div>
          <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#00ff66]">
            [DIFFUSION MATRIX ACTIVE]
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Source Image Panel with Scanning Reticle */}
          <div className="border border-[#333333] bg-[#0a0a0a] p-2 relative flex flex-col">
            <div className="flex items-center justify-between text-[11px] mb-1.5 pb-1 border-b border-[#262626] text-[#888888]">
              <span className="text-[#aaaaaa]">[PANEL A: SOURCE_INPUT]</span>
              <span className="text-[#00e5ff]">[INGESTED]</span>
            </div>
            <div className="relative aspect-square max-h-72 w-full bg-[#141414] border border-[#222222] overflow-hidden flex items-center justify-center">
              {sourceImage?.preview ? (
                <img
                  src={sourceImage.preview}
                  alt="Source"
                  className="w-full h-full object-contain filter brightness-75"
                />
              ) : (
                <div className="skeleton-shimmer w-full h-full" />
              )}
              <div className="scan-laser-line" />
              <div className="absolute inset-0 bg-[#00e5ff]/5 pointer-events-none" />
              <span className="absolute bottom-2 left-2 bg-[#000000]/80 text-[#00e5ff] text-[10px] px-1.5 py-0.5 border border-[#333333]">
                SEGMENTATION SCAN
              </span>
            </div>
          </div>

          {/* Target Output Skeleton Panel */}
          <div className="border border-[#333333] bg-[#0a0a0a] p-2 relative flex flex-col">
            <div className="flex items-center justify-between text-[11px] mb-1.5 pb-1 border-b border-[#262626] text-[#888888]">
              <span className="text-[#00ff66] font-bold">[PANEL B: GENERATIVE_OUTPUT]</span>
              <span className="text-[#ffb700] animate-pulse">[PROCESSING]</span>
            </div>
            <div className="relative aspect-square max-h-72 w-full bg-[#141414] border border-[#222222] overflow-hidden grid-matrix flex flex-col items-center justify-center">
              <div className="scan-laser-line" />
              <div className="w-5/6 h-5/6 skeleton-shimmer border border-[#333333] opacity-60" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3 bg-[#0a0a0a]/90 border border-[#00e5ff]/50 text-center text-[11px]">
                  <Activity size={16} className="text-[#00e5ff] mx-auto mb-1 animate-pulse" />
                  <div className="text-[#00ff66] font-semibold">APPLYING INSTRUCTION</div>
                  <div className="text-[#888888] text-[10px] mt-0.5">Pixel Buffer Synthesis</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {promptText && (
          <div className="mt-2 p-2 bg-[#0d0d0d] border border-[#262626] text-[#888888] truncate text-[11px]">
            <span className="text-[#00e5ff]">INSTRUCTION: </span>
            <span className="text-[#cccccc]">{promptText}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'analysis') {
    return (
      <div className="w-full bg-[#111111] border border-[#333333] p-3 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] text-[#888888]">
          <div className="flex items-center space-x-2">
            <Terminal size={14} className="text-[#00e5ff]" />
            <span className="text-[#e0e0e0] font-bold uppercase">SKELETON BUFFER: MULTIMODAL_ANALYSIS_STREAM</span>
          </div>
          <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#00ff66]">
            [GEMINI_VISION_INFER]
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Scanned Image Source Box */}
          <div className="md:col-span-1 border border-[#333333] bg-[#0a0a0a] p-2 flex flex-col">
            <div className="text-[11px] text-[#888888] mb-1.5 pb-1 border-b border-[#262626]">
              [INPUT_IMAGE_PREVIEW]
            </div>
            <div className="relative aspect-square w-full bg-[#141414] border border-[#222222] overflow-hidden flex items-center justify-center">
              {sourceImage?.preview ? (
                <img
                  src={sourceImage.preview}
                  alt="Analyzing"
                  className="w-full h-full object-contain filter brightness-90"
                />
              ) : (
                <div className="skeleton-shimmer w-full h-full" />
              )}
              <div className="scan-laser-line" />
            </div>
            <div className="mt-2 text-[10px] text-[#888888] flex justify-between">
              <span>FORMAT: {sourceImage?.mimeType || 'IMAGE/JPEG'}</span>
              <span className="text-[#00ff66]">[ACTIVE]</span>
            </div>
          </div>

          {/* Structured Text & Token Skeleton Lines */}
          <div className="md:col-span-2 border border-[#333333] bg-[#0a0a0a] p-3 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-[11px] text-[#00e5ff] font-bold mb-2 flex items-center space-x-2">
                <Sparkles size={12} />
                <span>SYNTHESIZING SEMANTIC INSIGHTS...</span>
              </div>

              {/* Shimmering Category Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <div className="h-5 w-24 skeleton-shimmer border border-[#333333]" />
                <div className="h-5 w-28 skeleton-shimmer border border-[#333333]" />
                <div className="h-5 w-20 skeleton-shimmer border border-[#333333]" />
              </div>

              {/* Text Paragraph Skeleton Bars */}
              <div className="space-y-2">
                <div className="h-3.5 w-11/12 skeleton-shimmer border border-[#262626]" />
                <div className="h-3.5 w-full skeleton-shimmer border border-[#262626]" />
                <div className="h-3.5 w-4/5 skeleton-shimmer border border-[#262626]" />
                <div className="h-3.5 w-5/6 skeleton-shimmer border border-[#262626]" />
                <div className="h-3.5 w-2/3 skeleton-shimmer border border-[#262626]" />
              </div>
            </div>

            {/* Simulated Stream Tokens Footer */}
            <div className="bg-[#141414] border border-[#262626] p-2 flex items-center justify-between text-[10px] text-[#888888]">
              <span className="text-[#00ff66] animate-pulse">
                [DECODING] Reading visual scene semantics, objects & mood...
              </span>
              <span className="text-[#555555]">TOKEN_RATE: 45 t/s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'video-continuation') {
    return (
      <div className="w-full bg-[#111111] border border-[#333333] p-3 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] text-[#888888]">
          <div className="flex items-center space-x-2">
            <Film size={14} className="text-[#00e5ff]" />
            <span className="text-[#e0e0e0] font-bold uppercase">TIMELINE EXTENSION SKELETON</span>
          </div>
          <span className="bg-[#1a1a1a] border border-[#333333] px-1.5 py-0.5 text-[#ffb700]">
            [DELTA: +7.00s EXTENSION]
          </span>
        </div>

        {/* Timeline Sequence Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Segment A: Base Video */}
          <div className="border border-[#333333] bg-[#0a0a0a] p-2">
            <div className="flex items-center justify-between text-[11px] mb-1.5 pb-1 border-b border-[#262626] text-[#888888]">
              <span>[00:00 - 00:05] BASE CLIP</span>
              <span className="text-[#00ff66]">[LOCKED]</span>
            </div>
            <div className="aspect-video bg-[#141414] border border-[#222222] relative overflow-hidden flex items-center justify-center">
              {previousVideoUrl ? (
                <video src={previousVideoUrl} className="w-full h-full object-contain opacity-70" muted />
              ) : (
                <div className="skeleton-shimmer w-full h-full" />
              )}
              <span className="absolute top-2 left-2 bg-[#000000]/80 text-[#888888] text-[10px] px-1.5 py-0.5 border border-[#333333]">
                KEYFRAME_REF
              </span>
            </div>
          </div>

          {/* Segment B: Continued Sequence */}
          <div className="border border-[#333333] bg-[#0a0a0a] p-2">
            <div className="flex items-center justify-between text-[11px] mb-1.5 pb-1 border-b border-[#262626] text-[#888888]">
              <span className="text-[#00e5ff] font-bold">[00:05 - 00:12] CONTINUATION</span>
              <span className="text-[#ffb700] animate-pulse">[GENERATING]</span>
            </div>
            <div className="aspect-video bg-[#141414] border border-[#222222] relative overflow-hidden grid-matrix flex items-center justify-center">
              <div className="scan-laser-line" />
              <div className="w-5/6 h-5/6 skeleton-shimmer border border-[#333333] opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-2.5 bg-[#0a0a0a]/90 border border-[#00e5ff]/50 text-center text-[11px]">
                  <Activity size={16} className="text-[#00e5ff] mx-auto mb-1 animate-pulse" />
                  <div className="text-[#00ff66] font-semibold">SYNTHESIZING EXTENSION</div>
                  <div className="text-[#888888] text-[10px]">Temporal Flow Continuity</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {promptText && (
          <div className="p-2 bg-[#0d0d0d] border border-[#262626] text-[#888888] truncate text-[11px]">
            <span className="text-[#00e5ff]">CONTINUATION_INSTRUCTION: </span>
            <span className="text-[#cccccc]">{promptText}</span>
          </div>
        )}
      </div>
    );
  }

  return null;
};
