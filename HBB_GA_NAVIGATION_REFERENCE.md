# 🎯 HBB Dashboard Navigation - Quick Reference

## Before vs After

### Old Navigation (6 Tabs)
```
┌─────────────────────────────────────────────────────┐
│ Home │ Leads │ GAs │ Top 3 │ New │ Profile         │
└─────────────────────────────────────────────────────┘
```

### New Navigation (5 Tabs)
```
┌─────────────────────────────────────────────────────┐
│ Home │ Leads │ GAs │ New │ Profile                  │
└─────────────────────────────────────────────────────┘
         ↑
    Combined:
    GAs + Top 3
```

---

## Tab Functions

| Tab | Icon | Purpose | Notes |
|-----|------|---------|-------|
| **Home** | 🏠 | Overview of activity | Daily leads summary |
| **Leads** | 📋 | View all leads | With filters & search |
| **GAs** | 📈 | GA metrics & top performers | NEW DESIGN - Circular badges |
| **New** | ➕ | Create new lead | Quick entry form |
| **Profile** | 👤 | User profile & logout | Settings & info |

---

## GAs Tab - What You See

### For DSE/Installer Logged In
```
┌─────────────────────────────┐
│  Good afternoon, EMILY!     │ ← Greeting
└─────────────────────────────┘

   ┌─────────┐ ┌─────────┐
   │   18    │ │ KES 15K │
   │   GAs   │ │Incentive│
   └─────────┘ └─────────┘
   
╭─ Top Performers This Month ──╮
│                              │
│  ┌───┐  ┌───┐  ┌───┐        │
│  │#1 │  │#2 │  │#3 │        │
│  │ M │  │ P │  │ F │        │
│  │25 │  │20 │  │12 │        │
│  └───┘  └───┘  └───┘        │
│   GAs   GAs    GAs           │
╰──────────────────────────────╯
```

### For Team Lead Logged In
```
┌─────────────────────────────┐
│  Good afternoon, LEAD!      │ ← Greeting
└─────────────────────────────┘

   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │   57    │ │ KES 45K │ │ Team 3  │ ← Team size
   │   GAs   │ │Incentive│ │Members  │
   └─────────┘ └─────────┘ └─────────┘
   
╭─ Team Members This Month ────╮
│  (Click to see details)       │
│                              │
│  ┌───┐  ┌───┐  ┌───┐        │
│  │#1 │  │#2 │  │#3 │        │
│  │ P │  │ Q │  │ R │        │
│  │25 │  │20 │  │12 │        │
│  └───┘  └───┘  └───┘        │
│   GAs   GAs    GAs           │
╰──────────────────────────────╯
```

### When You Click a Team Member
```
┌─────────────┐
│ ← P (Back)  │ ← Go back to team view
└─────────────┘

┌─────────────────────────────┐
│ Performance This Month      │
├─────────────────────────────┤
│                             │
│    GAs: 25    Incentive     │
│              KES 20,000     │
│                             │
├─────────────────────────────┤
│ Phone: 0712222222          │
│ Month: 2026-04              │
└─────────────────────────────┘
```

---

## Code Changes

### File Updated
- `src/components/hbb/hbb-dse-dashboard.tsx`

### What Changed
1. TabType updated: `'gas' | 'top3'` → `'gases'`
2. Nav items: Removed "Top 3" tab
3. New state: `selectedTeamMember`, `teamMembers`
4. New function: `getUserRole()` for role detection
5. Updated `fetchGAData()` with Team Lead logic
6. New `GAsTab()` with circular badge design
7. New `TeamMemberDetailTab()` for details view
8. Conditional rendering: Show detail view if member selected

### Lines Added
- ~300 lines for GAs tab design
- ~100 lines for Team Lead cumulative logic
- ~80 lines for Team Member detail view
- ~50 lines for role detection

**Total:** ~530 lines added (well-structured and commented)

---

## Type Definitions

```typescript
// Updated
type TabType = 'home' | 'new-lead' | 'my-leads' | 'profile' | 'gases';

// New state variables
const [selectedTeamMember, setSelectedTeamMember] = useState<any>(null);
const [teamMembers, setTeamMembers] = useState<any[]>([]);

// New function
const userRole = getUserRole(); // Returns: 'dse' | 'installer' | 'team_lead'
```

---

## Navigation Code Examples

### Switching Tabs
```typescript
// Old way
onClick={() => setActiveTab('gas')}    // Clicked GAs
onClick={() => setActiveTab('top3')}   // Clicked Top 3

// New way
onClick={() => setActiveTab('gases')}  // Single GAs tab
```

### Viewing Team Member Details
```typescript
// Click performer badge
onClick={() => setSelectedTeamMember(performer)}

// Returns to team view
onClick={() => setSelectedTeamMember(null)}
```

### Conditional Rendering
```typescript
// Old
{activeTab === 'gas'      && <GAsTab />}
{activeTab === 'top3'     && <Top3Tab />}

// New
{activeTab === 'gases'    && (
  selectedTeamMember 
    ? <TeamMemberDetailTab member={selectedTeamMember} onBack={() => setSelectedTeamMember(null)} />
    : <GAsTab />
)}
```

---

## FAQs

**Q: Why combine GAs and Top 3?**  
A: Better UX - everything GA-related in one place, matches Sales design

**Q: How do I switch between team members?**  
A: Tap their circular badge, tap back button to return to team view

**Q: What if no GA data shows?**  
A: Load sample data from `HBB_GA_SAMPLE_DATA.sql`

**Q: Can I see top performers from other months?**  
A: Currently shows current month only. Future: Add month selector

**Q: How does role detection work?**  
A: Checks user.role, then full_name for keywords, defaults to 'dse'

---

## Testing Commands

```bash
# Test DSE
# Phone: 711111111
# Expected: 18 GAs, 15K KES, top performers shown

# Test Installer  
# Phone: 716666666
# Expected: 35 GAs, 28K KES, top installers shown

# Test Team Lead
# Phone: 720000000
# Expected: 57 cumulative GAs, 3 team members, clickable profiles
```

---

**Version:** 1.0  
**Last Updated:** April 22, 2026  
**Status:** ✅ Ready for Testing
