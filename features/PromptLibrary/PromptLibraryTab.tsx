import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Compass,
  Bookmark,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Heart,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import { discoverPrompts, discoverResources } from '../../services/geminiService';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  lastModified: number;
}

export interface PromptResource {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  createdAt: number;
}

export const PromptLibraryTab: React.FC = () => {
  // --- State ---
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [resources, setResources] = useState<PromptResource[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'library' | 'discover' | 'resources'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'modified'>('newest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('GPT-4');
  const [formTags, setFormTags] = useState('');

  // Discover Agent State
  const [isSearching, setIsSearching] = useState(false);
  const [discoverMode, setDiscoverMode] = useState<'prompts' | 'resources'>('prompts');
  const [discoverResult, setDiscoverResult] = useState<any | null>(null);

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Initial Data & LocalStorage ---
  useEffect(() => {
    const storedPrompts = localStorage.getItem('bonzo-studio-prompts');
    const storedResources = localStorage.getItem('bonzo-studio-resources');

    if (storedPrompts) {
      setPrompts(JSON.parse(storedPrompts));
    } else {
      const defaultPrompts: Prompt[] = [
        {
          id: 'default-1',
          title: 'Exploded Technical Blueprint',
          content: 'Exploded view blueprint of a high-performance computer graphics card, intricate circuit board layout, cooling fans, heatsink components, technical line art, precise annotations, blueprint grid background, orthographic projection, clean blueprints aesthetic, patent drawing style, high contrast',
          category: 'FLUX / SDXL',
          tags: ['technical', 'blueprint', 'graphics'],
          isFavorite: true,
          createdAt: Date.now(),
          lastModified: Date.now(),
        },
        {
          id: 'default-2',
          title: 'Retro-Futuristic Workshop',
          content: 'A retro-futuristic mechanical workshop, a polished brass automaton sitting on a rustic wooden workbench, warm golden light filtering through dusty air, dramatic volumetric shadows, 35mm cinematic photograph, hyper-detailed',
          category: 'FLUX / SDXL',
          tags: ['concept', 'cinematic', 'retro'],
          isFavorite: false,
          createdAt: Date.now() - 10000,
          lastModified: Date.now() - 10000,
        },
        {
          id: 'default-3',
          title: 'Midjourney Photorealistic Portrait',
          content: '/imagine prompt: cinematic close up portrait of an elegant cyberpunk samurai in neo-tokyo, glowing neon tattoos, rain reflections, highly detailed, 8k, unreal engine 5 --ar 16:9 --v 6.0',
          category: 'Midjourney',
          tags: ['photorealism', 'cyberpunk', 'portrait'],
          isFavorite: true,
          createdAt: Date.now() - 20000,
          lastModified: Date.now() - 20000,
        }
      ];
      setPrompts(defaultPrompts);
      localStorage.setItem('bonzo-studio-prompts', JSON.stringify(defaultPrompts));
    }

    if (storedResources) {
      setResources(JSON.parse(storedResources));
    } else {
      const defaultResources: PromptResource[] = [
        {
          id: 'r-1',
          title: 'Midjourney V6 Official Docs',
          url: 'https://docs.midjourney.com/',
          description: 'Official Midjourney documentation and parameters guide.',
          category: 'Midjourney',
          createdAt: Date.now(),
        },
        {
          id: 'r-2',
          title: 'Anthropic Prompt Engineering Library',
          url: 'https://docs.anthropic.com/claude/prompt-library',
          description: 'Official zbiór zoptymalizowanych promptów dla modeli Claude 3 i Claude 3.5.',
          category: 'Claude',
          createdAt: Date.now(),
        }
      ];
      setResources(defaultResources);
      localStorage.setItem('bonzo-studio-resources', JSON.stringify(defaultResources));
    }
  }, []);

  const savePromptsToStorage = (updated: Prompt[]) => {
    setPrompts(updated);
    localStorage.setItem('bonzo-studio-prompts', JSON.stringify(updated));
  };

  const saveResourcesToStorage = (updated: PromptResource[]) => {
    setResources(updated);
    localStorage.setItem('bonzo-studio-resources', JSON.stringify(updated));
  };

  // --- Handlers ---
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast('PROMPT COPIED TO CLIPBOARD');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = prompts.map((p) =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite, lastModified: Date.now() } : p
    );
    savePromptsToStorage(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Czy na pewno usunąć ten prompt z Twojej kolekcji?')) {
      const updated = prompts.filter((p) => p.id !== id);
      savePromptsToStorage(updated);
      triggerToast('PROMPT REMOVED');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPrompt(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('FLUX / SDXL');
    setFormTags('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormTitle(prompt.title);
    setFormContent(prompt.content);
    setFormCategory(prompt.category);
    setFormTags(prompt.tags.join(', '));
    setIsModalOpen(true);
  };

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Tytuł oraz treść promptu są wymagane!');
      return;
    }

    const tagsArr = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    let updated: Prompt[];
    if (editingPrompt) {
      updated = prompts.map((p) =>
        p.id === editingPrompt.id
          ? {
              ...p,
              title: formTitle,
              content: formContent,
              category: formCategory,
              tags: tagsArr,
              lastModified: Date.now(),
            }
          : p
      );
      triggerToast('PROMPT UPDATED');
    } else {
      const newPrompt: Prompt = {
        id: 'p-' + Math.floor(Math.random() * 9999999),
        title: formTitle,
        content: formContent,
        category: formCategory,
        tags: tagsArr,
        isFavorite: false,
        createdAt: Date.now(),
        lastModified: Date.now(),
      };
      updated = [newPrompt, ...prompts];
      triggerToast('NEW PROMPT CREATED');
    }

    savePromptsToStorage(updated);
    setIsModalOpen(false);
  };

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setDiscoverResult(null);

    try {
      if (discoverMode === 'prompts') {
        const res = await discoverPrompts(searchQuery, 4);
        setDiscoverResult(res);
      } else {
        const res = await discoverResources(searchQuery);
        setDiscoverResult(res);
      }
    } catch (err: any) {
      alert(err.message || 'Wystąpił błąd wyszukiwania.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportPrompt = (title: string, content: string, category: string) => {
    setEditingPrompt(null);
    setFormTitle(title);
    setFormContent(content);
    setFormCategory(category);
    setFormTags('imported, trend');
    setIsModalOpen(true);
  };

  const handleSaveResourceFromDiscover = (title: string, url: string, desc: string, cat: string) => {
    const newResource: PromptResource = {
      id: 'r-' + Math.floor(Math.random() * 999999),
      title,
      url,
      description: desc,
      category: cat,
      createdAt: Date.now(),
    };
    const updated = [newResource, ...resources];
    saveResourcesToStorage(updated);
    triggerToast('RESOURCE SAVED TO DATABASE');
  };

  const handleDeleteResource = (id: string) => {
    if (window.confirm('Czy na pewno usunąć ten zasób?')) {
      const updated = resources.filter((r) => r.id !== id);
      saveResourcesToStorage(updated);
      triggerToast('RESOURCE REMOVED');
    }
  };

  // --- Filtering & Sorting ---
  const filteredPrompts = useMemo(() => {
    return prompts
      .filter((p) => {
        // Category Filter
        if (filterCategory === 'Favorites') return p.isFavorite;
        if (filterCategory !== 'All' && p.category !== filterCategory) return false;

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchContent = p.content.toLowerCase().includes(q);
          const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchContent || matchTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt - a.createdAt;
        if (sortOption === 'oldest') return a.createdAt - b.createdAt;
        if (sortOption === 'modified') return b.lastModified - a.lastModified;
        return 0;
      });
  }, [prompts, searchQuery, filterCategory, sortOption]);

  const categoriesList = ['All', 'Favorites', 'FLUX / SDXL', 'Midjourney', 'GPT-4', 'Claude', 'Gemini', 'DALL-E', 'Other'];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      
      {/* LEFT SIDE: Navigation and Controls */}
      <div className="w-full md:w-64 bg-[#11131a] border-b md:border-b-0 md:border-r border-[#1f2937] p-4 flex flex-col shrink-0 space-y-4 select-none">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#1f2937]">
          <BookOpen className="text-[#d4a574]" size={16} />
          <span className="font-bold text-[#ffffff] tracking-wider text-xs uppercase">PROMPT MASTER / HUB</span>
        </div>

        {/* Navigation buttons */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('library');
              setSearchQuery('');
              setDiscoverResult(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase transition-colors ${
              activeSubTab === 'library'
                ? 'bg-[#1f232b] text-[#ffffff] border-l-2 border-[#d4a574]'
                : 'text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bookmark size={13} />
              <span>Twoja Kolekcja</span>
            </div>
            <span className="text-[10px] bg-[#0b0d12] px-1.5 py-0.5 border border-[#1f2937] text-[#9ca3af] font-mono">
              {prompts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('discover');
              setSearchQuery('');
              setDiscoverResult(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase transition-colors ${
              activeSubTab === 'discover'
                ? 'bg-[#1f232b] text-[#ffffff] border-l-2 border-[#d4a574]'
                : 'text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Compass size={13} />
              <span>Odkrywaj (AI Agent)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('resources');
              setSearchQuery('');
              setDiscoverResult(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase transition-colors ${
              activeSubTab === 'resources'
                ? 'bg-[#1f232b] text-[#ffffff] border-l-2 border-[#d4a574]'
                : 'text-[#9ca3af] hover:text-[#ffffff] hover:bg-[#1f232b]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles size={13} />
              <span>Baza Zasobów</span>
            </div>
            <span className="text-[10px] bg-[#0b0d12] px-1.5 py-0.5 border border-[#1f2937] text-[#9ca3af] font-mono">
              {resources.length}
            </span>
          </button>
        </div>

        {/* Quick Help Guide */}
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="w-full flex items-center justify-center space-x-1.5 py-2 border border-[#1f2937] hover:border-[#d4a574] text-[#9ca3af] hover:text-[#ffffff] font-bold text-xs uppercase font-mono transition-colors"
        >
          <HelpCircle size={13} />
          <span>PORADNIK / POMOC</span>
        </button>

        {activeSubTab === 'library' && (
          <>
            {/* Category Filter */}
            <div className="space-y-1.5 pt-2 border-t border-[#1f2937]">
              <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">KATEGORIE</span>
              <div className="flex flex-wrap gap-1">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`text-[9px] px-2 py-0.5 border font-mono font-bold uppercase transition-all ${
                      filterCategory === cat
                        ? 'bg-[#d4a574] text-[#0b0d12] border-[#d4a574]'
                        : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:border-[#6b7280]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-1.5 pt-2 border-t border-[#1f2937]">
              <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">SORTOWANIE</span>
              <div className="grid grid-cols-3 gap-1">
                {(['newest', 'oldest', 'modified'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSortOption(opt)}
                    className={`text-[9px] py-1 border font-mono font-bold uppercase text-center transition-all ${
                      sortOption === opt
                        ? 'bg-[#1f232b] text-[#ffffff] border-[#d4a574]'
                        : 'bg-[#0b0d12] text-[#9ca3af] border-[#1f2937] hover:border-[#6b7280]'
                    }`}
                  >
                    {opt === 'newest' && 'Nowe'}
                    {opt === 'oldest' && 'Stare'}
                    {opt === 'modified' && 'Edytowane'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE: Main Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0d12]">
        
        {/* Upper Search Bar & Create Trigger */}
        <div className="p-3 bg-[#11131a] border-b border-[#1f2937] flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {activeSubTab === 'discover' ? (
            <form onSubmit={handleDiscover} className="flex-1 flex items-center space-x-2 max-w-xl w-full">
              <select
                value={discoverMode}
                onChange={(e) => setDiscoverMode(e.target.value as any)}
                className="bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-mono text-[11px] p-1.5 outline-none focus:border-[#d4a574]"
              >
                <option value="prompts">Wyszukaj Prompty</option>
                <option value="resources">Wyszukaj Przewodniki</option>
              </select>
              <div className="flex-1 relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    discoverMode === 'prompts'
                      ? 'Napisz temat, np. "cyberpunk street food vendor tokyo"...'
                      : 'Wpisz technologię, np. "flux fast generation tricks"...'
                  }
                  className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-sans text-xs p-1.5 pl-8 outline-none focus:border-[#d4a574]"
                  disabled={isSearching}
                />
              </div>
              <button
                type="submit"
                className="bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-xs uppercase px-4 py-1.5 transition-colors"
                disabled={isSearching}
              >
                {isSearching ? 'Wyszukiwanie...' : 'Szukaj'}
              </button>
            </form>
          ) : (
            <div className="flex-1 relative max-w-md w-full">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtruj prompty po tytule, tagach, treści..."
                className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-sans text-xs p-1.5 pl-8 outline-none focus:border-[#d4a574]"
              />
            </div>
          )}

          {activeSubTab === 'library' && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-xs uppercase px-4 py-1.5 transition-colors"
            >
              <Plus size={13} />
              <span>DODAJ PROMPT</span>
            </button>
          )}
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 p-4 overflow-y-auto font-sans">
          
          {/* TAB 1: Library Collection */}
          {activeSubTab === 'library' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredPrompts.length === 0 ? (
                <div className="col-span-full py-16 text-center text-[#6b7280] font-mono uppercase">
                  Brak zapisanych promptów spełniających kryteria wyszukiwania.
                </div>
              ) : (
                filteredPrompts.map((p) => (
                  <div key={p.id} className="bg-[#11131a] border border-[#1f2937] p-3 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-[#ffffff] truncate" title={p.title}>{p.title}</h4>
                          <span className="inline-block text-[9px] text-[#d4a574] bg-[#d4a574]/10 border border-[#d4a574]/30 px-1.5 py-0.2 font-mono uppercase font-semibold">
                            {p.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(p.id)}
                            className={`p-1.5 border transition-all ${
                              p.isFavorite
                                ? 'bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444]'
                                : 'bg-[#0b0d12] border-[#1f2937] text-[#6b7280] hover:border-[#6b7280]'
                            }`}
                          >
                            <Heart size={12} fill={p.isFavorite ? '#ef4444' : 'transparent'} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-[#0b0d12] border border-[#1f2937] text-[#9ca3af] hover:text-[#ffffff] hover:border-[#6b7280] transition-all"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 bg-[#0b0d12] border border-[#1f2937] text-[#6b7280] hover:text-[#ef4444] hover:border-[#ef4444] transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#0b0d12] border border-[#1f2937] p-2 max-h-32 overflow-y-auto select-text font-mono text-[10px] text-[#d4a574] break-all leading-normal">
                        {p.content}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-2 border-t border-[#1f2937]/50 select-none">
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[8px] font-mono font-semibold uppercase bg-[#1f232b] text-[#9ca3af] px-1 py-0.2"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.id, p.content)}
                        className={`flex items-center space-x-1 py-1 px-3 border font-mono font-bold text-[9px] uppercase transition-colors shrink-0 ${
                          copiedId === p.id
                            ? 'bg-[#10b981] text-[#0b0d12] border-[#10b981]'
                            : 'bg-[#181b22] text-[#d4a574] border-[#1f2937] hover:border-[#d4a574]'
                        }`}
                      >
                        {copiedId === p.id ? <Check size={10} /> : <Copy size={10} />}
                        <span>{copiedId === p.id ? 'SKOPIOWANO!' : 'KOPIUJ'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Discover AI Agent */}
          {activeSubTab === 'discover' && (
            <div className="space-y-4">
              {isSearching && (
                <div className="py-16 flex flex-col items-center justify-center space-y-4 select-none">
                  <div className="w-8 h-8 border-2 border-t-transparent border-[#d4a574] animate-spin"></div>
                  <div className="space-y-1 text-center">
                    <p className="font-mono text-xs text-[#ffffff] font-bold">PRZESZUKIWANIE SIECI (GOOGLE GROUNDING)...</p>
                    <p className="text-[10px] text-[#6b7280]">Eksploracja forów, baz promptów i repozytoriów w poszukiwaniu trendów.</p>
                  </div>
                </div>
              )}

              {!isSearching && !discoverResult && (
                <div className="py-16 text-center max-w-md mx-auto space-y-3 select-none">
                  <Compass size={32} className="text-[#6b7280] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#ffffff] uppercase">Inteligentny Odkrywca Trendów</h4>
                    <p className="text-[11px] text-[#9ca3af] leading-relaxed">
                      Użyj paska wyszukiwania na górze, aby zaangażować Agenta AI zasilanego bazą wyszukiwania Google. 
                      Znajdziemy dla Ciebie najbardziej aktualne, popularne i efektywne prompty lub przewodniki z sieci.
                    </p>
                  </div>
                </div>
              )}

              {!isSearching && discoverResult && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Summary Box */}
                  <div className="bg-[#11131a]/60 border border-[#d4a574]/30 p-3 select-text">
                    <div className="flex items-center space-x-1.5 text-[#d4a574] mb-1">
                      <TrendingUp size={13} />
                      <span className="font-mono font-bold text-[10px] uppercase">PODSUMOWANIE AGENTA:</span>
                    </div>
                    <p className="text-xs text-[#d4d4d8] leading-relaxed italic">
                      "{discoverResult.summary}"
                    </p>
                  </div>

                  {/* Prompts Discovery List */}
                  {discoverResult.prompts && discoverResult.prompts.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider select-none">ZNALEZIONE TRENDY I PROMPTY</span>
                      <div className="grid grid-cols-1 gap-3">
                        {discoverResult.prompts.map((p: any, idx: number) => (
                          <div key={idx} className="bg-[#11131a] border border-[#1f2937] p-3 space-y-2 select-text">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-[#ffffff]">{p.title}</h5>
                                <span className="inline-block text-[8px] bg-[#d4a574]/10 border border-[#d4a574]/30 text-[#d4a574] px-1 font-mono uppercase mt-0.5">{p.model}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleImportPrompt(p.title, p.content, p.model)}
                                className="flex items-center space-x-1 bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-[9px] uppercase px-3 py-1 transition-colors select-none"
                              >
                                <Plus size={10} />
                                <span>Importuj</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-[#9ca3af] leading-relaxed">{p.description}</p>
                            <div className="bg-[#0b0d12] border border-[#1f2937] p-2 font-mono text-[10px] text-[#d4a574] break-all max-h-24 overflow-y-auto">
                              {p.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resources Discovery List */}
                  {discoverResult.resources && discoverResult.resources.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider select-none">ZNALEZIONE MATERIAŁY I REPOZYTORIA</span>
                      <div className="grid grid-cols-1 gap-3">
                        {discoverResult.resources.map((r: any, idx: number) => (
                          <div key={idx} className="bg-[#11131a] border border-[#1f2937] p-3 space-y-2 select-text">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-[#ffffff]">{r.title}</h5>
                                <span className="inline-block text-[8px] bg-[#d4a574]/10 border border-[#d4a574]/30 text-[#d4a574] px-1 font-mono uppercase mt-0.5">{r.model}</span>
                              </div>
                              <div className="flex items-center space-x-1 select-none">
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 bg-[#1f232b] hover:bg-[#2a3140] text-[#ffffff] border border-[#1f2937] font-mono font-bold text-[9px] uppercase px-3 py-1 transition-colors"
                                >
                                  <ExternalLink size={10} />
                                  <span>OTWÓRZ</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleSaveResourceFromDiscover(r.title, r.url, r.description, r.model)}
                                  className="flex items-center space-x-1 bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-[9px] uppercase px-3 py-1 transition-colors"
                                >
                                  <Plus size={10} />
                                  <span>ZAPISZ</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-[11px] text-[#9ca3af] leading-relaxed">{r.description}</p>
                            <div className="text-[10px] text-[#6b7280] truncate font-mono">{r.url}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources Grounding links */}
                  {discoverResult.sources && discoverResult.sources.length > 0 && (
                    <div className="pt-2 border-t border-[#1f2937]/50 select-none">
                      <span className="text-[9px] text-[#6b7280] font-bold uppercase tracking-wider block mb-1">ŹRÓDŁA WYSZUKIWANIA (GROUNDING SOURCES):</span>
                      <div className="flex flex-wrap gap-2">
                        {discoverResult.sources.map((src: string, idx: number) => (
                          <a
                            key={idx}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-mono text-[#9ca3af] hover:text-[#ffffff] bg-[#11131a] border border-[#1f2937] px-2 py-0.5 truncate max-w-xs"
                          >
                            [{idx + 1}] {src.replace(/https?:\/\/(www\.)?/, '')}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB 3: Resources Database */}
          {activeSubTab === 'resources' && (
            <div className="space-y-4 select-text">
              {resources.length === 0 ? (
                <div className="py-16 text-center text-[#6b7280] font-mono uppercase select-none">
                  Brak zapisanych przewodników lub zasobów.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((r) => (
                    <div key={r.id} className="bg-[#11131a] border border-[#1f2937] p-3 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2 select-none">
                          <span className="inline-block text-[8px] bg-[#d4a574]/10 border border-[#d4a574]/30 text-[#d4a574] px-1.5 py-0.2 font-mono uppercase font-bold">
                            {r.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(r.id)}
                            className="p-1 bg-[#0b0d12] border border-[#1f2937] text-[#6b7280] hover:text-[#ef4444] hover:border-[#ef4444] transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        <h5 className="text-xs font-bold text-[#ffffff]">{r.title}</h5>
                        <p className="text-[11px] text-[#9ca3af] leading-relaxed">{r.description}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1f2937]/50 select-none">
                        <div className="text-[9px] font-mono text-[#6b7280] truncate max-w-[140px] md:max-w-[200px]" title={r.url}>
                          {r.url}
                        </div>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 py-1 px-3 bg-[#181b22] text-[#d4a574] border border-[#1f2937] hover:border-[#d4a574] font-mono font-bold text-[9px] uppercase transition-colors shrink-0"
                        >
                          <ExternalLink size={10} />
                          <span>OTWÓRZ LINK</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* --- MODAL 1: Create / Edit Prompt --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d12]/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#11131a] border border-[#2a3140] w-full max-w-lg flex flex-col shadow-2xl">
            <div className="bg-[#181b22] border-b border-[#1f2937] px-4 py-2.5 flex items-center justify-between">
              <span className="font-mono font-bold text-[#ffffff] text-xs uppercase tracking-wider">
                {editingPrompt ? 'EDYCJA PROMPTU' : 'NOWY PROMPT W BIBLIOTECE'}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9ca3af] hover:text-[#ffffff] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSavePrompt} className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">TYTUŁ PROMPTU / NAZWA</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="np. Hyper-Detailed Cyberpunk Portrait"
                  className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-sans text-xs p-1.5 outline-none focus:border-[#d4a574]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">KATEGORIA MODELU</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-mono text-[11px] p-1.5 outline-none focus:border-[#d4a574]"
                >
                  <option value="FLUX / SDXL">FLUX / SDXL</option>
                  <option value="Midjourney">Midjourney</option>
                  <option value="GPT-4">GPT-4 (Text)</option>
                  <option value="Claude">Claude (Text)</option>
                  <option value="Gemini">Gemini (Text/Multimodal)</option>
                  <option value="DALL-E">DALL-E 3</option>
                  <option value="Other">Inny / Inne</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">TREŚĆ PROMPTU</label>
                <textarea
                  rows={5}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tutaj wklej całą treść promptu..."
                  className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-mono text-xs p-2 outline-none focus:border-[#d4a574] resize-none select-text"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">TAGI (ODDZIELONE PRZECINKIEM)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="np. art, illustration, photorealistic"
                  className="w-full bg-[#0b0d12] border border-[#1f2937] text-[#ffffff] font-sans text-xs p-1.5 outline-none focus:border-[#d4a574]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-[#181b22] hover:bg-[#1f232b] text-[#9ca3af] hover:text-[#ffffff] border border-[#1f2937] font-mono font-bold text-xs uppercase px-4 py-1.5 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-xs uppercase px-5 py-1.5 transition-colors"
                >
                  {editingPrompt ? 'ZAPISZ ZMIANY' : 'UTWÓRZ PROMPT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: User Guide / Pomoc --- */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0d12]/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-[#11131a] border border-[#2a3140] w-full max-w-lg flex flex-col shadow-2xl max-h-[85vh]">
            <div className="bg-[#181b22] border-b border-[#1f2937] px-4 py-2.5 flex items-center justify-between">
              <span className="font-mono font-bold text-[#ffffff] text-xs uppercase tracking-wider">
                PORADNIK INŻYNIERII PROMPTÓW / POMOC
              </span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-[#9ca3af] hover:text-[#ffffff] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto text-xs text-[#d4d4d8] leading-relaxed select-text">
              <div className="space-y-1.5">
                <h5 className="font-bold text-[#ffffff] text-xs uppercase tracking-wide border-b border-[#1f2937] pb-1">
                  1. JAK SKUTECZNIE PROMPTOWAĆ FLUX & SDXL?
                </h5>
                <p>
                  Modele nowej generacji takie jak <strong>FLUX.1 (Schnell, Dev)</strong> świetnie rozumieją naturalny, opisowy język (tzw. "natural prose"). 
                  Zamiast pisać losowe pojedyncze tagi (np. "beautiful, detailed, 8k"), opisz całą scenę logicznym zdaniem inżynieryjnym, określając stylizację, detale i otoczenie (np. <i>"A cinematic photograph of... with warm sun flares..."</i>).
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-[#ffffff] text-xs uppercase tracking-wide border-b border-[#1f2937] pb-1">
                  2. JAK DZIAŁA AGENT AI (ODKRYWANIA)?
                </h5>
                <p>
                  Przycisk <strong>"Odkrywaj (AI Agent)"</strong> na lewym panelu łączy się bezpośrednio z modelem Google Gemini i posiada funkcję <strong>Google Search Grounding</strong>. 
                  Dzięki temu model przeszukuje w czasie rzeczywistym aktualne trendy, najnowsze przewodniki z reddita/discorda i repozytoria kodu, zwracając najbardziej dopasowane prompty i odnośniki z internetu.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-[#ffffff] text-xs uppercase tracking-wide border-b border-[#1f2937] pb-1">
                  3. KOPIOWANIE I INTEGRACJA STYLÓW
                </h5>
                <p>
                  Gdy znajdziesz lub zapiszesz interesujący Cię prompt, kliknij przycisk <strong>[KOPIUJ]</strong> na karcie promptu. 
                  Możesz go natychmiast wkleić do pola tekstowego w zakładkach generowania lub modyfikować, budując bogatsze sceny i łącząc z artystami.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end border-t border-[#1f2937]">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-xs uppercase px-5 py-1.5 transition-colors select-none"
                >
                  ROZUMIEM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Toast System Feedback --- */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-[#0b0d12] font-mono font-extrabold text-[10px] tracking-wider uppercase px-4 py-2 border border-[#059669] shadow-2xl animate-fade-in select-none">
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default PromptLibraryTab;