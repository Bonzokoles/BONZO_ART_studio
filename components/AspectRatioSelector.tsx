
import React from 'react';

interface AspectRatioSelectorProps<T extends string> {
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: T[];
  label: string;
}

export const AspectRatioSelector = <T extends string>({
  id = 'aspect-ratio-selector',
  value,
  onChange,
  options,
  label,
}: AspectRatioSelectorProps<T>) => {
  return (
    <div id={id} className="w-full font-mono text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[#888888] uppercase tracking-wider text-[11px]">{label}</label>
        <span className="text-[#00e5ff] text-[10px]">SELECTED: [{value}]</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
        {options.map((ratio) => {
          const isSelected = value === ratio;
          return (
            <button
              key={ratio}
              type="button"
              id={`aspect-option-${ratio.replace(':', '-')}`}
              onClick={() => onChange(ratio)}
              className={`px-2.5 py-1.5 text-xs font-mono font-bold uppercase transition-colors border ${
                isSelected
                  ? 'bg-[#1a1a1a] text-[#00e5ff] border-[#00e5ff]'
                  : 'bg-[#111111] text-[#888888] border-[#333333] hover:bg-[#161616] hover:text-[#e0e0e0] hover:border-[#555555]'
              }`}
            >
              {ratio}
            </button>
          );
        })}
      </div>
    </div>
  );
};

