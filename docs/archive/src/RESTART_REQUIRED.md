# ⚠️ CRITICAL: RESTART DEV SERVER REQUIRED!

## 🔴 STILL SEEING THE ERROR?

If you've edited your `.env` file and still see this error:

```
TypeError: Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')
```

**The issue is: You haven't restarted your dev server!**

---

## ✅ SOLUTION (30 seconds)

### **Step 1: Stop the Dev Server**

In your terminal where `npm run dev` is running:

**Press:** `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)

You should see the server stop.

### **Step 2: Start It Again**

```bash
npm run dev
```

Wait for it to start, then refresh your browser.

### **Step 3: Check Console**

Open browser DevTools (F12) and look for:

```
🔍 Environment Check: {
  url: '✅ Set',
  key: '✅ Set',
  urlValue: 'https://xxxxx.supabase.co...'
}
```

If you see **✅ Set**, it's working! If you see **❌ Missing**, continue below.

---

## 🔍 DEBUGGING: Check Your .env File

### **Step 1: Open .env file**

Make sure it exists in your project root (same folder as `package.json`).

### **Step 2: Verify Contents**

Your `.env` file should look EXACTLY like this:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Common Mistakes:**

❌ **WRONG:** Missing `VITE_` prefix
```env
SUPABASE_URL=https://xxxxx.supabase.co
```

❌ **WRONG:** Using placeholders
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

❌ **WRONG:** Quotes around values
```env
VITE_SUPABASE_URL="https://xxxxx.supabase.co"
```

❌ **WRONG:** Spaces around equals sign
```env
VITE_SUPABASE_URL = https://xxxxx.supabase.co
```

✅ **CORRECT:**
```env
VITE_SUPABASE_URL=https://nzqkpvxdwvfhqbxtyabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cWtwdnhkd3ZmaHFieHR5YWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDUwNjg0NzIsImV4cCI6MjAyMDY0NDQ3Mn0.abcdefghijklmnopqrstuvwxyz123456789
```

### **Step 3: Get Real Values from Supabase**

If you don't have real values yet:

1. **Go to:** https://supabase.com
2. **Login** to your account
3. **Select your project** (or create one)
4. **Go to:** Settings (gear icon) → API
5. **Copy:**
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public key** → Use as `VITE_SUPABASE_ANON_KEY`

---

## 🚫 VITE ENVIRONMENT VARIABLE RULES

**Vite (the build tool) has strict rules:**

1. ✅ All environment variables MUST start with `VITE_`
2. ✅ Changes to `.env` require dev server restart
3. ✅ No quotes around values
4. ✅ No spaces around `=` sign
5. ✅ File must be named exactly `.env` (not `.env.local` or `.env.development`)

**Why?** Vite only exposes variables that start with `VITE_` to prevent accidentally leaking secrets to the browser.

---

## 📝 STEP-BY-STEP CHECKLIST

Go through this checklist:

- [ ] I have a `.env` file in the root of my project
- [ ] The file contains `VITE_SUPABASE_URL=...`
- [ ] The file contains `VITE_SUPABASE_ANON_KEY=...`
- [ ] Both values are REAL values from Supabase (not placeholders)
- [ ] No quotes around the values
- [ ] No spaces around the `=` sign
- [ ] I've stopped the dev server (Ctrl+C)
- [ ] I've started it again (`npm run dev`)
- [ ] I've refreshed my browser
- [ ] I've checked the browser console (F12)

If ALL boxes are checked and it still doesn't work, see "Advanced Debugging" below.

---

## 🔧 ADVANCED DEBUGGING

### **Test 1: Check if .env is being read**

Add this to the top of `/lib/supabase.ts`:

```typescript
console.log('ALL ENV VARS:', import.meta.env);
```

Restart dev server and check browser console. You should see your variables.

### **Test 2: Verify file location**

Your project structure should be:

```
your-project/
├── .env                    ← HERE!
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   └── lib/
│       └── supabase.ts
```

**NOT** in `src/.env` or any subfolder!

### **Test 3: Check file permissions**

On Mac/Linux:
```bash
ls -la .env
```

Should show read permissions.

### **Test 4: Use absolute path**

Try creating `.env` in the exact same folder as `package.json`:

```bash
# In your terminal, from project root
pwd                    # See where you are
touch .env             # Create if missing
cat .env               # View contents
```

---

## 🎯 QUICK TEST VALUES

If you just want to test without Supabase, use these demo values:

```env
VITE_SUPABASE_URL=https://demo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo
```

**Restart server**, then you should see the login screen (data will be empty).

---

## 💬 STILL NOT WORKING?

### **Error: "url: ❌ Missing" in console**

**Cause:** Environment variable not loaded

**Fix:** 
1. Verify `.env` is in project root
2. Verify variable names have `VITE_` prefix
3. Restart dev server
4. Try `npm run dev -- --force` to clear cache

### **Error: "Failed to fetch"**

**Cause:** Wrong Supabase URL or network issue

**Fix:**
1. Verify URL is correct in Supabase dashboard
2. Check you're connected to internet
3. Try visiting the URL in your browser (should show Supabase page)

### **Error: "Invalid API key"**

**Cause:** Wrong API key

**Fix:**
1. Get fresh key from Supabase: Settings → API
2. Use the "anon" / "public" key (NOT service_role key!)
3. Copy the entire key (it's very long, ~200+ characters)

---

## ✅ VERIFICATION

**When it's working, you should see:**

**Browser Console:**
```
🔍 Environment Check: {
  url: '✅ Set',
  key: '✅ Set',
  urlValue: 'https://xxxxx.supabase.co...',
  nodeEnv: 'development'
}
```

**Screen:**
- Login screen (NOT setup notice)
- No errors
- Can type email/password

**If you see Setup Notice screen:**
- Environment variables are still not configured
- Double-check steps above

---

## 🎉 ONCE IT WORKS

After successfully configuring:

1. ✅ You'll see login screen
2. ✅ Login with any email/password (mock auth)
3. ✅ Navigate to Dashboard Overview
4. ✅ You'll see loading spinner then data (may be empty)
5. ✅ No console errors

**Next step:** Run the database migration to populate data!

See `/SUPABASE_SETUP_GUIDE.md` Step 6 for database setup.

---

## 📚 RESOURCES

- **Quick Start:** `/QUICK_START.md`
- **Full Setup:** `/SUPABASE_SETUP_GUIDE.md`
- **Error Fix:** `/ERROR_FIX_SUMMARY.md`
- **Vite Env Docs:** https://vitejs.dev/guide/env-and-mode.html

---

**Remember: Changes to `.env` ALWAYS require a dev server restart!** 🔄
