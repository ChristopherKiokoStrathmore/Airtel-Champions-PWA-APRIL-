-- ============================================================================
-- OTP AUTHENTICATION SYSTEM
-- ============================================================================
-- This migration adds OTP support for login and forgot PIN functionality
-- Execute this in your Supabase SQL Editor
-- ============================================================================

-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT DEFAULT 'login' CHECK (purpose IN ('login', 'forgot_pin')),
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT otp_code_length CHECK (length(code) = 6)
);

-- Add index for fast OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Add last_login column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM otp_codes 
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- Function to update user PIN (for forgot PIN feature)
CREATE OR REPLACE FUNCTION update_user_pin(
  user_phone TEXT,
  new_pin TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET pin_hash = crypt(new_pin, gen_salt('bf'))
  WHERE phone = user_phone;
  
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT ALL ON otp_codes TO authenticated;
GRANT ALL ON otp_codes TO anon;

-- Enable RLS on otp_codes
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own OTPs
CREATE POLICY "Users can view own OTPs"
  ON otp_codes FOR SELECT
  USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- Policy: Anyone can insert OTPs (for registration/login)
CREATE POLICY "Anyone can insert OTPs"
  ON otp_codes FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own OTPs
CREATE POLICY "Users can update own OTPs"
  ON otp_codes FOR UPDATE
  USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- ============================================================================
-- ROLE-BASED ACCESS CONTROL
-- ============================================================================

-- Add admin_access column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_access BOOLEAN DEFAULT false;

-- Update existing users to grant admin access based on role
UPDATE users 
SET admin_access = true 
WHERE role IN ('admin', 'zsm', 'asm', 'rsm');

-- Update SEs to not have admin access
UPDATE users 
SET admin_access = false 
WHERE role = 'se';

-- Create function to check admin access
CREATE OR REPLACE FUNCTION has_admin_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT admin_access INTO has_access
  FROM users
  WHERE id = user_id;
  
  RETURN COALESCE(has_access, false);
END;
$$;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Clean up any existing test OTPs
DELETE FROM otp_codes WHERE phone LIKE '+2547%';

-- Note: In production, OTPs are generated dynamically
-- The console will show: "📱 OTP CODE FOR +254700000001 : 123456"

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables exist
SELECT 
  'otp_codes table exists' as check_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'otp_codes'
  ) as result;

-- Check if functions exist
SELECT 
  'update_user_pin function exists' as check_name,
  EXISTS (
    SELECT FROM pg_proc WHERE proname = 'update_user_pin'
  ) as result;

-- Check admin access settings
SELECT 
  role,
  admin_access,
  COUNT(*) as count
FROM users
GROUP BY role, admin_access
ORDER BY role;

-- ============================================================================
-- CLEANUP (run this to reset OTP system)
-- ============================================================================

/*
-- Uncomment to reset OTP system
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS update_user_pin(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS has_admin_access(UUID) CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS admin_access;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
*/
