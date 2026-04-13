import { useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getAuthHeaders } from '../../utils/api-helper';
import { Link2, X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface GoogleFormField {
  field_name: string;
  field_type: string;
  is_required: boolean;
  options?: { options: string[] };
}

interface ProgramGFormsImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Map Google Forms question types to TAI field types
const GFORMS_TYPE_MAPPING: Record<string, string> = {
  'SHORT_ANSWER': 'text',
  'PARAGRAPH': 'long_text',
  'MULTIPLE_CHOICE': 'dropdown',
  'CHECKBOXES': 'multi_select',
  'DROP_DOWN': 'dropdown',
  'LINEAR_SCALE': 'rating',
  'DATE': 'date',
  'TIME': 'time',
  'FILE_UPLOAD': 'photo',
};

export function ProgramGFormsImporter({ onClose, onSuccess }: ProgramGFormsImporterProps) {
  const [formUrl, setFormUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState<{
    title: string;
    description: string;
    fields: GoogleFormField[];
  } | null>(null);

  const extractFormId = (url: string) => {
    // Extract form ID from Google Forms URL
    // Format: https://docs.google.com/forms/d/FORM_ID/edit or /viewform
    const match = url.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const fetchGoogleForm = async () => {
    setFetching(true);
    setError('');
    setParsedData(null);

    try {
      const formId = extractFormId(formUrl);
      if (!formId) {
        throw new Error('Invalid Google Forms URL. Please copy the full URL from your browser.');
      }

      // Note: Google Forms API requires OAuth setup
      // For now, we'll show instructions for manual setup
      // In production, you'd need to:
      // 1. Enable Google Forms API in Google Cloud Console
      // 2. Set up OAuth 2.0
      // 3. Get API key and store in environment variables

      setError(
        'Google Forms import requires API setup. For now, please use Excel import or create manually.'
      );

      // This is a placeholder for the actual implementation
      // When Google Forms API is set up, the code would look like:
      /*
      const response = await fetch(
        `https://forms.googleapis.com/v1/forms/${formId}`,
        {
          headers: {
            'Authorization': `Bearer ${googleAccessToken}`,
          },
        }
      );

      const formData = await response.json();

      // Parse form structure
      const title = formData.info.title;
      const description = formData.info.description || '';
      const fields: GoogleFormField[] = formData.items
        .filter((item: any) => item.questionItem)
        .map((item: any) => {
          const question = item.questionItem.question;
          const fieldType = GFORMS_TYPE_MAPPING[question.questionType] || 'text';

          let options = undefined;
          if (question.choiceQuestion) {
            options = {
              options: question.choiceQuestion.options.map((opt: any) => opt.value),
            };
          }

          return {
            field_name: item.title,
            field_type: fieldType,
            is_required: question.required || false,
            options,
          };
        });

      setParsedData({ title, description, fields });
      */
    } catch (err: any) {
      console.error('[Google Forms Import] Error:', err);
      setError(err.message || 'Failed to fetch Google Form');
    } finally {
      setFetching(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!parsedData) return;

    setCreating(true);
    setError('');

    try {
      // Direct DB mode — use publicAnonKey instead of auth session
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
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
          points_value: 10,
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

      console.log('[Google Forms Import] Program created:', data.program);
      alert(`✅ Program "${parsedData.title}" created successfully!`);
      onSuccess();
    } catch (err: any) {
      console.error('[Google Forms Import] Error creating program:', err);
      setError(err.message || 'Failed to create program');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📝 Import from Google Forms</h2>
            <p className="text-sm text-gray-600 mt-1">Convert your Google Form into a TAI program</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Setup Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">API Setup Required</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  To import from Google Forms, you need to enable the Google Forms API and set up OAuth 2.0.
                </p>
                <a
                  href="https://developers.google.com/forms/api/guides/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-yellow-900 font-semibold hover:underline flex items-center gap-1"
                >
                  View Setup Instructions
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Google Form URL
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/abc123/edit"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={fetchGoogleForm}
                disabled={!formUrl || fetching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fetching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fetching...
                  </div>
                ) : (
                  'Import'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Paste the full URL from your Google Form (edit or view mode)
            </p>
          </div>

          {/* Preview */}
          {parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Google Form imported successfully!</span>
              </div>

              {/* Program Info */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-gray-900">Program Preview</h3>

                <div>
                  <div className="text-sm text-gray-600">Title</div>
                  <div className="font-semibold text-gray-900">{parsedData.title}</div>
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
                  '✅ Create Program from Google Form'
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
            <h3 className="font-bold text-gray-900 mb-3">📋 Setup Instructions</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold mb-1">1. Enable Google Forms API</p>
                <p>Go to Google Cloud Console → APIs & Services → Enable APIs</p>
              </div>

              <div>
                <p className="font-semibold mb-1">2. Create OAuth 2.0 Credentials</p>
                <p>Set up OAuth consent screen and create credentials</p>
              </div>

              <div>
                <p className="font-semibold mb-1">3. Add API Key to Environment</p>
                <p>Store your Google API credentials securely</p>
              </div>

              <div>
                <p className="font-semibold mb-1">4. Share Your Form</p>
                <p>Make sure your Google Form is accessible (not private)</p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="font-semibold mb-2">Alternative: Use Excel Import</p>
                <p>
                  For immediate use, export your Google Form responses to Excel and use the 
                  Excel importer instead.
                </p>
              </div>
            </div>
          </div>

          {/* Workaround */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Workaround</h3>
            <p className="text-sm text-blue-800 mb-3">
              While API setup is being configured, you can:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Copy your Google Form questions</li>
              <li>Use the manual Program Creator</li>
              <li>Add fields one by one (takes 2-3 minutes)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}