# Vercel PWA Deployment Checklist

## Essential Files Required

### 1. Core Application Files
- [ ] `package.json` - Dependencies and build scripts
- [ ] `package-lock.json` - Locked dependency versions
- [ ] `vite.config.ts` - Vite configuration
- [ ] `index.html` - Main HTML entry point
- [ ] `tsconfig.json` - TypeScript configuration
- [ ] `.env.example` - Environment variables template

### 2. PWA Essential Files
- [ ] `public/manifest.json` - PWA manifest
- [ ] `public/sw.js` - Service worker
- [ ] `public/icons/` - PWA icons (192x192, 512x512)
- [ ] `public/icons/shortcut-*.svg` - App shortcuts icons

### 3. Source Code
- [ ] `src/` - Complete source code directory
- [ ] `src/main.tsx` - React app entry point
- [ ] `src/App.tsx` - Main app component
- [ ] `src/components/` - All React components
- [ ] `src/assets/` - Static assets and images

### 4. Configuration Files
- [ ] `.gitignore` - Git ignore rules
- [ ] `vercel.json` - Vercel configuration (recommended)
- [ ] `.vercelignore` - Files to ignore during deployment

### 5. Build Output (Optional)
- [ ] `dist/` - Built application (Vercel will build automatically)

## Vercel Configuration

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/sw.js",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Environment Variables (Vercel Dashboard)
- [ ] `VITE_SUPABASE_URL` - Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `VITE_APP_ENV` - Environment (production)

## Deployment Steps
1. Push code to GitHub repository
2. Connect Vercel to GitHub
3. Import the repository
4. Configure environment variables
5. Deploy automatically

## PWA Verification
- [ ] Service worker registered
- [ ] Manifest file accessible
- [ ] Icons loading properly
- [ ] Offline functionality working
- [ ] Install prompt appears

## Post-Deployment
- [ ] Test PWA installation
- [ ] Verify service worker caching
- [ ] Check responsive design
- [ ] Test offline functionality
- [ ] Validate Lighthouse PWA score
