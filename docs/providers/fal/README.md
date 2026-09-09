# fal.ai — Integration Guide

## Autentykacja

- **Zmienna**: `FAL_KEY`
- **Nagłówek**: `Authorization: Key $FAL_KEY`
- **Źródło klucza**: https://fal.ai/dashboard/keys
- **Uwaga**: format klucza to `Key <key>`, NIE `Bearer`. To częsta pomyłka.

## Endpointy

fal.ai ma **1000+ modeli** przez jeden, ujednolicony endpoint. Wzorzec:

```
POST https://fal.run/{model_id}
POST https://queue.fal.run/{model_id}   # async queue
```

`{model_id}` to np. `fal-ai/nano-banana-2`, `fal-ai/flux/schnell`, `fal-ai/flux-pro/v1.1-ultra`.

### Sync (fal.run)

```bash
curl -X POST https://fal.run/fal-ai/nano-banana-2 \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a sunset over mountains"}'
```

Odpowiedź zawiera `images[0].url` (URL obrazu) lub `images[0].url` w obiekcie.

### Async (queue.fal.run)

```bash
# submit — zwraca request_id
curl -X POST https://queue.fal.run/fal-ai/flux/schnell \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "..."}'
# -> { "status": "IN_QUEUE", "request_id": "764cabcf-...", "queue_position": 2 }

# status
curl "https://queue.fal.run/fal-ai/flux/schnell/requests/{request_id}/status" \
  -H "Authorization: Key $FAL_KEY"
# -> status: IN_QUEUE | IN_PROGRESS | COMPLETED

# result
curl "https://queue.fal.run/fal-ai/flux/schnell/requests/{request_id}" \
  -H "Authorization: Key $FAL_KEY"
```

Statusy: `IN_QUEUE` → `IN_PROGRESS` → `COMPLETED`.

## SDK / GitHub

| Repo | Opis |
|---|---|
| `fal-ai/fal-js` | JS/TS client (`npm i @fal-ai/client`) |
| `fal-ai/fal` | Python client (`pip install fal`) |

### JS client

```js
import { fal } from "@fal-ai/client";
fal.config({ credentials: "FAL_KEY" });
const result = await fal.subscribe("fal-ai/nano-banana-2", {
  input: { prompt: "a sunset over mountains" },
});
console.log(result.data.images[0].url);
```

`fal.subscribe` = wygodne połączenie submit + auto-polling. `fal.run` = sync.
`fal.queue.status` / `fal.queue.result` = ręczny async.

## Proxy (ważne dla frontendu)

fal client działa w przeglądarce, ale **nie zaleca się trzymania klucza w kodzie klienta**.
fal oferuje plug-and-play proxy dla Next.js i innych frameworków. W naszej app używamy
**Vite proxy** (`/api-fal` i `/api-fal-rest` w `vite.config.ts`), żeby nie wołać fal.run
bezpośrednio z przeglądarki na localhost (CORS + klucz).

## Modele obrazu (przykłady)

- `fal-ai/flux/schnell` — najszybszy FLUX ($0.003)
- `fal-ai/flux-pro/v1.1` — SOTA fotorealizm ($0.05)
- `fal-ai/flux-pro/v1.1-ultra` — max jakość ($0.06)
- `fal-ai/nano-banana-2` — Google Nano Banana 2 przez fal
- `fal-ai/recraft-v3`, `fal-ai/ideogram/v3`, `fal-ai/stable-diffusion-v35-large`

## Lokalne modele

fal.ai jest **cloud-only** — nie ma oficjalnego self-host. Ale:
- `fal Serverless` pozwala deployować **własne** modele na ich infra (Python `fal.App`).
- `fal Compute` = dedykowane GPU z SSH (trening/fine-tuning), nie inference endpoint.
- Dla lokalnego silnika na GTX 3070 użyj A1111/ComfyUI — patrz `../local/README.md`.

## Verified endpoints

| Komenda | Status |
|---|---|
| `POST https://fal.run/fal-ai/flux/schnell` | HTTP 200 |
| `POST https://fal.run/fal-ai/flux/dev` | HTTP 200 |
| `POST https://fal.run/fal-ai/flux-pro/v1.1` | HTTP 200 |
| `POST https://fal.run/fal-ai/recraft-v3` | HTTP 200 |
| `POST https://fal.run/fal-ai/flux-pro/v1.1-ultra` | HTTP 200 |
| `POST https://fal.run/fal-ai/ideogram/v3` | HTTP 200 |
| `GET https://fal.run/api/models` (nieistniejący endpoint) | HTTP 404 "Application not found" |
