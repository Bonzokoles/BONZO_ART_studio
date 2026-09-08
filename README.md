# BONZO AI ART DEVZ // STUDIO

```text
================================================================================
  ____   ____  _   _ _____ ___       _    ___      _    ____ _____   ____  _______     ______ 
 | __ ) / __ \| \ | |__  / _ \     / \  |_ _|    / \  |  _ \_   _| |  _ \| ____\ \   / /_  / 
 |  _ \| |  | |  \| | / / | | |   / _ \  | |    / _ \ | |_) || |   | | | |  _|  \ \ / / / /  
 | |_) | |__| | |\  |/ /| |_| |  / ___ \ | |   / ___ \|  _ < | |   | |_| | |___  \ V / / /___
 |____/ \____/|_| \_/____\___/  /_/   \_\___| /_/   \_\_| \_\|_|   |____/|_____|  \_/ /_____|
================================================================================
                                                                    [VERSION: v2.6]
```

A dense, high-performance generative art workbench engineered for visual artists, creative technologists, and AI directors. Designed with an industrial creative tools aesthetic inspired by ComfyUI, Photoshop, and professional telemetry consoles.

---

## 1. Overview

**BONZO AI ART DEVZ // STUDIO (v2.6)** is a unified multi-provider generative art studio. It provides direct, client-driven integration with industry-leading diffusion and multimodal AI models across Google, fal.ai, Replicate, and OpenAI, paired with an offline-capable heuristic fallback engine, artist style matrix, and real-time API telemetry suite.

### Supported Providers & Models

| Provider | Supported Models & Engines | Authentication Method |
|---|---|---|
| **Google** | Imagen 3 (Fast, Standard, High Quality), Gemini 2.5 Flash, Gemini 2.5 Flash Image Edit, Veo 2.0 Video | `GEMINI_API_KEY` |
| **fal.ai** | FLUX.1 [schnell], FLUX.1 [dev], FLUX Realism, Fast SDXL | `FAL_KEY` |
| **Replicate** | FLUX.1 Dev, FLUX.1 Schnell, Stability SDXL 1.0 | `REPLICATE_API_TOKEN` |
| **OpenAI** | DALL-E 3 (HD / Standard), DALL-E 2 | `OPENAI_API_KEY` |
| **Local SD** | Automatic1111 / SD.Next / Forge WebUI API (`/sdapi/v1`) | `LOCAL_SD_URL` |

---

## 2. Core Features

### 1. Multi-Tab Generative Workspace
- **Image Generation Tab**: Multi-provider prompt builder with aspect ratio selection, quality mode triggers, negative prompts, seed locking, guidance scale, and step controls.
- **Image Editing Tab**: Multimodal image-to-image synthesis, mask-free semantic inpainting, and style transfer via Gemini 2.5 Flash Image.
- **Image Analysis Tab**: Computer vision inspector generating structured JSON audits (lighting, composition, color palette, camera mechanics, artistic medium classification).
- **Video Generation Tab**: Long-running asynchronous video generation powered by Google Veo 2.0 with polling telemetry and timeline preview.
- **Style Presets Tab**: Comprehensive registry of pre-configured lighting, atmosphere, and aesthetic profiles with one-click injection.

### 2. Integrated 80+ Artist Wildcards Matrix
- Curated index of historical and contemporary visual artists organized across 8 categories (Cyberpunk, Surrealism, Fantasy, Sci-Fi, Dark Art, Abstract, Classical, Anime).
- Single-click artist descriptor injection with real-time prompt enhancement.
- Multimodal AI artist recommendations using Gemini 2.5 Flash.

### 3. Custom Style Preset System
- Create and persist custom style formulas directly from generated outputs.
- Local browser persistence with instant recall, custom tagging, and deletion controls.

### 4. Real-time Debug Console & API Telemetry
- Inspect full HTTP request and response payloads with status codes, latency benchmarks, and error traces.
- Level filters (`REQ`, `RES`, `ERR`, `INFO`, `WARN`) and full-text search.
- Single-click JSON payload export and batch export to clipboard.
- Keyboard shortcut `Ctrl+\`` (or `Cmd+\``) for instant overlay toggle.

### 5. Recharts Performance & Latency Analytics
- Interactive timeline tracking real-time API latency per provider.
- SLA success rate comparison bars with visual 95% target thresholds.
- Average vs. P95 latency breakdown charts.
- Live benchmark probe ping button to test network round-trip time.

