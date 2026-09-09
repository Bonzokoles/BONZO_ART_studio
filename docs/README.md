# BONZO AI ART DEVZ — Provider & Addon Documentation

Centralny indeks dokumentacji dostawców i lokalnych silników generatywnych.

## Struktura

```
docs/
├── README.md                 <- ten plik (indeks)
├── ARCHITECTURE.md           <- jak providerzy łączą się w jedną aplikację
└── providers/
    ├── replicate/README.md   <- Replicate API (official + community models)
    ├── fal/README.md         <- fal.ai API (queue, SDK, 1000+ modeli)
    ├── local/README.md       <- lokalne modele na GTX 3070 8GB (A1111 / ComfyUI)
    ├── google/README.md      <- Google Gemini / Nano Banana / Veo
    └── openai/README.md      <- OpenAI DALL-E
```

## Zasada "własne foldery"

Każdy dostawca = jeden folder z własnym `README.md`, który dokumentuje:
- **autentykację** (dokładny nagłówek, zmienna env, format klucza)
- **endpointy** (curl + odpowiedź JSON)
- **tryby** (sync vs async, polling, webhooki)
- **modele** (lista z kosztami i przypadkami użycia)
- **integrację lokalną** (jeśli dostawca ma opcję self-host)

Nowy dostawca = nowy folder w `docs/providers/` + wpis w rejestrze `MODELS` i `MODEL_CATALOG`.

## Szybki start

- Chcesz podpiąć nowy model Replicate? → `providers/replicate/README.md`
- Chcesz odpalić lokalne SD na GPU? → `providers/local/README.md`
- Chcesz zrozumieć, jak to się składa? → `ARCHITECTURE.md`
