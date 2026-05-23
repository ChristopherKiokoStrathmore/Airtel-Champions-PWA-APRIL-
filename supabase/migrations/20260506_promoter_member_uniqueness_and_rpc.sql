-- Enforce one active promoter assignment per MSISDN across all Team Leads.
-- This keeps historical rows for dropped promoters, but prevents a second
-- active team lead from recruiting the same number.

-- Keep the existing lookup index, but enforce uniqueness only for active rows.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
     AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'promoter_members'
      AND tc.constraint_type = 'UNIQUE'
      AND kcu.column_name = 'msisdn'
  LOOP
    EXECUTE format('ALTER TABLE public.promoter_members DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.idx_pm_msisdn_unique;
DROP INDEX IF EXISTS public.idx_promoter_members_msisdn_active;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promoter_members_msisdn_active
  ON public.promoter_members (msisdn)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_promoter_members_team_lead_active
  ON public.promoter_members (team_lead_id)
  WHERE is_active = true;

-- Atomic insert for promoter recruitment.
-- Normalizes the phone number, checks for an active assignment, and inserts
-- the promoter only if the number is free.
CREATE OR REPLACE FUNCTION public.promoter_add_member(
  p_team_lead_id uuid,
  p_promoter_name text,
  p_msisdn text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_msisdn text;
  v_existing_team_lead_id uuid;
  v_member public.promoter_members;
BEGIN
  IF p_team_lead_id IS NULL OR btrim(COALESCE(p_promoter_name, '')) = '' OR btrim(COALESCE(p_msisdn, '')) = '' THEN
    RAISE EXCEPTION 'PROMOTER_INPUT_INVALID';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.promoter_team_leads
    WHERE id = p_team_lead_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'TEAM_LEAD_NOT_FOUND';
  END IF;

  v_normalized_msisdn := public.normalize_phone(p_msisdn);

  SELECT team_lead_id
    INTO v_existing_team_lead_id
  FROM public.promoter_members
  WHERE msisdn = v_normalized_msisdn
    AND is_active = true
  ORDER BY added_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_team_lead_id = p_team_lead_id THEN
      RAISE EXCEPTION 'PROMOTER_ALREADY_ASSIGNED_TO_YOUR_TEAM';
    END IF;

    RAISE EXCEPTION 'PROMOTER_ALREADY_ASSIGNED_TO_ANOTHER_TEAM_LEAD';
  END IF;

  INSERT INTO public.promoter_members (
    team_lead_id,
    promoter_name,
    msisdn,
    is_active,
    added_at,
    dropped_at
  )
  VALUES (
    p_team_lead_id,
    btrim(p_promoter_name),
    v_normalized_msisdn,
    true,
    now(),
    NULL
  )
  RETURNING * INTO v_member;

  RETURN json_build_object(
    'id', v_member.id,
    'team_lead_id', v_member.team_lead_id,
    'promoter_name', v_member.promoter_name,
    'msisdn', v_member.msisdn,
    'is_active', v_member.is_active,
    'added_at', v_member.added_at,
    'dropped_at', v_member.dropped_at
  );
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'PROMOTER_ALREADY_ASSIGNED_TO_ANOTHER_TEAM_LEAD';
END;
$$;

GRANT EXECUTE ON FUNCTION public.promoter_add_member(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.promoter_add_member(uuid, text, text) TO authenticated;