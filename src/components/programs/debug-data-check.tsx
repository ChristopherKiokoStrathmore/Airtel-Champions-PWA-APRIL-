// Debug component to check what data is in the database
import { useState } from 'react';
import { kvStore, programsAPI, initializeSampleProgram } from '../../utils/supabase-direct';

export function DebugDataCheck() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkData = async () => {
    setChecking(true);
    try {
      const results: any = {
        programs: [],
        fields: [],
        errors: [],
      };

      // 1. Check all programs
      try {
        const programsData = await kvStore.getByPrefix('programs:');
        results.programs = programsData.map(item => ({
          key: item.key,
          value: JSON.parse(item.value),
        }));
      } catch (err: any) {
        results.errors.push(`Programs error: ${err.message}`);
      }

      // 2. Check all fields
      try {
        const fieldsData = await kvStore.getByPrefix('program_fields:');
        results.fields = fieldsData.map(item => ({
          key: item.key,
          value: JSON.parse(item.value),
        }));
      } catch (err: any) {
        results.errors.push(`Fields error: ${err.message}`);
      }

      // 3. Try to get specific program
      try {
        const testProgram = await programsAPI.getProgram('ashish-test-3-que');
        results.testProgram = testProgram;
      } catch (err: any) {
        results.errors.push(`Test program error: ${err.message}`);
      }

      setResults(results);
    } catch (err: any) {
      setResults({ error: err.message });
    } finally {
      setChecking(false);
    }
  };

  const initializeData = async () => {
    setChecking(true);
    try {
      await initializeSampleProgram();
      alert('Sample program initialized!');
      await checkData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className="bg-white shadow-lg rounded-lg p-4 max-w-md border-2 border-red-500">
        <h3 className="font-bold mb-2 text-red-600">🔧 Debug Panel</h3>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={checkData}
            disabled={checking}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 text-sm"
          >
            {checking ? 'Checking...' : 'Check Data'}
          </button>
          
          <button
            onClick={initializeData}
            disabled={checking}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 text-sm"
          >
            Initialize Sample
          </button>
        </div>

        <div className="text-xs bg-yellow-50 border border-yellow-300 p-2 rounded mb-2">
          ⚠️ If you see permission errors, run:<br/>
          <code className="bg-gray-100 px-1">/database/ONE-CLICK-FIX.sql</code><br/>
          in Supabase SQL Editor
        </div>

        {results && (
          <div className="space-y-2 max-h-96 overflow-y-auto text-xs">
            <div>
              <strong>Programs ({results.programs?.length || 0}):</strong>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(results.programs, null, 2)}
              </pre>
            </div>

            <div>
              <strong>Fields ({results.fields?.length || 0}):</strong>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(results.fields, null, 2)}
              </pre>
            </div>

            {results.testProgram && (
              <div>
                <strong>Test Program:</strong>
                <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(results.testProgram, null, 2)}
                </pre>
              </div>
            )}

            {results.errors?.length > 0 && (
              <div>
                <strong className="text-red-600">Errors:</strong>
                <ul className="text-red-600 bg-red-50 p-2 rounded">
                  {results.errors.map((err: string, i: number) => (
                    <li key={i}>❌ {err}</li>
                  ))}
                  <li className="mt-2 text-black">
                    <strong>Fix:</strong> Run /database/ONE-CLICK-FIX.sql
                  </li>
                </ul>
              </div>
            )}

            {results.error && (
              <div className="text-red-600 bg-red-50 p-2 rounded">
                ❌ {results.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}