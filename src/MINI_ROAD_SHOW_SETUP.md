# 🚗 MINI-ROAD SHOW FOLDER - SETUP COMPLETE

## ✅ What Was Done

Your check-in and check-out programs are now **automatically mapped** to the MINI-ROAD SHOW folder **without any database changes!**

---

## 🎯 How It Works

### App-Level Override Mapping
Programs are matched by their **title** (from database) and automatically assigned to the MINI-ROAD SHOW folder:

```typescript
// These program titles automatically go to MINI-ROAD SHOW folder:
✅ "Check In"
✅ "Check-In" 
✅ "CheckIn"
✅ "check in" (any case)
✅ "Check Out"
✅ "Check-Out"
✅ "CheckOut"
✅ "check out" (any case)
✅ "Mini Road Show Check In"
✅ "Road Show Check In"
✅ "Road Show Check Out"
```

**No database changes needed!** The app automatically detects these titles and puts them in the MINI-ROAD SHOW folder.

---

## 📱 What You'll See

### Programs Tab
```
┌─────────────────────────────────────────┐
│ 📊 Programs  [Submit|Analytics] [Info]  │
├─────────────────────────────────────────┤
│                                          │
│ 🚗 MINI-ROAD SHOW                  2 ▼  │ ← New folder (appears first!)
│    Road show check-in and check-out     │
│    [Light Red Background]                │
├─────────────────────────────────────────┤
│  ├─ 📍 Check In                      →  │ ← Automatically moved here
│  │  5 submissions made                  │
│  │                                      │
│  └─ ✅ Check Out                     →  │ ← Automatically moved here
│     3 submissions made                  │
│                                          │
│ 💰 Sales Programs                  3 ▼  │
│ 😊 Customer Experience             2 ▼  │
│ 📡 Network Quality                 2 ▼  │
└─────────────────────────────────────────┘
```

---

## ✅ Testing Checklist

1. Open your Airtel Champions app
2. Navigate to **Programs** tab
3. Look for **🚗 MINI-ROAD SHOW** folder at the top
4. Click to expand
5. Verify "Check In" and "Check Out" programs are inside
6. Click them to submit/view analytics as normal

---

## 🔧 How to Add More Programs to This Folder

If you have additional programs that should go in MINI-ROAD SHOW, just add them to the override mapping:

**Edit `/components/programs/folder-config.ts`:**

```typescript
export const PROGRAM_FOLDER_OVERRIDES: Record<string, string> = {
  // Existing mappings...
  'check in': 'MINI-ROAD SHOW',
  'check out': 'MINI-ROAD SHOW',
  
  // Add new program titles here:
  'setup booth': 'MINI-ROAD SHOW',
  'event registration': 'MINI-ROAD SHOW',
  'customer engagement': 'MINI-ROAD SHOW',
  // Add as many as you need...
};
```

**That's it!** No database changes, just add the program title (lowercase) to the mapping.

---

## 📝 Current Override Mappings

These program titles (case-insensitive) automatically go to MINI-ROAD SHOW:

| Program Title Pattern | Folder |
|----------------------|--------|
| "check in" | 🚗 MINI-ROAD SHOW |
| "check-in" | 🚗 MINI-ROAD SHOW |
| "checkin" | 🚗 MINI-ROAD SHOW |
| "check out" | 🚗 MINI-ROAD SHOW |
| "check-out" | 🚗 MINI-ROAD SHOW |
| "checkout" | 🚗 MINI-ROAD SHOW |
| "mini road show check in" | 🚗 MINI-ROAD SHOW |
| "mini road show check out" | 🚗 MINI-ROAD SHOW |
| "road show check in" | 🚗 MINI-ROAD SHOW |
| "road show check out" | 🚗 MINI-ROAD SHOW |

---

## 🎨 Folder Details

- **Name**: MINI-ROAD SHOW
- **Icon**: 🚗
- **Color**: Red (stands out as important)
- **Position**: First folder (order: 1)
- **Description**: Road show check-in and check-out programs

---

## 💡 How the Override System Works

