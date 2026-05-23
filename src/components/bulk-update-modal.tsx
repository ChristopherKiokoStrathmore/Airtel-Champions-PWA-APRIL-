import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

interface BulkUpdateModalProps {
  users: any[];
  onClose: () => void;
  onSave: () => void;
}

export function BulkUpdateModal({ users, onClose, onSave }: BulkUpdateModalProps) {
  const [updateMode, setUpdateMode] = useState<'paste' | 'csv'>('paste');
  const [bulkData, setBulkData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [previewData, setPreviewData] = useState<Array<{
    name: string;
    phone: string;
    matched: boolean;
    userId?: string;
  }>>([]);

  // Get unique roles
  const roles = Array.from(new Set(users.map(u => u.role).filter(Boolean)));
  
  // Filter users by selected role
  const filteredUsers = selectedRole ? users.filter(u => u.role === selectedRole) : users;

  // Parse the pasted/uploaded data
  const handlePreview = () => {
    const lines = bulkData.trim().split('\n').filter(line => line.trim());
    const parsed: Array<{ name: string; phone: string; matched: boolean; userId?: string }> = [];

    lines.forEach(line => {
      // Support multiple formats:
      // 1. "Name, Phone" or "Name,Phone"
      // 2. "Name\tPhone" (tab-separated)
      // 3. "Name | Phone"
      let name = '';
      let phone = '';

      if (line.includes('\t')) {
        [name, phone] = line.split('\t').map(s => s.trim());
      } else if (line.includes('|')) {
        [name, phone] = line.split('|').map(s => s.trim());
      } else if (line.includes(',')) {
        [name, phone] = line.split(',').map(s => s.trim());
      } else {
        // Try to split by whitespace (last word is phone)
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          phone = parts[parts.length - 1];
          name = parts.slice(0, -1).join(' ');
        }
      }

      // Clean phone number (remove any non-digit characters except +)
      phone = phone.replace(/[^\d+]/g, '');

      // Try to match user by name (case-insensitive, fuzzy match)
      const matchedUser = filteredUsers.find(u => {
        const userName = u.full_name?.toLowerCase() || '';
        const inputName = name.toLowerCase();
        // Exact match or contains
        return userName === inputName || 
               userName.includes(inputName) || 
               inputName.includes(userName);
      });

      parsed.push({
        name,
        phone,
        matched: !!matchedUser,
        userId: matchedUser?.id
      });
    });

    setPreviewData(parsed);
  };

  const handleBulkUpdate = async () => {
    if (previewData.length === 0) {
      alert('❌ Please preview the data first');
      return;
    }

    const matchedItems = previewData.filter(item => item.matched);
    if (matchedItems.length === 0) {
      alert('❌ No users matched. Please check the names and try again.');
      return;
    }

    if (!confirm(`Update phone numbers for ${matchedItems.length} users?`)) {
      return;
    }

    setProcessing(true);
    const errors: string[] = [];
    let successCount = 0;

    for (const item of matchedItems) {
      try {
        const { error } = await supabase
          .from('app_users')
          .update({ phone_number: item.phone })
          .eq('id', item.userId);

        if (error) throw error;
        successCount++;
      } catch (err: any) {
        console.error(`Failed to update ${item.name}:`, err);
        errors.push(`${item.name}: ${err.message}`);
      }
    }

    setResults({
      success: successCount,
      failed: errors.length,
      errors
    });
    setProcessing(false);

    if (errors.length === 0) {
      setTimeout(() => {
        onSave();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">📋 Bulk Update Phone Numbers</h2>
            <p className="text-purple-100 text-sm mt-1">Update multiple users at once</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Role Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Role (Optional):
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Users ({users.length})</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} 
                  ({users.filter(u => u.role === role).length})
                </option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📝 How to use:</h3>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Optionally filter by role above</li>
              <li>Paste data in format: <code className="bg-blue-100 px-1 rounded">Name, Phone</code></li>
              <li>Supports comma, tab, or pipe (|) separated values</li>
              <li>Click "Preview" to check matching</li>
              <li>Review and click "Update All" to save</li>
            </ol>
            <p className="text-xs text-blue-700 mt-2">
              💡 Example: <code className="bg-blue-100 px-1 rounded">John Kamau, 0712345678</code> or <code className="bg-blue-100 px-1 rounded">Jane Wanjiru | 0723456789</code>
            </p>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paste User Data:
            </label>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="John Kamau, 0712345678&#10;Jane Wanjiru, 0723456789&#10;Peter Omondi, 0734567890"
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              disabled={processing}
            />
          </div>

          {/* Preview Button */}
          {bulkData && !results && (
            <div className="mb-6">
              <button
                onClick={handlePreview}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                disabled={processing}
              >
                👁️ Preview Matches
              </button>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && !results && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Preview ({previewData.filter(p => p.matched).length}/{previewData.length} matched)
              </h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phone Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((item, idx) => (
                        <tr key={idx} className={item.matched ? 'bg-white' : 'bg-red-50'}>
                          <td className="px-4 py-3 text-sm">
                            {item.matched ? (
                              <span className="text-green-600 font-semibold">✅ Match</span>
                            ) : (
                              <span className="text-red-600 font-semibold">❌ No Match</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-sm font-mono">{item.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`rounded-xl p-6 ${results.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className="font-semibold text-lg mb-3">
                {results.failed === 0 ? '✅ Update Complete!' : '⚠️ Update Completed with Errors'}
              </h3>
              <p className="text-sm mb-2">
                <span className="text-green-700 font-semibold">{results.success} successful</span>
                {results.failed > 0 && <>, <span className="text-red-700 font-semibold">{results.failed} failed</span></>}
              </p>
              {results.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Errors:</p>
                  <div className="bg-white rounded-lg p-3 max-h-40 overflow-y-auto">
                    {results.errors.map((err, idx) => (
                      <p key={idx} className="text-xs text-red-600 mb-1">• {err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            disabled={processing}
          >
            {results ? 'Close' : 'Cancel'}
          </button>
          {previewData.length > 0 && !results && (
            <button
              onClick={handleBulkUpdate}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processing || previewData.filter(p => p.matched).length === 0}
            >
              {processing ? '⏳ Updating...' : `✅ Update ${previewData.filter(p => p.matched).length} Users`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
