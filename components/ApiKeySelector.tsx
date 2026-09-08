
import React from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';

interface ApiKeySelectorProps {
  isChecking: boolean;
  onSelectKey: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ isChecking, onSelectKey }) => {
  return (
    <div
      id="api-key-selector-panel"
      className="bg-[#111111] border border-[#333333] p-6 max-w-xl mx-auto flex flex-col items-center text-center font-mono text-xs"
    >
      <div className="w-12 h-12 bg-[#1a1a1a] border border-[#ffb700] flex items-center justify-center text-[#ffb700] mb-4">
        <KeyRound size={24} />
      </div>
      <div className="text-[10px] text-[#ffb700] uppercase tracking-wider mb-1 font-bold">
        [AUTH_CREDENTIALS_REQUIRED]
      </div>
      <h3 className="text-base font-bold mb-2 text-[#ffffff] uppercase">
        VEO VIDEO ENGINE API KEY REQUIRED
      </h3>
      <p className="text-[#888888] mb-4 leading-relaxed">
        High-throughput video synthesis with Veo requires an attached Google Gemini API key.
      </p>
      <a
        href="https://ai.google.dev/gemini-api/docs/billing"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-xs text-[#00e5ff] hover:underline mb-5 space-x-1"
      >
        <span>[READ BILLING &amp; QUOTA DOCUMENTATION]</span>
        <ExternalLink size={12} />
      </a>
      <button
        id="select-api-key-btn"
        onClick={onSelectKey}
        disabled={isChecking}
        className="w-full bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#ffffff] border border-[#00e5ff] uppercase font-bold py-2.5 px-4 text-xs tracking-wider transition-colors disabled:bg-[#141414] disabled:text-[#555555] disabled:border-[#333333] disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isChecking ? (
          <span>[CHECKING API KEY STATUS...]</span>
        ) : (
          <span>[SELECT / ATTACH API KEY]</span>
        )}
      </button>
    </div>
  );
};

