# Database Dropdown Setup Guide

---

## ⚠️ IMPORTANT: Fix Permissions First!

**Before using database dropdowns, you MUST fix permissions:**

👉 **Go to `/QUICK-FIX-GUIDE.md` and follow the 2-minute SQL fix!**

Without this, you'll get "permission denied" errors. This is a ONE-TIME setup.

---

## ✅ What Was Fixed

### 1. **Fixed Hono v4 Route Parameter Error**
- **Error**: `c.param is not a function`
- **Fix**: Changed from `c.param('table')` to `c.req.param('table')` in the columns endpoint
- **Status**: ✅ FIXED

### 2. **Fixed Table Does Not Exist Error**
- **Error**: `Could not find the table 'public.van_db' in the schema cache`
- **Reason**: The `van_db` table (and other tables) don't exist in your database yet
- **Fix**: Created better error messages and a setup SQL file
- **Status**: ✅ FIXED (with instructions below)

### 3. **Fixed Permission Denied Error**
- **Error**: `permission denied for table kv_store_28f2f653`
- **Reason**: This was the auto-create tables function trying to check database access
- **Fix**: Better error handling in auto-create-tables.tsx
- **Status**: ✅ FIXED

---

## 🚀 How to Use Database Dropdowns

### Step 1: Create the Tables You Need

The database dropdown system can work with ANY table in your database, but the tables must exist first!

#### Option A: Use Existing Core Tables (Ready Now!)
These tables should already exist from your main DATABASE-SETUP.sql:
- ✅ `app_users` - Your users
- ✅ `programs` - Your programs
- ✅ `submissions` - Program submissions
- ✅ `posts` - Social feed posts

#### Option B: Create Additional Tables (For Advanced Dropdowns)
If you want to use tables like `van_db`, `amb_shops`, `zsm_list`, etc:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in the left sidebar

2. **Run the Setup SQL**
   - Open the file `/CREATE-ADDITIONAL-TABLES.sql` in your project
   - Copy the entire SQL content
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

3. **Verify Tables Created**
   - Go to "Table Editor" in Supabase
   - You should see new tables: `van_db`, `amb_shops`, `zsm_list`, etc.

### Step 2: Enable Tables in Code

After creating the tables, enable them in the allowed list:

1. **Open** `/supabase/functions/server/database-dropdown.tsx`

2. **Find** the `ALLOWED_TABLES` array (around line 6-20)

3. **Uncomment** the tables you created:
   ```typescript
   const ALLOWED_TABLES = [
     // Core tables (already exist)
     'app_users',
     'programs',
     'submissions',
     'posts',
     
     // Uncomment after creating in Supabase:
     'van_db',        // ← Remove the // to enable
     'amb_shops',     // ← Remove the // to enable
     'zsm_list',      // ← Remove the // to enable
     // ... etc
   ];
   ```

### Step 3: Insert Data Into Your Tables

The dropdown needs data to show! Insert some sample data:

**Example: Adding Vans**
```sql
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county) VALUES
  ('KCA 123A', 2000, 'Vendor A', 'Nairobi', 'Nairobi County'),
  ('KCB 456B', 1500, 'Vendor B', 'Coast', 'Mombasa County'),
  ('KCC 789C', 1800, 'Vendor C', 'Rift Valley', 'Nakuru County');
```

### Step 4: Use in Program Creator

Now you can use the visual dropdown configurator!

1. **Create a New Field** in the Program Creator
2. **Set Type** to "Database Dropdown"
3. **Select Table** from dropdown (e.g., "van_db")
4. **Select Display Field** (e.g., "number_plate")
5. **Select Metadata Fields** (e.g., "capacity", "vendor", "zone")
6. **Save** the program

When users fill out the program form, they'll see a searchable dropdown with all the vans from your database!

---

## 📋 Available Tables Schema (From Your Database)

### van_db ✅
Fields: `id`, `number_plate`, `capacity`, `vendor`, `zone`, `zsm_county`, `created_at`

