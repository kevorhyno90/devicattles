#!/bin/bash

# Create Windows EXE Installer Package
# This script creates a self-extracting executable for Windows 10

echo "🪟 Creating Windows 10 EXE Installer..."
echo ""

# Create package directory
PACKAGE_DIR="devins-farm-windows-installer"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

echo "📦 Step 1: Copying installer files..."
cp -r devins-farm-offline-installer "$PACKAGE_DIR/"
cp windows-installer.bat "$PACKAGE_DIR/"
cp windows-installer.ps1 "$PACKAGE_DIR/"

echo ""
echo "📄 Step 2: Creating README for Windows users..."

cat > "$PACKAGE_DIR/WINDOWS_INSTALL.txt" << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║           DEVINS FARM - WINDOWS 10 INSTALLER                      ║
║        Comprehensive Farm Management System                       ║
╚═══════════════════════════════════════════════════════════════════╝

🚀 INSTALLATION METHODS:

METHOD 1: AUTOMATIC INSTALLATION (Recommended)
   1. Double-click "windows-installer.bat"
   2. Follow the on-screen instructions
   3. Desktop shortcut will be created automatically
   4. Done!

METHOD 2: POWERSHELL INSTALLATION (Advanced)
   1. Right-click "windows-installer.ps1"
   2. Select "Run with PowerShell"
   3. Follow the prompts
   4. More detailed progress messages

METHOD 3: MANUAL INSTALLATION
   1. Copy "devins-farm-offline-installer" folder to:
      C:\Users\YOUR_USERNAME\AppData\Local\DevinsFarm
   2. Create a shortcut to "install.bat" on your desktop
   3. Run the shortcut

📋 REQUIREMENTS:

   ✓ Windows 10 or Windows 11
   ✓ Python 3.6 or higher
   ✓ 100 MB free disk space
   ✓ Administrator privileges (for creating shortcuts)

🔧 INSTALLING PYTHON (if not installed):

   1. Visit: https://www.python.org/downloads/
   2. Download Python 3.x for Windows
   3. Run the installer
   4. ⚠️ IMPORTANT: Check "Add Python to PATH"
   5. Click "Install Now"
   6. Wait for installation to complete
   7. Restart your computer
   8. Run the Devins Farm installer again

