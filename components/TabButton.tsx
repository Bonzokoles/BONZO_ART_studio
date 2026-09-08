import React from 'react';

interface TabButtonProps {
  id?: string;
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ id, onClick, isActive, children, icon }) => {
  const baseClasses =
    'flex items-center justify-center px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors border focus:outline-none whitespace-nowrap';
  const activeClasses = 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574] font-bold';
  const inactiveClasses =
    'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-[#ffffff] hover:border-[#2a3140]';

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};
