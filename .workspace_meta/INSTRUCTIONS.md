# BONZO AI ART DEVZ // STUDIO - USAGE GUIDE

Detailed operational instructions and user workflow reference for BONZO AI ART DEVZ // STUDIO (v2.6).

---

## 1. Getting Started

1. Launch the application in any modern web browser by navigating to the development or hosted URL (or opening `index.html` via the local server).
2. Locate the **API KEYS CONFIGURATION** drawer at the bottom of the interface.
3. Click the drawer header (or the `[EXPAND]` button) to reveal the credential inputs.
4. Input your API credentials for your desired AI providers:
   - **Google Gemini / Imagen**: Obtain from Google AI Studio.
   - **fal.ai Gateway**: Obtain from your fal.ai developer dashboard.
   - **Replicate**: Obtain from your Replicate account settings.
   - **OpenAI**: Obtain from your OpenAI platform dashboard.
   - **Local SD**: Enter your local WebUI host URL (default `http://localhost:7860`).
5. Click `[SAVE]` next to each configured key.
6. Click `[COLLAPSE]` when finished to maximize canvas screen space.

---

## 2. Testing API Keys & Connectivity

Before submitting generation jobs, verify that your credentials are valid:

1. Expand the **API KEYS CONFIGURATION** drawer.
2. Click the `[TEST]` button next to the relevant provider.
3. Observe the inline status response:
   - `[OK] Connected! X models available` / `[OK] Connected to API Gateway`: Authentication successful.
   - `[ERR] HTTP 401/403 Authentication failed`: Check the key for typos or missing scopes.
4. Active providers will display an `[OK]` indicator in the drawer summary bar.

---

## 3. Image Generation Workflow

Follow this standard pipeline for optimal generation quality:

```text
[PRESET SELECTION] -> [PROVIDER & MODEL] -> [ASPECT RATIO] -> [PROMPT COMPOSITION] -> [GENERATE]
```

### Step-by-Step Instructions:

1. **Select a Style Preset (Optional)**:
   - Click a preset tag (e.g. *Cyberpunk City*, *Dark Fantasy Oils*, *Surrealist Dreamscape*, *Hyperrealistic Portrait*) to automatically load curated lighting, camera, and medium descriptors into your active prompt buffer.

2. **Select Provider and Model**:
   - In the left control panel, choose your target provider:
     - `GOOGLE`: Imagen 3 (Fast, Standard, High Quality)
     - `FAL.AI`: FLUX.1 [dev], FLUX.1 [schnell], FLUX Realism
     - `REPLICATE`: FLUX.1 Dev, Stability SDXL
     - `OPENAI`: DALL-E 3 (HD / Standard)
   - Choose the specific model engine from the dropdown selector.

3. **Configure Generation Parameters**:
   - **Aspect Ratio**: Select `1:1` (Square), `16:9` (Cinematic Landscape), `9:16` (Vertical Mobile), `4:3`, or `3:4`.
   - **Quality Mode**: Standard or High Definition (HD).
   - **Negative Prompt**: Enter concepts to suppress (e.g. `blurry, low quality, artifacts, distorted hands`).
   - **Seed**: Enter a numeric seed to reproduce specific compositions, or leave blank for randomized generations.

4. **Compose the Prompt**:
   - Type your core concept in the prompt textarea.
   - Click `[ENHANCE PROMPT]` to trigger Gemini-powered creative descriptor expansion.

5. **Execute Generation**:
   - Click the primary `[GENERATE IMAGE]` button.
   - Monitor real-time progress indicators. Upon completion, the synthesized image will render in the canvas viewport.

---

## 4. Using the Wildcards & Artist Matrix

The studio contains a curated database of 80+ visual artists, art movements, lighting techniques, and camera profiles.

### Browsing & Adding Artists:

1. Navigate to the **WILDCARDS** panel (in the left controls or via the popout window).
2. Filter artists by category: `CYBERPUNK`, `SURREALISM`, `FANTASY`, `SCI-FI`, `DARK ART`, `ABSTRACT`, `CLASSICAL`, `ANIME`.
3. Use the search input to filter by artist name or medium.
4. Click `[+ ADD TO PROMPT]` on any artist card to automatically inject their signature stylistic keywords into your active prompt.

### Automated Artist Matchmaking with Gemini:

1. Type your concept into the prompt box (e.g. *"haunted abandoned space station with bioluminescent moss"*).
2. Click the `[SUGGEST ARTISTS]` button in the Wildcards panel.
3. Gemini analyzes your semantic prompt and returns 3-4 optimal artist pairings with contextual artistic rationales.
4. Click any recommendation to apply the suggested aesthetic.

---

## 5. Saving and Reusing Custom Styles

You can preserve successful prompt recipes as reusable style presets:

1. After generating an image you like, click the `[SAVE AS STYLE]` button located beneath the canvas.
2. Enter a descriptive title (e.g. *"Ethereal Holographic Noir"*).
3. The preset captures:
   - Positive prompt additives
   - Negative prompt settings
   - Provider & Model preference
   - Aspect ratio setting
