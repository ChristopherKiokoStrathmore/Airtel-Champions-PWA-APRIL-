# 🚐 HOW TO ADD VAN CALENDAR TO YOUR APP

## ❓ **YOU ASKED: "Where is the form?"**

**ANSWER:** The Van Calendar is **NOT** a program activity form. It's a **separate feature** that needs to be added to your app's navigation.

---

## 🎯 **WHAT IS VAN CALENDAR?**

**Van Calendar** is a weekly route planning system where:
- **ZSMs** submit weekly van schedules (which sites each van will visit Mon-Sun)
- **HQ** views all van calendars in a grid
- **HQ** calculates compliance (planned vs actual visits)

It's **NOT** created through the Program Creator. It's a **standalone feature**.

---

## 📍 **WHERE TO ADD IT**

You have **3 options**:

### **OPTION 1: Add as Bottom Nav Tab** ⭐ RECOMMENDED
Add "Van Calendar" as a 5th tab in your bottom navigation (next to Home, Programs, Feed, Profile)

### **OPTION 2: Add to Programs Tab**
Add a "Van Calendar" button at the top of your Programs screen

### **OPTION 3: Add to HQ Dashboard Only**
Only show Van Calendar to HQ/Directors in their command center

---

## 🚀 **QUICK IMPLEMENTATION - OPTION 1 (Bottom Nav Tab)**

Here's exactly what to add to your `App.tsx`:

### **Step 1: Import the components**

Add these imports at the top of `/App.tsx` (around line 40):

```typescript
import VanCalendarForm from './components/van-calendar-form';
import VanCalendarGrid from './components/van-calendar-grid';
import VanCalendarCompliance from './components/van-calendar-compliance';
import { Truck } from 'lucide-react'; // For van icon
```

### **Step 2: Add state for van calendar tab**

Find where you have `const [activeTab, setActiveTab] = useState('home');` and update it to support 'van_calendar':

```typescript
// Around line 100-120
const [activeTab, setActiveTab] = useState<'home' | 'submissions' | 'programs' | 'feed' | 'profile' | 'directory' | 'call_history' | 'groups' | 'research' | 'van_calendar'>('home');
```

### **Step 3: Add the Van Calendar screen**

Find where you render different tabs (around line 1648 where it says `if (activeTab === 'programs')`), and add this BEFORE the home screen:

```typescript
// Van Calendar Tab (for ZSMs and HQ)
if (activeTab === 'van_calendar') {
  // Show different views based on role
  if (userData.role === 'zonal_sales_manager') {
    // ZSM sees the form to submit weekly plans
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <VanCalendarForm />
      </div>
    );
  } else if (userData.role === 'hq_command_center' || userData.role === 'director') {
    // HQ sees the calendar grid and compliance dashboard
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Add tabs within van calendar */}
        <div className="bg-white border-b">
          <div className="flex gap-4 px-6 py-3">
            <button
              onClick={() => setVanCalendarView('grid')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                vanCalendarView === 'grid'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              📅 Calendar Grid
            </button>
            <button
              onClick={() => setVanCalendarView('compliance')}
              className={`px-4 py-2 rounded-lg font-semibold ${
                vanCalendarView === 'compliance'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              📊 Compliance
            </button>
          </div>
        </div>
        
        {vanCalendarView === 'grid' && <VanCalendarGrid />}
        {vanCalendarView === 'compliance' && <VanCalendarCompliance />}
      </div>
    );
  } else {
    // Other roles don't have access
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Van Calendar is only available to ZSMs and HQ</p>
          <button
            onClick={() => setActiveTab('home')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
}
```

### **Step 4: Add state for HQ sub-views**

Add this near your other state declarations (around line 100):

```typescript
const [vanCalendarView, setVanCalendarView] = useState<'grid' | 'compliance'>('grid');
```

### **Step 5: Add to Bottom Navigation**

Find your bottom navigation bar (search for "bottom navigation" or look for the component that has Home, Programs, Feed, Profile buttons).

Add this button:

```typescript
{/* Van Calendar Tab - Only for ZSMs and HQ */}
{(userData.role === 'zonal_sales_manager' || 
  userData.role === 'hq_command_center' || 
  userData.role === 'director') && (
  <button
    onClick={() => setActiveTab('van_calendar')}
    className={`flex-1 flex flex-col items-center py-2 ${
      activeTab === 'van_calendar'
        ? 'text-red-600'
        : 'text-gray-500'
    }`}
  >
    <Truck className="w-6 h-6" />
    <span className="text-xs mt-1">Vans</span>
  </button>
)}
```

---

## 🚀 **QUICK IMPLEMENTATION - OPTION 2 (Inside Programs Tab)**

If you want to add it to the existing Programs tab instead:

### **Step 1: Import the components** (same as Option 1)

### **Step 2: Modify Programs Screen**

In your `ProgramsListFoldersApp` component, add a button at the top:

```typescript
{/* Only show to ZSMs and HQ */}
{(userData.role === 'zonal_sales_manager' || 
  userData.role === 'hq_command_center' || 
  userData.role === 'director') && (
  <button
    onClick={() => {
      // Open Van Calendar
      setShowVanCalendar(true);
    }}
    className="w-full mb-4 p-4 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
  >
    <Truck className="w-5 h-5" />
    <span className="font-bold">🚐 Van Weekly Calendar</span>
  </button>
)}
```

Then show the Van Calendar components in a modal or full screen when `showVanCalendar` is true.

---

## 🚀 **QUICK IMPLEMENTATION - OPTION 3 (HQ Dashboard Only)**

If you only want HQ to access it:

### **Step 1:** Open `/components/director-dashboard-v2.tsx` or your HQ dashboard component

### **Step 2:** Add a new card/section:

```typescript
import VanCalendarGrid from './van-calendar-grid';
import VanCalendarCompliance from './van-calendar-compliance';

// Inside the dashboard JSX
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-2xl font-bold mb-4">🚐 Van Calendar Management</h2>
  
  <div className="space-y-6">
    <VanCalendarGrid />
    <VanCalendarCompliance />
  </div>
</div>
```

---

## ✅ **RECOMMENDED APPROACH**

I recommend **OPTION 1** (Bottom Nav Tab) because:

✅ **Easy for ZSMs to access** - They need to submit weekly (every Saturday)  
✅ **Separate from programs** - It's not a form, it's a calendar system  
✅ **Role-based views** - ZSMs see form, HQ sees grid  
✅ **Clean navigation** - Doesn't clutter existing screens  

---

## 🎯 **WHICH OPTION DO YOU WANT?**

Tell me which option you prefer, and I'll modify your `App.tsx` to add it!

**Options:**
1. **Bottom Nav Tab** (Recommended) - "Vans" tab next to Home, Programs, etc.
2. **Inside Programs Tab** - Button at top of Programs screen
3. **HQ Dashboard Only** - Only accessible from HQ Command Center
4. **Custom Location** - Tell me where you want it!

---

## 💡 **WHY IT'S NOT IN PROGRAMS**

The Van Calendar is **NOT** a program activity form because:

❌ **Program Forms** = Activities that SEs submit (Shop Verification, Mini-Road Show, etc.)  
✅ **Van Calendar** = Weekly planning tool for ZSMs to schedule van routes  

**Different purposes:**
- **Program Forms:** Data collection from field activities
- **Van Calendar:** Route planning and compliance tracking

---

**Reply with which option you want, and I'll add it to your app right now! 🚀**
