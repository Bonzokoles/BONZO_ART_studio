import React from 'react';
import type { HistoryItem } from '../types';
import { RightStudioPanel } from './RightStudioPanel';
import type { SavedStylePreset } from '../data/artistsData';

interface AssetLibraryPanelProps {
  history: HistoryItem[];
  activeImage?: string | null;
  currentPrompt?: string;
  onSelectAsset: (item: HistoryItem) => void;
  onInspectAsset?: (item: HistoryItem) => void;
  onDeleteAsset: (id: string) => void;
  onClearAll: () => void;
  onAppendPrompt?: (text: string) => void;
  onSetPrompt?: (text: string) => void;
  onApplyStylePreset?: (preset: SavedStylePreset) => void;
}

export const AssetLibraryPanel: React.FC<AssetLibraryPanelProps> = ({
  history,
  activeImage,
  currentPrompt = '',
  onSelectAsset,
  onInspectAsset,
  onDeleteAsset,
  onClearAll,
  onAppendPrompt = (text) => {
    navigator.clipboard?.writeText(text);
  },
  onSetPrompt = (text) => {
    navigator.clipboard?.writeText(text);
  },
  onApplyStylePreset,
}) => {
  return (
    <RightStudioPanel
      history={history}
      activeImage={activeImage}
      currentPrompt={currentPrompt}
      onSelectAsset={onSelectAsset}
      onInspectAsset={onInspectAsset}
      onDeleteAsset={onDeleteAsset}
      onClearAllAssets={onClearAll}
      onAppendPrompt={onAppendPrompt}
      onSetPrompt={onSetPrompt}
      onApplyStylePreset={onApplyStylePreset}
    />
  );
};
