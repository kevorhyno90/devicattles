#!/bin/bash

# Devins Farm - Quick Deployment Script
# This script helps you deploy to various free hosting platforms

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Devins Farm - Deployment Script                   ║"
echo "║         Deploy your app for FREE!                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dist folder exists
check_build() {
    if [ ! -d "dist" ]; then
        echo -e "${YELLOW}⚠️  No 'dist' folder found. Building app...${NC}"
        npm run build
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Build failed! Please fix errors and try again.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Build successful!${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ Build folder found!${NC}"
        echo ""
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment platform:"
    echo ""
    echo "  1) 🚀 Netlify (Recommended - Easiest)"
    echo "  2) ⚡ Vercel (Optimized for React)"
    echo "  3) 📦 Firebase Hosting (Same as your database)"
    echo "  4) 🌐 GitHub Pages"
    echo "  5) ☁️  Cloudflare Pages"
    echo ""
    echo "  6) 🔨 Just build (no deployment)"
    echo "  7) 👀 Preview locally"
    echo "  8) 📖 View deployment guide"
    echo ""
    echo "  0) Exit"
    echo ""
    read -p "Enter your choice [0-8]: " choice
    
    case $choice in
        1) deploy_netlify ;;
        2) deploy_vercel ;;
        3) deploy_firebase ;;
        4) deploy_github_pages ;;
        5) deploy_cloudflare ;;
        6) build_only ;;
        7) preview_locally ;;
        8) view_guide ;;
        0) echo -e "${GREEN}Goodbye! 👋${NC}" && exit 0 ;;
        *) echo -e "${RED}Invalid choice!${NC}" && show_menu ;;
    esac
}

# Netlify deployment
deploy_netlify() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Netlify Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    check_build
    
    if ! command -v netlify &> /dev/null; then
        echo -e "${YELLOW}Netlify CLI not found. Installing...${NC}"
        npm install -g netlify-cli
    fi
    
    echo ""
    echo "Choose Netlify deployment method:"
    echo ""
    echo "  1) Login and deploy"
    echo "  2) Deploy anonymously (drag & drop)"
    echo ""
    read -p "Enter choice [1-2]: " netlify_choice
    
    case $netlify_choice in
        1)
            echo ""
            echo -e "${YELLOW}Opening browser for Netlify login...${NC}"
            netlify login
            echo ""
            echo -e "${GREEN}Deploying to Netlify...${NC}"
            netlify deploy --prod --dir=dist
            echo ""
            echo -e "${GREEN}✅ Deployment complete!${NC}"
            echo -e "${YELLOW}Your app is live! Check the URL above.${NC}"
            ;;
        2)
            echo ""
            echo -e "${YELLOW}📋 Manual Deployment Instructions:${NC}"
            echo ""
            echo "1. Open: https://app.netlify.com/drop"
            echo "2. Drag the 'dist' folder into your browser"
            echo "3. Your app will be live in 30 seconds!"
            echo ""
            read -p "Press Enter when ready to open folder..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                open dist
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open dist 2>/dev/null || nautilus dist 2>/dev/null || echo "dist folder: $(pwd)/dist"
            fi
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Vercel deployment
deploy_vercel() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Vercel Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    check_build
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    fi
    
    echo ""
    echo -e "${YELLOW}Opening browser for Vercel login...${NC}"
    vercel login
    
    echo ""
    echo -e "${GREEN}Deploying to Vercel...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${YELLOW}Your app is live! Check the URL above.${NC}"
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Firebase deployment
deploy_firebase() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Firebase Hosting Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    check_build
    
    if ! command -v firebase &> /dev/null; then
        echo -e "${YELLOW}Firebase CLI not found. Installing...${NC}"
        npm install -g firebase-tools
    fi
    
    if [ ! -f "firebase.json" ]; then
        echo ""
        echo -e "${YELLOW}Firebase not initialized. Initializing...${NC}"
        firebase login
        firebase init hosting
    fi
    
    echo ""
    echo -e "${GREEN}Deploying to Firebase Hosting...${NC}"
    firebase deploy --only hosting
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${YELLOW}Your app is live at: https://devinsfarm-2025.web.app${NC}"
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# GitHub Pages deployment
deploy_github_pages() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     GitHub Pages Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    # Check if gh-pages is installed
    if ! grep -q "gh-pages" package.json; then
        echo -e "${YELLOW}Installing gh-pages...${NC}"
        npm install --save-dev gh-pages
    fi
    
    # Check if deploy script exists
    if ! grep -q '"deploy"' package.json; then
        echo -e "${YELLOW}Adding deploy script to package.json...${NC}"
        # This would require manual editing or jq
        echo -e "${RED}Please add the following to package.json scripts:${NC}"
        echo ""
        echo '  "predeploy": "npm run build",'
        echo '  "deploy": "gh-pages -d dist"'
        echo ""
        read -p "Press Enter when done..."
    fi
    
    echo ""
    echo -e "${GREEN}Deploying to GitHub Pages...${NC}"
    npm run deploy
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${YELLOW}Enable GitHub Pages in your repo settings!${NC}"
    echo ""
    echo "Go to: Settings → Pages → Source: gh-pages branch"
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Cloudflare Pages
deploy_cloudflare() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Cloudflare Pages Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    check_build
    
    echo -e "${YELLOW}📋 Cloudflare Pages Deployment Instructions:${NC}"
    echo ""
    echo "1. Push your code to GitHub"
    echo "2. Go to: https://pages.cloudflare.com"
    echo "3. Click 'Create a project'"
    echo "4. Connect to GitHub and select this repo"
    echo "5. Build settings:"
    echo "   - Framework preset: Vite"
    echo "   - Build command: npm run build"
    echo "   - Build output: dist"
    echo "6. Click 'Save and Deploy'"
    echo ""
    echo -e "${GREEN}Your app will be live in 2-3 minutes!${NC}"
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Build only
build_only() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Building App${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${YELLOW}Building production version...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Build complete!${NC}"
        echo ""
        echo "Build output: $(pwd)/dist"
        echo ""
        echo "You can now:"
        echo "  - Deploy manually to any hosting"
        echo "  - Test locally with: npm run preview"
        echo "  - Share the dist folder"
    else
        echo ""
        echo -e "${RED}❌ Build failed!${NC}"
    fi
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Preview locally
preview_locally() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Local Preview${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    check_build
    
    echo -e "${GREEN}Starting preview server...${NC}"
    echo ""
    echo -e "${YELLOW}Your app will open at: http://localhost:4173${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    npm run preview
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# View guide
view_guide() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}     Deployment Guide${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    if [ -f "DEPLOYMENT_GUIDE.md" ]; then
        if command -v less &> /dev/null; then
            less DEPLOYMENT_GUIDE.md
        elif command -v more &> /dev/null; then
            more DEPLOYMENT_GUIDE.md
        else
            cat DEPLOYMENT_GUIDE.md
        fi
    else
        echo -e "${RED}DEPLOYMENT_GUIDE.md not found!${NC}"
    fi
    
    echo ""
    read -p "Press Enter to continue..."
    show_menu
}

# Start script
echo ""
echo -e "${GREEN}Welcome to Devins Farm Deployment!${NC}"
echo ""
echo "This script will help you deploy your app to free hosting."
echo "Your app will be accessible worldwide as a normal app!"
echo ""

show_menu
