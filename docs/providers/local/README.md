# Lokalne modele — GTX 3070 8GB VRAM (Windows)

Self-hostowany silnik obrazu jako addon obok chmury. Sprzęt: NVIDIA RTX 3070, 8GB VRAM.

## Dwie opcje serwowania

| Narzędzie | API | Typ | Kiedy |
|---|---|---|---|
| **AUTOMATIC1111 / SD WebUI** | `/sdapi/v1` (REST) | prosty, stabilny | domyślny wybór |
| **ComfyUI** | `/prompt` + WebSocket | graf węzłów, potężny | zaawansowane workflow |

Aplikacja już ma stub `local` (`ProviderId 'local'`, klucz `LOCAL_SD_URL`,
domyślnie `http://localhost:7860`) który oczekuje A1111-style `/sdapi/v1`.

## AUTOMATIC1111 (rekomendowany)

GitHub: `AUTOMATIC1111/stable-diffusion-webui`

### Start z API

```bash
# klon + start
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
./webui-user.bat   # Windows; dodaj do webui-user.bat:
# set COMMANDLINE_ARGS=--api --listen --port 7860
```

`--api` włącza REST API. `--listen` pozwala innym hostom (frontend) się łączyć.

### Endpointy /sdapi/v1

| Endpoint | Opis |
|---|---|
| `GET /sdapi/v1/sd-models` | lista załadowanych modeli |
| `POST /sdapi/v1/txt2img` | text-to-image |
| `POST /sdapi/v1/img2img` | image-to-image |
| `GET /sdapi/v1/options` / `POST /sdapi/v1/options` | ustawienia (aktualny model) |

### txt2img

```bash
curl -X POST http://127.0.0.1:7860/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a red apple on white background",
    "negative_prompt": "",
    "width": 512, "height": 512,
    "steps": 20, "cfg_scale": 7,
    "sampler_name": "DPM++ 2M Karras",
    "seed": 42
  }'
# -> { "images": ["base64...", ...] }
```

Odpowiedź: `images` = tablica base64 PNG.

## ComfyUI (alternatywa)

GitHub: `comfyanonymous/ComfyUI`

- API: `POST /prompt` (JSON workflow), wyniki przez WebSocket `ws://127.0.0.1:8188/ws`.
- Bardziej złożone, ale daje dokładną kontrolę nad pipeline (węzły, LoRA, controlnet).

## Modele mieszczące się w 8GB VRAM

| Model | VRAM (przybliżony) | Zalecenie | Uwagi |
|---|---|---|---|
| **SD 1.5** | ~4GB | ✅ świetnie | najlżejszy, tani |
| **DreamShaper** (SD1.5) | ~4GB | ✅ świetnie | stylowy, popularny |
| **SDXL** | ~6-7GB | ✅ ok | wymaga optymalizacji |
| **SDXL Lightning** (4-step) | ~6GB | ✅ bardzo szybki | 4 kroki zamiast 25 |
| **SD 3.5 Medium** | ~7-8GB | ⚠️ na granicy | użyj `--medvram` |
| **Kandinsky 2.2** | ~7GB | ⚠️ ok | multilingual |
| **FLUX Schnell** (fp8/quantized) | ~7-8GB | ⚠️ na granicy | wymaga fp8 + `--medvram` |

### Recommended for 8GB VRAM

1. **SD 1.5 / DreamShaper** — zero problemów, szybkie, mnóstwo community models.
2. **SDXL Lightning** — najlepszy stosunek jakość/szybkość na 8GB (4 kroki).
3. **SDXL (full)** — z `--medvram` jeśli chcesz pełną jakość.
4. **SD 3.5 Medium** — z `--medvram` i cierpliwością.

Flagi `COMMANDLINE_ARGS` dla 8GB: `--medvram` (lub `--lowvram` w skrajnym przypadku).

## Integracja z frontendem

Frontend woła `http://127.0.0.1:7860/sdapi/v1/txt2img` z body jak wyżej.
`LOCAL_SD_URL` w `.env.local`/localStorage pozwala zmienić host/port.
Uwaga CORS: A1111 `--api` domyślnie pozwala na localhost; dla innego originu dodaj `--cors-allow-origins`.

## GitHub repos

- `AUTOMATIC1111/stable-diffusion-webui` — główny WebUI
- `comfyanonymous/ComfyUI` — node-based engine
- `lllyasviel/stable-diffusion-webui-forge` — fork zoptymalizowany pod VRAM
- `vladmandic/automatic` — SD.Next (fork z lepszym UI/API)

## Recommended shortlist (8GB VRAM)

```
1. DreamShaper XL Turbo   (SDXL-turbo, stylowy, szybki)
2. SDXL Lightning 4-step  (najszybszy)
3. SD 1.5 (dowolny fine-tune: RealisticVision, DreamShaper 8)
4. SD 3.5 Medium          (gdy chcesz nowszą architekturę)
5. Kandinsky 2.2          (multilingual RU/EN)
```
