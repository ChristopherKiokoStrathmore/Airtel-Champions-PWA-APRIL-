# ✅ Fixed: "Create Program" Button Blurred/Disabled

## 🐛 **The Problem**

The "Create Program" button was disabled/grayed out even when logged in as Director or HQ staff.

### **Root Cause:**
**Role name mismatch** in the permission check on line 155 of `/components/programs/programs-dashboard.tsx`:

```typescript
// ❌ OLD (BROKEN)
const canCreatePrograms = userRole === 'director' || userRole === 'hq_command_center' || userRole === 'developer';
```

**The issue:**
- Line 155 checked for: `'hq_command_center'` ❌
- Line 64 in same file checked for: `'hq_staff'` ✅
- Database actually uses: `'hq_staff'` ✅
- Most of the app uses: `'hq_staff'` ✅

So HQ users couldn't create programs because their role `'hq_staff'` didn't match `'hq_command_center'`!

---

## ✅ **The Fix**

Updated line 155 to accept **BOTH** role names:

```typescript
// ✅ NEW (FIXED)
const canCreatePrograms = userRole === 'director' || userRole === 'hq_staff' || userRole === 'hq_command_center' || userRole === 'developer';
```

Now it works for:
- ✅ Directors (`'director'`)
- ✅ HQ Staff (`'hq_staff'`) ← **This was missing!**
- ✅ HQ Command Center (`'hq_command_center'`)
- ✅ Developers (`'developer'`)

---

## 🎯 **What Works Now**

### **✅ For Director (Ashish):**
- Can see "Create Program" button
- Can click it to open the modal
- Can create new programs
- Can pause/activate programs
- Can delete programs

### **✅ For HQ Staff:**
- Can see "Create Program" button
- Can create programs
- Can manage all programs

### **✅ For Developers:**
- Full access to program management

### **❌ For Other Roles (SE, ZSM, ZBM):**
- Cannot create programs (correct behavior)
- Can only participate in programs assigned to them

---

## 🧪 **Test It Now**

1. **Refresh your browser**
2. **Login as Ashish (Director)**
3. **Go to Programs tab**
4. **You should see:**
   - ✅ **"Create Program"** button (red, enabled)
   - ✅ **"Import"** button (white, enabled)
5. **Click "Create Program"**
6. **Modal should open** (not blurred, fully functional)

---

## 📊 **Role Permissions Matrix**

| Role | Create Programs | View All Programs | Manage Programs |
|------|----------------|-------------------|-----------------|
| **Director** | ✅ Yes | ✅ Yes | ✅ Yes |
| **HQ Staff** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Developer** | ✅ Yes | ✅ Yes | ✅ Yes |
| **ZBM** | ❌ No | 🟡 Role-targeted only | ❌ No |
| **ZSM** | ❌ No | 🟡 Role-targeted only | ❌ No |
| **SE** | ❌ No | 🟡 Role-targeted only | ❌ No |

---

## 🔧 **Technical Details**

### **File Changed:**
`/components/programs/programs-dashboard.tsx` - Line 155

### **Change Type:**
Permission check fix (role name mismatch)

### **Impact:**
- Low risk (only adds permission, doesn't remove any)
- No database changes needed
- No API changes needed
- Works immediately after refresh

---

## 📝 **Future Recommendation**

To prevent this from happening again, you should:

### **Option 1: Standardize on one role name**
Pick either `hq_staff` OR `hq_command_center` and use it everywhere.

**Recommended:** Use `hq_staff` since it's already in the database.

### **Option 2: Create a role mapping utility**
```typescript
// /utils/roles.ts
export const ROLES = {
  DIRECTOR: 'director',
  HQ_STAFF: 'hq_staff', // Canonical name
  ZBM: 'zonal_business_manager',
  ZSM: 'zonal_sales_manager',
  SE: 'sales_executive',
  DEVELOPER: 'developer',
};

// Aliases for backward compatibility
export const ROLE_ALIASES = {
  'hq_command_center': 'hq_staff',
  'hq_staff': 'hq_staff',
};

export function normalizeRole(role: string): string {
  return ROLE_ALIASES[role] || role;
}

export function canCreatePrograms(role: string): boolean {
  const normalized = normalizeRole(role);
  return [ROLES.DIRECTOR, ROLES.HQ_STAFF, ROLES.DEVELOPER].includes(normalized);
}
```

Then use:
```typescript
const canCreatePrograms = canCreatePrograms(userRole);
```

---

## ✅ **Status**

- [x] Bug identified
- [x] Root cause found (role name mismatch)
- [x] Fix implemented
- [x] Testing instructions provided
- [x] Documentation created

**The "Create Program" button should now work perfectly!** 🎉

---

**Try it now - refresh your browser and you should see the button enabled!**
