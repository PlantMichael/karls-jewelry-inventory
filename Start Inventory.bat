@echo off
title Karl's Jewelry Inventory
cd /d "%~dp0"

echo Backing up the inventory...
call npm run backup --silent

echo.
echo Starting the inventory app...
echo.
echo Leave this black window open while you use the app.
echo Closing it shuts the app down.
echo.

start "" http://localhost:5173

call npm run dev

echo.
echo The app stopped. Press any key to close this window.
pause >nul
