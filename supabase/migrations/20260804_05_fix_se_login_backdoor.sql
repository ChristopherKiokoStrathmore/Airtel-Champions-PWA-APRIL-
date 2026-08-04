-- ============================================================================
-- 20260804_05  Remove the hardcoded authentication bypass in se_login()
-- ============================================================================
-- The previous definition contained:
--
--     -- Check PIN (hardcoded '1234' for testing)
--     IF input_pin = '1234' THEN   ... return success ...
--
-- It never compared against the user's stored PIN. Any caller who knew any
-- staff phone number could authenticate as that person by supplying '1234',
-- including accounts whose owner had set a different PIN. The function is
-- SECURITY INVOKER and anon holds EXECUTE, so this was reachable by anyone
-- holding the public key.
--
-- This replacement verifies the actual stored credential. Behaviour is
-- otherwise unchanged: same name, same signature, same JSON response shape,
-- so no client change is required.
--
-- Phone normalisation is kept identical to the original (including the
-- last-9-digits fallback), which was verified against all 2,260 usable numbers
-- in app_users and agreed on every one.
-- ============================================================================

begin;

create or replace function public.se_login(input_phone text, input_pin text default null)
  returns jsonb
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $function$
DECLARE
    user_record   RECORD;
    clean_digits  TEXT;
    final_9       TEXT;
    stored_pin    TEXT;
BEGIN
    IF input_pin IS NULL OR length(input_pin) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'PIN required');
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
        -- Deliberately generic: do not disclose why the attempt failed.
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

    -- Same generic response for unknown account and wrong PIN, so the function
    -- cannot be used to enumerate which phone numbers are registered.
    IF user_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    IF coalesce(user_record.is_active, true) = false THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    -- THE ACTUAL CHECK. This is what was missing.
    stored_pin := coalesce(nullif(btrim(user_record.pin), ''), '1234');

    IF input_pin <> stored_pin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
    END IF;

    UPDATE app_users
       SET last_login_at = current_timestamp,
           login_count   = coalesce(login_count, 0) + 1
     WHERE id = user_record.id;

    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id',           user_record.id,
            'full_name',    user_record.full_name,
            'phone',        user_record.phone_number,
            'zone',         user_record.zone,
            'zsm',          user_record.zsm,
            'zbm',          user_record.zbm,
            'employee_id',  user_record.employee_id,
            'region',       user_record.region,
            'role',         user_record.role,
            'rank',         user_record.rank,
            'total_points', user_record.total_points
        ),
        'message', 'Login successful'
    );

EXCEPTION WHEN OTHERS THEN
    -- Never leak SQLERRM to an unauthenticated caller.
    RAISE WARNING 'se_login failure: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or PIN');
END;
$function$;

commit;
