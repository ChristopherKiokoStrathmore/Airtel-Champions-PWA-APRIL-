import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { generateEmployeeId } from '../lib/employee-id-generator';

// User type definition
interface User {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  employee_id?: string;
  role: string;
  zone?: string;
  region?: string;
  zsm?: string;
  zbm?: string;
  total_points?: number;
  pin?: string;
  job_title?: string;
}

export function UserEditModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState<User>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [zsmUsers, setZsmUsers] = useState<User[]>([]);
  const [zbmUsers, setZbmUsers] = useState<User[]>([]);
  const [loadingZsms, setLoadingZsms] = useState(true);
  const [loadingZbms, setLoadingZbms] = useState(true);

  // Fetch all ZSM users
  useEffect(() => {
    const fetchZsms = async () => {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('id, full_name, zone, zbm')
          .eq('role', 'zonal_sales_manager')
          .order('full_name');
        
        if (error) throw error;
        setZsmUsers(data || []);
      } catch (err) {
        console.error('Error fetching ZSMs:', err);
      } finally {
        setLoadingZsms(false);
      }
    };
    fetchZsms();
  }, []);

  // Fetch all ZBM users with zone information
  useEffect(() => {
    const fetchZbms = async () => {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('id, full_name, zone')
          .eq('role', 'zonal_business_manager')
          .order('full_name');
        
        if (error) throw error;
        setZbmUsers(data || []);
      } catch (err) {
        console.error('Error fetching ZBMs:', err);
      } finally {
        setLoadingZbms(false);
      }
    };
    fetchZbms();
  }, []);

  // Handle ZSM selection and auto-populate Zone and ZBM
  const handleZsmChange = (zsmName: string) => {
    const selectedZsm = zsmUsers.find(zsm => zsm.full_name === zsmName);
    if (selectedZsm) {
      setFormData(prev => ({
        ...prev,
        zsm: zsmName,
        zone: selectedZsm.zone || '',
        zbm: selectedZsm.zbm || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, zsm: '' }));
    }
  };

  // Handle ZBM selection and auto-populate Zone (for ZSM users)
  const handleZbmChange = (zbmName: string) => {
    const selectedZbm = zbmUsers.find(zbm => zbm.full_name === zbmName);
    if (selectedZbm) {
      setFormData(prev => ({
        ...prev,
        zbm: zbmName,
        zone: selectedZbm.zone || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, zbm: '' }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          employee_id: formData.employee_id,
          role: formData.role,
          zone: formData.zone,
          region: formData.region,
          zsm: formData.zsm,
          zbm: formData.zbm,
          job_title: formData.job_title || null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      console.log(`[Analytics] User Updated: ${formData.full_name} by Developer`);
      alert('✅ User updated successfully!');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">✏️ Edit User</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="John Doe"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="712345678"
              />
              <p className="text-xs text-gray-500 mt-1">9 digits without country code</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="john.doe@airtel.co.ke"
              />
            </div>

            {/* Employee ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
              <input
                type="text"
                value={formData.employee_id || ''}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="SE001"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="sales_executive">Sales Executive</option>
                <option value="zonal_sales_manager">Zonal Sales Manager</option>
                <option value="zonal_business_manager">Zonal Business Manager</option>
                <option value="hq_staff">HQ Command Center</option>
                <option value="director">Director</option>
                <option value="developer">Developer</option>
              </select>
            </div>

            {/* ZSM */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zonal Sales Manager (ZSM)
                {formData.zsm && <span className="ml-2 text-xs font-normal text-blue-600">✨ Auto-fills Zone & ZBM</span>}
              </label>
              <select
                value={formData.zsm || ''}
                onChange={(e) => handleZsmChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loadingZsms}
              >
                <option value="">-- Select ZSM (Optional) --</option>
                {zsmUsers.map((zsm) => (
                  <option key={zsm.id} value={zsm.full_name}>
                    {zsm.full_name} {zsm.zone && `(${zsm.zone})`}
                  </option>
                ))}
              </select>
              {loadingZsms && (
                <p className="text-xs text-gray-500 mt-1">Loading ZSMs...</p>
              )}
            </div>

            {/* ZBM - Show first for ZSM role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zonal Business Manager (ZBM)
                {formData.zsm && <span className="ml-2 text-xs font-normal text-blue-600">🔒 Auto-filled from ZSM</span>}
                {formData.role === 'zonal_sales_manager' && !formData.zsm && <span className="ml-2 text-xs font-normal text-purple-600">✨ Auto-fills Zone</span>}
              </label>
              {formData.role === 'zonal_sales_manager' && !formData.zsm ? (
                <select
                  value={formData.zbm || ''}
                  onChange={(e) => handleZbmChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loadingZbms}
                >
                  <option value="">-- Select ZBM (Optional) --</option>
                  {zbmUsers.map((zbm) => (
                    <option key={zbm.id} value={zbm.full_name}>
                      {zbm.full_name} {zbm.zone && `(${zbm.zone})`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.zbm || ''}
                  onChange={(e) => setFormData({ ...formData, zbm: e.target.value })}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${formData.zsm ? 'bg-blue-50' : ''}`}
                  placeholder="ZBM Name"
                  readOnly={!!formData.zsm}
                />
              )}
              {formData.zsm && (
                <p className="text-xs text-blue-600 mt-1">⚡ Automatically filled from selected ZSM</p>
              )}
              {formData.role === 'zonal_sales_manager' && !formData.zsm && loadingZbms && (
                <p className="text-xs text-gray-500 mt-1">Loading ZBMs...</p>
              )}
            </div>

            {/* Zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zone
                {formData.zsm && <span className="ml-2 text-xs font-normal text-blue-600">🔒 Auto-filled from ZSM</span>}
                {formData.role === 'zonal_sales_manager' && formData.zbm && !formData.zsm && <span className="ml-2 text-xs font-normal text-purple-600">🔒 Auto-filled from ZBM</span>}
              </label>
              <input
                type="text"
                value={formData.zone || ''}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${formData.zsm || (formData.role === 'zonal_sales_manager' && formData.zbm) ? 'bg-blue-50' : ''}`}
                placeholder="Nairobi West"
                readOnly={!!formData.zsm || (formData.role === 'zonal_sales_manager' && !!formData.zbm)}
              />
              {formData.zsm && (
                <p className="text-xs text-blue-600 mt-1">⚡ Automatically filled from selected ZSM</p>
              )}
              {formData.role === 'zonal_sales_manager' && formData.zbm && !formData.zsm && (
                <p className="text-xs text-purple-600 mt-1">⚡ Automatically filled from selected ZBM</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
              <input
                type="text"
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nairobi"
              />
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title (Optional)</label>
              <input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Sales Executive"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.full_name || !formData.phone_number}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              '💾 Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserCreateModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState<Partial<User>>({
    full_name: '',
    phone_number: '',
    email: '',
    employee_id: '',
    role: 'sales_executive',
    zone: '',
    region: '',
    zsm: '',
    zbm: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [zsmUsers, setZsmUsers] = useState<User[]>([]);
  const [zbmUsers, setZbmUsers] = useState<User[]>([]);
  const [loadingZsms, setLoadingZsms] = useState(true);
  const [loadingZbms, setLoadingZbms] = useState(true);

  // Fetch all ZSM users
  useEffect(() => {
    const fetchZsms = async () => {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('id, full_name, zone, zbm')
          .eq('role', 'zonal_sales_manager')
          .order('full_name');
        
        if (error) throw error;
        setZsmUsers(data || []);
      } catch (err) {
        console.error('Error fetching ZSMs:', err);
      } finally {
        setLoadingZsms(false);
      }
    };
    fetchZsms();
  }, []);

  // Fetch all ZBM users with zone information
  useEffect(() => {
    const fetchZbms = async () => {
      try {
        const { data, error } = await supabase
          .from('app_users')
          .select('id, full_name, zone')
          .eq('role', 'zonal_business_manager')
          .order('full_name');
        
        if (error) throw error;
        setZbmUsers(data || []);
      } catch (err) {
        console.error('Error fetching ZBMs:', err);
      } finally {
        setLoadingZbms(false);
      }
    };
    fetchZbms();
  }, []);

  // Auto-generate employee ID when role changes
  useEffect(() => {
    const generateId = async () => {
      if (formData.role) {
        setIsGeneratingId(true);
        const newId = await generateEmployeeId(formData.role);
        setFormData(prev => ({ ...prev, employee_id: newId }));
        setIsGeneratingId(false);
      }
    };
    generateId();
  }, [formData.role]);

  // Handle ZSM selection and auto-populate Zone and ZBM
  const handleZsmChange = (zsmName: string) => {
    const selectedZsm = zsmUsers.find(zsm => zsm.full_name === zsmName);
    if (selectedZsm) {
      setFormData(prev => ({
        ...prev,
        zsm: zsmName,
        zone: selectedZsm.zone || '',
        zbm: selectedZsm.zbm || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, zsm: '' }));
    }
  };

  // Handle ZBM selection and auto-populate Zone (for ZSM users)
  const handleZbmChange = (zbmName: string) => {
    const selectedZbm = zbmUsers.find(zbm => zbm.full_name === zbmName);
    if (selectedZbm) {
      setFormData(prev => ({
        ...prev,
        zbm: zbmName,
        zone: selectedZbm.zone || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, zbm: '' }));
    }
  };

  const handleCreate = async () => {
    if (!formData.full_name || !formData.phone_number) {
      setError('Name and phone number are required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Remove pin field from insert - it doesn't exist in database
      // Also explicitly set select to '*' to avoid schema cache issues
      const { error: insertError, data } = await supabase
        .from('app_users')
        .insert([{
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          employee_id: formData.employee_id || null,
          role: formData.role || 'sales_executive',
          zone: formData.zone || null,
          region: formData.region || null,
          zsm: formData.zsm || null,
          zbm: formData.zbm || null,
          total_points: 0
        }])
        .select();

      if (insertError) throw insertError;

      console.log(`[Analytics] User Created: ${formData.full_name} (${formData.employee_id}) by Developer`);
      alert('✅ User created successfully!');
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Create error:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">➕ Create New User</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="712345678"
              />
              <p className="text-xs text-gray-500 mt-1">9 digits without country code</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="john.doe@airtel.co.ke"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee ID 
                <span className="ml-2 text-xs font-normal text-green-600">✨ Auto-generated</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.employee_id}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none text-gray-700 font-mono font-semibold"
                  placeholder="Auto-generating..."
                />
                {isGeneratingId && (
                  <div className="absolute right-3 top-3.5">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Generated based on role. Changes when you change the role.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="sales_executive">Sales Executive</option>
                <option value="zonal_sales_manager">Zonal Sales Manager</option>
                <option value="zonal_business_manager">Zonal Business Manager</option>
                <option value="hq_staff">HQ Command Center</option>
                <option value="director">Director</option>
                <option value="developer">Developer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zonal Sales Manager (ZSM)
                {formData.zsm && <span className="ml-2 text-xs font-normal text-green-600">✨ Auto-fills Zone & ZBM</span>}
              </label>
              <select
                value={formData.zsm}
                onChange={(e) => handleZsmChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loadingZsms}
              >
                <option value="">-- Select ZSM (Optional) --</option>
                {zsmUsers.map((zsm) => (
                  <option key={zsm.id} value={zsm.full_name}>
                    {zsm.full_name} {zsm.zone && `(${zsm.zone})`}
                  </option>
                ))}
              </select>
              {loadingZsms && (
                <p className="text-xs text-gray-500 mt-1">Loading ZSMs...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zonal Business Manager (ZBM)
                {formData.zsm && <span className="ml-2 text-xs font-normal text-blue-600">🔒 Auto-filled from ZSM</span>}
                {formData.role === 'zonal_sales_manager' && !formData.zsm && <span className="ml-2 text-xs font-normal text-green-600">✨ Auto-fills Zone</span>}
              </label>
              {formData.role === 'zonal_sales_manager' && !formData.zsm ? (
                <select
                  value={formData.zbm}
                  onChange={(e) => handleZbmChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loadingZbms}
                >
                  <option value="">-- Select ZBM (Optional) --</option>
                  {zbmUsers.map((zbm) => (
                    <option key={zbm.id} value={zbm.full_name}>
                      {zbm.full_name} {zbm.zone && `(${zbm.zone})`}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.zbm}
                  onChange={(e) => setFormData({ ...formData, zbm: e.target.value })}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${formData.zsm ? 'bg-blue-50' : ''}`}
                  placeholder="John Doe"
                  readOnly={!!formData.zsm}
                />
              )}
              {formData.zsm && (
                <p className="text-xs text-blue-600 mt-1">⚡ Automatically filled from selected ZSM</p>
              )}
              {formData.role === 'zonal_sales_manager' && !formData.zsm && loadingZbms && (
                <p className="text-xs text-gray-500 mt-1">Loading ZBMs...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Zone
                {formData.zsm && <span className="ml-2 text-xs font-normal text-blue-600">🔒 Auto-filled from ZSM</span>}
                {formData.role === 'zonal_sales_manager' && formData.zbm && !formData.zsm && <span className="ml-2 text-xs font-normal text-green-600">🔒 Auto-filled from ZBM</span>}
              </label>
              <input
                type="text"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${formData.zsm || (formData.role === 'zonal_sales_manager' && formData.zbm) ? 'bg-blue-50' : ''}`}
                placeholder="Nairobi West"
                readOnly={!!formData.zsm || (formData.role === 'zonal_sales_manager' && !!formData.zbm)}
              />
              {formData.zsm && (
                <p className="text-xs text-blue-600 mt-1">⚡ Automatically filled from selected ZSM</p>
              )}
              {formData.role === 'zonal_sales_manager' && formData.zbm && !formData.zsm && (
                <p className="text-xs text-green-600 mt-1">⚡ Automatically filled from selected ZBM</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nairobi"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isSaving || !formData.full_name || !formData.phone_number}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              '✨ Create User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserDeleteConfirmModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      console.log(`[Analytics] User Deleted: ${user.full_name} by Developer`);
      alert('✅ User deleted successfully');
      onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-2xl">
          <h3 className="text-xl font-semibold">⚠️ Delete User</h3>
        </div>

        <div className="p-6">
          <p className="text-gray-800 mb-4">
            Are you sure you want to delete <strong>{user.full_name}</strong>?
          </p>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Warning:</strong> This action cannot be undone. All user data, submissions, and points will be permanently deleted.
            </p>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type <code className="bg-gray-100 px-2 py-1 rounded">DELETE</code> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== 'DELETE'}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              '🗑️ Delete User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}