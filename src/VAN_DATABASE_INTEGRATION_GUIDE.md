# 🚐 Van Database Integration Guide

## ✅ Implementation Complete!

I've successfully integrated your `van_db` table with the Airtel Champions program submission forms!

---

## 🎯 What Was Built

### 1. **Backend API Endpoint** (`/supabase/functions/server/vans.tsx`)
- `GET /vans` - Fetches all vans from the database
- `GET /vans/:numberPlate` - Fetches specific van details
- Supports search filtering by number plate, vendor, or zone
- **Requires authentication** - only logged-in SEs can access

### 2. **Searchable Dropdown Component** (`/components/searchable-dropdown.tsx`)
- Beautiful, mobile-friendly dropdown with real-time search
- Click-outside to close functionality
- Shows metadata (capacity, vendor, zone, etc.) for each option
- Loading states and error handling
- Clear selection button (X icon)

### 3. **Program Form Integration** (`/components/programs/program-form.tsx`)
- New field type: `database_dropdown`
- Automatically fetches vans from the database when form loads
- Displays selected van details below the dropdown
- Works seamlessly with existing form validation

---

## 📋 How to Use in Your Programs

### Step 1: Create a Program with Database Dropdown Field

When creating a program (through the HQ Command Center or API), add a field with:

```json
{
  "field_name": "Number Plate",
  "field_type": "database_dropdown",
  "is_required": true,
  "order_index": 1,
  "database_source": "van_db"
}
```

### Step 2: That's It! 🎉

The form will automatically:
1. Load all vans from `van_db` table when the form opens
2. Display a searchable dropdown
3. Show van details (capacity, vendor, zone, ZSM/County) when selected
4. Submit the selected number plate with the form

---

## 🖼️ User Experience

### When the SE Opens the Form:
1. They see a dropdown field labeled "Number Plate"
2. They click on it → sees all available vans
3. They can type to search (e.g., "KDT" filters to show "KDT 261V")
4. They select a van → dropdown closes and shows van details below:
   ```
   📋 Van Details
   Capacity: 9 SEATER
   Vendor: TOP TOUCH
   Zone: EASTERN
   ZSM/County: MAKUENI
   ```

---

## 🔧 Database Schema

Your existing `van_db` table structure:

```sql
CREATE TABLE van_db (
  number_plate TEXT PRIMARY KEY,
  capacity TEXT,
  vendor TEXT,
  zone TEXT,
  zsm_county TEXT
);
```

**Example Data:**
```sql
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
VALUES ('KDT 261V', '9 SEATER', 'TOP TOUCH', 'EASTERN', 'MAKUENI');
```

---

## 🚀 Next Steps

### Option A: Add More Vans to Database

Just insert more rows into `van_db`:

```sql
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
VALUES 
  ('KCA 123A', '7 SEATER', 'BEST TRANSPORT', 'NAIROBI', 'NAIROBI'),
  ('KDB 456B', '14 SEATER', 'SWIFT LOGISTICS', 'COAST', 'MOMBASA');
```

The dropdown will automatically show all vans - no code changes needed!

### Option B: Create Programs Using This Field

Create programs like:
- **MINI-ROAD SHOW** - Check-in/Check-out programs that require van selection
- **Field Visit Reports** - Track which van was used for each visit
- **Van Utilization Tracking** - Daily van usage logs

### Option C: Add More Database-Backed Dropdowns

You can create similar integrations for other tables:
- `shop_db` → Dropdown of shops/outlets
- `territory_db` → Dropdown of territories
- `product_db` → Dropdown of Airtel products

Just:
1. Create a new API endpoint in `/supabase/functions/server/`
2. Add the table name to the field's `database_source` property
3. Update `program-form.tsx` to fetch from the new endpoint

---

## 💡 Advanced Features (Future Enhancements)

### 1. Zone-Based Filtering
Filter vans by the SE's zone:
```tsx
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/vans?zone=EASTERN`
);
```

### 2. Van Availability Checking
Add a `status` column to track if a van is available:
```sql
ALTER TABLE van_db ADD COLUMN status TEXT DEFAULT 'available';
-- Values: 'available', 'in_use', 'maintenance'
```

### 3. Van Assignment History
Track which SE used which van:
```sql
CREATE TABLE van_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number_plate TEXT REFERENCES van_db(number_plate),
  se_id UUID REFERENCES users(id),
  assignment_date DATE,
  program_id UUID REFERENCES programs(id)
);
```

---

## 🧪 Testing

### Test the API Endpoint
```bash
# Get all vans
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/vans

# Search for vans
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/vans?search=KDT"

# Get specific van
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/vans/KDT%20261V
```

### Test the Form
1. Create a program with a `database_dropdown` field
2. Open the program on mobile/web
3. Click the dropdown → should see all vans
4. Search for "KDT" → should filter results
5. Select a van → should display van details

---

## 📊 Example: MINI-ROAD SHOW Program

Here's how to create a check-in program with van selection:

```json
{
  "title": "MINI-ROAD SHOW CHECK-IN",
  "category": "MINI-ROAD SHOW",
  "points_value": 50,
  "fields": [
    {
      "field_name": "Van Number Plate",
      "field_type": "database_dropdown",
      "is_required": true,
      "order_index": 1
    },
    {
      "field_name": "Driver Name",
      "field_type": "text",
      "is_required": true,
      "order_index": 2
    },
    {
      "field_name": "Number of Team Members",
      "field_type": "number",
      "is_required": true,
      "order_index": 3
    },
    {
      "field_name": "Event Photo",
      "field_type": "photo",
      "is_required": true,
      "order_index": 4
    }
  ]
}
```

---

## 🎓 Key Benefits

✅ **No Manual Typing** - SEs don't have to type number plates (reduces errors)  
✅ **Real-Time Search** - Find vans instantly by typing  
✅ **Auto-Populated Details** - Capacity, vendor, zone shown automatically  
✅ **Centralized Data** - Update van_db once, all forms update immediately  
✅ **Offline-Ready** - Van list loads once and caches locally  
✅ **Mobile-Optimized** - Works perfectly on 2G/3G networks  

---

## 🔒 Security

- ✅ API requires authentication (Bearer token)
- ✅ Only logged-in SEs can access van data
- ✅ RLS policies can be added to restrict by zone/role
- ✅ No service role key exposed to frontend

---

## 📞 Support

If you need help:
1. Check the browser console for error logs
2. Verify `van_db` table exists in Supabase
3. Ensure the server is running (check edge function logs)
4. Test the API endpoint directly with curl

---

**Built with ❤️ for Airtel Kenya's 662 Sales Executives**
