# 🚀 LAUNCH DATE PROGRAM - COMPLETE SETUP

## ✅ WHAT'S BEEN CREATED

The **Launch Date** program has been created under **Network Experience** category with all specified fields:

### **Program Details:**
- **Name:** Launch Date
- **Category:** Network Experience
- **Icon:** 📶
- **Points:** 50 points per submission
- **Status:** Active

### **Form Fields (10 Total):**

1. **Site ID** (Required)
   - Type: Dropdown (searchable)
   - Options: 1,489 site IDs from NRU0076 to NYI0104
   - Full list includes all Kenyan network sites

2. **Launch Date** (Required)
   - Type: Date picker
   - Allows selection of launch date from calendar

3. **Partner Name** (Required)
   - Type: Text input
   - Min: 2 characters, Max: 100 characters

4. **Number of SSO Recruited** (Required)
   - Type: Number input
   - Minimum: 0

5. **Number of AM Agents Recruited** (Required)
   - Type: Number input
   - Minimum: 0

6. **Total GAs Done** (Required)
   - Type: Number input
   - Minimum: 0

7. **Indoor Coverage** (Required)
   - Type: Dropdown
   - Options: Very Good, Good, Poor

8. **Outdoor Coverage** (Required)
   - Type: Dropdown
   - Options: Very Good, Good, Poor

9. **All POIs Covered** (Required)
   - Type: Dropdown
   - Options: Yes, No

10. **POIs with Network Issues** (Optional)
    - Type: Text area (4 rows)
    - Max: 500 characters
    - For listing problematic POIs

---

## 📋 SETUP INSTRUCTIONS

### **Step 1: Run the Program Creation SQL**

In Supabase SQL Editor, run:

```sql
-- File: /database/programs/create_launch_date_program.sql
```

This will:
- ✅ Create the "Launch Date" program
- ✅ Add all 10 form fields with proper validation
- ✅ Set up dropdown options for Site ID, Coverage, and POIs
- ✅ Configure date picker for Launch Date

### **Step 2: Verify Creation**

Run this to verify:

```sql
-- Check program exists
SELECT name, category, status, points_per_submission
FROM programs
WHERE name = 'Launch Date';

-- Check all fields
SELECT 
  display_order,
  field_label,
  field_type,
  is_required
FROM program_form_fields pff
JOIN programs p ON pff.program_id = p.id
WHERE p.name = 'Launch Date'
ORDER BY display_order;
```

You should see 10 fields listed in order.

---

## 🎯 SITE IDS LIST

The program includes **ALL 1,489 site IDs** across Kenya:

