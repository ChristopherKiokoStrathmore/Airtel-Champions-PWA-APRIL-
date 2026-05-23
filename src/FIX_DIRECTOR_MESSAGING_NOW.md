# ⚠️ **URGENT: Fix Director Messaging Error**

## **Error You're Seeing:**
```
Reply error: {
  "code": "PGRST204",
  "message": "Could not find the 'ashish_reply' column of 'director_messages' in the schema cache"
}
```

---

## **✅ INSTANT FIX (2 Minutes)**

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### **Step 2: Copy & Paste This SQL**

```sql
-- Add missing columns for director messaging
ALTER TABLE director_messages 
ADD COLUMN IF NOT EXISTS director_reaction TEXT,
ADD COLUMN IF NOT EXISTS ashish_reply TEXT,
ADD COLUMN IF NOT EXISTS ashish_reply_time TIMESTAMPTZ;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'director_messages' 
AND column_name IN ('director_reaction', 'ashish_reply', 'ashish_reply_time')
ORDER BY column_name;
```

### **Step 3: Click RUN**
- Press the green **"RUN"** button (or `Ctrl+Enter`)
- You should see 3 rows:
  ```
  column_name       | data_type
  ------------------+-------------------------
  ashish_reply      | text
  ashish_reply_time | timestamp with time zone
  director_reaction | text
  ```

### **Step 4: Test Again**
1. Go back to your TAI app
2. Log in as Director Ashish
3. Try to reply to a message
4. ✅ **It will work!**

---

## **Why This Happened**

Your database table `director_messages` exists, but it's missing 3 columns that the app needs:

| Column | Purpose |
|--------|---------|
| `director_reaction` | Stores emoji reactions (👍, ❤️, 🔥) |
| `ashish_reply` | Stores director's text reply |
| `ashish_reply_time` | Timestamp when director replied |

---

## **What Happens After Running SQL**

### **Before:**
```
director_messages table:
├── id ✅
├── sender_id ✅
├── message ✅
├── director_reaction ❌ MISSING
├── ashish_reply ❌ MISSING
└── ashish_reply_time ❌ MISSING
```

### **After:**
```
director_messages table:
├── id ✅
├── sender_id ✅
├── message ✅
├── director_reaction ✅ ADDED
├── ashish_reply ✅ ADDED
└── ashish_reply_time ✅ ADDED
```

---

## **Alternative: One Command SQL**

If the above doesn't work, try this simpler version:

```sql
ALTER TABLE director_messages ADD COLUMN IF NOT EXISTS director_reaction TEXT;
ALTER TABLE director_messages ADD COLUMN IF NOT EXISTS ashish_reply TEXT;
ALTER TABLE director_messages ADD COLUMN IF NOT EXISTS ashish_reply_time TIMESTAMPTZ;
```

---

## **Still Not Working?**

If you get an error like "relation director_messages does not exist", then you need to create the table first:

```sql
-- Create director_messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS director_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT,
  sender_zone TEXT,
  message TEXT NOT NULL,
  category TEXT,
  attachments TEXT[],
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  director_reaction TEXT,
  ashish_reply TEXT,
  ashish_reply_time TIMESTAMPTZ,
  visible_to TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_director_messages_sender ON director_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_director_messages_status ON director_messages(status);
CREATE INDEX IF NOT EXISTS idx_director_messages_created_at ON director_messages(created_at DESC);
```

---

## **Screenshot Guide**

### **Where to Find SQL Editor:**
```
Supabase Dashboard
├── Your Project (xspogpfohjmkykfjadhk)
├── SQL Editor  ← Click here
└── New Query   ← Click here
```

### **What Success Looks Like:**
After running the SQL, you'll see:
```
Success. No rows returned
```

Then when you run the verification query, you'll see:
```
3 rows
```

---

## **Need Help?**

If you're still getting errors, copy the EXACT error message and I'll help you fix it!

---

**Status After Fix:**
- ✅ Director can send emoji reactions
- ✅ Director can send text replies
- ✅ SE sees WhatsApp-style messaging (left/right alignment)
- ✅ No more 400 errors!
