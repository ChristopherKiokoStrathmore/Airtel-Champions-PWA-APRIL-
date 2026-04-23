// src/components/hbb/hbb-ga-utilities.ts
// HBB GA (Gross Add) Utilities - Phone normalization, band calculation, helpers

/**
 * Normalize phone number to standard format: 0XXXXXXXXX
 * Handles:  "0711111111", "711111111", "254711111111", "+254711111111"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters except leading +
  let normalized = phone.replace(/[^\d]/g, '');
  
  // Handle country code variations
  if (normalized.startsWith('254')) {
    // 254711111111 → 0711111111
    normalized = '0' + normalized.slice(3);
  } else if (!normalized.startsWith('0')) {
    // 711111111 → 0711111111
    normalized = '0' + normalized;
  }
  
  // Keep last 10 digits if longer
  if (normalized.length > 10) {
    normalized = normalized.slice(-10);
  }
  
  // Pad with 0 if needed
  while (normalized.length < 10 && !normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }
  
  return normalized.startsWith('0') ? normalized : '';
}

/**
 * Validate phone format after normalization
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length === 10 && normalized.startsWith('0') && /^\d+$/.test(normalized);
}

/**
 * Get incentive band based on GA count and role type
 */
export function getIncentiveBand(
  gaCount: number,
  roleType: 'dse' | 'dse_tl' | 'installer' | 'installer_tl'
): {
  bandName: string;
  gaRangeMin: number;
  gaRangeMax: number;
  totalBonus: number | null;
} | null {
  const bands: Record<string, Array<{
    bandName: string;
    gaRangeMin: number;
    gaRangeMax: number;
    totalBonus: number | null;
  }>> = {
    dse: [
      { bandName: 'DSE Band 1', gaRangeMin: 1, gaRangeMax: 10, totalBonus: 200 },
      { bandName: 'DSE Band 2', gaRangeMin: 10, gaRangeMax: 20, totalBonus: 450 },
      { bandName: 'DSE Band 3', gaRangeMin: 20, gaRangeMax: 30, totalBonus: null },
      { bandName: 'DSE Band 4', gaRangeMin: 30, gaRangeMax: 100, totalBonus: 10000 },
    ],
    dse_tl: [
      { bandName: 'DSE TL Band 1', gaRangeMin: 1, gaRangeMax: 250, totalBonus: null },
      { bandName: 'DSE TL Band 2', gaRangeMin: 250, gaRangeMax: 350, totalBonus: null },
      { bandName: 'DSE TL Band 3', gaRangeMin: 350, gaRangeMax: 450, totalBonus: null },
      { bandName: 'DSE TL Band 4', gaRangeMin: 450, gaRangeMax: 1000, totalBonus: 10000 },
    ],
    installer: [
      { bandName: 'Installer Band 1', gaRangeMin: 1, gaRangeMax: 20, totalBonus: 200 },
      { bandName: 'Installer Band 2', gaRangeMin: 20, gaRangeMax: 40, totalBonus: 250 },
      { bandName: 'Installer Band 3', gaRangeMin: 40, gaRangeMax: 60, totalBonus: 350 },
      { bandName: 'Installer Band 4', gaRangeMin: 60, gaRangeMax: 150, totalBonus: 450 },
    ],
    installer_tl: [
      { bandName: 'Installer TL Band 1', gaRangeMin: 1, gaRangeMax: 200, totalBonus: 0 },
      { bandName: 'Installer TL Band 2', gaRangeMin: 200, gaRangeMax: 400, totalBonus: 30 },
      { bandName: 'Installer TL Band 3', gaRangeMin: 400, gaRangeMax: 600, totalBonus: 60 },
      { bandName: 'Installer TL Band 4', gaRangeMin: 600, gaRangeMax: 1500, totalBonus: 100 },
    ],
  };
  
  const roleBands = bands[roleType];
  if (!roleBands) return null;
  
  const band = roleBands.find(b => gaCount >= b.gaRangeMin && gaCount < b.gaRangeMax);
  return band || null;
}

/**
 * Calculate progress percentage to next band
 */
