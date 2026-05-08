/**
 * CSV/TSV Parser for Sales Force Contacts File
 * 
 * Expected columns (case-insensitive):
 * - TSESE NAME (or similar) → SE name
 * - SE MSISDNS → SE phone
 * - ZSM NAME → ZSM name  
 * - ZSM MSISDNS → ZSM phone
 * - ZBM NAME → ZBM name
 * - ZBM MSISDNS → ZBM phone
 * - ZONE → Zone name
 */

export interface ContactRow {
  se_name?: string;
  se_territory?: string;
  se_phone?: string;
  zsm_name?: string;
  zsm_territory?: string;
  zsm_phone?: string;
  zbm_name?: string;
  zbm_phone?: string;
  zone?: string;
  _raw?: Record<string, string>;
}

export interface ParseResult {
  success: boolean;
  headers: string[];
  rows: ContactRow[];
  columnMapping: Record<string, string | null>;
  warnings: string[];
}

// Normalize phone numbers to standard format
export function normalizePhone(phone: string | undefined): string {
  if (!phone) return '';
  
  let normalized = phone.toString().trim();
  // Remove all non-digits except +
  normalized = normalized.replace(/[^\d+]/g, '');
  // Remove leading +
  normalized = normalized.replace(/^\+/, '');
  
  // Handle different prefixes
  if (normalized.startsWith('254')) {
    // Already has country code
    return normalized;
  } else if (normalized.startsWith('0')) {
    // Kenyan format 0XXX - convert to 254XXX
    return '254' + normalized.substring(1);
  } else if (normalized.length === 9) {
    // Assume Kenyan number without prefix
    return '254' + normalized;
  }
  
  return normalized;
}

function splitRow(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim().replace(/^"|"$/g, ''));
  return fields;
}

function scoreHeaderRow(line: string, delimiter: string): number {
  const headers = splitRow(line, delimiter).map(header => header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
  const joined = headers.join(' | ');

  const expectedTokens = ['tse', 'tsese', 'se', 'zsm', 'zbm', 'msisdn', 'zone'];
  let score = 0;

  for (const token of expectedTokens) {
    if (joined.includes(token)) score += 1;
  }

  if (headers.length >= 4) score += 1;
  if (headers.length >= 6) score += 1;

  return score;
}

function findHeaderRow(lines: string[]): { index: number; delimiter: string } {
  const candidateDelimiters = ['\t', ',', ';', '|'];
  const searchLimit = Math.min(lines.length, 10);

  let best = { index: 0, delimiter: candidateDelimiters[0], score: -1 };

  for (let lineIndex = 0; lineIndex < searchLimit; lineIndex++) {
    const line = lines[lineIndex];
    for (const delimiter of candidateDelimiters) {
      const score = scoreHeaderRow(line, delimiter);
      if (score > best.score) {
        best = { index: lineIndex, delimiter, score };
      }
    }
  }

  return { index: best.index, delimiter: best.delimiter };
}

// Detect column mapping from headers
function detectColumnMapping(headers: string[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {
    se_name: null,
    se_territory: null,
    se_phone: null,
    zsm_name: null,
    zsm_territory: null,
    zsm_phone: null,
    zbm_name: null,
    zbm_phone: null,
    zone: null,
  };

  // Normalize header (remove non-alphanumeric, collapse whitespace)
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const normalizedHeaders = headers.map(h => normalize(h));

  // Column patterns to match (normalized)
  const patterns: Record<string, string[]> = {
    se_name: ['se name', 'tsese name', 'tse se name', 'sales executive name', 'se_name', 'tsese name', 'tse'],
    se_territory: ['territory', 'se territory', 'se_territory'],
    se_phone: ['se msisdn', 'se phone', 'se_phone', 'se msisdns', 'se msisdn(s)', 'se msisdn(s)'],
    zsm_name: ['zsm name', 'zonal sales manager name', 'zsm_name', 'zonal sales manager', 'zsm'],
    zsm_territory: ['zsm territory', 'zsm_territory'],
    zsm_phone: ['zsm msisdn', 'zsm phone', 'zsm_phone', 'zsm msisdns'],
    zbm_name: ['zbm name', 'zonal business manager name', 'zbm_name', 'zbm'],
    zbm_phone: ['zbm msisdn', 'zbm phone', 'zbm_phone', 'zbm msisdns'],
    zone: ['zone', 'region', 'area', 'zone name'],
  };

  // Primary exact/contains matching
  for (const [field, fieldPatterns] of Object.entries(patterns)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const nh = normalizedHeaders[i];
      for (const pattern of fieldPatterns) {
        const np = normalize(pattern);
        if (nh === np || nh.includes(np) || np.includes(nh)) {
          mapping[field] = headers[i];
          break;
        }
      }
      if (mapping[field]) break;
    }
  }

  // Fallback token-based detection: look for key tokens in header
  const fallbackTokens: Record<string, string[]> = {
    se_name: ['se', 'tse', 'tsese', 'salesexecutive', 'salesexecutive'],
    se_territory: ['territory'],
    se_phone: ['se', 'msisdn', 'phone'],
    zsm_name: ['zsm', 'zonalsalesmanager', 'zonal'],
    zsm_territory: ['territory'],
    zsm_phone: ['zsm', 'msisdn', 'phone'],
    zbm_name: ['zbm', 'zonalbusinessmanager', 'zonal'],
    zbm_phone: ['zbm', 'msisdn', 'phone'],
    zone: ['zone', 'region', 'area'],
  };

  for (const [field, tokens] of Object.entries(fallbackTokens)) {
    if (mapping[field]) continue; // already found
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const nh = normalizedHeaders[i].replace(/\s+/g, '');
      // require at least one primary token match (se/zsm/zbm/zone) and either name or phone token when applicable
      for (const tok of tokens) {
        if (nh.includes(tok)) {
          mapping[field] = headers[i];
          break;
        }
      }
      if (mapping[field]) break;
    }
  }

  return mapping;
}

