# TASK 2 — Pi: Workflow Editor fixes (przegląd kodu TASK 1)

## Kontekst

Kontynuacja `docs/TASK_PI_workflow-editing-analysis.md`. Zaimplementowałeś LiteGraph.js workflow editor w `services/workflowHTML.ts` (566 linii) + odpięcie Image Editing od Gemini. Build przechodzi (`tsc --noEmit` + `bun run build`). Teraz napraw 3 błędy znalezione w review.

## Problem 1 — KRYTYCZNY: niezgodność prefiksu kluczy localStorage

`services/workflowHTML.ts` (funkcja `getKey`, ~linia 330) czyta:
```js
localStorage.getItem('bonzo-key-' + name)
```
ale `services/keyStorage.ts` (linia 3) zapisuje klucze pod:
```ts
export const KEY_PREFIX = 'bonzo-studio-key-';
```

**Efekt:** workflow editor nigdy nie odczyta kluczy API → każde RUN kończy się „No GEMINI_API_KEY".

**Napraw:**
1. Ujednolić prefiks na `bonzo-studio-key-` w `workflowHTML.ts`.
2. Zweryfikować, czy popout window (otwierany przez `window.open`) ma w ogóle dostęp do `localStorage` (okno z `about:blank` + `<base href>` może blokować localStorage — SecurityError). Jeśli blokuje: przekazuj klucze z okna głównego przez `postMessage` (główna aplikacja ma klucze w `keyStorage.ts`), zamiast czytać localStorage w popoucie.

**Weryfikacja:** RUN workflow z realnym kluczem generuje obraz (bez błędu klucza).

## Problem 2 — Offline: zbinduj LiteGraph z npm zamiast CDN

`workflowHTML.ts` ładuje LiteGraph z `https://cdn.jsdelivr.net/npm/litegraph.js@0.7.18/...` (linie 13 i 121). Paczka `litegraph.js` jest już w `package.json`, ale nieużywana.

**Napraw:** skopiuj `node_modules/litegraph.js/build/litegraph.min.js` + `css/litegraph.css` do `public/litegraph/` (albo referuj przez Vite import) i ładuj lokalnie. Zero zależności od internetu.

**Weryfikacja:** workflow editor działa po odcięciu internetu (serwuj z Vite, nie z CDN).

## Problem 3 — Async execution: popraw wykonywanie grafu

`onExecute` w `BonzoKSampler` i `BonzoInpaint` jest `async`, ale LiteGraph wykonuje węzły synchronicznie przez `runStep()`. `runWorkflow()` (linia ~509) robi tylko `graph.start()` + pętlę pollingu `graph.status` — nie czeka na async `onExecute`, więc obraz nie dociera do węzłów niżej.

**Napraw:** zaimplementuj właściwe wykonanie grafu:
1. Topologicznie posortuj węzły (LiteGraph `graph.computeExecutionOrder()`).
2. Wykonuj węzły po kolei, `await`-ując async `onExecute`.
3. Propaguj dane wyjściowe do połączonych wejść ręcznie (nie polegaj na synchronicznym `runStep`).
4. Node `BonzoEnhancer` zostaje stubem (nie dotykaj — to obszar innego agenta).

**Weryfikacja:** RUN workflow `Prompt → Checkpoint → KSampler → Output` realnie produkuje obraz w węźle Output (nie „undefined"/pusty).

## DoD

1. `tsc --noEmit` — zero błędów.
2. `bun run build` — przechodzi.
3. Workflow RUN generuje obraz z kluczem z localStorage (po fixie prefiksu).
4. LiteGraph ładowany lokalnie (brak CDN).
5. Design system zachowany: 0px radius, akcent `#d4a574`, zero cieni/gradientów, font mono.
6. Nie dotykaj post-processingu (enhancer) ani wideo — to obszar innego agenta.
