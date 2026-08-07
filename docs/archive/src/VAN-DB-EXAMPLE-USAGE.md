# 🚐 Van Database - Example Usage in Airtel Champions

## 📱 How Van Selection Will Look in the App

### **Scenario: Sales Executive Opening "MINI ROAD SHOW - CHECK IN"**

```
┌─────────────────────────────────────────────────────┐
│  📋 MINI ROAD SHOW - CHECK IN                      │
│  Points: 10 pts                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Select Van *                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔍 Search number plate, zone, location...    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ KCV 291B                                    │ │
│  │   📍 SOUTH RIFT · Van 3                       │ │
│  │   📍 Kericho Bomet · SCG                      │ │
│  ├───────────────────────────────────────────────┤ │
│  │ ☐ KCH 310W                                    │ │
│  │   📍 MT KENYA · Van 1                         │ │
│  │   📍 MERU · WE EVOLVE                         │ │
│  ├───────────────────────────────────────────────┤ │
│  │ ☐ KCG 720W                                    │ │
│  │   📍 MT KENYA · Van 2                         │ │
│  │   📍 EMBU · TOP TOUCH                         │ │
│  ├───────────────────────────────────────────────┤ │
│  │ ... (16 more vans)                            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Number Plate                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ KCH 310W                                      │ │ ← Auto-filled after selection
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Photo of Odometer                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📷 Tap to capture                             │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Odometer *                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ 45892                                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Number of Promoters in the Van Today * (6-30)     │
│  ┌───────────────────────────────────────────────┐ │
│  │ + Add Promoter 1                              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Site(s) Working Today                              │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔍 Search 1845 sites...                       │ │ ← Now loads ALL sites!
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Market Working Today *                             │
│  ┌───────────────────────────────────────────────┐ │
│  │ Gikomba Market                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Partner                                            │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🔍 Search partners...                         │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Cancel]                    [Submit (10 pts)] ✓   │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Search Examples

### **Search by Number Plate:**
```
User types: "KCH"

Results:
✓ KCH 310W - MT KENYA, Van 1, MERU, WE EVOLVE
```

### **Search by Zone:**
```
User types: "eastern"

Results:
✓ KDT 259U - EASTERN, Van 1, KITUI, TOP TOUCH
✓ KDT261V - EASTERN, Van 2, MAKUENI, TOP TOUCH
✓ KCW 892J - EASTERN, Van 3, MACHAKOS, WE EVOLVE
```

### **Search by Location:**
```
User types: "nairobi"

Results:
✓ KCP 597S - NAIROBI METRO, Van 1, Metro, ALFONES
✓ KCJ 078J - NAIROBI WEST, Van 1, Kayanegware Kikuyu, ALFONES
✓ KBS 528F - NAIROBI WEST, Van 2, Rongai Kajiado, ALFONES
```

### **Search by Vendor:**
```
User types: "top touch"

Results:
✓ KCG 720W - MT KENYA, Van 2, EMBU, TOP TOUCH
✓ KDT 259U - EASTERN, Van 1, KITUI, TOP TOUCH
✓ KDT261V - EASTERN, Van 2, MAKUENI, TOP TOUCH
✓ KCA 530C - ABERDARE, Van 1, NYERI, TOP TOUCH
✓ KCB 466U - ABERDARE, Van 2, KIRINYAGA, TOP TOUCH
✓ KCQ 114R - ABERDARE, Van 3, MURANGA, TOP TOUCH
```

---

## 📊 Program Creator Configuration

### **Field 1: Van Selection (Single Select)**

```json
{
  "field_name": "select_van",
  "field_label": "Select Van",
  "field_type": "dropdown",
  "is_required": true,
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
    },
    "prevent_duplicates": false
  }
}
```

**User sees:**
- Main value: `KCH 310W`
- Metadata line 1: `MT KENYA · Van 1`
- Metadata line 2: `MERU · WE EVOLVE`

---

### **Field 2: Van Selection (Multi-Select)**

For programs where multiple vans work together:

```json
{
  "field_name": "vans_working_today",
  "field_label": "Vans Working Today",
  "field_type": "dropdown",
  "is_required": false,
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
    },
    "prevent_duplicates": false,
    "allow_multiple": true  // Enable multi-select
  }
}
```

**User can select multiple:**
```
Selected Vans:
┌───────────────────────────────────────┐
│ × KCH 310W                            │
│   MT KENYA · Van 1 · MERU             │
├───────────────────────────────────────┤
│ × KCG 720W                            │
│   MT KENYA · Van 2 · EMBU             │
├───────────────────────────────────────┤
│ × KCQ 129G                            │
│   MT KENYA · Van 3 · LAIKIPIA         │
└───────────────────────────────────────┘