// Parse CSV/TSV content
export function parseCSV(content: string): ParseResult {
  const warnings: string[] = [];

  const lines = content
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (lines.length < 2) {
    return {
      success: false,
      headers: [],
      rows: [],
      columnMapping: {},
      warnings: ['File has no data rows or headers'],
    };
  }

  const { index: headerIndex, delimiter } = findHeaderRow(lines);
  const headers = splitRow(lines[headerIndex], delimiter);

  if (headerIndex > 0) {
    warnings.push(`Detected header row at line ${headerIndex + 1} instead of line 1`);
  }
  
  // Detect column mapping
  const columnMapping = detectColumnMapping(headers);
  
  // Validate that we found key columns
  const requiredMappings = ['se_name', 'se_phone', 'zsm_name', 'zsm_phone', 'zbm_name', 'zbm_phone'];
  const missingColumns = requiredMappings.filter(col => !columnMapping[col]);
  
  if (missingColumns.length > 0) {
    warnings.push(`Could not find columns: ${missingColumns.join(', ')}`);
  }

  // Parse rows
  const rows: ContactRow[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const fields = splitRow(line, delimiter);

    // Map fields to columns
    const raw: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[header] = fields[idx] || '';
    });

    const row: ContactRow = {
      _raw: raw,
    };

    // Extract mapped columns
    if (columnMapping.se_name) {
      row.se_name = raw[columnMapping.se_name]?.trim();
    }
    if (columnMapping.se_territory) {
      row.se_territory = raw[columnMapping.se_territory]?.trim();
    }
    if (columnMapping.se_phone) {
      row.se_phone = normalizePhone(raw[columnMapping.se_phone]);
    }
    if (columnMapping.zsm_name) {
      row.zsm_name = raw[columnMapping.zsm_name]?.trim();
    }
    if (columnMapping.zsm_territory) {
      row.zsm_territory = raw[columnMapping.zsm_territory]?.trim();
    }
    if (columnMapping.zsm_phone) {
      row.zsm_phone = normalizePhone(raw[columnMapping.zsm_phone]);
    }
    if (columnMapping.zbm_name) {
      row.zbm_name = raw[columnMapping.zbm_name]?.trim();
    }
    if (columnMapping.zbm_phone) {
      row.zbm_phone = normalizePhone(raw[columnMapping.zbm_phone]);
    }
    if (columnMapping.zone) {
      row.zone = raw[columnMapping.zone]?.trim();
    }

    // Skip VACANT rows
    if (row.se_name?.toUpperCase().includes('VACANT')) {
      warnings.push(`Skipping vacant SE: ${row.se_name}`);
      continue;
    }

    rows.push(row);
  }

  return {
    success: rows.length > 0,
    headers,
    rows,
    columnMapping,
    warnings,
  };
}

// Extract user records from parsed contacts
export interface UserRecord {
  phone_number: string;
  full_name: string;
  role: 'se' | 'zsm' | 'zbm';
  territory?: string;
  zone?: string;
  zsm?: string;
  zbm?: string;
}

export function extractUserRecords(contacts: ContactRow[]): UserRecord[] {
  const records: UserRecord[] = [];
  const seen = new Set<string>();

  for (const contact of contacts) {
    // Extract SE
    if (contact.se_phone && contact.se_name && !contact.se_name.toUpperCase().includes('VACANT')) {
      const key = `se:${contact.se_phone}`;
      if (!seen.has(key)) {
        seen.add(key);
        records.push({
          phone_number: contact.se_phone,
          full_name: contact.se_name,
          role: 'se',
          territory: contact.se_territory,
          zone: contact.zone,
          zsm: contact.zsm_name,
          zbm: contact.zbm_name,
        });
      }
    }

    // Extract ZSM
    if (contact.zsm_phone && contact.zsm_name && !contact.zsm_name.toUpperCase().includes('VACANT')) {
      const key = `zsm:${contact.zsm_phone}`;
      if (!seen.has(key)) {
        seen.add(key);
        records.push({
          phone_number: contact.zsm_phone,
          full_name: contact.zsm_name,
          role: 'zsm',
          territory: contact.zsm_territory,
          zone: contact.zone,
        });
      }
    }

    // Extract ZBM
    if (contact.zbm_phone && contact.zbm_name && !contact.zbm_name.toUpperCase().includes('VACANT')) {
      const key = `zbm:${contact.zbm_phone}`;
      if (!seen.has(key)) {
        seen.add(key);
        records.push({
          phone_number: contact.zbm_phone,
          full_name: contact.zbm_name,
          role: 'zbm',
          zone: contact.zone,
        });
      }
    }
  }

  return records;
}
