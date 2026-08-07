# 🚀 Quick Start: Add Van Number Plates to Your Dropdown

## ⚡ 3-Minute Setup

### **Step 1: Open Program** (30 seconds)
1. Go to **HQ Command Center**
2. Find "CHECK IN" program
3. Click **"Edit"** button

### **Step 2: Add Van Field** (1 minute)
1. Click **"+ Add Field"**
2. Field Label: **"Van Number Plate"**
3. Field Type: Select **"Dropdown"**

### **Step 3: Configure Database** (1 minute)
1. Click **"🗄️ Database Source"** (right side button)
2. Select Table: **"VAN DB (van_db)"**
3. Select Display Field: **"NUMBER PLATE (number_plate)"**
4. Check Metadata (optional):
   - ☑ CAPACITY
   - ☑ VENDOR
   - ☑ ZONE
   - ☑ ZSM COUNTY

### **Step 4: Save** (30 seconds)
1. Click **"Save Field"**
2. Click **"Save Program"** or **"Update Program"**
3. ✅ Done!

---

## 📱 What Your SEs Will See

When submitting the program:

```
┌─────────────────────────────────────┐
│ Van Number Plate *                  │
│ ┌─────────────────────────────────┐ │
│ │ [🔍] Search vans...         [▼] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Type "KDT" to search:
```
┌─────────────────────────────────────┐
│ KDT 261V                            │
│   9 SEATER • TOP TOUCH • EASTERN    │
├─────────────────────────────────────┤
│ KDT 789X                            │
│   7 SEATER • SWIFT • COAST          │
└─────────────────────────────────────┘
```

After selection:
```
┌─────────────────────────────────────┐
│ Van Number Plate: KDT 261V      [✓] │
│                                     │
│ 📋 Van Details:                     │
│ • Capacity: 9 SEATER                │
│ • Vendor: TOP TOUCH                 │
│ • Zone: EASTERN                     │
│ • County: MAKUENI                   │
└─────────────────────────────────────┘
```

---

## 🎯 Available Tables for Other Use Cases

| Table | Use For | Display Field |
|-------|---------|---------------|
| `van_db` | Van tracking | `number_plate` |
| `amb_shops` | Shop visits | `partner_name` |
| `zsm_list` | ZSM selection | `full_name` |
| `territory_db` | Territory | `territory_name` |
| `shop_db` | Shops | `shop_name` |

---

## 💡 Pro Tips

### **Tip 1: Search is Automatic**
Users can type to filter - no configuration needed!

### **Tip 2: Offline Support**
Dropdowns are cached for offline use automatically.

### **Tip 3: Metadata Shows Context**
Choose 3-5 relevant metadata fields for best UX.

---

## 🐛 Troubleshooting

### **Can't see "Database Source" option?**
- Make sure you selected "Dropdown" field type first

### **No tables showing?**
- Check your internet connection
- Make sure you're logged in as HQ staff

### **No columns showing?**
- Make sure you selected a table first
- Table must have at least one record

### **Dropdown empty when testing?**
- Check the table has data
- Verify display field has values (not null)

---

## 📞 Quick Commands

### **Test the van dropdown:**
1. Open the program
2. Click "Submit"
3. Click the van dropdown
4. Type "KDT" to search
5. Select a van
6. See metadata

### **Add more metadata fields:**
1. Edit the field
2. Click "Database Source"
3. Check/uncheck fields in metadata list
4. Save

---

## ✅ Checklist

- [ ] Program opened
- [ ] Field added with type "Dropdown"
- [ ] "Database Source" selected
- [ ] Table selected: van_db
- [ ] Display field selected: number_plate
- [ ] Metadata selected (optional)
- [ ] Field saved
- [ ] Program saved
- [ ] Tested submission form
- [ ] Van plates showing
- [ ] Search working
- [ ] Metadata displaying

---

## 🎊 You're Done!

Your van dropdown is now live and working!

**All van number plates from your database are now available in the dropdown!** 🚐✨

No code, no JSON, just clicks! 🎉
