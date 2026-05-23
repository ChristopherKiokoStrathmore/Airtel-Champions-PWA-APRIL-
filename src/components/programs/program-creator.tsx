import { useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';

interface ProgramField {
  id: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  options?: { options: string[] };
  order_index: number;
}

interface ProgramCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text (Short answer)', icon: '📝' },
  { value: 'long_text', label: 'Long Text (Paragraph)', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'dropdown', label: 'Dropdown (Single choice)', icon: '▼' },
  { value: 'multi_select', label: 'Multi-Select (Checkboxes)', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'time', label: 'Time', icon: '🕐' },
  { value: 'photo', label: 'Photo (with GPS)', icon: '📷' },
  { value: 'location', label: 'GPS Location', icon: '📍' },
  { value: 'yes_no', label: 'Yes/No Toggle', icon: '🔘' },
  { value: 'rating', label: 'Star Rating (1-5)', icon: '⭐' },
];

const TARGET_ROLES = [
  { value: 'sales_executive', label: 'Sales Executives' },
  { value: 'zonal_sales_manager', label: 'Zonal Sales Managers' },
  { value: 'zonal_business_manager', label: 'Zonal Business Managers' },
];

export function ProgramCreator({ onClose, onSuccess }: ProgramCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsValue, setPointsValue] = useState(10);
  const [targetRoles, setTargetRoles] = useState<string[]>(['sales_executive']);
  const [whoCanSubmit, setWhoCanSubmit] = useState<string[]>(['sales_executive']); // 🆕 Who can submit the form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fields, setFields] = useState<ProgramField[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [showFieldModal, setShowFieldModal] = useState(false);

  // Field modal state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState<string[]>(['']);

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      alert('Field name is required');
      return;
    }

    const newField: ProgramField = {
      id: `temp_${Date.now()}`,
      field_name: newFieldName,
      field_type: newFieldType,
      is_required: newFieldRequired,
      order_index: fields.length,
    };

    // Add options for dropdown/multi_select
    if (['dropdown', 'multi_select'].includes(newFieldType)) {
      const validOptions = newFieldOptions.filter(opt => opt.trim());
      if (validOptions.length === 0) {
        alert('Please add at least one option for dropdown/multi-select');
        return;
      }
      newField.options = { options: validOptions };
    }

    setFields([...fields, newField]);
    setShowFieldModal(false);
    resetFieldModal();
  };

  const resetFieldModal = () => {
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions(['']);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id).map((f, idx) => ({ ...f, order_index: idx })));
  };

  const handleMoveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex(f => f.id === id);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    
    // Update order_index
    newFields.forEach((f, idx) => f.order_index = idx);
    setFields(newFields);
  };

  const handleToggleRole = (role: string) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter(r => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  const handleToggleSubmitRole = (role: string) => {
    if (whoCanSubmit.includes(role)) {
      setWhoCanSubmit(whoCanSubmit.filter(r => r !== role));
    } else {
      setWhoCanSubmit([...whoCanSubmit, role]);
    }
  };

  const handleCreate = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Program title is required');
      return;
    }

    if (targetRoles.length === 0) {
      setError('Please select at least one target audience');
      return;
    }

    if (whoCanSubmit.length === 0) {
      setError('Please select at least one role that can submit');
      return;
    }

    if (fields.length === 0) {
      setError('Please add at least one field to your program');
      return;
    }

    setIsCreating(true);

    try {
      // Get user from localStorage (TAI app authentication)
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not authenticated');
      }

      const user = JSON.parse(storedUser);

      // Create program directly in database
      const { data: newProgram, error } = await supabase
        .from('programs')
        .insert({
          title,
          description,
          points_value: pointsValue,
          target_roles: targetRoles,
          who_can_submit: whoCanSubmit, // 🆕 Who can submit the form
          start_date: startDate || null,
          end_date: endDate || null,
          status: 'active',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to create program');
      }

      // If there are custom fields, insert them
      if (fields.length > 0) {
        const { error: fieldsError } = await supabase
          .from('program_fields')
          .insert(
            fields.map(f => ({
              program_id: newProgram.id,
              field_name: f.field_name,
              field_label: f.field_name, // ✅ FIX: Add field_label (required)
              field_type: f.field_type,
              is_required: f.is_required,
              options: f.options || null,
              order_index: f.order_index,
            }))
          );

        if (fieldsError) {
          console.error('[Programs] Error creating fields:', fieldsError);
          throw new Error(`Failed to save fields: ${fieldsError.message}`);
        }
        
        console.log(`[Programs] Created ${fields.length} fields for program`);
      }

      console.log('[Programs] Created program:', newProgram);
      onSuccess();
    } catch (err: any) {
      console.error('[Programs] Error creating program:', err);
      setError(err.message || 'Failed to create program');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">📋 Create New Program</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">📝 Basic Information</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Program Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., AMBs to Keep List"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this program is about and what SEs should do"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Points per Submission *
              </label>
              <input
                type="number"
                value={pointsValue}
                onChange={(e) => setPointsValue(parseInt(e.target.value) || 10)}
                min="1"
                max="500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-600 mt-1">Range: 1-500 points</p>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">👥 Target Audience *</h3>
              <p className="text-xs text-gray-600 mt-1">Who can SEE this program</p>
            </div>
            <div className="space-y-2">
              {TARGET_ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetRoles.includes(role.value)}
                    onChange={() => handleToggleRole(role.value)}
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Who Can Submit */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">✍️ Who Can Submit *</h3>
              <p className="text-xs text-gray-600 mt-1">Who can FILL OUT this form</p>
            </div>
            <div className="space-y-2">
              {TARGET_ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whoCanSubmit.includes(role.value)}
                    onChange={() => handleToggleSubmitRole(role.value)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Period */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">📅 Active Period (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">📝 Form Fields *</h3>
              <button
                onClick={() => setShowFieldModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600">No fields added yet. Click "Add Field" to start building your form.</p>
              </div>
            )}

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveField(field.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <GripVertical className="w-4 h-4 text-gray-600 rotate-90" />
                    </button>
                    <button
                      onClick={() => handleMoveField(field.id, 'down')}
                      disabled={index === fields.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <GripVertical className="w-4 h-4 text-gray-600 -rotate-90" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{field.field_name}</span>
                      {field.is_required && <span className="text-red-600 text-xs">*</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                      </span>
                      {field.options && (
                        <span className="text-xs text-gray-500">
                          ({field.options.options.length} options)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                '💾 Create Program'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Form Field</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g., Shop Name, Site ID, ZSM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field Type *
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {FIELD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {['dropdown', 'multi_select'].includes(newFieldType) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Options *
                  </label>
                  <div className="space-y-2">
                    {newFieldOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...newFieldOptions];
                            newOpts[idx] = e.target.value;
                            setNewFieldOptions(newOpts);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        {newFieldOptions.length > 1 && (
                          <button
                            onClick={() => setNewFieldOptions(newFieldOptions.filter((_, i) => i !== idx))}
                            className="p-2 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setNewFieldOptions([...newFieldOptions, ''])}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-900">Required field</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  resetFieldModal();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddField}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}