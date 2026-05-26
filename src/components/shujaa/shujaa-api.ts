import { supabase } from '../../utils/supabase/client';

export interface ShujaaUser {
  id: string;
  full_name: string;
  msisdn: string;
  zone: string;
  se_cluster: string;
  is_active: boolean;
  created_at: string;
}

export interface ShujaaCustomer {
  id: string;
  shujaa_id: string;
  msisdn: string;
  customer_name?: string;
  added_at: string;
}

const SESSION_KEY = 'tai_shujaa_user';

function normalisePhone(raw: string): string {
  let value = raw.trim().replace(/[\s\-\(\)]/g, '');
  if (value.startsWith('+254')) value = value.substring(4);
  else if (value.startsWith('254')) value = value.substring(3);
  else if (value.startsWith('0')) value = value.substring(1);
  return value;
}

function phoneFormats(normalised: string): string[] {
  return [
    normalised,
    `0${normalised}`,
    `+254${normalised}`,
    `254${normalised}`,
  ];
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function saveShujaaSession(user: ShujaaUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getShujaaSession(): ShujaaUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShujaaUser;
  } catch { return null; }
}

export function clearShujaaSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function shujaaSignup(
  fullName: string,
  msisdn: string,
  zone = '',
  seCluster = '',
  password = '1234',
): Promise<{ user: ShujaaUser | null; error: string | null }> {
  const normalizedPhone = normalisePhone(msisdn);
  const loginFormats = phoneFormats(normalizedPhone);

  const { data, error } = await supabase.rpc('shujaa_signup', {
    p_full_name: fullName,
    p_msisdn: digitsOnly(loginFormats[0]),
    p_zone: zone,
    p_se_cluster: seCluster,
    p_password: password,
  });

  if (error) {
    if (error.message.includes('MSISDN_EXISTS')) {
      return { user: null, error: 'An account with this phone number already exists.' };
    }
    return { user: null, error: 'Sign up failed. Please try again.' };
  }

  return { user: data as ShujaaUser, error: null };
}

export async function shujaaLogin(
  msisdn: string,
  password: string,
): Promise<{ user: ShujaaUser | null; error: string | null }> {
  const normalizedPhone = normalisePhone(msisdn);
  const candidates = phoneFormats(normalizedPhone);
  let lastError: string | null = null;

  console.log('[ShujaaAPI] Login attempt for:', msisdn, 'normalized:', normalizedPhone, 'candidates:', candidates);

  for (const candidate of candidates) {
    const { data, error } = await supabase.rpc('shujaa_login', {
      p_msisdn: candidate,
      p_password: password,
    });

    if (error) {
      console.warn('[ShujaaAPI] shujaa_login RPC error for candidate:', candidate, error.message);
      lastError = error.message || 'Login failed. Please try again.';
      continue;
    }

    if (!data) {
      lastError = 'Incorrect phone number or PIN.';
      continue;
    }

    console.log('[ShujaaAPI] Login matched phone format:', candidate);
    return { user: data as ShujaaUser, error: null };
  }

  return { user: null, error: lastError ?? 'Incorrect phone number or PIN.' };
}

export async function getActiveCustomers(shujaaId: string): Promise<ShujaaCustomer[]> {
  const { data, error } = await supabase
    .from('shujaa_customers')
    .select('*')
    .eq('shujaa_id', shujaaId)
    .order('added_at', { ascending: true });

  if (error || !data) return [] as ShujaaCustomer[];
  return data as ShujaaCustomer[];
}

export async function addCustomerDirect(
  shujaaId: string,
  msisdn: string,
  customerName = '',
): Promise<{ customer: ShujaaCustomer | null; error: string | null }> {
  const normalized = msisdn.replace(/\D/g, '');
  try {
    const { data, error } = await supabase
      .from('shujaa_customers')
      .insert({ shujaa_id: shujaaId, msisdn: normalized, customer_name: customerName, added_at: new Date().toISOString() })
      .select('*')
      .single();

    if (error) {
      if ((error.message || '').toLowerCase().includes('duplicate')) {
        return { customer: null, error: 'This customer number is already registered.' };
      }
      return { customer: null, error: 'Could not add customer. Please try again.' };
    }

    return { customer: data as ShujaaCustomer, error: null };
  } catch (err: any) {
    return { customer: null, error: err.message || 'Could not add customer.' };
  }
}

export async function sendCustomerOTP(msisdn: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = digitsOnly(normalisePhone(msisdn));
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error } = await supabase
      .from('otp_codes')
      .insert({ phone: normalized, code: otp, expires_at: expiresAt.toISOString(), used: false, purpose: 'shujaa_add_customer' });

    if (error) {
      console.error('Error storing Shujaa OTP:', error);
      return { success: false, error: 'Failed to generate OTP' };
    }

    console.log('📱 SHUJAA OTP FOR', normalized, ':', otp);
    return { success: true };
  } catch (err: any) {
    console.error('SendCustomerOTP error:', err);
    return { success: false, error: err.message || 'Failed to send OTP' };
  }
}

export async function verifyCustomerOTPAndAdd(
  shujaaId: string,
  customerMsisdn: string,
  code: string,
  customerName = '',
): Promise<{ customer: ShujaaCustomer | null; error: string | null }> {
  try {
    const normalized = digitsOnly(normalisePhone(customerMsisdn));

    // Use server-side RPC to atomically verify OTP and insert customer
    const { data, error } = await supabase.rpc('shujaa_add_customer', {
      p_shujaa_id: shujaaId,
      p_msisdn: normalized,
      p_code: code,
    });

    if (error) {
      if (error.message.includes('OTP_INVALID') || error.message.includes('EXCEPTION: OTP_INVALID')) {
        return { customer: null, error: 'Invalid or expired OTP code' };
      }
      if (error.message.includes('CUSTOMER_ALREADY_EXISTS')) {
        return { customer: null, error: 'This customer number is already registered.' };
      }
      return { customer: null, error: 'Failed to verify OTP and add customer' };
    }

    return { customer: data as ShujaaCustomer, error: null };
  } catch (err: any) {
    console.error('verifyCustomerOTPAndAdd error:', err);
    return { customer: null, error: err.message || 'Failed to verify OTP' };
  }
}
