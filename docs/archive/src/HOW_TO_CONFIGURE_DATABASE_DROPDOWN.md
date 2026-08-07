# 📖 How to Configure Database Dropdowns - Step by Step

## 🎯 Goal

Create a program field that pulls data from your database tables instead of using static options.

---

## 🚀 Quick Start (3 Methods)

### **Method 1: Via JSON (Recommended for Bulk)**

```json
{
  "field_name": "Van Number Plate",
  "field_type": "dropdown",
  "is_required": true,
  "order_index": 1,
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate",
      "metadata_fields": ["capacity", "vendor", "zone", "zsm_county"]
    }
  }
}
```

### **Method 2: Via Program Creator UI**

Coming soon - visual UI for selecting tables and fields.

### **Method 3: Via API**

```javascript
const field = {
  field_name: "Shop Name",
  field_type: "dropdown",
  is_required: true,
  order_index: 1,
  options: {
    database_source: {
      table: "amb_shops",
      display_field: "shop_name",
      metadata_fields: ["location", "tier", "zone"]
    }
  }
};
```

---

## 📋 Step-by-Step Configuration

### **Step 1: Choose Your Table**

First, identify which table you want to use:

| Available Tables | What It Contains |
|------------------|------------------|
| `van_db` | Van number plates, capacity, vendor |
| `amb_shops` | Shop names, locations, tiers |
| `zsm_list` | ZSM names, counties, phone numbers |
| `territory_db` | Territories, regions, zones |

**To see all available tables:**

```
GET /database-dropdown/tables
```

---

### **Step 2: Choose Display Field**

This is the field that will show in the dropdown.

**Examples:**

| Table | Good Display Field | Bad Display Field |
|-------|-------------------|-------------------|
| `van_db` | `number_plate` | `id` |
| `amb_shops` | `shop_name` | `created_at` |
| `zsm_list` | `zsm_name` | `uuid` |

**To see all columns in a table:**

```
GET /database-dropdown/columns/van_db
```

---

### **Step 3: Choose Metadata Fields (Optional)**

These fields will be displayed when an option is selected.

**Examples:**

**For van_db:**
```json
"metadata_fields": ["capacity", "vendor", "zone", "zsm_county"]
```

**For amb_shops:**
```json
"metadata_fields": ["location", "tier", "zone", "region"]
```

**For zsm_list:**
```json
"metadata_fields": ["county", "region", "phone_number"]
```

---

### **Step 4: Create the Field Configuration**

Combine everything into the field object:

```json
{
  "field_name": "Van Number Plate",
  "field_type": "dropdown",
  "is_required": true,
  "order_index": 1,
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate",
      "metadata_fields": ["capacity", "vendor", "zone", "zsm_county"]
    }
  }
}
```

---

### **Step 5: Add to Your Program**

Include the field in your program's fields array:

```json
{
  "title": "Van Check-In",
  "category": "OPERATIONS",
  "points_value": 30,
  "fields": [
    {
      "field_name": "Van Number Plate",
      "field_type": "dropdown",
      "is_required": true,
      "order_index": 1,
      "options": {
        "database_source": {
          "table": "van_db",
          "display_field": "number_plate",
          "metadata_fields": ["capacity", "vendor", "zone"]
        }
      }
    },
    {
      "field_name": "Driver Name",
      "field_type": "text",
      "is_required": true,
      "order_index": 2
    }
  ]
}
```

---

### **Step 6: Test**

1. Save the program
2. Open it on mobile/web
3. Check that dropdown loads data
4. Test search functionality
5. Verify metadata displays correctly

---

## 🎨 Visual Examples

### **Example 1: Simple Database Dropdown**

**Configuration:**
```json
{
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate"
    }
  }
}
```

