# BONZO AI ART DEVZ // STUDIO

```text
================================================================================
  ____   ____  _   _ _____ ___       _    ___      _    ____ _____   ____  _______     ______
 | __ ) / __ \| \ | |__  / _ \     / \  |_ _|    / \  |  _ \_   _| |  _ \| ____\ \   / /_  /
 |  _ \| |  | |  \| | / / | | |   / _ \  | |    / _ \ | |_) || |   | | | |  _|  \ \ / / / /
 | |_) | |__| | |\  |/ /| |_| |  / ___ \ | |   / ___ \|  _ < | |   | |_| | |___  \ V / / /___
 |____/ \____/|_| \_/____\___/  /_/   \_\___| /_/   \_\__\_|\_|   |____/|_____|  \_/ /_____/
================================================================================
                                                                    [VERSION: v2.6]
```

A dense, high-performance generative art workbench engineered for visual artists, creative technologists, and AI directors. Designed with an industrial creative tools aesthetic inspired by ComfyUI, Photoshop, and professional telemetry consoles.

---

## 1. Overview

**BONZO AI ART DEVZ // STUDIO (v2.6)** is a unified multi-provider generative art studio. It provides direct, client-driven integration with industry-leading diffusion and multimodal AI models across Google, fal.ai, Replicate, and OpenAI, paired with an offline-capable heuristic fallback engine, an 80+ artist style matrix, and a real-time API telemetry suite.

### Supported Providers & Models

| Provider | Supported Models & Engines | Auth |
|---|---|---|
| **Google** | Nano Banana (Gemini 2.5 Flash Image), **Nano Banana 2** (Gemini 3.1 Flash Image), **Nano Banana 2 Lite** (Gemini 3.1 Flash Lite Image), **Nano Banana Pro** (Gemini 3 Pro Image), **Veo 3.1** video generation (real-time, with polling + estimated price) | `GEMINI_API_KEY` |
| **fal.ai** | FLUX.1 [schnell], FLUX.1 [dev], FLUX.1.1 Pro, **FLUX.1.1 Pro Ultra**, **Ideogram V3**, Recraft V3, SD 3.5 Large, Playground v2.5, AuraFlow | `FAL_KEY` |
| **Replicate** | FLUX Schnell / Dev / 1.1 Pro / **1.1 Pro Ultra**, SD 3.5 Medium / Large, Recraft V3, Ideogram V2, DreamShaper XL Turbo, Kandinsky 2.2, NVIDIA Sana, SDXL Lightning 4-step, Luma Photon Flash | `REPLICATE_API_TOKEN` |
| **OpenAI** | DALL-E 3 (HD / Standard), DALL-E 2, **gpt-4o-mini** (prompt rewriting) | `OPENAI_API_KEY` |

**Provider isolation is strict.** The model dropdown is filtered by the selected provider — pick `REPLICATE` and you see only Replicate models; pick `fal.ai` and you see only fal.ai models. No cross-provider mixing.

---

## 2. Core Features

### 1. Multi-Tab Generative Workspace
- **Image Generation Tab**: Multi-provider prompt builder with aspect ratio selection, quality mode triggers, negative prompts, seed locking, guidance scale, and step controls.
- **Image Editing Tab**: Multimodal image-to-image synthesis, mask-free semantic inpainting, and style transfer via Gemini.
- **Image Analysis Tab**: Computer vision inspector generating structured JSON audits (lighting, composition, color palette, camera mechanics, artistic medium classification).
- **Video Generation Tab**: Long-running asynchronous video generation powered by Google Veo 3.1 with polling telemetry and timeline preview.
- **Style Presets Tab**: Registry of pre-configured lighting, atmosphere, and aesthetic profiles with one-click injection.

### 2. Integrated 80+ Artist Wildcards Matrix
- Curated index of historical and contemporary visual artists across 8 categories (Cyberpunk, Surrealism, Fantasy, Sci-Fi, Dark Art, Abstract, Classical, Anime).
- Single-click artist descriptor injection with real-time prompt enhancement.
- Multimodal AI artist recommendations using Gemini.

### 3. Prompt Library + AI Discovery
- Curated prompt library across FLUX / Midjourney / GPT / Claude / Gemini / DALL-E.
- **"Odkrywaj (AI Agent)"** — live prompt & resource discovery using Gemini 2.5 Flash with **Google Search Grounding**: the model searches Reddit, Discord, and code repos in real time and returns sourced, trend-aware prompts.
- **"Przepisz Prompt (OpenAI)"** — rewrite a pasted prompt for better syntax and technical precision via `gpt-4o-mini`, preserving intent without artistic expansion.
- **"Katalog SD (897K)"** — local iframe viewer into a 897,000-prompt catalog (SD 1.5 / SDXL) with model + size + score metadata, served from a junction directory.

