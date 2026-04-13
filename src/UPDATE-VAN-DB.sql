-- ============================================================================
-- UPDATE VAN_DB TABLE WITH COMPLETE VAN DATA
-- ============================================================================
-- This script adds the missing location_description column and inserts
-- all van data from the provided spreadsheet.
-- ============================================================================

-- Step 1: Add location_description column if it doesn't exist
ALTER TABLE public.van_db 
ADD COLUMN IF NOT EXISTS location_description text;

-- Step 2: Add van_name column to store "Van 1", "Van 2", "Van 3"
ALTER TABLE public.van_db 
ADD COLUMN IF NOT EXISTS van_name text;

-- Step 3: Clear existing data (optional - remove this line if you want to keep existing data)
TRUNCATE TABLE public.van_db RESTART IDENTITY CASCADE;

-- Step 4: Insert all van data from the spreadsheet
INSERT INTO public.van_db (zone, van_name, location_description, vendor, number_plate) VALUES
  -- SOUTH RIFT ZONE
  ('SOUTH RIFT', 'Van 3', 'Kericho Bomet', 'SCG', 'KCV 291B'),
  
  -- MT KENYA ZONE
  ('MT KENYA', 'Van 1', 'MERU', 'WE EVOLVE', 'KCH 310W'),
  ('MT KENYA', 'Van 2', 'EMBU', 'TOP TOUCH', 'KCG 720W'),
  ('MT KENYA', 'Van 3', 'LAIKIPIA', 'SCG', 'KCQ 129G'),
  
  -- EASTERN ZONE
  ('EASTERN', 'Van 1', 'KITUI', 'TOP TOUCH', 'KDT 259U'),
  ('EASTERN', 'Van 2', 'MAKUENI', 'TOP TOUCH', 'KDT261V'),
  ('EASTERN', 'Van 3', 'MACHAKOS', 'WE EVOLVE', 'KCW 892J'),
  
  -- NORTH EASTERN ZONE
  ('NORTH EASTERN', 'Van 1', 'GARISSA', 'WE EVOLVE', 'KCF 629Q'),
  ('NORTH EASTERN', 'Van 2', 'WAJIR', 'WE EVOLVE', 'KCG 809J'),
  
  -- ABERDARE ZONE
  ('ABERDARE', 'Van 1', 'NYERI', 'TOP TOUCH', 'KCA 530C'),
  ('ABERDARE', 'Van 2', 'KIRINYAGA', 'TOP TOUCH', 'KCB 466U'),
  ('ABERDARE', 'Van 3', 'MURANGA', 'TOP TOUCH', 'KCQ 114R'),
  
  -- NYANZA ZONE
  ('NYANZA', 'Van 2', 'KISUMU', 'SCG', 'KCR 709C'),
  
  -- WESTERN ZONE
  ('WESTERN', 'Van 1', 'Bungoma', 'ALFONES', 'KCQ 564B'),
  ('WESTERN', 'Van 2', 'Kakamega', 'ALFONES', 'KCC 879F'),
  ('WESTERN', 'Van 3', 'Vihiga', 'ALFONES', 'KCN 381L'),
  
  -- NAIROBI METRO ZONE
  ('NAIROBI METRO', 'Van 1', 'Metro', 'ALFONES', 'KCP 597S'),
  
  -- NAIROBI WEST ZONE
  ('NAIROBI WEST', 'Van 1', 'Kayanegware Kikuyu', 'ALFONES', 'KCJ 078J'),
  ('NAIROBI WEST', 'Van 2', 'Rongai Kajiado', 'ALFONES', 'KBS 528F');

-- Step 5: Verify the data
SELECT 
  id,
  zone,
  van_name,
  location_description,
  vendor,
  number_plate,
  created_at
FROM public.van_db
ORDER BY zone, van_name;

-- ============================================================================
-- EXPECTED RESULTS: 19 vans across 8 zones
-- ============================================================================
-- SOUTH RIFT: 1 van
-- MT KENYA: 3 vans
-- EASTERN: 3 vans
-- NORTH EASTERN: 2 vans
-- ABERDARE: 3 vans
-- NYANZA: 1 van
-- WESTERN: 3 vans
-- NAIROBI METRO: 1 van
-- NAIROBI WEST: 2 vans
-- ============================================================================

-- Step 6: Create an index for faster queries by zone
CREATE INDEX IF NOT EXISTS idx_van_db_zone ON public.van_db(zone);

-- Step 7: Create an index for faster queries by number_plate
CREATE INDEX IF NOT EXISTS idx_van_db_number_plate ON public.van_db(number_plate);

-- ============================================================================
-- NOTES FOR PROGRAM CREATOR:
-- ============================================================================
-- When creating a program field to select vans, you can now use:
-- 
-- Field Type: dropdown
-- Database Source:
--   - Table: van_db
--   - Display Field: number_plate
--   - Metadata Fields: zone, van_name, location_description, vendor
-- 
-- This will show the number plate as the main value, with additional info
-- displayed in blue metadata boxes.
-- ============================================================================
