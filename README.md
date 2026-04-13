# Airtel Champions App Web

A Progressive Web App (PWA) for managing HBB (Home Broadband) leads, installer assignments, performance tracking, and team collaboration. Built for Sales Executives, Zone Sales Managers, and leadership teams.

**Live Demo:** [Figma Design](https://www.figma.com/design/YgMsCvIqt7DMpx0rIB8UXV/Airtel-Champions-App-Web)

---

## 🚀 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18 + Vite + TypeScript |
| **UI Framework** | Tailwind CSS + Radix UI + Lucide Icons |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **State** | Zustand + React Query |
| **Mobile** | Capacitor (iOS/Android support) |
| **Real-time** | Supabase Realtime subscriptions |
| **PWA** | vite-plugin-pwa |

---

## 📋 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Supabase** account (free tier available at [supabase.com](https://supabase.com))
- **Git** installed locally

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd "Airtel Champions App Web"
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```
Then edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_TOKEN=your-github-token (optional)
```

4. **Start development server**
```bash
npm run dev
```

The app should now be running at `http://localhost:5173` (or next available port).

---

## 🛠️ Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Production build (creates `dist/` folder) |
| `npm run test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage reports |

### Testing & UAT
Multiple UAT scripts are available in `package.json`:
- `npm run uat:mcp` - Basic MCP testing
- `npm run uat:full` - Full integration tests
- `npm run uat:super` - Extended test suite

---

## 📁 Project Structure

```
.
├── src/
│   ├── components/          # React components (UI, dashboards, modals)
│   ├── utils/
│   │   └── supabase/        # Supabase client & config
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Business logic functions
│   ├── styles/              # Global styles
│   ├── App.tsx              # Main app component
│   └── main.tsx             # App entry point
├── public/                  # Static assets (icons, manifest, service worker)
├── supabase/                # Supabase migrations & edge functions
├── vercel-deployment/       # Vercel-specific deployment config
├── scripts/                 # Build & testing scripts
├── docs/                    # Documentation
├── .env.example             # Environment template
├── vite.config.ts           # Vite configuration
├── vercel.json              # Vercel deployment config
└── package.json             # Dependencies & scripts
```

---

## 🔐 Environment Variables

**IMPORTANT:** Never commit `.env` files. Use `.env.example` as a template.

### Required for Development
```env
VITE_SUPABASE_URL=              # Supabase project URL
VITE_SUPABASE_ANON_KEY=         # Supabase anonymous key (safe for frontend)
```

### Optional (Backend/Deployment)
```env
SUPABASE_SERVICE_ROLE_KEY=      # Admin key - KEEP SECRET, backend only
GITHUB_TOKEN=                   # For GitHub Actions automation
GROQ_API_KEY=                   # For AI features (if enabled)
```

---

## 🔄 Features by Role

### Sales Executive (SE)
- Login with pin/phone verification
- View assigned leads and opportunities
- Track performance metrics and points
- Update lead status with photos/notes
- Real-time notifications

### Zone Sales Manager (ZSM)
- Oversee team performance dashboards
- Manage installer assignments
- Review submissions and performance
- Messaging & collaboration tools

### Director/HQ
- Full platform visibility
- Team performance insights
- System administration
- Strategic planning tools

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

See [vercel.json](vercel.json) for configuration.

### Supabase Edge Functions
Deploy to Supabase with:
```bash
supabase functions deploy
```

### Docker (Optional)
```bash
docker build -t airtel-champions .
docker run -p 3000:80 airtel-champions
```

---

## 🔒 Security Best Practices

✅ **DO:**
- Use environment variables for all secrets
- Enable Row-Level Security (RLS) in Supabase
- Validate input on frontend AND backend
- Keep Supabase anon key in frontend (it's public)
- Keep service role key SECRET (backend only)

❌ **DON'T:**
- Commit `.env` files
- Hardcode API keys in source code
- Trust frontend validation alone
- Expose service role key in client code
- Use same Supabase project for dev & production

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

Test files are located alongside components with `.test.ts` or `.test.tsx` extension.

---

## 📱 PWA Features

This app is a Progressive Web App and can be installed on:
- Desktop (Chrome, Edge, Firefox)
- Android (Add to Home Screen or Chrome install prompt)
- iOS (via Web Clip on Safari)

Features:
- Works offline with service worker caching
- Push notifications support
- App-like experience

---

## 🐛 Troubleshooting

### Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection errors
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
2. Check Supabase project is active at [app.supabase.com](https://app.supabase.com)
3. Ensure CORS is configured in Supabase settings
4. Verify the anon key has proper auth policies

### Environment variables not loading
- Restart dev server: `Ctrl+C` then `npm run dev`
- Verify `.env.local` file is in project root (not inside `src/`)
- Check variable names start with `VITE_` prefix
- Never use hyphens in variable names

### Hot reload not working
- Check Vite is running: `npm run dev`
- Restart dev server if file changes aren't detected
- Verify `vite.config.ts` has proper HMR configuration

---

## 🚀 Production Deployment Checklist

### Before First Deployment
- [ ] All secrets moved to `.env.local` (never in source code)
- [ ] `.gitignore` properly configured
- [ ] `npm run build` succeeds without warnings/errors
- [ ] `npm run preview` works and shows no console errors
- [ ] `npm run type-check` passes with no TypeScript errors
- [ ] `npm run test` passes all tests
- [ ] No environment-specific console.log statements left
- [ ] PWA manifest configured at `public/manifest.json`
- [ ] Service worker present at `public/sw.js`
- [ ] Supabase RLS (Row-Level Security) policies configured
- [ ] Database migrations applied to production
- [ ] Error tracking configured (Sentry/LogRocket optional but recommended)

### Vercel Deployment Steps

#### 1. Prepare Repository
```bash
# Ensure all changes are committed
git status

# Push to main branch
git push origin main
```

#### 2. Connect to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

#### 3. Configure Environment Variables
In Vercel Project Settings → Environment Variables, add:

**Production:**
```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-actual-anon-key
VITE_VERCEL_ENV = production
VITE_ENABLE_PWA = true
```

**Preview/Staging:**
```
VITE_VERCEL_ENV = preview
```

**Never add to Vercel:**
- `SUPABASE_SERVICE_ROLE_KEY` (backend only)
- `GITHUB_TOKEN` (unless for deployment)

#### 4. Deploy
```bash
# Automatic trigger
git push origin main  # Vercel deploys automatically

# OR manual deployment
vercel --prod

# View deployment URL
vercel ls
```

#### 5. Verify Production
- [ ] App loads at your Vercel URL
- [ ] Supabase connection working
- [ ] Login/authentication works
- [ ] Check browser DevTools → Network (no asset 404s)
- [ ] Check browser DevTools → Console (no errors)
- [ ] Test PWA install prompt (Chrome: little plus icon in address bar)
- [ ] Performance: Run Lighthouse audit
- [ ] Mobile: Test on actual phone

### Supabase Production Setup

#### 1. Create Production Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new organization for production
3. Create production project (separate from dev)
4. Copy Project URL and Anon Key to Vercel

#### 2. Apply Database Migrations
```bash
# Switch to production project
supabase link --project-ref prod-project-id

# Apply migrations
supabase db push --linked
```

#### 3. Configure Row-Level Security (RLS)
Enable RLS on all tables:
- `auth.users` ← System table, auto-configured
- `profiles` ← Users see own profile only
- `lead_assignments` ← Users see own assignments
- `team_performance` ← Managers see their team

Example RLS policy:
```sql
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

#### 4. Set Up Backups
1. Vercel → Project Settings → Databases
2. Enable point-in-time recovery
3. Set backup retention policy (minimum 7 days)

#### 5. Monitor Production
- Set up monitoring in Supabase dashboard
- Enable error tracking in app
- Monitor database performance metrics
- Set up alerts for downtime

---

## 🔐 Security Best Practices

### Code Security
✅ **DO:**
- Use environment variables for all secrets
- Enable RLS on Supabase tables
- Validate input on frontend AND backend
- Use HTTPS for all external requests
- Keep dependencies updated

❌ **DON'T:**
- Commit `.env` files with secrets
- Hardcode API keys in source code
- Trust frontend validation alone
- Use same Supabase project for dev & production
- Expose service role key in browser

### Deployment Security
✅ **DO:**
- Keep anon key in frontend (it's meant to be public)
- Keep service role key SECRET (backend/edge functions only)
- Use CORS to restrict API access
- Enable RLS for all Postgres tables
- Set proper authentication policies

### Access Control
✅ **DO:**
- Use Supabase Row-Level Security (RLS)
- Implement role-based access control (RBAC)
- Audit who has production access
- Use separate projects for dev/staging/production
- Rotate API keys regularly

---

## 📱 PWA Features

This app is a Progressive Web App and can be installed on:
- Desktop (Chrome, Edge, Firefox)
- Android (Add to Home Screen or Chrome install prompt)
- iOS (via Web Clip on Safari)

Features enabled:
- Works offline with service worker caching
- Push notifications support
- App-like experience with splash screen
- Responsive design for all screen sizes

To install:
1. Open app in supported browser
2. Click install prompt (or menu → Install app)
3. App appears on home/app screen
  