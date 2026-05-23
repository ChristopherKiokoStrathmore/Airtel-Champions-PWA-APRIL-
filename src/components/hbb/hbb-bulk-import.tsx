// HBB Bulk Lead Import — CSV paste/upload with preview, validation, and batch submit
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, X, Trash2, Send, Download, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { bulkCreateServiceRequests, getTowns } from './hbb-api';
import { toast } from 'sonner@2.0.3';

const ACCENT = '#E60000';

const REQUIRED_COLS = ['customer_name', 'customer_phone', 'town'];
const OPTIONAL_COLS = ['estate', 'package', 'preferred_date', 'preferred_time', 'remarks'];
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

interface ParsedRow {
  rowNum: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
}

interface Props {
  agentName: string;
  agentPhone: string;
  onSuccess: () => void;
}

export function HBBBulkImport({ agentName, agentPhone, onSuccess }: Props) {
  const [mode, setMode] = useState<'upload' | 'preview' | 'results'>('upload');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTowns().then(setTowns);
  }, []);

  const townMap = useMemo(() => {
    const map: Record<string, number> = {};
    towns.forEach(t => {
      map[t.name.toLowerCase()] = t.id;
      map[t.name.toUpperCase()] = t.id;
      map[t.name] = t.id;
    });
    return map;
  }, [towns]);

  // ─── Parse CSV text ──────────────────────────────────────────────────
  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      toast.error('CSV must have a header row and at least one data row');
      return;
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(/[,\t]/).map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/['"]/g, ''));

    // Map headers to our columns
    const colMap: Record<number, string> = {};
    headers.forEach((h, i) => {
      const normalized = h.replace(/customer[\s_]?name/i, 'customer_name')
        .replace(/customer[\s_]?phone/i, 'customer_phone')
        .replace(/phone[\s_]?number/i, 'customer_phone')
        .replace(/full[\s_]?name/i, 'customer_name')
        .replace(/^name$/i, 'customer_name')
        .replace(/^phone$/i, 'customer_phone')
        .replace(/^town$/i, 'town')
        .replace(/^city$/i, 'town')
        .replace(/^location$/i, 'town')
        .replace(/preferred[\s_]?date/i, 'preferred_date')
        .replace(/^date$/i, 'preferred_date')
        .replace(/preferred[\s_]?time/i, 'preferred_time')
        .replace(/^time$/i, 'preferred_time')
        .replace(/^notes$/i, 'remarks')
        .replace(/^comments$/i, 'remarks');
      if (ALL_COLS.includes(normalized)) {
        colMap[i] = normalized;
      }
    });

    // Check required columns
    const mappedCols = Object.values(colMap);
    const missingRequired = REQUIRED_COLS.filter(c => !mappedCols.includes(c));
    if (missingRequired.length > 0) {
      toast.error(`Missing required columns: ${missingRequired.join(', ')}`);
      return;
    }

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      const data: Record<string, string> = {};
      const errors: string[] = [];

      Object.entries(colMap).forEach(([idx, col]) => {
        data[col] = cells[Number(idx)] || '';
      });

      // Validate
      if (!data.customer_name?.trim()) errors.push('Name is required');
      if (!data.customer_phone?.trim()) errors.push('Phone is required');
      else if (!/^[0-9+\-\s()]{7,15}$/.test(data.customer_phone.trim())) errors.push('Invalid phone format');
      if (!data.town?.trim()) errors.push('Town is required');
      else {
        const townName = data.town.trim();
        if (!townMap[townName] && !townMap[townName.toLowerCase()] && !townMap[townName.toUpperCase()]) {
          // Try fuzzy match
          const match = towns.find(t => t.name.toLowerCase().includes(townName.toLowerCase()));
          if (match) {
            data.town = match.name;
          } else {
            errors.push(`Unknown town: ${townName}`);
          }
        }
      }

      if (data.preferred_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date.trim())) {
        // Try to parse date
        const parsed = new Date(data.preferred_date);
        if (isNaN(parsed.getTime())) {
          errors.push('Invalid date format (use YYYY-MM-DD)');
        } else {
          data.preferred_date = parsed.toISOString().split('T')[0];
        }
      }

      rows.push({
        rowNum: i,
        data,
        errors,
        valid: errors.length === 0,
      });
    }

    setParsedRows(rows);
    setMode('preview');
  }, [townMap, towns]);

  // ─── Handle file upload ──────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt') && !file.name.endsWith('.tsv')) {
      toast.error('Please upload a CSV, TSV, or TXT file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  // ─── Handle paste ────────────────────────────────────────────────────
  const handlePasteSubmit = () => {
    if (rawText.trim()) {
      parseCSV(rawText);
    }
  };

  // ─── Submit batch ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) {
      toast.error('No valid rows to submit');
      return;
    }

    setSubmitting(true);
    try {
      const leads = validRows.map(r => {
        const townName = r.data.town?.trim();
        const townId = townMap[townName] || townMap[townName?.toLowerCase()] || townMap[townName?.toUpperCase()];
        return {
          customer_name: r.data.customer_name.trim(),
          customer_phone: r.data.customer_phone.trim(),
          town_id: townId,
          estate: r.data.estate?.trim() || undefined,
          package: r.data.package?.trim() || undefined,
          preferred_date: r.data.preferred_date?.trim() || undefined,
          preferred_time: r.data.preferred_time?.trim() || undefined,
          remarks: r.data.remarks?.trim() || undefined,
          agent_name: agentName,
          agent_phone: agentPhone,
        };
      });

      const result = await bulkCreateServiceRequests(leads);
      setResults(result);
      setMode('results');
      toast.success(`${result.created || leads.length} leads submitted!`);
    } catch (err: any) {
      console.error('[HBB Bulk] Submit error:', err);
      toast.error(err.message || 'Bulk import failed');
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  // ─── TEMPLATE ────────────────────────────────────────────────────────
  const csvTemplate = `customer_name,customer_phone,town,estate,package,preferred_date,preferred_time,remarks
Jane Wanjiku,0712345678,Nairobi,Kilimani,HBB Plus,2026-03-10,10:00 AM,Corner house
John Ochieng,0723456789,Kisumu,Milimani,HBB Basic,,, 
Mary Akinyi,0734567890,Mombasa,Nyali,HBB Starter,2026-03-12,2:00 PM,Gate code 1234`;

  // ─── RESULTS SCREEN ──────────────────────────────────────────────────
  if (mode === 'results' && results) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#ECFDF5' }}>
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Bulk Import Complete!</h2>
        <p className="text-gray-500 text-sm mb-6">
          {results.created || validCount} leads created • {results.allocated || 0} auto-allocated
        </p>

        <div className="bg-white rounded-2xl p-4 w-full shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{results.created || validCount}</p>
              <p className="text-[10px] text-gray-500">Created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{results.allocated || 0}</p>
              <p className="text-[10px] text-gray-500">Allocated</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{results.failed || 0}</p>
              <p className="text-[10px] text-gray-500">Failed</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button onClick={() => { setMode('upload'); setParsedRows([]); setRawText(''); setResults(null); }}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ backgroundColor: ACCENT }}>
            Import More
          </button>
          <button onClick={onSuccess}
            className="flex-1 py-3 rounded-2xl border-2 font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ borderColor: ACCENT, color: ACCENT }}>
            View Leads
          </button>
        </div>
      </div>
    );
  }

  // ─── PREVIEW SCREEN ──────────────────────────────────────────────────
  if (mode === 'preview') {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => { setMode('upload'); setParsedRows([]); }}
                className="p-1.5 rounded-lg bg-gray-100 active:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <div>
                <h2 className="text-base font-bold text-gray-900">Preview Import</h2>
                <p className="text-[11px] text-gray-500">{parsedRows.length} rows parsed</p>
              </div>
            </div>
          </div>

          {/* Validation Summary */}
          <div className="flex gap-3">
            <div className="flex-1 py-2 rounded-xl text-center" style={{ backgroundColor: '#ECFDF5' }}>
              <p className="text-lg font-bold text-green-600">{validCount}</p>
              <p className="text-[10px] text-green-700">Valid</p>
            </div>
            {invalidCount > 0 && (
              <div className="flex-1 py-2 rounded-xl text-center" style={{ backgroundColor: '#FEF2F2' }}>
                <p className="text-lg font-bold text-red-600">{invalidCount}</p>
                <p className="text-[10px] text-red-700">Errors</p>
              </div>
            )}
          </div>
        </div>

        {/* Row List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {parsedRows.map(row => (
            <PreviewRow key={row.rowNum} row={row} />
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 safe-bottom">
          <button
            onClick={handleSubmit}
            disabled={validCount === 0 || submitting}
            className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all shadow-lg"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #CC0000 100%)` }}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting {validCount} leads...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit {validCount} Valid Lead{validCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── UPLOAD SCREEN ───────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
          <Upload className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Bulk Import</h2>
          <p className="text-[11px] text-gray-500">Upload or paste CSV data</p>
        </div>
      </div>

      {/* Upload Area */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-10 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center gap-3 active:bg-gray-100 transition-colors"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
          <FileText className="w-7 h-7" style={{ color: ACCENT }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Tap to upload CSV file</p>
          <p className="text-xs text-gray-400 mt-1">.csv, .tsv, or .txt</p>
        </div>
      </button>
      <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileUpload} />

      {/* OR Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">OR PASTE DATA</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Paste Area */}
      <textarea
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        placeholder={`customer_name,customer_phone,town,estate,package\nJane Wanjiku,0712345678,Nairobi,Kilimani,HBB Plus\nJohn Doe,0723456789,Mombasa,Nyali,HBB Basic`}
        rows={6}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
      />

      <button
        onClick={handlePasteSubmit}
        disabled={!rawText.trim()}
        className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
        style={{ backgroundColor: ACCENT }}
      >
        <Eye className="w-4 h-4" />
        Preview & Validate
      </button>

      {/* Template */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <button onClick={() => setShowTemplate(!showTemplate)}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-gray-50">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">CSV Template & Format</span>
          </div>
          {showTemplate ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {showTemplate && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2">
              Required: <span className="font-semibold text-gray-700">customer_name, customer_phone, town</span><br />
              Optional: estate, package, preferred_date (YYYY-MM-DD), preferred_time, remarks
            </p>
            <div className="bg-gray-50 rounded-xl p-3 overflow-x-auto">
              <pre className="text-[10px] text-gray-600 font-mono whitespace-pre">{csvTemplate}</pre>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(csvTemplate);
                toast.success('Template copied!');
              }}
              className="mt-2 text-xs font-medium active:opacity-70"
              style={{ color: ACCENT }}
            >
              Copy template to clipboard
            </button>
          </div>
        )}
      </div>

      {/* Available Towns */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Available Towns</p>
        <div className="flex flex-wrap gap-1">
          {towns.map(t => (
            <span key={t.id} className="px-2 py-0.5 rounded-full text-[10px] bg-white text-gray-600 border border-gray-200">
              {t.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PREVIEW ROW ────────────────────────────────────────────────────────────
function PreviewRow({ row }: { row: ParsedRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border overflow-hidden ${row.valid ? 'border-gray-100 bg-white' : 'border-red-200 bg-red-50/50'}`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-gray-50">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${row.valid ? 'bg-green-100' : 'bg-red-100'}`}>
          {row.valid ? (
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {row.data.customer_name || '(no name)'}
          </p>
          <p className="text-[11px] text-gray-500 truncate">
            {row.data.customer_phone} • {row.data.town}
          </p>
        </div>
        <span className="text-[10px] text-gray-400">Row {row.rowNum}</span>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-2 space-y-1.5">
          {Object.entries(row.data).map(([key, val]) => val && (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-24 flex-shrink-0 capitalize">{key.replace('_', ' ')}</span>
              <span className="text-xs text-gray-700">{val}</span>
            </div>
          ))}
          {row.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {row.errors.map((err, i) => (
                <p key={i} className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
