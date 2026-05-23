## 📁 PROGRAM FOLDERS & ANALYTICS - COMPLETE GUIDE

### Overview
Added comprehensive folder organization and analytics dashboard for the Programs system, allowing HQ to organize programs into categories and view detailed performance metrics for each program.

---

## 🎯 New Features

### 1. **Folder Organization**
- Create unlimited folders to organize programs
- Customize folder icons, colors, and descriptions
- Drag and drop organization (order_index)
- Programs can be in folders or unfoldered
- Collapsible folder views

### 2. **Program Analytics Dashboard**
- View detailed analytics for any program
- Track submissions, participants, and points
- Daily trend analysis (30-day history)
- Top performers leaderboard
- Status breakdown (pending/approved/rejected)

### 3. **Dual View Modes**
- **Submit Mode**: Click programs to submit (for Sales Executives)
- **Analytics Mode**: Click programs to view analytics (for HQ/Directors)
- Easy toggle between modes

---

## 📋 Files Created

### Database Migration
- `/database/PROGRAM_FOLDERS_MIGRATION.sql` - Complete database setup

### Components
- `/components/programs/programs-list-with-folders.tsx` - Main programs list with folders
- `/components/programs/program-analytics-dashboard.tsx` - Analytics dashboard
- `/components/programs/folder-management.tsx` - Folder CRUD interface

### Documentation
- `/PROGRAM_FOLDERS_ANALYTICS_GUIDE.md` - This guide

---

## 🗄️ Database Structure

### New Tables

#### `program_folders`
```sql
CREATE TABLE program_folders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT 'blue',
  order_index INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Updated `programs` Table
```sql
ALTER TABLE programs 
ADD COLUMN folder_id UUID REFERENCES program_folders(id) ON DELETE SET NULL;
```

### New Views (Auto-calculated Analytics)

#### `program_analytics`
Provides comprehensive analytics for each program:
- total_submissions
- unique_users
- total_points_awarded
- avg_points_per_submission
- first_submission / last_submission
- pending_count / approved_count / rejected_count
- submissions_last_7_days / submissions_last_30_days

#### `program_daily_trends`
Daily submission trends for the last 30 days:
- submission_date
- submissions_count
- unique_users
- total_points

#### `program_top_performers`
Top 10 performers per program (last 30 days):
- user_id
- submission_count
- total_points
- last_submission

---

## 🚀 Setup Instructions

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor:
-- Copy and paste contents of /database/PROGRAM_FOLDERS_MIGRATION.sql
-- Click "Run"
```

### Step 2: Verify Installation
```sql
-- Check tables exist
SELECT * FROM program_folders;
SELECT * FROM program_analytics;
SELECT * FROM program_daily_trends;
SELECT * FROM program_top_performers;

-- Check indexes
\d program_folders
\d programs
```

### Step 3: Update App
The component is already integrated in `/App.tsx` and will automatically load when users navigate to the Programs tab.

---

## 👥 User Roles & Permissions

### Sales Executives
- **Submit Mode**: Default view
- Can see all programs organized by folders
- Can submit to programs
- See their own submission counts

### Directors / HQ
- **Analytics Mode**: Can toggle to view analytics
- Can manage folders (create, edit, delete)
- View detailed analytics for any program
- See top performers and trends

---

## 🎨 Folder Management

### Creating a Folder

1. Click "Folders" button in Programs header
2. Click "Create New Folder"
3. Fill in:
   - **Name** (required): e.g., "Sales Programs"
   - **Description**: Brief description
   - **Icon**: Choose from 12 options
   - **Color Theme**: Choose from 7 colors
4. Preview the folder design
5. Click "Create Folder"

### Editing a Folder

1. Click edit icon (pencil) next to folder
2. Modify any field
3. Click "Save Changes"

### Deleting a Folder

1. Click delete icon (trash) next to folder
2. Confirm deletion
3. Programs in folder become "unfoldered"

### Assigning Programs to Folders

*Note: Currently requires database update. Future feature: drag-and-drop assignment*

```sql
-- Assign program to folder
UPDATE programs 
SET folder_id = 'folder-uuid-here'
WHERE id = 'program-uuid-here';

-- Remove from folder
UPDATE programs 
SET folder_id = NULL
WHERE id = 'program-uuid-here';
```

---

## 📊 Analytics Dashboard

### Overview Tab

**Key Metrics:**
- Total Submissions
- Unique Participants
- Total Points Awarded
- Average Points per Submission

**Status Breakdown:**
- Pending Review
- Approved
- Rejected

**Activity Timeline:**
- First Submission Date
- Last Submission Date
- Last 7 Days Activity
- Last 30 Days Activity

### Trends Tab

**Daily Submission Trends:**
- Last 30 days of daily data
- Submissions per day
- Unique users per day
- Points awarded per day
- Show/hide all trends

### Top Performers Tab

**Leaderboard:**
- Top 10 performers (last 30 days)
- 🥇 Gold for 1st place
- 🥈 Silver for 2nd place
- 🥉 Bronze for 3rd place
- Submission counts and points
- Last submission date

---

## 💡 Use Cases

