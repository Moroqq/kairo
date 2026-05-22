@echo off
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d "%~dp0"
echo Starting OPSCORE dev server...
npm run tauri dev
pause
