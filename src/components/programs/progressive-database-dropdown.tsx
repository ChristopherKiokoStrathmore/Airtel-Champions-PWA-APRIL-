/**
 * PROGRESSIVE DATABASE DROPDOWN COMPONENT
 * 
 * Generic reusable component for repeatable dropdown entries.
 * Similar to ProgressiveSiteSelector but works with ANY database table.
 * 
 * Features:
 * - Progressive disclosure: Shows dropdowns one at a time
 * - Add/remove buttons for dynamic entry count
 * - Prevents duplicate selections (each option can only be selected once)
 * - Displays metadata fields if configured
 * - Stores result as array
 * 
 * Use Cases:
 * - Sites Visited
 * - Shops Activated
 * - Products Sold
 * - Retailers Met
 * - Any repeatable selection from a database table
 */

import React from 'react';
import { Plus, X } from 'lucide-react';

interface DatabaseSource {
  table?: string;
  display_field?: string;
  metadata_fields?: string[];
  multi_select?: boolean;
  repeatable_dropdown?: boolean;
}

interface ProgramField {
  field_name: string;
  field_label?: string; // Optional - falls back to field_name
  field_type: string;
  is_required?: boolean;
  help_text?: string;
  options?: {
    database_source?: DatabaseSource;
    [key: string]: any;
  };
}

interface ProgressiveDatabaseDropdownProps {
  field: ProgramField;
  formData: Record<string, any>;
  databaseDropdownData: Record<string, any[]>;
  loadingDatabaseDropdowns: Record<string, boolean>;
  onFieldChange: (fieldId: string, value: any) => void;
  maxEntries?: number; // Default to 10 if not specified
}

export function ProgressiveDatabaseDropdown({
  field,
  formData,
  databaseDropdownData,
  loadingDatabaseDropdowns,
  onFieldChange,
  maxEntries = 10
}: ProgressiveDatabaseDropdownProps) {
  const [visibleCount, setVisibleCount] = React.useState(1);
  
  // Get the current value (array of selections)
  const currentValue = formData[field.field_name] || [];
  const selections = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
  
  console.log(`[ProgressiveDatabaseDropdown] ${field.field_label || field.field_name} render:`, {
    fieldName: field.field_name,
    currentValue,
    selections,
    visibleCount,
    selectionsLength: selections.length
  });
  
  // Auto-expand visibleCount when selections array grows (e.g., from editing existing submission)
  React.useEffect(() => {
    const currentLength = selections.length;
    if (currentLength > visibleCount) {
      console.log(`[ProgressiveDatabaseDropdown] ${field.field_label} - Auto-expanding visibleCount from ${visibleCount} to ${currentLength}`);
      setVisibleCount(currentLength);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections.length]);
  
  // Get database dropdown options
  const options = databaseDropdownData[field.field_name] || [];
  const isLoading = loadingDatabaseDropdowns[field.field_name];
  const dbSource = field.options?.database_source;
  const displayField = dbSource?.display_field || 'name';
  const metadataFields = dbSource?.metadata_fields || [];
  
  const handleSelectionChange = (index: number, value: string) => {
    // Create array with enough slots for current selection
    const newSelections = Array(Math.max(visibleCount, selections.length)).fill('');
    
    // Copy existing selections
    selections.forEach((selection, i) => {
      newSelections[i] = selection;
    });
    
    // Update the changed index
    newSelections[index] = value;
    
    // Filter out empty strings
    const filteredSelections = newSelections.filter(Boolean);
    
    console.log(`[ProgressiveDatabaseDropdown] ${field.field_label} - Entry ${index + 1} changed:`, {
      selected: value,
      index: index,
      beforeArray: selections,
      afterArray: filteredSelections,
      totalCount: filteredSelections.length
    });
    
    // Store as array (or empty array if no selections)
    onFieldChange(field.field_name, filteredSelections.length > 0 ? filteredSelections : []);
  };
  
  const handleRemoveEntry = (index: number) => {
    const newSelections = selections.filter((_, i) => i !== index);
    onFieldChange(field.field_name, newSelections);
    if (visibleCount > newSelections.length + 1) {
      setVisibleCount(Math.max(1, newSelections.length + 1));
    }
  };
  
  const handleAddEntry = () => {
    if (visibleCount < maxEntries) {
      setVisibleCount(visibleCount + 1);
    }
  };
  
  return (
    <div className="bg-white border-2 border-teal-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-900">
            {field.field_label || field.field_name}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </h4>
          {field.help_text && (
            <p className="text-xs text-gray-600 mt-1">{field.help_text}</p>
          )}
        </div>
        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
          {selections.length}/{maxEntries}
        </span>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: visibleCount }).map((_, index) => {
          const currentSelectionValue = selections[index] || '';
          
          return (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry {index + 1}
                  {index === 0 && field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {isLoading ? (
                  <div className="w-full px-4 py-3 border-2 border-teal-300 rounded-lg bg-teal-50 flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-teal-700 text-sm">Loading options...</span>
                  </div>
                ) : (
                  <>
                    <select
                      key={`select-${index}-${currentSelectionValue || 'empty'}`}
                      value={currentSelectionValue}
                      onChange={(e) => handleSelectionChange(index, e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                    >
                      <option value="">Select an option...</option>
                      {options.map((row, optIndex) => {
                        const displayValue = typeof row === 'string' 
                          ? row 
                          : (row[displayField] || `Option ${optIndex + 1}`);
                        
                        // Disable if already selected in a different entry
                        const isDisabled = selections.includes(displayValue) && selections[index] !== displayValue;
                        
                        return (
                          <option key={optIndex} value={displayValue} disabled={isDisabled}>
                            {displayValue} {isDisabled ? '(already selected)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Display metadata for selected option */}
                    {!isLoading && currentSelectionValue && metadataFields.length > 0 && (() => {
                      // Find the selected row from options
                      const selectedRow = options.find(row => {
                        if (typeof row === 'string') return row === currentSelectionValue;
                        return row[displayField] === currentSelectionValue;
                      });
                      
                      if (selectedRow && typeof selectedRow === 'object') {
                        return (
                          <div className="mt-2 p-2 bg-teal-50 border border-teal-200 rounded text-xs space-y-1">
                            {metadataFields.map((metaField: string, metaIndex: number) => (
                              <div key={metaIndex} className="flex justify-between">
                                <span className="text-gray-600">{metaField}:</span>
                                <span className="font-medium text-gray-900">{selectedRow[metaField] || 'N/A'}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </div>
              
              {/* Remove button (only show for entries after the first one) */}
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(index)}
                  className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove entry"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
        
        {/* Add More button */}
        {visibleCount < maxEntries && (
          <button
            type="button"
            onClick={handleAddEntry}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-teal-300 rounded-lg text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Entry {visibleCount + 1}
          </button>
        )}
      </div>
      
      {/* Summary of selected items */}
      {selections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-teal-200">
          <div className="text-xs font-semibold text-teal-900 mb-2">
            ✅ Selected ({selections.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selections.map((val, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-900 rounded-full text-xs font-medium"
              >
                {idx + 1}. {val}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
