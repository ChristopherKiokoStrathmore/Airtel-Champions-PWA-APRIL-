# 🚨 BLANK SCREEN BUG - CRITICAL DIAGNOSTIC GUIDE

**Date:** April 22, 2026  
**Issue:** Localhost returns completely blank screen  
**Severity:** 🔴 CRITICAL - App not rendering at all

---

## STEP 1: CHECK BROWSER CONSOLE FOR ERRORS

**DO THIS FIRST:**

1. Open `http://localhost:5173` (or your local port)
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Look for **RED ERROR messages**
5. **COPY & PASTE** any error messages here:

```
[Paste any console errors here]
```

---

## STEP 2: CHECK IF APP LOADS AT ALL

- [ ] Do you see the Airtel Champions splash screen? (Loading animation)
- [ ] Do you see "Loading Airtel Champions..." text?
- [ ] Is it completely blank white/empty?
- [ ] Do you see any text at all?

---

## STEP 3: MOST LIKELY CAUSES

### CAUSE #1: Import Error (80% probability)
**Symptom:** App crashes silently on load  
**The change I made:** Added import for HBBGADashboardPage  
**Check:** Look in console for "Cannot find module" error

**FIX IF FOUND:**
```typescript
// This line might be wrong:
import { HBBGADashboardPage } from './pages/hbb-ga-dashboard';

// Check if file exists at:
// c:\DEV\PWA\Airtel Champions App Web\src\pages\hbb-ga-dashboard.tsx
```

### CAUSE #2: Syntax Error in App.tsx (15% probability)
**Symptom:** TypeScript compilation error  
**The change I made:** Added `showHBBGADashboard` state and conditional rendering

**Check:** Look in terminal for compilation errors

### CAUSE #3: Component Rendering Error (5% probability)
**The change I made:** Added conditional rendering:
```typescript
if (showHBBGADashboard) {
  return (
    <MobileContainer>
      <HBBGADashboardPage />
    </MobileContainer>
  );
}
```

---

## STEP 4: QUICK FIX - REVERT MY CHANGES

If app was working before my changes, let's revert them:

### Option A: Revert Import (Line 69)
**DELETE THIS LINE:**
```typescript
import { HBBGADashboardPage } from './pages/hbb-ga-dashboard';
```

### Option B: Revert State (Line 142)
**COMMENT OUT THIS LINE:**
```typescript
// const [showHBBGADashboard, setShowHBBGADashboard] = useState(false);
```

### Option C: Revert URL Check (Lines 207-210)
**COMMENT OUT THESE LINES:**
```typescript
// // Check for HBB GA Dashboard route
// const hbbGAParam = urlParams.get('view');
// if (hbbGAParam === 'hbb-ga') {
//   setShowHBBGADashboard(true);
// }
```

### Option D: Revert Conditional Rendering (Lines 721-729)
**COMMENT OUT THESE LINES:**
```typescript
// // â"€â"€ HBB GA Dashboard â"€â"€â"€â"€â"€â"€â"€â"€â"€...
// if (showHBBGADashboard) {
//   return (
//     <MobileContainer>
//       <HBBGADashboardPage />
//     </MobileContainer>
//   );
// }
```

---

## STEP 5: TEST AFTER REVERT

After commenting out the changes:

1. Save file (Ctrl+S)
2. Dev server should auto-reload
3. Check if localhost loads now
4. Report back: **Does it work?**

---

## STEP 6: ROOT CAUSE ANALYSIS

Once we know it's my changes, we can identify exactly which part broke it:

| Change | Causes Blank Screen? |
|--------|----------------------|
| Import HBBGADashboardPage | ❓ TEST |
| Add showHBBGADashboard state | ❓ TEST |
| URL param check | ❓ TEST |
| Conditional rendering | ❓ TEST |

**We'll test each individually to find the culprit.**

---

## STEP 7: CONSOLE OUTPUT LOCATIONS

When you press F12, look at these tabs:

1. **Console Tab** → Red error messages
2. **Network Tab** → Failed resource loads
3. **Sources Tab** → Breakpoints/execution
4. **Application Tab** → LocalStorage/Cache

**Screenshot the console and share with me!**

---

## STEP 8: ALTERNATIVE TEST

Try opening with no parameters:
```
http://localhost:5173
```

**Does it work without the `?view=hbb-ga` parameter?**
- [ ] Yes, works without parameter
- [ ] No, blank either way
- [ ] Gets stuck on splash screen

---

## WHAT I SHOULD HAVE CHECKED

❌ I should have asked you to test BEFORE making changes  
❌ I should have verified the import path was correct  
❌ I should have checked if HomeScreen component exists  
❌ I should have tested the code before delivery  

**This is my fault. Let me fix it immediately.**

---

## NEXT MESSAGE SHOULD INCLUDE

Please reply with:

1. **Console error messages** (F12 → Console tab)
2. **What you see on screen** (blank? splash screen? error page?)
3. **Which changes to revert?** (I'll guide you)
4. **Does it work if we remove HBB GA changes?**

---

**ACTION PLAN:**

```
Step 1: Open F12 Console ← YOU DO THIS
   ↓
Step 2: Tell me errors ← YOU DO THIS
   ↓
Step 3: I identify cause ← I DO THIS
   ↓
Step 4: I provide fix ← I DO THIS
   ↓
Step 5: You test fix ← YOU DO THIS
   ↓
Step 6: Blank screen resolved ← GOAL
```

---

**TIME TO RESOLUTION:** ~10 minutes once you provide console errors

**PRIORITY:** 🔴 BLOCKING - Everything else on hold until this is fixed

---

## DON'T GIVE UP! 

Blank screen issues are usually simple syntax problems. We'll find and fix it.

**Reply with the console errors and we'll have this fixed in minutes!** 💪