### 6. Multi-Window Modular Workstation
- Popout support for dedicated feature windows:
  - **Wildcards Library Window**: Independent floating artist browser with cross-window `postMessage` and `BroadcastChannel` prompt injection.
  - **Video Config Window**: Standalone Veo parameter tuner.
  - **Workflows Window**: LiteGraph node graph pipeline interface.

---

## 3. Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler & Build**: Vite 6, esbuild
- **Styling**: Tailwind CSS (Dark industrial design tokens, `#0a0a0a` / `#111` / `#1a1a1a` palette, `#d4a574` warm gold accents, sharp zero-radius geometry)
- **Charts & Visualization**: Recharts (LineChart, BarChart, ResponsiveContainer)
- **Icons**: Lucide React (1.5px stroke industrial line-art)
- **AI SDK**: `@google/genai` (Google GenAI TypeScript SDK)
- **State & Storage**: Client-side reactive stores, `localStorage`, `BroadcastChannel`

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18.0.0 or higher (or Bun / pnpm)
- npm or yarn package manager

### Installation

```bash
# 1. Clone or extract the repository
cd creative-ai-studio

# 2. Install dependencies
npm install

# 3. Start the local development server (binds to http://localhost:3000)
npm run dev
```

### Building for Production

```bash
# Compile client-side bundle to /dist
npm run build
```

---

## 5. API Keys Configuration

API keys are stored exclusively in your browser's `localStorage` and sent directly to the respective official provider endpoints. No keys are transmitted to third-party tracking servers.

### Key Management

1. Click the **API KEYS CONFIGURATION** drawer in the bottom workspace toolbar.
2. Enter your provider keys:

| Provider | Storage Key Name | Acquisition URL |
|---|---|---|
| **Google** | `bonzo-studio-key-GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| **fal.ai** | `bonzo-studio-key-FAL_KEY` | https://fal.ai/dashboard/keys |
| **Replicate** | `bonzo-studio-key-REPLICATE_API_TOKEN` | https://replicate.com/account/api-tokens |
| **OpenAI** | `bonzo-studio-key-OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| **Local SD** | `bonzo-studio-key-LOCAL_SD_URL` | Local Automatic1111 URL (e.g. `http://localhost:7860`) |

3. Click **[SAVE]** for each provider.
4. Click **[TEST]** to verify live network connectivity and model availability.

---

## 6. Browser Support

| Browser | Minimum Version | Notes |
|---|---|---|
| **Google Chrome** | 90+ | Full support (Popups, `BroadcastChannel`, `ResizeObserver`) |
| **Microsoft Edge** | 90+ | Full support |
| **Mozilla Firefox** | 95+ | Full support |
| **Apple Safari** | 15.4+ | Full support |

*Note: Allow pop-ups in your browser settings to enable multi-window standalone workstations (Wildcards, Video Config, and Workflows).*

---

## 7. Studio Interface

```text
+-----------------------------------------------------------------------------------+
| BONZO AI ART DEVZ // STUDIO v2.6   [GENERATION] [EDITING] [ANALYSIS] [VIDEO]     |
+-----------------------------------------------------------------------------------+
|  CONTROL PANEL                     |  INTERACTIVE WORKSPACE                       |
|  - Provider: [GOOGLE/FAL/REPL/OAI] |  +----------------------------------------+  |
|  - Model Selector                  |  |                                        |  |
|  - Aspect Ratio: [1:1, 16:9, 9:16] |  |          GENERATED CANVAS              |  |
|  - Prompt Builder                  |  |          VIEWPORT & METRICS            |  |
|  - Wildcards Quick-Picker          |  |                                        |  |
|  - [GENERATE IMAGE]                |  +----------------------------------------+  |
+-----------------------------------------------------------------------------------+
|  DEBUG CONSOLE // RECHARTS API TELEMETRY (Latency Timeline, Success Rate SLA)     |
+-----------------------------------------------------------------------------------+
|  [ONLINE] PROVIDERS: GOOGLE / FAL / REPLICATE / OPENAI | [PORT: 3000]             |
+-----------------------------------------------------------------------------------+
```

---

## 8. License

MIT License. Developed for high-density generative art exploration and creative workflows.
