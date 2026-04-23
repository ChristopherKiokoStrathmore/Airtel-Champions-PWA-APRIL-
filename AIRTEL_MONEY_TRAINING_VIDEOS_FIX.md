<!-- AIRTEL MONEY TRAINING VIDEOS - TROUBLESHOOTING & SETUP GUIDE -->

# ❌ Why Airtel Money Training Videos Are Not Working

## The Problem
When agents log in to the Airtel Money module and navigate to the **Education** tab, they see:
```
No videos yet
Check back soon for training content
```

The videos section appears empty even though the feature is fully implemented.

---

## Root Cause Analysis

### ✅ What's Working Correctly
- **Database schema**: The `am_videos` table is properly created with all required columns
- **RLS policies**: Row-level security policies are correctly configured to allow public read access
- **React components**: All video player and education UI components are functioning correctly
- **API functions**: `getVideosForAgent()`, `startWatchSession()`, etc. are all properly implemented
- **Agent login**: Agents can successfully authenticate and access the dashboard

### ❌ What's Missing
**The `am_videos` table is empty.** No training videos have been created in the database.

When `getVideosForAgent()` is called, it queries:
```typescript
const { data: videos, error } = await supabase
  .from('am_videos')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false });
```

Since no published videos exist, it returns an empty array `[]`, and the UI shows "No videos yet."

---

## Solution: Create Training Videos

### Option 1: Use the HQ Admin Upload Interface (Recommended)

1. **Log in as an Airtel Money HQ Admin**
   - Phone: Your admin phone number
   - PIN: Your admin PIN
   - Mode: Airtel Money

2. **Navigate to HQ Dashboard**
   - You should see "Videos" tab in the dashboard

3. **Upload Training Videos**
   - Click "Upload Video" button
   - Select video file from your computer
   - Enter video details:
     - Title: e.g., "Cash In: Step-by-Step Guide"
     - Description: Training description
     -Category: Select from dropdown (General, Cash In/Out, Compliance, Customer Service, Products, Security)
     - Status: **IMPORTANT** - Set to "Published" (not Draft!)
   - Click Upload
   - The video will be compressed and stored in Supabase Storage

4. **Verify Videos Appear**
   - Log in as an agent
   - Go to Education tab
   - Videos should now be visible

---

### Option 2: Bulk Insert via SQL Script

If you have sample videos to insert directly:

1. **Open [AIRTEL_MONEY_SAMPLE_TRAINING_VIDEOS.sql](../AIRTEL_MONEY_SAMPLE_TRAINING_VIDEOS.sql)**

2. **Update video URLs**  
   - Replace placeholder URLs with actual Supabase Storage URLs
   - Example format:
     ```
     https://xspogpfohjmkykfjadhk.supabase.co/storage/v1/object/public/am-videos/[your-file-path]
     ```

3. **Run in Supabase SQL Editor**
   - Go to Supabase Dashboard → SQL Editor
   - Paste the SQL script
   - Click "Run"

4. **Verify** - Check that videos appear in the agent Education tab

---

## How to Get Real Video URLs from Supabase Storage

### Step 1: Upload Videos to `am-videos` Storage Bucket

1. Go to **Supabase Dashboard → Storage**
2. Click on the **`am-videos`** bucket
3. Click "Upload file"
4. Select your video files
5. Click "Upload"

### Step 2: Get Public URLs

1. In the Storage bucket, right-click on a video file
2. Select "Copy public URL"
3. Example URL:
   ```
   https://xspogpfohjmkykfjadhk.supabase.co/storage/v1/object/public/am-videos/1234567890-abcd.mp4
   ```

### Step 3: Update Video Records

Use SQL to update the `video_url` column:

```sql
UPDATE public.am_videos
SET video_url = 'https://xspogpfohjmkykfjadhk.supabase.co/storage/v1/object/public/am-videos/[path-to-file]'
WHERE title = 'Your Video Title';
```

---

## Video Status: Draft vs. Published

### Important: Videos Must Be "Published"
- **Draft** videos do NOT appear to agents
- **Published** videos appear to all agents

The API filters for published videos only:
```typescript
.eq('status', 'published')
```

If you uploaded videos but they're in draft status, change them to published:

```sql
UPDATE public.am_videos
SET status = 'published'
WHERE status = 'draft';
```

---

## Video Targeting (Optional Advanced Feature)

### Targeted Videos
If `is_targeted = TRUE`, only agents matching the target criteria see the video.

Example: Target a video to only SE agents in Zone 001:
```sql
INSERT INTO public.am_video_targets (video_id, target_type, target_value)
VALUES 
  ((SELECT id FROM am_videos WHERE title = 'Security Best Practices'), 'zone', 'Zone_001'),
  ((SELECT id FROM am_videos WHERE title = 'Security Best Practices'), 'se', 'SE_001');
```

### Non-Targeted Videos
If `is_targeted = FALSE`, ALL agents see the video.

---

## Troubleshooting Checklist

- [ ] Videos exist in `am_videos` table
- [ ] Videos have status = 'published' (not 'draft')
- [ ] Videos have a valid `video_url` (not NULL)
- [ ] `video_url` points to an accessible file (test by visiting URL in browser)
- [ ] Agent is logged in successfully
- [ ] Agent matches any targeting criteria (if video is targeted)
- [ ] RLS policies allow public read (verify with: `SELECT * FROM am_videos;`)

### Quick Verification SQL

```sql
-- Check if videos exist
SELECT COUNT(*) FROM public.am_videos;

-- Check published videos
SELECT COUNT(*) FROM public.am_videos WHERE status = 'published';

-- Check video details
SELECT id, title, category, status, video_url FROM public.am_videos;

-- Check targeting (if any)
SELECT * FROM public.am_video_targets;

-- Check sessions (to see if agents watched videos)
SELECT COUNT(*) FROM public.am_video_sessions;
```

---

## Video Upload Feature Details

### Supported Formats
- MP4, WebM, MOV

### Size Limits
- Max 500MB per video
- Files > 50MB use chunked upload for faster speeds

### Compression
- Videos are automatically compressed for optimal storage and playback
- Original quality is preserved within practical limits
- Target: 2000 kbps for HD, 1000 kbps for SD

### Processing Time
- Small videos: 1-2 minutes
- Large videos: 5-10 minutes

---

## Related Documentation
- [Airtel Money Setup Guide](../AIRTEL_MONEY_SETUP_GUIDE.md)
- [Airtel Money Implementation](../docs/AIRTEL_MONEY_IMPLEMENTATION.md)
- [API Reference](../docs/AIRTEL_MONEY_API_REFERENCE.md)

