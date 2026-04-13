/**
 * NEW PROGRESSIVE DISCLOSURE IMPLEMENTATION
 * 
 * This component handles the case where site fields are named:
 * - monday_sites (singular field per day)
 * - tuesday_sites
 * - etc.
 * 
 * Instead of:
 * - monday_site_1, monday_site_2, monday_site_3, monday_site_4
 * 
 * It allows users to select multiple sites per day by:
 * 1. Showing 1 site selector initially
 * 2. Clicking "+ Add Monday Site 2" to reveal more (up to 4)
 * 3. Storing selected sites as an array in form data
 */

import React from 'react';
import { Plus, X } from 'lucide-react';

interface ProgressiveSiteSelectorProps {
  day: string; // "Monday", "Tuesday", etc.
  dayKey: string; // "monday", "tuesday", etc.
  field: any; // The field config from database
  formData: Record<string, any>;
  databaseDropdownData: Record<string, any[]>;
  loadingDatabaseDropdowns: Record<string, boolean>;
  onFieldChange: (fieldId: string, value: any) => void;
  fieldMetadata?: Record<string, { label: string; data: Record<string, any> }>; // 🆕 For displaying metadata
}

export function ProgressiveSiteSelector({
  day,
  dayKey,
  field,
  formData,
  databaseDropdownData,
  loadingDatabaseDropdowns,
  onFieldChange,
  fieldMetadata
}: ProgressiveSiteSelectorProps) {
  const [visibleCount, setVisibleCount] = React.useState(1);
  const MAX_SITES = 4;
  
  // Get the current value (array of site selections)
  const currentValue = formData[field.id] || [];
  const sites = Array.isArray(currentValue) ? currentValue : [currentValue].filter(Boolean);
  
  // 🔥 DEBUG: Log current state
  console.log(`[ProgressiveSiteSelector] ${day} render:`, {
    fieldId: field.id,
    currentValue,
    sites,
    sitesArray: JSON.stringify(sites),
    visibleCount,
    sitesLength: sites.length
  });
  
  // 🔥 FIX: Sync visibleCount with actual array length
  React.useEffect(() => {
    const currentLength = sites.length;
    if (currentLength > visibleCount) {
      console.log(`[ProgressiveSiteSelector] ${day} - Auto-expanding visibleCount from ${visibleCount} to ${currentLength}`);
      setVisibleCount(currentLength);
    }
  }, [sites.length, visibleCount, day]);
  
  // Get database dropdown options
  const options = databaseDropdownData[field.id] || [];
  const isLoading = loadingDatabaseDropdowns[field.id];
  const dbSource = field.options?.database_source;
  const displayField = dbSource?.display_field || 'name';
  
  const handleSiteChange = (index: number, value: string) => {
    // Create array with enough slots for current selection
    const newSites = Array(Math.max(visibleCount, sites.length)).fill('');
    
    // Copy existing sites
    sites.forEach((site, i) => {
      newSites[i] = site;
    });
    
    // Update the changed index
    newSites[index] = value;
    
    // Filter out empty strings
    const filteredSites = newSites.filter(Boolean);
    
    console.log(`[ProgressiveSiteSelector] 📍 ${day} - Site ${index + 1} changed:`, {
      selected: value,
      index: index,
      beforeArray: sites,
      afterArray: filteredSites,
      totalCount: filteredSites.length
    });
    
    // Store as array (or empty array if no sites selected)
    onFieldChange(field.id, filteredSites.length > 0 ? filteredSites : []);
  };
  
  const handleRemoveSite = (index: number) => {
    const newSites = sites.filter((_, i) => i !== index);
    onFieldChange(field.id, newSites);
    if (visibleCount > newSites.length + 1) {
      setVisibleCount(Math.max(1, newSites.length + 1));
    }
  };
  
  const handleAddSite = () => {
    if (visibleCount < MAX_SITES) {
      setVisibleCount(visibleCount + 1);
    }
  };
  
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-900">{day}</h4>
        <span className="text-xs text-gray-500">{sites.length}/{MAX_SITES} sites</span>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: visibleCount }).map((_, index) => {
          const currentSiteValue = sites[index] || '';
          console.log(`[ProgressiveSiteSelector] ${day} Site ${index + 1} rendering:`, {
            index,
            value: currentSiteValue,
            sitesArray: sites,
            hasValue: !!currentSiteValue
          });
          
          return (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site {index + 1}
                {index === 0 && field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {isLoading ? (
                <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg bg-blue-50 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 text-sm">Loading sites...</span>
                </div>
              ) : (
                <select
                  key={`select-${index}-${currentSiteValue || 'empty'}`}
                  value={currentSiteValue}
                  onChange={(e) => handleSiteChange(index, e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a site...</option>
                  {options.map((row, optIndex) => {
                    const displayValue = row[displayField] || `Option ${optIndex + 1}`;
                    const isDisabled = sites.includes(displayValue) && sites[index] !== displayValue;
                    return (
                      <option key={optIndex} value={displayValue} disabled={isDisabled}>
                        {displayValue} {isDisabled ? '(already selected)' : ''}
                      </option>
                    );
                  })}
                </select>
              )}
              
              {/* 🆕 Show metadata for selected site */}
              {!isLoading && sites[index] && dbSource?.metadata_fields && dbSource.metadata_fields.length > 0 && (() => {
                // Find the selected row from options
                const selectedRow = options.find(row => row[displayField] === sites[index]);
                if (selectedRow) {
                  return (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs space-y-1">
                      {dbSource.metadata_fields.map((metaField: string, metaIndex: number) => (
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
            </div>
            
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveSite(index)}
                className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove site"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          );
        })}
        
        {visibleCount < MAX_SITES && (
          <button
            type="button"
            onClick={handleAddSite}
            className="w-full py-2 px-4 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add {day} Site {visibleCount + 1}
          </button>
        )}
        
        {visibleCount >= MAX_SITES && (
          <p className="text-xs text-gray-500 text-center">
            Maximum {MAX_SITES} sites per day reached
          </p>
        )}
      </div>
    </div>
  );
}
