# MANUAL EDIT INSTRUCTIONS

## Problem
The form is rendering site fields TWICE - once in the main loop, once in the progressive disclosure section.

## Root Cause
Line ~1291-1295 has OLD skipping logic that doesn't detect the NEW pattern (`monday_sites`, `tuesday_sites`).

## Solution
Replace lines 1290-1295 with:

```typescript
            // 🆕 SKIP Van Calendar site fields ONLY if progressive disclosure is enabled
            if (shouldSkipField(field)) {
              console.log('[ProgramSubmitModal] ⏭️ Skipping site field:', field.field_name);
              return null;
            }
```

This uses the new `shouldSkipField()` helper function that was added at line 32.

## How to Apply
1. Open `/components/programs/program-submit-modal.tsx`
2. Find line ~1290 (search for "SKIP Van Calendar site fields")
3. Replace the 6 lines (1290-1295) with the 5 lines above
4. Save

## Expected Result
- Monday Sites, Tuesday Sites, etc. should ONLY appear in the "Weekly Route Planning" blue box section
- They should NOT appear in the main form fields section above it
