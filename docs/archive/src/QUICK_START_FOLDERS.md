# 🚀 QUICK START: Program Folders & Analytics

## 3-Step Setup

### Step 1: Database Setup (2 minutes)
```sql
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy & paste: /database/PROGRAM_FOLDERS_MIGRATION.sql
-- 3. Click "Run"
-- 4. Verify: SELECT * FROM program_folders;
```

### Step 2: Create Your First Folder (1 minute)
1. Open Airtel Champions app
2. Navigate to **Programs** tab
3. Click **Folders** button (top right)
4. Click **+ Create New Folder**
5. Fill in:
   - Name: "Sales Programs"
   - Icon: 💰
   - Color: Green
6. Click **Create Folder**

### Step 3: View Analytics (30 seconds)
1. In Programs tab, toggle **Submit → Analytics**
2. Click any program
3. View comprehensive analytics!

---

## 🎯 Key Features

### For Sales Executives
- ✅ Organized programs in folders
- ✅ Easy navigation
- ✅ Submit to programs
- ✅ Track your submissions

### For HQ/Directors
- ✅ Manage folders
- ✅ View program analytics
- ✅ Track top performers
- ✅ Monitor daily trends

---

## 📊 What You Get

### Analytics Dashboard Shows:
- 📈 Total submissions
- 👥 Unique participants
- 🏆 Points awarded
- ⏱️ Pending/Approved/Rejected
- 📅 Daily trends (30 days)
- 🥇 Top 10 performers

### Folder Management Includes:
- Create unlimited folders
- Choose from 12 icons
- 7 color themes
- Edit/Delete folders
- Auto-counts programs

---

## 💡 Quick Tips

### Organizing Programs
```sql
-- Assign program to folder (SQL for now, UI coming soon)
UPDATE programs 
SET folder_id = 'folder-uuid-here'
WHERE title = 'Shop Visit';
```

### Sample Folder Structure
```
📁 Sales Programs (💰, Green)
   ├─ Shop Visit
   ├─ Data Upsell
   └─ Airtime Sales

📁 Customer Experience (😊, Blue)
   ├─ Feedback Collection
   └─ Support Call

📁 Network Quality (📡, Purple)
   ├─ Speed Test
   └─ Coverage Check
```

---

## 🎨 Folder Icons & Colors

### Icons
📁 📚 💰 😊 📡 🎯 ⚡ 🏆 📊 🚀 💼 🎓

### Colors
- **Green**: Sales/Money
- **Blue**: General/Info
- **Purple**: Technical
- **Orange**: Learning
- **Pink**: Customer Service
- **Yellow**: Campaigns
- **Red**: Urgent

---

## ✅ Verification

### Check Installation
```sql
-- Should return 4 sample folders
SELECT COUNT(*) FROM program_folders;

-- Should return analytics data
SELECT * FROM program_analytics LIMIT 1;

-- Should return trend data
SELECT * FROM program_daily_trends LIMIT 1;
```

### Test in UI
- [ ] Can open Programs tab
- [ ] Can see "Folders" button
- [ ] Can toggle Submit/Analytics
- [ ] Can create new folder
- [ ] Can click program to view analytics

---

## 🐛 Troubleshooting

### No folders showing?
Run: `SELECT * FROM program_folders;`
If empty, run sample insert from migration file.

### Analytics empty?
Views auto-calculate. Need submissions first.
Check: `SELECT * FROM submissions LIMIT 5;`

### Can't toggle modes?
Clear cache and refresh page.

---

## 📚 Full Documentation
See `/PROGRAM_FOLDERS_ANALYTICS_GUIDE.md` for complete guide.

---

**Setup Time:** ~3 minutes
**Status:** Ready to use!
**Date:** January 27, 2026
