# Progressive Disclosure Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                        │
├─────────────────────────────────────────────────────────────────┤
│  programs TABLE                                                  │
│  ├── id                                                          │
│  ├── title                                                       │
│  ├── points_enabled (BOOLEAN)           ← Toggle 1              │
│  ├── gps_auto_detect_enabled (BOOLEAN)  ← Toggle 2              │
│  └── progressive_disclosure_enabled (BOOLEAN) ← Toggle 3 (NEW!) │
│                                                                  │
│  program_fields TABLE                                            │
│  ├── monday_site_1 (dropdown)                                    │
│  ├── monday_site_2 (dropdown)                                    │
│  ├── monday_site_3 (dropdown)                                    │
│  ├── monday_site_4 (dropdown)                                    │
│  └── ... (same for Tue-Sat)                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↑
                            │ SQL Queries
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Web/Mobile)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📝 HQ PROGRAM CREATOR                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  program-creator-enhanced.tsx                             │ │
│  │                                                           │ │
│  │  Settings Tab:                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ ⭐ Award Points Toggle                              │ │ │
│  │  │   [x] pointsEnabled                                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ 📍 GPS Auto-Detect Toggle                          │ │ │
│  │  │   [x] gpsAutoDetectEnabled                         │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ 🎯 Progressive Disclosure Toggle (NEW!)            │ │ │
│  │  │   [ ] progressiveDisclosureEnabled                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  On Save: → UPDATE programs SET progressive_disclosure_  │ │
│  │              enabled = true/false                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📱 USER SUBMISSION FORM                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  program-submit-modal.tsx                                 │ │
│  │                                                           │ │
│  │  Step 1: Load program from database                      │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  const useProgressiveDisclosure =                   │ │ │
│  │  │    program.progressive_disclosure_enabled !== false │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Step 2: Render fields                                   │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  if (isSiteField && useProgressiveDisclosure) {     │ │ │
│  │  │    return null; // Skip - handle separately         │ │ │
│  │  │  }                                                   │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Step 3: Render Van Calendar section                     │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  if (useProgressiveDisclosure) {                    │ │ │
│  │  │    // Show VanCalendarSiteSelector (progressive)    │ │ │
│  │  │  } else {                                            │ │ │
│  │  │    // Show traditional view (all 4 sites)           │ │ │
│  │  │  }                                                   │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            ↓                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  van-calendar-site-selector.tsx (NEW!)                    │ │
│  │                                                           │ │
│  │  State: visibleCount = 1 (initially)                     │ │
│  │                                                           │ │
│  │  Render:                                                  │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  📅 Monday [1 site]                                 │ │ │
│  │  │    Site 1: [Select...] ▼                            │ │ │
│  │  │    [+ Add Another Site]                             │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  On "Add" Click:                                          │ │ │
│  │    → setVisibleCount(2)                                   │ │ │
│  │    → Site 2 dropdown appears                              │ │ │
│  │                                                           │ │
│  │  On "Remove" Click:                                       │ │ │
│  │    → setVisibleCount(visibleCount - 1)                    │ │ │
│  │    → Clear formData for removed site                      │ │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Creating/Editing a Program

```
HQ User
  │
  ├─► Opens Program Creator
  │
  ├─► Builds form with fields:
  │   - van_selection (dropdown)
  │   - week_start_date (date)
  │   - monday_site_1, monday_site_2, monday_site_3, monday_site_4
  │   - tuesday_site_1, tuesday_site_2, ...
  │
  ├─► Goes to Settings Tab
  │
  ├─► Enables toggles:
  │   [x] Progressive Disclosure UI
  │   [x] GPS Auto-Detect
  │   [ ] Award Points (OFF for planning forms)
  │
  ├─► Saves Program
  │
  └─► Database INSERT/UPDATE
      - progressive_disclosure_enabled = true
      - gps_auto_detect_enabled = true
      - points_enabled = false
```

### Submitting a Form (Progressive Disclosure ON)

