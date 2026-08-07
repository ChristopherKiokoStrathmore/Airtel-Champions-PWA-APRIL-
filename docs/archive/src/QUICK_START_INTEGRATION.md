# 🚀 QUICK START: Integrate New Features

**5-Minute Integration Guide**

---

## ✅ Step 1: Create Database Tables (2 minutes)

Go to Supabase → SQL Editor → New Query → Paste this:

```sql
-- Director Messages
CREATE TABLE director_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID,
  sender_name TEXT,
  sender_role TEXT,
  sender_zone TEXT,
  message TEXT NOT NULL,
  category TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Posts
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID,
  author_name TEXT,
  author_role TEXT,
  author_zone TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  comments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE director_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- Allow all (for pilot)
CREATE POLICY "pilot_access_dm" ON director_messages FOR ALL USING (true);
CREATE POLICY "pilot_access_sp" ON social_posts FOR ALL USING (true);
```

Click **Run** ✅

---

## ✅ Step 2: Test Components (1 minute)

Components are ready in:
- `/components/director-line.tsx`
- `/components/social-feed.tsx`

Already imported in `/App.tsx` ✅

---

## ✅ Step 3: Add to Bottom Nav (2 minutes)

Find the bottom navigation in `/App.tsx` and add Feed tab:

**Search for:** `<div className="bg-white border-t border-gray-200`

**Add this tab between Home and Profile:**

```tsx
{/* Feed Tab */}
<button
  onClick={() => setActiveTab('feed')}
  className={`flex flex-col items-center py-2 px-4 ${
    activeTab === 'feed' ? 'text-red-600' : 'text-gray-400'
  }`}
>
  <span className="text-2xl">🌟</span>
  <span className="text-xs mt-1">Feed</span>
</button>
```

---

## ✅ Step 4: Test It! (30 seconds)

1. **Login as SE**
2. **Tap Feed tab** → Should show Social Feed
3. **Create a test post** → Should appear
4. **Like it** → Red heart should pop! ❤️

---

## 🎯 Optional: Add Swipe for Director Line

In `HomeScreen` function, add before return statement:

```tsx
const [showDirectorLine, setShowDirectorLine] = useState(false);
const [touchStart, setTouchStart] = useState(0);
const [touchEnd, setTouchEnd] = useState(0);

const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchMove = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (touchStart - touchEnd > 75) {
    setShowDirectorLine(true);
  }
};

// In return statement, wrap main div:
return (
  <>
    {showDirectorLine && (
      <DirectorLine
        user={user}
        userData={userData}
        onClose={() => setShowDirectorLine(false)}
      />
    )}
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* existing content */}
    </div>
  </>
);
```

---

## ✅ DONE!

**You now have:**
- ✅ Social Feed with RED hearts ❤️
- ✅ Director Line (swipe left)
- ✅ Steve Jobs-approved design
- ✅ Ready for 662 SEs!

**Test on phone, then SHIP IT! 🚀**
