# Architecture Decision Records (ADR)

## ADR-001: Wybór struktury Workspace i integracji ze Stitch & Antigravity

- **Status:** Zatwierdzony
- **Data:** 2026-08-11
- **Kontekst:** Potrzebujemy ustrukturyzowanego podejścia do szybkiego tworzenia makiet i ich integracji w kodzie produkcyjnym.
- **Decyzja:** Wykorzystujemy Stitch do projektowania szybkich makiet i wariantów wizualnych HTML/CSS, a następnie zlecamy Antigravity (poprzez subagentów) pocięcie ich i wdrożenie jako bezpieczne komponenty React (Next.js/Astro) z pełnym typowaniem TypeScript.
- **Konsekwencje:** Szybszy czas wdrożenia UI, zachowanie wysokiej jakości inżynieryjnej i spójność designu z `GEMINI.md`.
