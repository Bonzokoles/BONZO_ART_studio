# Google Gemini / Nano Banana / Veo — Integration Guide

## Autentykacja

- **Zmienna**: `GEMINI_API_KEY`
- **Nagłówek (REST)**: `x-goog-api-key: $GEMINI_API_KEY` (lub `?key=` query)
- **Źródło klucza**: https://aistudio.google.com/apikey
- **Format**: nowe klucze `AQ.A...`, stare `AIza...`

## SDK

`@google/genai` (TypeScript SDK) — używany w `services/geminiService.ts`.

```ts
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey });
await ai.models.generateContent({ model: 'gemini-3-pro-image', contents: {...} });
await ai.models.generateVideos({ model: 'veo-3.1-generate-preview', prompt, ... });
```

## Modele obrazu (Nano Banana family)

| Model | Typ | Uwagi |
|---|---|---|
| `gemini-2.5-flash-image` | Nano Banana | darmowy tier |
| `gemini-3.1-flash-image` | Nano Banana 2 | obecna generacja |
| `gemini-3-pro-image` | Nano Banana Pro | do 4K |
| `gemini-3.1-flash-lite-image` | Nano Banana 2 Lite | najtańszy |

## Modele video (Veo)

| Model | Typ |
|---|---|
| `veo-3.1-generate-preview` | standard |
| `veo-3.1-fast-generate-preview` | fast |
| `veo-3.1-lite-generate-preview` | lite |

Veo to operacja długo-trwająca (async) — `generateVideos` zwraca operation, potem polling.

## Google Search Grounding

`gemini-2.5-flash` z `tools: [{ googleSearch: {} }]` — używane w Prompt Library "Odkrywaj".
Zwraca `groundingMetadata.groundingChunks` ze źródłami.

## Lokalne modele

Google Gemini nie ma self-host. Lokalnie użyj A1111/ComfyUI — patrz `../local/README.md`.

## Verified endpoints

| Komenda | Status |
|---|---|
| `GET /v1beta/models?key=...` (nowy klucz) | HTTP 200, 50 modeli |
| `generateContent gemini-3-pro-image` | HTTP 200, image/jpeg |
| `generateContent gemini-3.1-flash-image` | HTTP 200, image/jpeg |
| `generateContent gemini-3.1-flash-lite-image` | HTTP 200, image/jpeg |
| `generateContent gemini-2.5-flash-image` | HTTP 200, image/png |
| `generateContent gemini-2.5-flash + googleSearch` | HTTP 200 |