📱 INSTALLING ON ANDROID:

   After installing on your Windows PC:
   
   1. Launch "Devins Farm" from desktop
   2. Note the URL displayed (http://localhost:8080)
   3. Find your PC's IP address:
      - Press Win+R
      - Type "cmd" and press Enter
      - Type "ipconfig" and press Enter
      - Look for "IPv4 Address" (e.g., 192.168.1.100)
   4. On your Android phone:
      - Connect to same WiFi as your PC
      - Open Chrome browser
      - Type: http://YOUR_PC_IP:8080
      - Tap menu (⋮) → "Install app"
   5. Done! App works offline on phone!

🎯 WHAT GETS INSTALLED:

   Installation Location:
   C:\Users\YOUR_USERNAME\AppData\Local\DevinsFarm
   
   Shortcuts Created:
   - Desktop: Devins Farm
   - Start Menu: Devins Farm
   
   Files Installed:
   - Complete web application (~1.5 MB)
   - Launcher script
   - Uninstaller
   - Documentation

🗑️ UNINSTALLING:

   Method 1:
   - Go to installation folder
   - Run "Uninstall.bat" or "Uninstall.ps1"
   
   Method 2:
   - Delete the desktop shortcut
   - Delete folder: C:\Users\YOUR_USERNAME\AppData\Local\DevinsFarm

🔧 TROUBLESHOOTING:

   Q: "Python is not recognized" error?
   A: Python is not installed or not in PATH.
      Install Python and make sure to check "Add Python to PATH"
   
   Q: Installer won't run?
   A: Right-click → "Run as administrator"
   
   Q: Can't access from Android?
   A: Make sure:
      - Both devices on same WiFi
      - Windows Firewall allows Python (port 8080)
      - Using correct IP address
   
   Q: How to allow Python through firewall?
   A: Windows will prompt when you first run the app.
      Click "Allow access" when prompted.

✨ FEATURES:

   ✓ Animal Management
   ✓ Photo Gallery (camera access)
   ✓ QR Code Generation
   ✓ Task Management
   ✓ Financial Tracking
   ✓ Calendar View
   ✓ Reports & Analytics
   ✓ Dark Mode
   ✓ Offline Support
   ✓ Works on Windows & Android

📞 SUPPORT:

   - Check the included README.md for detailed documentation
   - See ANDROID_INSTALL.md for Android-specific help
   - All data is stored locally on your device
   - No internet required after installation

🎉 ENJOY YOUR FARM MANAGEMENT SYSTEM!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo ""
echo "📄 Step 3: Creating quick-start batch file..."

cat > "$PACKAGE_DIR/INSTALL_DEVINS_FARM.bat" << 'EOF'
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

EOF

echo ""
echo "📦 Step 4: Creating ZIP archive..."

# Create zip archive
if command -v zip &> /dev/null; then
    zip -r "devins-farm-windows-installer.zip" "$PACKAGE_DIR" > /dev/null
    echo "✅ Created: devins-farm-windows-installer.zip"
else
    tar -czf "devins-farm-windows-installer.tar.gz" "$PACKAGE_DIR"
    echo "✅ Created: devins-farm-windows-installer.tar.gz"
fi

echo ""
echo "📄 Step 5: Creating EXE instructions..."

cat > "CREATE_EXE.md" << 'EOF'
# Creating a Windows EXE Installer

## Option 1: Using IExpress (Built into Windows)

IExpress is a built-in Windows tool for creating self-extracting archives.

### Steps:

1. Press `Win + R`
2. Type `iexpress` and press Enter
3. Select "Create new Self Extraction Directive file"
4. Select "Extract files and run an installation command"
5. Package title: "Devins Farm Installer"
6. Confirmation prompt: "Do you want to install Devins Farm?"
7. Add files:
   - Select all files from `devins-farm-windows-installer` folder
8. Install program: `INSTALL_DEVINS_FARM.bat`
9. Window style: Default
10. Finished message: "Devins Farm installed successfully!"
11. Browse and save as: `DevinsFarm-Setup.exe`
12. Save Self Extraction Directive: `DevinsFarm.sed`
13. Click "Next" and wait for creation
14. Done! You now have `DevinsFarm-Setup.exe`

## Option 2: Using Inno Setup (Free)

Download: https://jrsoftware.org/isinfo.php

### Quick Script:

```pascal
[Setup]
AppName=Devins Farm
AppVersion=1.0
DefaultDirName={localappdata}\DevinsFarm
DefaultGroupName=Devins Farm
OutputDir=.
OutputBaseFilename=DevinsFarm-Setup
Compression=lzma2
SolidCompression=yes

[Files]
Source: "devins-farm-windows-installer\*"; DestDir: "{app}"; Flags: recursesubdirs

[Icons]
Name: "{userdesktop}\Devins Farm"; Filename: "{app}\INSTALL_DEVINS_FARM.bat"
Name: "{group}\Devins Farm"; Filename: "{app}\INSTALL_DEVINS_FARM.bat"

[Run]
Filename: "{app}\INSTALL_DEVINS_FARM.bat"; Description: "Launch Devins Farm"; Flags: postinstall nowait
```

Save as `DevinsFarm.iss` and compile with Inno Setup.

## Option 3: Using NSIS (Free)

Download: https://nsis.sourceforge.io/

### Quick Script:

```nsis
OutFile "DevinsFarm-Setup.exe"
InstallDir "$LOCALAPPDATA\DevinsFarm"

Section "Install"
  SetOutPath $INSTDIR
  File /r "devins-farm-windows-installer\*.*"
  CreateShortcut "$DESKTOP\Devins Farm.lnk" "$INSTDIR\INSTALL_DEVINS_FARM.bat"
  CreateShortcut "$SMPROGRAMS\Devins Farm.lnk" "$INSTDIR\INSTALL_DEVINS_FARM.bat"
SectionEnd
```

Save as `DevinsFarm.nsi` and compile with NSIS.

## Option 4: Using Bat2Exe (Simple)

Download: http://bat2exe.net/

1. Open Bat2Exe
2. Select `INSTALL_DEVINS_FARM.bat`
3. Include all files from folder
4. Set icon (optional)
5. Click "Compile"
6. Done!

## Recommended: IExpress

IExpress is the easiest option as it's already installed on Windows.
The created EXE will be around 500-600 KB.

## Distribution

Once you have the EXE:
1. Upload to your website/cloud storage
2. Share the single EXE file
3. Users just double-click to install
4. No technical knowledge required!

## Digital Signature (Optional)

For professional distribution:
1. Get a code signing certificate
2. Use SignTool.exe (from Windows SDK)
3. Sign the EXE: `signtool sign /f cert.pfx DevinsFarm-Setup.exe`

This removes "Unknown Publisher" warnings.
EOF

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ Windows Installer Package Created!            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📦 Package: $PACKAGE_DIR/"
if command -v zip &> /dev/null; then
    echo "📦 Archive: devins-farm-windows-installer.zip"
else
    echo "📦 Archive: devins-farm-windows-installer.tar.gz"
fi
echo ""
echo "📖 USAGE FOR WINDOWS USERS:"
echo ""
echo "1️⃣  Extract the ZIP file"
echo "2️⃣  Double-click 'INSTALL_DEVINS_FARM.bat'"
echo "3️⃣  Follow the installation wizard"
echo "4️⃣  Desktop shortcut created automatically"
echo "5️⃣  Launch from desktop!"
echo ""
echo "🔨 TO CREATE AN EXE FILE:"
echo ""
echo "Read: CREATE_EXE.md for detailed instructions"
echo ""
echo "Quick method (Windows only):"
echo "  1. Press Win+R"
echo "  2. Type: iexpress"
echo "  3. Follow the wizard in CREATE_EXE.md"
echo "  4. Creates: DevinsFarm-Setup.exe"
echo ""
echo "🎉 Ready for distribution!"
echo ""