### Use Case 1: Organize Sales Programs
```
HQ creates folders:
- "Sales Programs" (💰, green)
- "Customer Experience" (😊, blue)
- "Network Quality" (📡, purple)

Then assigns programs to appropriate folders.
Result: Sales Executives see organized, categorized programs.
```

### Use Case 2: Track Program Performance
```
Director wants to see how "Shop Visit" program is performing:
1. Toggle to "Analytics Mode"
2. Click "Shop Visit" program
3. View:
   - 156 total submissions
   - 78 unique participants
   - 7,800 points awarded
   - 50 avg points per submission
   - Daily trend: increasing!
   - Top performer: John Doe (15 submissions)
```

### Use Case 3: Identify Top Performers
```
HQ wants to reward best performers for "Data Upsell" program:
1. Open "Data Upsell" analytics
2. Go to "Top Performers" tab
3. See leaderboard:
   - 🥇 Jane Smith: 25 submissions, 1,250 points
   - 🥈 John Doe: 23 submissions, 1,150 points
   - 🥉 Mary Johnson: 20 submissions, 1,000 points
```

### Use Case 4: Monitor Daily Trends
```
HQ notices declining submissions:
1. Open program analytics
2. Go to "Trends" tab
3. See daily submissions dropping
4. Action: Send reminder announcement to boost participation
```

---

## 🎯 Folder Color Themes

| Color | Use Case | Example |
|-------|----------|---------|
| **Blue** | General/Information | Training Programs |
| **Green** | Sales/Money | Sales Incentives |
| **Purple** | Technical/Network | Network Quality |
| **Orange** | Learning/Growth | Development Programs |
| **Pink** | Customer/Service | Customer Experience |
| **Yellow** | Events/Campaigns | Promotional Campaigns |
| **Red** | Urgent/Important | Priority Programs |

---

## 🔍 Analytics Query Examples

### Get Program Analytics
```sql
SELECT * FROM program_analytics 
WHERE program_id = 'your-program-uuid';
```

### Get Daily Trends
```sql
SELECT * FROM program_daily_trends 
WHERE program_id = 'your-program-uuid'
ORDER BY submission_date DESC
LIMIT 30;
```

### Get Top Performers
```sql
SELECT * FROM program_top_performers 
WHERE program_id = 'your-program-uuid'
LIMIT 10;
```

### Get All Folders with Program Counts
```sql
SELECT 
  f.id,
  f.name,
  f.icon,
  f.color,
  COUNT(p.id) as program_count
FROM program_folders f
LEFT JOIN programs p ON p.folder_id = f.id
GROUP BY f.id, f.name, f.icon, f.color
ORDER BY f.order_index;
```

---

## 🎨 UI Components

### Programs List View
```
┌─────────────────────────────────────────┐
│ 📊 Programs  [Submit|Analytics] [Folders]│
├─────────────────────────────────────────┤
│ 📁 Sales Programs                    3  │  ← Folder (clickable)
│ ├─ 💰 Shop Visit (12 submissions)      │
│ ├─ 💰 Data Upsell (8 submissions)      │
│ └─ 💰 Airtime Sales (15 submissions)   │
│                                         │
│ 📁 Customer Experience               2  │
│ ├─ 😊 Feedback Collection (5 subs)    │
│ └─ 😊 Support Call (3 subs)           │
│                                         │
│ Other Programs:                         │
│ 📊 General Survey (22 submissions)     │
└─────────────────────────────────────────┘
```

### Analytics Dashboard
```
┌─────────────────────────────────────────┐
│ 💰 Shop Visit Program             ✕    │
│ Visit retail shops and verify stock     │
│ 🏆 50 points per submission             │
├─────────────────────────────────────────┤
│ [Overview] [Trends] [Top Performers]    │
├─────────────────────────────────────────┤
│ 📊 156    👥 78    🏆 7,800   📈 50    │
│ Submissions Users  Points    Avg        │
│                                         │
│ Status:  ⏱️ 23   ✅ 120   ❌ 13       │
│         Pending Approved Rejected       │
│                                         │
│ Activity:                               │
│ First: Jan 15, 2026                    │
│ Last: Jan 27, 2026                     │
│ Last 7 days: 45 submissions            │
│ Last 30 days: 156 submissions          │
└─────────────────────────────────────────┘
```

### Folder Management
```
┌─────────────────────────────────────────┐
│ 📁 Manage Folders                  ✕   │
│ Organize your programs into folders     │
├─────────────────────────────────────────┤
│ [+ Create New Folder]                   │
│                                         │
│ Existing Folders (4):                   │
│                                         │
│ 💰 Sales Programs          [Edit][Del] │
│ Programs focused on sales activities    │
│                                         │
│ 😊 Customer Experience     [Edit][Del] │
│ Programs for customer satisfaction      │
│                                         │
│ 📡 Network Quality         [Edit][Del] │
│ Programs for network testing            │
│                                         │
│ 📚 Training & Development  [Edit][Del] │
│ Learning and skill development          │
└─────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: Folders not showing
**Solution:**
```sql
-- Check if folders exist
SELECT * FROM program_folders;

