# 🎯 Seed Demo Posts for TAI Feed

## Problem
Director's Explore page shows "No Posts Yet" because there are no posts in the database.

## Solution
Call the seed endpoint to create 5 sample posts with realistic content.

## How to Seed Posts

### Option 1: Use Browser Console
1. Open the TAI app in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste and run:

```javascript
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/seed-posts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Posts created:', data))
.catch(err => console.error('❌ Error:', err));
```

### Option 2: Use curl
```bash
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/seed-posts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

### Option 3: Call from App (Temporary Button)
Add this button temporarily to the Director dashboard:

```tsx
<button
  onClick={async () => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/seed-posts`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      }
    );
    const data = await response.json();
    alert(data.message || 'Posts created!');
    window.location.reload();
  }}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
>
  🌱 Seed Demo Posts
</button>
```

## What Gets Created
- 5 sample posts with realistic content about:
  - Market surveys
  - Network quality
  - Competitor intelligence
  - Customer feedback
  - Field reports
- Random likes, comments, reshares (0-20 range)
- Posts from actual users in the database
- Spread over the last 5 hours (not all at once)

## After Seeding
1. Refresh the Explore page
2. You should see the Instagram-style feed with posts
3. All filters (Recent, Trending, My Zone) should work
4. You can like, comment, and reshare the posts

## Notes
- This endpoint can be called multiple times
- Each call creates 5 new posts
- Safe to use in development/UAT
- In production, real users will create posts naturally
