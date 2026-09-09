# OpenAI DALL-E — Integration Guide

## Autentykacja

- **Zmienna**: `OPENAI_API_KEY`
- **Nagłówek**: `Authorization: Bearer $OPENAI_API_KEY`
- **Źródło klucza**: https://platform.openai.com/api-keys

## Endpoint

```
POST https://api.openai.com/v1/images/generations
```

### Generacja

```bash
curl -X POST https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "a red apple on white background",
    "n": 1,
    "size": "1024x1024",
    "response_format": "b64_json"
  }'
# -> { "data": [{ "b64_json": "..." }] }
```

## Modele

| Model | Outputy | Seed | Negative prompt |
|---|---|---|---|
| `dall-e-3` | 1 | ❌ | ❌ |
| `dall-e-2` | do 4 | ❌ | ❌ |

Rozmiary: `1024x1024`, `1792x1024` (landscape), `1024x1792` (portrait).

## Lokalne modele

OpenAI nie ma self-host. Lokalnie użyj A1111/ComfyUI — patrz `../local/README.md`.

## Verified endpoints

| Komenda | Status |
|---|---|
| klucz `OPENAI_API_KEY` obecny w `.env.local` | potwierdzony (164 znaki) |
