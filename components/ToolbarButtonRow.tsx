import React, { useState, useEffect } from 'react';
import { Sparkles, Video, Sliders, Headphones } from 'lucide-react';
import {
  WindowType,
  getWindowStates,
  subscribeWindowStates,
  toggleWindow,
} from '../services/windowManager';

interface ToolbarButtonRowProps {
  className?: string;
  onFallbackOpen?: (type: WindowType) => void;
}

export const ToolbarButtonRow: React.FC<ToolbarButtonRowProps> = ({
  className = '',
  onFallbackOpen,
}) => {
  const [windowStates, setWindowStates] = useState<Record<WindowType, boolean>>(() =>
    getWindowStates()
  );

  useEffect(() => {
    const unsubscribe = subscribeWindowStates((newStates) => {
      setWindowStates(newStates);
    });
    return () => unsubscribe();
  }, []);

  const handleButtonClick = (type: WindowType) => {
    toggleWindow(type);
  };

  return (
    <div
      id="studio-feature-windows-toolbar"
      className={`flex items-center gap-1.5 ${className}`}
      role="toolbar"
      aria-label="Dedicated Feature Windows"
    >
      {/* 1. WILDCARDS Dedicated Window Button */}
      <button
        id="btn-win-wildcards"
        type="button"
        onClick={() => handleButtonClick('wildcards')}
        className={`h-8 px-3 text-[10px] font-bold uppercase tracking-[0.06em] border flex items-center space-x-1.5 transition-colors select-none font-mono ${
          windowStates.wildcards
            ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574] font-black'
            : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:bg-[#1f232b] hover:text-[#d4d4d8] hover:border-[#374151]'
        }`}
        style={{ borderRadius: 0 }}
        title="Open dedicated standalone Wildcards window"
      >
        <Sparkles
          size={12}
          className={windowStates.wildcards ? 'text-[#0b0d12]' : 'text-[#d4a574]'}
        />
        <span>[WILDCARDS]</span>
      </button>

      {/* 2. AUDIO & CAPTIONS Dedicated Window Button */}
      <button
        id="btn-win-audio-studio"
        type="button"
        onClick={() => handleButtonClick('audioStudio')}
        className={`h-8 px-3 text-[10px] font-bold uppercase tracking-[0.06em] border flex items-center space-x-1.5 transition-colors select-none font-mono ${
          windowStates.audioStudio
            ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574] font-black'
            : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:bg-[#1f232b] hover:text-[#d4d4d8] hover:border-[#374151]'
        }`}
        style={{ borderRadius: 0 }}
        title="Open dedicated standalone Audio & Captions Studio window"
      >
        <Headphones
          size={12}
          className={windowStates.audioStudio ? 'text-[#0b0d12]' : 'text-[#8b5cf6]'}
        />
        <span>[AUDIO & CAPTIONS]</span>
      </button>
    </div>
  );
};
