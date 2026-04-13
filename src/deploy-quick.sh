#!/bin/bash

##############################################################################
# 🚀 QUICK DEPLOY SCRIPT - Airtel Champions
##############################################################################
# This script helps you deploy updates to Supabase Storage in seconds
#
# Usage:
#   chmod +x deploy-quick.sh
#   ./deploy-quick.sh
##############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🚀 AIRTEL CHAMPIONS - QUICK DEPLOY SCRIPT 🚀          ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}STEP 1: Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo -e "${YELLOW}Install from: https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found:${NC} $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found:${NC} $(npm --version)"

echo ""

# Step 2: Build the app
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}STEP 2: Building React App${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    echo -e "${YELLOW}Are you in the correct directory?${NC}"
    exit 1
fi

echo -e "${YELLOW}🔨 Running: npm run build${NC}"
echo ""

npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build failed - build folder not created${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Count files
FILE_COUNT=$(find build -type f | wc -l)
echo -e "${BLUE}📦 Build contains ${FILE_COUNT} files${NC}"

# Show build size
BUILD_SIZE=$(du -sh build | cut -f1)
echo -e "${BLUE}📊 Build size: ${BUILD_SIZE}${NC}"

echo ""

# Step 3: Deploy instructions
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}STEP 3: Deploy to Supabase Storage${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Choose your deployment method:${NC}"
echo ""

echo -e "${BOLD}A) Dashboard Upload (Recommended)${NC}"
echo "   1. Go to: https://supabase.com/dashboard"
echo "   2. Navigate to: Storage → airtel-champions-app"
echo "   3. Upload ALL files from the build/ folder"
echo "   4. Wait for green checkmarks"
echo ""

echo -e "${BOLD}B) Automated Upload (If configured)${NC}"
echo "   Run: node upload-to-supabase.js"
echo ""

echo -e "${BOLD}C) API Endpoint (If configured)${NC}"
echo "   Run: node deploy-via-api.js"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
read -p "$(echo -e ${YELLOW}Have you uploaded the files to Supabase Storage? [y/N]:${NC} )" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}ℹ️  Upload the files manually, then run this script again${NC}"
    echo ""
    echo -e "${BLUE}Your build is ready in the build/ folder${NC}"
    exit 0
fi

echo ""

# Step 4: Verify deployment
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}STEP 4: Verify Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Enter your Supabase Project ID:${NC}"
read -p "> " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID is required${NC}"
    exit 1
fi

APP_URL="https://${PROJECT_ID}.supabase.co/storage/v1/object/public/airtel-champions-app/index.html"

echo ""
echo -e "${GREEN}✅ Your app should be live at:${NC}"
echo -e "${BOLD}${BLUE}${APP_URL}${NC}"
echo ""

echo -e "${YELLOW}Opening in browser...${NC}"

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$APP_URL" 2>/dev/null || echo -e "${YELLOW}Could not open browser automatically${NC}"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$APP_URL" 2>/dev/null || echo -e "${YELLOW}Could not open browser automatically${NC}"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "$APP_URL" 2>/dev/null || echo -e "${YELLOW}Could not open browser automatically${NC}"
fi

echo ""

# Step 5: Next steps
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}STEP 5: Next Steps${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✅ Build complete and deployed!${NC}"
echo ""
echo -e "${YELLOW}What happens next:${NC}"
echo ""
echo "  1. All 662 users will get this update on next app launch"
echo "  2. No APK rebuild or redistribution needed"
echo "  3. Updates typically appear within 1-5 minutes"
echo ""

echo -e "${YELLOW}To deploy future updates:${NC}"
echo "  1. Make changes in your code"
echo "  2. Run: ./deploy-quick.sh"
echo "  3. Upload files to Supabase Storage"
echo "  4. Done! ✅"
echo ""

echo -e "${BOLD}${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║                  🎉 DEPLOYMENT SUCCESSFUL! 🎉                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Save deployment log
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "$TIMESTAMP - Deployed $FILE_COUNT files ($BUILD_SIZE)" >> deployment-log.txt
echo -e "${BLUE}ℹ️  Deployment logged to: deployment-log.txt${NC}"

echo ""
echo -e "${YELLOW}Need help? Check:${NC}"
echo "  - /DEPLOY-NOW-OPTION-B.md (full guide)"
echo "  - /QUICK-DEPLOY-CHECKLIST.md (quick reference)"
echo "  - /DEPLOYMENT-SUMMARY.md (overview)"
echo ""
