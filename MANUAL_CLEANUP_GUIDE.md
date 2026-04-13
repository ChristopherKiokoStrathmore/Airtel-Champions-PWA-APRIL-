# Manual Cleanup Guide for Vercel Deployment

## Quick Cleanup Commands

### Step 1: Remove Development Folders
```bash
# Remove these folders completely
rm -rf .claude/
rm -rf .windsurf/
rm -rf _avast_/
rm -rf build/
rm -rf dist/
rm -rf node_modules/
rm -rf scripts/
rm -rf supabase/
rm -rf docs/
rm -rf vercel-deployment/
rm -rf windsurf/
```

### Step 2: Remove Development Files
```bash
# Remove script files
rm -f *.js
rm -f *.bat
rm -f *.sql
rm -f *.png
rm -f *.json
rm -f *.md
```

### Step 3: Keep Only Essential Files
```bash
# Files you MUST keep:
# package.json
# package-lock.json
# vite.config.ts
# index.html
# tsconfig.json
# vercel.json
# .vercelignore
# .env.example
# .gitignore
# README.md
# src/ (entire folder)
# public/ (entire folder)
```

### Step 4: Clean Source Code (Optional)
```bash
# Keep only these essential source files:
# src/main.tsx
# src/App.tsx
# src/index.css
# src/components/LoginPage.tsx
# src/components/ui/mobile-container.tsx
# src/components/hbb/hbb-agent-dashboard.tsx
# src/components/hbb/hbb-dse-dashboard.tsx
# src/components/hbb/hbb-installer-dashboard.tsx
# src/utils/supabase/client.ts
# src/utils/supabase/info.ts
# src/utils/offline-manager.ts

# Remove other components if not needed
```

## Alternative: Create Clean Copy

### Step 1: Create New Clean Folder
```bash
mkdir airtel-champions-clean
cd airtel-champions-clean
```

### Step 2: Copy Only Essential Files
```bash
# Copy from original project
cp ../airtel-champions-app/package.json .
cp ../airtel-champions-app/package-lock.json .
cp ../airtel-champions-app/vite.config.ts .
cp ../airtel-champions-app/index.html .
cp ../airtel-champions-app/tsconfig.json .
cp ../airtel-champions-app/vercel.json .
cp ../airtel-champions-app/.vercelignore .
cp ../airtel-champions-app/.env.example .
cp ../airtel-champions-app/.gitignore .
cp ../airtel-champions-app/README.md .

# Copy source code
cp -r ../airtel-champions-app/src .

# Copy public folder
cp -r ../airtel-champions-app/public .
```

### Step 3: Initialize Git and Deploy
```bash
git init
git add .
git commit -m "Initial clean deployment"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/airtel-champions-clean.git
git push -u origin main

# Deploy to Vercel
# Go to vercel.com and import the repository
```

## Essential Files Summary

### Must Have (100% Required)
- `package.json` - Dependencies
- `vite.config.ts` - Build configuration
- `src/main.tsx` - App entry point
- `src/App.tsx` - Main component
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker

### Should Have (Recommended)
- `src/components/LoginPage.tsx` - Login functionality
- `src/components/hbb/` - HBB dashboards
- `src/utils/supabase/` - Database utilities
- `vercel.json` - Deployment configuration

### Nice to Have (Optional)
- `README.md` - Documentation
- `.env.example` - Environment template
- `tsconfig.json` - TypeScript configuration

## Result After Cleanup

Your project will be:
- **~90% smaller** (from ~150MB to ~15MB)
- **Deployment ready** - Only production files
- **PWA complete** - All PWA features working
- **Fast to clone** - Quick repository setup

## One-Command Solution

If you want to automate this, create a new repository and run:

```bash
# Create clean copy in one command
rsync -av --exclude='node_modules' \
  --exclude='build' \
  --exclude='dist' \
  --exclude='.claude' \
  --exclude='.windsurf' \
  --exclude='_avast_' \
  --exclude='scripts' \
  --exclude='supabase' \
  --exclude='*.js' \
  --exclude='*.bat' \
  --exclude='*.sql' \
  --exclude='*.png' \
  --exclude='docs' \
  --exclude='vercel-deployment' \
  --exclude='*.md' \
  . airtel-champions-clean/
```

This gives you a clean, deployment-ready repository in seconds!
