import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface VanCalendarSiteSelectorProps {
  day: string; // e.g., "Monday"
  dayKey: string; // e.g., "monday"
  siteFields: any[]; // Array of 4 site fields for this day
  formData: Record<string, any>;
  databaseDropdownData: Record<string, any[]>;
  loadingDatabaseDropdowns: Record<string, boolean>;
  onFieldChange: (fieldId: string, value: any) => void;
}

export function VanCalendarSiteSelector({
  day,
  dayKey,
  siteFields,
  formData,
  databaseDropdownData,
  loadingDatabaseDropdowns,
  onFieldChange
}: VanCalendarSiteSelectorProps) {
  // Track how many site slots are visible (1-4)
  const [visibleCount, setVisibleCount] = useState(1);

  // Helper to get site number from field name (e.g., "monday_site_3" -> 3)
  const getSiteNumber = (fieldName: string) => {
    const match = fieldName.match(/_site_(\d+)$/);
    return match ? parseInt(match[1]) : 0;
  };

  // Sort fields by site number
  const sortedFields = [...siteFields].sort((a, b) => 
    getSiteNumber(a.field_name) - getSiteNumber(b.field_name)
  );

  // Only show fields up to visibleCount
  const visibleFields = sortedFields.slice(0, visibleCount);

  const handleAddSite = () => {
    if (visibleCount < 4) {
      setVisibleCount(visibleCount + 1);
    }
  };

  const handleRemoveSite = () => {
    if (visibleCount > 1) {
      // Clear the data for the site being removed
      const fieldToRemove = sortedFields[visibleCount - 1];
      if (fieldToRemove) {
        onFieldChange(fieldToRemove.id, '');
      }
      setVisibleCount(visibleCount - 1);
    }
  };

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg px-4 py-3">
        <h3 className="text-base font-bold text-blue-900">📅 {day}</h3>
        <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-full font-semibold">
          {visibleCount} site{visibleCount > 1 ? 's' : ''}
        </span>
      </div>

      {/* Site Fields */}
      {visibleFields.map((field, index) => {
        const siteNumber = getSiteNumber(field.field_name);
        const dbSource = field.options?.database_source;
        const isLoading = loadingDatabaseDropdowns[field.id];
        const dropdownData = databaseDropdownData[field.id] || [];
        const currentValue = formData[field.id] || '';

        return (
          <div key={field.id} className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Site {siteNumber} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            
            {/* Loading State */}
            {isLoading && (
              <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg bg-blue-50 flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 text-sm font-medium">Loading sites...</span>
              </div>
            )}

            {/* Dropdown */}
            {!isLoading && (
              <select
                value={currentValue}
                onChange={(e) => onFieldChange(field.id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base"
                style={{ fontSize: '16px' }}
              >
                <option value="">Select a site...</option>
                {dropdownData.map((row: any, idx: number) => {
                  const displayValue = dbSource ? row[dbSource.display_field] : '';
                  return (
                    <option key={idx} value={displayValue}>
                      {displayValue}
                    </option>
                  );
                })}
              </select>
            )}

            {/* Show site count and "No sites" message */}
            {!isLoading && dropdownData.length === 0 && (
              <div className="mt-2 text-xs text-red-600">
                ⚠️ No sites available
              </div>
            )}
            {!isLoading && dropdownData.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {dropdownData.length} sites available
              </div>
            )}
          </div>
        );
      })}

      {/* Add/Remove Buttons */}
      <div className="flex gap-2">
        {visibleCount < 4 && (
          <button
            type="button"
            onClick={handleAddSite}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Site
          </button>
        )}
        {visibleCount > 1 && (
          <button
            type="button"
            onClick={handleRemoveSite}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
