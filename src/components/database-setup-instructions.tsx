import React, { useState } from 'react';
import { AlertTriangle, Database, Copy, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface DatabaseSetupInstructionsProps {
  error?: string;
  onDismiss?: () => void;
}

export function DatabaseSetupInstructions({ error, onDismiss }: DatabaseSetupInstructionsProps) {
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const sqlCode = `-- TAI Database Setup SQL
CREATE TABLE IF NOT EXISTS kv_store_28f2f653 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_28f2f653(key);`;

  const handleCopy = async () => {
    try {
      // Try to copy to clipboard (may not work in iframe)
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback: Select the text so user can copy manually
      const sqlElement = document.getElementById('sql-code');
      if (sqlElement) {
        const range = document.createRange();
        range.selectNodeContents(sqlElement);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        alert('Text selected! Press Ctrl+C (or Cmd+C on Mac) to copy.');
      }
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Database Setup Required</h1>
          </div>
          <p className="text-red-50">
            TAI needs one-time database configuration. Follow the 4 simple steps below (takes 2 minutes).
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Database Error</h3>
                <p className="text-sm text-red-700 font-mono break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Setup (4 Steps - 2 Minutes)
            </h2>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Open Supabase Dashboard
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Click the button below to open your Supabase project
                  </p>
                  <a
                    href="https://supabase.com/dashboard/project/_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Supabase Dashboard
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Navigate to SQL Editor
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• In the left sidebar, find and click <strong className="text-gray-900">SQL Editor</strong></p>
                    <p>• Click the <strong className="text-gray-900">New Query</strong> button (top right)</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Copy and Run This SQL
                  </h3>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto border border-gray-700 max-h-48">
                      <code id="sql-code">{sqlCode}</code>
                    </pre>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy SQL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>• Click <strong className="text-gray-900">Copy SQL</strong> button above</p>
                    <p>• Paste into the SQL Editor</p>
                    <p>• Click <strong className="text-gray-900">Run</strong> (or press <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Cmd</kbd>+<kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-xs">Enter</kbd>)</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Refresh TAI App
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    After you see <strong className="text-green-600">"Success. No rows returned"</strong> in Supabase, click the button below to reload TAI.
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {retrying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Refresh TAI App
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Still Need Help?
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>Option 1:</strong> Run the complete setup from <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">/DATABASE-SETUP.sql</code> file in your project files
              </p>
              <p>
                <strong>Option 2:</strong> Contact your system administrator with this error message
              </p>
            </div>
          </div>

          {/* What This Does */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              What does this SQL do?
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>✅ Creates the <code className="bg-white px-1 py-0.5 rounded text-xs">kv_store_28f2f653</code> table for app data</p>
              <p>✅ Disables Row Level Security (TAI uses custom authentication)</p>
              <p>✅ Grants necessary permissions to access the table</p>
              <p>✅ Creates an index for better performance</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {onDismiss && (
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
            <button
              onClick={onDismiss}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              I'll set this up later
            </button>
            <p className="text-xs text-gray-500">
              This is a one-time setup
            </p>
          </div>
        )}
      </div>
    </div>
  );
}