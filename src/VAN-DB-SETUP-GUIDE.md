# 🚐 Van Database Setup Guide

## 📋 Overview

This guide helps you populate the `van_db` table with all 19 Airtel Kenya vans across 8 zones.

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Run the SQL Script**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `/UPDATE-VAN-DB.sql`
3. Click **Run** (or press `Ctrl+Enter`)

✅ **Expected Result:**
```
Successfully added location_description column
Successfully added van_name column
Inserted 19 vans
Created 2 indexes
```

---

### **Step 2: Verify the Data**

Run this query to see all vans:

```sql
SELECT zone, van_name, location_description, vendor, number_plate 
FROM van_db 
ORDER BY zone, van_name;
```

✅ **You should see:**
- **19 rows** total
- **8 different zones**
- **3 vendors**: SCG, WE EVOLVE, TOP TOUCH, ALFONES

---

### **Step 3: Use in Program Creator**

When creating a program with a Van selection field:

**Field Configuration:**
```json
{
  "field_type": "dropdown",
  "field_label": "Select Van",
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate",
      "metadata_fields": [
        "zone",
        "van_name", 
        "location_description",
        "vendor"
      ]
    }
  }
}
```

**What users will see:**
```
┌─────────────────────────────────────────┐
│ Select Van                              │
├─────────────────────────────────────────┤
│ 🔍 Search...                            │
├─────────────────────────────────────────┤
│ ☐ KCV 291B                              │
│   📍 SOUTH RIFT | Van 3                 │
│   📍 Kericho Bomet | SCG                │
├─────────────────────────────────────────┤
│ ☐ KCH 310W                              │
│   📍 MT KENYA | Van 1                   │
│   📍 MERU | WE EVOLVE                   │
├─────────────────────────────────────────┤
│ ... (17 more vans)                      │
└─────────────────────────────────────────┘
```

---

## 📊 Van Distribution by Zone

| Zone | Vans | Locations |
|------|------|-----------|
| **SOUTH RIFT** | 1 | Kericho Bomet |
| **MT KENYA** | 3 | MERU, EMBU, LAIKIPIA |
| **EASTERN** | 3 | KITUI, MAKUENI, MACHAKOS |
| **NORTH EASTERN** | 2 | GARISSA, WAJIR |
| **ABERDARE** | 3 | NYERI, KIRINYAGA, MURANGA |
| **NYANZA** | 1 | KISUMU |
| **WESTERN** | 3 | Bungoma, Kakamega, Vihiga |
| **NAIROBI METRO** | 1 | Metro |
| **NAIROBI WEST** | 2 | Kayanegware Kikuyu, Rongai Kajiado |
| **TOTAL** | **19** | **19 locations** |

---

## 🚗 Van Vendors

| Vendor | Van Count | Number Plates |
|--------|-----------|---------------|
| **ALFONES** | 7 | KCQ 564B, KCC 879F, KCN 381L, KCP 597S, KCJ 078J, KBS 528F |
| **TOP TOUCH** | 6 | KCG 720W, KDT 259U, KDT261V, KCA 530C, KCB 466U, KCQ 114R |
| **WE EVOLVE** | 4 | KCH 310W, KCW 892J, KCF 629Q, KCG 809J |
| **SCG** | 2 | KCV 291B, KCQ 129G, KCR 709C |

---

## 🔧 Database Schema Updates

### **New Columns Added:**

```sql
-- Added to van_db table:
location_description  text   -- e.g., "Kericho Bomet", "MERU"
van_name             text   -- e.g., "Van 1", "Van 2", "Van 3"
```

### **Existing Columns:**

```sql
id                   bigint          -- Auto-generated
created_at           timestamp       -- Auto-set
number_plate         text            -- e.g., "KCV 291B"
capacity             text            -- (optional - not in spreadsheet)
vendor               text            -- e.g., "SCG", "WE EVOLVE"
zone                 text            -- e.g., "SOUTH RIFT"
zsm_county           text            -- (optional - not in spreadsheet)
```

---

## 📝 Complete Van List

| # | Zone | Van | Location | Vendor | Number Plate |
|---|------|-----|----------|--------|--------------|
| 1 | SOUTH RIFT | Van 3 | Kericho Bomet | SCG | KCV 291B |
| 2 | MT KENYA | Van 1 | MERU | WE EVOLVE | KCH 310W |
| 3 | MT KENYA | Van 2 | EMBU | TOP TOUCH | KCG 720W |
| 4 | MT KENYA | Van 3 | LAIKIPIA | SCG | KCQ 129G |
| 5 | EASTERN | Van 1 | KITUI | TOP TOUCH | KDT 259U |
| 6 | EASTERN | Van 2 | MAKUENI | TOP TOUCH | KDT261V |
| 7 | EASTERN | Van 3 | MACHAKOS | WE EVOLVE | KCW 892J |
| 8 | NORTH EASTERN | Van 1 | GARISSA | WE EVOLVE | KCF 629Q |
| 9 | NORTH EASTERN | Van 2 | WAJIR | WE EVOLVE | KCG 809J |
| 10 | ABERDARE | Van 1 | NYERI | TOP TOUCH | KCA 530C |
| 11 | ABERDARE | Van 2 | KIRINYAGA | TOP TOUCH | KCB 466U |
| 12 | ABERDARE | Van 3 | MURANGA | TOP TOUCH | KCQ 114R |
| 13 | NYANZA | Van 2 | KISUMU | SCG | KCR 709C |
| 14 | WESTERN | Van 1 | Bungoma | ALFONES | KCQ 564B |
| 15 | WESTERN | Van 2 | Kakamega | ALFONES | KCC 879F |
| 16 | WESTERN | Van 3 | Vihiga | ALFONES | KCN 381L |
| 17 | NAIROBI METRO | Van 1 | Metro | ALFONES | KCP 597S |
| 18 | NAIROBI WEST | Van 1 | Kayanegware Kikuyu | ALFONES | KCJ 078J |
| 19 | NAIROBI WEST | Van 2 | Rongai Kajiado | ALFONES | KBS 528F |

