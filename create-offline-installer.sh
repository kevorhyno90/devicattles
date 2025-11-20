#!/bin/bash

# Devins Farm - Offline Installer Package Creator
# This script creates a complete offline installation package

echo "🚀 Creating Devins Farm Offline Installer..."
echo ""

# Create installer directory
INSTALLER_DIR="devins-farm-offline-installer"
rm -rf "$INSTALLER_DIR"
mkdir -p "$INSTALLER_DIR"

echo "📦 Step 1: Building production app..."
npm run build

echo ""
echo "📂 Step 2: Copying build files..."
cp -r dist/* "$INSTALLER_DIR/"

echo ""
echo "📄 Step 3: Creating installer files..."

# Create installation script
cat > "$INSTALLER_DIR/install.sh" << 'EOF'
#!/bin/bash

echo "╔════════════════════════════════════════════════════╗"
echo "║     Devins Farm - Offline Installer               ║"
echo "║     Comprehensive Farm Management System           ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed."
    echo "Please install Python 3 and try again."
    exit 1
fi

PORT=8080

echo "🌐 Starting Devins Farm server..."
echo "📍 Server will run on: http://localhost:$PORT"
echo ""
echo "📱 To access on Android:"
echo "   1. Connect your phone to the same network as this computer"
echo "   2. Find your computer's IP address:"
echo "      - Windows: ipconfig"
echo "      - Mac/Linux: ifconfig or ip addr"
echo "   3. Open browser on phone and go to: http://YOUR_IP:$PORT"
echo ""
echo "🔌 To install on Android:"
echo "   1. Open Chrome on your Android device"
echo "   2. Visit the URL above"
echo "   3. Tap menu (⋮) → 'Install app' or 'Add to Home screen'"
echo "   4. The app will work offline after installation!"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
python3 -m http.server $PORT
EOF

chmod +x "$INSTALLER_DIR/install.sh"

# Create Windows batch file
cat > "$INSTALLER_DIR/install.bat" << 'EOF'
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
EOF

# Create README for installer
cat > "$INSTALLER_DIR/README.txt" << 'EOF'
╔════════════════════════════════════════════════════════════════════════╗
║                 DEVINS FARM - OFFLINE INSTALLER                        ║
║              Comprehensive Farm Management System                      ║
╚════════════════════════════════════════════════════════════════════════╝

📦 WHAT'S INCLUDED:
   ✓ Complete farm management web application
   ✓ Works 100% offline after installation
   ✓ No internet connection required
   ✓ All features fully functional
   ✓ Android & desktop compatible

🚀 QUICK START:

   WINDOWS USERS:
   1. Double-click "install.bat"
   2. Follow on-screen instructions
   
   MAC/LINUX USERS:
   1. Open terminal in this folder
   2. Run: ./install.sh
   3. Follow on-screen instructions

📱 INSTALL ON ANDROID:

   1. Run the installer on your computer (see above)
   2. Connect your Android device to the SAME WiFi network
   3. Find your computer's IP address:
      - Windows: Open Command Prompt → type "ipconfig"
      - Mac: System Preferences → Network
      - Linux: Terminal → type "ip addr" or "ifconfig"
      
   4. Open Chrome on your Android device
   5. Go to: http://YOUR_COMPUTER_IP:8080
      Example: http://192.168.1.100:8080
      
   6. Install the app:
      - Tap menu (⋮) in top-right corner
      - Select "Install app" or "Add to Home screen"
      - Tap "Install"
      
   7. Done! The app is now on your home screen
   8. Works completely offline - no internet needed!

💻 INSTALL ON DESKTOP:

   1. Run the installer (see Quick Start above)
   2. Open browser and go to: http://localhost:8080
   3. Click the install icon in address bar (if using Chrome/Edge)
   4. Or bookmark the page for easy access

🌐 SYSTEM REQUIREMENTS:

   Computer (Server):
   ✓ Python 3.6 or higher
   ✓ Windows, Mac, or Linux
   ✓ Any available port (default: 8080)
   
   Android Device:
   ✓ Android 5.0 or higher
   ✓ Chrome, Firefox, or Samsung Internet browser
   ✓ 100MB free storage

✨ FEATURES:

   ✓ Animal Management - Track livestock, health, breeding
   ✓ Photo Gallery - Capture and store photos (camera access)
   ✓ QR Codes - Auto-generated for all animals
   ✓ Task Management - Create and track farm tasks
   ✓ Financial Tracking - Income, expenses, analytics
   ✓ Calendar View - Schedule tasks, treatments, breeding
   ✓ Reports & Analytics - Charts, graphs, insights
   ✓ Dark Mode - Light/dark theme toggle
   ✓ Offline First - Works without internet
   ✓ Cloud Sync - Optional Firebase integration

🔧 TROUBLESHOOTING:

   Q: "Python not found" error?
   A: Install Python from https://www.python.org/downloads/
      Make sure to check "Add Python to PATH" during installation.
   
   Q: Can't access from Android?
   A: Make sure both devices are on the same WiFi network.
      Check your firewall allows connections on port 8080.
   
   Q: Port 8080 already in use?
   A: Edit install.sh/install.bat and change PORT=8080 to another number
      like PORT=8081, then use that port in the URL.
   
   Q: App won't install on Android?
   A: Use Chrome browser (not Firefox or others)
      Make sure you're using HTTPS or localhost
      Enable "Install apps from browser" in Android settings

📖 MORE HELP:

   - Check ANDROID_INSTALL.md for detailed Android instructions
   - Visit the main README.md for feature documentation
   - All data is stored locally on your device
   - No data is sent to external servers

🎉 ENJOY YOUR OFFLINE FARM MANAGEMENT SYSTEM!

   Your farm is now in your pocket - manage livestock, crops,
   finances, and tasks anywhere, anytime, even without internet!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

# Copy documentation
echo ""
echo "📚 Step 4: Copying documentation..."
cp README.md "$INSTALLER_DIR/" 2>/dev/null || echo "README.md not found, skipping..."
cp ANDROID_INSTALL.md "$INSTALLER_DIR/" 2>/dev/null || echo "ANDROID_INSTALL.md not found, skipping..."

# Create package info
cat > "$INSTALLER_DIR/VERSION.txt" << EOF
Devins Farm - Offline Installer
Version: 1.0.0
Build Date: $(date)
Package Type: Offline Installer (Complete)

This package contains everything needed to run Devins Farm
completely offline on any platform (Windows, Mac, Linux, Android).

No internet connection required after installation.
EOF

echo ""
echo "📦 Step 5: Creating archive..."

# Create zip archive
if command -v zip &> /dev/null; then
    zip -r "${INSTALLER_DIR}.zip" "$INSTALLER_DIR" > /dev/null
    echo "✅ Created: ${INSTALLER_DIR}.zip"
else
    echo "⚠️  'zip' command not found, creating tar.gz instead..."
    tar -czf "${INSTALLER_DIR}.tar.gz" "$INSTALLER_DIR"
    echo "✅ Created: ${INSTALLER_DIR}.tar.gz"
fi

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  ✅ Offline Installer Created Successfully!        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📦 Package created in: $INSTALLER_DIR/"
echo ""
echo "📤 DISTRIBUTION OPTIONS:"
echo ""
echo "1️⃣  USB Drive:"
echo "   - Copy the '$INSTALLER_DIR' folder to a USB drive"
echo "   - Plug USB into any computer"
echo "   - Run install.sh (Mac/Linux) or install.bat (Windows)"
echo ""
echo "2️⃣  Archive File:"
if command -v zip &> /dev/null; then
    echo "   - Share ${INSTALLER_DIR}.zip via:"
else
    echo "   - Share ${INSTALLER_DIR}.tar.gz via:"
fi
echo "     • Email (if size allows)"
echo "     • File sharing services (Dropbox, Google Drive)"
echo "     • Bluetooth transfer"
echo "     • Local network transfer"
echo "   - Recipient extracts and runs installer"
echo ""
echo "3️⃣  Direct Transfer:"
echo "   - Copy folder to other computers via network"
echo "   - Use SCP, FTP, or shared folders"
echo ""
echo "📱 ANDROID INSTALLATION:"
echo "   1. Copy installer to any computer"
echo "   2. Run installer on that computer"
echo "   3. Connect Android to same WiFi"
echo "   4. Open http://COMPUTER_IP:8080 on Android"
echo "   5. Install as PWA (tap menu → Install app)"
echo ""
echo "🎉 Your app is ready for offline distribution!"
