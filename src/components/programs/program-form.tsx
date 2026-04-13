import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getAuthHeaders } from '../../utils/api-helper';
import { compressImage, formatFileSize } from '../../utils/imageCompression';
import { ArrowLeft, Camera, MapPin, CheckCircle, Star } from 'lucide-react';
import { NativeCamera } from '../native-camera';
import { Geolocation } from '@capacitor/geolocation';
import { SearchableDropdown } from '../searchable-dropdown';
import { ProgressiveDatabaseDropdown } from './progressive-database-dropdown'; // 🆕 Import the new component

interface DatabaseSource {
  table: string;
  display_field: string;
  metadata_fields?: string[];
  search_fields?: string[];
  filter?: Record<string, any>;
  multi_select?: boolean; // 🆕 Support multi-select
  repeatable_dropdown?: boolean; // 🆕 Support repeatable dropdown
}

interface ProgramField {
  id: string;
  field_name: string;
  field_label?: string; // Optional - may fallback to field_name
  field_type: string;
  is_required: boolean;
  help_text?: string;
  options?: { 
    options?: string[];
    database_source?: string | DatabaseSource; // Support both legacy string and new object format
    display_field?: string; // Legacy - for backward compatibility
    metadata_fields?: string[]; // Legacy - for backward compatibility
  };
  order_index: number;
}

interface Program {
  id: string;
  title: string;
  description: string;
  points_value: number;
  end_date: string | null;
  fields: ProgramField[];
  gps_auto_detect_enabled?: boolean; // When false, the Location pin is hidden from the form
}

interface ProgramFormProps {
  programId: string;
  onBack: () => void;
  onSuccess: (pointsEarned: number) => void;
}

