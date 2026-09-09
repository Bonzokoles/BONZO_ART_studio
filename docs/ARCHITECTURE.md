# ARCHITECTURE — jak providerzy łączą się w jedną aplikację

## Przegląd

BONZO AI ART DEVZ // STUDIO to frontend React + Vite + TypeScript, który woła
dostawców **bezpośrednio z przeglądarki** (klucze w `localStorage` / `.env.local`)
lub przez **Vite proxy** (żeby uniknąć CORS na localhost).

Warstwa dostawców jest scentralizowana w `services/providerEngine.ts`:

```
UI (ImageGenerationTab)
  └─> executeMultiProviderGeneration(params)
        ├─ google   -> @google/genai SDK (Nano Banana / Veo)
        ├─ fal      -> POST fal.run/{model}           (Key <key>)
        ├─ replicate-> POST /v1/predictions           (Token <token>)
        │             └─ community models: pinned version
        ├─ openai   -> POST /v1/images/generations    (Bearer <key>)
        └─ local    -> POST /sdapi/v1/txt2img         (A1111/ComfyUI)
```

## Rejestr modeli

- `services/providerEngine.ts` — `MODELS[]` (maszynowa lista: id, provider, koszt, capabilities).
- `data/modelCatalog.ts` — `MODEL_CATALOG[]` (opisowa biblioteka: description, bestFor, notes).
- `data/allArtists.ts` — połączona baza artystów (registry + cheat sheet), wspólna dla UI i okna Wildcards.

Separacja providerów jest twarda: `filteredModels = MODELS.filter(m => m.provider === provider)`.
Wybranie platformy filtruje dropdown modeli i presetów do tej jednej platformy.

## Kluczowa różnica: Replicate official vs community

- **Official models** (`black-forest-labs/flux-schnell`, `stability-ai/*`): `POST /v1/models/{owner}/{name}/predictions`.
- **Community models** (`nvidia/sana`, `lucataco/dreamshaper-xl-turbo`, itd.): wymagają `POST /v1/predictions` z `{ version, input }`, gdzie `version` to hash konkretnej wersji modelu.

`ModelInfo.replicateVersion` to opcjonalny hash — jeśli obecny, providerEngine wybiera
ścieżkę community; jeśli nie, ścieżkę official. Nowy model Replicate dodajesz, wypełniając
ten jeden opcjonalny atrybut. Szczegóły: `providers/replicate/README.md`.

## Klucze API

| Provider | Env / storage key | Header | Źródło klucza |
|---|---|---|---|
| Google | `GEMINI_API_KEY` | x-goog-api-key (SDK) | aistudio.google.com/apikey |
| fal.ai | `FAL_KEY` | `Authorization: Key <key>` | fal.ai/dashboard/keys |
| Replicate | `REPLICATE_API_TOKEN` | `Authorization: Token <token>` | replicate.com/account/api-tokens |
| OpenAI | `OPENAI_API_KEY` | `Authorization: Bearer <key>` | platform.openai.com/api-keys |
| Local SD | `LOCAL_SD_URL` | brak | localhost:7860 (A1111) |

Klucze nigdy nie są commitowane (`.env.local` i `.env.*.bak-*` w `.gitignore`).

## Dodawanie nowego dostawcy (addon)

1. Rozszerz `ProviderId` w `types.ts`.
2. Dodaj wpis do `PROVIDER_KEY_MAP` / `PROVIDER_LABELS` / `PROVIDER_COLORS` w `services/keyStorage.ts`.
3. Dodaj gałąź `if (provider === 'nowy')` w `executeMultiProviderGeneration`.
4. Dodaj modele do `MODELS[]` i `MODEL_CATALOG[]`.
5. Utwórz `docs/providers/nowy/README.md`.
6. Dodaj providera do `PROVIDER_LIST` w `ImageGenerationTab.tsx`.

## Lokalne modele (GTX 3070 8GB)

Self-hostowany silnik obrazu jako "addon" działa przez A1111 `/sdapi/v1`.
Pełny przewodnik i rekomendacje modeli: `providers/local/README.md`.
