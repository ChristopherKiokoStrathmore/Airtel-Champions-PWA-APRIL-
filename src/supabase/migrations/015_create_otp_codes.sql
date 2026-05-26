-- ================================================================
-- 015_create_otp_codes.sql
-- Create otp_codes table used by OTP flows
-- ================================================================

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT DEFAULT 'login',
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
