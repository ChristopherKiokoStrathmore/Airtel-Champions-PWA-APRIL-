-- ============================================
-- FIX DIRECTOR USER DATA
-- ============================================
-- Ensures the Director user has proper full_name field
-- Run this in Supabase SQL Editor

-- Update Director user to ensure full_name is set
-- Replace with your actual director phone number
UPDATE app_users
SET 
  full_name = COALESCE(full_name, 'Ashish Azad'),
  name = COALESCE(name, 'Ashish Azad')
WHERE role = 'director'
  AND (full_name IS NULL OR full_name = '');

-- Verify the fix
SELECT 
  id,
  phone_number,
  full_name,
  name,
  role,
  zone
FROM app_users
WHERE role = 'director';

-- ============================================
-- OUTPUT:
-- Should show Director with full_name populated
-- ============================================
