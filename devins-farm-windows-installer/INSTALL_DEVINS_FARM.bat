@echo off
title Devins Farm - Windows Installer
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                                                      ║
echo ║         DEVINS FARM INSTALLER FOR WINDOWS           ║
echo ║                                                      ║
echo ╔══════════════════════════════════════════════════════╝
echo.
echo Welcome to Devins Farm installation!
echo.
echo This will install the complete farm management system
echo on your Windows 10/11 computer.
echo.
echo ══════════════════════════════════════════════════════
echo.

timeout /t 2 >nul

:: Check if running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Not running as administrator
    echo [i] Some features may require admin privileges
    echo.
    timeout /t 2 >nul
)

call windows-installer.bat

