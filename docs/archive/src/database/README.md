# TAI Database Schema

This folder contains SQL schema files for the TAI Sales Intelligence Network app.

## 🚀 Quick Setup

If you're seeing a "table not found" error, follow these steps:

### 1. Open Supabase Dashboard
Go to [supabase.com/dashboard](https://supabase.com/dashboard) and select your project.

### 2. Open SQL Editor
Click **"SQL Editor"** in the left sidebar.

### 3. Run the Schema
Copy the contents of `programs-schema.sql` and paste it into the SQL editor, then click **"Run"**.

### 4. Refresh Your App
After the SQL completes successfully, refresh your TAI app and the error should be gone!

---

## 📋 What Gets Created

### Tables

1. **`programs`** - Main programs table
   - Stores program metadata (title, description, points, target roles, etc.)
   - Like a "Google Form" container

2. **`program_fields`** - Dynamic form fields
   - Stores all form fields for each program
   - Supports 12+ field types (text, dropdown, photo, location, etc.)
   - Includes validation rules, conditional logic, and more

3. **`program_submissions`** - User submissions
   - Stores all submissions from Sales Executives
   - Includes GPS data, photos, and form responses
   - Tracks approval status and points awarded

### Additional Features

- ✅ Row Level Security (RLS) policies for data protection
- ✅ Indexes for optimal query performance
- ✅ Helper functions for common operations
- ✅ `job_title` column added to `app_users` table
- ✅ Sample "Launch Date" program with 10 fields

---

## 🔧 Files in This Folder

- **`programs-schema.sql`** - Complete database schema for programs system
- **`README.md`** - This file

---

## 📚 Table Details

### `programs` Table Structure
```sql
- id (UUID, primary key)
- title (TEXT)
- description (TEXT)
- category (TEXT) - e.g., "Network Experience"
- icon (TEXT) - emoji icon
- color (TEXT) - hex color code
- points_value (INTEGER)
- target_roles (TEXT[]) - array of role names
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- status (TEXT) - 'active', 'paused', or 'archived'
- created_by (UUID)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `program_fields` Table Structure
```sql
- id (UUID, primary key)
- program_id (UUID, foreign key)
- field_name (TEXT)
- field_label (TEXT)
- field_type (TEXT) - 'text', 'dropdown', 'photo', etc.
- is_required (BOOLEAN)
- placeholder (TEXT)
- help_text (TEXT)
- options (JSONB) - for dropdown/multi-select
- validation (JSONB) - validation rules
- conditional_logic (JSONB) - show/hide logic
- order_index (INTEGER)
- section_id (TEXT)
- section_title (TEXT)
- section_index (INTEGER)
- created_at (TIMESTAMP)
```

### `program_submissions` Table Structure
```sql
- id (UUID, primary key)
- program_id (UUID, foreign key)
- user_id (UUID, foreign key)
- submission_data (JSONB) - all field values
- location (JSONB) - GPS coordinates
- photos (TEXT[]) - array of photo URLs
- status (TEXT) - 'pending', 'approved', or 'rejected'
- points_awarded (INTEGER)
- reviewed_by (UUID)
- reviewed_at (TIMESTAMP)
- review_notes (TEXT)
- submitted_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

---

## 🛡️ Security

All tables have Row Level Security (RLS) enabled:

- **Sales Executives** can view active programs and submit responses
- **Managers** (ZSM, ZBM) can view submissions from their teams
- **HQ/Directors** can view all data and create/edit programs

---

## ❓ Troubleshooting

### Error: "Could not find the table"
→ Run the `programs-schema.sql` file in Supabase SQL Editor

### Error: "permission denied"
→ Make sure RLS policies are enabled (they're included in the schema)

### Programs not showing up
→ Check that programs have `status = 'active'` and include your role in `target_roles`

---

## 📞 Support

For issues or questions, check the console logs in your browser (F12 → Console tab) for detailed error messages.
