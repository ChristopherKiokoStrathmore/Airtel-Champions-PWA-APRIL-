# 🗄️ Database Dropdown UI Configuration Guide

## ✅ Implementation Complete!

You can now configure database dropdowns **directly from your UI** without touching any code!

---

## 📋 How to Use

### **Step 1: Open Program Creator**

1. Go to HQ Command Center
2. Click "Create New Program" or Edit an existing program
3. Click "Add Field" or edit an existing field

---

### **Step 2: Select Dropdown Field Type**

1. In the Field Editor modal, select **"Dropdown"** as the field type
2. You'll now see a **new section** with two options:
   - 📝 **Static Options** (manual entry)
   - 🗄️ **Database Source** (pull from database)

---

### **Step 3: Configure Database Source**

#### **Choose "Database Source"**

Click the "Database Source" button. You'll see a purple configuration panel.

#### **Select a Table**

Choose from the dropdown:
- VAN DB
- AMB SHOPS
- ZSM LIST
- TERRITORY DB
- SHOP DB
- And more...

Example: Select `van_db` to get van number plates

#### **Select Display Field**

After selecting a table, columns will load automatically.

Choose which column to display in the dropdown:
- For `van_db`, select `number_plate`
- For `amb_shops`, select `partner_name`
- For `zsm_list`, select `full_name`

#### **Select Metadata Fields (Optional)**

Check any additional fields you want to show as details:

For `van_db`, you might select:
- ✅ capacity
- ✅ vendor
- ✅ zone
- ✅ zsm_county

These will appear as metadata when a user selects an option.

#### **Preview Configuration**

You'll see a blue preview box showing:
```
Table: van_db
Display: number_plate
Metadata: capacity, vendor, zone, zsm_county
```

---

### **Step 4: Save**

Click "Save Field" and your database dropdown is ready! 🎉

---

## 🎨 What Your Sales Executives Will See

### **Before Selection:**
```
┌─────────────────────────────────┐
│ Van Number Plate *              │
│ ┌─────────────────────────────┐ │
│ │ [🔍] Search vans...     [▼] │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### **After Typing "KDT":**
```
┌─────────────────────────────────┐
│ [🔍] KDT                    [▼] │
├─────────────────────────────────┤
│ KDT 261V                        │
│   9 SEATER • TOP TOUCH          │
│   EASTERN • MAKUENI             │
├─────────────────────────────────┤
│ KDT 789X                        │
│   7 SEATER • SWIFT LOGISTICS    │
│   COAST • MOMBASA               │
└─────────────────────────────────┘
```

### **After Selection:**
```
┌─────────────────────────────────┐
│ Van Number Plate *              │
│ ┌─────────────────────────────┐ │
│ │ KDT 261V                [✓] │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📋 Van Details                  │
│ capacity: 9 SEATER              │
│ vendor: TOP TOUCH               │
│ zone: EASTERN                   │
│ zsm_county: MAKUENI             │
└─────────────────────────────────┘
```

---

## 📊 Available Tables

The system currently supports these tables:

| Table Name | Description | Suggested Display Field |
|------------|-------------|------------------------|
| `van_db` | Van database | `number_plate` |
| `amb_shops` | AMB shops (2,670+) | `partner_name` |
| `zsm_list` | Zonal Sales Managers | `full_name` |
| `territory_db` | Territory database | `territory_name` |
| `shop_db` | Shop database | `shop_name` |
| `products` | Product list | `product_name` |
| `customers` | Customer list | `customer_name` |
| `agents` | Agent list | `agent_name` |

---

## 🔧 Example Configurations

### **Example 1: Van Number Plates**

**Settings:**
- Table: `van_db`
- Display Field: `number_plate`
- Metadata: `capacity`, `vendor`, `zone`, `zsm_county`

**Result:** Dropdown with all van plates, showing details on selection

---

### **Example 2: AMB Shops**

**Settings:**
- Table: `amb_shops`
- Display Field: `partner_name`
- Metadata: `usdm_name`, `zone`, `territory`

**Result:** Dropdown with 2,670+ shops, searchable

---

### **Example 3: ZSM List**

**Settings:**
- Table: `zsm_list`
- Display Field: `full_name`
- Metadata: `zone`, `phone_number`, `email`

**Result:** Dropdown with all ZSMs, showing contact details

---

## 🎯 Benefits

✅ **No Code Required** - Configure everything from UI  
✅ **Real-Time Data** - Always pulls latest from database  
✅ **Searchable** - Users can type to filter  
✅ **Offline Support** - Cached for offline use  
✅ **2G/3G Optimized** - Fast loading even on slow networks  
✅ **Metadata Display** - Show additional details  
✅ **Scalable** - Works with thousands of records  

---

## 🚀 Quick Start Checklist

- [ ] Open Program Creator
- [ ] Add new field
- [ ] Select "Dropdown" type
- [ ] Click "Database Source"
- [ ] Choose table (e.g., `van_db`)
- [ ] Choose display field (e.g., `number_plate`)
- [ ] Choose metadata fields (optional)
- [ ] Save field
- [ ] Test in program submission form

---

## 📝 JSON Example (Auto-Generated)

When you configure through the UI, this JSON is created automatically:

```json
{
  "field_name": "Van Number Plate",
  "field_type": "dropdown",
  "is_required": true,
  "options": {
    "database_source": {
      "table": "van_db",
      "display_field": "number_plate",
      "metadata_fields": ["capacity", "vendor", "zone", "zsm_county"]
    }
  }
}
```

**You don't need to write this JSON - the UI creates it for you!** ✨

---

## 💡 Tips

### **Tip 1: Choose Good Display Fields**
✅ Use human-readable columns like `number_plate`, `name`, `title`  
❌ Avoid UUIDs like `id` (not user-friendly)

### **Tip 2: Limit Metadata**
✅ Show 3-5 important fields  
❌ Don't show 10+ fields (clutters UI)

### **Tip 3: Test on Mobile**
After creating, test on mobile to ensure it works well on small screens

---

## 🆘 Troubleshooting

### **"Failed to load tables"**
- Check your internet connection
- Make sure you're logged in as HQ staff

### **"Failed to load columns"**
- Make sure the table exists in the database
- Check the table has at least one row

### **"Dropdown is empty when submitting"**
- Check the display field has data
- Verify table has records

---

## 🎊 You're Done!

Your database dropdowns are now fully dynamic and configurable from the UI!

**No more code changes needed** - just point, click, and configure! 🚀
