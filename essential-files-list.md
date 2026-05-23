# Essential Files for Vercel PWA Deployment

## Files to Keep (Minimal Set)

### Core Configuration
- [x] `package.json` - Dependencies and build scripts
- [x] `package-lock.json` - Locked dependency versions  
- [x] `vite.config.ts` - Vite configuration
- [x] `index.html` - Main HTML entry point
- [x] `tsconfig.json` - TypeScript configuration

### PWA Files
- [x] `public/manifest.json` - PWA manifest
- [x] `public/sw.js` - Service worker
- [x] `public/icons/` - PWA icons

### Source Code
- [x] `src/main.tsx` - React app entry
- [x] `src/App.tsx` - Main app component
- [x] `src/index.css` - Global styles
- [x] `src/components/` - React components
- [x] `src/utils/` - Utility functions

### Deployment Files
- [x] `vercel.json` - Vercel configuration
- [x] `.vercelignore` - Files to ignore
- [x] `.env.example` - Environment variables template
- [x] `.gitignore` - Git ignore rules

### Documentation
- [x] `README.md` - Project documentation

## Files to Remove (Unnecessary for Deployment)

### Development Files
- [ ] `.claude/` - Claude AI files
- [ ] `.windsurf/` - Windsurf IDE files
- [ ] `_avast_/` - Antivirus files
- [ ] `build/` - Build output
- [ ] `dist/` - Build output
- [ ] `node_modules/` - Dependencies

### Scripts & Tools
- [ ] `*.js` - Various script files
- [ ] `*.bat` - Batch files
- [ ] `*.sql` - Database scripts
- [ ] `scripts/` - Script directory
- [ ] `supabase/` - Supabase migrations

### Documentation & Screenshots
- [ ] `*.md` - Multiple documentation files
- [ ] `*.png` - Screenshot files
- [ ] `docs/` - Documentation folder

### Logs & Debug Files
- [ ] `*.json` - Log files
- [ ] `uat-*` - UAT related files
- [ ] `swe-integration-log.json` - Integration logs

### Test Files
- [ ] `jest.config.js` - Test configuration
- [ ] `test_dump.sql` - Test dump

## Clean Project Structure After Cleanup

```
airtel-champions-app/
  src/
    components/
      hbb/
        hbb-agent-dashboard.tsx
        hbb-dse-dashboard.tsx
        hbb-installer-dashboard.tsx
      LoginPage.tsx
      ui/
        mobile-container.tsx
    utils/
      supabase/
        client.ts
        info.ts
      offline-manager.ts
    main.tsx
    App.tsx
    index.css
  public/
    manifest.json
    sw.js
    icons/
      icon-192.png
      icon-512.png
  package.json
  package-lock.json
  vite.config.ts
  index.html
  tsconfig.json
  vercel.json
  .vercelignore
  .env.example
  .gitignore
  README.md
```

## Benefits of This Approach

1. **Smaller Repository Size** - Removes ~100MB of unnecessary files
2. **Faster Cloning** - Less data to download
3. **Cleaner History** - No development artifacts in version control
4. **Faster Builds** - Fewer files to process
5. **Security** - No sensitive development files exposed
6. **Focus** - Only production-ready code included

## Deployment Ready

After cleanup, the project will be:
- **~50MB smaller** (from ~150MB to ~100MB)
- **Production focused** - Only essential files
- **PWA optimized** - All PWA features intact
- **Vercel ready** - Proper configuration included
