# 🚀 LAUNCH DATE PROGRAM - SETUP GUIDE

## **Overview**

The "Launch Date" program is the first form under **Network Experience** category. It tracks new site launches including coverage quality, recruitment metrics, and POI (Point of Interest) coverage.

---

## **📋 FORM FIELDS**

### **1. Site ID** (Required Dropdown)
- **Type:** Searchable dropdown
- **Options:** 2000+ site IDs (NRU0076, NRU0027, etc.)
- **Features:** 
  - Search/filter capability
  - Alphabetically sorted
  - Quick selection

### **2. Launch Date** (Required Date Picker)
- **Type:** Calendar date picker
- **Purpose:** Record when the site was launched
- **Format:** YYYY-MM-DD

### **3. Partner Name** (Required Text)
- **Type:** Text input
- **Purpose:** Name of partner company for this site
- **Example:** "Airtel Networks Ltd"

### **4. Number of SSO Recruited** (Required Number)
- **Type:** Number input
- **Min:** 0
- **Purpose:** Count of SSO (Site Service Officers) recruited

### **5. Number of AM Agents Recruited** (Required Number)
- **Type:** Number input  
- **Min:** 0
- **Purpose:** Count of AM (Airtel Money) agents recruited

### **6. Total GAs Done** (Required Number)
- **Type:** Number input
- **Min:** 0
- **Purpose:** Total number of GAs (General Activations) completed

### **7. Indoor Coverage** (Required Dropdown)
- **Type:** Dropdown
- **Options:**
  - Very good
  - Good
  - Poor
- **Purpose:** Rate indoor network coverage quality

### **8. Outdoor Coverage** (Required Dropdown)
- **Type:** Dropdown
- **Options:**
  - Very good
  - Good
  - Poor
- **Purpose:** Rate outdoor network coverage quality

### **9. All POIs Covered (Y/N)** (Required Dropdown)
- **Type:** Dropdown
- **Options:**
  - Yes
  - No
- **Purpose:** Indicate if all Points of Interest have network coverage

### **10. POIs with Network Issues** (Optional Textarea)
- **Type:** Textarea
- **Max Length:** 500 characters
- **Purpose:** Describe any POIs experiencing network problems
- **Example:** "Shopping mall parking area has weak signal"

---

## **🔧 SETUP INSTRUCTIONS**

### **STEP 1: Run Database Migration**

Open Supabase SQL Editor and run:

```sql
-- Run this file to create the Launch Date program
\i /database/programs/launch_date_complete_sites.sql
```

Or copy/paste the SQL from `/database/programs/launch_date_complete_sites.sql`

---

### **STEP 2: Verify Program Creation**

Check the program was created:

```sql
SELECT 
  name,
  category,
  icon,
  color,
  points_per_submission,
  status,
  jsonb_array_length(fields_schema->'fields') as total_fields
FROM programs 
WHERE name = 'Launch Date';
```

**Expected Output:**
```
name         | category           | icon | color                                  | points | status | fields
Launch Date  | Network Experience | 🚀   | bg-purple-50 border-purple-200...    | 50     | active | 10
```

---

### **STEP 3: Test the Form**

1. **Login as SE/ZSM:**
   - Phone: Any valid number from database
   - PIN: 1234

2. **Navigate to Programs:**
   - Click on "Programs" in navigation
   - Look for "Network Experience" category
   - Click on "Launch Date" program

3. **Fill Out Form:**
   - Select a Site ID (e.g., NRU0076)
   - Choose launch date
   - Enter partner name
   - Fill in recruitment numbers
   - Rate coverage quality
   - Indicate POI coverage
   - Add network issues if any

4. **Submit:**
   - Click "Submit" button
   - You should earn **50 points**
   - Submission appears in history

---

## **📊 FIELD VALIDATION**

### **Required Fields (Must Fill):**
- ✅ Site ID
- ✅ Launch Date
- ✅ Partner Name
- ✅ Number of SSO Recruited
- ✅ Number of AM Agents Recruited
- ✅ Total GAs Done
- ✅ Indoor Coverage
- ✅ Outdoor Coverage
- ✅ All POIs Covered

### **Optional Fields:**
- POIs with Network Issues (can be left empty)

