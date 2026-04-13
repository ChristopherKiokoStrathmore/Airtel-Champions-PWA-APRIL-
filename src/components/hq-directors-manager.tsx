// HQ/Directors Management - Permanent Staff (Not Affected by Excel Uploads)
import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Save, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HQDirector {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  role: 'HQ' | 'Director';
  job_title?: string;
  region?: string;
  is_active: boolean;
  pin: string;
  created_at: string;
}

export function HQDirectorsManager() {
  const [directors, setDirectors] = useState<HQDirector[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<HQDirector>>({
    role: 'HQ',
    is_active: true,
    pin: '1234',
  });

  useEffect(() => {
    loadDirectors();
  }, []);

  const loadDirectors = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/hq-directors`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setDirectors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load HQ/Directors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.full_name || !formData.phone_number || !formData.role) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/hq-directors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        setDirectors([data.data, ...directors]);
        setCreating(false);
        setFormData({ role: 'HQ', is_active: true, pin: '1234' });
      } else {
        alert(`Failed to create: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleUpdate = async (id: string) => {
    const director = directors.find((d) => d.id === id);
    if (!director) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/hq-directors/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(director),
        }
      );

      const data = await response.json();
      if (data.success) {
        setEditing(null);
      } else {
        alert(`Failed to update: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (!confirm) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/hq-directors/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setDirectors(directors.filter((d) => d.id !== id));
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const updateDirector = (id: string, field: keyof HQDirector, value: any) => {
    setDirectors(
      directors.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="opacity-70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">HQ & Directors Management</h1>
          <p className="text-sm opacity-70 mt-1">
            Permanent staff not affected by Excel uploads
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Create Form */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add HQ/Director</h2>
              <button
                onClick={() => setCreating(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone_number || ''}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                  placeholder="+254712345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'HQ' | 'Director' })}
                    className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                  >
                    <option value="HQ">HQ</option>
                    <option value="Director">Director</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">PIN</label>
                  <input
                    type="text"
                    value={formData.pin || '1234'}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                    placeholder="1234"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <input
                  type="text"
                  value={formData.job_title || ''}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                  placeholder="Regional Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <input
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 bg-black/20 rounded-lg border border-white/10"
                  placeholder="Nairobi"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Directors List */}
      <div className="space-y-3">
        {directors.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-2xl p-12 text-center">
            <p className="opacity-50">No HQ/Directors added yet</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              Add First User
            </button>
          </div>
        ) : (
          directors.map((director) => (
            <div
              key={director.id}
              className="bg-[var(--color-surface)] rounded-xl p-4"
            >
              {editing === director.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={director.full_name}
                      onChange={(e) => updateDirector(director.id, 'full_name', e.target.value)}
                      className="px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                      placeholder="Full Name"
                    />
                    <input
                      type="text"
                      value={director.phone_number}
                      onChange={(e) => updateDirector(director.id, 'phone_number', e.target.value)}
                      className="px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                      placeholder="Phone"
                    />
                    <input
                      type="email"
                      value={director.email || ''}
                      onChange={(e) => updateDirector(director.id, 'email', e.target.value)}
                      className="px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                      placeholder="Email"
                    />
                    <select
                      value={director.role}
                      onChange={(e) => updateDirector(director.id, 'role', e.target.value)}
                      className="px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                    >
                      <option value="HQ">HQ</option>
                      <option value="Director">Director</option>
                    </select>
                    <input
                      type="text"
                      value={director.job_title || ''}
                      onChange={(e) => updateDirector(director.id, 'job_title', e.target.value)}
                      className="px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                      placeholder="Job Title"
                    />
                    <input
                      type="text"
                      value={director.region || ''}
                      onChange={(e) => updateDirector(director.id, 'region', e.target.value)}
                      className="px-3 py-2 bg-black/20 rounded-lg border border-white/10"
                      placeholder="Region"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(director.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{director.full_name}</p>
                    <p className="text-sm opacity-70">{director.phone_number}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {director.role}
                      </span>
                      {director.job_title && (
                        <span className="text-xs opacity-70">{director.job_title}</span>
                      )}
                      {director.region && (
                        <span className="text-xs opacity-70">• {director.region}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(director.id)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(director.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