```
Sales Executive/ZSM
  │
  ├─► Opens Van Calendar program
  │
  ├─► program-submit-modal.tsx loads:
  │   - Fetch program metadata
  │   - Check: progressive_disclosure_enabled = true
  │   - Fetch field definitions
  │
  ├─► Render logic:
  │   - Skip site fields in main loop
  │   - Pass site fields to VanCalendarSiteSelector
  │
  ├─► VanCalendarSiteSelector shows:
  │   📅 Monday [1 site]
  │     Site 1: [Select...] ▼
  │     [+ Add Another Site]
  │
  ├─► User selects "NAIROBI WEST" for Site 1
  │
  ├─► User clicks "+ Add Another Site"
  │   - visibleCount: 1 → 2
  │   - Site 2 dropdown appears
  │
  ├─► User selects "SOUTH B MARKET" for Site 2
  │
  ├─► User fills van_selection and week_start_date
  │
  ├─► User clicks "Submit"
  │
  └─► Database INSERT to submissions table
      {
        "van_selection": "KBW 123A",
        "week_start_date": "2026-02-17",
        "monday_site_1": "NAIROBI WEST",
        "monday_site_2": "SOUTH B MARKET",
        "monday_site_3": "",  // Empty
        "monday_site_4": "",  // Empty
        "tuesday_site_1": "",
        ...
      }
```

### Submitting a Form (Progressive Disclosure OFF)

```
Sales Executive/ZSM
  │
  ├─► Opens program
  │
  ├─► program-submit-modal.tsx loads:
  │   - Check: progressive_disclosure_enabled = false
  │   - DON'T skip site fields in main loop
  │
  ├─► Render logic:
  │   - Show all 24 site fields in traditional layout
  │
  ├─► User sees:
  │   Monday - Site 1: [Select...] ▼
  │   Monday - Site 2: [Select...] ▼
  │   Monday - Site 3: [Select...] ▼
  │   Monday - Site 4: [Select...] ▼
  │   Tuesday - Site 1: [Select...] ▼
  │   ...
  │
  ├─► User fills fields
  │
  └─► Same submission data structure
```

---

## 🎯 Component Hierarchy

```
App.tsx
└── Programs Section
    ├── ProgramCreatorEnhanced
    │   ├── Build Tab
    │   │   └── Field Builder (creates monday_site_1, etc.)
    │   └── Settings Tab
    │       ├── Points Toggle
    │       ├── GPS Toggle
    │       └── Progressive Disclosure Toggle ← NEW!
    │
    └── ProgramSubmitModal
        ├── Standard Fields (text, dropdown, etc.)
        │
        └── Conditional Van Calendar Rendering
            ├── IF progressive_disclosure_enabled = true:
            │   └── VanCalendarSiteSelector ← NEW COMPONENT!
            │       ├── Day Header ("📅 Monday [2 sites]")
            │       ├── Site Dropdowns (visible 1-4)
            │       ├── "+ Add Another Site" Button
            │       └── "Remove" Button
            │
            └── IF progressive_disclosure_enabled = false:
                └── Traditional Field Rendering
                    (All 4 sites visible at once)
```

---

## 📂 File Structure

```
/src
├── /components
│   └── /programs
│       ├── program-creator-enhanced.tsx
│       │   ├── State: progressiveDisclosureEnabled
│       │   ├── Settings Tab UI: Toggle checkbox
│       │   └── Save: UPDATE programs SET progressive_disclosure_enabled
│       │
│       ├── program-submit-modal.tsx
│       │   ├── Load: program.progressive_disclosure_enabled
│       │   ├── Conditional rendering based on toggle
│       │   └── Import VanCalendarSiteSelector
│       │
│       └── van-calendar-site-selector.tsx ← NEW!
│           ├── Props: siteFields, formData, onFieldChange
│           ├── State: visibleCount (1-4)
│           ├── Render: Day header, site dropdowns, buttons
│           └── Logic: Add/Remove sites
│
├── /database
│   ├── ADD_GPS_TOGGLE_COLUMN.sql
│   ├── VAN_CALENDAR_4_SITES_PER_DAY.sql
│   └── ADD_PROGRESSIVE_DISCLOSURE_COLUMN.sql ← NEW!
│
└── /docs (root)
    ├── VAN_CALENDAR_4_SITES_INSTRUCTIONS.md
    ├── VAN_CALENDAR_PROGRESSIVE_UI_SUMMARY.md
    ├── PROGRESSIVE_DISCLOSURE_FEATURE_GUIDE.md ← NEW!
    ├── DEPLOYMENT_CHECKLIST.md ← NEW!
    ├── ANSWER_TO_YOUR_QUESTION.md ← NEW!
    └── ARCHITECTURE_DIAGRAM.md ← THIS FILE
```

