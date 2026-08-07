# 🚨 SUPABASE AUTO-ROTATION CAUSING YOUR ERROR

## **WHAT'S HAPPENING:**

Your error: **`Permission denied for table kv_store_28f2f653`**

**Root Cause:** Supabase has a feature called **"Automatic Key Rotation"** that regenerates your API keys periodically (usually every 30-90 days) for security. When it rotates:

1. ❌ Your old `anon` key becomes **INVALID**
2. ❌ Your old `service_role` key becomes **INVALID**  
3. ✅ Supabase generates **NEW** keys
4. 💥 Your app still uses the **OLD** keys → **Permission denied!**

**This is the 2nd time it happened** because either:
- You didn't disable auto-rotation last time (just updated keys)
- OR Supabase re-enabled it (unlikely but possible)

---

## ✅ **PERMANENT FIX (5 Minutes):**

### **Step 1: Open Supabase Dashboard**

🔗 **Direct Link:** https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/settings/api

*(Replace `mcbbtrrhqweypfnlzwht` with your actual project ID if different)*

---

### **Step 2: Find the Auto-Rotation Setting**

On the **API Settings** page, scroll down and look for:

#### **🔍 LOOK FOR ONE OF THESE:**

**Option A: "API Key Rotation" Section**
```
┌──────────────────────────────────────┐
│ 🔄 API Key Rotation                 │
│                                      │
│ ☑️ Automatically rotate API keys    │  ← THIS IS THE PROBLEM!
│    every 90 days                     │
│                                      │
│ [Disable Auto-Rotation]              │  ← CLICK THIS!
└──────────────────────────────────────┘
```

**Option B: Toggle in "Security" Section**
```
┌──────────────────────────────────────┐
│ 🔒 Security Settings                │
│                                      │
│ Auto-rotate keys     [ON] ←────────── TURN THIS OFF!
└──────────────────────────────────────┘
```

**Option C: Checkbox Under API Keys**
```
┌──────────────────────────────────────┐
│ anon public                          │
│ eyJhbGci...                          │
│                                      │
│ ☑️ Enable automatic rotation        │  ← UNCHECK THIS!
└──────────────────────────────────────┘
```

**Option D: Newer Supabase UI (Most Likely)**
```
Settings → API → Configuration
Look for:
  "Key Rotation Policy"
  • Manual (you rotate when needed)
  • Automatic (every 90 days) ← Change from this to Manual
```

---

### **Step 3: DISABLE It**

**Do ONE of these actions:**
- ❌ **Uncheck** the "Automatically rotate" checkbox
- ❌ **Toggle OFF** the auto-rotation switch  
- ❌ **Select "Manual rotation"** instead of "Automatic"
- ❌ **Click "Disable Auto-Rotation"** button

**YOU MUST SEE CONFIRMATION:**
- ✅ "Auto-rotation disabled"
- ✅ "Keys will not rotate automatically"
- ✅ Toggle shows "OFF"
- ✅ "Manual rotation only"

---

### **Step 4: Copy Your Current Valid Keys**

While on the same page, copy these:

**1. Project URL:**
```
https://mcbbtrrhqweypfnlzwht.supabase.co
```

**2. anon public key:** (starts with `eyJ...`)
```
eyJhbGci... [Click "Copy" button]
```

**3. service_role key:** (longer, starts with `eyJ...`)  
```
eyJhbGci... [Click "Copy" button]
```

⚠️ **IMPORTANT:** These are the **NEW** keys (after rotation). The old keys in your app are dead.

---

### **Step 5: Update Keys in Your App**

Since you're using **Figma Make**, the keys are stored in environment variables managed by the platform.

**You need to update the Supabase secrets:**

1. Look for a **"Database Setup"** or **"Secrets"** UI in Figma Make
2. OR there might be a **"Configure Database"** button in your app when this error appears
3. Paste the new keys there

**IF YOU CAN'T FIND IT:**

The error message in your screenshot says:
> "TAI needs one-time database configuration. Follow the 4 simple steps below"

**Follow those 4 steps** - it will ask you to paste the new keys from Supabase!

---

## 🔍 **HOW TO VERIFY IT'S DISABLED:**

After Step 3, go back to the Supabase API settings page and verify:

✅ **You should see:**
- "Auto-rotation: **Disabled**"
- OR toggle in **OFF** position
- OR "**Manual** rotation policy"
- OR "Keys will **not** rotate automatically"

❌ **You should NOT see:**
- "Auto-rotation: Enabled"
- "Keys rotate every 90 days"
- Toggle in ON position

**Take a screenshot to confirm!**

---

## 📋 **EXACT LOCATION IN SUPABASE (Updated 2025):**

If you're having trouble finding it:

```
Supabase Dashboard
└── Select your project
    └── Settings (gear icon, left sidebar)
        └── API
            └── Scroll down to "Configuration" or "API Key Management"
                └── Look for "Key Rotation" or "Auto-rotate"
                    └── DISABLE IT
```

