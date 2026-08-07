# 🗄️ TAI Programs Database Setup

## ⚠️ CURRENT ISSUE

Your TAI app is showing **"Database Setup Required"** because the programs tables don't exist in your Supabase database yet.

---

## 🚀 QUICK FIX (2 minutes)

### **Option 1: Simple Version (RECOMMENDED)**

Use this if you just want to get it working:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your TAI project
   - Click **"SQL Editor"** in left sidebar

2. **Copy & Run This SQL**
   - Open `/database/programs-schema-simple.sql`
   - Copy ALL the contents
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for success ✅

3. **Refresh Your App**
   - Come back to TAI
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
   - Error should be gone!

---

### **Option 2: Full Version (With RLS Policies)**

Use this if you want proper security policies:

1. Same steps as above, but use `/database/programs-schema-fixed.sql` instead

---

## 🔍 TROUBLESHOOTING

### **If SQL Fails:**

Run the diagnostic script first:

1. Open `/database/diagnose-database.sql`
2. Copy and run in Supabase SQL Editor
3. Check the results:
   - ✅ = Table exists (good!)
   - ❌ = Table missing (that's the problem)

### **Common Errors:**

**Error: "relation already exists"**
- This is OKAY! It means tables are already there
- Just refresh your app

**Error: "permission denied"**
- Make sure you're logged into the correct Supabase project
- Make sure you're using the SQL Editor (not API)

**Error: "could not extend relation"**
- Your Supabase project might be out of storage
- Check your project limits

---

## 📊 What These Tables Do

### **`programs` table**
- Stores program metadata (title, description, points, etc.)
- Contains target roles (who can see this program)
- Tracks active/paused status

### **`program_fields` table**
- Defines dynamic form fields for each program
- Supports text, dropdown, photos, location, etc.
- Like Google Forms but more flexible

### **`submissions` table**
- Stores user responses to programs
- Contains photos, GPS location, field answers
- Tracks approval status and points

---

## 🎯 Sample Data

The SQL will create a sample program called **"Competitor Intel"** with fields:
- 📍 Location (GPS)
- 📱 Competitor Network (Safaricom/Telkom/Faiba)
- ⭐ Signal Strength (1-5 rating)
- 📸 Photo Evidence

This lets you test the feature immediately!

---

## 🛠️ Files Available

| File | Purpose |
|------|---------|
| `programs-schema-simple.sql` | ✅ **RECOMMENDED** - Simple version, no RLS |
| `programs-schema-fixed.sql` | Full version with security policies |
| `diagnose-database.sql` | Check if tables exist |
| `README-DATABASE-SETUP.md` | This file! |

---

## ✅ After Setup

Once the SQL runs successfully, you should be able to:

1. **As Director/HQ:**
   - Create new programs
   - Import from Excel/Google Forms
   - View submissions
   - Approve/reject submissions

2. **As Sales Executive:**
   - View available programs
   - Submit responses with photos + GPS
   - Earn points
   - See their submission history

---

## 🆘 Still Not Working?

If you've run the SQL and still see the error:

1. **Check the console** (F12 → Console tab)
   - Look for red errors
   - Share the error message

2. **Verify tables were created:**
   - Go to Supabase → Table Editor
   - Look for: `programs`, `program_fields`, `submissions`
   - If you don't see them, the SQL didn't run

3. **Try the diagnostic:**
   - Run `/database/diagnose-database.sql`
   - Share the results

---

## 💡 Why This Happened

The TAI app was built with all the frontend code ready, but the database tables need to be created manually in Supabase. This is a one-time setup - once done, it works forever!

---

**Questions?** Check the error modal in the app - it has step-by-step instructions!
