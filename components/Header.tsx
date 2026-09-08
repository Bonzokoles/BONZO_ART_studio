import React from 'react';
import type { FeatureTab } from '../types';
import { TabButton } from './TabButton';
import { ToolbarButtonRow } from './ToolbarButtonRow';
import {
  Wand2,
  Sparkles,
  ScanSearch,
  Video,
  Film,
  Terminal,
  Activity,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  activeTab: FeatureTab;
  setActiveTab: (tab: FeatureTab) => void;
}

const TABS: { id: string; name: FeatureTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'tab-image-generation',
    name: 'Image Generation',
    label: 'IMAGE GENERATION',
    icon: <Wand2 size={13} className="mr-1.5 shrink-0 text-[#d4a574]" />,
  },
  {
    id: 'tab-image-editing',
    name: 'Image Editing',
    label: 'IMAGE EDITING',
    icon: <Sparkles size={13} className="mr-1.5 shrink-0 text-[#a855f7]" />,
  },
  {
    id: 'tab-image-analysis',
    name: 'Image Analysis',
    label: 'IMAGE ANALYSIS',
    icon: <ScanSearch size={13} className="mr-1.5 shrink-0 text-[#4285f4]" />,
  },
  {
    id: 'tab-video-generation',
    name: 'Video Generation',
    label: 'VIDEO GENERATION',
    icon: <Video size={13} className="mr-1.5 shrink-0 text-[#10b981]" />,
  },
  {
    id: 'tab-video-continuation',
    name: 'Video Continuation',
    label: 'VIDEO CONTINUATION',
    icon: <Film size={13} className="mr-1.5 shrink-0 text-[#f59e0b]" />,
  },
  {
    id: 'tab-prompt-library',
    name: 'Prompt Library',
    label: 'PROMPT LIBRARY',
    icon: <BookOpen size={13} className="mr-1.5 shrink-0 text-[#a78bfa]" />,
  },
  {
    id: 'tab-timeline-studio',
    name: 'Timeline Studio',
    label: 'TIMELINE STUDIO',
    icon: <Film size={13} className="mr-1.5 shrink-0 text-[#ef4444]" />,
  },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header
      id="studio-header"
      className="bg-[#11131a] border-b border-[#1f2937] px-3 sm:px-4 py-2 font-mono select-none z-30 shrink-0"
    >
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & Core Identity */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-[#0b0d12] border border-[#d4a574] text-[#d4a574] flex items-center justify-center font-mono font-black text-xs">
            <Terminal size={15} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#ffffff] text-xs sm:text-sm uppercase tracking-wider">
                BONZO AI ART DEVZ // STUDIO
              </span>
              <span className="text-[10px] text-[#d4a574] bg-[#d4a574]/10 border border-[#d4a574]/30 px-1 py-0.2">
                v2.6 MULTI-MODEL
              </span>
            </div>
            <div className="text-[10px] text-[#9ca3af] tracking-tight">
              MULTI-PROVIDER GENERATIVE PIPELINE & INFERENCE ENGINE
            </div>
          </div>
        </div>

        {/* Feature Windows Toolbar: [WILDCARDS] [VIDEO CONFIG] [WORKFLOWS] */}
        <div className="flex items-center">
          <ToolbarButtonRow />
        </div>

        {/* Engine Status Badge */}
        <div className="hidden lg:flex items-center space-x-2 text-[10px] text-[#9ca3af] bg-[#0b0d12] border border-[#1f2937] px-2.5 py-1">
          <span className="inline-block w-1.5 h-1.5 bg-[#10b981] animate-pulse"></span>
          <span>PROVIDERS:</span>
          <span className="text-[#4285f4]">GOOGLE</span>
          <span className="text-[#6b7280]">/</span>
          <span className="text-[#7c3aed]">FAL.AI</span>
          <span className="text-[#6b7280]">/</span>
          <span className="text-[#0066ff]">REPLICATE</span>
          <span className="text-[#6b7280]">/</span>
          <span className="text-[#10a37f]">OPENAI</span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav
        id="studio-tabs-nav"
        className="w-full mt-2 pt-2 border-t border-[#1f2937] flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5"
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.name}
            id={tab.id}
            onClick={() => setActiveTab(tab.name)}
            isActive={activeTab === tab.name}
            icon={tab.icon}
          >
            {tab.label}
          </TabButton>
        ))}
      </nav>
    </header>
  );
};
