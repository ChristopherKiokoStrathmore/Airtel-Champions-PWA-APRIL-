-- ================================================================
-- 013_promoter_member_cluster.sql
-- Adds a promoter cluster field so Team Leads can correct assignment mistakes.
-- ================================================================

ALTER TABLE public.promoter_members
  ADD COLUMN IF NOT EXISTS cluster TEXT NOT NULL DEFAULT '';

UPDATE public.promoter_members pm
SET cluster = ptl.se_cluster
FROM public.promoter_team_leads ptl
WHERE pm.team_lead_id = ptl.id
  AND COALESCE(pm.cluster, '') = '';
