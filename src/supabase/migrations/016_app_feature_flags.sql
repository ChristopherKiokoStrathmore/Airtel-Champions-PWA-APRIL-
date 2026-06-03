-- 016_app_feature_flags.sql
-- Global feature flags toggled by HQ/admin users.
-- TL users read via anon key (public SELECT); HQ writes via authenticated JWT.

CREATE TABLE IF NOT EXISTS app_feature_flags (
  key        TEXT        PRIMARY KEY,
  value      BOOLEAN     NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID        REFERENCES auth.users(id)
);

-- Seed: TL portal is active by default
INSERT INTO app_feature_flags (key, value)
VALUES ('promoter_tl_active', true)
ON CONFLICT (key) DO NOTHING;

-- Row-level security
ALTER TABLE app_feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read — TL users are not Supabase Auth users
CREATE POLICY "app_feature_flags_select"
  ON app_feature_flags FOR SELECT
  USING (true);

-- Only HQ / director / developer can insert new flags
CREATE POLICY "app_feature_flags_insert"
  ON app_feature_flags FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
        AND role IN ('hq_staff', 'hq_command_center', 'director', 'developer')
    )
  );

-- Only HQ / director / developer can update flags
CREATE POLICY "app_feature_flags_update"
  ON app_feature_flags FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
        AND role IN ('hq_staff', 'hq_command_center', 'director', 'developer')
    )
  );