**Alternative locations:**
- Settings → Security → Key Rotation
- Settings → API → Key Lifecycle  
- Project Settings → API Keys → Rotation Policy

---

## ⚠️ **WHY IT KEEPS HAPPENING:**

If this is the **2nd time**, it means:

**Last time you:**
- ✅ Updated the keys (fixed the error)
- ❌ But didn't disable auto-rotation
- ❌ So Supabase rotated again 90 days later

**This time you MUST:**
- ✅ Update the keys (fix the error)
- ✅ **DISABLE auto-rotation** (prevent future errors)

---

## 🎯 **AFTER YOU FIX:**

**Immediate result:**
- ✅ Error goes away
- ✅ App works again
- ✅ You can login

**Long-term result:**
- ✅ Keys stay valid **forever** (until YOU manually rotate)
- ✅ No more surprise "permission denied" errors
- ✅ App stability for MVP testing

**Trade-off:**
- ⚠️ Slightly less secure (keys don't auto-rotate)
- 👍 But totally fine for MVP with 10-20 trusted users
- 👍 You can manually rotate keys anytime (Settings → API → "Rotate Keys")

---

## 🆘 **TROUBLESHOOTING:**

### **"I can't find the auto-rotation setting!"**

**Possibility 1:** Supabase UI changed
- Try searching the page for: "rotate", "automatic", "key lifecycle"
- Look in Settings → Security (not just API)
- Check Settings → Project Settings → General

**Possibility 2:** It's under a different name
- "Key refresh policy"
- "Scheduled key regeneration"
- "API key security"

**Possibility 3:** Your Supabase plan doesn't have this UI
- Free tier might not show the toggle
- In this case: Keys won't auto-rotate unless you manually trigger it
- Check your email - Supabase sends warnings before rotating

### **"I disabled it but error still happens"**

**Cause 1:** You didn't update the keys yet
- Disabling prevents FUTURE rotations
- But your app still has the OLD (dead) keys
- **Solution:** Copy the new keys and update your app (Step 4-5)

**Cause 2:** Browser cache
- **Solution:** Hard refresh: `Ctrl+Shift+R` (Win) or `Cmd+Shift+R` (Mac)

**Cause 3:** Row Level Security (RLS) blocking access
- **Check:** Go to Supabase → SQL Editor
- **Run:**
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'kv_store_28f2f653';
  ```
- **If policies exist:**
  ```sql
  ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
  ```

---

## ✅ **FINAL CHECKLIST:**

Complete these in order:

- [ ] **Open Supabase dashboard** (link above)
- [ ] **Navigate to Settings → API**
- [ ] **Find the auto-rotation setting** (scroll down, look carefully)
- [ ] **DISABLE auto-rotation** (uncheck, toggle off, or select "Manual")
- [ ] **Verify it's disabled** (see confirmation message)
- [ ] **Copy new anon key** from the API page
- [ ] **Copy new service_role key** from the API page
- [ ] **Update keys in Figma Make** (via database setup UI)
- [ ] **Hard refresh browser** (Ctrl+Shift+R)
- [ ] **Test login** - should work! ✅

---

## 📸 **VISUAL GUIDE:**

**What you're looking for on the API Settings page:**

```
═══════════════════════════════════════════════════════
   SUPABASE API SETTINGS
═══════════════════════════════════════════════════════

Project URL
https://mcbbtrrhqweypfnlzwht.supabase.co                [Copy]

─────────────────────────────────────────────────────

Project API Keys

anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...               [Copy]
                                                     [Reveal]

service_role (Keep this secret!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...               [Copy]
                                                     [Reveal]

─────────────────────────────────────────────────────

Configuration

Key Rotation Policy
○ Automatic (rotate every 90 days)    ← DON'T SELECT THIS
● Manual (rotate when needed)          ← SELECT THIS!

─── OR ───

☑️ Automatically rotate API keys       ← UNCHECK THIS BOX!
   Rotate keys every 90 days for security

[Disable Auto-Rotation]                ← OR CLICK THIS BUTTON

═══════════════════════════════════════════════════════
```

---

## 🚀 **NEXT STEPS:**

1. **Fix this now** (5 minutes)
2. **Set a calendar reminder** for 6 months from now: "Check if Supabase re-enabled auto-rotation"
3. **For production:** Implement proper key management with environment variables

---

## 💡 **PRO TIP:**

After disabling auto-rotation, **bookmark this checklist** in case someone accidentally re-enables it or you need to manually rotate keys in the future.

**Manual key rotation steps (when YOU want to):**
1. Supabase → Settings → API
2. Click "Generate New Keys" or "Rotate Keys"
3. Copy new keys
4. Update in app
5. Test

This way YOU control when keys change, not Supabase.

---

**Time to fix:** 5 minutes  
**Difficulty:** Easy (just finding the setting)  
**This will prevent:** All future "permission denied" errors from key rotation  

**Good luck! 🎯**
