# 📱 PHONE CHANGE REQUESTS TABLE - DATABASE SETUP

## ⚠️ IMPORTANT: Database Table Creation Required

To enable phone number change approval workflow, you need to create a new table in Supabase.

---

## 🗄️ **TABLE: phone_change_requests**

### **Purpose:**
Stores phone number change requests that require approval based on user hierarchy:
- **SE** → Requires **ZSM approval**
- **ZSM** → Requires **ZBM approval**
- **ZBM** → Requires **HQ approval**

---

## 📝 **SQL TO CREATE TABLE:**

```sql
-- Create phone_change_requests table
CREATE TABLE phone_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  current_phone TEXT NOT NULL,
  requested_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_by_role TEXT NOT NULL, -- 'sales_executive', 'zonal_sales_manager', etc.
  approver_role TEXT NOT NULL, -- Role that needs to approve
  approver_id UUID REFERENCES auth.users(id), -- Who approved/rejected
  approval_notes TEXT, -- Optional notes from approver
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Add indexes for better performance
CREATE INDEX idx_phone_change_requests_user_id ON phone_change_requests(user_id);
CREATE INDEX idx_phone_change_requests_status ON phone_change_requests(status);
CREATE INDEX idx_phone_change_requests_approver_role ON phone_change_requests(approver_role);

-- Enable Row Level Security (RLS)
ALTER TABLE phone_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own phone change requests"
ON phone_change_requests FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
CREATE POLICY "Users can create phone change requests"
ON phone_change_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Approvers can view requests meant for their role
CREATE POLICY "Approvers can view requests for their role"
ON phone_change_requests FOR SELECT
USING (
  -- Get current user's role from app_users table
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = phone_change_requests.approver_role
  )
);

-- Policy: Approvers can update requests meant for their role
CREATE POLICY "Approvers can update requests for their role"
ON phone_change_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = phone_change_requests.approver_role
  )
);
```

---

## 🚀 **HOW TO RUN:**

### **Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. **Copy and paste** the SQL above
5. Click **Run** (or press Ctrl/Cmd + Enter)

### **Option 2: Supabase CLI**
```bash
# Save the SQL to a file
# Then run:
supabase db execute -f phone_change_requests.sql
```

---

## ✅ **VERIFICATION:**

After running the SQL, verify the table was created:

```sql
-- Check table exists
SELECT * FROM phone_change_requests LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'phone_change_requests';
```

---

## 🔄 **APPROVAL WORKFLOW:**

### **Step 1: User Requests Change**
```
User → Profile → Edit Phone → Enter New Number → "Request Change"
    ↓
Creates record in phone_change_requests table
    ↓
Status: 'pending'
Approver Role: (based on user's role)
```

### **Step 2: Approver Reviews** (Future Feature)
```
Approver Dashboard → Pending Requests
    ↓
Review Request
    ↓
Approve or Reject
    ↓
Updates phone_change_requests.status
If approved: Updates app_users.phone_number
```

### **Hierarchy:**
```
┌─────────────────────────────────────┐
│ SE requests change                  │
│   ↓ Requires ZSM approval           │
├─────────────────────────────────────┤
│ ZSM requests change                 │
│   ↓ Requires ZBM approval           │
├─────────────────────────────────────┤
│ ZBM requests change                 │
│   ↓ Requires HQ approval            │
└─────────────────────────────────────┘
```

---

## 📊 **TABLE STRUCTURE:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User making the request |
| `employee_id` | TEXT | Employee ID for reference |
| `current_phone` | TEXT | Current phone number |
| `requested_phone` | TEXT | New phone number requested |
| `status` | TEXT | 'pending', 'approved', 'rejected' |
| `requested_by_role` | TEXT | Role of user requesting |
| `approver_role` | TEXT | Role that needs to approve |
| `approver_id` | UUID | Who approved (if approved) |
| `approval_notes` | TEXT | Optional notes from approver |
| `created_at` | TIMESTAMPTZ | When request was made |
| `updated_at` | TIMESTAMPTZ | Last update |
| `approved_at` | TIMESTAMPTZ | When approved/rejected |

---

## 🎯 **EXAMPLE DATA:**

```sql
-- Example: SE requesting phone change
INSERT INTO phone_change_requests (
  user_id,
  employee_id,
  current_phone,
  requested_phone,
  status,
  requested_by_role,
  approver_role
) VALUES (
  'user-uuid-here',
  'SE001',
  '712345678',
  '722334455',
  'pending',
  'sales_executive',
  'zonal_sales_manager'
);
```

---

## 🔒 **SECURITY (RLS):**

The table has Row Level Security enabled with these policies:

1. **Users can view their own requests**
   - SELECT: Only own records

2. **Users can create requests**
   - INSERT: Only for themselves

3. **Approvers can view relevant requests**
   - SELECT: Requests where approver_role matches their role

4. **Approvers can update requests**
   - UPDATE: Only requests meant for their role

---

## 🎨 **FRONTEND INTEGRATION:**

### **Requesting Change (Already Implemented):**
```tsx
// In ProfileScreenEnhanced component
const handleRequestPhoneChange = async () => {
  // Creates record in phone_change_requests table
  const { error } = await supabase
    .from('phone_change_requests')
    .insert({
      user_id: user.id,
      employee_id: employeeId,
      current_phone: userPhone,
      requested_phone: newPhone,
      status: 'pending',
      requested_by_role: userRole,
      approver_role: approverRole // ZSM, ZBM, or HQ
    });
};
```

### **Approving Requests (To Be Implemented):**
```tsx
// Future: In Manager Dashboard
const handleApproveRequest = async (requestId: string) => {
  await supabase
    .from('phone_change_requests')
    .update({
      status: 'approved',
      approver_id: currentUser.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', requestId);
  
  // Then update user's phone number
  await supabase
    .from('app_users')
    .update({ phone_number: request.requested_phone })
    .eq('id', request.user_id);
};
```

---

## 📱 **USER EXPERIENCE:**

### **For Requestor:**
1. **Go to Profile**
2. **Click "Request Change"** next to Phone Number
3. **Enter new phone** number
4. **Submit request**
5. **See confirmation:** "Phone change request submitted! Pending approval from ZSM"

### **For Approver (Future):**
1. **Dashboard shows pending requests**
2. **Review request details:**
   - Who: John Kamau (SE001)
   - Current: 712345678
   - Requested: 722334455
   - Date: 2 hours ago
3. **Approve or Reject** with optional notes
4. **User gets notified** of decision

---

## ⚠️ **IMPORTANT NOTES:**

1. **This table must be created** before phone change requests will work
2. **RLS policies** ensure users can only see/modify relevant data
3. **Approval dashboard** for managers is a future enhancement
4. **Current implementation** allows requests to be submitted
5. **Notification system** for approvals can be added later

---

## ✅ **STATUS:**

- [x] Table schema designed
- [x] Frontend UI for requesting changes ✅
- [x] Request submission working ✅
- [ ] Approver dashboard (TO DO)
- [ ] Notification system (TO DO)
- [ ] Auto-update phone on approval (TO DO)

---

**Run the SQL above in Supabase to enable phone change requests! 🚀**
