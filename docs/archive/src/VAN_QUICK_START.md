# 🚀 Van Database Integration - Quick Start

## ✅ 3-Step Setup (5 Minutes)

### Step 1: Run Database Setup (2 min)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy/paste the entire contents of `/database/VAN_DB_SETUP.sql`
4. Click **RUN**
5. ✅ You should see:
   ```
   ✅ van_db table CREATED
   ✅ RLS ENABLED
   ✅ 1 vans found (sample data)
   ```

---

### Step 2: Add Your Vans (1 min)

In the same SQL Editor:

```sql
-- Replace with your actual vans
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
VALUES 
  ('KCA 123A', '7 SEATER', 'BEST TRANSPORT', 'NAIROBI', 'NAIROBI'),
  ('KDB 456B', '14 SEATER', 'SWIFT LOGISTICS', 'COAST', 'MOMBASA'),
  ('KDC 789C', '9 SEATER', 'TOP TOUCH', 'WESTERN', 'KAKAMEGA');
```

Click **RUN**

✅ Verify:
```sql
SELECT * FROM van_db ORDER BY number_plate;
```

---

### Step 3: Create Test Program (2 min)

**Option A: Via HQ Command Center**

1. Login as Director/Admin
2. Go to **Programs** tab
3. Click **➕ Create Program**
4. Fill in:
   - **Title:** "Van Test"
   - **Category:** "MINI-ROAD SHOW"
   - **Points:** 50
5. Click **➕ Add Field**
6. Configure field:
   - **Field Name:** Van Number Plate
   - **Field Type:** database_dropdown ← **IMPORTANT!**
   - **Required:** ✅ Yes
7. Click **Create Program**

**Option B: Via API**

```json
POST /programs/create
{
  "title": "Van Test",
  "category": "MINI-ROAD SHOW",
  "points_value": 50,
  "fields": [
    {
      "field_name": "Van Number Plate",
      "field_type": "database_dropdown",
      "is_required": true,
      "order_index": 1
    }
  ]
}
```

---

## 🧪 Test It!

1. **Login as SE** (any Sales Executive account)
2. Go to **Programs** tab
3. Click **Van Test** program
4. Click **Submit**
5. ✅ You should see:
   - Searchable dropdown
   - All your vans listed
   - Search works
   - Selecting a van shows details

---

## ❓ Troubleshooting

### Issue: Dropdown shows "Loading..." forever

**Fix:**
```sql
-- Check if table exists
SELECT * FROM van_db;

-- If error, run VAN_DB_SETUP.sql again
```

### Issue: Dropdown shows "No results found"

**Fix:**
```sql
-- Check if you have data
SELECT COUNT(*) FROM van_db;

-- If 0, insert some vans
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
VALUES ('TEST 001', '9 SEATER', 'TEST VENDOR', 'NAIROBI', 'NAIROBI');
```

### Issue: API returns 401 Unauthorized

**Fix:**
- Make sure you're logged in
- Check browser console for token errors
- Try logging out and back in

### Issue: Field doesn't show in form

**Fix:**
- Verify field_type is exactly "database_dropdown" (case-sensitive)
- Check browser console for errors
- Verify program was created successfully

---

## 📊 Verify Everything Works

Run this checklist:

```
✅ van_db table exists in Supabase
✅ Table has at least 1 van
✅ RLS is enabled
✅ Server is running (check Edge Functions)
✅ Created a program with database_dropdown field
✅ Program appears in Programs tab
✅ Clicking program opens form
✅ Dropdown shows vans
✅ Search filters vans
✅ Selecting van shows details
✅ Form can be submitted
```

---

## 🎉 Success!

If all checkboxes are ✅, you're done!

**Next Steps:**
1. Add all your real vans to the database
2. Create actual programs (MINI-ROAD SHOW, etc.)
3. Roll out to your 662 SEs

---

## 📚 Full Documentation

- **Complete Guide:** `/VAN_DATABASE_INTEGRATION_GUIDE.md`
- **Summary:** `/VAN_INTEGRATION_COMPLETE.md`
- **Example Program:** `/EXAMPLE_VAN_PROGRAM.json`
- **Database Script:** `/database/VAN_DB_SETUP.sql`

---

**Need help?** Check the browser console (F12) for detailed error messages.
