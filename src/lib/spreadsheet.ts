import ExcelJS from 'exceljs';

function cellText(value: ExcelJS.CellValue): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.text === 'string') return v.text;
    if ('result' in v) return cellText(v.result as ExcelJS.CellValue);
    if (Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>).map((t) => t.text || '').join('');
    }
    if (typeof v.hyperlink === 'string') return String(v.text || v.hyperlink);
  }
  return String(value);
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvRowsToObjects(records: string[][]): Record<string, any>[] {
  if (records.length < 2) return [];
  const headers = records[0].map((h) => String(h ?? '').trim());
  return records
    .slice(1)
    .filter((r) => r.some((c) => String(c ?? '').trim() !== ''))
    .map((r) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = r[i] ?? '';
      });
      return obj;
    });
}

export async function readFirstSheetAsObjects(data: ArrayBuffer): Promise<Record<string, any>[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const sheet = wb.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = cellText(cell.value);
  });

  const rows: Record<string, any>[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    let empty = true;
    headers.forEach((h, col) => {
      if (!h) return;
      const v = cellText(row.getCell(col).value);
      obj[h] = v;
      if (v !== '') empty = false;
    });
    if (!empty) rows.push(obj);
  });
  return rows;
}

export async function readFirstSheetAsAoa(data: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const sheet = wb.worksheets[0];
  if (!sheet) return [];

  const maxCol = Math.max(sheet.columnCount, 1);
  const aoa: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const arr: string[] = [];
    for (let c = 1; c <= Math.max(maxCol, row.cellCount); c++) {
      arr[c - 1] = cellText(row.getCell(c).value);
    }
    aoa[rowNumber - 1] = arr;
  });
  for (let i = 0; i < aoa.length; i++) {
    if (!aoa[i]) aoa[i] = [];
  }
  return aoa;
}

export async function readTabularFileAsObjects(file: File): Promise<Record<string, any>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return csvRowsToObjects(parseCsvRows(await file.text()));
  }
  if (name.endsWith('.xls') && !name.endsWith('.xlsx')) {
    throw new Error('Legacy .xls is not supported. Please save the file as .xlsx or CSV.');
  }
  return readFirstSheetAsObjects(await file.arrayBuffer());
}

export async function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: any[][],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(headers);
  rows.forEach((r) => ws.addRow(r));
  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(filename, buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export function downloadCsv(filename: string, headers: string[], rows: any[][]): void {
  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n');
  triggerDownload(filename, csv, 'text/csv;charset=utf-8');
}

function triggerDownload(filename: string, data: BlobPart, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
