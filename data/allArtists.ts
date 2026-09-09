import { ARTIST_REGISTRY, Artist } from './artistsData';
import { CHEAT_SHEET_ARTISTS } from './cheatSheetData';

// Cheat-sheet artists carry extra runtime fields not present on the base Artist type.
type ExtendedArtist = Artist & {
  born?: string;
  death?: string;
  checkpoint?: string;
  nPrompt?: string;
};

// Map Cheat Sheet artists to the standard Artist structure,
// then merge with the primary ARTIST_REGISTRY (dedup by name).
// This is the single source of truth for artist lookup across
// the main window and the dedicated Wildcards popup — both must
// resolve the same artist IDs, otherwise cross-window "add to prompt"
// silently fails for cheat-sheet artists.
const mappedCheatSheet: ExtendedArtist[] = CHEAT_SHEET_ARTISTS.map((a: any) => {
  const cats = (a.Category || 'illustration')
    .split(',')
    .map((c: string) => c.trim().toLowerCase());

  const finalCategories: string[] = [];
  cats.forEach((c: string) => {
    if (c.includes('anime')) finalCategories.push('anime');
    else if (c.includes('manga')) finalCategories.push('manga');
    else if (c.includes('photography') || c.includes('photo')) finalCategories.push('photography');
    else if (c.includes('scifi') || c.includes('sci-fi')) finalCategories.push('scifi');
    else if (c.includes('realistic') || c.includes('realism')) finalCategories.push('realistic');
    else if (c.includes('surreal')) finalCategories.push('surreal');
    else if (c.includes('fantasy')) finalCategories.push('fantasy');
    else if (c.includes('landscape')) finalCategories.push('landscape');
    else if (c.includes('impressionist') || c.includes('impressionism')) finalCategories.push('impressionist');
    else if (c.includes('abstract')) finalCategories.push('abstract');
    else if (c.includes('comic')) finalCategories.push('comic');
    else if (c.includes('cinematic')) finalCategories.push('cinematic');
    else if (c.includes('dark') || c.includes('horror') || c.includes('gothic')) finalCategories.push('dark');
    else if (c.includes('technical') || c.includes('blueprint') || c.includes('drawing')) finalCategories.push('technical');
    else if (c.includes('concept')) finalCategories.push('conceptart');
    else if (c.includes('illustration') || c.includes('drawing')) finalCategories.push('illustration');
  });

  if (finalCategories.length === 0) {
    finalCategories.push('illustration');
  }

  const id = a.Name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    id,
    name: a.Name,
    categories: finalCategories,
    promptPrefix: `style of ${a.Name}`,
    description: a.Extrainfo || `Aesthetic category: ${a.Category}. Tested on ${a.Checkpoint || 'SD model'}.`,
    knownFor: a.Category || 'Visual arts',
    imageSlot: `/img/${a.Image}`,
    born: a.Born || '',
    death: a.Death || '',
    checkpoint: a.Checkpoint || '',
    nPrompt: a.NPrompt || '',
  } as ExtendedArtist;
});

let cached: Artist[] | null = null;

export function getAllArtists(): Artist[] {
  if (cached) return cached;

  const mergedArtists: Artist[] = [...ARTIST_REGISTRY];
  mappedCheatSheet.forEach((cheatArtist) => {
    const exists = mergedArtists.some(
      (a) => a.name.toLowerCase() === cheatArtist.name.toLowerCase()
    );
    if (!exists) {
      mergedArtists.push(cheatArtist);
    } else {
      const idx = mergedArtists.findIndex(
        (a) => a.name.toLowerCase() === cheatArtist.name.toLowerCase()
      );
      if (idx !== -1) {
        if (!mergedArtists[idx].imageSlot) {
          mergedArtists[idx].imageSlot = cheatArtist.imageSlot;
        }
        (mergedArtists[idx] as any).born = cheatArtist.born;
        (mergedArtists[idx] as any).death = cheatArtist.death;
        (mergedArtists[idx] as any).checkpoint = cheatArtist.checkpoint;
        (mergedArtists[idx] as any).nPrompt = cheatArtist.nPrompt;
      }
    }
  });

  cached = mergedArtists;
  return cached;
}

export function findArtistById(id: string): Artist | undefined {
  return getAllArtists().find((a) => a.id === id);
}