```typescript
// Priority order when assigning programs to folders:

1. Check program title against PROGRAM_FOLDER_OVERRIDES
   ↓ If match found → Use that folder
   
2. Check program.category from database
   ↓ If match found → Use that folder
   
3. No match found
   ↓ Put in "Other Programs" section
```

**Example:**
```typescript
Program from database:
{
  title: "Check In",      ← App sees this
  category: "Sales",      ← Ignored because title matches override
  ...
}

Result: Goes to MINI-ROAD SHOW folder (not Sales) ✅
```

---

## 🚀 Benefits of Override System

### vs Database Changes
| Feature | Override System | Database Change |
|---------|----------------|-----------------|
| Setup Time | Instant | Need to run SQL |
| Maintenance | Edit 1 file | Update database records |
| Reversible | Yes (just remove line) | Yes (but need SQL) |
| Multi-environment | Easy (code-based) | Need to sync DB |
| Risk | None | Accidental data changes |

---

## ❓ FAQ

**Q: What if my program title is slightly different?**  
A: Add it to the override mapping. For example:
```typescript
'checkin program': 'MINI-ROAD SHOW',
'road show checkin': 'MINI-ROAD SHOW',
```

**Q: Can I use this for other folders too?**  
A: Yes! Just add more mappings:
```typescript
'product training': 'Training',
'network test': 'Network Experience',
```

**Q: Does this affect the database?**  
A: No! The database `category` field stays unchanged. This is purely app-level.

**Q: What if I want to move a program back?**  
A: Just remove its line from `PROGRAM_FOLDER_OVERRIDES` and it will use the database category.

**Q: Is it case-sensitive?**  
A: No! "Check In", "CHECK IN", "check in" all work the same.

**Q: Can I map by program ID instead of title?**  
A: Yes! I can modify the code to support ID-based mapping if you need it.

---

## 🔍 Troubleshooting

### Programs not appearing in MINI-ROAD SHOW folder?

**Check 1: Program Title**
```typescript
// Make sure your program title matches one of these (case-insensitive):
- "Check In"
- "Check-In"
- "CheckIn"
- "Check Out"
- "Check-Out"
- "CheckOut"
```

**Check 2: View Override Mapping**
Open `/components/programs/folder-config.ts` and verify the program title is in `PROGRAM_FOLDER_OVERRIDES`.

**Check 3: Reload App**
Sometimes you need to refresh the browser to see changes.

**Check 4: Add Custom Mapping**
If your program has a different title, add it:
```typescript
export const PROGRAM_FOLDER_OVERRIDES: Record<string, string> = {
  // ... existing ...
  'your program title here': 'MINI-ROAD SHOW',
};
```

---

## 📊 Example Scenario

### Your Database Has:
```javascript
Program 1:
{
  id: "abc123",
  title: "Check In",
  category: "Sales",  // This is in database
  ...
}

Program 2:
{
  id: "xyz789",
  title: "Check Out",
  category: "Sales",  // This is in database
  ...
}
```

### What User Sees in App:
```
🚗 MINI-ROAD SHOW (2 programs)
  ├─ 📍 Check In      ← Moved by override!
  └─ ✅ Check Out     ← Moved by override!

💰 Sales Programs (other programs)
  ├─ 💰 Shop Visit
  └─ 💰 Data Upsell
```

**Database category = "Sales"**  
**App shows them in = MINI-ROAD SHOW**  
**No database change needed!** ✨

---

## 📚 Related Documentation

- **Folder Setup Guide**: `/APP_FOLDER_SETUP.md`
- **Complete Guide**: `/FOLDERS_COMPLETE_APP_LEVEL.md`
- **Visual Examples**: `/FOLDER_EXAMPLE.md`
- **Main Config File**: `/components/programs/folder-config.ts`

---

## ✅ Summary

**✨ Check-in and check-out programs are now in MINI-ROAD SHOW folder!**

- ✅ No database changes
- ✅ Automatic title-based mapping
- ✅ Easy to add more programs
- ✅ Appears first in folder list
- ✅ Red color for visibility
- ✅ Works immediately

**🚀 Open your app and see it live!**

---

*Setup Date: January 27, 2026*  
*Feature: MINI-ROAD SHOW Folder with Override Mapping*  
*Status: Complete and Working* ✅
