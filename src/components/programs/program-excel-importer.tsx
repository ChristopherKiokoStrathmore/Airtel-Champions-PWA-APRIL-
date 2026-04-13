import { useState, useRef } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getAuthHeaders } from '../../utils/api-helper';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download } from 'lucide-react';

interface ParsedField {
  field_name: string;
  field_type: string;
  is_required: boolean;
  options?: { options: string[] };
  sample_value?: string;
}

interface ProgramExcelImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_TYPE_MAPPING: Record<string, string> = {
  'text': 'text',
  'number': 'number',
  'dropdown': 'dropdown',
  'photo': 'photo',
  'date': 'date',
  'time': 'time',
  'yes/no': 'yes_no',
  'rating': 'rating',
  'location': 'location',
  'long_text': 'long_text',
  'multi_select': 'multi_select',
};

export function ProgramExcelImporter({ onClose, onSuccess }: ProgramExcelImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState<{
    title: string;
    description: string;
    points: number;
    fields: ParsedField[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      setError('');
      setParsedData(null);
    }
  };

  const parseExcelFile = async () => {
    if (!file) return;

    setParsing(true);
    setError('');

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error('Failed to read file');

          // Dynamic import of xlsx library
          const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

          // Parse workbook
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

          if (jsonData.length < 3) {
            throw new Error('Excel file must have at least 3 rows (title, description, field definitions)');
          }

          // Expected format:
          // Row 1: Program Title | [Title Value]
          // Row 2: Description | [Description Value]
          // Row 3: Points | [Points Value]
          // Row 4: [blank]
          // Row 5: Field Name | Field Type | Required | Options (comma-separated)
          // Row 6+: Field definitions

          const title = jsonData[0][1] || 'Imported Program';
          const description = jsonData[1][1] || '';
          const points = parseInt(jsonData[2][1]) || 10;

          // Find where fields start (after "Field Name" header)
          let fieldsStartIndex = -1;
          for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i][0] === 'Field Name' || jsonData[i][0] === 'field_name') {
              fieldsStartIndex = i + 1;
              break;
            }
          }

          if (fieldsStartIndex === -1) {
            throw new Error('Could not find "Field Name" header in Excel file');
          }

          // Parse fields
          const fields: ParsedField[] = [];
          for (let i = fieldsStartIndex; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[0]) continue; // Skip empty rows

            const fieldName = row[0];
            const fieldTypeRaw = (row[1] || 'text').toString().toLowerCase();
            const fieldType = FIELD_TYPE_MAPPING[fieldTypeRaw] || 'text';
            const isRequired = row[2]?.toString().toLowerCase() === 'yes' || row[2]?.toString().toLowerCase() === 'true';
            const optionsRaw = row[3]?.toString();

            const field: ParsedField = {
              field_name: fieldName,
              field_type: fieldType,
              is_required: isRequired,
              sample_value: row[4]?.toString(),
            };

            // Parse options for dropdown/multi_select
            if (['dropdown', 'multi_select'].includes(fieldType) && optionsRaw) {
              const options = optionsRaw.split(',').map(opt => opt.trim()).filter(Boolean);
              if (options.length > 0) {
                field.options = { options };
              }
            }

            fields.push(field);
          }

          if (fields.length === 0) {
            throw new Error('No fields found in Excel file');
          }

          setParsedData({
            title,
            description,
            points,
            fields,
          });

          console.log('[Excel Import] Parsed data:', { title, description, points, fields });
        } catch (err: any) {
          console.error('[Excel Import] Parse error:', err);
          setError(err.message || 'Failed to parse Excel file');
        } finally {
          setParsing(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setParsing(false);
      };

      reader.readAsBinaryString(file);
    } catch (err: any) {
      console.error('[Excel Import] Error:', err);
      setError(err.message || 'Failed to parse Excel file');
      setParsing(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!parsedData) return;

    setCreating(true);
    setError('');

    try {
      // Direct DB mode — get user from localStorage instead of Supabase Auth
      const storedUser = localStorage.getItem('tai_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (!currentUser?.id) {
        throw new Error('Not authenticated. Please login again.');
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/programs`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: parsedData.title,
          description: parsedData.description,
          points_value: parsedData.points,
          target_roles: ['sales_executive'],
          fields: parsedData.fields.map((f, idx) => ({
            field_name: f.field_name,
            field_type: f.field_type,
            is_required: f.is_required,
            options: f.options || null,
            order_index: idx,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create program');
      }

      console.log('[Excel Import] Program created:', data.program);
      alert(`✅ Program "${parsedData.title}" created successfully!`);
      onSuccess();
    } catch (err: any) {
      console.error('[Excel Import] Error creating program:', err);
      setError(err.message || 'Failed to create program');
    } finally {
      setCreating(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      ['Program Title', 'AMBs to Keep List - Sample'],
      ['Description', 'Daily shop visits tracking template'],
      ['Points', 10],
      [],
      ['Field Name', 'Field Type', 'Required', 'Options (comma-separated)', 'Sample Value'],
      ['Shop Name', 'text', 'yes', '', 'ABC Store'],
      ['Shop Masterline', 'text', 'yes', '', '0712345678'],
      ['Site ID', 'number', 'yes', '', '12345'],
      ['ZSM', 'dropdown', 'yes', 'John Kamau,Jane Njeri,Peter Oloo', 'John Kamau'],
      ['Shop Photo', 'photo', 'yes', '', ''],
      ['Competitor Present?', 'yes/no', 'no', '', 'yes'],
      ['Shop Cleanliness', 'rating', 'no', '', '4'],
    ];

    // Convert to CSV
    const csv = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TAI_Program_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📊 Import from Excel</h2>
            <p className="text-sm text-gray-600 mt-1">Upload an Excel file to auto-create a program</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Download our Excel template to see the required format
                </p>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Upload Excel File</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-gray-400" />
                {file ? (
                  <>
                    <span className="font-semibold text-gray-900">{file.name}</span>
                    <span className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gray-700">Click to upload Excel file</span>
                    <span className="text-sm text-gray-500">.xlsx or .xls format</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Parse Button */}
          {file && !parsedData && (
            <button
              onClick={parseExcelFile}
              disabled={parsing}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Parsing Excel File...
                </div>
              ) : (
                '🔍 Parse Excel File'
              )}
            </button>
          )}

          {/* Preview */}
          {parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Excel file parsed successfully!</span>
              </div>

              {/* Program Info */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-gray-900">Program Preview</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Title</div>
                    <div className="font-semibold text-gray-900">{parsedData.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Points</div>
                    <div className="font-semibold text-gray-900">{parsedData.points} pts</div>
                  </div>
                </div>

                {parsedData.description && (
                  <div>
                    <div className="text-sm text-gray-600">Description</div>
                    <div className="text-gray-900">{parsedData.description}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Fields ({parsedData.fields.length})
                  </div>
                  <div className="space-y-2">
                    {parsedData.fields.map((field, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">
                              {field.field_name}
                              {field.is_required && <span className="text-red-600 ml-1">*</span>}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Type: {field.field_type}
                              {field.options && (
                                <span className="ml-2">
                                  ({field.options.options.length} options)
                                </span>
                              )}
                            </div>
                            {field.options && (
                              <div className="text-xs text-gray-500 mt-1">
                                Options: {field.options.options.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateProgram}
                disabled={creating}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {creating ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Program...
                  </div>
                ) : (
                  '✅ Create Program from Excel'
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-900">Error</div>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">📋 Excel Format Instructions</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Row 1:</strong> Program Title | [Your Program Name]</p>
              <p><strong>Row 2:</strong> Description | [Your Description]</p>
              <p><strong>Row 3:</strong> Points | [Points Value]</p>
              <p><strong>Row 4:</strong> [Leave blank]</p>
              <p><strong>Row 5:</strong> Field Name | Field Type | Required | Options | Sample Value</p>
              <p><strong>Row 6+:</strong> Your field definitions</p>
              
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="font-semibold mb-2">Supported Field Types:</p>
                <div className="grid grid-cols-2 gap-1">
                  <span>• text</span>
                  <span>• number</span>
                  <span>• dropdown</span>
                  <span>• photo</span>
                  <span>• date</span>
                  <span>• time</span>
                  <span>• yes/no</span>
                  <span>• rating</span>
                  <span>• location</span>
                  <span>• long_text</span>
                  <span>• multi_select</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}