---

## 🔐 Database Schema

```sql
-- programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  
  -- Toggles (all independent)
  points_enabled BOOLEAN DEFAULT TRUE,           -- Toggle 1: Award points?
  gps_auto_detect_enabled BOOLEAN DEFAULT TRUE,  -- Toggle 2: Show GPS button?
  progressive_disclosure_enabled BOOLEAN DEFAULT FALSE, -- Toggle 3: Progressive UI?
  
  -- Other fields...
  target_roles TEXT[],
  who_can_submit TEXT[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- program_fields table
CREATE TABLE program_fields (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  field_name TEXT,           -- e.g., "monday_site_1"
  field_label TEXT,          -- e.g., "Monday - Site 1"
  field_type TEXT,           -- e.g., "dropdown"
  is_required BOOLEAN,
  options JSONB,             -- { database_source: { table: "sitewise", ... } }
  order_index INTEGER
);

-- Example field for Van Calendar:
{
  "field_name": "monday_site_1",
  "field_label": "Monday - Site 1",
  "field_type": "dropdown",
  "options": {
    "database_source": {
      "table": "sitewise",
      "display_field": "site_name"
    }
  }
}
```

---

## 🎨 UI State Management

### VanCalendarSiteSelector Component

```typescript
interface VanCalendarSiteSelectorProps {
  day: string;              // "Monday"
  dayKey: string;           // "monday"
  siteFields: Field[];      // [monday_site_1, monday_site_2, monday_site_3, monday_site_4]
  formData: Record<string, any>;
  databaseDropdownData: Record<string, any[]>;
  loadingDatabaseDropdowns: Record<string, boolean>;
  onFieldChange: (fieldId: string, value: any) => void;
}

// Internal state:
const [visibleCount, setVisibleCount] = useState(1); // 1-4

// Render logic:
const visibleFields = sortedFields.slice(0, visibleCount);

// Add button:
const handleAddSite = () => {
  if (visibleCount < 4) setVisibleCount(visibleCount + 1);
};

// Remove button:
const handleRemoveSite = () => {
  if (visibleCount > 1) {
    onFieldChange(sortedFields[visibleCount - 1].id, ''); // Clear data
    setVisibleCount(visibleCount - 1);
  }
};
```

---

## 🚦 Decision Flow

```
Program Submission Form Loads
         │
         ├─► Load program metadata
         │
         ▼
   Is progressive_disclosure_enabled = true?
         │
         ├─── YES ──────────────────────────────┐
         │                                       │
         │                                       ▼
         │                        Detect site field pattern?
         │                                       │
         │                                       ├─── YES ───► Use VanCalendarSiteSelector
         │                                       │             (Progressive UI)
         │                                       │
         │                                       └─── NO ────► Render normally
         │
         └─── NO ───────────────────────────────► Render all fields traditionally
                                                   (Show all 4 sites per day)
```

---

## ✅ Summary

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Database** | `programs.progressive_disclosure_enabled` | Store toggle state |
| **Creator UI** | `program-creator-enhanced.tsx` | Settings tab with toggle |
| **Submission UI** | `program-submit-modal.tsx` | Conditional rendering logic |
| **Progressive Component** | `van-calendar-site-selector.tsx` | 1-4 sites with Add/Remove buttons |
| **Traditional View** | Main field loop | All 4 sites visible at once |

**Everything is over-the-air - no APK rebuild required!** 🚀
