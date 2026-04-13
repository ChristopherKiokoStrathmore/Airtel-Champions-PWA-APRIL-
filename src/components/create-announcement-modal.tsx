import React, { useState } from 'react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

export function CreateAnnouncementModal({ isOpen, onClose, userData }: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [targetRoles, setTargetRoles] = useState<string[]>(['sales_executive']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log('[CreateAnnouncementModal] 🚀 Using localStorage (NOT server) - v2');
    
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    if (targetRoles.length === 0) {
      setError('Please select at least one target audience');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const announcementId = `announcement_${Date.now()}_${userData?.id}`;

      // Create announcement object
      const announcement = {
        id: announcementId,
        created_by: userData?.id,
        created_by_name: userData?.full_name || 'Anonymous',
        created_by_role: userData?.role,
        title: title.trim() || null,
        message: message.trim(),
        priority,
        target_roles: targetRoles,
        announcement_type: 'text',
        is_active: true,
        read_by: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in localStorage
      const existingAnnouncements = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
      existingAnnouncements.push(announcement);
      localStorage.setItem('tai_announcements', JSON.stringify(existingAnnouncements));

      console.log('[Announcements] Created:', announcement);
      
      // Show success
      setSuccess(true);
      
      // Reset form after 1.5 seconds and close
      setTimeout(() => {
        setTitle('');
        setMessage('');
        setPriority('normal');
        setTargetRoles(['sales_executive']);
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating announcement:', err);
      setError(err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter(r => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  📢
                </div>
                <div>
                  <h2 className="text-lg font-bold">Create Announcement</h2>
                  <p className="text-xs text-red-100">Send a message to your team</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-scale-in">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-green-900">Announcement Sent!</p>
                  <p className="text-xs text-green-700">Your message has been delivered to the team</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!success && (
              <>
                {/* Title (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Q1 Targets Achieved!"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement message here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'normal', label: 'Normal', icon: '📝', color: 'gray' },
                      { value: 'high', label: 'High', icon: '⚡', color: 'orange' },
                      { value: 'urgent', label: 'Urgent', icon: '🔥', color: 'red' }
                    ].map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPriority(p.value as any)}
                        className={`flex-1 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
                          priority === p.value
                            ? `border-${p.color}-500 bg-${p.color}-50 text-${p.color}-700`
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-1">{p.icon}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                  <div className="space-y-2">
                    {[
                      { value: 'sales_executive', label: 'Sales Executives', icon: '👤' },
                      { value: 'zonal_sales_manager', label: 'Zone Sales Managers', icon: '👔' },
                      { value: 'zonal_business_manager', label: 'Zonal Business Managers', icon: '💼' },
                      { value: 'hq_staff', label: 'HQ Command Center', icon: '🏢' },
                      { value: 'hq_command_center', label: 'HQ Team', icon: '🏢' },
                      { value: 'director', label: 'Directors', icon: '👑' }
                    ].map((role) => (
                      <label
                        key={role.value}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                          targetRoles.includes(role.value)
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={targetRoles.includes(role.value)}
                          onChange={() => toggleRole(role.value)}
                          className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-2xl">{role.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !message.trim() || targetRoles.length === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    📢 Send Announcement
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}