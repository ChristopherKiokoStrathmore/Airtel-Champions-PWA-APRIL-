-- ================================================================
-- 014_shujaa_add_customer.sql
-- RPC to atomically verify an OTP and add a customer for a Shujaa
-- ================================================================

CREATE OR REPLACE FUNCTION shujaa_add_customer(
  p_shujaa_id UUID,
  p_msisdn    TEXT,
  p_code      TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp RECORD;
  v_customer RECORD;
  v_normalized TEXT := p_msisdn;
BEGIN
  -- Find matching OTP
  SELECT * INTO v_otp
  FROM otp_codes
  WHERE phone = v_normalized
    AND code = p_code
    AND purpose = 'shujaa_add_customer'
    AND used = FALSE
    AND expires_at >= NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'OTP_INVALID_OR_EXPIRED';
  END IF;

  -- Mark OTP used
  UPDATE otp_codes SET used = TRUE WHERE id = v_otp.id;

  -- Prevent duplicate customer
  IF EXISTS (SELECT 1 FROM shujaa_customers WHERE msisdn = v_normalized) THEN
    RAISE EXCEPTION 'CUSTOMER_ALREADY_EXISTS';
  END IF;

  -- Insert customer
  INSERT INTO shujaa_customers (shujaa_id, msisdn, customer_name, added_at)
  VALUES (p_shujaa_id, v_normalized, '', NOW())
  RETURNING * INTO v_customer;

  RETURN row_to_json(v_customer);
END;
$$;
