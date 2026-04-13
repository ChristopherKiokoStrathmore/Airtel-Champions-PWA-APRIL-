import { useState } from 'react';
import { Search, X, Phone, User, Hash } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

export function PhoneDiagnosticTool({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'name' | 'employee_id'>('phone');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);

    try {
      let query = supabase.from('app_users').select('*');

      if (searchType === 'phone') {
        // Try all phone formats
        const normalized = searchTerm.trim().replace(/[\s\-\(\)]/g, '');
        const variants = [
          searchTerm.trim(),
          normalized,
          '0' + normalized.replace(/^0+/, ''),
          '+254' + normalized.replace(/^0+/, ''),
          '254' + normalized.replace(/^0+/, ''),
          normalized.slice(-9),
          normalized.slice(-8),
          normalized.slice(-7)
        ];

        console.log('Searching for phone variants:', variants);
        
        // Use OR query to search all variants
        const conditions = variants.map(v => `phone_number.ilike.%${v}%`).join(',');
        query = query.or(conditions);
      } else if (searchType === 'name') {
        query = query.ilike('full_name', `%${searchTerm}%`);
      } else {
        query = query.or(`employee_id.ilike.%${searchTerm}%,employee_id.eq.${searchTerm}`);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error('Search error:', error);
        alert('Search failed: ' + error.message);
      } else {
        console.log('Search results:', data);
        setResults(data || []);
        
        if (!data || data.length === 0) {
          alert('No results found. Try searching by name instead.');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Phone className="w-8 h-8" />
                Phone Number Diagnostic Tool
              </h2>
              <p className="text-purple-100 text-sm mt-1">Debug phone number format issues</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Search Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSearchType('phone')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    searchType === 'phone' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </button>
                <button
                  onClick={() => setSearchType('name')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    searchType === 'name' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </button>
                <button
                  onClick={() => setSearchType('employee_id')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    searchType === 'employee_id' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Hash className="w-4 h-4 inline mr-2" />
                  Employee ID
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                {searchType === 'phone' && 'Enter Phone Number (any format)'}
                {searchType === 'name' && 'Enter Full Name'}
                {searchType === 'employee_id' && 'Enter Employee ID'}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    searchType === 'phone' ? '0788539967 or 788539967 or +254788539967' :
                    searchType === 'name' ? 'CAROLYN NYAWADE' :
                    'EMP12345'
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Searching...' : <><Search className="w-4 h-4 inline mr-2" />Search</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 && !loading && (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Enter a search term and click Search</p>
              <div className="mt-6 text-left max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Test:</p>
                <p className="text-sm text-blue-700">
                  1. Select "Full Name"<br/>
                  2. Type: CAROLYN NYAWADE<br/>
                  3. Click Search<br/>
                  4. Check the "Phone Number" column to see the actual format in the database
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Searching database...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-green-900">✅ Found {results.length} user(s)</p>
              </div>

              {results.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Role</p>
                      <p className="font-medium text-gray-700">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone Number (Database Format)</p>
                      <p className="font-mono text-sm bg-yellow-50 border border-yellow-200 px-2 py-1 rounded text-yellow-900">
                        {user.phone_number || 'NULL'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Employee ID</p>
                      <p className="font-mono text-sm text-gray-700">{user.employee_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Zone</p>
                      <p className="text-sm text-gray-700">{user.zone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Region</p>
                      <p className="text-sm text-gray-700">{user.region || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PIN</p>
                      <p className="font-mono text-sm text-gray-700">{user.pin || '1234 (default)'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Points</p>
                      <p className="text-sm font-bold text-purple-600">{user.total_points || 0}</p>
                    </div>
                  </div>

                  {/* Copy Phone Number Button */}
                  <button
                    onClick={() => {
                      const phoneNumber = user.phone_number || '';
                      // Try modern clipboard API first
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(phoneNumber)
                          .then(() => {
                            alert('✅ Phone number copied! Use this exact format to log in: ' + phoneNumber);
                          })
                          .catch(() => {
                            // Fallback: use old method
                            copyToClipboardFallback(phoneNumber);
                          });
                      } else {
                        // Fallback for older browsers or iframe restrictions
                        copyToClipboardFallback(phoneNumber);
                      }
                      
                      function copyToClipboardFallback(text: string) {
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();
                        try {
                          document.execCommand('copy');
                          alert('✅ Phone number copied! Use this exact format to log in: ' + text);
                        } catch (err) {
                          // If all else fails, just show the number
                          prompt('Copy this phone number:', text);
                        }
                        document.body.removeChild(textarea);
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full"
                  >
                    📋 Copy Phone Number ({user.phone_number})
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            This tool searches the database in multiple phone formats to help debug login issues.
          </p>
        </div>
      </div>
    </div>
  );
}
