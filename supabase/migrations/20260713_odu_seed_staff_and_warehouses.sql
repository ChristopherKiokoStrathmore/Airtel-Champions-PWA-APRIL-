-- ODU Retrieval — seed warehouses + staff logins for UAT/pilot.
-- Run AFTER 20260713_odu_retrieval_infrastructure.sql.
-- ⚠️ Change these PINs before production — do not extend the default-1234 pattern
--    into the retrieval program (it handles customer PII + payments).

-- Warehouses (one per pilot town — edit to taste)
INSERT INTO public.odu_warehouses (name, town, lat, lng, is_active) VALUES
  ('Nairobi Central Warehouse', 'Nairobi', -1.2864, 36.8172, true),
  ('Thika Warehouse',           'Thika',   -1.0333, 37.0693, true)
ON CONFLICT DO NOTHING;

-- CX + warehouse staff (PIN login through the hbb mode → odu_staff branch)
INSERT INTO public.odu_staff (msisdn, name, role, warehouse_id, pin, is_active) VALUES
  ('0700000010', 'CX Agent One', 'hbb_cx', NULL, '1234', true),
  ('0700000011', 'Warehouse Op One', 'hbb_warehouse',
     (SELECT id FROM public.odu_warehouses WHERE town = 'Nairobi' LIMIT 1), '1234', true)
ON CONFLICT (msisdn) DO NOTHING;

-- Opt a couple of installers into the ODU program for testing (edit ids/town).
-- UPDATE public.installers SET odu_opt_in = true WHERE town ILIKE '%Nairobi%' LIMIT 5;
