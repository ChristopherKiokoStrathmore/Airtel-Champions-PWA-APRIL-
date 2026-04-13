import { AlertCircle, Database, Terminal } from 'lucide-react';
import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SetupInstructionsProps {
  error?: string;
  code?: string;
}

export function SetupInstructions({ error, code }: SetupInstructionsProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);

  if (code !== 'TABLE_NOT_FOUND') {
    return null;
  }

  const attemptAutoFix = async () => {
    setAutoFixing(true);
    setTestResult(null);

    try {
      console.log('[AutoFix] Attempting automatic table creation...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/setup-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      console.log('[AutoFix] Response:', data);

      if (data.success || data.alreadyExists) {
        setTestResult({
          success: true,
          message: '✅ Tables created successfully! Refreshing page...',
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error || 'Auto-fix failed. Please use manual setup below.'}`,
        });
      }
    } catch (err: any) {
      console.error('[AutoFix] Error:', err);
      setTestResult({
        success: false,
        message: `❌ Error: ${err.message}. Please use manual setup below.`,
      });
    } finally {
      setAutoFixing(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/setup-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.alreadyExists) {
        setTestResult({
          success: true,
          message: '✅ Tables exist! Refresh the page now.',
        });
        setTimeout(() => window.location.reload(), 2000);
      } else if (data.code === 'MANUAL_SQL_REQUIRED' || data.code === 'AUTO_CREATE_FAILED') {
        setTestResult({
          success: false,
          message: '❌ Tables still missing. Please run the SQL in Supabase Dashboard.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Unknown error',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">⚠️ DATABASE NOT SET UP</h2>
              <p className="text-orange-100 text-sm">You must run SQL in Supabase to create tables (30 seconds)</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">Database Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Quick Setup (2 minutes)
            </h3>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Open Supabase Dashboard</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/dashboard</a>
                    </p>
                    <p className="text-sm text-gray-600">
                      Select your project → Click "SQL Editor" in the left sidebar
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Open the Schema File</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      In your project files, find and open:
                    </p>
                    <div className="bg-gray-900 text-green-400 px-4 py-3 rounded-lg font-mono text-sm mb-2">
                      /database/CREATE-TABLES-NOW.sql
                    </div>
                    <p className="text-xs bg-yellow-100 text-yellow-800 p-2 rounded">
                      ⭐ <strong>NEW FILE!</strong> Use CREATE-TABLES-NOW.sql - it's the simplest!
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Copy & Run SQL</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Copy the entire contents of <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">programs-schema.sql</code>
                    </p>
                    <p className="text-sm text-gray-600">
                      Paste it into the SQL Editor and click <span className="font-semibold">"Run"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-2">Refresh This Page</h4>
                    <p className="text-sm text-green-700">
                      After the SQL runs successfully, refresh this page and the programs feature will work!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What Gets Created */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5" />
              What gets created:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">programs</code> - Stores program metadata</li>
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">program_fields</code> - Dynamic form fields</li>
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">submissions</code> - User submissions</li>
              <li>✅ <code className="bg-blue-100 px-2 py-0.5 rounded">job_title</code> column in app_users</li>
            </ul>
          </div>

          {/* Video Tutorial Link (Optional) */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Need help?</p>
            <a
              href="https://supabase.com/docs/guides/database/tables"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline"
            >
              📖 View Supabase SQL Documentation →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 space-y-3">
          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {testResult.message}
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={testConnection}
            disabled={testing}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            {testing ? '⏳ Testing Connection...' : '🔍 Test If Tables Exist'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            🔄 I've Run the SQL - Refresh Page
          </button>

          {/* Auto Fix Button */}
          <button
            onClick={attemptAutoFix}
            disabled={autoFixing}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all"
          >
            {autoFixing ? '⏳ Attempting Auto-Fix...' : '🔧 Attempt Auto-Fix'}
          </button>
        </div>
      </div>
    </div>
  );
}