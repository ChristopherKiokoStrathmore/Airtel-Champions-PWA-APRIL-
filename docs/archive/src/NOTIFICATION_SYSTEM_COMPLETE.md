# 🔔 TAI Notification System - Complete Guide

## ✅ **FIXED! All Errors Resolved**

The `useState` error has been fixed by adding the React import to `/components/programs/programs-dashboard.tsx`.

---

## 🎯 **What We Built**

A complete real-time notification system that automatically announces new programs to all target users across the entire TAI app.

### **The Flow:**

```
Director Creates Program
        ↓
Notifications Sent to Target Roles
        ↓
Bell Icon Shows Red Badge (🔴)
        ↓
User Clicks Notification
        ↓
Takes Them to Program Form
```

---

## 📦 **Files Created**

### **1. `/components/notifications/notification-system.tsx`**
- Bell icon with unread badge
- Dropdown panel with notification list
- Real-time updates via Supabase subscriptions
- Click handling to navigate to programs

### **2. `/utils/notifications.ts`**
- `sendNotification()` - Send to specific users
- `sendNotificationToRoles()` - Send to all users with specific roles
- `notifyNewProgram()` - Auto-announce new programs
- `notifyProgramUpdate()` - Announce program changes
- `notifySubmissionReviewed()` - Tell users when submissions are approved/rejected
- `notifyAchievement()` - Send achievement notifications

### **3. Updated `/components/programs/program-creator-enhanced.tsx`**
- Automatically sends notifications when program is created
- Notifies all target roles

---

## 🗄️ **Database Setup Required**

You need to create a `notifications` table in Supabase:

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_program', 'program_update', 'submission_approved', 'submission_rejected', 'achievement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- RLS Policy: System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (TRUE);

-- RLS Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 🔌 **Integration Steps**

### **Step 1: Add Notification Bell to Header**

Update your main app layout (e.g., `/App.tsx` or wherever you have the header):

```typescript
import { NotificationSystem } from './components/notifications/notification-system';

// In your header component:
<header className="flex items-center justify-between px-6 py-4">
  <div>
    {/* Your existing header content */}
  </div>
  
  <div className="flex items-center gap-4">
    {/* Other header items (profile, etc.) */}
    
    <NotificationSystem
      onNotificationClick={(notification) => {
        // Handle notification click
        if (notification.type === 'new_program') {
          // Navigate to programs tab
          setActiveTab('programs'); // or whatever your navigation is
          
          // Optionally scroll to specific program
          if (notification.data?.program_id) {
            // Highlight the program
          }
        }
      }}
    />
  </div>
</header>
```

### **Step 2: Test the System**

1. **Login as Director**
2. **Create a new program** targeting "Sales Executives"
3. **Check console logs** - Should see:
   ```
   [ProgramCreator] ✅ Program created successfully: <Program Title>
   [Notifications] ✅ Sent <N> notifications
   ```
4. **Login as SE in another tab/window**
5. **Check bell icon** - Should show red badge (🔴1)
6. **Click bell** - Should see notification
7. **Click notification** - Should navigate to program

---

## 🎨 **How It Works**

### **When Director Creates Program:**

```typescript
// In program-creator-enhanced.tsx
const createProgram = async () => {
  // ... create program in database ...
  
  // Step 3: Send notifications to all target users
  await notifyNewProgram({
    id: program.id,
    title: program.title,
    description: program.description,
    points_value: program.points_value,
    target_roles: program.target_roles  // e.g., ['sales_executive']
  });
};
```

### **What Happens Behind the Scenes:**

1. **Fetch all users** with matching roles from `users` table
2. **Create notification records** for each user
3. **Insert into notifications table**
4. **Supabase broadcasts realtime event** to all connected clients
5. **NotificationSystem component** receives event
6. **Updates bell icon badge** automatically
7. **Shows notification in dropdown**

---

## 📊 **Notification Types**

### **1. New Program (🎯)**
```typescript
await notifyNewProgram({
  id: 'program-123',
  title: 'Competitor Intel',
  description: 'Capture competitor activity',
  points_value: 100,
  target_roles: ['sales_executive']
});
```

**Sends:**
- **Title:** "🎯 New Program Available!"
- **Message:** "Competitor Intel - Worth 100 points. Tap to view details and start submitting."

---

### **2. Program Update (📝)**
```typescript
await notifyProgramUpdate({
  id: 'program-123',
  title: 'Competitor Intel',
  target_roles: ['sales_executive']
});
```

**Sends:**
- **Title:** "📝 Program Updated"
- **Message:** "Competitor Intel has been updated. Tap to view changes."

---

### **3. Submission Approved (✅)**
```typescript
await notifySubmissionReviewed({
  userId: 'user-123',
  programTitle: 'Competitor Intel',
  status: 'approved',
  points: 100,
  feedback: 'Great work!'
});
```

**Sends:**
- **Title:** "✅ Submission Approved!"
- **Message:** "Your submission for \"Competitor Intel\" was approved! You earned 100 points. Great work!"

---

