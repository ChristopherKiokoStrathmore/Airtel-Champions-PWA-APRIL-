import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface Program {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  points: number;
  active: boolean;
  created_at: string;
}

interface ProgramManagementProps {
  onBack: () => void;
}

export function ProgramManagementScreen({ onBack }: ProgramManagementProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setPrograms(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading programs:', error);
      setLoading(false);
    }
  };

  const handleAddProgram = () => {
    setEditingProgram(null);
    setShowAddModal(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setShowAddModal(true);
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      // Reload programs
      loadPrograms();
      alert('✅ Program deleted successfully!');
    } catch (error: any) {
      alert(`❌ Error deleting program: ${error.message}`);
    }
  };

  const handleToggleActive = async (program: Program) => {
    try {
      const { error } = await supabase
        .from('programs')
        .update({ active: !program.active })
        .eq('id', program.id);

      if (error) throw error;

      // Reload programs
      loadPrograms();
    } catch (error: any) {
      alert(`❌ Error updating program: ${error.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl">Program Management</h2>
              <p className="text-sm opacity-90">Manage intelligence categories</p>
            </div>
          </div>
          <button
            onClick={handleAddProgram}
            className="px-4 py-2 bg-white text-red-600 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            + ADD NEW
          </button>
        </div>
      </div>

      {/* Programs List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl mb-2">No Programs Yet</h3>
            <p className="text-gray-600 mb-4">Create your first intelligence program to get started</p>
            <button
              onClick={handleAddProgram}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              + Create Program
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => (
              <div
                key={program.id}
                className={`bg-white rounded-xl p-4 border-2 ${
                  program.active ? 'border-green-200' : 'border-gray-200'
                } transition-all`}
              >
                <div className="flex items-start">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl mr-4 ${program.color}`}>
                    {program.icon}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{program.name}</h4>
                        <p className="text-sm text-gray-600">{program.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Active/Inactive Badge */}
                        <button
                          onClick={() => handleToggleActive(program)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            program.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {program.active ? '✅ Active' : '⏸️ Inactive'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-yellow-600">⭐ {program.points} points</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleEditProgram(program)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <ProgramModal
          program={editingProgram}
          onClose={() => {
            setShowAddModal(false);
            setEditingProgram(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingProgram(null);
            loadPrograms();
          }}
        />
      )}
    </div>
  );
}

interface ProgramModalProps {
  program: Program | null;
  onClose: () => void;
  onSave: () => void;
}

function ProgramModal({ program, onClose, onSave }: ProgramModalProps) {
  const [name, setName] = useState(program?.name || '');
  const [description, setDescription] = useState(program?.description || '');
  const [icon, setIcon] = useState(program?.icon || '📊');
  const [points, setPoints] = useState(program?.points || 10);
  const [color, setColor] = useState(program?.color || 'bg-blue-50 border-blue-200 text-blue-600');
  const [active, setActive] = useState(program?.active !== false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableIcons = ['📶', '🎯', '🚀', '🏢', '💰', '📊', '🔍', '📞', '🌐', '⚡', '🏆', '📱', '💡', '🛡️', '🎉'];
  const availableColors = [
    { name: 'Blue', value: 'bg-blue-50 border-blue-200 text-blue-600' },
    { name: 'Green', value: 'bg-green-50 border-green-200 text-green-600' },
    { name: 'Purple', value: 'bg-purple-50 border-purple-200 text-purple-600' },
    { name: 'Orange', value: 'bg-orange-50 border-orange-200 text-orange-600' },
    { name: 'Red', value: 'bg-red-50 border-red-200 text-red-600' },
    { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
    { name: 'Pink', value: 'bg-pink-50 border-pink-200 text-pink-600' },
    { name: 'Indigo', value: 'bg-indigo-50 border-indigo-200 text-indigo-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (program) {
        // Update existing program
        console.log('[ProgramModal] Updating program:', { id: program.id, name });
        
        const { error: updateError } = await supabase
          .from('programs')
          .update({
            name,
            description,
            icon,
            points,
            color,
            active,
          })
          .eq('id', program.id);

        if (updateError) {
          console.error('[ProgramModal] Update error:', updateError);
          throw updateError;
        }
        
        console.log('[ProgramModal] ✅ Program updated successfully');
        alert('✅ Program updated successfully!');
      } else {
        // Create new program
        console.log('[ProgramModal] Creating new program:', { name });
        
        const { error: insertError } = await supabase
          .from('programs')
          .insert({
            name,
            description,
            icon,
            points,
            color,
            active,
          });

        if (insertError) {
          console.error('[ProgramModal] Insert error:', insertError);
          throw insertError;
        }
        
        console.log('[ProgramModal] ✅ Program created successfully');
        alert('✅ Program created successfully!');
      }

      onSave();
    } catch (err: any) {
      console.error('[ProgramModal] Error:', err);
      setError(err.message || 'Failed to save program');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-xl">{program ? 'Edit Program' : 'Add New Program'}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">Program Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Network Experience"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this program tracks..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">Icon *</label>
            <div className="grid grid-cols-8 gap-2">
              {availableIcons.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    icon === i
                      ? 'bg-red-100 border-2 border-red-600 scale-110'
                      : 'bg-gray-100 border-2 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">Color Theme *</label>
            <div className="grid grid-cols-4 gap-2">
              {availableColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${c.value} ${
                    color === c.value ? 'scale-105 ring-2 ring-red-600' : ''
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm mb-2 text-gray-700">Points Value *</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              min="1"
              max="100"
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Points awarded per submission</p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium">Active Status</p>
              <p className="text-sm text-gray-600">Make this program visible to all users</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`w-14 h-8 rounded-full transition-colors ${
                active ? 'bg-green-600' : 'bg-gray-300'
              } relative`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
                  active ? 'translate-x-7' : 'translate-x-1'
                }`}
              ></div>
            </button>
          </div>

          {/* Preview */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-3">Preview:</p>
            <div className={`${color} border rounded-xl p-4`}>
              <div className="flex items-center">
                <div className="text-4xl mr-4">{icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{name || 'Program Name'}</h4>
                  <p className="text-xs opacity-75">{description || 'Program description'}</p>
                  <p className="text-xs mt-2">⭐ {points} points per submission</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : program ? (
                'Update Program'
              ) : (
                'Create Program'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}