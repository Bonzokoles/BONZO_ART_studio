import React, { useState, useEffect, useMemo } from 'react';
import type { HistoryItem, ProviderId, AspectRatio } from '../types';
import {
  ARTIST_REGISTRY,
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_MODIFIERS,
  PROMPT_TEMPLATES,
  Artist,
  SavedStylePreset,
  PromptTemplate,
  getCategoryColor,
  getArtistsByCategory,
  searchArtists,
  generateGradient,
  getArtistPromptAddition,
} from '../data/artistsData';
import { loadSavedStyles, deleteStylePreset, clearAllStyles } from '../services/styleStorage';
import { suggestArtistsWithGemini } from '../services/geminiService';
import { PROVIDER_LABELS, PROVIDER_COLORS } from '../services/keyStorage';
import {
  Layers,
  Sparkles,
  Palette,
  Search,
  Download,
  Trash2,
  Maximize2,
  Plus,
  Check,
  Bookmark,
  Wand2,
  BookOpen,
  Sliders,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export type RightSubTab = 'assets' | 'wildcards' | 'styles';

interface RightStudioPanelProps {
  history: HistoryItem[];
  activeImage?: string | null;
  currentPrompt?: string;
  onSelectAsset: (item: HistoryItem) => void;
  onInspectAsset?: (item: HistoryItem) => void;
  onDeleteAsset: (id: string) => void;
  onClearAllAssets: () => void;
  onAppendPrompt: (text: string) => void;
  onSetPrompt: (text: string) => void;
  onApplyStylePreset?: (preset: SavedStylePreset) => void;
}

export const RightStudioPanel: React.FC<RightStudioPanelProps> = ({
  history,
  activeImage,
  currentPrompt = '',
  onSelectAsset,
  onInspectAsset,
  onDeleteAsset,
  onClearAllAssets,
  onAppendPrompt,
  onSetPrompt,
  onApplyStylePreset,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<RightSubTab>('assets');

  // ── Assets Tab State ──
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // ── Wildcards Tab State ──
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [artistSearchQuery, setArtistSearchQuery] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestedArtists, setSuggestedArtists] = useState<
    Array<Artist & { reason?: string }>
  >([]);
  const [addedArtistName, setAddedArtistName] = useState<string | null>(null);

  // ── Styles Tab State ──
  const [savedStyles, setSavedStyles] = useState<SavedStylePreset[]>([]);
  const [usedTemplateName, setUsedTemplateName] = useState<string | null>(null);
  const [usedStyleId, setUsedStyleId] = useState<string | null>(null);

  // Load Saved Styles from localStorage
  const refreshSavedStyles = () => {
    setSavedStyles(loadSavedStyles());
  };

  useEffect(() => {
    refreshSavedStyles();
    const handleStylesUpdate = () => {
      refreshSavedStyles();
    };
    window.addEventListener('bonzo-styles-updated', handleStylesUpdate);
    return () => {
      window.removeEventListener('bonzo-styles-updated', handleStylesUpdate);
    };
  }, []);

  // ── Dynamic Category Counts ──
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: ARTIST_REGISTRY.length,
    };
    for (const cat of CATEGORIES) {
      counts[cat.id] = ARTIST_REGISTRY.filter((a) =>
        a.categories.some((c) => c.toLowerCase() === cat.id.toLowerCase())
      ).length;
    }
    return counts;
  }, []);

  // ── Filtered Assets ──
  const filteredAssets = useMemo(() => {
    if (!assetSearchQuery.trim()) return history;
    const q = assetSearchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.prompt.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q)
    );
  }, [history, assetSearchQuery]);

  // ── Filtered Artists ──
  const filteredArtists = useMemo(() => {
    return searchArtists(artistSearchQuery, selectedCategory);
  }, [selectedCategory, artistSearchQuery]);

  // ── Handlers ──
  const handleDownload = (e: React.MouseEvent, imgUrl: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = `bonzo-asset-${Date.now()}.png`;
    link.click();
  };

  const handleInspect = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    if (onInspectAsset) {
      onInspectAsset(item);
    } else {
      onSelectAsset(item);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteAsset(id);
  };

  const handleAddArtist = (artist: Artist) => {
    const promptAddition = getArtistPromptAddition(artist);
    onAppendPrompt(promptAddition);
    setAddedArtistName(artist.name);
    setTimeout(() => {
      setAddedArtistName(null);
    }, 1200);
  };

  const handleSuggestArtists = async () => {
    setIsSuggesting(true);
    try {
      const results = await suggestArtistsWithGemini(currentPrompt, ARTIST_REGISTRY);
      setSuggestedArtists(results);
    } catch (err) {
      console.warn('Artist suggestion error:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplyPreset = (preset: SavedStylePreset) => {
    if (onApplyStylePreset) {
      onApplyStylePreset(preset);
    } else {
      onSetPrompt(preset.prompt);
    }
    setUsedStyleId(preset.id);
    setTimeout(() => {
      setUsedStyleId(null);
    }, 1200);
  };

  const handleDeletePreset = (id: string) => {
    deleteStylePreset(id);
    refreshSavedStyles();
  };

  const handleUseTemplate = (tmpl: PromptTemplate) => {
    onSetPrompt(tmpl.template);
    setUsedTemplateName(tmpl.name);
    setTimeout(() => {
      setUsedTemplateName(null);
    }, 1200);
  };

  // Helper to render template text with highlighted bracket placeholders
  const renderTemplateSnippet = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return (
      <span className="text-[10px] leading-relaxed text-[#9ca3af]">
        {parts.map((part, i) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            return (
              <span key={i} className="text-[#d4a574] font-bold bg-[#1f2937]/60 px-0.5 mx-0.5">
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <aside
      id="right-studio-panel"
      className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] bg-[#11131a] border-l border-[#1f2937] flex flex-col shrink-0 font-mono text-xs select-none h-full overflow-hidden"
    >
      {/* ─────────────────────────────────────────────────────────────
          SUB-TABS HEADER (Height: 32px, 0px radius, touching edges)
      ───────────────────────────────────────────────────────────── */}
      <div
        id="right-panel-subtabs"
        className="h-[32px] min-h-[32px] flex items-stretch border-b border-[#1f2937] bg-[#181b22] shrink-0"
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('assets')}
          className={`flex-1 flex items-center justify-center space-x-1.5 px-2 text-[10px] uppercase font-bold tracking-wider transition-colors border-r border-[#1f2937] ${
            activeSubTab === 'assets'
              ? 'bg-[#d4a574] text-[#0b0d12]'
              : 'bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
          }`}
          style={{ borderRadius: 0 }}
        >
          <Layers size={12} />
          <span>ASSETS</span>
          <span
            className={`text-[9px] ${
              activeSubTab === 'assets' ? 'text-[#0b0d12]/80' : 'text-[#6b7280]'
            }`}
          >
            ({history.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('wildcards')}
          className={`flex-1 flex items-center justify-center space-x-1.5 px-2 text-[10px] uppercase font-bold tracking-wider transition-colors border-r border-[#1f2937] ${
            activeSubTab === 'wildcards'
              ? 'bg-[#d4a574] text-[#0b0d12]'
              : 'bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
          }`}
          style={{ borderRadius: 0 }}
        >
          <Sparkles size={12} />
          <span>WILDCARDS</span>
          <span
            className={`text-[9px] ${
              activeSubTab === 'wildcards' ? 'text-[#0b0d12]/80' : 'text-[#6b7280]'
            }`}
          >
            ({ARTIST_REGISTRY.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('styles')}
          className={`flex-1 flex items-center justify-center space-x-1.5 px-2 text-[10px] uppercase font-bold tracking-wider transition-colors ${
            activeSubTab === 'styles'
              ? 'bg-[#d4a574] text-[#0b0d12]'
              : 'bg-[#181b22] text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
          }`}
          style={{ borderRadius: 0 }}
        >
          <Palette size={12} />
          <span>STYLES</span>
          {savedStyles.length > 0 && (
            <span
              className={`text-[9px] ${
                activeSubTab === 'styles' ? 'text-[#0b0d12]/80' : 'text-[#d4a574]'
              }`}
            >
              ({savedStyles.length})
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ═══════════════════════════════════════════════════════════
            1. ASSETS SUB-TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeSubTab === 'assets' && (
          <div className="space-y-3">
            {/* Header & Clear */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2937]">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px]">
                  ASSET VAULT
                </span>
                <span className="text-[#9ca3af] text-[10px]">[{history.length}]</span>
              </div>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAllAssets}
                  className="text-[#ef4444] hover:text-[#ff6b6b] text-[9px] uppercase font-bold tracking-wider hover:underline"
                  title="Clear all generated assets"
                >
                  [CLEAR ALL]
                </button>
              )}
            </div>

            {/* Search Filter */}
            {history.length > 2 && (
              <div className="relative">
                <Search size={11} className="absolute left-2 top-2 text-[#6b7280]" />
                <input
                  type="text"
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  placeholder="FILTER ASSETS..."
                  className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] placeholder-[#525660] pl-6 pr-2 py-1 text-[10px] focus:border-[#d4a574] focus:outline-none"
                  style={{ borderRadius: 0 }}
                />
              </div>
            )}

            {/* Assets Grid */}
            {filteredAssets.length === 0 ? (
              <div className="py-12 px-2 text-center text-[#6b7280] space-y-2">
                <Layers size={24} className="mx-auto text-[#1f2937]" />
                <div className="text-[10px] uppercase tracking-wider font-bold">
                  NO ASSETS IN STORAGE
                </div>
                <div className="text-[9px] leading-relaxed">
                  Generated images automatically persist here. Click any thumbnail to load it into
                  the canvas.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredAssets.map((item) => {
                  const mainImg = item.images[0];
                  const isSelected = activeImage === mainImg;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectAsset(item)}
                      className={`cursor-pointer bg-[#0b0d12] border transition-all p-1 group relative flex flex-col ${
                        isSelected
                          ? 'border-[#d4a574] ring-1 ring-[#d4a574]'
                          : 'border-[#1f2937] hover:border-[#2a3140]'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      {/* Thumbnail Image */}
                      <div className="relative w-full aspect-square bg-[#0b0d12] overflow-hidden flex items-center justify-center">
                        <img
                          src={mainImg}
                          alt={item.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />

                        {/* Provider Tag */}
                        <span
                          className="absolute top-1 left-1 w-1.5 h-1.5"
                          style={{ backgroundColor: PROVIDER_COLORS[item.provider] }}
                          title={PROVIDER_LABELS[item.provider]}
                        />

                        {/* Multi-output badge */}
                        {item.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-[#0b0d12]/90 text-[#ffffff] px-1 text-[8px] border border-[#1f2937]">
                            +{item.images.length - 1}
                          </span>
                        )}

                        {/* Quick Hover Actions Overlay */}
                        <div className="absolute inset-0 bg-[#0b0d12]/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleInspect(e, item)}
                            className="p-1 bg-[#181b22] text-[#d4a574] border border-[#1f2937] hover:border-[#d4a574] hover:bg-[#222733]"
                            title="Inspect in Lightbox / Fullscreen"
                            style={{ borderRadius: 0 }}
                          >
                            <Maximize2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownload(e, mainImg)}
                            className="p-1 bg-[#181b22] text-[#ffffff] border border-[#1f2937] hover:border-[#d4a574]"
                            title="Download asset"
                            style={{ borderRadius: 0 }}
                          >
                            <Download size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-1 bg-[#181b22] text-[#ef4444] border border-[#1f2937] hover:border-[#ef4444]"
                            title="Delete asset"
                            style={{ borderRadius: 0 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Asset Prompt Metadata */}
                      <div className="pt-1 text-[9px] text-[#9ca3af] truncate">
                        <span className="text-[#ffffff] font-bold block truncate">{item.prompt}</span>
                        <div className="flex items-center justify-between text-[#6b7280] text-[8px] mt-0.5">
                          <span className="uppercase">{PROVIDER_LABELS[item.provider]}</span>
                          <span>{item.aspectRatio}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Asset Storage Info Footer */}
            <div className="pt-2 border-t border-[#1f2937] text-[9px] text-[#6b7280] flex items-center justify-between">
              <span>STORAGE: LOCAL</span>
              <span>MAX: 20 ASSETS</span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            2. WILDCARDS SUB-TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeSubTab === 'wildcards' && (
          <div className="space-y-3">
            {/* Style Categories Chips with Badge Counts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#ffffff] tracking-wider block">
                  STYLE CATEGORIES ({CATEGORIES.length})
                </span>
                <span className="text-[9px] text-[#6b7280]">
                  TOTAL: {ARTIST_REGISTRY.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {/* 'ALL' Chip */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-1.5 py-0.5 text-[9px] uppercase font-bold border transition-colors flex items-center space-x-1 ${
                    selectedCategory === 'all'
                      ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                      : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-[#ffffff] hover:border-[#374151]'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <span>ALL</span>
                  <span
                    className={`text-[8px] px-1 py-0 ${
                      selectedCategory === 'all'
                        ? 'bg-[#0b0d12]/30 text-[#0b0d12] font-black'
                        : 'bg-[#0b0d12] text-[#6b7280] border border-[#1f2937]'
                    }`}
                  >
                    {categoryCounts['all'] || ARTIST_REGISTRY.length}
                  </span>
                </button>

                {/* All 16 Categories */}
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-1.5 py-0.5 text-[9px] uppercase font-bold border transition-colors flex items-center space-x-1 ${
                        isSelected
                          ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                          : 'bg-[#181b22] text-[#9ca3af] border-[#1f2937] hover:text-[#ffffff] hover:border-[#374151]'
                      }`}
                      style={{
                        borderRadius: 0,
                        borderLeftColor: !isSelected ? cat.color : undefined,
                        borderLeftWidth: !isSelected ? '2px' : undefined,
                      }}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[8px] px-1 py-0 ${
                          isSelected
                            ? 'bg-[#0b0d12]/30 text-[#0b0d12] font-black'
                            : 'bg-[#0b0d12] text-[#6b7280] border border-[#1f2937]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-2.5 text-[#6b7280]" />
              <input
                type="text"
                value={artistSearchQuery}
                onChange={(e) => setArtistSearchQuery(e.target.value)}
                placeholder="Search artists, categories, keywords..."
                className="w-full bg-[#0b0d12] border border-[#1f2937] focus:border-[#d4a574] text-[#ffffff] placeholder-[#525660] pl-7 pr-2 py-1.5 text-[10px] focus:outline-none"
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Gemini AI Artist Suggestion Button */}
            <button
              type="button"
              disabled={isSuggesting}
              onClick={handleSuggestArtists}
              className="w-full py-2 px-3 bg-[#181b22] hover:bg-[#20242e] border border-[#d4a574]/60 hover:border-[#d4a574] text-[#d4a574] font-bold text-[10px] uppercase flex flex-col items-center justify-center space-y-0.5 transition-colors disabled:opacity-50"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center space-x-1.5">
                <Sparkles size={12} className={isSuggesting ? 'animate-spin' : ''} />
                <span>
                  {isSuggesting ? 'CONSULTING GEMINI AI...' : 'SUGGEST ARTISTS FOR MY PROMPT (Gemini)'}
                </span>
              </div>
              <span className="text-[8px] text-[#9ca3af] font-normal lowercase">
                analyzes &apos;{currentPrompt ? currentPrompt.slice(0, 30) + '...' : 'empty prompt'}&apos;
              </span>
            </button>

            {/* Gemini Suggestions Results Section */}
            {suggestedArtists.length > 0 && (
              <div className="bg-[#0b0d12] border border-[#d4a574] p-2 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#d4a574] font-bold uppercase pb-1 border-b border-[#1f2937]">
                  <div className="flex items-center space-x-1">
                    <Sparkles size={11} />
                    <span>GEMINI RECOMMENDED ARTISTS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuggestedArtists([])}
                    className="text-[#6b7280] hover:text-[#ef4444] text-[9px]"
                  >
                    [CLEAR]
                  </button>
                </div>

                <div className="space-y-1.5">
                  {suggestedArtists.map((artist) => {
                    const primaryCat = artist.categories[0] || 'anime';
                    const color = getCategoryColor(primaryCat);
                    const isAdded = addedArtistName === artist.name;

                    return (
                      <div
                        key={`sug-${artist.id || artist.name}`}
                        className="bg-[#11131a] border border-[#1f2937] p-2 flex gap-2"
                        style={{ borderLeft: `4px solid ${color}`, borderRadius: 0 }}
                      >
                        {/* Thumbnail Slot (56x56) */}
                        <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] shrink-0 bg-[#181b22] border border-[#1f2937] overflow-hidden">
                          {artist.imageSlot ? (
                            <img
                              src={artist.imageSlot}
                              alt={artist.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center font-bold text-[#ffffff] text-lg select-none"
                              style={{ background: generateGradient(artist.name) }}
                            >
                              <span>{artist.name[0]?.toUpperCase() || 'A'}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[#ffffff] text-[10px] truncate">
                              {artist.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddArtist(artist)}
                              className={`px-2 py-0.5 text-[9px] uppercase font-bold border transition-colors shrink-0 ${
                                isAdded
                                  ? 'bg-[#10b981] text-[#0b0d12] border-[#10b981]'
                                  : 'bg-[#181b22] hover:bg-[#222733] text-[#d4a574] border-[#1f2937] hover:border-[#d4a574]'
                              }`}
                              style={{ borderRadius: 0 }}
                            >
                              {isAdded ? '[ADDED]' : '[ADD]'}
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {artist.categories.map((c) => (
                              <span
                                key={c}
                                className="text-[8px] px-1 py-0.2 uppercase border border-[#1f2937]"
                                style={{ color: getCategoryColor(c) }}
                              >
                                {c}
                              </span>
                            ))}
                          </div>

                          {artist.reason && (
                            <div className="text-[9px] text-[#d4a574] italic line-clamp-2">
                              {artist.reason}
                            </div>
                          )}

                          <div className="text-[8px] text-[#6b7280] truncate">
                            Known for: {artist.knownFor}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="text-[10px] text-[#9ca3af] uppercase font-bold flex items-center justify-between pb-1 border-b border-[#1f2937]">
              <span>RESULTS: {filteredArtists.length} ARTISTS</span>
              {selectedCategory !== 'all' && (
                <span className="text-[#d4a574] text-[9px]">[{selectedCategory}]</span>
              )}
            </div>

            {/* Scrollable Artist Cards List */}
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5">
              {filteredArtists.length === 0 ? (
                <div className="text-center py-8 text-[#6b7280] space-y-1">
                  <div className="text-[10px] uppercase font-bold">NO ARTISTS MATCH FILTER</div>
                  <div className="text-[9px]">Try changing the category or search keywords</div>
                </div>
              ) : (
                filteredArtists.map((artist) => {
                  const primaryCat = artist.categories[0] || 'anime';
                  const color = getCategoryColor(primaryCat);
                  const isAdded = addedArtistName === artist.name;

                  return (
                    <div
                      key={artist.id || artist.name}
                      className="bg-[#0b0d12] border border-[#1f2937] p-2 flex gap-2.5 transition-colors hover:border-[#2a3140] group relative"
                      style={{ borderLeft: `4px solid ${color}`, borderRadius: 0 }}
                    >
                      {/* Thumbnail Slot (56x56) */}
                      <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] shrink-0 bg-[#181b22] border border-[#1f2937] overflow-hidden">
                        {artist.imageSlot ? (
                          <img
                            src={artist.imageSlot}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center font-bold text-[#ffffff] text-lg select-none"
                            style={{ background: generateGradient(artist.name) }}
                            title={`${artist.name} (Auto-generated placeholder slot)`}
                          >
                            <span>{artist.name[0]?.toUpperCase() || 'A'}</span>
                          </div>
                        )}
                      </div>

                      {/* Artist Info & Actions */}
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Name and Action */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold text-[#ffffff] text-[11px] truncate leading-tight">
                            {artist.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddArtist(artist)}
                            className={`px-2 py-0.5 text-[9px] uppercase font-bold border transition-colors shrink-0 ${
                              isAdded
                                ? 'bg-[#10b981] text-[#0b0d12] border-[#10b981]'
                                : 'bg-[#181b22] hover:bg-[#222733] text-[#d4a574] border-[#1f2937] hover:border-[#d4a574]'
                            }`}
                            style={{ borderRadius: 0 }}
                            title="Append artist style & category modifiers to prompt"
                          >
                            {isAdded ? '[ADDED]' : '[ADD]'}
                          </button>
                        </div>

                        {/* Style Category Tags */}
                        <div className="flex flex-wrap gap-1">
                          {artist.categories.map((c) => {
                            const tagColor = getCategoryColor(c);
                            return (
                              <span
                                key={c}
                                className="px-1 py-0.2 text-[8px] uppercase font-bold border"
                                style={{
                                  backgroundColor: `${tagColor}18`,
                                  color: tagColor,
                                  borderColor: `${tagColor}44`,
                                }}
                              >
                                {c}
                              </span>
                            );
                          })}
                        </div>

                        {/* Description / Prompt Snippet */}
                        <div className="text-[9px] text-[#9ca3af] leading-tight line-clamp-2">
                          {artist.description}
                        </div>

                        {/* Known For */}
                        <div className="text-[8px] text-[#6b7280] truncate">
                          Known for: {artist.knownFor}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            3. STYLES SUB-TAB
        ═══════════════════════════════════════════════════════════ */}
        {activeSubTab === 'styles' && (
          <div className="space-y-4">
            {/* ── Section A: MY STYLES ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
                <div className="flex items-center space-x-1.5">
                  <Bookmark size={12} className="text-[#d4a574]" />
                  <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px]">
                    MY STYLES ({savedStyles.length})
                  </span>
                </div>
                {savedStyles.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllStyles}
                    className="text-[#ef4444] hover:text-[#ff6b6b] text-[9px] uppercase font-bold"
                  >
                    [CLEAR]
                  </button>
                )}
              </div>

              {savedStyles.length === 0 ? (
                <div className="py-4 px-2 bg-[#0b0d12] border border-[#1f2937] text-center text-[#6b7280] space-y-1">
                  <div className="text-[10px] uppercase font-bold">NO SAVED STYLES</div>
                  <div className="text-[9px] leading-relaxed">
                    Generate an image and click <span className="text-[#d4a574]">[SAVE AS STYLE]</span> on the canvas action bar to store your custom parameter presets here.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedStyles.map((preset) => {
                    const isApplied = usedStyleId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className="bg-[#0b0d12] border border-[#1f2937] p-2 space-y-1.5 hover:border-[#2a3140] transition-colors"
                        style={{ borderRadius: 0 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            {preset.previewImage && (
                              <img
                                src={preset.previewImage}
                                alt={preset.name}
                                className="w-9 h-9 object-cover border border-[#1f2937] shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-[#ffffff] text-[10px] truncate">
                                {preset.name}
                              </div>
                              <div className="flex items-center space-x-1 text-[8px] text-[#6b7280]">
                                <span
                                  className="w-1.5 h-1.5 shrink-0"
                                  style={{ backgroundColor: PROVIDER_COLORS[preset.provider] }}
                                />
                                <span className="uppercase">
                                  {PROVIDER_LABELS[preset.provider]}
                                </span>
                                <span>·</span>
                                <span>{preset.aspectRatio}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApplyPreset(preset)}
                              className={`px-2 py-0.5 text-[9px] uppercase font-bold border transition-colors ${
                                isApplied
                                  ? 'bg-[#10b981] text-[#0b0d12] border-[#10b981]'
                                  : 'bg-[#181b22] hover:bg-[#222733] text-[#d4a574] border-[#1f2937] hover:border-[#d4a574]'
                              }`}
                              style={{ borderRadius: 0 }}
                            >
                              {isApplied ? '[APPLIED]' : '[USE]'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-1 bg-[#181b22] text-[#6b7280] hover:text-[#ef4444] border border-[#1f2937]"
                              title="Delete style"
                              style={{ borderRadius: 0 }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Prompt preview */}
                        <div className="text-[9px] text-[#9ca3af] italic truncate">
                          &quot;{preset.prompt}&quot;
                        </div>

                        {/* Tag Chips */}
                        {preset.tags && preset.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {preset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-[#11131a] text-[#d4a574] border border-[#1f2937] px-1 py-0.2 text-[8px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section B: BUILT-IN TEMPLATES ── */}
            <div className="space-y-2 pt-2 border-t border-[#1f2937]">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f2937]">
                <div className="flex items-center space-x-1.5">
                  <BookOpen size={12} className="text-[#d4a574]" />
                  <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px]">
                    BUILT-IN TEMPLATES
                  </span>
                </div>
                <span className="text-[#6b7280] text-[9px] font-mono">
                  [{PROMPT_TEMPLATES.length} TEMPLATES]
                </span>
              </div>

              <div className="space-y-2">
                {PROMPT_TEMPLATES.map((tmpl) => {
                  const isUsed = usedTemplateName === tmpl.name;

                  return (
                    <div
                      key={tmpl.name}
                      className="bg-[#0b0d12] border border-[#1f2937] p-2 space-y-1.5 hover:border-[#2a3140] transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#ffffff] text-[10px]">
                          {tmpl.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUseTemplate(tmpl)}
                          className={`px-2 py-0.5 text-[9px] uppercase font-bold border transition-colors ${
                            isUsed
                              ? 'bg-[#10b981] text-[#0b0d12] border-[#10b981]'
                              : 'bg-[#181b22] hover:bg-[#222733] text-[#d4a574] border-[#1f2937] hover:border-[#d4a574]'
                          }`}
                          style={{ borderRadius: 0 }}
                        >
                          {isUsed ? '[LOADED]' : '[USE]'}
                        </button>
                      </div>

                      {/* Template snippet with highlighted placeholders */}
                      <div>{renderTemplateSnippet(tmpl.template)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

