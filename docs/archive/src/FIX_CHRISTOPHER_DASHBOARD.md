# 🔧 Christopher Developer Dashboard - Troubleshooting Guide

**Issue:** Christopher's profile showing "S&D Director" instead of "Developer Dashboard"

---

## ✅ **SOLUTION IMPLEMENTED**

### **Step 1: Update Database Role**

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Update Christopher's role to 'developer'
UPDATE app_users 
SET role = 'developer'
WHERE LOWER(full_name) LIKE '%christopher%';

-- Verify the change
SELECT full_name, role, employee_id, phone_number
FROM app_users 
WHERE LOWER(full_name) LIKE '%christopher%';
```

**OR** if you know Christopher's exact details:

```sql
-- By phone number (safest)
UPDATE app_users 
SET role = 'developer'
WHERE phone_number = 'CHRISTOPHER_PHONE_HERE';

-- By employee ID
UPDATE app_users 
SET role = 'developer'
WHERE employee_id = 'DIR001' OR employee_id = 'DEV001';
```

---

### **Step 2: Check Role Constraints**

If you get an error about invalid role, run this:

```sql
-- Remove old constraint
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

-- Add new constraint including 'developer'
ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
  CHECK (role IN (
    'sales_executive', 
    'zonal_sales_manager', 
    'zonal_business_manager', 
    'hq_staff', 
    'director', 
    'developer'  -- NEW ROLE
  ));
```

---

### **Step 3: Clear Cache & Re-login**

After updating the database:

1. **Logout** from TAI app
2. **Clear localStorage**:
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Delete `tai_user` key
3. **Login again** with Christopher's credentials
4. Developer Dashboard should now appear! 🎉

---

## 🔍 **Debug Checklist**

### **Check 1: View Console Logs**

When logged in as Christopher, open DevTools Console and look for:

```
🔍 User Authentication Check: {
  userRole: "developer",          // Should be "developer"
  fullName: "Christopher ...",    // Should include "christopher"
  employeeId: "DEV001",           // Or whatever ID
  isDeveloper: true,              // Should be true
  isChristopher: true             // Should be true
}
```

### **Check 2: Verify Routing Logic**

The app checks in this order:

1. ✅ Is `role === 'developer'`? → Developer Dashboard
2. ✅ Does name include "christopher"? → Developer Dashboard  
3. ✅ Is `employee_id === 'DEV001'`? → Developer Dashboard
4. ❌ None match? → Regular Director Dashboard

**Current Code (App.tsx lines 126-142):**

```typescript
// Developer Dashboard - Check for Christopher or developer role
if (userRole === 'developer' || 
    userData?.full_name?.toLowerCase().includes('christopher') ||
    userData?.employee_id === 'DEV001' ||
    user?.full_name?.toLowerCase().includes('christopher')) {
  return (
    <MobileContainer>
      <DeveloperDashboard user={user} userData={userData} onLogout={handleLogout} />
    </MobileContainer>
  );
}

if (userRole === 'director') {
  return (
    <MobileContainer>
      <DirectorDashboard user={user} userData={userData} onLogout={handleLogout} />
    </MobileContainer>
  );
}
```

---

## 🎯 **Quick Fixes**

### **Fix A: Force Developer Dashboard (Temporary)**

If you need immediate access, temporarily hardcode it:

```typescript
// In App.tsx around line 97
if (isAuthenticated) {
  const userRole = user?.role || userData?.role;
  
  // TEMPORARY: Always show developer dashboard for testing
  return (
    <MobileContainer>
      <DeveloperDashboard user={user} userData={userData} onLogout={handleLogout} />
    </MobileContainer>
  );
}
```

### **Fix B: Update Role via Code**

Add this temporary button to the Director Dashboard:

```typescript
// In DirectorDashboard component
<button
  onClick={async () => {
    const { error } = await supabase
      .from('app_users')
      .update({ role: 'developer' })
      .eq('id', userData.id);
    
    if (!error) {
      alert('Role updated! Please logout and login again.');
    }
  }}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg"
>
  🔧 Switch to Developer Role
