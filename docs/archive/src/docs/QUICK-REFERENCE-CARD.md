# Quick Reference Card - Photo Fields & Metadata

## 🎯 Quick Facts

### Inline Photo Fields
- ✅ Only appears when program has photo upload field
- ✅ Each photo field is independent
- ✅ Custom label per field
- ✅ Unlimited photos per field
- ✅ Required/optional validation supported
- ✅ All photos combine on submission

### Database Dropdown Metadata
- ✅ Blue info box shows related data
- ✅ Appears when item is selected
- ✅ Updates when selection changes
- ✅ Clears when field is cleared
- ✅ Works with any database dropdown
- ✅ No configuration needed (uses metadata_fields)

---

## 📋 Cheat Sheet

### Photo Field Setup (Program Creator)
```
1. Add Field
2. Type: "Photo Upload" or "Photo"
3. Label: "Product Photo" (custom)
4. Required: ✓ or ☐
5. Save
```

### Multiple Photo Fields Example
```
Field 1: "Product Photo" (required)
Field 2: "Receipt Photo" (required)
Field 3: "Store Photo" (optional)

Result: 3 separate photo upload sections
```

### Database Dropdown Setup
```
1. Add Field
2. Type: "Dropdown"
3. Data Source: "Database"
4. Table: "van_db"
5. Display Field: "number_plate"
6. Metadata Fields: ["capacity", "vendor", "driver_name"]
7. Save

Result: Dropdown with blue metadata box
```

---

## 🔍 Troubleshooting

### Photo Upload Issues

**Problem:** Photo field not showing
- ✓ Check field type is "photo" or "photo_upload"
- ✓ Check program has been saved
- ✓ Reload the form

**Problem:** Can't submit form with required photo
- ✓ Upload at least 1 photo
- ✓ Check for red border on photo field
- ✓ See error message at top

**Problem:** Photos not combining correctly
- ✓ Check console for submission logs
- ✓ Verify `totalPhotos` count
- ✓ Check `photosByField` breakdown

### Metadata Display Issues

**Problem:** Blue box not appearing
- ✓ Check dropdown has database_source configured
- ✓ Check metadata_fields array is not empty
- ✓ Verify item was actually selected (not just typed)
- ✓ Check console for `[AutoPopulate]` logs

**Problem:** Wrong data in blue box
- ✓ Verify metadata_fields match database columns
- ✓ Check database has data for selected item
- ✓ Review console logs for selected row

**Problem:** Blue box doesn't clear
- ✓ Actually clear the field (backspace all text)
- ✓ Check console for clear event
- ✓ Reload form if needed

---

## 📱 Testing Quick Checks

### Photo Fields (30 seconds)
1. Open program with photo field
2. Tap "Take Photo"
3. Select/capture photo
4. Verify photo appears below
5. Tap × to remove
6. Submit with photo ✓

### Metadata Display (30 seconds)
1. Open program with database dropdown
2. Select an item
3. Verify blue box appears
4. Check all fields show data
5. Change selection
6. Verify box updates ✓

---

## 💡 Pro Tips

### For Program Creators
- Use descriptive labels for photo fields ("Before Photo" vs "Photo 1")
- Mark critical photos as required
- Add 1-2 optional photo fields for flexibility
- Configure metadata_fields to show most useful data
- Test on mobile before rolling out

### For Users
- Take photos in good lighting
- Hold phone steady
- Take multiple angles if needed
- Review metadata before submitting
- Use search in dropdowns for fast selection

### For Developers
- Check console logs for debugging
- Monitor `photos` state structure
- Verify `fieldMetadata` updates
- Test validation on all photo fields
- Ensure backward compatibility

---

## 🎨 UI States Reference

### Photo Field States
| State | Border | Background | Icon |
|-------|--------|------------|------|
| Empty | Blue | Blue-50 | 📷 |
| With Photos | Blue | Blue-50 | 📸 |
| Error (Required) | Red | Red-50 | 📷 |
| Valid (After Fix) | Blue | Blue-50 | 📸 |

### Metadata Box States
| State | Visibility | Content |
|-------|-----------|---------|
| No Selection | Hidden | N/A |
| Item Selected | Visible | Full metadata |
| Selection Changed | Visible | Updated metadata |
| Field Cleared | Hidden | N/A |

---

## 📊 Performance Tips

### Photo Optimization
- Encourage smaller file sizes
- Limit to 3-5 photos per field if possible
- Monitor submission times on 2G/3G
- Consider compression in future

### Metadata Loading
- Database dropdowns load all data once
- Metadata extraction is instant (from loaded data)
- No extra API calls for metadata display
- Grid layout is CSS-based (fast)

---

## 🔗 Related Documentation

- `/docs/INLINE-PHOTO-FIELDS.md` - Full feature documentation
- `/docs/PHOTO-FIELDS-TESTING-GUIDE.md` - Testing scenarios
- `/docs/DATABASE-DROPDOWN-METADATA.md` - Metadata feature details
- `/docs/VISUAL-EXAMPLES.md` - Visual mockups and examples
- `/docs/PHASE-COMPLETE-INLINE-PHOTOS-AND-METADATA.md` - Complete summary

---

## 📞 Support

### Common Questions

**Q: Can I have different min/max photos per field?**
A: Not yet - unlimited uploads per field currently

**Q: Are photos tagged by field in database?**
A: No - all photos combine into single array on submission

**Q: Can users edit metadata displayed in blue box?**
A: No - metadata is read-only

**Q: What happens if metadata_fields is empty?**
A: No blue box appears (normal dropdown behavior)

**Q: Can I have 10 photo fields?**
A: Yes! Each gets its own section

---

## ✅ Success Criteria

You know it's working when:

### Photo Fields
- [ ] Photo upload only shows when field configured
- [ ] Multiple fields show separately
- [ ] Photos go to correct field
- [ ] Validation works per field
- [ ] All photos submit together

### Metadata Display
- [ ] Blue box appears on selection
- [ ] Shows correct data
- [ ] Updates on change
- [ ] Clears on empty
- [ ] Works for all DB dropdowns

---

## 🚀 Quick Start Commands

### View Logs in Console
```javascript
// Filter for photo events
[Photo]

// Filter for metadata events
[AutoPopulate]

// Filter for submission
[Submit]
```

### Inspect State in React DevTools
```javascript
// Check photo state structure
photos: {
  "field-id-1": [File, File],
  "field-id-2": [File]
}

// Check metadata state
fieldMetadata: {
  "field-id-3": {
    label: "KDT 261V",
    data: { capacity: "9 SEATER", ... }
  }
}
```

---

## 🎯 One-Minute Setup Test

1. **Create program** with 1 photo field + 1 database dropdown
2. **Open submission form**
3. **Take photo** - should appear in grid
4. **Select dropdown item** - blue box should appear
5. **Submit** - should succeed with 1 photo

**If all 5 steps work: ✅ Setup is perfect!**