### **4. Submission Rejected (❌)**
```typescript
await notifySubmissionReviewed({
  userId: 'user-123',
  programTitle: 'Competitor Intel',
  status: 'rejected',
  feedback: 'Photo is blurry, please resubmit'
});
```

**Sends:**
- **Title:** "❌ Submission Needs Review"
- **Message:** "Your submission for \"Competitor Intel\" needs revision. Reason: Photo is blurry, please resubmit"

---

### **5. Achievement (🏆)**
```typescript
await notifyAchievement({
  userId: 'user-123',
  title: '🏆 Level Up!',
  message: 'You reached Level 5! Keep up the great work.',
  data: { level: 5 }
});
```

---

## 🎯 **Real-Time Updates**

The system uses **Supabase Realtime** to push notifications instantly:

```typescript
// In notification-system.tsx
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${getCurrentUserId()}`
    },
    (payload) => {
      console.log('[Notifications] New notification received:', payload);
      setNotifications(prev => [payload.new as Notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  )
  .subscribe();
```

**Result:** Users get notifications **instantly** without refreshing the page!

---

## 🔍 **Debugging**

### **Check if Notifications Are Being Created:**

```sql
-- In Supabase SQL Editor
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

### **Check if Users Exist:**

```sql
SELECT id, employee_id, name, role FROM users WHERE role = 'sales_executive';
```

### **Check Console Logs:**

```
[Notifications] ✅ Sent X notifications
[Notifications] New notification received: { ... }
[Notifications] ✅ Loaded Y notifications for user
```

---

## 🚀 **Advanced Features**

### **1. Navigate to Program When Clicked:**

```typescript
<NotificationSystem
  onNotificationClick={(notification) => {
    if (notification.type === 'new_program') {
      const programId = notification.data?.program_id;
      
      // Option A: Navigate to Programs tab
      setActiveTab('programs');
      
      // Option B: Open program details modal
      setSelectedProgramId(programId);
      setShowProgramDetails(true);
      
      // Option C: Scroll to program in list
      document.getElementById(`program-${programId}`)?.scrollIntoView();
    }
  }}
/>
```

### **2. Mark All as Read:**

Already implemented! Click "Mark all read" in the dropdown.

### **3. Notification Sound (Optional):**

```typescript
// In notification-system.tsx
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on(/*...*/, (payload) => {
      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Sound blocked:', e));
      
      // ... rest of handling ...
    })
    .subscribe();
}, []);
```

---

## 📱 **UI Components**

### **Bell Icon:**
```
┌──────────────┐
│    🔔        │  ← Grey bell (no notifications)
└──────────────┘

┌──────────────┐
│    🔔  🔴3   │  ← Red badge with count
└──────────────┘
```

### **Dropdown:**
```
┌────────────────────────────────────┐
│ Notifications            Mark all  │
│ 3 unread                    read   │
├────────────────────────────────────┤
│ 🔵 🎯 New Program Available!       │
│   "Competitor Intel" - Worth 100   │
│   points. Tap to view...           │
│   5m ago                           │
├────────────────────────────────────┤
│    📝 Program Updated               │
│   "Network Coverage" has been...   │
│   2h ago                           │
├────────────────────────────────────┤
│    ✅ Submission Approved!          │
│   You earned 50 points!            │
│   1d ago                           │
└────────────────────────────────────┘
```

---

## ✅ **Testing Checklist**

### **As Director:**
- [ ] Create new program targeting SEs
- [ ] Check console logs for notification sent
- [ ] Verify program appears in database
- [ ] Verify notifications created in database

### **As SE:**
- [ ] Check bell icon shows red badge
- [ ] Click bell to open dropdown
- [ ] See new program notification
- [ ] Click notification
- [ ] Navigates to program (if handler set up)
- [ ] Notification marked as read
- [ ] Badge count decreases

### **Realtime:**
- [ ] Open SE dashboard in one tab
- [ ] Open Director dashboard in another tab
- [ ] Create program as Director
- [ ] See notification appear INSTANTLY in SE tab (no refresh)

---

## 🎯 **Next Steps**

1. **Create notifications table** in Supabase (SQL above)
2. **Enable RLS policies** (SQL above)
3. **Enable realtime** on table (SQL above)
4. **Add NotificationSystem** to your app header
5. **Test with Director creating program**
6. **Test with SE receiving notification**

---

## 📝 **Summary**

### **What You Get:**

✅ Real-time notifications across all roles
✅ Bell icon with unread badge
✅ Dropdown panel with notification list
✅ Auto-notification when programs are created
✅ Click to navigate to program
✅ Mark as read functionality
✅ Mark all as read
✅ Beautiful UI matching Steve Jobs design philosophy

### **The Magic:**

When **Director creates a program** targeting **Sales Executives**:
1. Program saved to database ✅
2. System finds all SEs in users table ✅
3. Creates notification for each SE ✅
4. Supabase broadcasts to all connected SEs ✅
5. Bell icon shows red badge instantly 🔴 ✅
6. SE clicks notification ✅
7. Opens program form ✅
8. SE starts submitting data ✅

**All interconnected. All real-time. All automatic.** 🎉

---

**Now create the database table and test it!**
