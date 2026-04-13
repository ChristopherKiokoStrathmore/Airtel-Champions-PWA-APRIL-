# 🎯 REPEATABLE DROPDOWN - HQ QUICK START GUIDE

## What Is It?

**Repeatable Dropdown Entries** lets users select multiple values from a database dropdown **one at a time**, with each selection revealing a new dropdown. It's perfect for when users need to add an **unknown number of items** (like sites visited, shops activated, etc.).

---

## ⚡ Quick Setup (3 Steps)

### **STEP 1: Create/Edit a Dropdown Field**

1. Go to **HQ Command Center** → **Program Management**
2. Click **Edit Program** (or create new)
3. Click **Add Field** or edit an existing field
4. Choose field type: **Dropdown**

### **STEP 2: Configure Database Source**

5. Under "Data Source", select: **Database Source**
6. Select your **Table** (e.g., `sitewise`, `shops`, `products`)
7. Select your **Display Field** (e.g., `SITE`, `SHOP_NAME`)
8. Optional: Add **Metadata Fields** to show extra info

### **STEP 3: Enable Repeatable Dropdown ✅**

9. **Check the box:** 🔄 **Enable Repeatable Dropdown Entries**
10. Click **Save Field** → **Confirm edits**
11. **DONE!** 🎉

---

## 🎨 What Users See

### **Before (Standard Dropdown):**
```
Zone: [Select one...▼]
```
Select 1 value only.

### **Before (Multi-Select):**
```
Services:
☐ Airtel Money
☐ Home Fiber
☐ 4G
```
Select multiple with checkboxes.

### **After (Repeatable Dropdown):**
```
Sites Visited

Entry 1: [Nairobi CBD ▼]
Entry 2: [Westlands   ▼]
Entry 3: [Karen       ▼]

[+ Add Entry 4]

✅ Selected (3)
1. Nairobi CBD  2. Westlands  3. Karen
```
Add as many as needed, one at a time!

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Progressive** | Each dropdown appears after filling the previous one |
| **No Duplicates** | Can't select the same option twice |
| **Add/Remove** | Dynamic + and × buttons |
| **Metadata Display** | Shows extra info for each selection |
| **Max 10 Entries** | Prevents overwhelming users (default limit) |
| **Mobile Friendly** | Works great on phones |

---

## 🚫 Important Rules

### **⚠️ Cannot Use Both:**

You **cannot** enable both at the same time:
- ✅ Multi-Select (checkboxes)
- ✅ Repeatable Dropdown (progressive)

**Choose one or the other!**

If you try to enable both, the system will:
- Show an alert
- Automatically disable the other option

---

## 💡 When to Use Each

| Scenario | Best Option | Why |
|----------|-------------|-----|
| User visits **unknown number** of sites | **Repeatable Dropdown** | Add sites as you go |
| User activates **known services** from a list | **Multi-Select** | Check all that apply at once |
| User picks **one zone** | **Standard Dropdown** | Only one choice needed |

---

## 📋 Real Examples

### **Example 1: Sites Visited**
```
Field Name: sites_visited
Field Label: Sites Visited Today
Table: sitewise
Display Field: SITE
Metadata Fields: SITE ID, ZONE
✅ Repeatable Dropdown: ENABLED
```

**User sees:**
```
Sites Visited Today

Entry 1: [Nairobi CBD ▼]
  SITE ID: 001
  ZONE: Nairobi

Entry 2: [Select a site...▼]

[+ Add Entry 2]
```

### **Example 2: Shops Activated**
```
Field Name: shops_activated
Field Label: Shops Where You Activated Services
Table: shops
Display Field: SHOP_NAME
Metadata Fields: LOCATION, OWNER
✅ Repeatable Dropdown: ENABLED
```

**User sees:**
```
Shops Where You Activated Services

Entry 1: [Mama Njeri Kiosk ▼]
  LOCATION: Eastleigh
  OWNER: Njeri Kamau

Entry 2: [Select a shop...▼]

[+ Add Entry 2]
```

### **Example 3: Products Sold**
```
Field Name: products_sold
Field Label: Products Sold Today
Table: products
Display Field: PRODUCT_NAME
Metadata Fields: CATEGORY, PRICE
✅ Repeatable Dropdown: ENABLED
```

---

## 🔍 How to Edit Existing Fields

### **To Enable Repeatable Dropdown:**

1. Go to **Program Management**
2. Click **Edit** on the program
3. Find the dropdown field
4. Click **Edit Field** (pencil icon)
5. Scroll to **Database Source Configuration**
6. **Check:** 🔄 Enable Repeatable Dropdown Entries
7. Click **Save Field**
8. Click **Confirm edits** at the bottom

### **To Disable It:**

1. Follow same steps
2. **Uncheck** the checkbox
3. Save and confirm

---

## ✅ Testing Your Setup

### **After enabling, test by:**

1. Go to the program as a Sales Executive (or test user)
2. Click "Submit" to open the form
3. You should see:
   - Entry 1 dropdown (with your table data)
   - "+ Add Entry 2" button
4. Select a value in Entry 1
5. Entry 2 should appear automatically
6. Try selecting the same value in Entry 2 → should show "(already selected)"
7. Click the × button on Entry 2 → should remove it
8. Submit the form → should save as array

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Checkbox doesn't appear** | Make sure you selected "Database Source" and chose both Table + Display Field |
| **No data in dropdown** | Check that the table exists and has data. Go to Database Explorer to verify. |
| **Can't enable checkbox** | Multi-Select might be enabled. Disable it first. |
| **Not saving** | Click "Confirm edits" button at the bottom after saving field |
| **Users see old version** | Hard refresh (Ctrl+Shift+R) or clear cache |

---

## 📞 Support

**Questions?** Check:
- `/REPEATABLE_DROPDOWN_COMPLETE.md` - Full technical documentation
- Database Explorer - Verify table data
- Program Management → Field Preview - See how field will render

---

## 🎉 You're Done!

Your dropdown field now supports **progressive, repeatable entries**!

Users can add as many selections as they need, one at a time, with a beautiful and intuitive interface.

**Happy configuring! 🚀**