### amb_shops ✅
Fields: `shop_code` (PK), `fp_code`, `partner_name`, `usdm_name`, `zsm`, `shop_status`, `closed_by`, `closed_at`, `closure_reason`, `reopened_by`, `reopened_at`

### amb_sitewise ✅
Fields: `SHOP CODE`, `FP CODE`, `PARTNER_NAME`, `BUSINESS_NAME`, `USDM_NAME`, `SITE_CODE` (PK), `SITE_NAME`

### sitewise ✅
Fields: `SITE ID` (PK), `SITE`, `TOWN CATEGORY`, `CLUSTER (691)`, `TSE`, `ZSM`, `ZBM`, `ZONE`

### app_users ✅
Fields: `id`, `employee_id`, `full_name`, `email`, `phone_number`, `role`, `region`, `zone`, `zsm`, `zbm`, `rank`, `total_points`, `job_title`, `profile_picture`, `bio`, `avatar_url`, `banner_url`

### programs ✅
Fields: `id`, `title`, `description`, `icon`, `color`, `points_value`, `target_roles`, `category`, `status`, `start_date`, `end_date`, `created_by`

### departments ✅
Fields: `id`, `name`, `description`, `created_at`, `updated_at`

### regions ✅
Fields: `id`, `name`, `code`, `created_at`

### teams ✅
Fields: `id`, `name`, `region_id`, `lead_id`, `created_at`

### achievements ✅
Fields: `id`, `name`, `description`, `icon`, `points_required`, `tier`, `created_at`, `updated_at`

### mission_types ✅
Fields: `id`, `name`, `description`, `base_points`, `points`, `category`, `icon`, `color`, `is_active`

### challenges ✅
Fields: `id`, `title`, `description`, `mission_type_id`, `target_count`, `bonus_points`, `start_date`, `end_date`, `is_active`

---

## 🎯 Real-World Examples

### Example 1: Van Selection Dropdown
- **Table**: `van_db`
- **Display Field**: `number_plate` (shows "KCA 123A" in dropdown)
- **Metadata Fields**: `capacity`, `vendor`, `zone`
- **Result**: Users select a van, and you get all the van details in the submission

### Example 2: Shop Selection with Details
- **Table**: `amb_shops`
- **Display Field**: `shop_name` (shows shop name in dropdown)
- **Metadata Fields**: `shop_code`, `owner_name`, `phone_number`, `location`
- **Result**: When user selects a shop, you capture the shop code and owner details

### Example 3: Territory Assignment
- **Table**: `territory_db`
- **Display Field**: `territory_name`
- **Metadata Fields**: `territory_code`, `zone`, `county`, `asm_name`
- **Result**: Assign territories with automatic zone and ASM tracking

---

## ❓ Troubleshooting

### "Table does not exist" Error
**Solution**: Run `/CREATE-ADDITIONAL-TABLES.sql` in Supabase SQL Editor

### "Table is not allowed" Error
**Solution**: Uncomment the table name in `ALLOWED_TABLES` array in `/supabase/functions/server/database-dropdown.tsx`

### "No columns found" Error
**Solution**: Make sure your table has at least one row of data, or columns will be empty

### "Permission denied" Error
**Solution**: Re-run the CREATE TABLE statement with the GRANT permissions included

---

## 🔒 Security Notes

- Only tables in `ALLOWED_TABLES` can be accessed
- All queries use Supabase Service Role (secure server-side)
- Add/remove tables from whitelist as needed
- Never expose sensitive data in dropdown metadata

---

## 🎨 Customization

Want to add your own custom tables?

1. **Create table** in Supabase SQL Editor
2. **Add table name** to `ALLOWED_TABLES`
3. **Insert data** into the table
4. **Use in Program Creator** with visual UI

That's it! No code changes needed for new tables once they're in the allowed list.

---

**Questions?** Check the console logs - they show detailed debugging info for each step!