4. Access your saved styles anytime in the **STYLE PRESETS** tab or the preset picker ribbon.
5. Saved presets persist across browser sessions in local storage.

---

## 6. Image Editing Tab (Inpainting & Transform)

1. Switch to the **Image Editing** tab in the main navigation.
2. Drag and drop a source image onto the upload canvas (or click to browse files).
3. Enter an edit prompt describing the desired modification (e.g. *"Add a glowing neon visor over the subject's eyes"* or *"Convert background to a rainy cyberpunk alley"*).
4. Click `[EXECUTE IMAGE EDIT]`.
5. The synthesis engine performs semantic transformation while preserving source structural composition.

---

## 7. Image Analysis Tab (Vision Audits)

1. Switch to the **Image Analysis** tab in the main navigation.
2. Upload any reference image.
3. Click `[ANALYZE IMAGE COMPOSITION]`.
4. Gemini Vision performs a full multimodal audit, outputting structured JSON telemetry:
   - **Artistic Medium & Style Classification**
   - **Color Palette Breakdown** (Primary, secondary, and accent hex tones)
   - **Lighting & Atmosphere Assessment** (Key lights, rim lighting, shadow depth)
   - **Camera & Lens Mechanics** (Focal length, aperture approximation, perspective)
   - **Suggested Reverse-Engineered Prompt** for style replication

---

## 8. Real-Time Debug Console & Telemetry

The studio includes an integrated API telemetry console for tracking provider performance, diagnosing errors, and measuring network latency.

### Access & Controls:
- **Toggle Overlay**: Press `Ctrl+\`` (or `Cmd+\``) or click `[DEBUG CONSOLE]` in the bottom telemetry bar.
- **Resize**: Click `[MAXIMIZE]` / `[RESTORE]` to switch between compact and expanded viewport heights.
- **Auto-Scroll**: Toggle `[AUTO-SCROLL: ON/OFF]` to follow streaming logs.

### Console Tabs:

#### 1. [LOG STREAM] Tab:
- Real-time event feed displaying timestamps, provider tags, methods, endpoints, latency values, and HTTP status codes.
- Click any log row to open the **Inspect Payload Drawer** (view full JSON request and response bodies).
- Click `[COPY ENTRY JSON]` on individual entries or `[COPY ALL JSON]` to copy the complete session telemetry.
- Filter by provider (`GOOGLE`, `FAL`, `REPLICATE`, `OPENAI`, `VEO`, `SYSTEM`) or level (`REQ/RES`, `ERR`, `INFO`, `WARN`).

#### 2. [LATENCY & SUCCESS CHARTS] Tab:
- **Latency Timeline**: Real-time multi-line Recharts visualization tracking request duration trends over the active session.
- **Success Rates & Health**: Bar chart comparing per-provider success percentage against the 95% SLA benchmark line.
- **Latency Benchmarks**: Grouped bar visualization comparing Average vs. P95 latency across all integrated backends.
- **Benchmark Probe Ping**: Click `[BENCHMARK PROBE PING]` to dispatch an instant round-trip health check probe.

---

## 9. Multi-Window Modular Workstations

The studio supports multi-monitor workstation setups by detaching tools into standalone browser windows:

| Button | Target Feature | Communication Channel |
|---|---|---|
| **[WILDCARDS]** | Standalone 80+ Artist Library | `postMessage` + `BroadcastChannel` |
| **[VIDEO CONFIG]** | Veo 2.0 Video Parameter Tuner | Cross-window event bus |
| **[WORKFLOWS]** | LiteGraph Node Pipeline Builder | Cross-window event bus |

### How Multi-Window Sync Works:
1. Click `[WILDCARDS]` in the header navigation.
2. Position the detached Wildcards window on a secondary monitor.
3. Clicking `[+ ADD TO PROMPT]` in the floating window instantly transmits the artist keywords to the primary studio window without reloading or losing focus.

---

## 10. LocalStorage Keys Reference

All studio state, credentials, and custom presets are stored under the following browser keys:

| LocalStorage Key | Type | Description |
|---|---|---|
| `bonzo-studio-key-GEMINI_API_KEY` | `string` | Google AI Studio / Gemini API key |
| `bonzo-studio-key-FAL_KEY` | `string` | fal.ai Gateway API access key |
| `bonzo-studio-key-REPLICATE_API_TOKEN` | `string` | Replicate API authentication token |
| `bonzo-studio-key-OPENAI_API_KEY` | `string` | OpenAI platform API key |
| `bonzo-studio-key-LOCAL_SD_URL` | `string` | Local Automatic1111 / Forge WebUI endpoint |
| `bonzo-studio-styles` | `JSON Array` | Persisted custom user style preset registry |

### Resetting Storage:
To reset all keys and cached state, run the following in your browser's Developer Tools Console (`F12`):

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('bonzo-studio-'))
  .forEach(k => localStorage.removeItem(k));
console.log('[BONZO STUDIO] All credentials and custom styles cleared.');
```
