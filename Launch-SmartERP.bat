@echo off
title Smart ERP Web Application
cd /d "%~dp0"

echo ========================================================
echo   Starting Smart ERP Web Application...
echo   Directory: %~dp0
echo ========================================================

:: Check if server is already running on port 3000
netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo Starting Smart ERP server...
    start "Smart ERP Dev Server" /min cmd /k "npm run dev"
    ping 127.0.0.1 -n 3 > nul
)

:: Try opening in native Desktop App window mode using Edge or Chrome
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
    exit
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
    exit
)

start "" http://localhost:3000
exit