### **Site ID Prefixes:**
- **NRU** - Nairobi Rural sites
- **NUA** - Nairobi Urban sites
- **BGO** - Bungoma sites
- **KEK** - Kericho sites
- **LKP** - Laikipia sites
- **SRU** - Samburu sites
- **MUA** - Murang'a sites
- **TKA** - Thika sites
- **MGA** - Meru/Maua sites
- **MOS** - Mombasa sites
- **KGA** - Kilifi/Garsen sites
- **MRE** - Malindi/Mariakani sites
- **EBU** - Embu sites
- **MES** - Meru South sites
- **THE** - Tharaka sites
- **MEC** - Meru Central sites
- **KTI** - Kitui sites
- **MGI** - Machakos/Kangundo sites
- **NYI** - Nyeri sites
- **MEN** - Meru North sites
- **MIT** - Mitunguu sites
- **ILO** - Isiolo sites
- **MLE** - Malindi East sites
- **MSA** - Mombasa/Mtwapa sites
- **TTA** - Taita sites
- **KLE** - Kilifi East sites
- **KFI** - Kilifi sites
- **MDI** - Malindi sites
- **WIR** - Witu/Ijara sites
- **MRA** - Mariakani sites
- **TRV** - Taveta sites
- **GSA** - Garissa sites
- **LMU** - Lamu sites
- **NBI** - Nairobi sites (largest group)
- **KBU** - Kiambu sites
- **TKA** - Thika sites
- **KDO** - Kajiado sites
- **MNI** - Machakos North/Athi River sites
- **TSO** - Teso sites
- **BIA** - Busia sites
- **BND** - Bungoma/Nandi sites
- **SYA** - Siaya sites
- **BMS** - Busia/Mumias sites
- **KKA** - Kakamega sites
- **LMB** - Lambwe sites
- **BRT** - Bungoma/Trans Nzoia sites
- **BMT** - Bungoma/Malakisi/Teso sites
- **KHO** - Kericho/Homa Bay sites
- **NOK** - Nyanza/Kisumu sites
- **TRA** - Trans Nzoia sites
- **BMA** - Bomet/Mau sites
- **TNZ** - Tanzania border sites
- **WPT** - West Pokot sites
- **TNA** - Trans Nzoia sites
- **UGU** - Ugunja sites
- **KSI** - Kisii sites
- **NRA** - Narok sites
- **GHA** - Garissa/Hagadera sites
- **MRI** - Muranga/Rift sites
- **HBY** - Homa Bay sites
- **SBA** - Samburu sites
- **RHY** - Rift/Homa Bay sites
- **NYD** - Nyandarua sites
- **KRA** - Karatina sites
- **MET** - Meru/Tigania East sites
- **KYO** - Kiambu/Uplands sites
- **NAN** - Nandi sites
- **VGA** - Vihiga sites
- **KMU** - Kapsabet/Mumias sites
- **MEG** - Meru/Egoji sites
- **RAL** - Ruiru/Limuru sites

### **Total:** 1,489 Sites

---

## 📱 USER EXPERIENCE

### **For Sales Executives (SEs):**

1. Navigate to **Programs** → **Network Experience**
2. Click on **"Launch Date"** program
3. Fill in the form:
   - Select Site ID from searchable dropdown
   - Pick launch date from calendar
   - Enter partner name
   - Enter recruitment numbers (SSO, AM Agents)
   - Enter total GAs done
   - Rate indoor/outdoor coverage
   - Indicate if all POIs covered
   - List any POIs with issues (optional)
4. Click **Submit**
5. Earn **50 points** ✨

### **For Managers (ZSM/ZBM):**

- View all "Launch Date" submissions from their team
- Filter by site ID, date range, coverage quality
- Export data for analysis
- Approve/reject submissions

### **For Director:**

- National overview of all site launches
- Analytics by region, partner, coverage quality
- Identify sites with coverage issues
- Track recruitment performance by partner

---

## 🔍 SAMPLE SUBMISSION

```json
{
  "site_id": "NRU0076",
  "launch_date": "2025-01-15",
  "partner_name": "Airtel Kenya Networks Ltd",
  "sso_recruited": 5,
  "am_agents_recruited": 12,
  "total_gas_done": 150,
  "indoor_coverage": "Very Good",
  "outdoor_coverage": "Good",
  "all_pois_covered": "Yes",
  "pois_with_issues": ""
}
```

---

## 📊 ANALYTICS AVAILABLE

Once submissions start coming in, you'll be able to analyze:

- **Site launch trends** over time
- **Partner performance** (recruitment numbers)
- **Coverage quality** by region/site
- **POI coverage** completion rates
- **Network issues** by location
- **GA conversion rates** per site

---

## 🎉 READY TO USE!

The Launch Date program is now **LIVE** and ready for your Sales Executives to start submitting site launch data!

**Next Steps:**
1. Run the SQL to create the program
2. Test with a sample submission
3. Train SEs on how to use the form
4. Monitor submissions in real-time

---

## 📝 FUTURE ENHANCEMENTS

As mentioned, this will later be split into 3 separate programs:

1. **Launch Date** (D-Day) - Current program
2. **New Site Launch (D-1)** - Day before launch
3. **New Site Launch (D-10)** - 10 days after launch
4. **New Site Launch (D-20)** - 20 days after launch

Each will track different metrics and milestones in the site launch lifecycle.

---

**Ready to launch! 🚀📶**
