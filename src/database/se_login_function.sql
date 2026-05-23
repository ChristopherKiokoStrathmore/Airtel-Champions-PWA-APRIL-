-- =====================================================
-- UNIVERSAL LOGIN FUNCTION FOR TAI APP
-- =====================================================
-- This function handles all phone number formats and PIN authentication
-- Works for all roles: SE, ZSM, ZBM, HQ, Director

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
  -- =====================================================
  -- STEP 1: Normalize phone number to 9-digit format
  -- =====================================================
  -- Remove all spaces, dashes, parentheses, plus signs
  normalized_phone := regexp_replace(input_phone, '[^0-9]', '', 'g');
  
  -- Convert to 9-digit format (last 9 digits)
  -- Handles: 789274454, 0789274454, 254789274454, +254789274454
  IF length(normalized_phone) >= 12 THEN
    -- Format: 254789274454 (12 digits) -> 789274454
    normalized_phone := right(normalized_phone, 9);
  ELSIF length(normalized_phone) = 10 THEN
    -- Format: 0789274454 (10 digits) -> 789274454
    normalized_phone := right(normalized_phone, 9);
  ELSIF length(normalized_phone) = 9 THEN
    -- Format: 789274454 (9 digits) -> keep as is
    normalized_phone := normalized_phone;
  ELSE
    -- Invalid format
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid phone number format. Please use 9, 10, or 12 digits.'
    );
  END IF;

  -- =====================================================
  -- STEP 2: Find user by normalized phone number
  -- =====================================================
  -- Check all phone number columns (phone_number can be in any format)
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
  FROM public.users
  WHERE 
    -- Match against 9-digit format
    right(regexp_replace(phone_number, '[^0-9]', '', 'g'), 9) = normalized_phone
    -- Or match exact phone number (for legacy data)
    OR phone_number = input_phone
  LIMIT 1;

  -- If user not found
  IF user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Phone number not found. Please check your number or contact your ZSM.'
    );
  END IF;

  -- =====================================================
  -- STEP 3: Verify PIN
  -- =====================================================
  -- Get stored PIN hash
  stored_pin_hash := user_record.pin_hash;
  
  -- Hash the input PIN (using base64 encoding for simplicity)
  -- In production, use proper bcrypt hashing
  input_pin_hash := encode(input_pin::bytea, 'base64');

  -- Verify PIN
  IF stored_pin_hash IS NULL OR stored_pin_hash = '' THEN
    -- No PIN set, use default 1234
    IF input_pin != '1234' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid PIN. Default PIN is 1234. Please update your PIN in settings.'
      );
    END IF;
  ELSIF stored_pin_hash != input_pin_hash THEN
    -- PIN mismatch
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid PIN. Please try again or contact your ZSM.'
    );
  END IF;

  -- =====================================================
  -- STEP 4: Return success with user data
  -- =====================================================
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

-- =====================================================
-- GRANT EXECUTE PERMISSION
-- =====================================================
-- Allow anonymous users to call this function
GRANT EXECUTE ON FUNCTION se_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION se_login(TEXT, TEXT) TO authenticated;

-- =====================================================
-- TEST THE FUNCTION
-- =====================================================
-- Test with 9-digit format
SELECT se_login('789274454', '1234');

-- Test with 07 format
SELECT se_login('0789274454', '1234');

-- Test with 254 format
SELECT se_login('254789274454', '1234');

-- Test with +254 format
SELECT se_login('+254789274454', '1234');

-- Test with spaces
SELECT se_login('254 789 274 454', '1234');

-- Test with dashes
SELECT se_login('07-789-274-454', '1234');

-- Test without PIN (defaults to 1234)
SELECT se_login('789274454');

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION se_login(TEXT, TEXT) IS 
'Universal login function for TAI app. Accepts phone number in any format (9-digit, 07, 254, +254, with spaces/dashes) and PIN. Returns JSON with success status and user data.';
