# 🚀 TAI PROGRAMS - QUICK START GUIDE

**Get your Programs feature live in 30 minutes!**

---

## ⚡ **SUPER QUICK SETUP** (3 Steps)

### **STEP 1: Database** (5 min)

```sql
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy/paste THIS FILE: /DATABASE_MIGRATIONS_PROGRAMS.sql
-- 3. Click "Run"
-- 4. Copy/paste THIS FILE: /utils/supabase/create-storage-bucket.sql  
-- 5. Click "Run"
-- ✅ Done!
```

### **STEP 2: Integrate** (10 min)

**For Directors/HQ Dashboard:**
```tsx
import { ProgramsDashboard } from './components/programs/programs-dashboard';

// Add to your admin panel
<ProgramsDashboard />
```

**For SE Home Page:**
```tsx
import { useState } from 'react';
import { ProgramList } from './components/programs/program-list';
import { ProgramForm } from './components/programs/program-form';
import { SubmissionSuccessModal } from './components/programs/submission-success-modal';

function SEHomePage() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [points, setPoints] = useState(0);

  if (showSuccess) {
    return (
      <SubmissionSuccessModal
        pointsEarned={points}
        newTotalPoints={1000} // Get from your user state
        programTitle="Program Name"
        onClose={() => {
          setShowSuccess(false);
          setSelectedProgram(null);
        }}
      />
    );
  }

  if (selectedProgram) {
    return (
      <ProgramForm
        programId={selectedProgram}
        onBack={() => setSelectedProgram(null)}
        onSuccess={(pts) => {
          setPoints(pts);
          setShowSuccess(true);
        }}
      />
    );
  }

  return (
    <div>
      {/* Your existing home page */}
      <ProgramList onStartProgram={setSelectedProgram} />
    </div>
  );
}
```

### **STEP 3: Test** (15 min)

**As Director:**
1. Go to Programs Dashboard
2. Click "Create Program"
3. Title: "Test Program"
4. Add 3 fields: Name (text), Photo (photo), Rating (rating)
5. Click "Create"

**As SE:**
1. Open home page
2. See "Test Program (10 pts)"
3. Click "Start"
4. Fill form + take photo
5. Submit → See "+10 points!" 🎉

**As Director:**
1. Click "View Submissions"
2. See SE's submission
3. Click photo GPS → Opens Google Maps
4. Click "Approve" or "Reject"

---

## 📦 **ALL FILES YOU NEED**

### **Backend**
- `/supabase/functions/server/programs.tsx` - Already integrated!
- `/DATABASE_MIGRATIONS_PROGRAMS.sql` - **Run this in Supabase**
- `/utils/supabase/create-storage-bucket.sql` - **Run this too**

### **Components**
- `/components/programs/programs-dashboard.tsx` - For Directors
- `/components/programs/program-list.tsx` - For SEs (home page)
- `/components/programs/program-form.tsx` - For SEs (submission)
- `/components/programs/submission-success-modal.tsx` - Success screen
- All others are auto-loaded!

---

## 🎯 **KEY FEATURES**

### **What Directors Can Do**
- ✅ Create programs (3 ways: manual, Excel, Google Forms)
- ✅ View all submissions with GPS
- ✅ Approve/reject submissions
- ✅ See real-time analytics
- ✅ Export to Excel
- ✅ Pause/activate programs

### **What SEs Can Do**
- ✅ See active programs on home
- ✅ Fill dynamic forms
- ✅ Take GPS-tagged photos
- ✅ Submit unlimited times/day
- ✅ Earn points instantly
- ✅ See success celebration

### **What Happens Automatically**
- ✅ GPS captured on every photo
- ✅ 10 points awarded instantly
- ✅ Points added to SE's total
- ✅ Analytics updated real-time
- ✅ Leaderboard refreshed
- ✅ Zone breakdown calculated

---

## 🔥 **QUICK IMPORT OPTIONS**

### **Option 1: Manual** (Best for first program)
1. Click "Create Program"
2. Add fields with visual builder
3. Drag to reorder
4. Publish

### **Option 2: Excel** (Best for bulk)
1. Click "Import" → "From Excel"
2. Download template
3. Fill in Excel
4. Upload file
5. Preview → Create

### **Option 3: Google Forms** (Requires API setup)
1. Click "Import" → "From Google Forms"
2. Paste form URL
3. Import → Preview → Create
4. *(Note: Needs Google Forms API setup first)*

---

## 📊 **EXCEL TEMPLATE FORMAT**

```
Row 1: Program Title | AMBs to Keep List
Row 2: Description  | Daily shop visits
Row 3: Points       | 10
Row 4: [blank]
Row 5: Field Name | Field Type | Required | Options
Row 6: Shop Name  | text       | yes      |
Row 7: Site ID    | number     | yes      |
Row 8: ZSM        | dropdown   | yes      | John,Jane,Peter
Row 9: Photo      | photo      | yes      |
```

[Download Template](Click "Import" → "Download Template" in app)

---

## 🆘 **TROUBLESHOOTING**

### **"Not authenticated" error**
→ Make sure user is logged in before accessing programs

### **GPS not working**
→ Enable location permissions in browser settings
→ Use HTTPS (GPS requires secure context)

### **Photo upload fails**
→ Check file size (<10MB)
→ Verify storage bucket created

### **"Unauthorized - Only Director..."**
→ Check user role in database:
```sql
SELECT role FROM app_users WHERE id = 'USER_ID';
-- Should be 'director' or 'hq_command_center'
```

### **Submissions not showing**
→ Refresh page
→ Check RLS policies enabled
→ Verify program is "active"

---

## 📞 **NEED HELP?**

**For detailed docs:** See `/PROGRAMS_IMPLEMENTATION_GUIDE.md`

**For API reference:** See `/supabase/functions/server/programs.tsx`

**For full spec:** See `/PROGRAMS_FEATURE_STEVE_JOBS_BOARD.md`

**For completion status:** See `/PROGRAMS_FEATURE_COMPLETE.md`

---

## ✅ **CHECKLIST**

Before going live:
- [ ] Run database migrations
- [ ] Create storage bucket
- [ ] Integrate components
- [ ] Test create program
- [ ] Test submit program
- [ ] Test GPS capture
- [ ] Test approve/reject
- [ ] Test analytics
- [ ] Test Excel export
- [ ] Train Directors
- [ ] Train SEs
- [ ] 🚀 GO LIVE!

---

## 🎉 **YOU'RE READY!**

**Time to transform your 605 SEs into competitive intelligence agents!**

**Questions?** Check the full documentation in `/PROGRAMS_IMPLEMENTATION_GUIDE.md`

**Let's GO!** 🚀💪🔥
