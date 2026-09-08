@echo off
cd /d "S:\BONZO_creative_ai_studio"
echo.
echo   BONZO AI ART DEVZ // CREATIVE AI STUDIO v2.6
echo   --------------------------------------------------
echo   Providers: Google / fal.ai / Replicate / OpenAI
echo.
echo   Starting on http://localhost:5853
echo   Press Ctrl+C to stop
echo.
start /B bun run uploadServer.ts
start "" http://localhost:5853
call npm run dev
pause