</button>
```

---

## 📊 **Expected vs Actual**

### **Current State (Wrong):**
```
Header: "Good morning, ☀️"
Badge: "👑 S&D Director"
Content: "Director Dashboard - Executive KPIs"
Bottom Nav: Dashboard | Insights | Leaderboard | Reports
```

### **Expected State (Correct):**
```
Header: "Developer Dashboard 💻"
Badge: "Christopher • Full System Access"
Content: Analytics with user stats, role distribution
Bottom Nav: Analytics | Users | Events | System
Theme: Purple gradient (instead of yellow)
```

---

## 🔐 **Database Schema Reference**

### **app_users Table Structure:**

```sql
CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT UNIQUE,
  employee_id TEXT,
  role TEXT CHECK (role IN ('sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 'hq_staff', 'director', 'developer')),
  zone TEXT,
  region TEXT,
  zsm TEXT,
  zbm TEXT,
  total_points INTEGER DEFAULT 0,
  pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Christopher's Ideal Record:**

```sql
{
  "id": "...",
  "full_name": "Christopher [Last Name]",
  "phone_number": "[his number]",
  "employee_id": "DEV001",
  "role": "developer",  -- THIS IS KEY!
  "zone": "System Admin",
  "region": "All",
  "total_points": 0,
  "pin": "1234"
}
```

---

## 🎨 **Visual Indicators of Success**

When Developer Dashboard is working, you'll see:

✅ **Purple gradient header** (not yellow)  
✅ **"Developer Dashboard 💻"** title  
✅ **"Christopher • Full System Access"** badge  
✅ **Real-time stats cards** (Total Users, Active, On Leave, Roles)  
✅ **Role distribution breakdown** (SE/ZSM/ZBM/HQ/Director counts)  
✅ **User list** with all 662+ users  
✅ **Bottom navigation:** Analytics | Users | Events | System  

---

## 🚨 **Common Issues**

### **Issue 1: Still showing Director Dashboard after SQL update**

**Solution:** 
- Logout completely
- Clear browser cache/localStorage
- Login again
- The role change only applies to NEW login sessions

### **Issue 2: "developer is not a valid role" error**

**Solution:**
- Run the constraint update SQL (Step 2 above)
- The database may have a CHECK constraint limiting valid roles

### **Issue 3: Name check not working**

**Reason:** The name in the database might be:
- "Christopher" (works ✅)
- "Chris" (won't work ❌)
- "christopher" lowercase (works ✅)
- With middle/last name like "Christopher Doe" (works ✅)

**Solution:** Add more name variations to the check:
```typescript
userData?.full_name?.toLowerCase().includes('christopher') ||
userData?.full_name?.toLowerCase().includes('chris') ||
```

### **Issue 4: Multiple users named Christopher**

**Solution:** Use employee_id check instead:
```typescript
if (userData?.employee_id === 'DEV001') {
  // Only the one true Christopher
}
```

---

## ✅ **Verification Steps**

### **1. Check Database:**
```sql
SELECT role, full_name FROM app_users WHERE LOWER(full_name) LIKE '%christopher%';
```
Expected: `role = 'developer'`

### **2. Check LocalStorage:**
Open DevTools → Application → Local Storage → Check `tai_user`:
```json
{
  "role": "developer",
  "full_name": "Christopher ..."
}
```

### **3. Check Console:**
Look for the debug log:
```
🔍 User Authentication Check: { isDeveloper: true, isChristopher: true }
```

### **4. Visual Check:**
- Header color: Purple (not yellow)
- Title: "Developer Dashboard 💻"
- Bottom nav: 4 tabs (Analytics/Users/Events/System)

---

## 📞 **Need More Help?**

If none of this works:

1. **Export Christopher's user record:**
   ```sql
   SELECT * FROM app_users WHERE LOWER(full_name) LIKE '%christopher%';
   ```

2. **Check the exact role value:**
   ```sql
   SELECT role, pg_typeof(role) FROM app_users WHERE LOWER(full_name) LIKE '%christopher%';
   ```

3. **Manually set via Supabase UI:**
   - Go to Supabase Dashboard
   - Navigate to Table Editor → `app_users`
   - Find Christopher's row
   - Click to edit
   - Change `role` to `developer`
   - Save

---

## 🎯 **Final Checklist**

- [ ] SQL UPDATE run successfully
- [ ] Role constraint allows 'developer'
- [ ] Christopher logged out
- [ ] localStorage cleared
- [ ] Christopher logged back in
- [ ] Console shows `isDeveloper: true`
- [ ] Purple header visible
- [ ] "Developer Dashboard 💻" title shows
- [ ] Analytics tab displays user counts
- [ ] Bottom nav has 4 tabs

**When all checked:** Developer Dashboard is working! 🎉

---

## 💡 **Pro Tip**

Create a "Developer Mode Toggle" for future flexibility:

```typescript
// Add to settings or profile
const toggleDeveloperMode = async () => {
  const currentRole = userData.role;
  const newRole = currentRole === 'developer' ? 'director' : 'developer';
  
  await supabase
    .from('app_users')
    .update({ role: newRole })
    .eq('id', userData.id);
  
  alert(`Role changed to ${newRole}. Please re-login.`);
  handleLogout();
};
```

This way Christopher can switch between Director and Developer views for testing!

---

**Status:** 🔧 **READY TO FIX**  
**Time to Fix:** ⏱️ **2-5 minutes**  
**Priority:** 🔴 **HIGH**