### 4. Mood & Details Library
- Clickable phrase tiles (precision / painting / backdrop / lighting / render) that append ready-made descriptors to the prompt.
- Add your own phrases (persisted in localStorage) and have Gemini auto-organize them into categories.

### 5. Custom Style Preset System
- Create and persist custom style formulas directly from generated outputs.
- Local browser persistence with instant recall, custom tagging, and deletion controls.

### 6. Real-time Debug Console & API Telemetry
- Inspect full HTTP request/response payloads with status codes, latency, and error traces.
- Level filters (`REQ`, `RES`, `ERR`, `INFO`, `WARN`) and full-text search.
- Recharts performance analytics: latency timeline, SLA success rate, P95 breakdown.

### 7. Timeline Studio + FFmpeg NLE Engine
- Multi-track timeline for composing video/audio assets.
- Backend `uploadServer.ts` (port 3219) renders the timeline to H.264 MP4 via `-filter_complex` FFmpeg composition (offsets, entry times, tracks).
- Async rendering — never blocks the main server process.

### 8. Multi-Window Modular Workstation
- Popout windows (Wildcards Library, Video Config, Workflows) with cross-window `postMessage` / `BroadcastChannel` prompt injection.

---

## 3. Tech Stack

- **Framework**: React 18 + TypeScript
- **Bundler & Build**: Vite 6, esbuild
- **Styling**: Tailwind CSS (dark industrial design tokens, `#0a0a0a` / `#111` / `#1a1a1a`, `#d4a574` warm gold accents, zero-radius geometry)
- **Charts**: Recharts
- **AI SDK**: `@google/genai` (Google GenAI TypeScript SDK)
- **Video render**: Node.js + FFmpeg (`uploadServer.ts`)
- **State**: client-side reactive stores, `localStorage`, `BroadcastChannel`

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+ (or Bun)
- FFmpeg on PATH (for Timeline Studio NLE rendering)

### Installation

```bash
cd creative-ai-studio
npm install
npm run dev          # dev server at http://localhost:5853
```

For Timeline Studio NLE rendering, also start the backend:

```bash
bun run uploadServer.ts   # FFmpeg render server on port 3219
```

Or use `start.bat` to launch both.

### Building for Production

```bash
npm run build
```

---

## 5. API Keys Configuration

API keys are read from two sources, in priority order:

1. **Browser `localStorage`** — set via the **API KEYS CONFIGURATION** drawer (bottom workspace toolbar).
2. **`.env.local`** — injected at build time by Vite `define` into `process.env.*`.

> `.env.local` is gitignored — it never ships to the repository. Copy `.env.local` to your machine and fill in the keys below.

| Provider | Env var | Acquisition URL |
|---|---|---|
| **Google** | `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| **fal.ai** | `FAL_KEY` | https://fal.ai/dashboard/keys |
| **Replicate** | `REPLICATE_API_TOKEN` | https://replicate.com/account/api-tokens |
| **OpenAI** | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

```bash
# .env.local (never committed)
GEMINI_API_KEY=...
FAL_KEY=...
REPLICATE_API_TOKEN=...
OPENAI_API_KEY=...
```

---

## 6. Gallery

AI-generated showcase outputs from the studio (FLUX.1, Nano Banana, Stable Diffusion via multi-provider pipeline):

| | | |
|---|---|---|
| ![line-art megastructure](assets/gallery/bonzo-art-1788928721549.png) | ![sci-fi robots](assets/gallery/bonzo-art-1788936299711.png) | ![character lineup](assets/gallery/bonzo-art-1788933174959.png) |

| | |
|---|---|
| ![concept art](assets/gallery/bonzo-art-1788932552871.png) | ![sci-fi](assets/gallery/Gemini_Generated_Image_d1m48yd1m48yd1m4.jpg) |

> Raw model outputs demonstrating the studio's style range — from technical line-art to cinematic concept art. Full set in `assets/gallery/`.

---

## 7. Browser Support

| Browser | Min Version | Notes |
|---|---|---|
| Google Chrome | 90+ | Full support |
| Microsoft Edge | 90+ | Full support |
| Mozilla Firefox | 95+ | Full support |
| Apple Safari | 15.4+ | Full support |

*Allow pop-ups to enable multi-window standalone workstations (Wildcards, Video Config, Workflows).*

---

## 8. Studio Interface

![BONZO AI ART DEVZ — Studio Interface](assets/screenshots/studio-main.png)

Three-column industrial layout: left parameter panel (provider engine, model, aspect ratio, negative prompt, mood & details library), center canvas with large prompt editor and recent history, right asset vault with generated-image gallery.

---

## 9. License

MIT License. Developed for high-density generative art exploration and creative workflows.
