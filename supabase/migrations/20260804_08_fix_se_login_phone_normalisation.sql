-- ============================================================================
-- 20260804_08  Fix phone normalisation in se_login()
-- ============================================================================
-- The original function carried this branch, and 20260804_05 preserved it:
--
--     ELSIF clean_digits LIKE '07%' AND length(clean_digits) = 10 THEN
--         final_9 := substring(clean_digits FROM 3);   -- "remove '07' prefix"
--
-- Kenyan MSISDNs are a leading 0 followed by a 9-digit subscriber number, so
-- only the '0' should be removed. Stripping '07' drops a significant digit:
--
--     0733584848  ->  33584848   (8 digits)   WRONG
--     0733584848  ->  733584848  (9 digits)   correct
--
-- Every 10-digit 07... number therefore failed to match and se_login returned
-- "Invalid phone number or PIN" for a correct PIN. Logins still succeeded only
-- because the client falls back to a direct app_users query - which is the path
-- being removed, so this had to be fixed before the fallback goes away.
--
-- Verified against all 2,260 usable numbers: taking the last 9 digits agrees
-- with every number that already parses, and disagrees with none.
-- ============================================================================

begin;

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

    -- Reduce to the 9-digit subscriber number.
    IF clean_digits LIKE '254%' AND length(clean_digits) = 12 THEN
        final_9 := substring(clean_digits FROM 4);          -- drop '254'
    ELSIF clean_digits LIKE '0%' AND length(clean_digits) = 10 THEN
        final_9 := substring(clean_digits FROM 2);          -- drop the leading '0' only
    ELSIF length(clean_digits) = 9 THEN
        final_9 := clean_digits;
    ELSE
        final_9 := right(clean_digits, 9);
    END IF;

    -- Must be 9 digits starting 7 or 1 to be a valid Kenyan mobile number.
    IF length(final_9) <> 9 OR final_9 !~ '^[71][0-9]{8}$' THEN
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
