-- Fix sales login to resolve users from public.app_users instead of public.users.
-- This makes the verified sales admin row the source of truth for login.

CREATE OR REPLACE FUNCTION se_login(
  input_phone TEXT,
  input_pin TEXT DEFAULT '1234'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_phone TEXT;
  user_record RECORD;
  stored_pin_hash TEXT;
  input_pin_hash TEXT;
BEGIN
  normalized_phone := regexp_replace(input_phone, '[^0-9]', '', 'g');

  IF length(normalized_phone) >= 12 THEN
    normalized_phone := right(normalized_phone, 9);
  ELSIF length(normalized_phone) = 10 THEN
    normalized_phone := right(normalized_phone, 9);
  ELSIF length(normalized_phone) = 9 THEN
    normalized_phone := normalized_phone;
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid phone number format. Please use 9, 10, or 12 digits.'
    );
  END IF;

  SELECT
    id,
    employee_id,
    full_name,
    email,
    phone_number,
    role,
    region,
    zone,
    zsm,
    zbm,
    rank,
    total_points,
    pin_hash
  INTO user_record
  FROM public.app_users
  WHERE
    right(regexp_replace(phone_number, '[^0-9]', '', 'g'), 9) = normalized_phone
    OR phone_number = input_phone
  LIMIT 1;

  IF user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Phone number not found. Please check your number or contact your ZSM.'
    );
  END IF;

  stored_pin_hash := user_record.pin_hash;
  input_pin_hash := encode(input_pin::bytea, 'base64');

  IF stored_pin_hash IS NULL OR stored_pin_hash = '' THEN
    IF input_pin != '1234' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid PIN. Default PIN is 1234. Please update your PIN in settings.'
      );
    END IF;
  ELSIF stored_pin_hash != input_pin_hash THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid PIN. Please try again or contact your ZSM.'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'employee_id', user_record.employee_id,
      'full_name', user_record.full_name,
      'email', user_record.email,
      'phone_number', user_record.phone_number,
      'role', user_record.role,
      'region', user_record.region,
      'zone', user_record.zone,
      'zsm', user_record.zsm,
      'zbm', user_record.zbm,
      'rank', user_record.rank,
      'total_points', user_record.total_points
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Login failed: ' || SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION se_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION se_login(TEXT, TEXT) TO authenticated;
