// ═══════════════════════════════════════════════
// ARTIST REGISTRY — EXTENSIBLE
// ═══════════════════════════════════════════════
// To add a new artist:
//   1. Add an entry to the appropriate array below
//   2. If adding a new category, also add to CATEGORIES[] above
//   3. imageSlot: null = auto-generated placeholder
//       imageSlot: "data:image/..." = real thumbnail
//   4. No other changes needed — filters, search, and UI auto-update
// ═══════════════════════════════════════════════

import type { ProviderId, AspectRatio } from '../types';

export interface SavedStylePreset {
  id: string;
  name: string;
  prompt: string;
  negativePrompt?: string;
  provider: ProviderId;
  model: string;
  aspectRatio: AspectRatio;
  seed?: number;
  tags: string[];
  previewImage?: string;
  timestamp: string;
}

export interface PromptTemplate {
  name: string;
  template: string;
  placeholders: string[];
}

export interface CategoryItem {
  id: string;
  label: string;
  color: string;
}

export interface Artist {
  id: string;
  name: string;
  categories: string[];
  promptPrefix: string;
  description: string;
  knownFor: string;
  imageSlot: string | null;
  // Backward compatibility fields
  category?: string;
  styles?: string[];
}

// ── CATEGORY REGISTRY ──
// To add a new category: push to CATEGORIES, add entries to ARTIST_REGISTRY
export const CATEGORIES: CategoryItem[] = [
  { id: "anime", label: "Anime", color: "#f472b6" },
  { id: "manga", label: "Manga", color: "#e879f9" },
  { id: "realistic", label: "Realistic", color: "#34d399" },
  { id: "surreal", label: "Surreal", color: "#a78bfa" },
  { id: "fantasy", label: "Fantasy", color: "#fbbf24" },
  { id: "landscape", label: "Landscape", color: "#60a5fa" },
  { id: "scifi", label: "Sci-Fi", color: "#22d3ee" },
  { id: "impressionist", label: "Impressionist", color: "#fb923c" },
  { id: "abstract", label: "Abstract", color: "#f87171" },
  { id: "comic", label: "Comic", color: "#ff6b6b" },
  { id: "cinematic", label: "Cinematic", color: "#f59e0b" },
  { id: "dark", label: "Dark / Horror", color: "#6b7280" },
  // ── NEW CATEGORIES ──
  { id: "technical", label: "Technical Drawing", color: "#06b6d4" },
  { id: "photography", label: "Photography", color: "#84cc16" },
  { id: "conceptart", label: "Concept Art", color: "#f97316" },
  { id: "illustration", label: "Illustration", color: "#ec4899" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  anime: "#f472b6",
  manga: "#e879f9",
  realistic: "#34d399",
  surreal: "#a78bfa",
  fantasy: "#fbbf24",
  landscape: "#60a5fa",
  scifi: "#22d3ee",
  impressionist: "#fb923c",
  abstract: "#f87171",
  comic: "#ff6b6b",
  cinematic: "#f59e0b",
  dark: "#6b7280",
  technical: "#06b6d4",
  photography: "#84cc16",
  conceptart: "#f97316",
  illustration: "#ec4899",
};

export const CATEGORY_MODIFIERS: Record<string, string> = {
  technical: ", blueprint aesthetic, clean lines, annotations, technical precision, orthographic view, schematic",
  dark: ", dark atmosphere, moody lighting, horror aesthetic, high contrast, unsettling mood, gothic",
  comic: ", comic book art style, bold outlines, halftone dots, graphic composition, panel layout",
  scifi: ", science fiction, futuristic, advanced technology, metallic surfaces, atmospheric lighting",
  cinematic: ", cinematic composition, film grain, anamorphic lens, dramatic lighting, 8K",
  conceptart: ", concept art, keyframe painting, professional design, AAA quality",
  photography: ", photographic, photorealistic, 85mm lens, f/1.8, sharp focus, professional photography",
  illustration: ", illustrated, detailed illustration, book illustration, editorial art style",
};

// ── 3a. HORROR ARTISTS ──
export const HORROR_ARTISTS: Artist[] = [
  {
    id: "clive-barker",
    name: "Clive Barker",
    categories: ["dark", "illustration"],
    promptPrefix: "in the style of Clive Barker, visceral body horror, elaborate hellscapes, leather and flesh textures, grotesque beauty, dark fantasy",
    description: "Visceral body horror, elaborate hellscapes, grotesque beauty blending pain and pleasure",
    knownFor: "Hellraiser, Books of Blood",
    imageSlot: null,
  },
  {
    id: "stephen-gammell",
    name: "Stephen Gammell",
    categories: ["dark", "illustration"],
    promptPrefix: "in the style of Stephen Gammell, ink wash, splatter textures, ghostly apparitions, black and white horror, dissolving forms",
    description: "Ink wash and splatter textures, ghostly apparitions dissolving into shadows",
    knownFor: "Scary Stories to Tell in the Dark",
    imageSlot: null,
  },
  {
    id: "bernie-wrightson",
    name: "Bernie Wrightson",
    categories: ["dark", "comic"],
    promptPrefix: "in the style of Bernie Wrightson, intricate ink crosshatching, gothic horror, decaying mansions, detailed monster designs, Victorian atmosphere",
    description: "Master of ink crosshatching, gothic horror, decaying Victorian mansions",
    knownFor: "Frankenstein illustrated edition, Swamp Thing",
    imageSlot: null,
  },
  {
    id: "richard-corben",
    name: "Richard Corben",
    categories: ["dark", "comic"],
    promptPrefix: "in the style of Richard Corben, airbrushed horror, grotesque muscular figures, lurid colors, underground comix aesthetic, body mutation",
    description: "Airbrushed horror, grotesque muscular figures, lurid saturated colors",
    knownFor: "Den, Heavy Metal magazine",
    imageSlot: null,
  },
  {
    id: "todd-mcfarlane",
    name: "Todd McFarlane",
    categories: ["dark", "comic"],
    promptPrefix: "in the style of Todd McFarlane, twisted cape designs, intricate webbing, distorted anatomy, dramatic shadows, anti-hero aesthetics",
    description: "Twisted cape designs, intricate webbing, distorted anatomy, anti-hero gothic",
    knownFor: "Spawn, Spider-Man",
    imageSlot: null,
  },
  {
    id: "wayne-barlowe",
    name: "Wayne Barlowe",
    categories: ["dark", "fantasy", "scifi"],
    promptPrefix: "in the style of Wayne Barlowe, alien hellscapes, grotesque demonic anatomies, detailed creature design, otherworldly ecosystems, dark surrealism",
    description: "Alien hellscapes, grotesque demonic anatomies, otherworldly creature ecosystems",
    knownFor: "Barlowe's Inferno, Avatar creature design",
    imageSlot: null,
  },
  {
    id: "chris-cold",
    name: "Chris Cold",
    categories: ["dark", "realistic"],
    promptPrefix: "in the style of Chris Cold, modern horror realism, uncanny valley faces, desaturated cold palette, suburban dread, haunting atmosphere",
    description: "Modern horror realism, uncanny valley faces, suburban dread in desaturated cold tones",
    knownFor: "Contemporary digital horror art",
    imageSlot: null,
  },
  {
    id: "miles-johnston",
    name: "Miles Johnston",
    categories: ["dark", "surreal"],
    promptPrefix: "in the style of Miles Johnston, graphite surrealism, faces merging and distorting, psychological horror, body dysmorphia themes, haunting pencil detail",
    description: "Graphite surrealism, faces merging and distorting, psychological body horror",
    knownFor: "Surreal graphite portraits",
    imageSlot: null,
  },
];

// ── 3b. COMIC BOOK ARTISTS ──
export const COMIC_ARTISTS: Artist[] = [
  {
    id: "alex-ross",
    name: "Alex Ross",
    categories: ["comic", "realistic"],
    promptPrefix: "in the style of Alex Ross, photorealistic gouache painting, heroic poses, dramatic lighting, classic superhero iconography, Norman Rockwell meets DC Comics",
    description: "Photorealistic gouache, heroic Superman-level lighting, classic superhero iconography",
    knownFor: "Kingdom Come, Marvels",
    imageSlot: null,
  },
  {
    id: "john-romita-jr",
    name: "John Romita Jr.",
    categories: ["comic"],
    promptPrefix: "in the style of John Romita Jr., bold thick outlines, blocky square-jawed faces, dynamic urban action, heavy shadows, classic Marvel style",
    description: "Bold thick outlines, blocky square-jawed heroes, dynamic urban street action",
    knownFor: "Spider-Man, Kick-Ass, Daredevil",
    imageSlot: null,
  },
  {
    id: "geoff-darrow",
    name: "Geoff Darrow",
    categories: ["comic", "scifi"],
    promptPrefix: "in the style of Geoff Darrow, insanely detailed line art, massive crowd scenes, intricate mechanical designs, Where's Waldo levels of detail, French BD influence",
    description: "Insanely detailed line art, massive crowd scenes, intricate mechanical precision",
    knownFor: "Hard Boiled, The Matrix concept art",
    imageSlot: null,
  },
  {
    id: "bill-sienkiewicz",
    name: "Bill Sienkiewicz",
    categories: ["comic", "abstract"],
    promptPrefix: "in the style of Bill Sienkiewicz, mixed media collage, expressionist paint splatter, abstract comic art, scratchy ink lines, painted textures on comic panels",
    description: "Mixed media collage, expressionist paint splatters on comic panels",
    knownFor: "Elektra: Assassin, New Mutants",
    imageSlot: null,
  },
  {
    id: "david-mazzucchelli",
    name: "David Mazzucchelli",
    categories: ["comic"],
    promptPrefix: "in the style of David Mazzucchelli, clean noir linework, stark shadows, graphic storytelling, limited color palette, pulp detective aesthetic",
    description: "Clean noir linework, stark shadows, graphic storytelling, pulp detective mood",
    knownFor: "Batman: Year One, Daredevil: Born Again",
    imageSlot: null,
  },
  {
    id: "dave-gibbons",
    name: "Dave Gibbons",
    categories: ["comic", "scifi"],
    promptPrefix: "in the style of Dave Gibbons, precise grid layouts, clean British comic line art, detailed backgrounds, nine-panel grid, realistic proportions",
    description: "Precise grid layouts, clean British line art, detailed nine-panel compositions",
    knownFor: "Watchmen, Green Lantern",
    imageSlot: null,
  },
  {
    id: "james-jean",
    name: "James Jean",
    categories: ["comic", "surreal", "illustration"],
    promptPrefix: "in the style of James Jean, ethereal dreamlike illustration, delicate linework, flowing organic forms, pastel and muted palettes, Art Nouveau influence",
    description: "Ethereal dreamlike illustration, delicate linework, Art Nouveau meets manga",
    knownFor: "Fables covers, Prada campaigns",
    imageSlot: null,
  },
  {
    id: "fiona-staples",
    name: "Fiona Staples",
    categories: ["comic", "scifi"],
    promptPrefix: "in the style of Fiona Staples, digital painted comics, expressive character faces, vibrant sci-fi colors, emotional depth, Saga aesthetic",
    description: "Digital painted comics, expressive faces, vibrant sci-fi colors, emotional depth",
    knownFor: "Saga",
    imageSlot: null,
  },
  {
    id: "frank-miller",
    name: "Frank Miller",
    categories: ["comic", "dark"],
    promptPrefix: "in the style of Frank Miller, high-contrast black and white, heavy inks, film noir aesthetic, rain-soaked streets, gritty urban textures",
    description: "High-contrast noir ink silhouettes, rain-soaked streets and gritty urban heroism",
    knownFor: "Sin City, The Dark Knight Returns",
    imageSlot: null,
  },
  {
    id: "mike-mignola",
    name: "Mike Mignola",
    categories: ["comic", "dark"],
    promptPrefix: "in the style of Mike Mignola, heavy black shadows, angular geometric compositions, occult themes, limited color palette, folklore horror",
    description: "Heavy geometric black shadows, occult folklore themes, minimalist graphic color",
    knownFor: "Hellboy, B.P.R.D.",
    imageSlot: null,
  },
  {
    id: "dave-mckean",
    name: "Dave McKean",
    categories: ["dark", "comic", "illustration"],
    promptPrefix: "in the style of Dave McKean, mixed media collage, distressed textures, photographic elements, dark surrealism, scratchy typography",
    description: "Mixed media collage, distressed photographic textures, dark psychological surrealism",
    knownFor: "Sandman covers, Arkham Asylum",
    imageSlot: null,
  },
  {
    id: "ashley-wood",
    name: "Ashley Wood",
    categories: ["comic", "dark"],
    promptPrefix: "in the style of Ashley Wood, loose expressive oil painting, muted earth tones, abstracted figures, combat scenes, distressed canvas texture",
    description: "Loose expressive oil brushwork, muted military tones, distressed industrial canvas",
    knownFor: "Metal Gear Solid art, Popbot",
    imageSlot: null,
  },
  {
    id: "jim-lee",
    name: "Jim Lee",
    categories: ["comic", "manga"],
    promptPrefix: "in the style of Jim Lee, dynamic superhero poses, detailed cross-hatching, bold ink lines, dramatic foreshortening, heroic proportions",
    description: "Dynamic superhero poses, detailed cross-hatching, heroic anatomy and foreshortening",
    knownFor: "X-Men, Batman: Hush",
    imageSlot: null,
  },
  {
    id: "banksy",
    name: "Banksy",
    categories: ["comic", "illustration"],
    promptPrefix: "in the style of Banksy, stencil graffiti, satirical political commentary, black and white with one accent color, urban walls, rats and children",
    description: "Iconic stencil graffiti, satirical urban activism, high-contrast monochrome with single accents",
    knownFor: "Girl with Balloon, Dismaland",
    imageSlot: null,
  },
];

// ── 3c. SCI-FI ARTISTS ──
export const SCIFI_ARTISTS: Artist[] = [
  {
    id: "masamune-shirow",
    name: "Masamune Shirow",
    categories: ["scifi", "manga"],
    promptPrefix: "in the style of Masamune Shirow, detailed mecha designs, cybernetic enhancements, dense technical annotations, cyberpunk cityscapes, tactical gear",
    description: "Detailed mecha and cybernetic designs with dense technical annotations and cyberpunk atmosphere",
    knownFor: "Ghost in the Shell, Appleseed",
    imageSlot: null,
  },
  {
    id: "katsuhiro-otomo",
    name: "Katsuhiro Otomo",
    categories: ["scifi", "anime", "dark"],
    promptPrefix: "in the style of Katsuhiro Otomo, detailed dystopian cityscapes, realistic proportions, explosive destruction, cyberpunk aesthetic, hand-drawn mechanical precision",
    description: "Detailed dystopian cityscapes, explosive destruction, hand-drawn mechanical precision",
    knownFor: "Akira, Steamboy",
    imageSlot: null,
  },
  {
    id: "john-harris",
    name: "John Harris",
    categories: ["scifi", "landscape"],
    promptPrefix: "in the style of John Harris, vast epic spacescapes, glowing engine trails, monumental scale, painterly sci-fi, tiny ships against massive structures",
    description: "Vast epic spacescapes, monumental scale, tiny ships against massive glowing structures",
    knownFor: "Sci-fi book covers, Ender's Game",
    imageSlot: null,
  },
  {
    id: "sparth",
    name: "Sparth (Nicolas Bouvier)",
    categories: ["scifi", "conceptart"],
    promptPrefix: "in the style of Sparth, bold geometric brushstrokes, angular sci-fi architecture, atmospheric haze, limited color palettes, concept art compositions",
    description: "Bold geometric brushstrokes, angular sci-fi architecture, atmospheric haze",
    knownFor: "Halo 5, RAGE",
    imageSlot: null,
  },
  {
    id: "ian-mcque",
    name: "Ian McQue",
    categories: ["scifi", "conceptart"],
    promptPrefix: "in the style of Ian McQue, flying ship junkyards, dieselpunk sky cities, weathered mechanical surfaces, tethered airships, gritty industrial sci-fi",
    description: "Flying ship junkyards, dieselpunk sky cities, weathered industrial sci-fi",
    knownFor: "Mortal Engines, concept art",
    imageSlot: null,
  },
  {
    id: "tsutomu-nihei",
    name: "Tsutomu Nihei",
    categories: ["scifi", "manga", "dark"],
    promptPrefix: "in the style of Tsutomu Nihei, massive brutalist megastructures, biomechanical horror, cyberpunk dystopia, high-contrast black and white, endless vertical spaces",
    description: "Massive brutalist megastructures, biomechanical horror, endless vertical cyberpunk spaces",
    knownFor: "BLAME!, Knights of Sidonia",
    imageSlot: null,
  },
  {
    id: "paul-chadeisson",
    name: "Paul Chadeisson",
    categories: ["scifi", "cinematic"],
    promptPrefix: "in the style of Paul Chadeisson, epic cinematic sci-fi, massive spacecraft, atmospheric lighting, filmic composition, AAA game concept art quality",
    description: "Epic cinematic sci-fi, massive spacecraft with filmic lighting and AAA concept art quality",
    knownFor: "Cyberpunk 2077, cinematic concept art",
    imageSlot: null,
  },
  {
    id: "maciej-kuciara",
    name: "Maciej Kuciara",
    categories: ["scifi", "cinematic", "conceptart"],
    promptPrefix: "in the style of Maciej Kuciara, cinematic keyframe concept art, atmospheric sci-fi, volumetric lighting, photorealistic surfaces, film industry quality",
    description: "Cinematic keyframe concept art, volumetric lighting, photorealistic sci-fi surfaces",
    knownFor: "Guardians of the Galaxy, The Last of Us",
    imageSlot: null,
  },
  {
    id: "syd-mead",
    name: "Syd Mead",
    categories: ["scifi", "technical"],
    promptPrefix: "in the style of Syd Mead, retro-futurism, industrial design aesthetic, polished metallic surfaces, expansive cityscapes, concept art precision",
    description: "Visionary visual futurist of neon cityscapes, sleek hovercrafts, and chrome architecture",
    knownFor: "Blade Runner, Tron, Aliens",
    imageSlot: null,
  },
  {
    id: "simon-stalenhag",
    name: "Simon Stalenhag",
    categories: ["scifi", "landscape", "conceptart"],
    promptPrefix: "in the style of Simon Stalenhag, retro-futuristic Swedish landscapes, massive robots in mundane settings, hazy atmospheric lighting, 1980s nostalgia, desaturated palette",
    description: "Eerie Swedish countryside paired with decaying 1980s robotics and atmospheric realism",
    knownFor: "Tales from the Loop, The Electric State",
    imageSlot: null,
  },
  {
    id: "moebius",
    name: "Moebius (Jean Giraud)",
    categories: ["scifi", "comic", "illustration"],
    promptPrefix: "in the style of Moebius, clean ligne claire linework, surreal desert landscapes, floating structures, pastel color palettes, science fiction western",
    description: "Master of ligne claire linework, surreal crystal deserts, and boundless space fantasy",
    knownFor: "The Incal, Arzach, Dune designs",
    imageSlot: null,
  },
  {
    id: "john-berkey",
    name: "John Berkey",
    categories: ["scifi", "conceptart"],
    promptPrefix: "in the style of John Berkey, loose painterly strokes, massive spacecraft, glowing engine lights, cosmic backgrounds, impressionistic sci-fi",
    description: "Impressionistic space grandeur, massive hulls illuminated by glowing fusion engines",
    knownFor: "Star Wars posters, NASA concept art",
    imageSlot: null,
  },
  {
    id: "chris-foss",
    name: "Chris Foss",
    categories: ["scifi", "conceptart"],
    promptPrefix: "in the style of Chris Foss, massive colorful spacecraft, bold geometric patterns, bright yellow and orange accents, detailed mechanical surfaces",
    description: "Vibrant yellow/checkerboard spaceships, massive megastructures, and 70s sci-fi covers",
    knownFor: "Isaac Asimov book covers, Jodorowsky's Dune",
    imageSlot: null,
  },
  {
    id: "ralph-mcquarrie",
    name: "Ralph McQuarrie",
    categories: ["scifi", "conceptart"],
    promptPrefix: "in the style of Ralph McQuarrie, cinematic concept art, atmospheric lighting, matte painting quality, Star Wars aesthetic, dramatic compositions",
    description: "Definitive space opera matte painter whose concepts shaped Star Wars and Battlestar Galactica",
    knownFor: "Star Wars original trilogy concept art",
    imageSlot: null,
  },
  {
    id: "feng-zhu",
    name: "Feng Zhu",
    categories: ["scifi", "conceptart"],
    promptPrefix: "in the style of Feng Zhu, modern concept art, dynamic mech designs, photobashing technique, environmental storytelling, industrial sci-fi",
    description: "High-speed industrial concept art, dynamic mechanical drafting, AAA game design pipelines",
    knownFor: "FZD School of Design, Star Wars Episode III",
    imageSlot: null,
  },
  {
    id: "beeple",
    name: "Beeple (Mike Winkelmann)",
    categories: ["scifi", "surreal", "conceptart"],
    promptPrefix: "in the style of Beeple, hyper-detailed 3D renders, dystopian sci-fi, saturated colors, political satire, massive scale structures",
    description: "Hyper-detailed dystopian 3D renders, monumental cybernetic ruins, high-energy pop satire",
    knownFor: "Everydays: The First 5000 Days",
    imageSlot: null,
  },
];

// ── 3d. TECHNICAL DRAWING ARTISTS ──
export const TECHNICAL_ARTISTS: Artist[] = [
  {
    id: "leonardo-da-vinci",
    name: "Leonardo da Vinci",
    categories: ["technical", "realistic"],
    promptPrefix: "in the style of Leonardo da Vinci, anatomical sketches, mechanical diagrams, sepia ink on aged paper, cross-hatching, mirror writing annotations, Renaissance engineering",
    description: "Anatomical sketches, mechanical diagrams, sepia ink on aged parchment with mirror-writing annotations",
    knownFor: "Vitruvian Man, Codex Atlanticus",
    imageSlot: null,
  },
  {
    id: "mc-escher",
    name: "M.C. Escher",
    categories: ["technical", "surreal", "abstract"],
    promptPrefix: "in the style of M.C. Escher, impossible geometry, optical illusions, precise lithographic technique, tessellations, mathematical precision, black and white",
    description: "Impossible geometry, optical illusions, tessellations with mathematical precision",
    knownFor: "Relativity, Ascending and Descending",
    imageSlot: null,
  },
  {
    id: "jean-giraud-blueberry",
    name: "Jean Giraud (Blueberry style)",
    categories: ["technical", "comic"],
    promptPrefix: "in the style of Jean Giraud's Blueberry, precise ligne claire western, detailed landscape contours, technical cross-hatching, geological accuracy, realistic desert topography",
    description: "Precise ligne claire western landscapes, geological accuracy, technical cross-hatching",
    knownFor: "Blueberry, detailed landscape art",
    imageSlot: null,
  },
  {
    id: "syd-mead-industrial",
    name: "Syd Mead (Industrial Design)",
    categories: ["technical", "scifi"],
    promptPrefix: "in the style of Syd Mead, industrial design technical illustration, marker on vellum, exploded views, clean mechanical precision, product design aesthetic, labeling callouts",
    description: "Industrial design technical illustration, marker on vellum, exploded mechanical views",
    knownFor: "US Steel, industrial design futurism",
    imageSlot: null,
  },
  {
    id: "david-macaulay",
    name: "David Macaulay",
    categories: ["technical", "illustration"],
    promptPrefix: "in the style of David Macaulay, architectural cutaway illustrations, detailed pen and ink, exploded castle cathedrals, labeled diagrams, educational precision",
    description: "Architectural cutaway illustrations, detailed pen and ink, exploded castle diagrams",
    knownFor: "The Way Things Work, Cathedral",
    imageSlot: null,
  },
  {
    id: "doug-chiang",
    name: "Doug Chiang",
    categories: ["technical", "scifi", "conceptart"],
    promptPrefix: "in the style of Doug Chiang, Star Wars technical design, clean orthographic views, mechanical callouts, vehicle schematics, retro-futuristic blueprint aesthetic",
    description: "Technical orthographic views, mechanical callouts, retro-futuristic blueprint aesthetic",
    knownFor: "Star Wars prequels, Robota",
    imageSlot: null,
  },
  {
    id: "scott-robertson",
    name: "Scott Robertson",
    categories: ["technical", "scifi"],
    promptPrefix: "in the style of Scott Robertson, perspective technical drawing, marker and pencil renderings, vehicle design orthographics, clean line weight, industrial design sketching",
    description: "Perspective technical drawing, marker renderings, clean vehicle design orthographics",
    knownFor: "How to Draw, concept design education",
    imageSlot: null,
  },
  {
    id: "maxfield-parrish",
    name: "Maxfield Parrish",
    categories: ["technical", "landscape", "realistic"],
    promptPrefix: "in the style of Maxfield Parrish, technical glazing technique, luminous blue skies, precise color layering, androgynous figures, idealized classical landscapes",
    description: "Technical glazing technique, luminous layered colors, idealized classical precision",
    knownFor: "Daybreak, Edison Mazda calendar art",
    imageSlot: null,
  },
];

// ── ANIME & MANGA ARTISTS ──
export const ANIME_MANGA_ARTISTS: Artist[] = [
  {
    id: "makoto-shinkai",
    name: "Makoto Shinkai",
    categories: ["anime", "cinematic"],
    promptPrefix: "in the style of Makoto Shinkai, vibrant skies, lens flares, emotional lighting, detailed urban landscapes, cinematic composition",
    description: "Vibrant skies, emotional lens flares, and hyper-detailed photorealistic urban scenery",
    knownFor: "Your Name, Weathering With You, Suzume",
    imageSlot: null,
  },
  {
    id: "hayao-miyazaki",
    name: "Hayao Miyazaki",
    categories: ["anime", "fantasy"],
    promptPrefix: "in the style of Hayao Miyazaki, hand-drawn animation feel, lush natural environments, soft color palette, whimsical details, European-inspired architecture",
    description: "Whimsical hand-painted European landscapes, lush nature, and nostalgic aviation",
    knownFor: "Spirited Away, Princess Mononoke, Totoro",
    imageSlot: null,
  },
  {
    id: "satoshi-kon",
    name: "Satoshi Kon",
    categories: ["anime", "surreal"],
    promptPrefix: "in the style of Satoshi Kon, psychological surrealism, seamless reality-blending transitions, detailed urban settings, film grain texture",
    description: "Psychological surrealism, seamless reality-blending transitions, and rich film grain",
    knownFor: "Perfect Blue, Paprika, Millennium Actress",
    imageSlot: null,
  },
  {
    id: "mamoru-oshii",
    name: "Mamoru Oshii",
    categories: ["anime", "scifi"],
    promptPrefix: "in the style of Mamoru Oshii, philosophical mood, muted color grading, urban stillness, detailed backgrounds, contemplative atmosphere",
    description: "Philosophical cyberpunk stillness, muted neon reflections, and brooding tension",
    knownFor: "Ghost in the Shell, Patlabor 2, Avalon",
    imageSlot: null,
  },
  {
    id: "yoshitaka-amano",
    name: "Yoshitaka Amano",
    categories: ["anime", "fantasy", "illustration"],
    promptPrefix: "in the style of Yoshitaka Amano, ethereal linework, watercolor textures, flowing ornate costumes, gold accents, dreamlike surrealism",
    description: "Ethereal Art Nouveau watercolor linework, flowing silk capes, and delicate fantasy portraits",
    knownFor: "Final Fantasy visual design, Vampire Hunter D",
    imageSlot: null,
  },
  {
    id: "akira-toriyama",
    name: "Akira Toriyama",
    categories: ["anime", "manga", "comic"],
    promptPrefix: "in the style of Akira Toriyama, bold outlines, rounded character designs, vibrant colors, dynamic action poses, mechanical vehicles",
    description: "Bold clean ink lines, energetic martial arts poses, and charming spherical mecha vehicles",
    knownFor: "Dragon Ball, Dr. Slump, Chrono Trigger",
    imageSlot: null,
  },
  {
    id: "junji-ito",
    name: "Junji Ito",
    categories: ["dark", "manga", "illustration"],
    promptPrefix: "in the style of Junji Ito, intricate black-and-white linework, body horror, spiraling patterns, oppressive atmosphere, psychological dread",
    description: "Intricate black-and-white hatching, visceral spiral curses, and psychological cosmic dread",
    knownFor: "Uzumaki, Tomie, Gyo",
    imageSlot: null,
  },
  {
    id: "naoki-urasawa",
    name: "Naoki Urasawa",
    categories: ["manga", "cinematic"],
    promptPrefix: "in the style of Naoki Urasawa, realistic character expressions, dramatic shading, cinematic panel composition, European settings",
    description: "Cinematic noir pacing, expressive human anatomy, and tense Central European mysteries",
    knownFor: "Monster, 20th Century Boys, Pluto",
    imageSlot: null,
  },
  {
    id: "eiichiro-oda",
    name: "Eiichiro Oda",
    categories: ["manga", "comic"],
    promptPrefix: "in the style of Eiichiro Oda, exaggerated expressions, dynamic panel layouts, detailed backgrounds, whimsical character designs, epic scale",
    description: "Exaggerated nautical adventures, boundless energetic world-building, and expressive heroes",
    knownFor: "One Piece",
    imageSlot: null,
  },
  {
    id: "kentaro-miura",
    name: "Kentaro Miura",
    categories: ["dark", "manga", "fantasy"],
    promptPrefix: "in the style of Kentaro Miura, incredibly detailed ink work, medieval dark fantasy, massive scale, grotesque creatures, gothic atmosphere",
    description: "Monumental medieval dark fantasy, hyper-dense crosshatching, and colossal demonic warfare",
    knownFor: "Berserk",
    imageSlot: null,
  },
  {
    id: "masashi-kishimoto",
    name: "Masashi Kishimoto",
    categories: ["manga", "anime"],
    promptPrefix: "in the style of Masashi Kishimoto, ninja action, detailed hand signs, dynamic fight choreography, bold outlines, orange and blue color palette",
    description: "Kinetic ninja choreography, wide dynamic camera angles, and energetic chakra effects",
    knownFor: "Naruto, Boruto",
    imageSlot: null,
  },
  {
    id: "hirohiko-araki",
    name: "Hirohiko Araki",
    categories: ["manga", "fantasy"],
    promptPrefix: "in the style of Hirohiko Araki, flamboyant poses, high-fashion character designs, dramatic linework, surreal color shifts, muscular anatomy",
    description: "High-fashion avant-garde posing, chromatic shift shading, and bold Renaissance muscularity",
    knownFor: "JoJo's Bizarre Adventure",
    imageSlot: null,
  },
  {
    id: "takehiko-inoue",
    name: "Takehiko Inoue",
    categories: ["manga", "realistic"],
    promptPrefix: "in the style of Takehiko Inoue, realistic brushwork, expressive sumi-e ink style, dynamic sports action, philosophical themes, detailed anatomy",
    description: "Expressive traditional sumi-e brush strokes, intense anatomical drama, and samurai grit",
    knownFor: "Vagabond, Slam Dunk, Real",
    imageSlot: null,
  },
];

// ── REALISTIC & CLASSICAL ARTISTS ──
export const REALISTIC_ARTISTS: Artist[] = [
  {
    id: "rembrandt",
    name: "Rembrandt",
    categories: ["realistic", "dark"],
    promptPrefix: "in the style of Rembrandt, chiaroscuro lighting, deep shadows, warm golden highlights, rich oil textures, dramatic portraits",
    description: "Golden chiaroscuro master, luminous skin highlights emerging from rich dark oils",
    knownFor: "The Night Watch, Self-Portraits",
    imageSlot: null,
  },
  {
    id: "caravaggio",
    name: "Caravaggio",
    categories: ["realistic", "dark"],
    promptPrefix: "in the style of Caravaggio, dramatic tenebrism, sharp light-dark contrast, theatrical composition, naturalistic figures, deep black backgrounds",
    description: "Theatrical tenebrism, stark diagonal spotlights, and visceral raw realism",
    knownFor: "The Calling of Saint Matthew, Judith Beheading Holofernes",
    imageSlot: null,
  },
  {
    id: "john-singer-sargent",
    name: "John Singer Sargent",
    categories: ["realistic", "portrait"],
    promptPrefix: "in the style of John Singer Sargent, loose confident brushwork, elegant portraiture, luminous skin tones, refined society settings",
    description: "Virtuosic alla prima brushstrokes, luminous society portraits, and shimmering silk",
    knownFor: "Portrait of Madame X, Carnation Lily Lily Rose",
    imageSlot: null,
  },
  {
    id: "andrew-wyeth",
    name: "Andrew Wyeth",
    categories: ["realistic", "landscape"],
    promptPrefix: "in the style of Andrew Wyeth, tempera drybrush technique, muted earth tones, rural American landscapes, stark realism, melancholic mood",
    description: "Drybrush tempera realism, desolate rural fields, and quiet melancholic light",
    knownFor: "Christina's World, Helga Pictures",
    imageSlot: null,
  },
  {
    id: "norman-rockwell",
    name: "Norman Rockwell",
    categories: ["realistic", "comic", "illustration"],
    promptPrefix: "in the style of Norman Rockwell, idealized Americana, warm nostalgic lighting, expressive character faces, detailed storytelling scenes",
    description: "Nostalgic mid-century Americana, humorous expressive facial details, and warm storytelling",
    knownFor: "Saturday Evening Post covers, Four Freedoms",
    imageSlot: null,
  },
  {
    id: "lucian-freud",
    name: "Lucian Freud",
    categories: ["realistic"],
    promptPrefix: "in the style of Lucian Freud, thick impasto paint, unflinching nude portraiture, muted flesh tones, raw psychological presence",
    description: "Raw impasto flesh tones, unvarnished physical presence, and penetrating observation",
    knownFor: "Benefits Supervisor Sleeping",
    imageSlot: null,
  },
  {
    id: "chuck-close",
    name: "Chuck Close",
    categories: ["realistic"],
    promptPrefix: "in the style of Chuck Close, monumental photorealistic portraits, grid-based pixelation effect, extreme detail, frontal composition",
    description: "Monumental grid portraits, optical color blending, and massive frontal intensity",
    knownFor: "Big Self-Portrait, Lucas",
    imageSlot: null,
  },
  {
    id: "roberto-ferri",
    name: "Roberto Ferri",
    categories: ["realistic", "dark"],
    promptPrefix: "in the style of Roberto Ferri, baroque-inspired dark realism, anatomical precision, dramatic chiaroscuro, mythological themes",
    description: "Modern Caravaggism, neoclassical muscle definition, and surreal mythological anatomy",
    knownFor: "Contemporary sacred and profane oils",
    imageSlot: null,
  },
  {
    id: "edward-hopper",
    name: "Edward Hopper",
    categories: ["realistic", "cinematic"],
    promptPrefix: "in the style of Edward Hopper, urban isolation, stark morning light through windows, muted color palette, solitary figures, American realism",
    description: "Geometric urban loneliness, stark diagonal sunlight, and cinematic diner solitude",
    knownFor: "Nighthawks, Morning Sun",
    imageSlot: null,
  },
  {
    id: "diego-fazio",
    name: "Diego Fazio",
    categories: ["realistic", "photography"],
    promptPrefix: "in the style of Diego Fazio, hyperrealistic pencil drawing, water droplet details, smooth skin texture, black and white photorealism",
    description: "Pencil photorealism, glistening skin water droplets, and tonal perfection",
    knownFor: "Sensazioni, hyperrealistic graphite series",
    imageSlot: null,
  },
  {
    id: "alyssa-monks",
    name: "Alyssa Monks",
    categories: ["realistic"],
    promptPrefix: "in the style of Alyssa Monks, photorealistic oil painting, water distortion effects, steam on glass, intimate bathroom scenes, blurred foreground elements",
    description: "Steamy glass distortions, translucent water layers, and tactile oil depth",
    knownFor: "Translucence and Smear oil series",
    imageSlot: null,
  },
];

// ── SURREAL & ABSTRACT ARTISTS ──
export const SURREAL_ABSTRACT_ARTISTS: Artist[] = [
  {
    id: "salvador-dali",
    name: "Salvador Dali",
    categories: ["surreal"],
    promptPrefix: "in the style of Salvador Dali, melting forms, dream landscapes, precise hyperrealistic technique, surreal juxtapositions, vast empty spaces",
    description: "Melting clocks, vast Catalan desert horizons, and photographic dreamscapes",
    knownFor: "The Persistence of Memory, Swans Reflecting Elephants",
    imageSlot: null,
  },
  {
    id: "zdzislaw-beksinski",
    name: "Zdzislaw Beksinski",
    categories: ["dark", "surreal"],
    promptPrefix: "in the style of Zdzislaw Beksinski, dystopian hellscapes, skeletal figures, organic-mechanical fusion, desaturated ochre tones, haunting atmosphere",
    description: "Dystopian gothic ruins, towering skeletal monoliths, and eerie rust-hued atmospheres",
    knownFor: "Fantastic Realism paintings",
    imageSlot: null,
  },
  {
    id: "hr-giger",
    name: "H.R. Giger",
    categories: ["dark", "surreal", "scifi"],
    promptPrefix: "in the style of H.R. Giger, biomechanical nightmare, metallic organic fusion, monochromatic palette, intricate tubular details, erotic horror",
    description: "Monochromatic biomechanical fusion, airbrushed chrome tendons, and xenomorphic architecture",
    knownFor: "Alien xenomorph, Necronomicon",
    imageSlot: null,
  },
  {
    id: "rene-magritte",
    name: "Rene Magritte",
    categories: ["surreal"],
    promptPrefix: "in the style of Rene Magritte, deadpan surrealism, everyday objects in impossible contexts, clean painterly technique, blue skies with white clouds, bowler hats",
    description: "Witty visual paradoxes, bowler hats, green apples, and daytime skies above night streets",
    knownFor: "The Son of Man, The Treachery of Images",
    imageSlot: null,
  },
  {
    id: "frida-kahlo",
    name: "Frida Kahlo",
    categories: ["surreal"],
    promptPrefix: "in the style of Frida Kahlo, vibrant Mexican folk colors, symbolic self-portraits, lush botanical elements, emotional rawness, unibrow portraits",
    description: "Vibrant Mexican folk symbolism, intense personal resilience, and lush tropical botanicals",
    knownFor: "The Two Fridas, Self-Portrait with Thorn Necklace",
    imageSlot: null,
  },
  {
    id: "yves-tanguy",
    name: "Yves Tanguy",
    categories: ["surreal", "abstract"],
    promptPrefix: "in the style of Yves Tanguy, biomorphic abstract forms, desolate dreamscapes, smooth gradients, horizon lines, muted pastel palette",
    description: "Eerie alien pebble forms casting long shadows over infinite pastel horizons",
    knownFor: "Indefinite Divisibility, Mama, Papa is Wounded!",
    imageSlot: null,
  },
  {
    id: "francis-bacon",
    name: "Francis Bacon",
    categories: ["dark", "surreal"],
    promptPrefix: "in the style of Francis Bacon, distorted screaming figures, meat-like textures, claustrophobic spaces, raw existential horror, orange and black palette",
    description: "Screaming popes, raw butchered meat textures, and claustrophobic spatial cages",
    knownFor: "Three Studies for Figures at the Base of a Crucifixion",
    imageSlot: null,
  },
  {
    id: "shaun-tan",
    name: "Shaun Tan",
    categories: ["surreal", "fantasy", "illustration"],
    promptPrefix: "in the style of Shaun Tan, dreamlike narrative illustrations, muted earth tones, bizarre creature designs, immigrant story metaphors, pencil and oil",
    description: "Quiet otherworldly pencil illustrations, strange gentle beasts, and nostalgic sepia tones",
    knownFor: "The Arrival, The Lost Thing",
    imageSlot: null,
  },
  {
    id: "android-jones",
    name: "Android Jones",
    categories: ["surreal", "fantasy"],
    promptPrefix: "in the style of Android Jones, psychedelic digital painting, neon color palettes, spiritual themes, fractal patterns, visionary art",
    description: "Visionary digital art, glowing sacred geometry, and high-frequency luminescent fractals",
    knownFor: "Samskara, Boom Festival visuals",
    imageSlot: null,
  },
  {
    id: "wassily-kandinsky",
    name: "Wassily Kandinsky",
    categories: ["abstract"],
    promptPrefix: "in the style of Wassily Kandinsky, geometric abstraction, musical rhythm in composition, primary colors with black lines, Bauhaus influence",
    description: "Synesthetic geometric bursts, dynamic musical rhythm, and floating colorful forms",
    knownFor: "Composition VIII, Yellow-Red-Blue",
    imageSlot: null,
  },
  {
    id: "piet-mondrian",
    name: "Piet Mondrian",
    categories: ["abstract"],
    promptPrefix: "in the style of Piet Mondrian, grid-based composition, primary colors (red yellow blue), black lines, white space, De Stijl movement",
    description: "Pure primary color harmony, black orthogonal grids, and De Stijl balance",
    knownFor: "Composition with Red Blue and Yellow, Broadway Boogie Woogie",
    imageSlot: null,
  },
  {
    id: "jackson-pollock",
    name: "Jackson Pollock",
    categories: ["abstract"],
    promptPrefix: "in the style of Jackson Pollock, drip painting technique, chaotic layered splatters, black and silver on raw canvas, action painting energy",
    description: "Chaotic gestural drip paint layers, webbed enamel splatters, and kinetic tension",
    knownFor: "Number 1 (Lavender Mist), Autumn Rhythm",
    imageSlot: null,
  },
  {
    id: "mark-rothko",
    name: "Mark Rothko",
    categories: ["abstract"],
    promptPrefix: "in the style of Mark Rothko, color field rectangles, soft blurred edges, meditative presence, deep saturated hues, spiritual minimalism",
    description: "Transcendent color fields, feather-soft glowing edges, and luminous deep pigment resonance",
    knownFor: "Rothko Chapel murals, Orange and Yellow",
    imageSlot: null,
  },
  {
    id: "yayoi-kusama",
    name: "Yayoi Kusama",
    categories: ["abstract", "surreal"],
    promptPrefix: "in the style of Yayoi Kusama, obsessive polka dot patterns, infinity mirror rooms, vibrant red and white, psychedelic repetition, organic pumpkin forms",
    description: "Hypnotic polka dot repetitions, vibrant yellow pumpkins, and boundless infinity rooms",
    knownFor: "Infinity Mirror Rooms, Yellow Pumpkin",
    imageSlot: null,
  },
];

// ── FANTASY & DIGITAL CONCEPT ARTISTS ──
export const FANTASY_DIGITAL_ARTISTS: Artist[] = [
  {
    id: "frank-frazetta",
    name: "Frank Frazetta",
    categories: ["fantasy", "illustration"],
    promptPrefix: "in the style of Frank Frazetta, muscular heroic figures, dynamic action, dramatic rim lighting, oil painting texture, barbarian fantasy",
    description: "The godfather of heroic fantasy, savage barbarian power, and fiery oil brushstrokes",
    knownFor: "Conan the Barbarian, Death Dealer",
    imageSlot: null,
  },
  {
    id: "boris-vallejo",
    name: "Boris Vallejo",
    categories: ["fantasy"],
    promptPrefix: "in the style of Boris Vallejo, idealized muscular bodies, epic fantasy scenes, highly rendered oil painting, dramatic skies, mythological creatures",
    description: "Luminous Greco-Roman fantasy musculature, glistening oiled armor, and mythical dragons",
    knownFor: "Fantasy calendar covers, Tarzan",
    imageSlot: null,
  },
  {
    id: "luis-royo",
    name: "Luis Royo",
    categories: ["fantasy", "dark"],
    promptPrefix: "in the style of Luis Royo, dark fantasy, armored warrior women, metallic textures, post-apocalyptic settings, detailed leather and steel",
    description: "Dark fantasy warrior women, rusted biomechanical armor, and post-apocalyptic mist",
    knownFor: "Malefic Time, Dead Moon",
    imageSlot: null,
  },
  {
    id: "brian-froud",
    name: "Brian Froud",
    categories: ["fantasy", "illustration"],
    promptPrefix: "in the style of Brian Froud, fairy-tale creatures, organic textures, earthy color palette, whimsical grotesque, Celtic mythology influence",
    description: "Earthy Celtic faerie lore, twisted mossy bark textures, and eccentric whimsical goblins",
    knownFor: "The Dark Crystal, Labyrinth, Faeries book",
    imageSlot: null,
  },
  {
    id: "alan-lee",
    name: "Alan Lee",
    categories: ["fantasy", "landscape", "illustration"],
    promptPrefix: "in the style of Alan Lee, watercolor fantasy landscapes, misty atmospheres, ancient ruins, Tolkien-inspired, delicate pencil underdrawing",
    description: "Misty Middle-earth watercolor vistas, mossy ancient citadels, and delicate pencil lines",
    knownFor: "Lord of the Rings illustrations and film design",
    imageSlot: null,
  },
  {
    id: "john-howe",
    name: "John Howe",
    categories: ["fantasy", "landscape", "illustration"],
    promptPrefix: "in the style of John Howe, dramatic fantasy landscapes, dynamic compositions, rich earth tones, medieval atmosphere, epic scale",
    description: "Epic dragon clashes, dynamic armor silhouettes, and storm-lashed Tolkien fortresses",
    knownFor: "Lord of the Rings concept art, The Hobbit",
    imageSlot: null,
  },
  {
    id: "donato-giancola",
    name: "Donato Giancola",
    categories: ["fantasy", "realistic"],
    promptPrefix: "in the style of Donato Giancola, classical oil technique, science fiction and fantasy themes, dramatic lighting, Renaissance composition",
    description: "Classical Renaissance oil craftsmanship applied to modern sci-fi and fantasy epics",
    knownFor: "Middle-earth paintings, Magic: The Gathering",
    imageSlot: null,
  },
  {
    id: "kinuko-y-craft",
    name: "Kinuko Y. Craft",
    categories: ["fantasy", "illustration"],
    promptPrefix: "in the style of Kinuko Y. Craft, ornate detailed painting, gold leaf accents, Pre-Raphaelite influence, flowing fabrics, fairy-tale elegance",
    description: "Pre-Raphaelite golden leaf elegance, shimmering fairy-tale gowns, and opulent botanicals",
    knownFor: "Fantasy opera posters, book covers",
    imageSlot: null,
  },
  {
    id: "james-gurney",
    name: "James Gurney",
    categories: ["fantasy", "realistic", "illustration"],
    promptPrefix: "in the style of James Gurney, plein air technique, dinosaur fantasy, warm golden light, meticulous world-building, classic oil painting",
    description: "Lush plein air utopian lighting, harmonious dinosaur civilizations, and meticulous realism",
    knownFor: "Dinotopia, Color and Light book",
    imageSlot: null,
  },
  {
    id: "greg-rutkowski",
    name: "Greg Rutkowski",
    categories: ["fantasy", "realistic", "conceptart"],
    promptPrefix: "in the style of Greg Rutkowski, epic fantasy scenes, dramatic lighting, detailed oil painting texture, dragons and warriors, cinematic composition",
    description: "Sweeping epic fantasy vistas, fiery rim lighting, and rich textural oil brushwork",
    knownFor: "Magic: The Gathering, Dungeons & Dragons art",
    imageSlot: null,
  },
  {
    id: "ross-tran",
    name: "Ross Tran",
    categories: ["anime", "fantasy", "conceptart"],
    promptPrefix: "in the style of Ross Tran (RossDraws), vibrant anime-inspired digital art, glowing color palettes, fantasy character designs, dynamic lighting",
    description: "Glowing chromatic character art, energetic anime expressions, and high-impact digital brushwork",
    knownFor: "Nima series, RossDraws studio",
    imageSlot: null,
  },
  {
    id: "wlop",
    name: "Wlop",
    categories: ["anime", "fantasy", "illustration"],
    promptPrefix: "in the style of Wlop, ethereal digital painting, luminous skin rendering, intricate armor details, fantasy warrior women, soft glow effects",
    description: "Ethereal luminous skin rendering, soft rim lighting, and elegant porcelain warriors",
    knownFor: "Ghostblade webcomic series",
    imageSlot: null,
  },
];

// ── LANDSCAPE & IMPRESSIONIST ARTISTS ──
export const LANDSCAPE_IMPRESSIONIST_ARTISTS: Artist[] = [
  {
    id: "albert-bierstadt",
    name: "Albert Bierstadt",
    categories: ["landscape"],
    promptPrefix: "in the style of Albert Bierstadt, luminous Hudson River School, dramatic mountain vistas, glowing sunlight, romantic wilderness, epic scale",
    description: "Luminist Hudson River majesty, golden mountain waterfalls, and celestial alpine light",
    knownFor: "Among the Sierra Nevada, The Rocky Mountains",
    imageSlot: null,
  },
  {
    id: "jmw-turner",
    name: "J.M.W. Turner",
    categories: ["landscape", "impressionist"],
    promptPrefix: "in the style of J.M.W. Turner, atmospheric light, dissolving forms, maritime scenes, golden haze, proto-impressionist brushwork",
    description: "Swirling atmospheric golden storms, luminous maritime steam, and dissolving horizon light",
    knownFor: "The Fighting Temeraire, Rain Steam and Speed",
    imageSlot: null,
  },
  {
    id: "caspar-david-friedrich",
    name: "Caspar David Friedrich",
    categories: ["landscape", "dark"],
    promptPrefix: "in the style of Caspar David Friedrich, romantic solitude, figures facing vast landscapes, misty mountains, spiritual atmosphere, contemplative mood",
    description: "German Romantic solitude, lone wanderers above sea fog, and spiritual gothic crags",
    knownFor: "Wanderer above the Sea of Fog, The Monk by the Sea",
    imageSlot: null,
  },
  {
    id: "ivan-shishkin",
    name: "Ivan Shishkin",
    categories: ["landscape"],
    promptPrefix: "in the style of Ivan Shishkin, hyper-detailed forest scenes, Russian wilderness, dappled sunlight through trees, botanical precision, rich greens",
    description: "Hyper-detailed Russian pine forests, dappled forest floor sunlight, and botanical truth",
    knownFor: "Morning in a Pine Forest, Rye",
    imageSlot: null,
  },
  {
    id: "bob-ross",
    name: "Bob Ross",
    categories: ["landscape"],
    promptPrefix: "in the style of Bob Ross, wet-on-wet oil technique, happy little trees, soft mountain gradients, reflective lakes, warm optimistic lighting",
    description: "Wet-on-wet joyful alpine mountains, peaceful reflective lakes, and friendly evergreen trees",
    knownFor: "The Joy of Painting series",
    imageSlot: null,
  },
  {
    id: "thomas-kinkade",
    name: "Thomas Kinkade",
    categories: ["landscape"],
    promptPrefix: "in the style of Thomas Kinkade, luminous cozy cottages, glowing warm windows, garden paths, soft golden light, idyllic scenery",
    description: "Glowing pastel stone cottages, amber window warmth, and idyllic floral pathways",
    knownFor: "Painter of Light idyllic series",
    imageSlot: null,
  },
  {
    id: "david-hockney",
    name: "David Hockney",
    categories: ["landscape", "impressionist"],
    promptPrefix: "in the style of David Hockney, vibrant California color palette, swimming pool blues, flat graphic quality, iPad digital paintings, sunny landscapes",
    description: "Turquoise California swimming pool ripples, bold graphic planes, and sunny countryside",
    knownFor: "A Bigger Splash, Garrowby Hill",
    imageSlot: null,
  },
  {
    id: "claude-monet",
    name: "Claude Monet",
    categories: ["impressionist", "landscape"],
    promptPrefix: "in the style of Claude Monet, loose visible brushstrokes, dappled light effects, water reflections, garden scenes, pastel color harmony",
    description: "Dappled water lily pond reflections, fleeting seasonal daylight, and pure color harmony",
    knownFor: "Water Lilies, Impression Sunrise",
    imageSlot: null,
  },
  {
    id: "vincent-van-gogh",
    name: "Vincent van Gogh",
    categories: ["impressionist"],
    promptPrefix: "in the style of Vincent van Gogh, bold impasto strokes, swirling patterns, vibrant complementary colors, emotional intensity, thick paint application",
    description: "Emotional swirling impasto strokes, vibrant cobalt and gold, and pulsing night skies",
    knownFor: "The Starry Night, Sunflowers",
    imageSlot: null,
  },
  {
    id: "edgar-degas",
    name: "Edgar Degas",
    categories: ["impressionist"],
    promptPrefix: "in the style of Edgar Degas, ballet dancers, unusual angles, pastel textures, cropped compositions, intimate backstage lighting",
    description: "Intimate backstage ballet sketches, candid angled perspective, and delicate pastel dust",
    knownFor: "The Dance Class, L'Absinthe",
    imageSlot: null,
  },
  {
    id: "pierre-auguste-renoir",
    name: "Pierre-Auguste Renoir",
    categories: ["impressionist"],
    promptPrefix: "in the style of Renoir, warm rosy palette, dappled sunlight, soft focus, charming social scenes, luminous skin tones, feathery brushwork",
    description: "Feathery rosy brushwork, dappled riverside picnics, and glowing joyful portraiture",
    knownFor: "Luncheon of the Boating Party, Bal du moulin de la Galette",
    imageSlot: null,
  },
  {
    id: "gustav-klimt",
    name: "Gustav Klimt",
    categories: ["impressionist", "fantasy"],
    promptPrefix: "in the style of Gustav Klimt, gold leaf ornamentation, intricate geometric patterns, sensual figures, mosaic textures, Byzantine influence",
    description: "Gilded Byzantine mosaic robes, sensual geometric spirals, and Vienna Secession opulence",
    knownFor: "The Kiss, Portrait of Adele Bloch-Bauer I",
    imageSlot: null,
  },
];

// ── CINEMATIC & PHOTOGRAPHY DIRECTORS ──
export const CINEMATIC_PHOTO_ARTISTS: Artist[] = [
  {
    id: "ansel-adams",
    name: "Ansel Adams",
    categories: ["photography", "landscape", "realistic"],
    promptPrefix: "in the style of Ansel Adams, black and white landscape photography, dramatic tonal range, sharp focus, majestic wilderness, zone system contrast",
    description: "Monochrome Zone System clarity, deep crystalline shadow contrast, and majestic Yosemite peaks",
    knownFor: "Moonrise Hernandez, Yosemite wilderness photography",
    imageSlot: null,
  },
  {
    id: "roger-deakins",
    name: "Roger Deakins",
    categories: ["cinematic", "photography"],
    promptPrefix: "in the cinematic style of Roger Deakins, naturalistic lighting, warm color palette, wide landscapes, shallow depth of field, golden hour",
    description: "Master of naturalistic cinematic lighting, golden silhouettes, and breathtaking depth of field",
    knownFor: "Blade Runner 2049, 1917, Sicario, Skyfall",
    imageSlot: null,
  },
  {
    id: "wes-anderson",
    name: "Wes Anderson",
    categories: ["cinematic"],
    promptPrefix: "in the style of Wes Anderson, symmetrical composition, pastel color palettes, flat perspective, meticulous set design, deadpan aesthetic",
    description: "Strict axial symmetry, whimsical pastel palettes, and meticulously framed dollhouse dioramas",
    knownFor: "The Grand Budapest Hotel, Moonrise Kingdom",
    imageSlot: null,
  },
  {
    id: "denis-villeneuve",
    name: "Denis Villeneuve",
    categories: ["cinematic", "scifi"],
    promptPrefix: "in the cinematic style of Denis Villeneuve, vast scale, muted color grading, atmospheric haze, brutalist architecture, contemplative pacing",
    description: "Monumental brutalist desert architecture, atmospheric dust haze, and brooding grandeur",
    knownFor: "Dune Part One and Two, Arrival, Blade Runner 2049",
    imageSlot: null,
  },
  {
    id: "liam-wong",
    name: "Liam Wong",
    categories: ["cinematic", "photography", "scifi"],
    promptPrefix: "in the style of Liam Wong, neon-lit night photography, rain-soaked streets, cyberpunk aesthetic, vibrant magenta and cyan, Tokyo at night",
    description: "Rain-slicked Tokyo alleys, electric magenta and cyan reflections, and cinematic night street photography",
    knownFor: "TO:KY:OO photography monograph",
    imageSlot: null,
  },
];

// ── MASTER ARTIST REGISTRY (EXTENSIBLE COMBINED ARRAY) ──
export const ARTIST_REGISTRY: Artist[] = [
  ...HORROR_ARTISTS,
  ...COMIC_ARTISTS,
  ...SCIFI_ARTISTS,
  ...TECHNICAL_ARTISTS,
  ...ANIME_MANGA_ARTISTS,
  ...REALISTIC_ARTISTS,
  ...SURREAL_ABSTRACT_ARTISTS,
  ...FANTASY_DIGITAL_ARTISTS,
  ...LANDSCAPE_IMPRESSIONIST_ARTISTS,
  ...CINEMATIC_PHOTO_ARTISTS,
].map((artist) => ({
  ...artist,
  // Ensure backward compatibility fields are always set
  category: artist.categories[0] || "anime",
  styles: artist.categories,
}));

// Export alias for backward compatibility
export const ARTISTS: Artist[] = ARTIST_REGISTRY;

// ── REGISTRY HELPER FUNCTIONS ──

export function getCategoryColor(catId: string): string {
  const cat = CATEGORIES.find((c) => c.id.toLowerCase() === catId.toLowerCase());
  return cat ? cat.color : CATEGORY_COLORS[catId] || "#d4a574";
}

export function getArtistsByCategory(catId: string): Artist[] {
  if (!catId || catId === 'all') return ARTIST_REGISTRY;
  const target = catId.toLowerCase();
  return ARTIST_REGISTRY.filter((a) =>
    a.categories.some((c) => c.toLowerCase() === target)
  );
}

export function searchArtists(query: string, categoryFilter: string = 'all'): Artist[] {
  const q = query.toLowerCase().trim();
  let list = ARTIST_REGISTRY;

  if (categoryFilter && categoryFilter !== 'all') {
    const target = categoryFilter.toLowerCase();
    list = list.filter((a) => a.categories.some((c) => c.toLowerCase() === target));
  }

  if (!q) return list;

  return list.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.categories.some((c) => c.toLowerCase().includes(q)) ||
      a.description.toLowerCase().includes(q) ||
      a.knownFor.toLowerCase().includes(q) ||
      a.promptPrefix.toLowerCase().includes(q)
  );
}

