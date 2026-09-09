# BONZO Camera Studio — Plan Techniczny

Osobna, single-user aplikacja do przechwytywania własnej twarzy z webcam i przerabiania jej na mówiącego avatara (lip-sync). Nie jest wbudowana w BONZO AI ART DEVZ — to samodzielny dodatek.

## 1. Cel i zakres

- Kamera webcam widzi twarz użytkownika (getUserMedia).
- Użytkownik nagrywa klip (obraz + głos) albo podaje zdjęcie + tekst/nagranie głosu.
- Aplikacja produkuje mówiący avatar z synchronizacją ust.
- Single-user, localhost-first, zero rejestracji.

## 2. Wybór technologii lipsync (research)

| Opcja | Źródło | Cena | Latencja | Live webcam? | Werdykt |
|---|---|---|---|---|---|
| **Kling Avatar v2** | fal.ai `fal-ai/kling-video/ai-avatar/v2/standard` | **$0.115/s** | ~minuty | nie | ✅ **MVP** — masz wzorzec w `avatar_bp.py` |
| **LivePortrait** | fal.ai `fal-ai/live-portrait` | niska | ~sekundy | **tak** (face animation z wideo) | ✅ **Faza 2** — live webcam |
| **lipsync-2** | sync-labs (Replicate) | $/s | ~minuty | nie | ⚠️ alternatywa, studio-grade |
| **SadTalker** | lokalnie (RTX 3070) | $0 | ~minuty | nie | ⚠️ Faza 3 — darmowe, ale VRAM 8GB |
| **Wav2Lip** | lokalnie (RTX 3070) | $0 | ~sekundy | częściowo | ⚠️ Faza 3 — najszybszy lokalny |

**Decyzja:** MVP na **Kling Avatar v2** (masz klucz fal + gotowy wzorzec w `avatar_bp.py`). Faza 2 dodaje **LivePortrait** dla live webcam.

## 3. Transkrypcja głosu

**Gemini 3.5 Transcribe** (`gemini-3.5-transcribe`) — word-level timestamps. Przydatne do:
- podpisów/napisów do avatara,
- ewentualnej kalibracji lipsync (znajomość czasu każdego słowa).

Ale dla samego Kling Avatar v2 **nie jest wymagane** — Kling sam synchronizuje usta z audio. Transkrypcja to osobny moduł (napisy), nie warunek lipsync.

## 4. Stack

- **Frontend**: React + Vite + TypeScript (spójny z istniejącym BONZO studio)
- **Backend**: FastAPI (Python) — naturalny dla wywołań fal.ai i Gemini (ale możliwy czysty Node)
- **Styl**: ciemny industrialny `#090b10`, 0px radius, JetBrains Mono, bez emoji
- **Klucze**: fal.ai + Gemini w `.env` (backend), nigdy w frontendzie

Dlaczego FastAPI: `avatar_bp.py` już jest w Pythonie (Flask), więc przepisanie na FastAPI jest minimalne; wywołania fal.ai przez `httpx` / `fal-client`.

## 5. Fazy

### Faza 1 — MVP (statyczny portret + głos → avatar)
1. Frontend: wgraj zdjęcie twarzy (drag-drop) + nagraj głos (MediaRecorder) lub wpisz tekst.
2. Backend endpoint `POST /api/avatar/generate`:
   - przyjmuje `image_base64` + `audio` (lub `text` → TTS),
   - woła fal.ai Kling Avatar v2,
   - polling statusu,
   - zwraca URL wideo mp4.
3. Frontend: odtwarzanie `<video>` wyniku + przycisk pobierz.

**Pracochłonność: ~1-2 dni.**

### Faza 2 — Live webcam
1. `getUserMedia({ video: true, audio: true })` — podgląd kamery na żywo.
2. Nagranie klipu wideo (MediaRecorder) — przechwycenie ruchu twarzy.
3. **LivePortrait** (fal.ai) — animacja statycznego zdjęcia ruchem z klipu (face reenactment), albo Kling z klipem jako referencją.
4. Wynik: "przerabiasz siebie" — Twój ruch twarzy napędza avatar.

**Pracochłonność: ~2-3 dni.**

### Faza 3 — Lokalne (opcjonalne, $0)
1. SadTalker / Wav2Lip na RTX 3070 (8GB) — darmowy lipsync lokalnie.
2. Tradeoff: jakość niższa niż Kling, ale zero kosztów i zero rate-limitów.
3. Warto tylko przy dużej objętości renderów.

**Pracochłonność: ~2 dni + czas na model download/konfigurację.**

## 6. Endpointy API (Faza 1)

```
POST /api/avatar/generate
  body: { image_base64: str, audio_base64?: str, text?: str, voice?: str }
  → woła fal.ai Kling Avatar v2
  → zwraca { job_id, status }

GET /api/avatar/status/{job_id}
  → { status: 'pending'|'processing'|'done'|'error', video_url?: str }

POST /api/transcribe
  body: { audio_base64: str }
  → Gemini 3.5 Transcribe
  → { text, words: [{ word, start, end }] }
```

## 7. Struktura katalogów (osobna app)

```
BONZO_camera_studio/
├── frontend/          # React+Vite+TS
│   └── src/
├── backend/           # FastAPI
│   ├── main.py
│   ├── avatar.py      # Kling/LivePortrait integracja
│   └── transcribe.py  # Gemini 3.5 Transcribe
├── .env               # FAL_KEY, GEMINI_API_KEY (gitignored)
└── README.md
```

## 8. Ryzyka i decyzje

- **Kling Avatar v2** wymaga zdjęcia portretowego (nie live wideo) — dlatego Faza 1 to statyczny portret, a live to Faza 2 (LivePortrait).
- **Koszt Kling**: $0.115/s → 10s klip ≈ $1.15. Przy częstym renderowaniu to się sumuje — stąd Faza 3 (lokalne) jako tani fallback.
- **Gemini 3.5 Transcribe** klucz bywa 401 (jak widzieliśmy przy rewrite) — trzymać fallback na lokalny ASR (VoiceMem/FunASR) w razie problemów.
- **LivePortrait** jakość: dobry face reenactment, ale może wymagać kilku prób (seed).

## 9. Rekomendacja kolejności

1. **Faza 1 (Kling Avatar v2)** — najszybszy MVP, masz wzorzec, ~1-2 dni.
2. **Faza 2 (LivePortrait + webcam)** — to jest "kamera widzi i przerabia siebie", ~2-3 dni.
3. **Faza 3 (SadTalker lokalnie)** — tylko jeśli objętość renderów uzasadnia.
