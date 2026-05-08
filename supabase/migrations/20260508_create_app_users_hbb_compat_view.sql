-- Compatibility shim for older frontend bundles (including figma-hosted build)
-- that still query public.app_users_hbb for sales login.

CREATE OR REPLACE VIEW public.app_users_hbb AS
SELECT
  id,
  employee_id,
  full_name,
  full_name AS name,
  email,
  phone_number,
  role,
  region,
  zone,
  zsm,
  zbm,
  rank,
  total_points,
  pin,
  pin_hash,
  is_active,
  created_at,
  updated_at,
  source_table
FROM public.app_users
WHERE COALESCE(is_active, true) = true;

GRANT SELECT ON public.app_users_hbb TO anon;
GRANT SELECT ON public.app_users_hbb TO authenticated;
GRANT SELECT ON public.app_users_hbb TO service_role;