export function ProgramForm({ programId, onBack, onSuccess }: ProgramFormProps) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<Record<string, any>>({});
  const [location, setLocation] = useState<any>(null);
  const [gpsError, setGpsError] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  const [photoUploadErrors, setPhotoUploadErrors] = useState<Record<string, string>>({});
  
  // Auto-capture date and time (constant for every form)
  const [submissionDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [submissionTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })); // HH:MM
  const [locationAddress, setLocationAddress] = useState('');
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [shopName, setShopName] = useState('');
  
  // Dynamic database dropdown state
  const [databaseDropdownData, setDatabaseDropdownData] = useState<Record<string, any[]>>({});
  const [loadingDatabaseDropdowns, setLoadingDatabaseDropdowns] = useState<Record<string, boolean>>({});
  const [dropdownMetadata, setDropdownMetadata] = useState<Record<string, any>>({});
  
  useEffect(() => {
    loadProgram();
    // GPS capture is now deferred until program loads, so we know if GPS is enabled
  }, [programId]);
  
  // Load database dropdowns when program fields are loaded
  useEffect(() => {
    if (program?.fields) {
      loadDatabaseDropdowns();
    }
  }, [program]);

  const loadProgram = async () => {
    try {
      // Direct DB mode — use publicAnonKey instead of auth session
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not authenticated. Please login again.');
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/programs/${programId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load program');
      }

      setProgram(data.program);
      // Only start GPS capture if the program has GPS enabled (default: true)
      if (data.program.gps_auto_detect_enabled !== false) {
        captureGPS();
      }
    } catch (err: any) {
      console.error('[Programs] Error loading program:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseDropdowns = async () => {
    if (!program?.fields) return;

    try {
      // Direct DB mode — no auth session needed for dropdown data
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        console.error('[Programs] Not authenticated - cannot load database dropdowns');
        return;
      }

      // Find all fields with database_source
      const databaseFields = program.fields.filter(
        field => field.field_type === 'dropdown' && field.options?.database_source
      );

      if (databaseFields.length === 0) {
        console.log('[Programs] No database dropdown fields found');
        return;
      }

      console.log('[Programs] 🔄 Loading database dropdowns for', databaseFields.length, 'fields');

      // Load data for each database dropdown field
      for (const field of databaseFields) {
        const dbSource = field.options?.database_source;
        
        // Skip if already loaded
        if (databaseDropdownData[field.field_name]) {
          continue;
        }

        // Handle both old format (string) and new format (object)
        let table: string;
        let displayField: string;
        let metadataFields: string[] = [];

        if (typeof dbSource === 'string') {
          // Legacy format: "van_db"
          table = dbSource;
          displayField = field.options?.display_field || 'name';
          metadataFields = field.options?.metadata_fields || [];
        } else if (typeof dbSource === 'object') {
          // New format: { table: "van_db", display_field: "number_plate", ... }
          table = dbSource.table;
          displayField = dbSource.display_field;
          metadataFields = dbSource.metadata_fields || [];
        } else {
          console.error('[Programs] Invalid database_source format for field:', field.field_name);
          continue;
        }

        try {
          setLoadingDatabaseDropdowns(prev => ({ ...prev, [field.field_name]: true }));
          
          console.log(`[Programs] 📦 Fetching ${field.field_name} from table: ${table}`);

          // Build query parameters
          const params = new URLSearchParams({
            table,
            display_field: displayField,
          });

          if (metadataFields.length > 0) {
            params.append('metadata_fields', metadataFields.join(','));
          }

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/database-dropdown?${params}`,
            {
              method: 'GET',
              headers: getAuthHeaders(),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error(`[Programs] ❌ Error loading ${field.field_name}:`, data.error);
            continue;
          }

          console.log(`[Programs] ✅ Loaded ${data.count} options for ${field.field_name}`);
          
          // Store the data
          setDatabaseDropdownData(prev => ({
            ...prev,
            [field.field_name]: data.options || []
          }));

        } catch (err: any) {
          console.error(`[Programs] ❌ Error loading dropdown for ${field.field_name}:`, err);
        } finally {
          setLoadingDatabaseDropdowns(prev => ({ ...prev, [field.field_name]: false }));
        }
      }
    } catch (err: any) {
      console.error('[Programs] Error loading database dropdowns:', err);
    }
  };

  const captureGPS = async () => {
    try {
      setCapturingGPS(true);
      setGpsError(''); // Clear previous errors
      
      // 1. Request permission from the user
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location === 'granted' || permissions.location === 'prompt') {
        // 2. Get the actual coordinates
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
        
        const locationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || null,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
          timestamp: new Date().toISOString(),
        };
        
        setLocation(locationData);
        console.log('[Programs] ✅ GPS captured with HIGH ACCURACY:', position.coords);
        console.log('[Programs] 📍 Exact Coordinates:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: `±${position.coords.accuracy.toFixed(0)}m`
        });
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            setLocationAddress(data.display_name);
            console.log('[Programs] 📍 Address:', data.display_name);
          }
        } catch (err) {
          console.log('[Programs] Could not fetch address (offline or API unavailable)');
        }
        
        setCapturingGPS(false);
      } else {
        setGpsError('Location permission denied. Please enable location access in settings.');
        setCapturingGPS(false);
      }
    } catch (error: any) {
      console.error('[Programs] ❌ GPS error:', error);
      setGpsError(error.message || 'GPS error. Please check location settings.');
      setCapturingGPS(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldName]: value }));
  };

  const handlePhotoCapture = async (fieldName: string, file: File) => {
    // Mark as uploading
    setUploadingPhotos(prev => ({ ...prev, [fieldName]: true }));
    setPhotoUploadErrors(prev => ({ ...prev, [fieldName]: '' }));

    try {
      // Capture GPS at photo time using Capacitor
      const photoGPS = await new Promise<any>(async (resolve) => {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
          
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          // Use form-level GPS if photo GPS fails
          resolve(location);
        }
      });

      // Compress image
      console.log('[Programs] Compressing image...');
      const compressedResult = await compressImage(file);
      const compressedFileSize = formatFileSize(compressedResult.compressedSize);
      console.log(`[Programs] Compressed from ${formatFileSize(compressedResult.originalSize)} to ${compressedFileSize}`);

      // Upload to Supabase Storage
      console.log('[Programs] Uploading to storage...');
      const fileName = `${programId}/${Date.now()}_${compressedResult.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('make-28f2f653-program-photos')
        .upload(fileName, compressedResult.file);

      if (uploadError) {
        console.error('[Programs] Photo upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload photo');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('make-28f2f653-program-photos')
        .getPublicUrl(fileName);

      setPhotos(prev => ({
        ...prev,
        [fieldName]: {
          url: urlData.publicUrl,
          gps: photoGPS,
          timestamp: new Date().toISOString(),
          size: compressedFileSize,
          originalFile: file, // Store original file for retry
        },
      }));

      console.log('[Programs] Photo uploaded successfully:', fieldName);
    } catch (err: any) {
      console.error('[Programs] Photo capture error:', err);
      setPhotoUploadErrors(prev => ({ 
        ...prev, 
        [fieldName]: err.message || 'Upload failed. Please try again.'
      }));
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!program) return;

    for (const field of program.fields) {
      if (field.is_required && !responses[field.field_name]) {
        setError(`${field.field_name} is required`);
        return;
      }
    }

    // Check for uploading photos
    const isPhotoUploading = Object.values(uploadingPhotos).some(uploading => uploading);
    if (isPhotoUploading) {
      setError('Please wait for all photos to finish uploading');
      return;
    }

    // Check GPS — only required when GPS is enabled for this program
    console.log('[Programs] 🔍 DEBUG - GPS Location State:', location);
    console.log('[Programs] 🔍 DEBUG - GPS Error:', gpsError);
    
    if (program.gps_auto_detect_enabled !== false && !location && !gpsError) {
      setError('Waiting for GPS location...');
      return;
    }

    setSubmitting(true);

    try {
      // Direct DB mode — use publicAnonKey instead of auth session
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not authenticated. Please login again.');
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/programs/${programId}/submit`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          photos,
          location,
          // Auto-captured metadata (always included)
          submission_date: submissionDate,
          submission_time: submissionTime,
          shop_name: shopName,
          location_address: locationAddress, // Include reverse geocoded address
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit program');
      }

      console.log('[Programs] Submission successful:', data);
      onSuccess(data.points_awarded);
    } catch (err: any) {
      console.error('[Programs] Error submitting program:', err);
      setError(err.message || 'Failed to submit program');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: ProgramField) => {
    const value = responses[field.field_name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name.toLowerCase()}`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        );

      case 'long_text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name.toLowerCase()}`}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_name.toLowerCase()}`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        );

      case 'dropdown':
        // Check if this is a database-backed dropdown
        if (field.options?.database_source) {
          const dropdownOptions = databaseDropdownData[field.field_name] || [];
          const isLoading = loadingDatabaseDropdowns[field.field_name] || false;
          const isMultiSelect = field.options?.database_source?.multi_select || false;
          const isRepeatableDropdown = field.options?.database_source?.repeatable_dropdown || false; // 🆕 Check for repeatable dropdown

          // 🆕 REPEATABLE DROPDOWN (Progressive disclosure)
          if (isRepeatableDropdown) {
            return (
              <ProgressiveDatabaseDropdown
                field={field}
                formData={responses}
                databaseDropdownData={databaseDropdownData}
                loadingDatabaseDropdowns={loadingDatabaseDropdowns}
                onFieldChange={handleFieldChange}
                maxEntries={10} // Default max entries, could be configurable later
              />
            );
          }

          // Multi-select database dropdown
          if (isMultiSelect) {
            const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
            
            return (
              <div className="space-y-3">
                {/* Multi-select checkboxes */}
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                  {isLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading options...
                    </div>
                  ) : dropdownOptions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No options available</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {dropdownOptions.map((option, idx) => {
                        const optionValue = typeof option === 'string' ? option : option.value;
                        const isSelected = selectedValues.includes(optionValue);
                        
                        return (
                          <label
                            key={idx}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newValues = e.target.checked
                                  ? [...selectedValues, optionValue]
                                  : selectedValues.filter(v => v !== optionValue);
                                handleFieldChange(field.field_name, newValues);
                                
                                // Store metadata for selected items
                                if (e.target.checked && typeof option === 'object' && option.metadata) {
                                  setDropdownMetadata((prev) => ({
                                    ...prev,
                                    [field.field_name]: {
                                      ...prev[field.field_name],
                                      [optionValue]: option.metadata
                                    }
                                  }));
                                }
                              }}
                              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-900">{optionValue}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected items summary */}
                {selectedValues.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-900 mb-2">
                      ✅ Selected ({selectedValues.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedValues.map((val, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-medium"
                        >
                          {val}
                          <button
                            onClick={() => {
                              const newValues = selectedValues.filter(v => v !== val);
                              handleFieldChange(field.field_name, newValues);
                            }}
                            className="hover:text-blue-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Single-select database dropdown (existing functionality)
          return (
            <div className="space-y-3">
              <SearchableDropdown
                options={dropdownOptions}
                value={value}
                onChange={(selectedValue, metadata) => {
                  handleFieldChange(field.field_name, selectedValue);
                  // Store metadata for display
                  if (metadata) {
                    setDropdownMetadata((prev) => ({ ...prev, [field.field_name]: metadata }));
                  }
                }}
                placeholder={`Search ${field.field_name.toLowerCase()}...`}
                loading={isLoading}
                className="w-full"
              />
              
              {/* Display selected item details */}
              {value && dropdownMetadata[field.field_name] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-blue-900 mb-2">📋 Details</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(dropdownMetadata[field.field_name]).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-gray-600 font-medium">{key}:</span>{' '}
                        <span className="text-gray-900 font-semibold">{val as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        // Standard static dropdown
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Select {field.field_name.toLowerCase()}...</option>
            {field.options?.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.options.map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    handleFieldChange(field.field_name, newValues);
                  }}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        );

      case 'photo':
        const photoData = photos[field.field_name];
        const isUploading = uploadingPhotos[field.field_name];
        const uploadError = photoUploadErrors[field.field_name];
        
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id={`photo-${field.field_name}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handlePhotoCapture(field.field_name, file);
                }
              }}
              className="hidden"
              disabled={isUploading}
            />
            
            {/* Main Photo Button */}
            <button
              type="button"
              onClick={() => document.getElementById(`photo-${field.field_name}`)?.click()}
              disabled={isUploading}
              className={`w-full py-4 px-4 border-2 border-dashed rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${\n                photoData
                  ? 'border-green-500 bg-green-50'
                  : uploadError
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'\n              }`}
            >
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-blue-700">Compressing & Uploading...</span>
                    <span className="text-xs text-blue-600">Optimizing for 2G/3G networks</span>
                  </>
                ) : photoData ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">✅ Photo Uploaded Successfully</span>
                    <img
                      src={photoData.url}
                      alt="Preview"
                      className="mt-2 max-w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>📍 GPS: {photoData.gps?.lat.toFixed(6)}, {photoData.gps?.lng.toFixed(6)}</div>
                      <div>📦 Compressed to: {photoData.size}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById(`photo-${field.field_name}`)?.click();
                      }}
                      className="mt-2 px-4 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                    >
                      📷 Retake Photo
                    </button>
                  </>
                ) : uploadError ? (
                  <>
                    <div className="text-red-600 text-4xl">⚠️</div>
                    <span className="text-sm font-semibold text-red-700">Upload Failed</span>
                    <span className="text-xs text-red-600">{uploadError}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">📷 Take Photo</span>
                    <span className="text-xs text-gray-500">Auto-compresses & captures GPS</span>
                  </>
                )}
              </div>
            </button>

            {/* Retry Button for Failed Uploads */}
            {uploadError && photoData?.originalFile && (
              <button
                type="button"
                onClick={() => handlePhotoCapture(field.field_name, photoData.originalFile)}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔄</span>
                <span>Retry Upload</span>
              </button>
            )}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.field_name}
                checked={value === 'yes'}
                onChange={() => handleFieldChange(field.field_name, 'yes')}
                className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-900">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={field.field_name}
                checked={value === 'no'}
                onChange={() => handleFieldChange(field.field_name, 'no')}
                className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-900">No</span>
            </label>
          </div>
        );

      case 'rating':
        const rating = parseInt(value) || 0;
        return (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleFieldChange(field.field_name, star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600 font-semibold">
                {rating}/5
              </span>
            )}
          </div>
        );

      case 'location':
        return (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            {location ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-semibold">GPS Location Captured</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Latitude: {location.lat.toFixed(6)}</div>
                  <div>Longitude: {location.lng.toFixed(6)}</div>
                  <div>Accuracy: {location.accuracy.toFixed(0)}m</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold">Capturing GPS...</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">Failed to load program</p>
            <button
              onClick={onBack}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📋 {program.title}
          </h1>
          {program.description && (
            <p className="text-sm text-gray-600">{program.description}</p>
          )}

          <div className="mt-4">
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg inline-flex items-center">
              <span className="text-sm">🏆 Earn </span>
              <span className="font-bold text-lg">{program.points_value}</span>
              <span className="text-sm"> points</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl p-6 space-y-6">
          {/* Auto-Captured Date, Time & Location - Always at Top */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📍</span>
              </div>
              <h3 className="text-sm font-bold text-blue-900">Auto-Captured Information</h3>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">📅 Date</label>
                <div className="bg-white border-2 border-blue-200 rounded-lg px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">{submissionDate}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">🕐 Time</label>
                <div className="bg-white border-2 border-blue-200 rounded-lg px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">{submissionTime}</span>
                </div>
              </div>
            </div>

            {/* Shop/Location Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">🏪 Shop/Location Name *</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter shop or location name"
                className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Location Drop Pin — only shown when GPS is enabled for this program */}
            {program.gps_auto_detect_enabled !== false && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700">📍 Location</label>
                {location && (
                  <button
                    type="button"
                    onClick={captureGPS}
                    disabled={capturingGPS}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <span className={capturingGPS ? 'animate-spin' : ''}>🔄</span>
                    {capturingGPS ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
              </div>
              {location ? (
                <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-green-700 text-sm mb-2">✅ Exact Location Captured</div>
                      
                      {/* Exact Coordinates */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <div className="text-xs font-mono text-gray-800 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Latitude:</span>
                            <span className="font-bold">{location.lat.toFixed(8)}°</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Longitude:</span>
                            <span className="font-bold">{location.lng.toFixed(8)}°</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="text-green-600 font-semibold">±{location.accuracy.toFixed(1)}m</span>
                          </div>
                        </div>
                      </div>

                      {/* Address (if available) */}
                      {locationAddress && (
                        <div className="bg-blue-50 rounded-lg p-2 mb-2">
                          <div className="text-xs text-gray-700">
                            <span className="font-semibold">📍 Address: </span>
                            {locationAddress}
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold transition-colors"
                        >
                          🗺️ View on Google Maps
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${location.lat}, ${location.lng}`);
                            alert('Coordinates copied to clipboard!');
                          }}
                          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg font-semibold transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : gpsError ? (
                <div className="bg-white border-2 border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <div className="font-semibold text-yellow-700 text-sm mb-1">GPS Unavailable</div>
                      <div className="text-xs text-gray-600">{gpsError}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-blue-700 text-sm mb-1">Capturing Location...</div>
                      <div className="text-xs text-gray-600">Please enable GPS for accurate location</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Custom Form Fields */}
          {program.fields
            .sort((a, b) => a.order_index - b.order_index)
            .map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {field.field_name}
                  {field.is_required && <span className="text-red-600 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </div>
            ) : (
              `✅ Submit (+${program.points_value} pts)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}