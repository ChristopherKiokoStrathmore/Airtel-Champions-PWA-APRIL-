# Photo Fields Testing Guide

## Test Scenarios

### ✅ Test 1: Program with NO Photo Fields
**Expected Behavior:**
- No photo upload UI appears anywhere in the form
- Form shows only other field types (text, dropdown, etc.)
- Submit button works without photos

**Steps:**
1. Create a program with text and dropdown fields only
2. Open the program submission form
3. Verify: No "Take Photo" section appears
4. Submit the form successfully

---

### ✅ Test 2: Program with ONE Photo Field
**Expected Behavior:**
- Photo upload appears inline with label
- Can upload multiple photos to that field
- Photos display in grid below upload button
- Can remove individual photos

**Steps:**
1. Create a program with one "Photo Upload" field labeled "Product Photo"
2. Open submission form
3. Verify: "Product Photo" label appears with photo upload button below it
4. Tap "Take Photo" and select 3 photos
5. Verify: 3 photos appear in grid below
6. Tap X on one photo to remove it
7. Verify: Photo removed, count shows "2 photos added"

---

### ✅ Test 3: Program with MULTIPLE Photo Fields
**Expected Behavior:**
- Each photo field has its own upload section
- Photos from different fields are kept separate
- Each field shows its own photo count

**Steps:**
1. Create program with 3 photo fields:
   - "Product Photo" (required)
   - "Receipt Photo" (required)
   - "Store Photo" (optional)
2. Open submission form
3. Upload 2 photos to "Product Photo"
4. Upload 1 photo to "Receipt Photo"
5. Upload 3 photos to "Store Photo"
6. Verify each section shows correct photo count:
   - Product Photo: "2 photos added"
   - Receipt Photo: "1 photo added"
   - Store Photo: "3 photos added"
7. Remove a photo from "Product Photo"
8. Verify only "Product Photo" count decreases
9. Submit form
10. Verify all 6 photos (2+1+3) are submitted

---

### ✅ Test 4: Required Photo Field Validation
**Expected Behavior:**
- Form won't submit if required photo field is empty
- Field gets red border and error message appears

**Steps:**
1. Create program with required "Product Photo" field
2. Open submission form
3. Fill in other fields but don't upload photos
4. Tap Submit
5. Verify: 
   - Error message: "Please fill in all required fields"
   - Photo field has red border
   - Form doesn't submit
6. Upload a photo
7. Tap Submit
8. Verify: Form submits successfully

---

### ✅ Test 5: Optional Photo Field
**Expected Behavior:**
- Can submit form without uploading photos to optional fields
- No validation error if left empty

**Steps:**
1. Create program with optional "Store Photo" field
2. Open submission form
3. Fill required fields but skip photo field
4. Tap Submit
5. Verify: Form submits successfully without photos

---

### ✅ Test 6: Mixed Required and Optional Photo Fields
**Expected Behavior:**
- Required fields enforce validation
- Optional fields allow submission without photos

**Steps:**
1. Create program with:
   - "Product Photo" (required)
   - "Store Photo" (optional)
2. Try submitting with no photos - should fail
3. Upload photo to "Product Photo" only
4. Submit - should succeed
5. Verify: Submission includes 1 photo

---

### ✅ Test 7: Photo Field with Custom Labels
**Expected Behavior:**
- Each field displays its custom label
- Upload button appears below the label

**Example Labels to Test:**
- "Product Photo"
- "Receipt Upload"
- "Before Photo"
- "After Photo"
- "Competition Product"

**Steps:**
1. Create program with various custom-labeled photo fields
2. Verify each label appears correctly above its upload section

---

### ✅ Test 8: Photo Removal from Multiple Fields
**Expected Behavior:**
- Removing photo from one field doesn't affect other fields
- Each field maintains its own photo array

**Steps:**
1. Create program with 2 photo fields
2. Upload 2 photos to each field (4 total)
3. Remove 1 photo from first field
4. Verify:
   - First field: 1 photo remaining
   - Second field: 2 photos still there
5. Remove all photos from second field
6. Verify:
   - First field: 1 photo still there
   - Second field: empty

---

### ✅ Test 9: Existing Programs (Backward Compatibility)
**Expected Behavior:**
- Programs created before this update still work
- If they have photo fields, they show inline
- If they don't, no photo section appears

**Steps:**
1. Open an existing program (created before this update)
2. If it had photo fields configured, verify they appear inline
3. If it didn't have photo fields, verify no photo UI appears
4. Submit successfully

---

### ✅ Test 10: Mobile Camera Integration
**Expected Behavior:**
- "Take Photo" button opens native camera
- Can capture photo directly from camera
- Photo appears in grid immediately

**Steps (on mobile device):**
1. Open program with photo field
2. Tap "Take Photo"
3. Verify: Camera app opens
4. Take a photo
5. Verify: Photo appears in preview grid
6. Take 2 more photos
7. Verify: All 3 photos appear in grid

---

## Console Log Verification

When uploading photos, you should see:
```
[Photo] Added 1 photo(s) to field field-abc-123
```

When removing photos:
```
[Photo] Removed photo 0 from field field-abc-123
```

On submission:
```
[Submit] Starting submission...
  totalPhotos: 5
  photosByField: {
    "field-abc-123": 2,
    "field-def-456": 3
  }
```

---

## Known Behaviors

### ✅ Multiple Photos Per Field
- Users can upload unlimited photos per field
- No min/max enforced (by design)
- All photos combine on submission

### ✅ Photo Storage
- All photos stored as base64 in single `photos` array in database
- Field separation is only for UX during form filling
- After submission, photos are not tagged by field

### ✅ Photo Preview
- Grid shows 3 photos per row
- Images auto-scale to fit 24px height
- Remove button (×) appears on top-right of each photo

---

## Edge Cases to Test

1. **Empty photo field with no uploads**
   - Should display upload button only
   - No preview grid

2. **Upload then remove all photos**
   - Grid should disappear
   - Should be able to upload again

3. **Very long field labels**
   - Label should wrap properly
   - Upload button should still be accessible

4. **Many photos in one field (10+)**
   - Grid should scroll if needed
   - Performance should be acceptable
   - All photos should submit

5. **Submit with some fields having photos, some not**
   - Only photos from filled fields should submit
   - Empty fields should be skipped