---

## ✅ Verification Queries

### **Check total van count:**
```sql
SELECT COUNT(*) as total_vans FROM van_db;
-- Expected: 19
```

### **Check vans by zone:**
```sql
SELECT zone, COUNT(*) as van_count 
FROM van_db 
GROUP BY zone 
ORDER BY zone;
```

### **Check vans by vendor:**
```sql
SELECT vendor, COUNT(*) as van_count 
FROM van_db 
GROUP BY vendor 
ORDER BY vendor;
```

### **Find a specific van:**
```sql
SELECT * FROM van_db 
WHERE number_plate = 'KCH 310W';
```

### **Get all vans for a specific zone:**
```sql
SELECT * FROM van_db 
WHERE zone = 'MT KENYA' 
ORDER BY van_name;
```

---

## 🎯 Use Cases in Programs

### **Example 1: MINI ROAD SHOW - CHECK IN**

**Program Fields:**
- Van Selection (dropdown from van_db)
- Number Plate (text - auto-filled if using same van)
- Odometer Reading (number)
- Number of Promoters (repeatable_number)
- Site(s) Working Today (dropdown from sitewise)
- Market Working Today (text)
- Partner (dropdown from amb_shops)

### **Example 2: Daily Van Report**

**Program Fields:**
- Select Van (dropdown from van_db)
- Driver Name (text)
- Start Location (GPS)
- End Location (GPS)
- Total KM Driven (number - calculated from odometer)
- Fuel Used (number)
- Sites Visited (multi-select from sitewise)

### **Example 3: Van Maintenance Log**

**Program Fields:**
- Van (dropdown from van_db)
- Service Type (dropdown: Oil Change, Tire Rotation, etc.)
- Service Date (date)
- Cost (number)
- Next Service Due (date)
- Mechanic Notes (textarea)

---

## 🚨 Important Notes

1. **Duplicate Number Plate Check:** 
   - The script assumes no duplicate number plates
   - If you need to add more vans, ensure unique number plates

2. **TRUNCATE Warning:**
   - The script includes `TRUNCATE TABLE van_db` which **deletes all existing data**
   - If you want to **keep existing data**, remove that line before running

3. **Capacity & ZSM County:**
   - These columns exist in the schema but are not in the spreadsheet
   - You can add this data later if needed:
   ```sql
   UPDATE van_db 
   SET capacity = '20 seats' 
   WHERE number_plate = 'KCV 291B';
   ```

4. **Missing Van Numbers:**
   - Some zones don't have Van 1 (e.g., SOUTH RIFT starts with Van 3)
   - This is intentional based on your spreadsheet data

---

## 🔄 Updating the Backend

The backend database-dropdown endpoint (`/supabase/functions/server/database-dropdown.tsx`) already supports `van_db` table with pagination, so **no backend changes needed**! ✅

The frontend pagination fix in `program-submit-modal.tsx` will ensure all 19 vans load properly.

---

## 📱 Mobile App Impact

After running this SQL:
1. ✅ All 19 vans will be available in dropdown fields
2. ✅ Users can search by number plate, zone, location, or vendor
3. ✅ Metadata (zone, location, vendor) displays in blue boxes
4. ✅ Multi-select works for selecting multiple vans
5. ✅ Works offline (data cached after first load)

---

## ✅ Checklist

- [ ] Run `/UPDATE-VAN-DB.sql` in Supabase SQL Editor
- [ ] Verify 19 vans inserted successfully
- [ ] Check indexes created (faster queries)
- [ ] Test van dropdown in Program Creator
- [ ] Test van selection in Program Submit Modal
- [ ] Verify metadata displays correctly
- [ ] Test search functionality
- [ ] Test multi-select (if enabled for van fields)
- [ ] Deploy backend changes (if any)
- [ ] Build new APK with updated data

---

**Need help?** Check:
- `/UPDATE-VAN-DB.sql` - The SQL script to run
- `/DATABASE-DROPDOWN-SETUP-GUIDE.md` - Generic database dropdown setup
- `/components/programs/program-submit-modal.tsx` - Frontend implementation

**Last Updated:** February 6, 2026