// Generate deterministic gradient for artist placeholder thumbnail
export function generateGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 45) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 50%, 15%) 0%, hsl(${h2}, 40%, 8%) 100%)`;
}

// Prompt enhancer helper appending primary category modifier
export function getArtistPromptAddition(artist: Artist): string {
  let promptAddition = artist.promptPrefix;
  const primaryCat = artist.categories[0];
  const mod = CATEGORY_MODIFIERS[primaryCat];
  if (mod) promptAddition += mod;
  return promptAddition;
}

// ── PROMPT TEMPLATES ──
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: "Cinematic Portrait",
    template: "Cinematic portrait of [subject], [lighting] lighting, shallow depth of field, by [artist], [mood] atmosphere, 8K",
    placeholders: ["subject", "lighting", "artist", "mood"],
  },
  {
    name: "Fantasy Landscape",
    template: "Epic fantasy landscape, [environment], [time of day], [weather], by [artist], highly detailed, unreal engine render",
    placeholders: ["environment", "time of day", "weather", "artist"],
  },
  {
    name: "Product Photography",
    template: "Professional product photo of [product], [background], studio lighting, [angle] angle, 8K, commercial photography",
    placeholders: ["product", "background", "angle"],
  },
  {
    name: "Concept Art",
    template: "Concept art of [subject], [style] style, [color palette] color palette, character design sheet, multiple views",
    placeholders: ["subject", "style", "color palette"],
  },
  {
    name: "Architecture Render",
    template: "Architectural visualization of [building type], [material], [environment], [lighting], photorealistic, 8K, by [artist]",
    placeholders: ["building type", "material", "environment", "lighting", "artist"],
  },
  {
    name: "Technical Blueprint",
    template: "Technical drawing of [subject], exploded schematic view, white lines on deep blueprint background, engineering annotations, precision drafting, by [artist]",
    placeholders: ["subject", "artist"],
  },
  {
    name: "Graphic Comic Splash",
    template: "Comic book full splash page of [action], dynamic angles, halftone dots, high contrast ink shading, dramatic color palette, by [artist]",
    placeholders: ["action", "artist"],
  },
];