**Result:**
```
┌─────────────────────────────────┐
│ Van Number Plate *              │
│ ┌─────────────────────────────┐ │
│ │ KDT 261V                [▼] │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

### **Example 2: With Metadata**

**Configuration:**
```json
{
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate",
      "metadata_fields": ["capacity", "vendor"]
    }
  }
}
```

**Result:**
```
┌─────────────────────────────────┐
│ Van Number Plate *              │
│ ┌─────────────────────────────┐ │
│ │ KDT 261V                [✓] │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📋 Details                      │
│ capacity: 9 SEATER              │
│ vendor: TOP TOUCH               │
└─────────────────────────────────┘
```

---

## 🔄 Common Patterns

### **Pattern 1: Just the Dropdown (No Metadata)**

```json
{
  "field_name": "Van",
  "field_type": "dropdown",
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate"
    }
  }
}
```

**Use when:** You only need the value, no extra context needed.

---

### **Pattern 2: Dropdown with Essential Metadata**

```json
{
  "field_name": "Van",
  "field_type": "dropdown",
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate",
      "metadata_fields": ["capacity", "vendor"]
    }
  }
}
```

**Use when:** You want to show key details for verification.

---

### **Pattern 3: Dropdown with Full Context**

```json
{
  "field_name": "Shop Name",
  "field_type": "dropdown",
  "options": {
    "database_source": {
      "table": "amb_shops",
      "display_field": "shop_name",
      "metadata_fields": ["location", "tier", "zone", "region", "contact_person"]
    }
  }
}
```

**Use when:** You want to show comprehensive information.

---

## ⚠️ Common Mistakes

### **Mistake 1: Using ID as Display Field**

❌ **Wrong:**
```json
{
  "display_field": "id"  // UUIDs are not user-friendly
}
```

✅ **Correct:**
```json
{
  "display_field": "number_plate"  // Human-readable value
}
```

---

### **Mistake 2: Too Many Metadata Fields**

❌ **Wrong:**
```json
{
  "metadata_fields": [
    "field1", "field2", "field3", "field4", "field5", 
    "field6", "field7", "field8", "field9", "field10"
  ]
}
```

✅ **Correct:**
```json
{
  "metadata_fields": ["capacity", "vendor", "zone"]  // 3-5 fields max
}
```

---

### **Mistake 3: Wrong Table Name**

❌ **Wrong:**
```json
{
  "table": "vans"  // Table doesn't exist or not in whitelist
}
```

✅ **Correct:**
```json
{
  "table": "van_db"  // Exact table name from database
}
```

---

### **Mistake 4: Typo in Field Names**

❌ **Wrong:**
```json
{
  "display_field": "numberplate",  // No underscore
  "metadata_fields": ["Capacity"]  // Capital C
}
```

✅ **Correct:**
```json
{
  "display_field": "number_plate",  // Exact column name
  "metadata_fields": ["capacity"]  // Lowercase
}
```

---

## 🧪 Testing Checklist

After configuration, test these:

```
✅ Dropdown loads without errors
✅ Search functionality works
✅ Correct number of options displayed
✅ Selected value shows correct metadata
✅ Form submission includes the value
✅ Works on mobile (2G/3G)
✅ Works offline after initial load
✅ Fast performance (< 1 second)
```

---

## 🔧 Debugging

### **Problem: "Table not allowed" Error**

**Cause:** Table not in whitelist

**Solution:** Add table to `ALLOWED_TABLES` in `/supabase/functions/server/database-dropdown.tsx`:

```typescript
const ALLOWED_TABLES = [
  'van_db',
  'amb_shops',
  'your_table_here',  // ← Add here
];
```

---

### **Problem: "Column does not exist" Error**

**Cause:** Typo in field name or field doesn't exist

**Solution:** Check column names:

```
GET /database-dropdown/columns/your_table
```

---

### **Problem: No Data Showing**

**Cause:** RLS policy blocking access

**Solution:** Check RLS policies:

```sql
-- Allow authenticated users to read
CREATE POLICY "Allow read access to authenticated users"
ON your_table FOR SELECT
TO authenticated
USING (true);
```

---

### **Problem: Slow Loading**

**Cause:** Missing index on display field

**Solution:** Add index:

```sql
CREATE INDEX idx_your_table_display_field 
ON your_table(display_field);
```

---

## 📚 Reference Tables

### **Available Tables**

| Table Name | Display Field | Common Metadata Fields |
|------------|---------------|------------------------|
| `van_db` | `number_plate` | `capacity`, `vendor`, `zone` |
| `amb_shops` | `shop_name` | `location`, `tier`, `zone` |
| `zsm_list` | `zsm_name` | `county`, `region`, `phone_number` |
| `territory_db` | `territory_name` | `region`, `zone`, `target_shops` |

---

### **Field Type Reference**

| Field Type | Use Database Source? | Options Format |
|------------|---------------------|----------------|
| `dropdown` | ✅ Yes | `database_source: {...}` |
| `multi_select` | ❌ No | `options: [...]` (static only) |
| `text` | ❌ No | N/A |
| `number` | ❌ No | N/A |
| `photo` | ❌ No | N/A |

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│ DATABASE DROPDOWN QUICK CONFIG                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. Choose table:                                │
│    "table": "van_db"                            │
│                                                 │
│ 2. Choose display field:                        │
│    "display_field": "number_plate"              │
│                                                 │
│ 3. Choose metadata (optional):                  │
│    "metadata_fields": ["capacity", "vendor"]    │
│                                                 │
│ 4. Wrap in options:                             │
│    "options": {                                 │
│      "database_source": { ... }                 │
│    }                                            │
│                                                 │
│ 5. Test and deploy! ✅                          │
└─────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### **Tip 1: Start Simple**

Begin with just `table` and `display_field`:

```json
{
  "database_source": {
    "table": "van_db",
    "display_field": "number_plate"
  }
}
```

Add metadata later if needed.

---

### **Tip 2: Use Meaningful Field Names**

✅ **Good:** "Van Number Plate", "Shop Name", "ZSM Name"  
❌ **Bad:** "Dropdown 1", "Field 2", "Select Option"

---

### **Tip 3: Test with Real Data**

Don't test with empty tables. Add at least 10-20 sample records.

---

### **Tip 4: Monitor Performance**

Watch the console for load times:

```
[Programs] ✅ Loaded 2,670 options for Shop Name in 800ms
```

If > 2 seconds, add database index.

---

## 🎊 You're Ready!

Now you can create database-driven dropdowns for:

✅ Van number plates  
✅ Shop names  
✅ ZSM names  
✅ Territory names  
✅ Any table in your database!  

**Start with the examples, customize, and deploy!** 🚀

---

**Need help?** Check:
- `/DYNAMIC_DATABASE_DROPDOWN_GUIDE.md` - Full documentation
- `/DYNAMIC_DATABASE_DROPDOWN_EXAMPLES.md` - Real-world examples
- `/VAN_FINAL_SUMMARY.md` - Original van implementation
