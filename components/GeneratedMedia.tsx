
import React from 'react';
import { Download, CheckCircle2, FileCheck } from 'lucide-react';

interface GeneratedMediaProps {
  id?: string;
  url: string;
  type: 'image' | 'video';
  alt: string;
}

export const GeneratedMedia: React.FC<GeneratedMediaProps> = ({
  id = 'generated-media-display',
  url,
  type,
  alt,
}) => {
  return (
    <div id={id} className="w-full bg-[#111111] border border-[#333333] p-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262626] text-[#888888]">
        <div className="flex items-center space-x-2">
          <FileCheck size={14} className="text-[#00ff66]" />
          <span className="text-[#ffffff] font-bold uppercase">
            OUTPUT_ASSET: [{type.toUpperCase()}]
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
            [STATUS: READY]
          </span>
        </div>
      </div>

      <div className="relative bg-[#080808] border border-[#222222] overflow-hidden flex items-center justify-center p-1">
        {type === 'image' ? (
          <img
            src={url}
            alt={alt}
            className="w-full h-auto object-contain max-h-[70vh]"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            loop
            className="w-full h-auto object-contain max-h-[70vh]"
          />
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#262626]">
        <div className="text-[11px] text-[#888888] truncate max-w-[65%]">
          <span className="text-[#00e5ff]">DESC: </span>
          <span>{alt || 'Generated Media Asset'}</span>
        </div>

        <a
          id="download-media-btn"
          href={url}
          download={`generated-${type}-${Date.now()}`}
          className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#ffffff] border border-[#555555] hover:border-[#00e5ff] uppercase font-bold text-xs tracking-wider transition-colors flex items-center space-x-1.5"
          aria-label="Download media"
        >
          <Download size={13} className="text-[#00e5ff]" />
          <span>[DOWNLOAD ASSET]</span>
        </a>
      </div>
    </div>
  );
};

