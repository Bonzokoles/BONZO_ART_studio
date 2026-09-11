# TASK — Pi: Workflow Editor + Image Editing/Analysis decoupling

## Kontekst (samowystarczalny — nie masz dostępu do rozmowy)

Pracujesz w repozytorium **BONZO AI ART DEVZ // STUDIO v2.6** — `Q:\BONZO_creative_ai_studio`.

- **Stack:** React 18 + TypeScript + Vite 6 + Tailwind CSS. Bundler: `bun` / `npm` (skrypty w `package.json`).
- **Design system (obowiązkowy, twarda reguła z workspace.spec.json):**
  - `border-radius: 0 !important` (zero zaokrągleń — geometria 90°),
  - akcent **`#d4a574`** (ciepłe złoto),
  - tło warstw: `#0b0d12` / `#11131a` / `#1f2937`,
  - **brak cieni i gradientów**, font mono (`font-mono`), etykiety `uppercase tracking-wider`.
- **Warstwa dostawców:** `services/providerEngine.ts` — centralny rejestr `MODELS[]` (id, provider, cost, capabilities) + `executeMultiProviderGeneration(params)`. Dostawcy: google / fal / replicate / openai / local.
- **Gemini:** `services/geminiService.ts` — `editImage()`, `analyzeImage()`.
- **Typy:** `types.ts` — `WorkflowNode`, `WorkflowConnection`, `AppMode='canvas'|'workflow'`, `ModelInfo.category: 'image'|'video'|'postprocess'|'edit'`.

## Zakres zadania — 3 problemy (rób po kolei, każdy z weryfikacją)

### Problem 1 — Workflow Editor: prawdziwy graf zamiast atrapy

Obecnie `services/windowManager.ts` → `renderWorkflowsHTML()` (linia ~1292) generuje statyczny HTML z nadpisem „COMING SOON" i zablokowanym `[RUN WORKFLOW]`. Typy `WorkflowNode`/`WorkflowConnection` są zdefiniowane, ale **nic nie jest zaimplementowane**.

Zbuduj działający edytor grafu węzłów w dedykowanym oknie (popout):

1. Zainstaluj **LiteGraph.js** (`litegraph.js`) jako zależność.
2. Zastąp atrapę w `renderWorkflowsHTML()` realnym canvasem LiteGraph (albo — jeśli czystsze — wydziel osobny moduł `workflow/` ładowany w oknie).
3. Zaimplementuj paletę węzłów zgodną z `WorkflowNode.type`: `prompt`, `checkpoint`, `ksampler`, `latent`, `vae`, `output`, `enhancer`, `inpaint`. Każdy węzeł ma `inputs`/`outputs`/`params` (zgodnie z interfejsem).
4. Serializacja/deserializacja grafu do `WorkflowNode[]` + `WorkflowConnection[]` (zapisz/odczyt w `localStorage`).
5. `[RUN WORKFLOW]` ma realnie wykonywać graf: przetwarzaj węzły w topologicznej kolejności, wołając `providerEngine` dla węzłów generatywnych (ksampler → generacja obrazu, inpaint → edycja, enhancer → upscale). **Węzeł `enhancer` zostaw jako stub z jasnym TODO** — post-processing przejmuje inny agent, nie dotykaj tego.

**Weryfikacja:** `tsc --noEmit` czyste + `bun run build` przechodzi + okno Workflow otwiera się i renderuje realny graf (nie „COMING SOON").

### Problem 2 — Image Editing: odpiąć od sztywnego Gemini

`features/ImageEditing/ImageEditingTab.tsx` ma model/provider **zaszyte na sztywno** (`gemini-2.5-flash-image`, `google`, 1024×1024).

1. Dodaj selektor providera + modelu (jak w `ImageGenerationTab`), filtrując `MODELS[]` po `category === 'edit'`.
2. Przenieś logikę edycji do `providerEngine` (nowa funkcja np. `executeImageEdit(params)`) — ścieżka google przez `editImage()`, reszta providerów przez ich natywne endpointy (fal/replicate image-to-image).
3. Zachowaj presety `EDIT_PRESETS` i widok before/after bez zmian.

**Weryfikacja:** `tsc --noEmit` + edycja działa dla wybranego providera, presety i historia nienaruszone.

### Problem 3 — Image Analysis: wymusić schemat JSON

`features/ImageAnalysis/ImageAnalysisTab.tsx` parsuje `analyzeImage()` luźnym `JSON.parse` z opcjonalnymi polami — brak walidacji.

1. Zdefiniuj rygorystyczny typ `AnalysisReport` (description, objects[], colors[], style, mood) w `types.ts`.
2. Wymuś schemat po stronie promptu Gemini (poproś o czysty JSON) i zwaliduj odpowiedź (fallback do surowego tekstu tylko gdy JSON nieparsowalny).
3. Karty structured view renderuj z walidowanego obiektu; tryb `json` pokazuje surowy tekst.

**Weryfikacja:** `tsc --noEmit` + analiza zwraca wypełnione karty (description/objects/colors/style/mood) dla przykładowego obrazu.

## Czego NIE dotykać (przejęte przez innego agenta)

- **Post-processing / upscale / enhancer** — stub tylko.
- **Video Generation / Video Continuation / Timeline Studio** — nie ruszaj.

## DoD (definition of done)

1. `tsc --noEmit` — zero błędów.
2. `bun run build` (lub `npm run build`) — przechodzi.
3. Workflow Editor renderuje realny graf LiteGraph z działającym RUN.
4. Image Editing i Analysis mają selektor providera/modelu i nie są zaszyte na Gemini.
5. Design system zachowany: 0px radius, akcent `#d4a574`, zero cieni/gradientów, font mono.
6. Żadnych kluczy API w commitach (klucze tylko przez `.env.local` / `localStorage`).
