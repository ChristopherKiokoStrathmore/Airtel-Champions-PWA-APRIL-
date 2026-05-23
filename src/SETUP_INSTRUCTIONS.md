# 🚀 TAI NEW FEATURES - SETUP INSTRUCTIONS

**Quick Setup: Director Line + Social Feed**

---

## ✅ STEP 1: Run SQL in Supabase (2 minutes)

### **A. Open Supabase SQL Editor:**
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### **B. Copy & Paste this SQL:**

Open the file: `/SUPABASE_MIGRATION_NEW_FEATURES.sql`

**OR copy this:**

```sql
-- 1. DIRECTOR MESSAGES TABLE
CREATE TABLE IF NOT EXISTS director_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES app_users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT,
  sender_zone TEXT,
  message TEXT NOT NULL,
  category TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'unread',
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- 2. SOCIAL POSTS TABLE
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES app_users(id),
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_zone TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  comments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE INDEXES
CREATE INDEX idx_director_messages_sender ON director_messages(sender_id);
CREATE INDEX idx_director_messages_created ON director_messages(created_at DESC);
CREATE INDEX idx_social_posts_author ON social_posts(author_id);
CREATE INDEX idx_social_posts_created ON social_posts(created_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE director_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICIES (Allow all for pilot)
CREATE POLICY "Allow all on director_messages" 
  ON director_messages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on social_posts" 
  ON social_posts FOR ALL USING (true) WITH CHECK (true);

-- 6. INSERT SAMPLE DATA
INSERT INTO social_posts (author_name, author_role, author_zone, content, likes, comments)
VALUES 
  (
    'John Mwangi', 
    'sales_executive', 
    'Nairobi West', 
    'Just activated 15 Airtel Money accounts at Gikomba Market! 🔥',
    47,
    '[{"id": "1", "author_name": "Ashish Azad", "author_role": "director", "content": "Excellent work! 💯", "created_at": "2026-01-01T10:00:00Z"}]'::jsonb
  );
```

### **C. Click RUN** ✅

You should see: "Success. No rows returned"

---

## ✅ STEP 2: Verify Tables Created (30 seconds)

In Supabase:
1. Click **Table Editor** in left sidebar
2. You should see two new tables:
   - ✅ `director_messages`
   - ✅ `social_posts`

---

## ✅ STEP 3: Test the Features! (1 minute)

### **A. Test Social Feed:**
1. Login to TAI as an SE
2. Click the **"🌟 TAI Feed"** button (red button on home screen)
3. You should see the sample post from John Mwangi
4. Try creating a new post
5. Try liking the post (RED HEART should pop! ❤️)

### **B. Test Director Line:**
1. On home screen, click **"📞 Direct Line"** button (orange button)
2. Type a message to Ashish
3. Watch as AI suggests a category
4. Try the anonymous checkbox
5. Click "Send to Ashish"
6. You should see success message! ✅

---

## ✅ STEP 4: View Data in Supabase (optional)

To see messages and posts:

1. **Supabase → Table Editor → director_messages**
   - You'll see all messages sent to Ashish

2. **Supabase → Table Editor → social_posts**
   - You'll see all feed posts with likes and comments

---

## 🎯 FEATURES READY:

### **✅ Director Line:**
- Orange/red gradient design
- Message Ashish directly
- AI categorization (analyzes your message)
- Anonymous option
- Previous messages history
- Expected response time

### **✅ Social Feed:**
- Instagram-style layout
- RED hearts ❤️ (Airtel brand!)
- Heart pop animation
- Photo uploads
- Comments
- Gold crown 👑 for Director
- "Time to go sell?" after 10 posts

---

## 🔧 TROUBLESHOOTING

### **Issue: "Table already exists" error**
✅ **Solution:** Tables are already created! You're good to go.

### **Issue: "Permission denied" error**
✅ **Solution:** Make sure you're logged into Supabase as project owner.

### **Issue: Buttons not showing**
✅ **Solution:** 
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear cache
3. Re-login to TAI

### **Issue: Can't create posts**
✅ **Solution:** 
1. Check Supabase → Table Editor → social_posts exists
2. Verify policies are created (Supabase → Authentication → Policies)

### **Issue: Images not uploading**
✅ **Solution:** Images are saved as base64 for now (works offline). Supabase Storage integration coming in Phase 2.

---

## 📊 CHECK IF IT'S WORKING:

### **Quick Test Checklist:**

```
[ ] Can see "✨ New Features" section on home screen
[ ] Can see two buttons: 📞 Direct Line and 🌟 TAI Feed
[ ] Clicking Direct Line opens orange screen with Ashish's profile
[ ] Can type a message and see AI category suggestion
[ ] Can send message and see success confirmation
[ ] Clicking TAI Feed shows social feed
[ ] Can see sample post from John Mwangi
[ ] RED hearts (not green!)
[ ] Heart pops when clicked
[ ] Can create a new post
[ ] Post appears in feed immediately
```

**If all checkboxes pass:** 🎉 **YOU'RE READY FOR 662 SEs!**

---

## 🚀 NEXT STEPS:

### **Phase 1: Internal Testing (This Week)**
- Test with 10 team members
- Gather feedback
- Fix any bugs

### **Phase 2: Pilot (Week 7)**
- 50 SEs for Director Line
- 100 SEs for Social Feed
- Monitor Ashish's engagement
- Track metrics

### **Phase 3: Full Launch (Week 9)**
- All 662 SEs
- Launch celebration
- Training materials
- Monitor & iterate

---

## 💬 NEED HELP?

**Christopher's Checklist:**
1. ✅ SQL ran successfully?
2. ✅ Tables visible in Supabase?
3. ✅ Buttons showing on home screen?
4. ✅ Can access both features?
5. ✅ Data saving correctly?

**If any NO:** Check the troubleshooting section above.

**Still stuck?** 
- Check browser console (F12) for errors
- Verify Supabase connection
- Ensure user is logged in as SE

---

## 🎉 CONGRATULATIONS!

**You've just launched:**
- 📞 Direct Director Line
- 🌟 TAI Social Feed
- ❤️ RED hearts (Steve Jobs approved!)
- 👑 Gold crowns for Ashish
- 🎨 Beautiful animations
- 🚀 Revolutionary SE experience

**Time to make TAI legendary! 💜**
