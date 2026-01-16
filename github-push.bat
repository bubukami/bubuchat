@echo off
:: GitHub Push Update Script Launcher
:: For Windows Server

cls
========================================
echo     GitHub Push Update Script
echo     Project: bubuchat
echo     Repo: git@github.com:bubukami/bubuchat.git
========================================
echo.
echo Starting PowerShell script now...
echo.

:: Run PowerShell script, skip execution policy check
powershell.exe -ExecutionPolicy Bypass -File "%~dp0github-push.ps1"

echo.
echo Script execution completed, press any key to exit...
pause > nul