export function calculateProgressToNextBand(
  gaCount: number,
  roleType: 'dse' | 'dse_tl' | 'installer' | 'installer_tl'
): { currentMin: number; currentMax: number; percent: number; gasNeeded: number } {
  const currentBand = getIncentiveBand(gaCount, roleType);
  if (!currentBand) {
    return { currentMin: 0, currentMax: 0, percent: 0, gasNeeded: 0 };
  }
  
  const { gaRangeMin, gaRangeMax } = currentBand;
  const rangeSize = gaRangeMax - gaRangeMin;
  const progress = gaCount - gaRangeMin;
  const percent = Math.round((progress / rangeSize) * 100);
  const gasNeeded = gaRangeMax - gaCount;
  
  return { currentMin: gaRangeMin, currentMax: gaRangeMax, percent, gasNeeded };
}

/**
 * Generate current month_year string (e.g., "2026-04")
 */
export function getCurrentMonthYear(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Validation errors for GA upload
 */
export interface GAUploadError {
  row: number;
  phone?: string;
  name?: string;
  issueType: 'phone_format_invalid' | 'person_not_found' | 'duplicate_same_day' | 'name_mismatch';
  severity: 'error' | 'warning';
  message: string;
  suggestedAction?: string;
}

/**
 * GA Report record structure
 */
export interface GAReportRecord {
  phone: string;
  name: string;
  gaCount: number;
  town?: string;
  date?: string;
}

/**
 * Parse GA report from Excel-like data
 */
export function parseGAReport(
  data: any[],
  phoneColumnIndex: number = 0,
  nameColumnIndex: number = 1,
  gaCountColumnIndex: number = 2
): { records: GAReportRecord[]; errors: GAUploadError[] } {
  const records: GAReportRecord[] = [];
  const errors: GAUploadError[] = [];
  const seenToday = new Map<string, number>();
  
  data.forEach((row, rowIndex) => {
    if (!row || typeof row !== 'object') return;
    
    const phone = String(row[phoneColumnIndex] || '').trim();
    const name = String(row[nameColumnIndex] || '').trim();
    const gaCount = parseInt(String(row[gaCountColumnIndex] || '0'), 10);
    
    // Validate phone
    if (!isValidPhone(phone)) {
      errors.push({
        row: rowIndex + 1,
        phone,
        name,
        issueType: 'phone_format_invalid',
        severity: 'error',
        message: `Phone format invalid: ${phone}. Cannot normalize to 0XXXXXXXXX format.`,
        suggestedAction: 'Fix phone number format and reupload',
      });
      return;
    }
    
    const normalized = normalizePhone(phone);
    
    // Check for duplicates same day
    if (seenToday.has(normalized)) {
      seenToday.set(normalized, seenToday.get(normalized)! + gaCount);
      errors.push({
        row: rowIndex + 1,
        phone: normalized,
        name,
        issueType: 'duplicate_same_day',
        severity: 'warning',
        message: `Duplicate entry: ${name} (${normalized}) found. GAs will be summed.`,
        suggestedAction: 'Review and confirm sum',
      });
      return;
    }
    
    seenToday.set(normalized, gaCount);
    records.push({
      phone: normalized,
      name,
      gaCount: gaCount || 0,
      town: String(row[3] || '').trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    });
  });
  
  return { records, errors };
}

/**
 * Format number with commas (e.g., 1000 → "1,000")
 */
export function formatNumber(num: number | null | undefined): string {
  if (!num && num !== 0) return '0';
  return num.toLocaleString();
}

/**
 * Get rank/position among peers
 */
export function getRank(position: number): string {
  switch (position) {
    case 1: return '🥇 1st';
    case 2: return '🥈 2nd';
    case 3: return '🥉 3rd';
    default: return `${position}th`;
  }
}

/**
 * Days elapsed in current month
 */
export function getDaysInMonth(): number {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
}

/**
 * Days remaining in current month
 */
export function getDaysRemainingInMonth(): number {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Math.max(0, lastDay - today.getDate());
}

// ═════════════════════════════════════════════════════════════════════════════
// ADDITIONAL DASHBOARD UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Format currency to KES format with abbreviation
 */
export function formatCurrency(amount: number): string {
  if (!amount && amount !== 0) return 'KES 0';
  if (amount >= 1000000) {
    return `KES ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `KES ${(amount / 1000).toFixed(1)}K`;
  }
  return `KES ${Math.round(amount)}`;
}

/**
 * Format month year from YYYY-MM to readable format
 */
export function formatMonthYear(monthYear: string): string {
  try {
    const [year, month] = monthYear.split('-');
    const date = new Date(`${monthYear}-01`);
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    return `${monthName} ${year}`;
  } catch {
    return monthYear;
  }
}

/**
 * Get performance category/tier based on GA count
 */
export function getPerformanceCategory(gaCount: number): string {
  if (gaCount >= 20) return 'Excellent';
  if (gaCount >= 15) return 'Very Good';
  if (gaCount >= 10) return 'Good';
  if (gaCount >= 5) return 'Satisfactory';
  return 'Needs Improvement';
}

/**
 * Get performance color based on GA count
 */
export function getPerformanceColor(gaCount: number): string {
  if (gaCount >= 20) return 'text-green-600';
  if (gaCount >= 15) return 'text-blue-600';
  if (gaCount >= 10) return 'text-yellow-600';
  if (gaCount >= 5) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get band color for UI display
 */
export function getBandColor(bandName: string): string {
  if (bandName.includes('Band 5')) return 'bg-green-100 text-green-800';
  if (bandName.includes('Band 4')) return 'bg-blue-100 text-blue-800';
  if (bandName.includes('Band 3')) return 'bg-yellow-100 text-yellow-800';
  if (bandName.includes('Band 2')) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * Calculate total GAs from array of objects
 */
export function calculateTotalGAs(items: any[]): number {
  return items.reduce((sum, item) => sum + (item.ga_count || 0), 0);
}

/**
 * Calculate total incentive
 */
export function calculateTotalIncentive(items: any[]): number {
  return items.reduce((sum, item) => sum + (item.incentive_earned || 0), 0);
}

/**
 * Calculate average GAs per person
 */
export function calculateAverageGAs(items: any[]): number {
  if (!items || items.length === 0) return 0;
  return calculateTotalGAs(items) / items.length;
}

/**
 * Get top performer from list
 */
export function getTopPerformer<T extends { ga_count?: number }>(items: T[]): T | null {
  if (!items || items.length === 0) return null;
  return items.reduce((top, current) =>
    (current.ga_count || 0) > (top.ga_count || 0) ? current : top
  );
}

/**
 * Get lowest performer from list
 */
export function getLowestPerformer<T extends { ga_count?: number }>(items: T[]): T | null {
  if (!items || items.length === 0) return null;
  return items.reduce((lowest, current) =>
    (current.ga_count || 0) < (lowest.ga_count || 0) ? current : lowest
  );
}

/**
 * Get GA distribution buckets
 */
export function calculateGADistribution(items: any[]): Array<{ range: string; count: number }> {
  return [
    { range: '0-4 GAs', count: items.filter(i => (i.ga_count || 0) < 5).length },
    { range: '5-9 GAs', count: items.filter(i => (i.ga_count || 0) >= 5 && (i.ga_count || 0) < 10).length },
    { range: '10-14 GAs', count: items.filter(i => (i.ga_count || 0) >= 10 && (i.ga_count || 0) < 15).length },
    { range: '15-19 GAs', count: items.filter(i => (i.ga_count || 0) >= 15 && (i.ga_count || 0) < 20).length },
    { range: '20+ GAs', count: items.filter(i => (i.ga_count || 0) >= 20).length },
  ];
}

/**
 * Compare two months performance
 */
export function comparePerformance(
  currentMonth: number,
  previousMonth: number
): { change: number; percentChange: number; trend: 'up' | 'down' | 'flat' } {
  const change = currentMonth - previousMonth;
  const percentChange = previousMonth !== 0 ? ((change / previousMonth) * 100) : 0;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  return { change, percentChange, trend };
}

/**
 * Get trend emoji
 */
export function getTrendEmoji(trend: 'up' | 'down' | 'flat'): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    case 'flat':
      return '➡️';
  }
}

/**
 * Validate GA count
 */
export function validateGACount(gaCount: any): boolean {
  return Number.isInteger(gaCount) && gaCount >= 0;
}

/**
 * Validate incentive amount
 */
export function validateIncentiveAmount(amount: any): boolean {
  return typeof amount === 'number' && amount >= 0;
}
