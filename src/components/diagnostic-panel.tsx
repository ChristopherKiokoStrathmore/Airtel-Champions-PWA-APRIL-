import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function DiagnosticPanel({ onClose }: { onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setRunning(true);
    const diagnosticResults: any[] = [];

    try {
      // Test 1: Check if programs table exists
      diagnosticResults.push({ test: 'Checking programs table...', status: 'running' });
      setResults([...diagnosticResults]);

      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .limit(5);

      if (programsError) {
        diagnosticResults[0] = {
          test: 'Programs Table',
          status: 'error',
          message: programsError.message,
          code: programsError.code,
          hint: programsError.hint,
        };
      } else {
        diagnosticResults[0] = {
          test: 'Programs Table',
          status: 'success',
          message: `Found ${programsData?.length || 0} programs`,
          data: programsData,
        };
      }
      setResults([...diagnosticResults]);

      // Test 2: Check if program_fields table exists
      diagnosticResults.push({ test: 'Checking program_fields table...', status: 'running' });
      setResults([...diagnosticResults]);

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('program_fields')
        .select('*')
        .limit(10);

      if (fieldsError) {
        diagnosticResults[1] = {
          test: 'Program Fields Table',
          status: 'error',
          message: fieldsError.message,
          code: fieldsError.code,
          hint: fieldsError.hint,
        };
      } else {
        diagnosticResults[1] = {
          test: 'Program Fields Table',
          status: 'success',
          message: `Found ${fieldsData?.length || 0} fields`,
          data: fieldsData,
        };
      }
      setResults([...diagnosticResults]);

      // Test 3: Check if submissions table exists
      diagnosticResults.push({ test: 'Checking submissions table...', status: 'running' });
      setResults([...diagnosticResults]);

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .limit(5);

      if (submissionsError) {
        diagnosticResults[2] = {
          test: 'Submissions Table',
          status: 'error',
          message: submissionsError.message,
          code: submissionsError.code,
        };
      } else {
        diagnosticResults[2] = {
          test: 'Submissions Table',
          status: 'success',
          message: `Found ${submissionsData?.length || 0} submissions`,
        };
      }
      setResults([...diagnosticResults]);

      // Test 4: Check field-to-program linkage
      if (programsData && programsData.length > 0 && !programsError) {
        const testProgramId = programsData[0].id;
        diagnosticResults.push({ test: 'Checking field linkage...', status: 'running' });
        setResults([...diagnosticResults]);

        const { data: linkedFields, error: linkError } = await supabase
          .from('program_fields')
          .select('*')
          .eq('program_id', testProgramId);

        if (linkError) {
          diagnosticResults[3] = {
            test: 'Field Linkage',
            status: 'error',
            message: linkError.message,
          };
        } else {
          diagnosticResults[3] = {
            test: 'Field Linkage',
            status: 'success',
            message: `Program "${programsData[0].title}" has ${linkedFields?.length || 0} fields`,
            data: linkedFields,
          };
        }
        setResults([...diagnosticResults]);
      }

      // Test 5: Check KV store table
      diagnosticResults.push({ test: 'Checking KV store...', status: 'running' });
      setResults([...diagnosticResults]);

      const { data: kvData, error: kvError } = await supabase
        .from('kv_store_28f2f653')
        .select('key')
        .limit(10);

      if (kvError) {
        diagnosticResults[diagnosticResults.length - 1] = {
          test: 'KV Store Table',
          status: 'error',
          message: kvError.message,
        };
      } else {
        const programKeys = kvData?.filter(k => k.key.startsWith('programs:')) || [];
        diagnosticResults[diagnosticResults.length - 1] = {
          test: 'KV Store Table',
          status: 'success',
          message: `Found ${kvData?.length || 0} total keys, ${programKeys.length} program keys`,
          data: programKeys,
        };
      }
      setResults([...diagnosticResults]);

    } catch (err: any) {
      diagnosticResults.push({
        test: 'General Error',
        status: 'error',
        message: err.message,
      });
      setResults([...diagnosticResults]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white mb-1">🔍 TAI Diagnostic Panel</h2>
            <p className="text-white text-opacity-90 text-sm">Database & API Health Check</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🩺</div>
              <h3 className="text-xl mb-2">Ready to Diagnose</h3>
              <p className="text-gray-600 mb-6">
                This will test your database tables, permissions, and data linkage
              </p>
              <button
                onClick={runDiagnostics}
                disabled={running}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {running ? 'Running Diagnostics...' : '▶ Run Diagnostics'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' && (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {result.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    {result.status === 'running' && (
                      <RefreshCw className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5 animate-spin" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{result.test}</h4>
                      <p className="text-sm text-gray-700">{result.message}</p>
                      
                      {result.code && (
                        <p className="text-xs text-red-600 mt-2">
                          Error Code: {result.code}
                        </p>
                      )}
                      
                      {result.hint && (
                        <p className="text-xs text-orange-600 mt-1">
                          Hint: {result.hint}
                        </p>
                      )}
                      
                      {result.data && result.data.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            Show Data ({result.data.length} items)
                          </summary>
                          <pre className="mt-2 p-3 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {!running && (
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={runDiagnostics}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Re-run Diagnostics
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Instructions */}
        {results.length > 0 && (
          <div className="border-t border-gray-200 px-8 py-4 bg-gray-50">
            <h4 className="font-semibold text-sm mb-2">📋 Next Steps Based on Results:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>
                • <strong>Red (Error):</strong> Table doesn't exist → Run{' '}
                <code className="bg-white px-1 py-0.5 rounded">/database/FORCE-CREATE-TABLES-NOW.sql</code>
              </li>
              <li>
                • <strong>Green (Success) + "0 programs":</strong> Tables exist but empty → Create a program
              </li>
              <li>
                • <strong>Green + "0 fields" for a program:</strong> Fields not saved → Recreate program with fields
              </li>
              <li>
                • <strong>All Green + Data:</strong> Everything works! → Check browser console for other errors
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
