import { ARTIST_REGISTRY } from './data/artistsData';
import { CHEAT_SHEET_ARTISTS } from './data/cheatSheetData';
import fs from 'fs';
import path from 'path';

console.log("[MIGRATION INITIATED] Processing TypeScript data files...");

try {
  // Merge the primary and fallback (cheatsheet) registries
  const merged = [...ARTIST_REGISTRY, ...CHEAT_SHEET_ARTISTS];
  
  // Deduplicate and structure
  const db = new Map<string, any>();
  merged.forEach(artist => {
     const key: string = (artist as any).id ?? (artist as any).Name ?? String(artist);
     if (!db.has(key)) {
         db.set(key, artist);
     }
  });
  
  const artistsList = Array.from(db.values());
  const outputPath = path.join(process.cwd(), 'public', 'data');
  const outputFile = path.join(outputPath, 'artistsDB.json');

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Export JSON
  fs.writeFileSync(outputFile, JSON.stringify(artistsList, null, 2));
  console.log(`[MIGRATION SUCCESS] Combined ${artistsList.length} artists.`);
  console.log(`[FILE WRITTEN] Saved JSON Database at: ${outputFile}`);
} catch (e) {
  console.error("[MIGRATION ERROR] Could not read TS files or save JSON:", e);
}
