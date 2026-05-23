# "Who Can Submit" Feature Implementation

## Overview
Added the ability to control **who can submit** a program form, separate from **who can see** the program. This gives program creators fine-grained control over submission permissions.

## Key Concepts

### Before:
- **Target Audience** controlled both visibility AND submission rights
- If ZSMs could see a program, they could also submit it

### After:
- **Target Audience** (👥) → Controls who can SEE the program
- **Who Can Submit** (✍️) → Controls who can FILL OUT the form
- These are now independent settings

## Use Cases

1. **Check In/Check Out Program**
   - Target Audience: SEs, ZSMs (both can see it)
   - Who Can Submit: SEs, ZSMs (both can submit without toggling)

2. **SE-Only Reporting**
   - Target Audience: SEs, ZSMs (both can see it)
   - Who Can Submit: SEs only (ZSMs can view but not submit)

3. **Manager-Only Forms**
   - Target Audience: ZSMs only
   - Who Can Submit: ZSMs only

## Changes Made

### 1. Database
- **File**: `/database/add-who-can-submit-column.sql`
- Added `who_can_submit` column to `programs` table (TEXT[] array)
- Default value: Same as `target_roles` for backward compatibility
- Existing programs updated to maintain current behavior

### 2. Program Creator (Basic)
- **File**: `/components/programs/program-creator.tsx`
- Added `whoCanSubmit` state variable
- Added "Who Can Submit" section in the UI (blue checkboxes)
- Added validation: at least one role must be selected
- Updated database insert to include `who_can_submit` field

### 3. Program Creator Enhanced
- **File**: `/components/programs/program-creator-enhanced.tsx`
- Added `whoCanSubmit` state variable
- Added "Who Can Submit" section in Settings tab
- Added validation for both create and edit modes
- Updated both insert and update operations

### 4. Program Submission Modal
- **File**: `/components/programs/program-submit-modal.tsx`
- Added `who_can_submit` field to Program interface
- Added permission check before showing the form
- Shows clear error message if user's role is not allowed to submit
- Lists which roles CAN submit for transparency

### 5. Permission Check Flow
```
User clicks "Submit" → Modal opens → Check user role
                                     ↓
                    Is role in who_can_submit array?
                    ↓                              ↓
                   YES                            NO
                    ↓                              ↓
           Show form fields              Show "Cannot Submit" message
                                          with allowed roles listed
```

## UI Details

### Program Creator UI
```
┌─────────────────────────────────────┐
│ 👥 Target Audience *                │
│ Who can SEE this program             │
│ ☑️ Sales Executives (red)           │
│ ☑️ Zonal Sales Managers (red)       │
│ ☐ Zonal Business Managers           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✍️ Who Can Submit *                 │
│ Who can FILL OUT this form           │
│ ☑️ Sales Executives (blue)          │
│ ☑️ Zonal Sales Managers (blue)      │
│ ☐ Zonal Business Managers           │
└─────────────────────────────────────┘
```

### Permission Denied Modal
```
┌──────────────────────────────────┐
│           🔒                      │
│     Cannot Submit                 │
│                                   │
│ Your role (ZSM) is not allowed   │
│ to submit this program.          │
│                                   │
│ Only the following roles can     │
│ submit: SE, ZBM                  │
│                                   │
│      [Close]                     │
└──────────────────────────────────┘
```

## Migration Steps

### For Existing Installations:
1. Run the SQL migration: `/database/add-who-can-submit-column.sql`
2. No code changes needed - everything is backward compatible
3. Existing programs will allow all target roles to submit (same as before)

### For New Programs:
1. Create program as usual
2. Set Target Audience (who sees it)
3. Set Who Can Submit (who can fill it out)
4. Both settings are required (at least one role each)

## Backward Compatibility
✅ **Fully backward compatible**
- Existing programs without `who_can_submit` will allow all roles to submit
- Default value copies from `target_roles` during migration
- No breaking changes to existing functionality

## Testing Checklist
- [ ] Create new program with different target audience and submission roles
- [ ] User in target audience but NOT in who_can_submit sees but cannot submit
- [ ] User in both arrays can see and submit normally
- [ ] User not in target audience doesn't see the program at all
- [ ] Edit existing program and change submission permissions
- [ ] Verify error message shows correct allowed roles

## Future Enhancements
- Per-field submission permissions (advanced scenarios)
- Role-based field visibility within the same form
- Submission quotas per role
- Approval workflows based on submitter role
