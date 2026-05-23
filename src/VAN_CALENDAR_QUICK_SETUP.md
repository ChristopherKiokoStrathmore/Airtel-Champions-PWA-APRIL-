# 🚀 QUICK SETUP: Van Calendar as Program (5 Minutes)

## ⚡ INSTANT SETUP STEPS

### **Step 1: Run Database Migration** (2 minutes)

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **Airtel Champions** project
3. Click **SQL Editor** in left sidebar
4. Click **"New Query"**
5. **Copy the entire SQL below and paste it**
6. Click **"Run"** button

```sql
-- Add points toggle to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS points_enabled BOOLEAN DEFAULT true;

-- Create Van Calendar as a program
INSERT INTO programs (
  id,
  title,
  description,
  icon,
  color,
  points_value,
  points_enabled,
  target_roles,
  who_can_submit,
  category,
  status,
  created_at
) VALUES (
  'VAN_CALENDAR_SYSTEM',
  '🚐 Van Weekly Calendar',
  'Submit weekly route plans for all vans in your zone. Plan Monday through Saturday routes with shop names and locations. This is for ZSM planning only - no points awarded.',
  '🚐',
  '#3B82F6',
  0,
  false,
  ARRAY['zonal_sales_manager', 'hq_command_center', 'director']::TEXT[],
  ARRAY['zonal_sales_manager']::TEXT[],
  'Operations',
  'active',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  points_enabled = EXCLUDED.points_enabled,
  target_roles = EXCLUDED.target_roles,
  who_can_submit = EXCLUDED.who_can_submit,
  updated_at = NOW();

-- Delete old fields if any
DELETE FROM program_fields WHERE program_id = 'VAN_CALENDAR_SYSTEM';

-- Create program fields
INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, order_index)
VALUES
  ('VAN_CALENDAR_SYSTEM', 'van_selection', 'Select Van', 'dropdown', true, 
   'Choose a van from your zone', 
   'Select the van you are planning for. Only vans in your zone are shown.',
   jsonb_build_object(
     'database_source', jsonb_build_object(
       'table', 'vans',
       'display_field', 'numberplate',
       'metadata_fields', ARRAY['zone', 'id']
     )
   ),
   1),
  
  ('VAN_CALENDAR_SYSTEM', 'week_start_date', 'Week Starting', 'date', true,
   'Select Monday of the week',
   'Choose the Monday that starts the week you are planning. Calendar will show Mon-Sat.',
   '{}',
   2),
  
  ('VAN_CALENDAR_SYSTEM', 'monday_route', 'Monday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Monday. One shop per line.',
   '{}',
   3),
  
  ('VAN_CALENDAR_SYSTEM', 'tuesday_route', 'Tuesday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Tuesday. One shop per line.',
   '{}',
   4),
  
  ('VAN_CALENDAR_SYSTEM', 'wednesday_route', 'Wednesday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Wednesday. One shop per line.',
   '{}',
   5),
  
  ('VAN_CALENDAR_SYSTEM', 'thursday_route', 'Thursday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Thursday. One shop per line.',
   '{}',
   6),
  
  ('VAN_CALENDAR_SYSTEM', 'friday_route', 'Friday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Friday. One shop per line.',
   '{}',
   7),
  
  ('VAN_CALENDAR_SYSTEM', 'saturday_route', 'Saturday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Saturday. One shop per line.',
   '{}',
   8);

CREATE INDEX IF NOT EXISTS idx_programs_points_enabled ON programs(points_enabled);
```

✅ **Done!** The Van Calendar program is now created.

---

### **Step 2: Verify Setup** (1 minute)

Run these queries to confirm:

```sql
-- Check if program exists
SELECT id, title, points_enabled, who_can_submit FROM programs WHERE id = 'VAN_CALENDAR_SYSTEM';

-- Check if fields exist
SELECT field_label, field_type, is_required FROM program_fields WHERE program_id = 'VAN_CALENDAR_SYSTEM' ORDER BY order_index;
```

You should see:
- ✅ Van Weekly Calendar program with `points_enabled = false`
- ✅ 8 fields (van selection, week date, 6 day routes)

---

### **Step 3: Test in App** (2 minutes)

1. **Login as ZSM**:
   - Go to **Programs** tab
   - You should see "🚐 Van Weekly Calendar" card
   - Click it → Opens submission form
   - Notice: "📋 Tracking Only (No Points)" badge

2. **Login as HQ**:
   - Go to **Home** tab
   - Scroll down → See "Van Calendar Widget"
   - Shows: Total plans, this week, zones, vans
   - Click "View All Plans" → See all submissions

3. **Submit a Test**:
   - As ZSM, fill out the van calendar form
   - Select van, choose week, enter routes
   - Submit
   - Check: **No points awarded** ✅
   - Check: Submission appears in HQ dashboard ✅

---

## 🎯 WHAT HAPPENS NOW

### **For ZSMs**:
- Van Calendar appears in Programs list
- Can submit weekly plans for their zone's vans
- No points earned (tracking only)
- Submissions tracked in database

### **For HQ**:
- Van Calendar Widget on home dashboard
- Real-time stats and compliance tracking
- Access to all submissions from all zones
- Export capabilities
- Analytics and reports

### **For System**:
- Van Calendar uses standard program infrastructure
- All submissions go to `submissions` table
- Analytics automatically include van calendar data
- Can modify form via Program Creator (no code changes)

---

## 🛠️ CREATE MORE NON-POINTS PROGRAMS

Want to create other tracking/planning programs like Van Calendar?

1. Go to **Programs** → **Create New Program**
2. Build your form fields
3. Go to **Settings** tab
4. **Uncheck**: "⭐ Award Points for This Program"
5. Save

Examples:
- Daily Attendance Tracker
- Weekly Stock Reports
- Monthly Sales Forecasts
- Customer Feedback Forms
- Safety Incident Reports

All will work exactly like Van Calendar - submissions tracked, no points awarded!

---

## 🔍 TROUBLESHOOTING

### **Problem: Van Calendar doesn't appear**
- Check that migration ran successfully
- Verify program exists: `SELECT * FROM programs WHERE id = 'VAN_CALENDAR_SYSTEM';`
- Check user role: Only ZSMs can submit, HQ/Directors can view

### **Problem: Points are being awarded**
- Check: `SELECT points_enabled FROM programs WHERE id = 'VAN_CALENDAR_SYSTEM';`
- Should be `false`
- If `true`, run: `UPDATE programs SET points_enabled = false WHERE id = 'VAN_CALENDAR_SYSTEM';`

### **Problem: Van dropdown is empty**
- Check vans table: `SELECT COUNT(*) FROM vans;`
- Should have 19 vans
- If empty, you need to populate vans table first

### **Problem: Widget not showing on HQ dashboard**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check console for errors
- Verify HQ user has role: `hq_command_center`

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check user roles and permissions
4. Review `/VAN_CALENDAR_AS_PROGRAM_COMPLETE.md` for detailed docs

---

## ✅ SUCCESS CHECKLIST

After setup, verify these work:

- [ ] Van Calendar appears in Programs list for ZSMs
- [ ] Submission form has van selector + date + 6 day fields
- [ ] Form shows "📋 Tracking Only (No Points)" badge
- [ ] Submission works without awarding points
- [ ] HQ dashboard shows Van Calendar widget
- [ ] Widget displays correct stats
- [ ] "View All Plans" shows submitted plans
- [ ] Submissions Analytics includes van calendar data
- [ ] Can create new non-points programs via toggle

---

**🎉 Setup Complete! Van Calendar is now fully operational as a program!**

Total Time: **~5 minutes**
