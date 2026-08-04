-- ============================================================================
-- 20260804_06  Encrypted retention columns + handle-based se_login response
-- ============================================================================
-- Requirement: names and numbers must not be readable in the database, but
-- nothing may be deleted.
--
-- Approach: the original value is encrypted (AES-256-GCM, key derived from the
-- external PRIVACY_PEPPER) into a *_ct column, and the visible column is then
-- overwritten with an HMAC digest. The plaintext is therefore retained and
-- recoverable, but only by a party holding the pepper - which is not in the
-- database.
--
-- No rows and no columns are dropped by this migration.
--
-- It also updates se_login() to return the pseudonymous handle in place of
-- full_name, so the currently deployed frontend keeps rendering something
-- sensible after the name column is digested.
-- ============================================================================

begin;

alter table public.app_users
  add column if not exists full_name_ct    text,
  add column if not exists email_ct        text,
  add column if not exists zbm_ct          text,
  add column if not exists phone_number_ct text,
  add column if not exists pii_sealed_at   timestamptz;

comment on column public.app_users.full_name_ct is
  'AES-256-GCM ciphertext of the original full_name. Key derived from PRIVACY_PEPPER, which is not stored in this database.';
comment on column public.app_users.email_ct is
  'AES-256-GCM ciphertext of the original email.';
comment on column public.app_users.zbm_ct is
  'AES-256-GCM ciphertext of the original zbm value (held manager names).';
comment on column public.app_users.phone_number_ct is
  'AES-256-GCM ciphertext of the original phone_number.';
comment on column public.app_users.pii_sealed_at is
  'When the visible identifier columns were replaced with digests.';

-- --------------------------------------------------------------------------
-- se_login: return the pseudonymous handle instead of the personal name.
--
-- The live frontend reads user.full_name for display. Once full_name holds a
-- digest, returning it verbatim would show a hex string in the UI. Returning
-- the handle keeps the app coherent and returns no personal data.
--
-- Phone lookup still uses app_users.phone_number, so this function keeps
-- working until the frontend cut-over is deployed. At that point the Edge
-- Function becomes the only login path and this can be retired.
-- --------------------------------------------------------------------------
create or replace function public.se_login(input_phone text, input_pin text default null)
  returns jsonb
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $function$
DECLARE
    user_record  RECORD;
    clean_digits TEXT;
    final_9      TEXT;
    stored_pin   TEXT;
    display      TEXT;
BEGIN
    IF input_pin IS NULL OR length(input_pin) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    clean_digits := regexp_replace(coalesce(input_phone, ''), '[^0-9]', '', 'g');

    IF clean_digits LIKE '254%' AND length(clean_digits) = 12 THEN
        final_9 := substring(clean_digits FROM 4);
    ELSIF clean_digits LIKE '07%' AND length(clean_digits) = 10 THEN
        final_9 := substring(clean_digits FROM 3);
    ELSIF length(clean_digits) = 9 THEN
        final_9 := clean_digits;
    ELSE
        final_9 := right(clean_digits, 9);
    END IF;

    IF length(final_9) <> 9 OR final_9 !~ '^[0-9]+$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    SELECT * INTO user_record
    FROM app_users
    WHERE phone_number = final_9
       OR phone_number = '0' || final_9
       OR phone_number = '254' || final_9
       OR phone_number = '+254' || final_9
    ORDER BY (last_login_at IS NOT NULL) DESC, login_count DESC NULLS LAST
    LIMIT 1;

    IF user_record.id IS NULL OR coalesce(user_record.is_active, true) = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    stored_pin := coalesce(nullif(btrim(user_record.pin), ''), '1234');
    IF input_pin <> stored_pin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    UPDATE app_users
       SET last_login_at = current_timestamp,
           login_count   = coalesce(login_count, 0) + 1
     WHERE id = user_record.id;

    -- Pseudonymous handle in place of the personal name.
    SELECT i.handle INTO display
    FROM identities i
    JOIN identity_app_user_map m
      ON m.identity_id = i.id AND m.is_authoritative
    WHERE m.app_user_id = user_record.id
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id',           user_record.id,
            'full_name',    coalesce(display, 'USER'),
            'handle',       coalesce(display, 'USER'),
            'phone',        null,
            'zone',         user_record.zone,
            'zsm',          user_record.zsm,
            'zbm',          null,
            'employee_id',  user_record.employee_id,
            'region',       user_record.region,
            'role',         user_record.role,
            'rank',         user_record.rank,
            'total_points', user_record.total_points
        ),
        'message', 'Login successful'
    );

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'se_login failure: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
END;
$function$;

commit;