### **Number Field Constraints:**
- Minimum: 0 (cannot be negative)
- Must be whole numbers (no decimals)

---

## **🎯 POINTS SYSTEM**

- **Base Points:** 50 points per submission
- **Awarded When:** Form is successfully submitted
- **Visible On:** Leaderboard and user profile

---

## **📱 USER INTERFACE**

### **Form Layout:**

```
┌─────────────────────────────────────────┐
│ 🚀 Launch Date                          │
│ Track new site launches                 │
├─────────────────────────────────────────┤
│                                         │
│ Site ID *                               │
│ [Search or select Site ID ▼]           │
│                                         │
│ Launch Date *                           │
│ [📅 Select date]                        │
│                                         │
│ Partner Name *                          │
│ [Enter partner company name]            │
│                                         │
│ Number of SSO Recruited *               │
│ [0]                                     │
│                                         │
│ Number of AM Agents Recruited *         │
│ [0]                                     │
│                                         │
│ Total GAs Done *                        │
│ [0]                                     │
│                                         │
│ Indoor Coverage *                       │
│ [Select quality ▼]                      │
│                                         │
│ Outdoor Coverage *                      │
│ [Select quality ▼]                      │
│                                         │
│ All POIs Covered (Y/N) *                │
│ [Yes / No ▼]                            │
│                                         │
│ POIs with Network Issues                │
│ [Optional - List any POIs with issues]  │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Submit] [Cancel]                       │
└─────────────────────────────────────────┘
```

---

## **🔍 SITE ID LIST PREVIEW**

The dropdown includes 2000+ sites from all regions:

### **Sample Site IDs:**
- **Nairobi Region:** NRU0076, NRU0027, NRU0115...
- **Nairobi Urban:** NUA0025, NUA0019, NUA0012...
- **Kiambu:** KBU0006, KBU0039, KBU0038...
- **Mombasa:** MOS0043, MOS0004, MOS0009...
- **Kisumu:** KSI0019, KSI0001, KSI0003...
- **And many more regions...**

**Full list:** See `/ALL_SITE_IDS.txt`

---

## **🚨 TROUBLESHOOTING**

### **Issue: Program not showing in app**

**Solution:**
```sql
-- Check if program exists
SELECT name, status FROM programs WHERE name = 'Launch Date';

-- If status is 'draft', activate it:
UPDATE programs SET status = 'active' WHERE name = 'Launch Date';
```

---

### **Issue: Site ID dropdown not searchable**

**Solution:**
Make sure the field schema has `"searchable": true`:

```sql
UPDATE programs 
SET fields_schema = jsonb_set(
  fields_schema,
  '{fields,0,searchable}',
  'true'::jsonb
)
WHERE name = 'Launch Date';
```

---

### **Issue: Form won't submit**

**Checklist:**
1. ✅ All required fields filled
2. ✅ Numbers are >= 0
3. ✅ Date is in valid format
4. ✅ Dropdown selections made
5. ✅ User has active session

---

## **📈 FUTURE PHASES**

As mentioned, this is phase 1. Future additions:

### **Phase 2: New Site Launch Forms**
- **New Site Launch (D-1):** Day 1 after launch
- **New Site Launch (D-10):** 10 days after launch  
- **New Site Launch (D-20):** 20 days after launch

Each will have similar fields but track progress over time.

---

## **✅ VERIFICATION CHECKLIST**

Before going live, confirm:

- [ ] SQL migration ran successfully
- [ ] Program visible in database
- [ ] All 10 fields present
- [ ] Site ID dropdown has 2000+ options
- [ ] Date picker works
- [ ] Number inputs accept only positive integers
- [ ] Coverage dropdowns show 3 options
- [ ] POI Y/N dropdown works
- [ ] Textarea for issues is optional
- [ ] Submit button awards 50 points
- [ ] Submission saves to database
- [ ] Submission shows in user's history

---

## **🎉 YOU'RE READY!**

The Launch Date program is now set up and ready for your 702 Sales Executives to start submitting site launch data!

**Next Steps:**
1. Announce the new program to your team
2. Share guidelines on when to submit (immediately after site launch)
3. Monitor submissions via Director Dashboard
4. Export reports for analysis

---

**Need help?** Check `/database/programs/launch_date_complete_sites.sql` for the full implementation.
