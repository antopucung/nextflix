@echo off
setlocal ENABLEDELAYEDEXPANSION
cd /d %~dp0\..
PowerShell -ExecutionPolicy Bypass -File .\scripts\start-nextflix-win.ps1
endlocal 