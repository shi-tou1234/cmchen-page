@echo off
title cmchen page - dev server
cd /d "%~dp0"

echo ============================================
echo   cmchen page - local dev server
echo   URL : http://localhost:5173
echo   STOP: press Ctrl+C in this window
echo ============================================
echo.

if not exist "node_modules" (
  echo [setup] first run - installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo [error] npm install failed. Check Node.js and network, then retry.
    pause
    exit /b 1
  )
  echo.
)

echo [start] launching dev server, browser will open automatically...
start "" cmd /c "timeout /t 3 /nobreak >nul && start """" http://localhost:5173"
call npm run dev

echo.
echo [done] server stopped.
pause
