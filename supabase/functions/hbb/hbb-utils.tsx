// HBB Utility Functions - Shared across all HBB server routes
// Phone normalization, validation, sanitization, SR number generation, rate limiting

// Rate limiting store (in production, use Redis or KV store)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting check
export async function checkRateLimit(clientIP: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; resetTime?: number }> {
  const now = Date.now();
  const key = clientIP;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, resetTime: record.resetTime };
}

// Phone normalization - Canonical format: 0XXXXXXXXX (10 digits, starts with 0)
export function normalizeKenyanPhone(phone: string | number): string {
  const str = String(phone).replace(/[\s\-\(\)\+]/g, '');
  const match = str.match(/(\d{9})$/);
  if (!match) return str;
  return '0' + match[1];
}

// Validate Kenyan mobile number
export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  return /^0[17]\d{8}$/.test(normalized);
}

// Generate phone format variants for DB lookup
export function phoneFormats(phone: string | number): { text: string[]; numeric: number[] } {
  const norm = normalizeKenyanPhone(phone);
  const last9 = norm.slice(-9);
  return {
    text: [last9, '0' + last9, '+254' + last9, '254' + last9],
    numeric: [Number(last9), Number('254' + last9)].filter(n => !isNaN(n) && n > 0),
  };
}

// SR number generation: HBB-YYMMDD-XXXX
export function generateSRNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HBB-${yy}${mm}${dd}-${suffix}`;
}

// Input sanitization
export function sanitizeString(str: string | undefined | null, maxLength = 500): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, maxLength)
    .trim();
}

// Object sanitization
export function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Service request validation
export function validateServiceRequest(body: any): { valid: boolean; error?: string } {
  const required = ['customer_name', 'customer_phone', 'package'];
  
  for (const field of required) {
    if (!body[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  if (!isValidKenyanPhone(body.customer_phone)) {
    return { valid: false, error: 'Invalid Kenyan phone number' };
  }
  
  if (body.customer_name.length < 2) {
    return { valid: false, error: 'Customer name must be at least 2 characters' };
  }
  
  return { valid: true };
}

// Duplicate check
export async function checkDuplicate(phone: string, name: string): Promise<{ isDuplicate: boolean }> {
  // In production, implement actual duplicate checking logic
  // For now, return false (no duplicates)
  return { isDuplicate: false };
}

// Session management
export function createSession(userId: string): string {
  // In production, implement proper session management
  return `session_${userId}_${Date.now()}`;
}

export function validateSession(sessionId: string): boolean {
  // In production, implement proper session validation
  return sessionId.startsWith('session_');
}

export function destroySession(sessionId: string): void {
  // In production, implement proper session destruction
}

// Get Kenya today's date
export function getKenyaToday(): Date {
  const now = new Date();
  // Kenya is UTC+3
  const kenyaTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return kenyaTime;
}
