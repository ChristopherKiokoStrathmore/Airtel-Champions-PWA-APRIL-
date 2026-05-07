-- Ensure admin phone maps to sales developer profile
-- Normalised admin phone (without leading zero): 785638462

DO $$
BEGIN
  -- Update existing rows matching the admin phone (several formats)
  IF EXISTS (
    SELECT 1 FROM public.app_users
    WHERE replace(replace(replace(coalesce(phone_number, ''), ' ', ''), '-', ''), '+', '') IN ('785638462','0785638462')
  ) THEN
    UPDATE public.app_users
    SET role = 'developer',
        full_name = COALESCE(NULLIF(full_name, ''), 'Sales Developer (Admin)'),
        source_table = 'app_users',
        updated_at = now()
    WHERE replace(replace(replace(coalesce(phone_number, ''), ' ', ''), '-', ''), '+', '') IN ('785638462','0785638462');
  ELSE
    INSERT INTO public.app_users (employee_id, full_name, email, phone_number, role, created_at, updated_at, source_table)
    VALUES (NULL, 'Sales Developer (Admin)', NULL, '785638462', 'developer', now(), now(), 'app_users');
  END IF;
END;
$$;

-- Optional: mark pin/hash for quick local sign-in in dev (comment out in production)
-- UPDATE public.app_users SET pin = '1234' WHERE replace(replace(replace(coalesce(phone_number, ''), ' ', ''), '-', ''), '+', '') = '785638462';