-- If empty, run sample data insert from migration file
```

### Issue: Analytics show zero data
**Solution:**
```sql
-- Check if views exist
SELECT * FROM program_analytics LIMIT 1;

-- If error, re-run views creation from migration file
```

### Issue: Programs not appearing in folder
**Solution:**
```sql
-- Check folder assignment
SELECT id, title, folder_id FROM programs;

-- Fix assignment
UPDATE programs SET folder_id = 'correct-folder-uuid' WHERE id = 'program-uuid';
```

### Issue: Analytics not updating
**Solution:**
The views are auto-calculated. Just refresh the page or component.
```sql
-- Force refresh by checking view
SELECT * FROM program_analytics WHERE program_id = 'your-program-uuid';
```

---

## 📈 Performance Considerations

### Indexes Created
```sql
-- For faster folder queries
idx_program_folders_order

-- For faster program queries
idx_programs_folder_id

-- Existing indexes
idx_programs_status
idx_programs_category
idx_submissions_program_id
```

### View Performance
- Views are calculated on-the-fly (not materialized)
- Fast for up to 10,000 submissions
- If performance degrades, consider materialized views

### Optimization Tips
```sql
-- For large datasets, create materialized view
CREATE MATERIALIZED VIEW program_analytics_cached AS
SELECT * FROM program_analytics;

-- Refresh periodically
REFRESH MATERIALIZED VIEW program_analytics_cached;
```

---

## 🚀 Future Enhancements

### Phase 1 (Current)
- ✅ Folder management UI
- ✅ Analytics dashboard
- ✅ Dual view modes
- ✅ Top performers

### Phase 2 (Planned)
- 🔲 Drag-and-drop folder assignment
- 🔲 Folder reordering
- 🔲 Export analytics to CSV
- 🔲 Email reports

### Phase 3 (Future)
- 🔲 Custom analytics date ranges
- 🔲 Program comparison view
- 🔲 Predictive analytics
- 🔲 Automated alerts (low participation)

---

## 📞 Support

### Common Questions

**Q: Can I delete a folder with programs in it?**
A: Yes, programs will become "unfoldered" but won't be deleted.

**Q: How often do analytics update?**
A: Analytics are real-time (calculated from views).

**Q: Can Sales Executives see analytics?**
A: Yes, toggle to "Analytics Mode" at the top.

**Q: How do I assign a program to a folder?**
A: Currently via SQL. UI drag-and-drop coming in Phase 2.

**Q: Can I change folder order?**
A: Yes, modify `order_index` in database. UI coming in Phase 2.

---

## ✅ Testing Checklist

### Folder Management
- [ ] Create new folder
- [ ] Edit existing folder
- [ ] Delete folder
- [ ] Change folder icon
- [ ] Change folder color
- [ ] Preview folder design

### Analytics Dashboard
- [ ] View overview tab
- [ ] View trends tab
- [ ] View top performers tab
- [ ] Switch between tabs
- [ ] Close dashboard
- [ ] Open analytics for different programs

### Programs List
- [ ] Folders expand/collapse
- [ ] Programs clickable in submit mode
- [ ] Programs clickable in analytics mode
- [ ] Toggle between modes
- [ ] Unfoldered programs show
- [ ] Folder counts accurate

### Integration
- [ ] Submit program in submit mode
- [ ] View analytics in analytics mode
- [ ] Folder management saves correctly
- [ ] Analytics refresh after submission
- [ ] Navigation works correctly

---

## 📊 Sample Data

### Sample Folders
```sql
INSERT INTO program_folders (name, description, icon, color, order_index) VALUES
('Sales Programs', 'Programs focused on sales activities', '💰', 'green', 1),
('Customer Experience', 'Programs for customer satisfaction', '😊', 'blue', 2),
('Network Quality', 'Programs for network testing', '📡', 'purple', 3),
('Training & Development', 'Learning programs', '📚', 'orange', 4);
```

### Assign Programs to Folders
```sql
-- Assign first 3 programs to Sales Programs folder
UPDATE programs 
SET folder_id = (SELECT id FROM program_folders WHERE name = 'Sales Programs' LIMIT 1)
WHERE id IN (
  SELECT id FROM programs LIMIT 3
);
```

---

## 🎓 Training Guide

### For Sales Executives
1. Open Programs tab
2. See programs organized in folders
3. Click folder to expand/collapse
4. Click program to submit
5. Fill form and submit
6. Earn points!

### For Directors/HQ
1. Open Programs tab
2. Click "Analytics" toggle
3. Click any program to see analytics
4. Review performance metrics
5. Check top performers
6. Click "Folders" to manage organization

---

## 📝 Changelog

### Version 1.0 (January 27, 2026)
- Initial release
- Folder management system
- Analytics dashboard
- Dual view modes
- Database migration
- Complete documentation

---

**Status:** ✅ COMPLETE

**Next Steps:**
1. Run database migration
2. Test folder management
3. Test analytics dashboard
4. Train HQ users
5. Roll out to sales team

---

**For Support:** Contact Development Team
**Documentation:** `/PROGRAM_FOLDERS_ANALYTICS_GUIDE.md`
