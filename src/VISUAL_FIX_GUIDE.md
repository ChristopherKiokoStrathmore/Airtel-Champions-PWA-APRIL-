# ⚡ VISUAL FIX GUIDE - 30 SECONDS

## 📁 File to Edit
`/components/programs/program-submit-modal.tsx`

## 🔍 Search For
Press `Ctrl+F` → Type: **isSiteField**

---

## 📝 BEFORE (Lines 1296-1300) - DELETE THIS:

```typescript
const isSiteField = /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\d+$/.test(field.field_name);
const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false; // Default true
if (isSiteField && useProgressiveDisclosure) {
  return null; // Skip rendering - handled separately below with progressive UI
}
```

---

## ✅ AFTER - PASTE THIS:

```typescript
if (shouldSkipField(field)) {
  return null;
}
```

---

## 📊 Side-by-Side Comparison

| Before | After |
|--------|-------|
| `const isSiteField = /^(monday...` | `if (shouldSkipField(field)) {` |
| `const useProgressiveDisclosure = ...` | `  return null;` |
| `if (isSiteField && useProgressiveDisclosure) {` | `}` |
| `  return null; // Skip...` | |
| `}` | |
| **5 lines** | **3 lines** |

---

## 🎯 What You're Doing

**OLD CODE:**
- ❌ Only checks for pattern `monday_site_1`, `tuesday_site_2`, etc.
- ❌ Doesn't check for NEW pattern `monday_sites`, `tuesday_sites`
- ❌ Causes double rendering

**NEW CODE:**
- ✅ Uses helper function that checks BOTH patterns
- ✅ Already defined at line 32 (I added it earlier)
- ✅ Fixes double rendering

---

## 🖼️ Visual Result

### BEFORE FIX (Your Screenshot 2):
```
┌─────────────────────────────────┐
│ Van Weekly Calendar             │
├─────────────────────────────────┤
│ Select Van *                    │
│ [van dropdown]                  │
│                                 │
│ Week Starting *                 │
│ [date]                          │
│                                 │
│ Monday Sites                    │ ← ❌ DUPLICATE!
│ [AGA_KHAN_ACADEMY]              │
│                                 │
│ ╔══════════════════════════════╗│
│ ║ 🚐 Weekly Route Planning     ║│
│ ║ Monday            1/4 sites  ║│
│ ║   Site 1 *                   ║│
│ ║   [AGA_KHAN_ACADEMY]         ║│ ← ❌ DUPLICATE!
│ ║                              ║│
│ ╚══════════════════════════════╝│
└─────────────────────────────────┘
```

### AFTER FIX (Expected):
```
┌─────────────────────────────────┐
│ Van Weekly Calendar             │
├─────────────────────────────────┤
│ Select Van *                    │
│ [van dropdown]                  │
│                                 │
│ Week Starting *                 │
│ [date]                          │
│                                 │ ← ✅ NO MORE DUPLICATE!
│ ╔══════════════════════════════╗│
│ ║ 🚐 Weekly Route Planning     ║│
│ ║ Monday            1/4 sites  ║│
│ ║   Site 1 *                   ║│
│ ║   [AGA_KHAN_ACADEMY]         ║│
│ ║   ┌────────────────────────┐ ║│
│ ║   │ SITE ID: MSA0278       │ ║│
│ ║   │ ZONE: COAST            │ ║│
│ ║   └────────────────────────┘ ║│
│ ║                              ║│
│ ║   [+ Add Monday Site 2]      ║│
│ ╚══════════════════════════════╝│
└─────────────────────────────────┘
```

---

## ⏱️ Time Required
**30 seconds** - Find, delete 5 lines, paste 3 lines, save, refresh

---

## 🔗 Exact Location

```
Line 1292: {/* Form Fields */}
Line 1293: <div className="space-y-4 mb-6"...
Line 1294: {fields.map((field) => {
Line 1295:   // 🆕 SKIP Van Calendar site fields...
Line 1296: ← START DELETING HERE ❌
Line 1297: ← DELETE
Line 1298: ← DELETE
Line 1299: ← DELETE
Line 1300: ← DELETE (end here)
Line 1301: ← (blank line - keep this)
Line 1302: // Support both field_label and label...
```

---

## ✅ Checklist

- [ ] Opened `/components/programs/program-submit-modal.tsx`
- [ ] Found line 1296 (search "isSiteField")
- [ ] Deleted lines 1296-1300 (5 lines)
- [ ] Pasted 3 new lines
- [ ] Saved file (`Ctrl+S`)
- [ ] Hard refreshed browser (`Ctrl+Shift+R`)
- [ ] Tested: "Monday Sites" only appears ONCE (in blue box)
- [ ] Tested: Can select Site 2 and Site 3

---

## 🆘 Still Stuck?

Take a screenshot of lines 1290-1310 and I'll give you the exact text to copy/paste.
