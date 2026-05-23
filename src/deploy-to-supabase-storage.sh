#!/bin/bash

##############################################################################
# 🚀 DEPLOY AIRTEL CHAMPIONS TO SUPABASE STORAGE
##############################################################################
# This script deploys your React app to Supabase Storage for hosting
# 
# Prerequisites:
# 1. Supabase CLI installed (npm install -g supabase)
# 2. Build folder exists (npm run build)
# 3. Supabase project linked
#
# Usage:
#   chmod +x deploy-to-supabase-storage.sh
#   ./deploy-to-supabase-storage.sh
##############################################################################

set -e  # Exit on error

echo "🚀 Deploying Airtel Champions to Supabase Storage..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if build folder exists
if [ ! -d "build" ]; then
  echo -e "${RED}❌ Error: 'build' folder not found${NC}"
  echo -e "${YELLOW}Run 'npm run build' first${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found build folder${NC}"
echo ""

# Configuration
BUCKET_NAME="airtel-champions-app"
PROJECT_ID="YOUR_PROJECT_ID"  # Replace with your Supabase project ID
SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

echo -e "${BLUE}📦 Configuration:${NC}"
echo "  Bucket: $BUCKET_NAME"
echo "  Project: $PROJECT_ID"
echo "  URL: $SUPABASE_URL"
echo ""

# Step 1: Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo -e "${YELLOW}Install it with: npm install -g supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Step 2: Build the app (optional - uncomment if needed)
# echo -e "${BLUE}🔨 Building React app...${NC}"
# npm run build
# echo -e "${GREEN}✅ Build complete${NC}"
# echo ""

# Step 3: Instructions for manual deployment
echo -e "${YELLOW}📋 MANUAL DEPLOYMENT STEPS:${NC}"
echo ""
echo "Since Supabase Storage doesn't support direct CLI upload of entire folders,"
echo "we'll use the Supabase Dashboard or API. Here are your options:"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}OPTION 1: Use the Web Dashboard (Easiest)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/${PROJECT_ID}/storage/buckets"
echo ""
echo "2. Create a new PUBLIC bucket:"
echo "   - Name: ${BUCKET_NAME}"
echo "   - Public: ✅ YES"
echo "   - File size limit: 50 MB"
echo ""
echo "3. Upload files:"
echo "   - Click on the bucket"
echo "   - Click 'Upload files'"
echo "   - Drag and drop ALL files from the 'build/' folder"
echo "   - Make sure to preserve folder structure"
echo ""
echo "4. Your app URL will be:"
echo "   ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/index.html"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}OPTION 2: Use Supabase API (Automated)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "I'll create a Node.js script for you to upload automatically."
echo "See: upload-to-supabase.js"
echo ""

# Create the upload script
cat > upload-to-supabase.js << 'EOFJS'
/**
 * 🚀 Upload Build to Supabase Storage
 * 
 * Usage: node upload-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// ⚠️ CONFIGURE THESE:
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const BUCKET_NAME = 'airtel-champions-app';
const BUILD_DIR = './build';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Recursively get all files in directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function uploadFile(filePath) {
  const relativePath = path.relative(BUILD_DIR, filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  console.log(`📤 Uploading: ${relativePath}`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(relativePath, fileBuffer, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error(`❌ Error uploading ${relativePath}:`, error.message);
    return false;
  }

  console.log(`✅ Uploaded: ${relativePath}`);
  return true;
}

async function main() {
  console.log('🚀 Starting upload to Supabase Storage...\n');

  // Step 1: Check if bucket exists, create if not
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`📦 Creating bucket: ${BUCKET_NAME}`);
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50 MB
    });

    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      process.exit(1);
    }
    console.log('✅ Bucket created\n');
  } else {
    console.log(`✅ Bucket exists: ${BUCKET_NAME}\n`);
  }

  // Step 2: Get all files
  const files = getAllFiles(BUILD_DIR);
  console.log(`📁 Found ${files.length} files to upload\n`);

  // Step 3: Upload files
  let successCount = 0;
  for (const file of files) {
    const success = await uploadFile(file);
    if (success) successCount++;
  }

  console.log(`\n✅ Upload complete: ${successCount}/${files.length} files`);
  console.log(`\n🌐 Your app is now hosted at:`);
  console.log(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/index.html`);
}

main().catch(console.error);
EOFJS

echo -e "${GREEN}✅ Created upload-to-supabase.js${NC}"
echo ""
echo -e "${YELLOW}To use the automated script:${NC}"
echo "  1. npm install @supabase/supabase-js mime-types"
echo "  2. Set environment variables:"
echo "     export SUPABASE_URL='https://YOUR_PROJECT_ID.supabase.co'"
echo "     export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
echo "  3. node upload-to-supabase.js"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}OPTION 3: I'll Create a Deployment Server Endpoint${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "This is the BEST option - uses your existing Supabase Edge Function!"
echo "I'll add a deployment endpoint to your server that uploads the build."
echo ""

echo -e "${GREEN}✅ Script complete!${NC}"
echo ""
echo -e "${YELLOW}Next step: Choose an option above and follow the instructions.${NC}"
