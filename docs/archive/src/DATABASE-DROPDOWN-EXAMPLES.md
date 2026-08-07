# 🎯 Database Dropdown Real-World Examples

## Your Airtel Champions Database Tables - Ready to Use!

---

## 📊 Example 1: Van Selection Dropdown

**Perfect for: Van assignment programs, vehicle tracking**

### Configuration:
- **Table**: `van_db`
- **Display Field**: `number_plate`
- **Metadata Fields**: `capacity`, `vendor`, `zone`, `zsm_county`

### What Users See:
```
Select Van: [Dropdown with all number plates]
```

### What You Get in Submission:
```json
{
  "van_selection": "KCA 123A",
  "van_selection_metadata": {
    "capacity": "2000",
    "vendor": "Vendor A",
    "zone": "Nairobi",
    "zsm_county": "Nairobi County"
  }
}
```

### Use Cases:
- Van assignment programs
- Vehicle maintenance tracking
- Route planning forms
- Van availability checks

---

## 🏪 Example 2: Ambassador Shop Selection

**Perfect for: Shop visits, outlet verification, merchandising**

### Configuration:
- **Table**: `amb_shops`
- **Display Field**: `shop_code` or `partner_name`
- **Metadata Fields**: `fp_code`, `usdm_name`, `zsm`, `shop_status`

### What Users See:
```
Select Shop: [Dropdown with shop codes or partner names]
```

### What You Get in Submission:
```json
{
  "shop_selection": "AMB001",
  "shop_selection_metadata": {
    "fp_code": "FP123",
    "partner_name": "Airtel Express Shop",
    "usdm_name": "John Doe",
    "zsm": "Jane Smith",
    "shop_status": "active"
  }
}
```

### Use Cases:
- Shop visit verification
- Outlet performance tracking
- Ambassador shop audits
- Stock verification forms

---

## 📍 Example 3: Site Selection (Sitewise)

**Perfect for: Site visits, network coverage, territorial planning**

### Configuration:
- **Table**: `sitewise`
- **Display Field**: `SITE` (site name) or `SITE ID`
- **Metadata Fields**: `ZONE`, `ZSM`, `ZBM`, `TSE`, `CLUSTER (691)`, `TOWN CATEGORY`

### What Users See:
```
Select Site: [Dropdown with site names]
```

### What You Get in Submission:
```json
{
  "site_selection": "NAIROBI-CBD-001",
  "site_selection_metadata": {
    "SITE ID": "NBC001",
    "ZONE": "Nairobi",
    "ZSM": "John Manager",
    "ZBM": "Jane Boss",
    "TSE": "Bob Tech",
    "CLUSTER (691)": "Cluster A",
    "TOWN CATEGORY": "Urban"
  }
}
```

### Use Cases:
- Network site visits
- Coverage verification
- Site maintenance programs
- Network expansion tracking

---

## 👥 Example 4: Sales Executive Selection

**Perfect for: Team assignments, peer reviews, collaboration forms**

### Configuration:
- **Table**: `app_users`
- **Display Field**: `full_name`
- **Metadata Fields**: `employee_id`, `role`, `zone`, `zsm`, `phone_number`, `total_points`

### What Users See:
```
Select Team Member: [Dropdown with names]
```

### What You Get in Submission:
```json
{
  "team_member": "Christopher Opili",
  "team_member_metadata": {
    "employee_id": "SE001",
    "role": "sales_executive",
    "zone": "Nairobi",
    "zsm": "John Manager",
    "phone_number": "+254712345678",
    "total_points": 1500
  }
}
```

### Use Cases:
- Peer nomination forms
- Team assignment
- Collaboration tracking
- Recognition programs

---

## 🎯 Example 5: Mission Type Selection

**Perfect for: Activity logging, performance tracking**

### Configuration:
- **Table**: `mission_types`
- **Display Field**: `name`
- **Metadata Fields**: `category`, `points`, `icon`, `color`, `description`

### What Users See:
```
Select Activity: [Dropdown with mission types]
```

### What You Get in Submission:
```json
{
  "activity_type": "Shop Visit",
  "activity_type_metadata": {
    "category": "Field Activity",
    "points": 50,
    "icon": "🏪",
    "color": "#EF4444",
    "description": "Visit and verify shop details"
  }
}
```

