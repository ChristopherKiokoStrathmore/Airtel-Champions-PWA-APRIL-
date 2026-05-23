# Inline Photo Fields Feature

## ✅ What Changed

### Before:
- **Permanent "Photos" section** appeared at the bottom of every program submission form
- All photos went into a single bucket regardless of purpose
- No way to specify different photo requirements for different purposes

### After:
- **Photo fields are now inline** - they appear only when the program creator adds a "Photo Upload" field
- **Each photo field is independent** - separate upload buttons and previews
- **Custom labels** - each field shows its own label (e.g., "Product Photo", "Receipt Photo")
- **No permanent section** - if a program doesn't need photos, no photo upload appears

## How It Works

### For Program Creators:
1. Add a field to your program
2. Select field type: **"Photo Upload"** or **"Photo"**
3. Set a custom label (e.g., "Product Photo", "Store Front", "Receipt")
4. Mark as required/optional
5. Users will see an inline photo upload section with your custom label

### For Program Users:
When filling out a program with photo fields:

```
┌─────────────────────────────────────┐
│ Product Name: _____________________ │
│                                     │
│ Product Photo *                     │
│ ┌─────────────────────────────────┐ │
│ │       📷 Take Photo             │ │
│ │  Tap to capture with camera     │ │
│ └─────────────────────────────────┘ │
│ [Photo previews appear here]        │
│                                     │
│ Receipt Photo *                     │
│ ┌─────────────────────────────────┐ │
│ │       📷 Take Photo             │ │
│ │  Tap to capture with camera     │ │
│ └─────────────────────────────────┘ │
│ [Photo previews appear here]        │
│                                     │
│ Notes: ____________________________ │
└─────────────────────────────────────┘
```

### Multiple Photo Fields:
✅ **YES** - Each field has its own:
- Upload button
- Photo preview grid
- Photo counter
- Remove buttons

Example program with 3 photo fields:
- "Product Photo" (required)
- "Price Tag Photo" (required)
- "Store Front Photo" (optional)

Each gets its own section in the form!

### Photo Requirements:
- **Min/Max photos per field**: ❌ Not enforced (users can upload as many as they want per field)
- **Required/Optional**: ✅ Set via field's `is_required` property
- **Custom Labels**: ✅ Each field shows its own label

## Technical Details

### State Management:
```typescript
// OLD: Single array for all photos
const [photos, setPhotos] = useState<File[]>([]);

// NEW: Object keyed by field ID
const [photos, setPhotos] = useState<Record<string, File[]>>({});

// Example state:
{
  "field-abc-123": [File, File],      // Product Photo field
  "field-def-456": [File],            // Receipt Photo field
  "field-ghi-789": []                 // Store Front Photo field (no photos yet)
}
```

### Photo Functions:
```typescript
// Upload photo to specific field
handlePhotoChange(fieldId: string, event)

// Remove photo from specific field
removePhoto(fieldId: string, photoIndex: number)
```

### Submission:
All photos from all fields are combined into a single array before submission:
```typescript
const allPhotos = [];
Object.values(photos).forEach(fieldPhotos => {
  allPhotos.push(...fieldPhotos);
});
// Then convert to base64 and submit
```

### Validation:
Each required photo field is validated independently:
```typescript
if (field.is_required && field.field_type === 'photo') {
  if (!photos[field.id] || photos[field.id].length === 0) {
    validationErrors[field.id] = true; // Show red border
  }
}
```

## Benefits

1. ✅ **Clarity** - Users know exactly what to photograph
2. ✅ **Flexibility** - Different programs can have 0, 1, or many photo fields
3. ✅ **Organization** - Photos are logically grouped by purpose
4. ✅ **Better UX** - Inline fields feel more natural than a separate section
5. ✅ **Clean Forms** - Programs without photos don't show unnecessary UI

## Example Use Cases

### Product Verification Program:
- Product Photo (required)
- Price Tag Photo (required)
- Shelf Placement Photo (optional)

### Shop Visit Program:
- Shop Front Photo (required)
- Interior Photo (optional)

### Receipt Submission Program:
- Receipt Photo (required)

### Survey Program (no photos):
- No photo upload UI appears at all!

## Migration Notes

- ✅ Existing programs continue to work
- ✅ Photos are still stored in the same database field
- ✅ All photos from all fields are combined on submission
- ✅ No changes needed to backend/database
