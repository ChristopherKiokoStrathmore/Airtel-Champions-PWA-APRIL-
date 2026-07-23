-- Fix: NEW_SITES_JULY returns 0 rows to the app ("Table exists but appears to be empty").
--
-- Root cause: the table was imported via the Supabase dashboard, which enables Row
-- Level Security by default and adds NO policy. With RLS on and no permissive SELECT
-- policy, PostgREST returns 200 [] (an empty array) to the anon/authenticated roles the
-- PWA uses -- so the app concludes the table is empty even though it has 302 rows.
--
-- Its sibling site tables (NEW_SITES_APRIL, NEW_SITES_MARCH, Priority_sites, challenges)
-- are already anon-readable; this brings NEW_SITES_JULY in line with them.
--
-- Verified 2026-07-23:
--   anon         -> HTTP 200, Content-Range */0        (0 rows visible)
--   service_role -> HTTP 206, Content-Range 0-0/302    (302 rows exist)

ALTER TABLE public."NEW_SITES_JULY" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "NEW_SITES_JULY_read_all" ON public."NEW_SITES_JULY";
CREATE POLICY "NEW_SITES_JULY_read_all"
  ON public."NEW_SITES_JULY"
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public."NEW_SITES_JULY" TO anon, authenticated;
