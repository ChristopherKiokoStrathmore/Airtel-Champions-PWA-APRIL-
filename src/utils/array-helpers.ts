/**
 * Array Helper Utilities
 * Safe array operations to prevent .map() and .filter() errors
 */

/**
 * Safely ensures value is an array
 * Prevents "x.map is not a function" errors
 */
export function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}

/**
 * Safe map operation
 * Returns empty array if input is not an array
 */
export function safeMap<T, U>(
  arr: any,
  callback: (item: T, index: number, array: T[]) => U
): U[] {
  const safeArr = ensureArray<T>(arr);
  return safeArr.map(callback);
}

/**
 * Safe filter operation
 * Returns empty array if input is not an array
 */
export function safeFilter<T>(
  arr: any,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  const safeArr = ensureArray<T>(arr);
  return safeArr.filter(predicate);
}

/**
 * Safe find operation
 * Returns undefined if input is not an array
 */
export function safeFind<T>(
  arr: any,
  predicate: (item: T, index: number, array: T[]) => boolean
): T | undefined {
  const safeArr = ensureArray<T>(arr);
  return safeArr.find(predicate);
}

/**
 * Safe length check
 * Returns 0 if input is not an array
 */
export function safeLength(arr: any): number {
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray(value: any): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safely get first item from array
 */
export function safeFirst<T>(arr: any): T | undefined {
  const safeArr = ensureArray<T>(arr);
  return safeArr[0];
}

/**
 * Safely get last item from array
 */
export function safeLast<T>(arr: any): T | undefined {
  const safeArr = ensureArray<T>(arr);
  return safeArr[safeArr.length - 1];
}

/**
 * Safely slice array
 */
export function safeSlice<T>(arr: any, start?: number, end?: number): T[] {
  const safeArr = ensureArray<T>(arr);
  return safeArr.slice(start, end);
}

/**
 * Validate database response has expected array field
 * Normalizes the field to always be an array
 */
export function normalizeArrayField<T extends Record<string, any>>(
  obj: T,
  fieldName: keyof T
): T {
  return {
    ...obj,
    [fieldName]: ensureArray(obj[fieldName]),
  };
}

/**
 * Validate and normalize multiple array fields in an object
 */
export function normalizeArrayFields<T extends Record<string, any>>(
  obj: T,
  fieldNames: (keyof T)[]
): T {
  const normalized = { ...obj };
  fieldNames.forEach(fieldName => {
    normalized[fieldName] = ensureArray(obj[fieldName]) as any;
  });
  return normalized;
}

/**
 * Safely parse JSON array from string
 * Returns empty array on parse error
 */
export function safeJsonParseArray<T>(jsonString: string | null | undefined): T[] {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    return ensureArray<T>(parsed);
  } catch (error) {
    console.error('[ArrayHelpers] JSON parse error:', error);
    return [];
  }
}

/**
 * Validate Supabase query response
 * Ensures data is an array and handles errors
 */
export function validateSupabaseResponse<T>(response: {
  data: T[] | null;
  error: any;
}): T[] {
  if (response.error) {
    console.error('[ArrayHelpers] Supabase error:', response.error);
    return [];
  }
  
  return ensureArray<T>(response.data);
}

/**
 * Chunk array into smaller arrays
 * Safe version that handles non-arrays
 */
export function safeChunk<T>(arr: any, size: number): T[][] {
  const safeArr = ensureArray<T>(arr);
  const chunks: T[][] = [];
  
  for (let i = 0; i < safeArr.length; i += size) {
    chunks.push(safeArr.slice(i, i + size));
  }
  
  return chunks;
}

/**
 * Remove duplicates from array by key
 * Safe version that handles non-arrays
 */
export function safeUnique<T>(arr: any, keyFn?: (item: T) => any): T[] {
  const safeArr = ensureArray<T>(arr);
  
  if (!keyFn) {
    return Array.from(new Set(safeArr));
  }
  
  const seen = new Set();
  return safeArr.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
