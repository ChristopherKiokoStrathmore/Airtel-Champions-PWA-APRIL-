import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, RefreshCw, Database, Search } from 'lucide-react';

export function VanDataViewer({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [vans, setVans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [userZone, setUserZone] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get current user zone from localStorage (direct DB mode)
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUserZone(userData?.region || null);
      }

      // 2. Fetch all vans without filtering
      const { data, error } = await supabase
        .from('van_db')
        .select('*')
        .limit(100);

      if (error) throw error;

      setVans(data || []);
      if (data && data.length > 0) {
        setColumns(Object.keys(data[0]));
      }
    } catch (err: any) {
      console.error('Error fetching vans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Van Database Debugger</h2>
              <p className="text-xs text-gray-500">Inspecting table: <code className="bg-gray-200 px-1 rounded">van_db</code></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Diagnostic Info */}
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
          <div className="mt-1 text-blue-500">
            <Search className="w-4 h-4" />
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-semibold">Diagnostic Information:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Current User Zone: <strong>{userZone || 'Not detected'}</strong></li>
              <li>Total Rows Fetched: <strong>{vans.length}</strong></li>
              <li>Zone Column Found: <strong>{columns.includes('zone') ? 'Yes (zone)' : columns.includes('ZONE') ? 'Yes (ZONE)' : columns.includes('Region') ? 'Yes (Region)' : 'No'}</strong></li>
            </ul>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-500">Loading van data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <Database className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 max-w-md mx-auto">{error}</p>
              {error.includes('does not exist') && (
                <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs font-mono">
                  <p className="mb-2">⚠️ The table 'van_db' might not exist.</p>
                  <p>Please run the SQL setup script in your Supabase Dashboard.</p>
                </div>
              )}
            </div>
          ) : vans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500">No vans found in the database.</p>
              <p className="text-xs text-gray-400 mt-2">The table exists but is empty.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="p-3 font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vans.map((van, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="p-3 text-gray-700 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                        {typeof van[col] === 'object' ? JSON.stringify(van[col]) : String(van[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
          <div className="text-xs text-gray-400">
            Showing first 100 records
          </div>
        </div>
      </div>
    </div>
  );
}