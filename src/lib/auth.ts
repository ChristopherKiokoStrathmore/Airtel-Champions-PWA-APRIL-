import { supabase } from './supabase';

// ============================================================================
// AUTHENTICATION & OTP FUNCTIONS
// ============================================================================

/**
 * Send OTP to phone number via SMS
 */
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone, role, full_name')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Phone number not found' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        user_id: user.id,
        phone: normalizedPhone,
        code: otp,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (otpError) {
      console.error('Error storing OTP:', otpError);
      return { success: false, error: 'Failed to generate OTP' };
    }

    // In production, send SMS via Africa's Talking or other provider
    // For now, log to console
    console.log('📱 OTP CODE FOR', normalizedPhone, ':', otp);
    console.log('   User:', user.full_name);
    console.log('   Role:', user.role);
    console.log('   Expires:', expiresAt.toLocaleTimeString());

    return { success: true };
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, phone, role, email, region, team')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return { success: true, user };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
}

/**
 * Login with PIN (legacy method)
 */
export async function loginWithPIN(
  phone: string,
  pin: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, phone, role, email, region, team, pin_hash')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Invalid phone number or PIN' };
    }

    // Verify PIN using database function
    const { data: pinValid, error: pinError } = await supabase
      .rpc('verify_pin', {
        user_phone: normalizedPhone,
        user_pin: pin,
      });

    if (pinError || !pinValid) {
      return { success: false, error: 'Invalid phone number or PIN' };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return { success: true, user };
  } catch (error: any) {
    console.error('PIN login error:', error);
    return { success: false, error: error.message || 'Login failed' };
  }
}

/**
 * Send forgot PIN OTP
 */
export async function sendForgotPinOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone, full_name')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Phone number not found' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store OTP
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        user_id: user.id,
        phone: normalizedPhone,
        code: otp,
        expires_at: expiresAt.toISOString(),
        used: false,
        purpose: 'forgot_pin',
      });

    if (otpError) {
      console.error('Error storing forgot PIN OTP:', otpError);
      return { success: false, error: 'Failed to generate OTP' };
    }

    console.log('🔐 FORGOT PIN OTP FOR', normalizedPhone, ':', otp);
    console.log('   User:', user.full_name);
    console.log('   Expires:', expiresAt.toLocaleTimeString());

    return { success: true };
  } catch (error: any) {
    console.error('Send forgot PIN OTP error:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

/**
 * Reset PIN with OTP verification
 */
export async function resetPIN(
  phone: string,
  otp: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);

    // Verify OTP
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Check OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('code', otp)
      .eq('used', false)
      .eq('purpose', 'forgot_pin')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return { success: false, error: 'Invalid or expired OTP code' };
    }

    // Update PIN using database function
    const { error: updateError } = await supabase.rpc('update_user_pin', {
      user_phone: normalizedPhone,
      new_pin: newPin,
    });

    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return { success: false, error: 'Failed to update PIN' };
    }

    // Mark OTP as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpData.id);

    return { success: true };
  } catch (error: any) {
    console.error('Reset PIN error:', error);
    return { success: false, error: error.message || 'Failed to reset PIN' };
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'zsm' || role === 'asm';
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(role: string): boolean {
  return isAdmin(role);
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.trim().replace(/\s+/g, '');

  // Remove any non-digit characters except +
  normalized = normalized.replace(/[^\d+]/g, '');

  // Add +254 if starts with 0
  if (normalized.startsWith('0')) {
    normalized = '+254' + normalized.substring(1);
  }
  // Add +254 if doesn't start with +
  else if (!normalized.startsWith('+')) {
    normalized = '+254' + normalized;
  }

  return normalized;
}
