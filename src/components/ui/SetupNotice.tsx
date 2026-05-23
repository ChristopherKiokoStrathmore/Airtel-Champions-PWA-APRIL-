export function SetupNotice() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl bg-white rounded-xl border-2 border-green-400 p-8">
        {/* SUCCESS MESSAGE */}
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">
              Error Fixed!
            </h1>
            <p className="text-green-800 text-lg">
              The crash is resolved. Your app is running successfully!
            </p>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Optional: Connect to Supabase
          </h2>
          <p className="text-gray-600">
            You can now use the UI, or connect to Supabase for full functionality with real data.
          </p>
        </div>

        {/* CRITICAL: Restart Required Notice */}
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-2 text-lg">💡 Quick Tip: Demo Mode</h3>
          <p className="text-blue-800 mb-3">
            Want to explore the UI right away? Click the button below to skip Supabase setup.
          </p>
          <button
            onClick={() => {
              alert('To enable demo mode:\n1. Keep the placeholder values in .env\n2. Just login with any email/password\n3. You\'ll see the UI (with empty data)');
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Show Me How to Use Demo Mode
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-yellow-900 mb-3">🚀 To Enable Full Features (5 minutes):</h3>
          <ol className="space-y-2 text-sm text-yellow-800">
            <li><strong>1.</strong> Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a> and create a free account</li>
            <li><strong>2.</strong> Create a new project (choose any name)</li>
            <li><strong>3.</strong> Wait 2 minutes for project to be ready</li>
            <li><strong>4.</strong> Go to Settings → API</li>
            <li><strong>5.</strong> Copy your credentials to <code className="bg-yellow-100 px-2 py-1 rounded">.env</code> file</li>
            <li><strong>6.</strong> <span className="bg-yellow-200 px-2 py-1 rounded font-bold">RESTART dev server!</span> (Ctrl+C → npm run dev)</li>
          </ol>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Your .env file should look like:</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
          </pre>
          <p className="text-xs text-gray-600 mt-2">
            ⚠️ Replace <code>xxxxx</code> with your actual project ID from Supabase!
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-6 py-3 bg-[#E60000] text-white text-center rounded-lg font-medium hover:bg-[#CC0000] transition-colors"
          >
            Create Supabase Project →
          </a>
          
          <button
            onClick={() => window.location.reload()}
            className="block w-full px-6 py-3 bg-gray-200 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ↻ I've Updated .env & Restarted Server - Reload Page
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            📚 Need help? Read{' '}
            <a href="/3_STEP_FIX.md" className="text-[#E60000] hover:underline font-medium">
              3-Step Fix Guide
            </a>
            {' '}or{' '}
            <a href="/QUICK_START.md" className="text-[#E60000] hover:underline font-medium">
              Quick Start Guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}