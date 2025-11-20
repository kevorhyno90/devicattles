@echo off
setlocal EnableDelayedExpansion

:: Devins Farm - Windows 10 Installer
:: Self-extracting installer for Windows

title Devins Farm Installer

color 0A
cls

echo.
echo ========================================================
echo      DEVINS FARM - Windows 10 Installer
echo      Comprehensive Farm Management System
echo ========================================================
echo.
echo      Version: 1.0.0
echo      Build Date: %date%
echo.
echo ========================================================
echo.

:: Check for Python
echo [1/5] Checking system requirements...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [X] Python 3 is not installed!
    echo.
    echo Please install Python 3 from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)
echo [OK] Python 3 detected
timeout /t 1 >nul

:: Set installation directory
set "INSTALL_DIR=%LOCALAPPDATA%\DevinsFarm"
echo.
echo [2/5] Installation directory: %INSTALL_DIR%

:: Create installation directory
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
)

:: Extract files (this section will be generated dynamically)
echo.
echo [3/5] Extracting application files...

:: Copy all files from current directory
xcopy /E /I /Y /Q "%~dp0devins-farm-offline-installer\*" "%INSTALL_DIR%\" >nul
if errorlevel 1 (
    echo [X] Failed to extract files
    pause
    exit /b 1
)
echo [OK] Files extracted successfully
timeout /t 1 >nul

:: Create desktop shortcut
echo.
echo [4/5] Creating shortcuts...

:: Create launcher script
(
echo @echo off
echo title Devins Farm Server
echo cd /d "%INSTALL_DIR%"
echo cls
echo echo ========================================
echo echo   DEVINS FARM SERVER RUNNING
echo echo ========================================
echo echo.
echo echo Server URL: http://localhost:8080
echo echo.
echo echo Open this URL in your browser:
echo echo   Chrome, Edge, or Firefox
echo echo.
echo echo To install on Android:
echo echo   1. Connect phone to same WiFi
echo echo   2. Find your PC's IP address: ipconfig
echo echo   3. Open http://YOUR_IP:8080 on phone
echo echo   4. Tap menu ^(⋮^) -^> Install app
echo echo.
echo echo Press Ctrl+C to stop the server
echo echo ========================================
echo echo.
echo start http://localhost:8080
echo python -m http.server 8080
echo pause
) > "%INSTALL_DIR%\Launch Devins Farm.bat"

:: Create desktop shortcut
set "SHORTCUT=%USERPROFILE%\Desktop\Devins Farm.lnk"
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%SHORTCUT%'); $SC.TargetPath = '%INSTALL_DIR%\Launch Devins Farm.bat'; $SC.WorkingDirectory = '%INSTALL_DIR%'; $SC.IconLocation = 'shell32.dll,13'; $SC.Description = 'Devins Farm Management System'; $SC.Save()" >nul 2>&1

:: Create Start Menu shortcut
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Devins Farm.lnk"
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%STARTMENU%'); $SC.TargetPath = '%INSTALL_DIR%\Launch Devins Farm.bat'; $SC.WorkingDirectory = '%INSTALL_DIR%'; $SC.IconLocation = 'shell32.dll,13'; $SC.Description = 'Devins Farm Management System'; $SC.Save()" >nul 2>&1

echo [OK] Shortcuts created
timeout /t 1 >nul

:: Create uninstaller
echo.
echo [5/5] Creating uninstaller...
(
echo @echo off
echo title Uninstall Devins Farm
echo echo.
echo echo Are you sure you want to uninstall Devins Farm?
echo echo This will remove all program files but keep your data.
echo echo.
echo pause
echo echo.
echo echo Removing program files...
echo rd /s /q "%INSTALL_DIR%"
echo del "%USERPROFILE%\Desktop\Devins Farm.lnk" 2^>nul
echo del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Devins Farm.lnk" 2^>nul
echo echo.
echo echo Devins Farm has been uninstalled.
echo echo.
echo pause
) > "%INSTALL_DIR%\Uninstall.bat"

echo [OK] Uninstaller created
timeout /t 1 >nul

:: Installation complete
cls
color 0A
echo.
echo ========================================================
echo      INSTALLATION COMPLETE!
echo ========================================================
echo.
echo Devins Farm has been installed successfully!
echo.
echo Installation location: %INSTALL_DIR%
echo.
echo Shortcuts created:
echo   - Desktop: Devins Farm
echo   - Start Menu: Devins Farm
echo.
echo ========================================================
echo.
echo How to use:
echo.
echo   1. Click "Devins Farm" icon on your desktop
echo   2. Server will start automatically
echo   3. Browser opens to http://localhost:8080
echo   4. Install as PWA for best experience
echo.
echo For Android:
echo   1. Click the desktop icon to start server
echo   2. Connect Android to same WiFi
echo   3. Find your PC IP: ipconfig
echo   4. Open http://YOUR_IP:8080 on phone
echo   5. Tap menu (⋮) -^> Install app
echo.
echo ========================================================
echo.
echo Press any key to launch Devins Farm now...
pause >nul

:: Launch the application
start "" "%INSTALL_DIR%\Launch Devins Farm.bat"

exit /b 0
