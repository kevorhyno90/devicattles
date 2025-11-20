@echo off
echo ╔════════════════════════════════════════════════════╗
echo ║     Devins Farm - Offline Installer               ║
echo ║     Comprehensive Farm Management System           ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python 3 is required but not installed.
    echo Please install Python 3 from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

set PORT=8080

echo 🌐 Starting Devins Farm server...
echo 📍 Server will run on: http://localhost:%PORT%
echo.
echo 📱 To access on Android:
echo    1. Connect your phone to the same WiFi as this computer
echo    2. Find your computer's IP address:
echo       - Open Command Prompt and type: ipconfig
echo       - Look for "IPv4 Address" (usually starts with 192.168...)
echo    3. Open Chrome on your phone and go to: http://YOUR_IP:%PORT%
echo.
echo 🔌 To install on Android:
echo    1. Open Chrome on your Android device
echo    2. Visit the URL above
echo    3. Tap menu (⋮) → 'Install app' or 'Add to Home screen'
echo    4. The app will work offline after installation!
echo.
echo Press Ctrl+C to stop the server
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start the server
python -m http.server %PORT%
pause
