# Van Calendar Feature - Setup Guide

## 🎯 Overview
The Van Calendar feature is now **database-controlled**, meaning you can enable/disable it for all 662 users without deploying a new APK.

## ✅ How It Works

### For Users:
- **ZSMs**: See a blue "🚐 Van Weekly Calendar" card at the top of the Programs tab
- **HQ/Directors**: Can access the Van Calendar Grid to view all submissions
- **Regular SEs**: (Feature can be role-restricted if needed)

### For Admins (HQ/Directors):
- Access **Settings** → **Feature Management** → **Van Calendar Feature**
- Toggle the feature ON/OFF instantly
- No APK deployment required!

## 🗄️ Database Setup

### Step 1: Enable Van Calendar Feature (Run this SQL)

```sql
-- Enable Van Calendar feature by default
INSERT INTO kv_store_28f2f653 (key, value)
VALUES ('feature_van_calendar_enabled', 'true')
ON CONFLICT (key) 
DO UPDATE SET value = 'true';
```

### Step 2: Verify It's Enabled

```sql
-- Check current status
SELECT * FROM kv_store_28f2f653 
WHERE key = 'feature_van_calendar_enabled';
```

Expected result:
```
key                          | value
-----------------------------+-------
feature_van_calendar_enabled | true
```

## 🎮 How to Use (For HQ/Directors)

### Enable Van Calendar:
1. Login as HQ or Director
2. Go to **Settings** (bottom nav)
3. Scroll to **Feature Management** section
4. Click **"🚐 Van Calendar Feature"**
5. Click **ENABLE** button
6. Feature is now live for all users!

### Disable Van Calendar:
1. Same steps as above
2. Click **DISABLE** button
3. Van Calendar disappears from Programs tab for all users

## 📍 Where Users Find Van Calendar

### Current Location:
- **Programs Tab** (second icon in bottom navigation)
- Blue card appears **at the very top** (before folders)
- Cannot be missed!

### Screenshot Reference:
```
┌─────────────────────────────┐
│ 🚐 Van Weekly Calendar      │ ← Blue card
│ Submit weekly van routes    │
│ [30 Vans]                   │
└─────────────────────────────┘
│                             │
│ Folder 1: Program ABC       │
│ Folder 2: Program XYZ       │
│ ...                         │
```

## 🔧 Technical Details

### Feature Flag System:
- **Storage**: `kv_store_28f2f653` table
- **Key**: `feature_van_calendar_enabled`
- **Values**: `'true'` or `'false'`
- **Default**: `true` (enabled)

### API Endpoints:

#### Check Status (Public):
```
GET https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/make-server-28f2f653/van-calendar/feature/status
```

Response:
```json
{
  "success": true,
  "enabled": true,
  "message": "Van Calendar is enabled"
}
```

#### Enable Feature (HQ/Director only):
```
POST https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/make-server-28f2f653/van-calendar/feature/enable
Headers: Authorization: Bearer <token>
```

#### Disable Feature (HQ/Director only):
```
POST https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/make-server-28f2f653/van-calendar/feature/disable
Headers: Authorization: Bearer <token>
```

## 🚀 Deployment Strategy

### NO APK UPDATE REQUIRED! 🎉

1. **Deploy Backend**: Done ✅ (database + API)
2. **Enable Feature**: Run SQL above
3. **Test**: Login as ZSM, go to Programs tab
4. **Rollout**: Feature is live for all users immediately

### Rollback Strategy:
If issues arise:
1. HQ/Director clicks **DISABLE** in Settings
2. Feature disappears instantly
3. No user impact

## 🔍 Troubleshooting

### Van Calendar Not Showing?

**Check 1**: Is the feature enabled?
```sql
SELECT value FROM kv_store_28f2f653 
WHERE key = 'feature_van_calendar_enabled';
```

**Check 2**: Are you on the right tab?
- Make sure you're on **Programs Tab** (not Dashboard)
- Look for the blue card at the top

**Check 3**: Check console logs:
```
[ProgramsList] ✅ Van Calendar enabled: true
```

### Enable Feature Manually:
```sql
UPDATE kv_store_28f2f653 
SET value = 'true' 
WHERE key = 'feature_van_calendar_enabled';
```

## 📊 Van Database

The Van Calendar uses the `van_db` table with 19 vans across 8 zones:
- NAIROBI: 5 vans
- COAST: 3 vans
- RIFT VALLEY: 3 vans
- WESTERN: 2 vans
- CENTRAL: 2 vans
- EASTERN: 2 vans
- NYANZA: 1 van
- MT. KENYA: 1 van

## 🎯 Next Steps

1. **Run the SQL** above to enable the feature
2. **Login as ZSM** (e.g., SHARON WANJOHI)
3. **Click Programs Tab** in bottom nav
4. **See the blue Van Calendar card** at the top!
5. **Click it** to submit weekly routes

## 🆘 Support

If Van Calendar is not showing:
1. Verify you ran the SQL to enable it
2. Check you're on Programs tab (not Dashboard)
3. Check browser console for errors
4. Contact technical support

---

**Built for**: Airtel Champions - Sales Intelligence Network  
**Feature**: Van Weekly Calendar (Offline-first, no APK updates needed!)  
**Date**: 2026-02-16
