#!/bin/bash

# Netlify Quick Deploy - One Command Deployment!
# This is the FASTEST way to get your app online

echo "🚀 Devins Farm - Quick Deploy to Netlify"
echo "=========================================="
echo ""

# Build the app
echo "📦 Building app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Check for Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Deploy
echo ""
echo "🚀 Deploying to Netlify..."
echo ""
echo "You'll need to:"
echo "  1. Login to Netlify (opens browser)"
echo "  2. Authorize the CLI"
echo "  3. Select 'Create & configure a new site'"
echo ""

netlify deploy --prod --dir=dist

echo ""
echo "═══════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════"
echo ""
echo "Your app is now live! 🎉"
echo ""
echo "Next steps:"
echo "  1. Share the URL with users"
echo "  2. Users can install it as an app"
echo "  3. Works offline automatically"
echo ""
echo "To update: Just run this script again!"
echo ""
