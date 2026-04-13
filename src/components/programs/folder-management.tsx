import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, FolderPlus, Save } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';

interface Folder {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
}

interface FolderManagementProps {
  onClose: () => void;
  onFoldersUpdated: () => void;
}

export function FolderManagement({ onClose, onFoldersUpdated }: FolderManagementProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: 'blue'
  });

  const colorOptions = [
    { value: 'blue', label: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { value: 'green', label: 'Green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
    { value: 'red', label: 'Red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  ];

  const iconOptions = ['📁', '💰', '😊', '📡', '📚', '🎯', '⚡', '🏆', '📊', '🚀', '💼', '🎓'];

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('program_folders')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (err) {
      console.error('[FolderManagement] Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ name: '', description: '', icon: '📁', color: 'blue' });
    setEditingFolder(null);
  };

  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setFormData({
      name: folder.name,
      description: folder.description,
      icon: folder.icon,
      color: folder.color
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      const supabase = getSupabaseClient();
      
      if (editingFolder) {
        // Update existing folder
        const { error } = await supabase
          .from('program_folders')
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFolder.id);

        if (error) throw error;
      } else {
        // Create new folder
        const { error } = await supabase
          .from('program_folders')
          .insert({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            color: formData.color,
            order_index: folders.length + 1
          });

        if (error) throw error;
      }

      // Reset form and reload
      setEditingFolder(null);
      setIsCreating(false);
      setFormData({ name: '', description: '', icon: '📁', color: 'blue' });
      await loadFolders();
      onFoldersUpdated();
    } catch (err) {
      console.error('[FolderManagement] Error saving folder:', err);
      alert('Failed to save folder. Please try again.');
    }
  };

  const handleDelete = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Programs in this folder will become unfoldered.')) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('program_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      
      await loadFolders();
      onFoldersUpdated();
    } catch (err) {
      console.error('[FolderManagement] Error deleting folder:', err);
      alert('Failed to delete folder. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingFolder(null);
    setIsCreating(false);
    setFormData({ name: '', description: '', icon: '📁', color: 'blue' });
  };

  const getColorClasses = (color: string) => {
    const option = colorOptions.find(c => c.value === color);
    return option ? `${option.bg} ${option.border} ${option.text}` : 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderPlus className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Manage Folders</h2>
                <p className="text-blue-100 text-sm mt-1">Organize your programs into folders</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Button */}
          {!isCreating && !editingFolder && (
            <button
              onClick={handleCreate}
              className="w-full mb-6 px-6 py-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 border-dashed rounded-xl text-blue-600 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Folder
            </button>
          )}

          {/* Create/Edit Form */}
          {(isCreating || editingFolder) && (
            <div className="mb-6 bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingFolder ? 'Edit Folder' : 'Create New Folder'}
              </h3>
              
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Folder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sales Programs"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this folder"
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                          formData.icon === icon
                            ? 'border-blue-500 bg-blue-50 scale-110'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                          formData.color === color.value
                            ? `${color.bg} ${color.border} ${color.text} scale-105`
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className={`border-2 rounded-xl p-4 ${getColorClasses(formData.color)}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{formData.icon}</div>
                      <div>
                        <div className="font-bold text-lg">
                          {formData.name || 'Folder Name'}
                        </div>
                        <div className="text-sm opacity-80">
                          {formData.description || 'Folder description will appear here'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={!formData.name.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingFolder ? 'Save Changes' : 'Create Folder'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Folders List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse"></div>
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No folders created yet</p>
              <p className="text-sm text-gray-500 mt-1">Click "Create New Folder" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Existing Folders ({folders.length})
              </h3>
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    editingFolder?.id === folder.id
                      ? 'ring-4 ring-blue-200'
                      : 'hover:shadow-md'
                  } ${getColorClasses(folder.color)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-3xl">{folder.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-lg">{folder.name}</div>
                        <div className="text-sm opacity-80">{folder.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(folder)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        title="Edit folder"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(folder.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        title="Delete folder"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
