# Replicate — Integration Guide

## Autentykacja

- **Zmienna**: `REPLICATE_API_TOKEN`
- **Nagłówek**: `Authorization: Bearer $REPLICATE_API_TOKEN` (działa też starsze `Authorization: Token $REPLICATE_API_TOKEN`)
- **Źródło klucza**: https://replicate.com/account/api-tokens
- **Format**: prefiks `r8_...`

## Trzy endpointy tworzenia predykcji

Replicate rozróżnia trzy typy modeli — każdy ma własny endpoint:

| Typ modelu | Endpoint | Pinning wersji |
|---|---|---|
| **Community** | `POST /v1/predictions` | wymagany `version` (64-znakowy hash) |
| **Official** | `POST /v1/models/{owner}/{name}/predictions` | brak (stable API) |
| **Deployment** | `POST /v1/deployments/{owner}/{name}/predictions` | brak |

Od 2025-08-05 `POST /v1/predictions` przyjmuje też `owner/name` dla official models,
ale stary endpoint `models/{owner}/{name}/predictions` nadal działa — tego używa kod.

### Community model (pinned version)

```bash
curl -s -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    "input": { "prompt": "a red apple", "width": 512, "height": 512 }
  }'
```

### Official model (bez wersji)

```bash
curl -s -X POST https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "input": { "prompt": "a red apple", "width": 512, "height": 512 } }'
```

## Sync vs Async

| Tryb | Mechanizm | Kiedy |
|---|---|---|
| **Sync** | nagłówek `Prefer: wait` (domyślnie 60s) | szybkie modele, real-time |
| **Async** (domyślny) | zwraca `id`, status `starting`; polling `urls.get` | długie zadania (video) |

- `Prefer: wait=10` — trzyma HTTP otwarte 10s (nie mylić z deadline).
- `Cancel-After: 1m30s` — deadline predykcji.

### Polling (async)

```bash
# utwórz -> zapisz pred.id
curl -s https://api.replicate.com/v1/predictions/{prediction_id} \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN"
# powtarzaj aż status = succeeded / failed / canceled
```

### Webhook

`POST /v1/predictions` z `webhook` + `webhook_events_filter`.
Weryfikacja podpisu: `X-Webhook-Signature` = HMAC-SHA256 z `WEBHOOK_SECRET`
(`GET /v1/webhooks/default/secret`).

## Rate limits

- `create prediction`: 600 req/min
- pozostałe endpointy: 3000 req/min
- 429 → `{"detail":"Request was throttled. Expected available in 1 second."}`

## SDK / GitHub

| Repo | Opis |
|---|---|
| `replicate/replicate-javascript` | oficjalny JS/TS SDK (`npm i replicate`) |
| `replicate/replicate-python` | oficjalny Python SDK (`pip install replicate`) |
| `replicate/cog` | pakowanie modeli w kontenery (self-host / push) |

## Lokalne modele (GTX 3070 8GB)

Replicate jest **cloud-first**, ale:
1. **Cog** (`replicate/cog`) — pakujesz model w kontener Docker i:
   - pushujesz na Replicate (community model), albo
   - uruchamiasz lokalnie: `cog predict -i prompt="..."`.
2. **ComfyUI** — Replicate ma oficjalny guide `docs/guides/extend/comfyui` — eksport workflow do API.

Modele mieszczące się w 8GB VRAM lokalnie: SD 1.5, SDXL, SD 3.5 Medium, FLUX Schnell (fp8), DreamShaper, SDXL Lightning. Pełna lista: `../local/README.md`.

## Verified endpoints

| Komenda | Status |
|---|---|
| `GET /v1/models/nvidia/sana` | HTTP 200 |
| `GET /v1/models/bytedance/sdxl-lightning-4step` | HTTP 200 |
| `GET /v1/models/luma/photon-flash` | HTTP 200 |
| `GET /v1/models/ai-forever/kandinsky-2.2` | HTTP 200 |
| `GET /v1/models/lucataco/dreamshaper-xl-turbo` | HTTP 200 |
| `POST /v1/models/nvidia/sana/predictions` (community przez official endpoint) | HTTP 404 |
| `POST /v1/predictions` (community, pinned version) | HTTP 200 → status `starting` → `succeeded` |
| `POST /v1/predictions/{id}/cancel` | HTTP 200 |
