# Creative AI Studio (BONZO_creative_ai_studio)
## Historia Tworzenia i Architektura Projektu

### Kontekst Powstania
Projekt powstał jako zaawansowane środowisko operacyjne (NLE) na zlecenie Bonzo. Aplikacja oparta na stosie: React, Vite, TS, Bun oraz Node.js. Narzędzie dedykowane zautomatyzowanej produkcji AI (Audio, Captions, Obraz, Wideo), spięte z architekturą orkiestracyjną. System posiada własne rozwiązania wstrzykiwania kodu (hot-module) i generuje pełnoprawne zasoby wideo przy wykorzystaniu asynchronicznych endpointów.

### Najważniejsze Moduły i Kamienie Milowe

1. **Struktura Core UI (Toolbar i System Okien):**
   - Skonstruowano modułowy pasek nawigacji oparty na React.
   - Moduł `windowManager.ts` przejął odpowiedzialność za bezstanowe "pływające okna" (pop-upy) dla kluczowych narzędzi (Wildcards, Audio Studio).
   - Osiągnięto wymianę danych między oknami przy użyciu `postMessage` dla zdarzeń `BONZO_TIMELINE_ADD_ASSET`.

2. **Wildcards i Zarządzanie Promptami:**
   - Zaprojektowano system "Clipboard", trzymający bazę tokenów dla AI oraz umożliwiający szybkie rzucanie na Oś Czasu i wywoływanie instrukcji.

3. **Audio & Captions Studio (Fioletowo-szary UI):**
   - Zastąpiono dawny, redundatny przycisk [VIDEO CONFIG] zaawansowanym interfejsem generowania głosu, efektów dźwiękowych oraz napisów.
   - Zaprogramowano **Globalny Player** odtwarzający audio bezpośrednio wewnątrz Pop-upu, z dynamicznym paskiem czasu i minimalistycznym kontrolerem głośności.
   - Płynny przesył przygotowanych kompozycji wprost na ścieżkę Timeline!

4. **FFmpeg NLE Engine (Backend):**
   - Na serwerze `uploadServer.ts` (port 3219) powołano do życia zaawansowany kompilator FFmpeg.
   - Zastosowano logikę `-filter_complex` zamiast trywialnego `concat`. System interpretuje strukturę JSON z Osi Czasu (gdzie znajdują się opóźnienia, czas wejścia oraz tracki), by idealnie skomponować całą oś w profesjonalnie wyglądający plik MP4 kodowany w h264. Render odpala się asynchronicznie odblokowując główny proces serwera (użyto w tym celu Node `exec`).

5. **Aesthetics (Styl Bonzo):**
   - Bezwzględne zachowanie industrialnego kodu wizualnego: `border-radius: 0`, głębokie czernie `#0b0d12` kontrastujące z technikaliami fioletów (`#8b5cf6`) i neonów. Zero cieni i niepotrzebnego wypełnienia. Tylko kanciasty pragmatyzm (Creative Tools Aesthetic).

### Lokalizacje Krytyczne
- Repozytorium: `S:\BONZO_creative_ai_studio`
- Backupów można szukać: `R:\backups\creative_ai_studio`
- Dokumentacja FFmpeg: `README_NLE_FFMPEG.md`
- Backend API (Renderowanie NLE): `uploadServer.ts` (w port: 3219)
- Meta Workspace: `S:\BONZO_creative_ai_studio\.workspace_meta\`
