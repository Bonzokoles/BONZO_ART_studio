# BONZO NLE: FFmpeg Render Engine (Backend)

Ten dokument opisuje architekturę serwera `uploadServer.ts`, który oprócz zapisywania plików na dysk, funkcjonuje jako silnik orkiestracji wideo (NLE Compiler).

## Zastosowanie
Aplikacja frontendowa Creative AI Studio zbudowana w React (Vite) korzysta z własnej Osi Czasu NLE (TimelineStudio). Każdy klip wideo czy audio leżący na ścieżce (Track) ma zdefiniowany czas rozpoczęcia (`startTime`) i długość trwania (`duration`).
Plik `uploadServer.ts` przyjmuje JSON z układem osi czasu i dokonuje transformacji wizualnej, wypluwając ostateczny render `.mp4`.

## Mechanika Filter Complex
Zamiast tradycyjnego demuxera `concat` (który nie radzi sobie ze spacjami, lukami w czasie i warstwami), użyliśmy zaawansowanej macierzy filtrów FFmpeg (`-filter_complex`):

1. **Podkład Base**: Na podstawie wyliczonego `maxDuration` generator komend tworzy niewidoczne czarne wideo (base canvas) o rozdzielczości 1920x1080 z FPS ustawionym na 30.
2. **Video Scaling & Setpts**: Każdy klip wideo przechodzi przez filtr `scale` by zmieścić się w proporcjach oraz `setpts`, który przesuwa jego czas wewnętrzny do tego ustawionego na głównej Osi Czasu (`STARTPTS+startTime/TB`). 
3. **Audio Delay**: Ścieżki audio używają `adelay`, aby precyzyjnie zacząć odtwarzanie we wskazanym momencie.
4. **Overlaying**: Kolejne klipy (ścieżki wyższe w hierarchii) naklejane są na tło bazowe filtrem `overlay` działającym w funkcji czasu `between(t, start, start+duration)`.

## Przykład zapytania z Frontendu

```javascript
fetch("http://localhost:3219/api/render-timeline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        timelineState: {
            clips: [
                { source: "/img/artists/v1.mp4", startTime: 0, duration: 5, trackId: "v1" },
                { source: "/img/artists/voice.mp3", startTime: 1.5, duration: 2, trackId: "a1" }
            ]
        }
    })
})
```

## Wyjście / Wynik (Output)
Wynik generacji wyrzucany jest jako zoptymalizowany plik H264/AAC z domieszką skalowania zachowującego proporcje. Gotowe pliki trafiają do folderu:
`/output/render_final_{TIMESTAMP}.mp4` w głównym katalogu projektu.
Silnik sam w sobie jest blokowany przed awarią poprzez bindowanie się pod osobnym procesem (Node `exec`), dlatego aplikacja nie zawiesi się w trakcie kompilacji wideo.

**Bonzo Devz (C) 2026**
