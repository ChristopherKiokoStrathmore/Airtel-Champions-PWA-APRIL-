import React from 'react';

/**
 * Van Database Setup Instructions
 * Focuses on RLS policies since vans already exist in database
 */

export const VanDatabaseSetupInstructions: React.FC = () => {
  const sqlScript = `-- Setup RLS (Row Level Security) policies for van_db
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read access" ON van_db;
CREATE POLICY "Allow anon read access" 
ON van_db FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Service role full access" ON van_db;
CREATE POLICY "Service role full access" 
ON van_db FOR ALL 
USING (true) 
WITH CHECK (true);

-- Setup RLS policies for van_calendar_plans
ALTER TABLE van_calendar_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read access" ON van_calendar_plans;
CREATE POLICY "Allow anon read access" 
ON van_calendar_plans FOR SELECT 
TO anon, authenticated 
USING (true);

DROP POLICY IF EXISTS "Allow anon insert" ON van_calendar_plans;
CREATE POLICY "Allow anon insert" 
ON van_calendar_plans FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update" ON van_calendar_plans;
CREATE POLICY "Allow anon update" 
ON van_calendar_plans FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON van_calendar_plans;
CREATE POLICY "Service role full access" 
ON van_calendar_plans FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify you can now read vans
SELECT COUNT(*) AS total_vans FROM van_db;`;

  const copyToClipboard = () => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(sqlScript)
        .then(() => {
          alert('✅ SQL script copied to clipboard!');
        })
        .catch(() => {
          // Fallback: Show prompt with SQL
          promptCopyFallback();
        });
    } else {
      // Fallback for older browsers or iframe restrictions
      promptCopyFallback();
    }
  };

  const promptCopyFallback = () => {
    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = sqlScript;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    try {
      // Select and try to copy
      textarea.select();
      const successful = document.execCommand('copy');
      
      if (successful) {
        alert('✅ SQL script copied to clipboard!');
      } else {
        // Last resort: Show alert with instructions
        alert('⚠️ Cannot copy automatically.\n\nPlease manually copy the SQL from the gray box below.');
      }
    } catch (err) {
      alert('⚠️ Cannot copy automatically.\n\nPlease manually copy the SQL from the gray box below.');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border-4 border-red-500">
        <div className="p-8 border-b-8 border-red-600 bg-gradient-to-r from-red-500 to-red-600">
          <div className="flex items-center justify-center mb-4">
            <span className="text-7xl">🔒</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-3 text-center uppercase tracking-wide">
            RLS POLICIES MISSING
          </h2>
          <p className="text-xl text-white font-bold text-center">
            Vans exist but app can't read them (Row Level Security blocking)
          </p>
          <div className="mt-4 bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
            <p className="text-white font-semibold text-center text-lg">
              ⏱️ Fix time: <span className="text-2xl font-black">10 SECONDS</span>
            </p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="bg-blue-100 border-4 border-blue-500 rounded-xl p-6 mb-8">
            <div className="flex items-center mb-3">
              <span className="text-4xl mr-3">💡</span>
              <div>
                <p className="text-2xl font-black text-blue-900">
                  THE PROBLEM: RLS Blocking Reads
                </p>
                <p className="text-lg text-blue-800 font-semibold mt-1">
                  Vans exist in database, but app can't access them
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 mt-3 border-2 border-blue-300">
              <p className="text-base text-gray-800 font-medium mb-2">
                <strong className="text-blue-900">Why this happens:</strong>
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>RLS (Row Level Security) is enabled on <code className="bg-blue-100 px-2 py-1 rounded">van_db</code></li>
                <li>But <strong>no policies exist</strong> that allow the app to read data</li>
                <li>Supabase blocks ALL access by default when RLS is on without policies</li>
                <li>App queries return 0 rows even though 19 vans exist</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-start bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-black mr-5 text-2xl shadow-md">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-black text-2xl mb-2 text-blue-900">Open Supabase SQL Editor</h3>
                <p className="text-base text-gray-800 mb-3 font-medium">
                  Go to: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800">https://supabase.com/dashboard</a>
                </p>
                <div className="bg-blue-200 rounded-lg p-3 border-2 border-blue-400">
                  <p className="text-sm font-bold text-blue-900">
                    Select project: <code className="bg-white px-3 py-2 rounded font-mono text-base">mcbbtrrhqweypfnlzwht</code>
                  </p>
                </div>
                <p className="text-base text-gray-800 mt-3 font-medium">
                  Click <strong className="text-blue-900 bg-blue-200 px-2 py-1 rounded">"SQL Editor"</strong> → <strong className="text-blue-900 bg-blue-200 px-2 py-1 rounded">"New Query"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl border-2 border-green-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-green-600 text-white rounded-full flex items-center justify-center font-black mr-5 text-2xl shadow-md">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-black text-2xl mb-4 text-green-900">Copy & Paste RLS Setup</h3>
                <button
                  onClick={copyToClipboard}
                  className="mb-4 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-black shadow-2xl transition-all text-lg flex items-center gap-3 border-4 border-green-800 transform hover:scale-105"
                >
                  <span className="text-3xl">📋</span>
                  COPY RLS POLICY SQL
                </button>
                <div className="bg-gray-900 rounded-xl p-1">
                  <div className="bg-gray-800 text-gray-400 text-xs px-3 py-2 rounded-t flex justify-between items-center">
                    <span className="font-mono">setup_rls_policies.sql</span>
                    <span className="text-green-400 font-bold">✓ Creates read/write policies</span>
                  </div>
                  <pre className="text-gray-100 p-4 text-xs overflow-x-auto max-h-64 font-mono leading-relaxed">
                    {sqlScript}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-start bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-300 shadow-lg">
              <div className="flex-shrink-0 w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center font-black mr-5 text-2xl shadow-md">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-black text-2xl mb-3 text-orange-900">Click RUN & Refresh</h3>
                <div className="space-y-3">
                  <div className="bg-orange-200 rounded-lg p-4 border-2 border-orange-400">
                    <p className="text-base font-bold text-orange-900">
                      1️⃣ Paste SQL → Click <span className="bg-white px-3 py-1 rounded font-black">RUN</span>
                    </p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg border-2 border-green-500">
                    <p className="text-base font-bold text-green-900 mb-2">
                      ✅ Expected Output:
                    </p>
                    <div className="bg-white p-3 rounded border-l-4 border-green-600 text-sm font-mono">
                      <div className="text-green-700 font-bold">total_vans: 19</div>
                      <div className="text-gray-600 mt-1">✓ Policies created successfully</div>
                    </div>
                    <p className="text-sm text-green-800 mt-2 font-semibold">
                      If you see "19", RLS is now working! 🎉
                    </p>
                  </div>
                  <div className="bg-blue-200 rounded-lg p-4 border-2 border-blue-500">
                    <p className="text-base font-bold text-blue-900">
                      2️⃣ Then <span className="bg-white px-3 py-1 rounded font-black text-lg">REFRESH THIS PAGE</span> (F5)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-center border-4 border-green-800 shadow-2xl">
            <p className="text-2xl font-black text-white mb-2">
              ⚡ SUPER QUICK: 10 SECONDS
            </p>
            <p className="text-lg text-white font-bold">
              Just need to setup RLS policies! 🚀
            </p>
          </div>

          <div className="bg-yellow-100 border-4 border-yellow-500 rounded-xl p-6 mt-6">
            <div className="flex items-start">
              <span className="text-3xl mr-3">📚</span>
              <div>
                <p className="text-base text-yellow-900 font-bold mb-2">
                  <strong>What are RLS Policies?</strong>
                </p>
                <p className="text-sm text-yellow-800 font-medium">
                  Row Level Security (RLS) controls who can access data. When enabled without policies, 
                  <strong> nobody can read the data</strong> (even though it exists). 
                  The SQL above creates policies that allow your app's anon key to read/write the van tables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
