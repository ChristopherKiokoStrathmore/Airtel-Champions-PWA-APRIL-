import { useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface BioEditorProps {
  userId: string;
  currentBio: string;
  onSave: (newBio: string) => void;
  onCancel: () => void;
}

export function BioEditor({ userId, currentBio, onSave, onCancel }: BioEditorProps) {
  const [bio, setBio] = useState(currentBio || '');
  const [saving, setSaving] = useState(false);

  const maxLength = 150;
  const remainingChars = maxLength - bio.length;

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('app_users')
        .update({ bio: bio.trim() })
        .eq('id', userId);

      if (error) {
        console.error('Error saving bio:', error);
        toast.error('Failed to save bio');
        setSaving(false);
        return;
      }

      toast.success('Bio updated successfully');
      onSave(bio.trim());
      setSaving(false);
    } catch (error) {
      console.error('Error saving bio:', error);
      toast.error('Failed to save bio');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4">Edit Bio</h3>
        
        <textarea
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= maxLength) {
              setBio(e.target.value);
            }
          }}
          placeholder="Tell us about yourself..."
          className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={maxLength}
        />
        
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm ${remainingChars < 20 ? 'text-orange-600' : 'text-gray-500'}`}>
            {bio.length}/{maxLength} characters
          </span>
          {remainingChars < 20 && (
            <span className="text-xs text-orange-600">
              {remainingChars} remaining
            </span>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || bio === currentBio}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