### Use Cases:
- Activity logging
- Performance tracking
- Point calculation
- Activity categorization

---

## 🏢 Example 6: Department Selection

**Perfect for: Cross-department collaboration, resource requests**

### Configuration:
- **Table**: `departments`
- **Display Field**: `name`
- **Metadata Fields**: `description`

### What Users See:
```
Select Department: [Dropdown with department names]
```

### What You Get in Submission:
```json
{
  "department": "Sales",
  "department_metadata": {
    "description": "Sales and business development team"
  }
}
```

### Use Cases:
- Cross-department requests
- Resource allocation
- Collaboration tracking
- Reporting structures

---

## 🌍 Example 7: Region/Zone Selection

**Perfect for: Territory assignments, regional programs**

### Configuration:
- **Table**: `regions`
- **Display Field**: `name`
- **Metadata Fields**: `code`

### What Users See:
```
Select Region: [Dropdown with region names]
```

### What You Get in Submission:
```json
{
  "region": "Nairobi",
  "region_metadata": {
    "code": "NBI"
  }
}
```

### Use Cases:
- Regional programs
- Territory planning
- Zone-specific activities
- Geographic filtering

---

## 🏆 Example 8: Challenge Selection

**Perfect for: Challenge participation, goal setting**

### Configuration:
- **Table**: `challenges`
- **Display Field**: `title`
- **Metadata Fields**: `description`, `target_count`, `bonus_points`, `start_date`, `end_date`

### What Users See:
```
Select Challenge: [Dropdown with active challenges]
```

### What You Get in Submission:
```json
{
  "challenge": "100 Shops Challenge",
  "challenge_metadata": {
    "description": "Visit 100 shops in one week",
    "target_count": 100,
    "bonus_points": 500,
    "start_date": "2024-02-01",
    "end_date": "2024-02-07"
  }
}
```

### Use Cases:
- Challenge enrollment
- Goal tracking
- Competition participation
- Bonus point programs

---

## 🎨 Pro Tips

### 1. **Searchable Dropdowns**
All database dropdowns are automatically searchable! Users can type to filter options.

### 2. **Display Field Matters**
Choose a display field that's:
- ✅ Human-readable (names, codes, titles)
- ✅ Unique enough to identify the item
- ✅ Short enough to fit in dropdown

Examples:
- Good: `number_plate`, `shop_code`, `full_name`, `title`
- Avoid: `description`, `created_at`, `id`

### 3. **Metadata is Optional**
- Use metadata when you need additional context
- Don't add too many fields (3-5 is ideal)
- Metadata is invisible to users but stored in submission

### 4. **Combine with Other Fields**
Create powerful forms by combining database dropdowns:

```
Program: "Van Shop Visit"
Fields:
  1. Van Selection (from van_db)
  2. Shop Selection (from amb_shops)
  3. Site Selection (from sitewise)
  4. Photo Upload
  5. Notes (text)
```

### 5. **Filter Before Using**
If you want filtered dropdowns (e.g., only active shops):
- Filter data at the database level using shop_status
- Or create a database view with filtered data
- Add view name to ALLOWED_TABLES

---

## 🔧 Advanced: Creating Custom Views

Want filtered or combined data? Create a database view:

```sql
-- Example: Only active ambassador shops
CREATE VIEW active_amb_shops AS
SELECT * FROM amb_shops 
WHERE shop_status = 'active';

-- Grant permissions
GRANT SELECT ON active_amb_shops TO anon, authenticated, service_role;
```

Then add `'active_amb_shops'` to ALLOWED_TABLES and use it in dropdowns!

---

## 📞 Common Questions

**Q: Can I search in the dropdown?**  
A: Yes! All database dropdowns are searchable.

**Q: What if my table is empty?**  
A: The dropdown will be empty. Make sure to add data first.

**Q: Can I use multiple database dropdowns in one form?**  
A: Absolutely! Add as many as you need.

**Q: How do I see what was selected?**  
A: Check the submission data - both the display value and metadata are saved.

**Q: Can I filter dropdown options?**  
A: Create a database view with filtered data and add it to ALLOWED_TABLES.

---

**🎉 You're ready to create powerful dynamic forms with your actual database tables!**
