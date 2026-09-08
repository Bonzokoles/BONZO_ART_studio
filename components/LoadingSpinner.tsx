
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'sm' }) => {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;

  return (
    <div className="inline-flex items-center space-x-2 text-[#e0e0e0] font-mono text-xs">
      <Loader2 size={iconSize} className="animate-spin text-[#00e5ff]" />
      {message && (
        <span className="uppercase tracking-wider font-semibold text-[#e0e0e0]">
          {message}
        </span>
      )}
    </div>
  );
};

