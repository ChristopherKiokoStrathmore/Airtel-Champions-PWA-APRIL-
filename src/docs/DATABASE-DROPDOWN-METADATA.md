# Database Dropdown Metadata Display

## ✅ Feature Implemented
When users select an item from a database dropdown (like NUMBER PLATE or SITE(S) WORKING TODAY), a **blue info box** now appears below the field showing all the related details from the database.

## How It Works

### For NUMBER PLATE:
When you select "KDT 261V", the blue box shows:
```
ℹ️ Details for: KDT 261V
┌─────────────────────────────────────┐
│ CAPACITY: 9 SEATER                  │
│ VENDOR: TOP TOUCH                   │
│ DRIVER NAME: [Driver Name]          │
│ CREATED AT: 2026-02-04...           │
└─────────────────────────────────────┘
```

### For SITE(S) WORKING TODAY:
When you select "CHEPTERWAI_GENOFF", the blue box shows:
```
ℹ️ Details for: CHEPTERWAI_GENOFF
┌─────────────────────────────────────┐
│ SITE ID: NAN0062                    │
│ TOWN CATEGORY: ROC (Rural)          │
│ CLUSTER (691): KABIYET              │
│ TSE: KENNEDY KIPKEMBOI              │
│ ...and more fields...               │
└─────────────────────────────────────┘
```

## Visual Design
- **Blue background** (`bg-blue-50`)
- **Blue border** (`border-blue-300`)
- **Grid layout** (2 columns on desktop, stacks on mobile)
- **Clear labels** with uppercase field names
- **Bold values** for easy reading

## Behavior
1. **Shows** when user selects an item from dropdown
2. **Updates** when user selects a different item
3. **Clears** when user deletes the selection
4. **Scrollable** if there are many metadata fields

## Configuration
The metadata fields displayed come from the program creator's configuration:
- In Program Creator → Field Settings → Database Dropdown
- Set `metadata_fields` array with column names to display
- Example: `["capacity", "vendor", "driver_name"]`

## Auto-Population
The system still attempts to auto-populate matching form fields, but now also **always shows the blue metadata box** regardless of whether auto-population succeeds. This ensures users can always see the related data even if the form doesn't have matching fields.

## Benefits
1. ✅ **Transparency** - Users see all related data from their selection
2. ✅ **Verification** - Users can confirm they selected the correct item
3. ✅ **Reference** - Users have quick access to related information
4. ✅ **No Form Changes Needed** - Works without creating new form fields

## Technical Details
- State: `fieldMetadata` stores metadata for each database dropdown field
- Updates: `handleDatabaseDropdownSelection` manages metadata storage
- Display: Blue box component renders below dropdown when metadata exists
- Cleanup: Metadata cleared when field value is empty
