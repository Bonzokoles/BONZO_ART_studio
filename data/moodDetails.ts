// Mood & Details Library — klikalne kafelki, które dodają frazy do promptu.
// Struktura: kategorie -> frazy. Każda fraza to gotowy fragment promptu.
// Użytkownik może dodawać własne frazy (localStorage), Gemini porządkuje kategorie.

export interface MoodCategory {
  id: string;
  label: string;        // PL etykieta kategorii
  hint: string;         // krótki opis do czego służy
  phrases: string[];    // gotowe fragmenty promptu (EN)
}

export interface MoodDetail {
  id: string;
  categoryId: string;
  phrase: string;
  source: 'seed' | 'user' | 'gemini';
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    id: 'precision',
    label: 'Precyzja / Technical',
    hint: 'rysunek techniczny, schematy, CAD',
    phrases: [
      'technical drawing',
      'blueprint',
      'schematic',
      'line art',
      'wireframe',
      'cad drawing',
      'drafting',
      'ink on vellum',
    ],
  },
  {
    id: 'painting',
    label: 'Malarstwo / Mixed Media',
    hint: 'techniki malarskie, faktury, plamy',
    phrases: [
      'watercolor wash',
      'acrylic stains',
      'ink blots',
      'paint splatters',
      'pigment bleeding',
      'wet-on-wet',
      'mixed media',
      'abstract expressionism',
    ],
  },
  {
    id: 'background',
    label: 'Tło / Backdrop',
    hint: 'czyste tło, przestrzeń, faktura papieru',
    phrases: [
      'isolated on clean white background',
      'minimalist void',
      'textured art paper',
      'studio backdrop',
      'soft gradient background',
    ],
  },
  {
    id: 'lighting',
    label: 'Oświetlenie / Lighting',
    hint: 'światło, klimat, atmosfera',
    phrases: [
      'golden hour lighting',
      'cinematic rim light',
      'soft diffused light',
      'dramatic volumetric shadows',
      'neon glow',
      'moody low-key lighting',
    ],
  },
  {
    id: 'render',
    label: 'Render / Quality',
    hint: 'jakość renderu, styl wykończenia',
    phrases: [
      'octane render',
      'unreal engine 5',
      '8k ultra detailed',
      'photorealistic',
      'hyper-detailed',
      'cinematic 35mm',
    ],
  },
];

// localStorage key
export const MOOD_STORAGE_KEY = 'bonzo-studio-mood-details';

// seed: flat list from categories (dla łatwego importu do localStorage)
export const SEED_MOOD_DETAILS: MoodDetail[] = MOOD_CATEGORIES.flatMap((cat) =>
  cat.phrases.map((phrase, i) => ({
    id: `${cat.id}-${i}`,
    categoryId: cat.id,
    phrase,
    source: 'seed' as const,
  }))
);

// Ładowanie z localStorage (merge seed + user/gemini dodatki)
export const loadMoodDetails = (): MoodDetail[] => {
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MoodDetail[];
      // merge: seed zawsze obecne + user dodane
      const userOnes = parsed.filter((d) => d.source !== 'seed');
      return [...SEED_MOOD_DETAILS, ...userOnes];
    }
  } catch (e) {
    // ignore corrupt storage
  }
  return SEED_MOOD_DETAILS;
};

export const saveMoodDetails = (details: MoodDetail[]) => {
  try {
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(details));
  } catch (e) {
    // storage full / unavailable — ignore
  }
};
