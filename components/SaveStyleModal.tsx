import React, { useState, useEffect } from 'react';
import type { ProviderId, AspectRatio } from '../types';
import type { SavedStylePreset } from '../data/artistsData';
import { saveStylePreset } from '../services/styleStorage';
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../services/keyStorage';
import { Bookmark, X, Plus, Check } from 'lucide-react';

interface SaveStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  negativePrompt?: string;
  provider: ProviderId;
  model: string;
  aspectRatio: AspectRatio;
  seed?: number;
  previewImage?: string;
  onSaved?: (saved: SavedStylePreset) => void;
}

export const SaveStyleModal: React.FC<SaveStyleModalProps> = ({
  isOpen,
  onClose,
  prompt,
  negativePrompt,
  provider,
  model,
  aspectRatio,
  seed,
  previewImage,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>(['custom', 'preset']);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Derive a suggested name from prompt
      const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ');
      setName(words ? words.charAt(0).toUpperCase() + words.slice(1) : 'My Custom Style');
      setIsSaved(false);
    }
  }, [isOpen, prompt]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved = saveStylePreset({
      name: name.trim(),
      prompt,
      negativePrompt,
      provider,
      model,
      aspectRatio,
      seed,
      tags,
      previewImage,
    });

    setIsSaved(true);
    if (onSaved) {
      onSaved(saved);
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      id="save-style-modal-overlay"
      className="fixed inset-0 z-50 bg-[#000000]/80 flex items-center justify-center p-4 select-none font-mono"
    >
      <div
        id="save-style-modal-card"
        className="w-full max-w-md bg-[#11131a] border border-[#1f2937] text-xs shadow-2xl flex flex-col"
        style={{ borderRadius: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#1f2937] bg-[#0e1017]">
          <div className="flex items-center space-x-2">
            <Bookmark size={14} className="text-[#d4a574]" />
            <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px]">
              SAVE AS STYLE PRESET
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#ffffff] p-1"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#9ca3af] uppercase font-bold block">
              Style Preset Name:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cinematic Neon Noir..."
              className="w-full bg-[#0b0d12] border border-[#1f2937] focus:border-[#d4a574] text-[#ffffff] px-2.5 py-1.5 text-xs focus:outline-none"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Tags Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#9ca3af] uppercase font-bold block">
              Tags:
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[28px] p-1.5 bg-[#0b0d12] border border-[#1f2937]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#181b22] border border-[#2a3140] text-[#d4a574] px-1.5 py-0.5 text-[10px] flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#6b7280] hover:text-[#ef4444]"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="tag..."
                  className="w-16 bg-transparent text-[#ffffff] text-[10px] focus:outline-none px-1"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-[#9ca3af] hover:text-[#d4a574] text-[9px] uppercase px-1 font-bold"
                >
                  [+ADD]
                </button>
              </div>
            </div>
          </div>

          {/* Preset Parameters Summary */}
          <div className="bg-[#0b0d12] border border-[#1f2937] p-2.5 space-y-1.5 text-[10px] text-[#9ca3af]">
            <div className="text-[#6b7280] uppercase tracking-wider font-bold text-[9px]">
              This saves:
            </div>
            <div className="flex items-center space-x-2">
              <span
                className="w-2 h-2"
                style={{ backgroundColor: PROVIDER_COLORS[provider] }}
              />
              <span className="text-[#ffffff] font-bold uppercase">{PROVIDER_LABELS[provider]}</span>
              <span className="text-[#6b7280]">·</span>
              <span className="text-[#d4a574]">{model}</span>
              <span className="text-[#6b7280]">·</span>
              <span>{aspectRatio}</span>
            </div>
            {seed !== undefined && (
              <div className="text-[#6b7280]">Seed: {seed}</div>
            )}
            <div className="truncate text-[#9ca3af] italic">
              &quot;{prompt}&quot;
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1f2937]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#181b22] hover:bg-[#1f232b] text-[#9ca3af] hover:text-[#ffffff] border border-[#1f2937] uppercase text-[10px] font-bold"
              style={{ borderRadius: 0 }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSaved || !name.trim()}
              className="px-4 py-1.5 bg-[#d4a574] hover:bg-[#e0b585] disabled:opacity-50 text-[#0b0d12] uppercase text-[10px] font-bold flex items-center space-x-1"
              style={{ borderRadius: 0 }}
            >
              {isSaved ? (
                <>
                  <Check size={12} />
                  <span>SAVED!</span>
                </>
              ) : (
                <span>SAVE</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
