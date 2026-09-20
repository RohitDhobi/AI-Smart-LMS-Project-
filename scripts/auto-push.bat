@echo off
:: Auto-push script for Windows
:: Usage: scripts\auto-push.bat

echo 🚀 Auto-push started. Watching for changes...
echo    Press Ctrl+C to stop.
echo.

:loop
:: Check for changes
git status --porcelain >nul 2>&1
if %ERRORLEVEL% neq 0 goto wait

:: Check if there are actually changes
for /f "tokens=*" %%i in ('git status --porcelain') do goto changes
goto wait

:changes
echo %TIME% 📝 Changes detected, committing and pushing...

:: Stage everything
git add -A

:: Get change summary
for /f "tokens=*" %%i in ('git diff --cached --shortstat') do set CHANGES=%%i

:: Commit
git commit -m "Auto-commit: %DATE% %TIME% (%CHANGES%)" 2>nul

:: Push
git push 2>nul
if %ERRORLEVEL% equ 0 (
    echo %TIME% ✅ Pushed successfully!
) else (
    echo %TIME% ❌ Push failed. Will retry next time.
)
echo.

:wait
timeout /t 10 /nobreak >nul
goto loop
