# 🚀 MIGRATION: Van Calendar → Program (2 Steps)

## ⚡ STEP 1: Run This SQL in Supabase (1 minute)

Open Supabase Dashboard → SQL Editor → Paste this → Run:

```sql
-- Add points toggle to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS points_enabled BOOLEAN DEFAULT true;

-- Add system_id for special programs (optional identifier)
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS system_id TEXT UNIQUE;

-- Create Van Calendar as a program (using proper UUID)
DO $$
DECLARE
  van_program_id UUID;
BEGIN
  -- Check if Van Calendar already exists
  SELECT id INTO van_program_id 
  FROM programs 
  WHERE system_id = 'VAN_CALENDAR_SYSTEM';
  
  IF van_program_id IS NULL THEN
    -- Insert new program
    INSERT INTO programs (
      system_id,
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
    ) RETURNING id INTO van_program_id;
  ELSE
    -- Update existing program
    UPDATE programs SET
      title = '🚐 Van Weekly Calendar',
      description = 'Submit weekly route plans for all vans in your zone. Plan Monday through Saturday routes with shop names and locations. This is for ZSM planning only - no points awarded.',
      icon = '🚐',
      color = '#3B82F6',
      points_enabled = false,
      target_roles = ARRAY['zonal_sales_manager', 'hq_command_center', 'director']::TEXT[],
      who_can_submit = ARRAY['zonal_sales_manager']::TEXT[],
      updated_at = NOW()
    WHERE id = van_program_id;
  END IF;

  -- Delete old fields if any
  DELETE FROM program_fields WHERE program_id = van_program_id;

  -- Create program fields (using correct table name 'van_db')
  INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, order_index)
  VALUES
    (van_program_id, 'van_selection', 'Select Van', 'dropdown', true, 
     'Choose a van from your zone', 
     'Select the van you are planning for. Only vans in your zone are shown.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'van_db',
         'display_field', 'numberplate',
         'metadata_fields', ARRAY['zone', 'id']
       )
     ),
     1),
    
    (van_program_id, 'week_start_date', 'Week Starting', 'date', true,
     'Select Monday of the week',
     'Choose the Monday that starts the week you are planning. Calendar will show Mon-Sat.',
     '{}',
     2),
    
    (van_program_id, 'monday_route', 'Monday Route', 'long_text', false,
     'Enter shop names, one per line',
     'List all shops the van will visit on Monday. One shop per line.',
     '{}',
     3),
    
    (van_program_id, 'tuesday_route', 'Tuesday Route', 'long_text', false,
     'Enter shop names, one per line',
     'List all shops the van will visit on Tuesday. One shop per line.',
     '{}',
     4),
    
    (van_program_id, 'wednesday_route', 'Wednesday Route', 'long_text', false,
     'Enter shop names, one per line',
     'List all shops the van will visit on Wednesday. One shop per line.',
     '{}',
     5),
    
    (van_program_id, 'thursday_route', 'Thursday Route', 'long_text', false,
     'Enter shop names, one per line',
     'List all shops the van will visit on Thursday. One shop per line.',
     '{}',
     6),
    
    (van_program_id, 'friday_route', 'Friday Route', 'long_text', false,
     'Enter shop names, one per line',
     'List all shops the van will visit on Friday. One shop per line.',
     '{}',
     7),
    
    (van_program_id, 'saturday_route', 'Saturday Route', 'long_text', false,
     'Enter shop names, one per line',
     'List all shops the van will visit on Saturday. One shop per line.',
     '{}',
     8);
  
  RAISE NOTICE 'Van Calendar program created with ID: %', van_program_id;
END $$;

CREATE INDEX IF NOT EXISTS idx_programs_points_enabled ON programs(points_enabled);
CREATE INDEX IF NOT EXISTS idx_programs_system_id ON programs(system_id);
```

---

## ✅ STEP 2: Verify (30 seconds)

After running the SQL, **refresh your app** and you should see:

### **Before (OLD)**:
```
Programs Tab:
  🚐 Van Weekly Calendar [BLUE SPECIAL CARD]
  ↓
  MINI ROAD SHOW - CHECK OUT [NORMAL CARD]
  MINI ROAD SHOW - CHECK IN [NORMAL CARD]
  AMB REVALIDATION [NORMAL CARD]
```

### **After (NEW)**:
```
Programs Tab:
  🚐 Van Weekly Calendar [NORMAL CARD] ✅
  MINI ROAD SHOW - CHECK OUT [NORMAL CARD]
  MINI ROAD SHOW - CHECK IN [NORMAL CARD]
  AMB REVALIDATION [NORMAL CARD]
```

---

## 🎯 WHAT CHANGED

1. **Old blue special card is GONE** ✅ (disabled in code)
2. **Van Calendar is now a NORMAL program card** ✅ (like other programs)
3. **Shows "📋 Tracking Only (No Points)"** badge ✅
4. **Still submits to same place** ✅ (but via program submission flow)
5. **Points are NOT awarded** ✅ (points_enabled = false)

---

## 🧪 TEST IT

1. **Login as ZSM**
2. **Go to Programs Tab**
3. **Click "🚐 Van Weekly Calendar"** (normal card, not special blue)
4. **Fill form and submit**
5. **Verify**: 
   - No points awarded ✅
   - Submission saved ✅
   - Appears in HQ dashboard ✅

---

## 🔍 TROUBLESHOOTING

### "I still see the blue card!"
- **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Clear cache**: Browser settings → Clear cache
- **Check console**: Should NOT see the old card

### "Van Calendar not showing at all!"
- **Check SQL ran**: `SELECT * FROM programs WHERE system_id = 'VAN_CALENDAR_SYSTEM';`
- Should return 1 row with title "🚐 Van Weekly Calendar"
- **Check fields**: `SELECT COUNT(*) FROM program_fields WHERE program_id = (SELECT id FROM programs WHERE system_id = 'VAN_CALENDAR_SYSTEM');`
- Should return 8 (van selector + date + 6 days)

### "Points are being awarded!"
- **Check flag**: `SELECT points_enabled FROM programs WHERE system_id = 'VAN_CALENDAR_SYSTEM';`
- Should return `false`
- If `true`, run: `UPDATE programs SET points_enabled = false WHERE system_id = 'VAN_CALENDAR_SYSTEM';`

---

## ✅ SUCCESS CHECKLIST

After migration:
- [ ] Old blue Van Calendar card is GONE
- [ ] Van Calendar appears as normal program card
- [ ] Card shows "📋 Tracking Only (No Points)" badge
- [ ] Can click and open submission form
- [ ] Form has van selector, date picker, 6 day fields
- [ ] Submission works successfully
- [ ] No points awarded (total_points unchanged)
- [ ] HQ can see submission in dashboard
- [ ] Points toggle available in Program Creator

---

**🎉 Done! Van Calendar is now a proper program with flexible points system!**