+ Add another van
```

**Submission data:**
```json
{
  "vans_working_today": [
    "KCH 310W",
    "KCG 720W", 
    "KCQ 129G"
  ]
}
```

---

## 🎯 Real-World Use Cases

### **Use Case 1: Daily Van Check-In**

**Program:** "MINI ROAD SHOW - CHECK IN"

**Fields:**
1. Select Van (dropdown from van_db) → `KCH 310W`
2. Number Plate (text - auto-filled) → `KCH 310W`
3. Photo of Odometer (photo) → 📷 captured
4. Odometer Reading (number) → `45892`
5. Promoters Count (repeatable) → `8 promoters`
6. Sites Working Today (dropdown from sitewise) → `Meru Central`
7. Market Working Today (text) → `Meru Main Market`
8. Partner (dropdown from amb_shops) → `Safaricom`

**Submission Result:**
```json
{
  "select_van": "KCH 310W",
  "number_plate": "KCH 310W",
  "photo_of_odometer": "https://...",
  "odometer": 45892,
  "promoters": [
    {"name": "John Doe"},
    {"name": "Jane Smith"},
    // ... 6 more
  ],
  "sites_working_today": "Meru Central",
  "market_working_today": "Meru Main Market",
  "partner": "Safaricom"
}
```

**Points Awarded:** 10 points ✅

---

### **Use Case 2: Van Maintenance Report**

**Program:** "Van Maintenance Log"

**Fields:**
1. Select Van (dropdown from van_db)
2. Service Type (dropdown: Oil Change, Tire Rotation, Brake Service, etc.)
3. Service Date (date)
4. Service Location (text)
5. Cost (number)
6. Mechanic Name (text)
7. Next Service Due (date)
8. Receipt Photo (photo)
9. Notes (textarea)

**Example Submission:**
```json
{
  "select_van": "KCH 310W",
  "service_type": "Oil Change",
  "service_date": "2026-02-05",
  "service_location": "Meru Service Center",
  "cost": 5500,
  "mechanic_name": "Peter Kamau",
  "next_service_due": "2026-05-05",
  "receipt_photo": "https://...",
  "notes": "Replaced oil filter and air filter. All systems normal."
}
```

**Points Awarded:** 20 points (for proper maintenance logging)

---

### **Use Case 3: Multi-Van Campaign**

**Program:** "Regional Campaign Coordination"

**Fields:**
1. Campaign Name (text)
2. Region (dropdown from zones)
3. Vans Deployed (multi-select from van_db)
4. Campaign Start Date (date)
5. Campaign End Date (date)
6. Target Sites (multi-select from sitewise)
7. Expected Reach (number)

**Example Submission (ZSM coordinating multiple vans):**
```json
{
  "campaign_name": "MT KENYA AIRTEL MONEY PUSH",
  "region": "MT KENYA",
  "vans_deployed": [
    "KCH 310W",  // Van 1 - MERU
    "KCG 720W",  // Van 2 - EMBU
    "KCQ 129G"   // Van 3 - LAIKIPIA
  ],
  "campaign_start_date": "2026-02-10",
  "campaign_end_date": "2026-02-17",
  "target_sites": [
    "Meru Central",
    "Embu Town",
    "Nanyuki Market"
  ],
  "expected_reach": 15000
}
```

**Points Awarded:** 100 points (for campaign coordination)

---

## 📈 Data Analytics Examples

### **Query 1: Most Active Vans**
```sql
SELECT 
  vd.number_plate,
  vd.zone,
  vd.location_description,
  COUNT(s.id) as total_submissions,
  SUM(s.points_awarded) as total_points
