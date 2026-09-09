import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Plus, Wand2, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  MOOD_CATEGORIES,
  loadMoodDetails,
  saveMoodDetails,
  type MoodDetail,
} from '../data/moodDetails';
import { organizeMoodLibrary } from '../services/geminiService';

interface MoodDetailsLibraryProps {
  onAppendPrompt: (text: string) => void;
}

export const MoodDetailsLibrary: React.FC<MoodDetailsLibraryProps> = ({ onAppendPrompt }) => {
  const [details, setDetails] = useState<MoodDetail[]>([]);
  const [expandedCat, setExpandedCat] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string>(MOOD_CATEGORIES[0].id);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeMsg, setOrganizeMsg] = useState<string | null>(null);

  useEffect(() => {
    setDetails(loadMoodDetails());
  }, []);

  const persist = (next: MoodDetail[]) => {
    setDetails(next);
    saveMoodDetails(next);
  };

  const handleAddPhrase = () => {
    const trimmed = newPhrase.trim();
    if (!trimmed) return;
    const newDetail: MoodDetail = {
      id: `user-${Date.now()}`,
      categoryId: newCategoryId,
      phrase: trimmed,
      source: 'user',
    };
    persist([...details, newDetail]);
    setNewPhrase('');
    setShowAdd(false);
  };

  const handleRemove = (id: string) => {
    persist(details.filter((d) => d.id !== id));
  };

  const handleOrganize = async () => {
    setIsOrganizing(true);
    setOrganizeMsg(null);
    try {
      const userDetails = details.filter((d) => d.source !== 'seed');
      if (userDetails.length === 0) {
        setOrganizeMsg('BRAK WŁASNYCH FRAZ DO UPORZĄDKOWANIA');
        setIsOrganizing(false);
        return;
      }
      const existingCats = MOOD_CATEGORIES.map((c) => c.id);
      const result = await organizeMoodLibrary(
        userDetails.map((d) => ({ id: d.id, phrase: d.phrase })),
        existingCats
      );
      const assigned = new Map(result.assignments.map((a) => [a.id, a.categoryId]));
      const next = details.map((d) => {
        const cat = assigned.get(d.id);
        if (cat && cat !== '_new') {
          return { ...d, categoryId: cat };
        }
        return d;
      });
      persist(next);
      setOrganizeMsg(`UPORZĄDKOWANO: ${result.assignments.length} FRAZ`);
    } catch (err: any) {
      setOrganizeMsg('BŁĄD: ' + (err.message || 'nie udało się uporządkować'));
    } finally {
      setIsOrganizing(false);
      setTimeout(() => setOrganizeMsg(null), 4000);
    }
  };

  const grouped = useMemo(() => {
    return MOOD_CATEGORIES.map((cat) => ({
      ...cat,
      items: details.filter((d) => d.categoryId === cat.id),
    }));
  }, [details]);

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[#ffffff] uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
          <Wand2 size={13} className="text-[#d4a574]" />
          <span>MOOD & DETAILS</span>
        </span>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="p-1 bg-[#0b0d12] border border-[#1f2937] text-[#9ca3af] hover:text-[#ffffff] hover:border-[#d4a574] transition-colors"
            title="Dodaj własną frazę"
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            onClick={handleOrganize}
            disabled={isOrganizing}
            className="flex items-center space-x-1 px-1.5 py-1 bg-[#0b0d12] border border-[#1f2937] text-[#9ca3af] hover:text-[#d4a574] hover:border-[#d4a574] transition-colors disabled:opacity-50"
            title="Niech Gemini uporządkuje kategorie"
          >
            <Sparkles size={11} className={isOrganizing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {organizeMsg && (
        <div className="text-[9px] font-mono font-bold uppercase px-2 py-1 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
          {organizeMsg}
        </div>
      )}

      {showAdd && (
        <div className="space-y-1.5 p-2 bg-[#0b0d12] border border-[#1f2937]">
          <input
            type="text"
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPhrase())}
            placeholder="np. chalk on blackboard"
            className="w-full bg-[#11131a] border border-[#1f2937] text-[#ffffff] font-sans text-[10px] p-1.5 outline-none focus:border-[#d4a574]"
          />
          <div className="flex items-center justify-between gap-1">
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="bg-[#11131a] border border-[#1f2937] text-[#ffffff] font-mono text-[10px] p-1 outline-none focus:border-[#d4a574]"
            >
              {MOOD_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddPhrase}
              className="flex items-center space-x-1 bg-[#d4a574] hover:bg-[#1f232b] text-[#0b0d12] hover:text-[#d4a574] border border-[#d4a574] font-mono font-bold text-[9px] uppercase px-2 py-1 transition-colors"
            >
              <Plus size={10} />
              <span>Dodaj</span>
            </button>
          </div>
        </div>
      )}

      {grouped.map((cat) => {
        const isExpanded = expandedCat[cat.id] ?? false;
        return (
          <div key={cat.id} className="border border-[#1f2937] bg-[#0b0d12]">
            <button
              type="button"
              onClick={() => setExpandedCat((prev) => ({ ...prev, [cat.id]: !isExpanded }))}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#141720] transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-[#9ca3af] flex items-center space-x-1">
                <span className="text-[#d4a574] font-mono">{cat.items.length}</span>
                <span>{cat.label}</span>
              </span>
              {isExpanded ? <ChevronUp size={12} className="text-[#6b7280]" /> : <ChevronDown size={12} className="text-[#6b7280]" />}
            </button>

            {isExpanded && (
              <div className="px-2 pb-2 flex flex-wrap gap-1">
                {cat.items.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onAppendPrompt(d.phrase)}
                    className="group relative flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 bg-[#181b22] border border-[#1f2937] text-[#d4d4d8] hover:border-[#d4a574] hover:text-[#ffffff] transition-colors"
                    title={`Dodaj "${d.phrase}" do promptu`}
                  >
                    <span>{d.phrase}</span>
                    {d.source !== 'seed' && (
                      <X
                        size={9}
                        className="text-[#6b7280] hover:text-[#ef4444]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(d.id);
                        }}
                      />
                    )}
                  </button>
                ))}
                {cat.items.length === 0 && (
                  <span className="text-[9px] text-[#6b7280] italic">brak fraz</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
