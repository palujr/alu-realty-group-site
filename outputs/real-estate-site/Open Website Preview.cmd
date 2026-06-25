@echo off
set "SITE_URL=http://127.0.0.1:4174/"
set "SERVER_SCRIPT=%~dp0..\..\work\serve-site.ps1"

start "Real Estate Website Preview Server" powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%SERVER_SCRIPT%"
timeout /t 2 /nobreak >nul
start "" "%SITE_URL%"