FROM van_db vd
LEFT JOIN submissions s ON s.responses->>'select_van' = vd.number_plate
GROUP BY vd.number_plate, vd.zone, vd.location_description
ORDER BY total_submissions DESC
LIMIT 10;
```

### **Query 2: Van Usage by Zone**
```sql
SELECT 
  vd.zone,
  COUNT(DISTINCT vd.number_plate) as total_vans,
  COUNT(s.id) as total_submissions,
  AVG(s.points_awarded) as avg_points_per_submission
FROM van_db vd
LEFT JOIN submissions s ON s.responses->>'select_van' = vd.number_plate
GROUP BY vd.zone
ORDER BY total_submissions DESC;
```

### **Query 3: Vendor Performance**
```sql
SELECT 
  vd.vendor,
  COUNT(DISTINCT vd.number_plate) as vans_count,
  COUNT(s.id) as total_submissions,
  SUM(s.points_awarded) as total_points_generated
FROM van_db vd
LEFT JOIN submissions s ON s.responses->>'select_van' = vd.number_plate
GROUP BY vd.vendor
ORDER BY total_points_generated DESC;
```

---

## 🚀 Deployment Checklist

### **Backend (Supabase)**
- [x] Run `/UPDATE-VAN-DB.sql` in Supabase SQL Editor
- [x] Verify 19 vans inserted
- [x] Check indexes created
- [x] Test query performance
- [x] Enable RLS policies (if needed)

### **Frontend (Figma Make)**
- [x] Code already updated with pagination fix ✅
- [ ] Export React app (`npm run build`)
- [ ] Sync to Capacitor (`npx cap sync android`)
- [ ] Test in Android Studio
- [ ] Build APK

### **Testing**
- [ ] Open "MINI ROAD SHOW - CHECK IN" program
- [ ] Verify all 19 vans appear in dropdown
- [ ] Test search functionality
- [ ] Test metadata display (zone, location, vendor)
- [ ] Submit a test entry
- [ ] Verify data saved correctly
- [ ] Check HQ Command Center sees the submission

### **Distribution**
- [ ] Build signed APK
- [ ] Distribute to 662 Sales Executives
- [ ] Send update notification
- [ ] Provide quick reference guide
- [ ] Monitor for any issues

---

## ✅ Success Metrics

After deployment, you should see:

1. ✅ **All 19 vans** available in dropdowns
2. ✅ **Fast search** (< 1 second even with 2000+ items)
3. ✅ **Metadata displays** correctly in blue boxes
4. ✅ **Submissions include** van data
5. ✅ **HQ dashboard shows** van usage analytics
6. ✅ **No duplicate entries** (unless intentional)
7. ✅ **Works offline** after first load

---

## 🆘 Troubleshooting

### **Problem: Vans not showing in dropdown**

**Solution 1: Check table exists**
```sql
SELECT COUNT(*) FROM van_db;
-- Should return 19
```

**Solution 2: Check RLS policies**
```sql
-- Disable RLS for testing (re-enable after!)
ALTER TABLE van_db DISABLE ROW LEVEL SECURITY;
```

**Solution 3: Check database-dropdown whitelist**
File: `/supabase/functions/server/database-dropdown.tsx`
Line: 21
```typescript
const ALLOWED_TABLES = [
  // ... other tables
  'van_db',  // ✅ Make sure this is included
];
```

---

### **Problem: Only 1000 vans showing (should be 19)**

**Solution:** Already fixed! ✅
- Backend pagination in `database-dropdown.tsx` ✅
- Frontend pagination in `program-submit-modal.tsx` ✅

---

### **Problem: Search not working**

**Solution:** Check frontend search logic
File: `/components/programs/program-submit-modal.tsx`
Search should filter by all visible fields:
- number_plate
- zone
- van_name
- location_description
- vendor

---

## 📞 Support

**Need help?**
- Check `/VAN-DB-SETUP-GUIDE.md` for setup instructions
- Check `/UPDATE-VAN-DB.sql` for the SQL script
- Check `/DATABASE-DROPDOWN-SETUP-GUIDE.md` for generic dropdown setup
- Check server logs in Supabase Dashboard → Edge Functions → Logs

**Common Issues:**
1. Table not found → Run SQL script
2. Permission denied → Check RLS policies
3. Dropdowns empty → Check ALLOWED_TABLES whitelist
4. Slow performance → Check indexes created

---

**Last Updated:** February 6, 2026
**Database Version:** PostgreSQL 15.x
**App Version:** Airtel Champions v1.0
