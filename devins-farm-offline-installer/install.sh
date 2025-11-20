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
