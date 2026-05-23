import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, MapPin, Upload, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getSupabaseClient } from '../../utils/supabase/client';
import { trackAction, ANALYTICS_ACTIONS } from '../../utils/analytics';
// Capacitor Geolocation — dynamically imported to avoid crashes on web
// Falls back to navigator.geolocation when Capacitor is not available
let CapacitorGeolocation: any = null;
try {
  // Only import if Capacitor is available (APK context)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    import('@capacitor/geolocation').then(mod => {
      CapacitorGeolocation = mod.Geolocation;
    }).catch(() => {
      console.log('[GPS] Capacitor Geolocation not available, using browser API');
    });
  }
} catch {
  // Silently fall back to browser geolocation
}
import { VanCalendarSiteSelector } from './van-calendar-site-selector';
import { ProgressiveSiteSelector } from './progressive-site-selector';

interface Program {
  id: string;
  title: string;
  description: string;
  points_value: number;
  points_enabled?: boolean; // 🆕 Points toggle
  gps_auto_detect_enabled?: boolean; // 🆕 GPS Auto-Detect toggle
  progressive_disclosure_enabled?: boolean; // 🆕 Progressive Disclosure toggle
  zone_filtering_enabled?: boolean; // 🆕 Zone filtering toggle
  fields?: any[];
  who_can_submit?: string[]; // 🆕 Roles that can submit this form
}

interface ProgramSubmitModalProps {
  program: Program;
  userId: string;
  onClose: () => void;
  onSuccess: (pointsAwarded: number, newTotal: number) => void;
}

export function ProgramSubmitModal({ program, userId, onClose, onSuccess }: ProgramSubmitModalProps) {
  // 🆕 Helper to check if a field should be skipped due to progressive disclosure
  const shouldSkipField = (field: any): boolean => {
    const fieldName = field?.field_name || '';
    const matchesOldPattern = /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\d+$/.test(fieldName);
    const matchesNewPattern = /^(monday|tuesday|wednesday|thursday|friday|saturday)_sites$/.test(fieldName);
    const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false;
    return (matchesOldPattern || matchesNewPattern) && useProgressiveDisclosure;
  };
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<Record<string, File[]>>({}); // 🆕 Changed: Photos now keyed by field ID
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  
  // 🆕 Track which site fields are visible for each day (for Van Calendar's 4-sites-per-day UI)
  const [visibleSites, setVisibleSites] = useState<Record<string, number>>({
    monday: 1,
    tuesday: 1,
    wednesday: 1,
    thursday: 1,
    friday: 1,
    saturday: 1
  });
  
  // 🆕 Log modal opening with user context and fetch zone
  useEffect(() => {
    const fetchUserZone = async () => {
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('[ProgramSubmitModal] ✅ Modal opened for user:', {
          userId,
          role: user.role,
          name: user.full_name,
          zone: user.zone,
          program: program.title,
          points: program.points_value
        });
        
        // Set user zone from localStorage first (null = no zone, not undefined)
        setUserZone(user.zone || null);
        
        // 🔄 Also fetch from database to ensure fresh data
        try {
          const supabase = getSupabaseClient();
          const { data: userData, error } = await supabase
            .from('app_users')
            .select('zone')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('[ProgramSubmitModal] Error fetching user zone:', error);
            // Even on error, mark as loaded (null = no zone confirmed)
            setUserZone(prev => prev === undefined ? null : prev);
          } else {
            // DB zone takes priority over localStorage
            setUserZone(userData?.zone || null);
            console.log('[ProgramSubmitModal] 📍 User zone from DB:', userData?.zone || 'none');
          }
        } catch (err) {
          console.error('[ProgramSubmitModal] Failed to fetch user zone:', err);
          // On failure, mark as loaded so dropdowns aren't stuck
          setUserZone(prev => prev === undefined ? null : prev);
        }
      } else {
        // No stored user found — mark zone as loaded (null)
        setUserZone(null);
      }
    };
    
    fetchUserZone();
  }, [userId]);
  
  // Auto-capture metadata
  const [submissionDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [submissionTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })); // HH:MM
  const [shopName, setShopName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Shop search and selection
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [shopsLoaded, setShopsLoaded] = useState(false); // Track when shops finish loading
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  
  // 🆕 User zone for zone-based filtering
  // undefined = not yet fetched | null = fetched but user has no zone | string = zone value
  const [userZone, setUserZone] = useState<string | null | undefined>(undefined);
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  // Track shop selections from dropdown fields
  const [fieldShopSelections, setFieldShopSelections] = useState<Record<string, any>>({});
  
  // 🆕 Track already-submitted values for fields with prevent_duplicates
  const [submittedValues, setSubmittedValues] = useState<Record<string, string[]>>({});

  // Track search queries for each dropdown field
  const [fieldSearchQueries, setFieldSearchQueries] = useState<Record<string, string>>({});
  const [fieldDropdownOpen, setFieldDropdownOpen] = useState<Record<string, boolean>>({});
  
  // 🔥 NEW: Store shop objects mapped by their display string for instant lookup
  const [shopLookupMap, setShopLookupMap] = useState<Record<string, any>>({});

  // 🆕 Database dropdown state (for dynamic fields pulling from any table)
  const [databaseDropdownData, setDatabaseDropdownData] = useState<Record<string, any[]>>({});
  const [loadingDatabaseDropdowns, setLoadingDatabaseDropdowns] = useState<Record<string, boolean>>({});

  // 🚀 SERVER-SIDE SEARCH: For large tables (>1000 rows), search on demand instead of bulk download
  const [serverSearchRequired, setServerSearchRequired] = useState<Record<string, boolean>>({});
  const [serverSearchResults, setServerSearchResults] = useState<Record<string, any[]>>({});
  const [serverSearchLoading, setServerSearchLoading] = useState<Record<string, boolean>>({});
  const serverSearchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // 🆕 Auto-populate notification state
  const [autoPopulateMessage, setAutoPopulateMessage] = useState<string>('');
  
  // 🆕 Metadata display state - stores the selected item's metadata for each database dropdown field
  const [fieldMetadata, setFieldMetadata] = useState<Record<string, { label: string; data: Record<string, any> }>>({});

  // Load all shops from amb_shops table
  useEffect(() => {
    const loadShops = async () => {
      try {
        setLoadingShops(true);
        const supabase = getSupabaseClient();
        
        // 🔥 Load ALL shops using pagination (Supabase has a hard limit of 1000 rows per query)
        console.log('[Shops] 🔄 Fetching ALL shops from database (paginated)...');
        
        let allShops: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const from = page * pageSize;
          const to = from + pageSize - 1;

          console.log(`[Shops] 📦 Fetching batch ${page + 1} (rows ${from}-${to})...`);

          const { data, error } = await supabase
            .from('amb_shops')
            .select('*')
            .order('partner_name', { ascending: true })
            .range(from, to);

          if (error) {
            console.error('[Shops] Error loading shops:', error);
            break;
          }

          if (data && data.length > 0) {
            allShops = [...allShops, ...data];
            console.log(`[Shops] ✅ Batch ${page + 1}: ${data.length} shops (Total so far: ${allShops.length})`);
            
            // If we got less than pageSize, we've reached the end
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        console.log('[Shops] ✅ Total loaded from database:', allShops.length, 'shops');
        setShops(allShops);
        
        // 🔥 NEW: Create a lookup map for quick access
        const map: Record<string, any> = {};
        allShops.forEach(shop => {
          const key = `${shop.partner_name} / ${shop.usdm_name}`;
          map[key] = shop;
        });
        setShopLookupMap(map);
        console.log('[Shops] ✅ Lookup map created with', Object.keys(map).length, 'entries');
        
        // 🔥 CRITICAL: Set flag to trigger re-render on mobile
        setShopsLoaded(true);
        console.log('[Shops] ✅ shopsLoaded flag set to true - component should re-render');
      } catch (err) {
        console.error('[Shops] Failed to load shops:', err);
      } finally {
        setLoadingShops(false);
      }
    };

    loadShops();
  }, []);

  // Handle shop selection
  const handleShopSelect = (shop: any) => {
    setSelectedShop(shop);
    setShopName(shop.partner_name);
    setShopSearchQuery(shop.partner_name);
    setShowShopDropdown(false);
    
    console.log('[Shop Selected]', shop);
  };

  // Filter shops based on search query
  const filteredShops = shops.filter(shop =>
    shop.partner_name?.toLowerCase().includes(shopSearchQuery.toLowerCase()) ||
    shop.shop_code?.toLowerCase().includes(shopSearchQuery.toLowerCase()) ||
    shop.fp_code?.toLowerCase().includes(shopSearchQuery.toLowerCase())
  );

  // Load program fields from database
  useEffect(() => {
    const loadFields = async () => {
      try {
        console.log('[ProgramSubmitModal] Loading fields for program:', program.id);
        
        const supabase = getSupabaseClient();
        const { data, error: dbError } = await supabase
          .from('program_fields')
          .select('*')
          .eq('program_id', program.id)
          .order('order_index', { ascending: true });

        if (dbError) {
          console.error('[ProgramSubmitModal] Error loading fields:', dbError);
          throw dbError;
        }

        console.log('[ProgramSubmitModal] ✅ Loaded', data?.length || 0, 'fields');
        console.log('[ProgramSubmitModal] 🔍 Fields data:', JSON.stringify(data, null, 2));
        setFields(data || []);
        
        // 🆕 Load already-submitted values for fields with prevent_duplicates enabled
        const fieldsWithPreventDuplicates = (data || []).filter(field => 
          field.options?.prevent_duplicates || field.validation?.prevent_duplicates
        );
        
        if (fieldsWithPreventDuplicates.length > 0) {
          console.log('[ProgramSubmitModal] Loading already-submitted values for', fieldsWithPreventDuplicates.length, 'fields');
          
          // Fetch all existing submissions for this program
          const { data: submissions, error: submissionsError } = await supabase
            .from('submissions')
            .select('responses')
            .eq('program_id', program.id);
          
          if (!submissionsError && submissions) {
            const alreadySubmitted: Record<string, string[]> = {};
            
            // Extract submitted values for each field
            fieldsWithPreventDuplicates.forEach(field => {
              const values = new Set<string>();
              submissions.forEach(submission => {
                const value = submission.responses[field.id];
                if (value && typeof value === 'string') {
                  values.add(value);
                }
              });
              alreadySubmitted[field.id] = Array.from(values);
              console.log(`[ProgramSubmitModal] Field "${field.field_label}" has ${values.size} already-submitted values`);
            });
            
            setSubmittedValues(alreadySubmitted);
          }
        }
      } catch (err: any) {
        console.error('[ProgramSubmitModal] Failed to load fields:', err);
        setError('Failed to load program fields');
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [program.id]);

  // 🚀 SERVER-SIDE SEARCH: Debounced search for large tables (fires when user types)
  const performServerSearch = useCallback(async (fieldId: string, query: string, dbSource: any) => {
    if (!query || query.length < 2) {
      setServerSearchResults(prev => ({ ...prev, [fieldId]: [] }));
      return;
    }

    // 📱 PHONE NUMBER NORMALIZATION
    // Strips spaces, dashes, brackets — then strips Kenyan country code prefixes.
    // Handles: "762 349 445", "0762349445", "+254762349445", "254 762 349 445"
    let normalizedQuery = query.replace(/[\s\-().]/g, '');
    if (normalizedQuery.startsWith('+254') && normalizedQuery.length > 4) {
      normalizedQuery = normalizedQuery.slice(4);          // "+254762349445" → "762349445"
    } else if (normalizedQuery.startsWith('254') && normalizedQuery.length > 10) {
      normalizedQuery = normalizedQuery.slice(3);          // "254762349445"  → "762349445"
    } else if (normalizedQuery.startsWith('0') && normalizedQuery.length > 9) {
      normalizedQuery = normalizedQuery.slice(1);          // "0762349445"    → "762349445"
    }

    console.log(`[ServerSearch] 🔍 Raw: "${query}" → Normalized: "${normalizedQuery}"`);

    setServerSearchLoading(prev => ({ ...prev, [fieldId]: true }));
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(dbSource.table)
        .select('*')
        .ilike(dbSource.display_field, `%${normalizedQuery}%`)
        .limit(60);
      if (!error && data) {
        setServerSearchResults(prev => ({ ...prev, [fieldId]: data }));
        console.log(`[ServerSearch] ✅ "${normalizedQuery}" → ${data.length} results from ${dbSource.table}`);
      }
    } catch (err) {
      console.error('[ServerSearch] Error:', err);
    } finally {
      setServerSearchLoading(prev => ({ ...prev, [fieldId]: false }));
    }
  }, []);

  // 🆕 Load database dropdown data when fields are loaded
  useEffect(() => {
    const loadDatabaseDropdowns = async () => {
      if (fields.length === 0) return;

      // 🔒 Check if zone filtering is enabled for this program (explicit true required)
      const zoneFilterEnabled = program.zone_filtering_enabled === true;

      // ⏳ If zone filtering is enabled but userZone hasn't been fetched yet (undefined = loading), wait
      if (zoneFilterEnabled && userZone === undefined) {
        console.log('[DatabaseDropdown] ⏳ Zone filtering is ON but userZone not yet loaded — waiting...');
        return;
      }

      try {
        const supabase = getSupabaseClient();

        console.log('[DatabaseDropdown] 🔍 Checking fields:', fields.map(f => ({
          id: f.id,
          label: f.field_label,
          type: f.field_type,
          hasOptions: !!f.options,
          hasDbSource: !!f.options?.database_source,
          options: f.options
        })));

        // Find all fields with database_source configuration (dropdown or multi_select)
        const databaseFields = fields.filter(
          field => (field.field_type === 'dropdown' || field.field_type === 'multi_select') && field.options?.database_source
        );

        if (databaseFields.length === 0) {
          console.log('[DatabaseDropdown] ⚠️ No database dropdown fields found');
          console.log('[DatabaseDropdown] Total fields:', fields.length);
          console.log('[DatabaseDropdown] Dropdown fields:', fields.filter(f => f.field_type === 'dropdown').length);
          return;
        }

        console.log('[DatabaseDropdown] 🔄 Loading data for', databaseFields.length, 'database dropdown/multi-select field(s)');
        console.log(`[DatabaseDropdown] 🔒 Zone filtering: ${zoneFilterEnabled ? 'ENABLED' : 'DISABLED'} | User zone: ${userZone || 'N/A'}`);

        // Load data for each database dropdown field
        for (const field of databaseFields) {
          const dbSource = field.options.database_source;
          console.log(`[DatabaseDropdown] Loading from table: ${dbSource.table}`);

          setLoadingDatabaseDropdowns(prev => ({ ...prev, [field.id]: true }));

          try {
            // 🚀 OPTIMIZED: Load ONLY the first 1000 rows. If the table is larger,
            // switch to server-side search so we never download 100K+ rows upfront.
            const BATCH_SIZE = 1000;

            // 🔒 Detect zone column name with smart fallbacks
            let detectedZoneColumn: string | null = null;
            if (zoneFilterEnabled && userZone) {
              if (dbSource.zone_column) {
                detectedZoneColumn = dbSource.zone_column;
              } else {
                const zoneCandidate = (dbSource.metadata_fields || []).find((col: string) =>
                  col.toUpperCase() === 'ZONE' ||
                  col.toUpperCase() === 'ZONE_NAME' ||
                  col.toUpperCase() === 'REGION_ZONE' ||
                  col.toUpperCase().includes('ZONE')
                );
                detectedZoneColumn = zoneCandidate || 'ZONE';
              }
              console.log(`[DatabaseDropdown] 🔒 Will filter "${dbSource.table}" by "${detectedZoneColumn}" = "${userZone}"`);
            }

            console.log(`[DatabaseDropdown] 📦 Fetching first batch from ${dbSource.table} (max ${BATCH_SIZE} rows)...`);

            let query = supabase
              .from(dbSource.table)
              .select('*')
              .order(dbSource.display_field, { ascending: true })
              .range(0, BATCH_SIZE - 1);

            if (zoneFilterEnabled && userZone && detectedZoneColumn) {
              query = query.eq(detectedZoneColumn, userZone);
            }

            let { data, error } = await query;

            if (error) {
              // If zone column doesn't exist, retry without zone filter
              const isColumnError = error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST116';
              if (zoneFilterEnabled && detectedZoneColumn && isColumnError) {
                console.warn(`[DatabaseDropdown] ⚠️ Zone column "${detectedZoneColumn}" not found — retrying without zone filter`);
                const fallback = await supabase
                  .from(dbSource.table)
                  .select('*')
                  .order(dbSource.display_field, { ascending: true })
                  .range(0, BATCH_SIZE - 1);
                data = fallback.data;
                error = fallback.error;
              }
              if (error) {
                console.error(`[DatabaseDropdown] Error loading ${dbSource.table}:`, error);
                throw error;
              }
            }

            const rows = data || [];
            setDatabaseDropdownData(prev => ({ ...prev, [field.id]: rows }));

            if (rows.length >= BATCH_SIZE) {
              // Table is large — enable server-side search, stop downloading
              console.log(`[DatabaseDropdown] 🚀 "${dbSource.table}" has ${rows.length}+ rows → server-side search enabled`);
              setServerSearchRequired(prev => ({ ...prev, [field.id]: true }));
            } else {
              console.log(`[DatabaseDropdown] ✅ Loaded all ${rows.length} rows from "${dbSource.table}" (client-side search)`);
            }
          } catch (err: any) {
            console.error(`[DatabaseDropdown] Failed to load data for field ${field.field_label}:`, err);
          } finally {
            setLoadingDatabaseDropdowns(prev => ({ ...prev, [field.id]: false }));
          }
        }
      } catch (err) {
        console.error('[DatabaseDropdown] Error in loadDatabaseDropdowns:', err);
      }
    };

    loadDatabaseDropdowns();
  // ✅ Include userZone and zone_filtering_enabled so dropdown re-loads when zone becomes available
  }, [fields, userZone, program.zone_filtering_enabled]);
  
  console.log('[ProgramSubmitModal] Program:', program.title, 'with', fields.length, 'fields');
  
  // 🔥 DEBUG: Log when shops state changes (especially important on mobile)
  useEffect(() => {
    console.log('[ProgramSubmitModal] 🔄 Shops state updated:', shops.length, 'shops | shopsLoaded:', shopsLoaded, '| loadingShops:', loadingShops);
    if (shopsLoaded && shops.length > 0) {
      console.log('[ProgramSubmitModal] ✅ Component should now show search dropdown instead of radio buttons');
    }
  }, [shops.length, shopsLoaded, loadingShops]);

  // Get GPS location on mount — works with Capacitor (APK) or browser API (PWA)
  useEffect(() => {
    const requestLocation = async () => {
      try {
        setCapturingGPS(true);
        
        // Try Capacitor Geolocation first (APK context)
        if (CapacitorGeolocation) {
          try {
            const permissions = await CapacitorGeolocation.requestPermissions();
            if (permissions.location === 'granted' || permissions.location === 'prompt') {
              const position = await CapacitorGeolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000
              });
              setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
              setAccuracy(position.coords.accuracy);
              console.log('[GPS] Location obtained via Capacitor');
              setCapturingGPS(false);
              return;
            }
          } catch (capErr: any) {
            console.log('[GPS] Capacitor failed, trying browser API:', capErr.message);
          }
        }
        
        // Fallback: Browser Geolocation API (PWA context)
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
              setAccuracy(position.coords.accuracy);
              console.log('[GPS] Location obtained via browser API');
              setCapturingGPS(false);
            },
            (error) => {
              console.log('[GPS] Browser geolocation error:', error.message);
              setGpsError('Location unavailable - ensure GPS is enabled');
              setCapturingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
          );
        } else {
          setGpsError('Location unavailable in this browser');
          setCapturingGPS(false);
        }
      } catch (error: any) {
        console.log('[GPS] Location error:', error.message);
        setGpsError('Location unavailable - ensure GPS is enabled');
        setCapturingGPS(false);
      }
    };
    
    requestLocation();
  }, []);

  // 🆕 Handle photo upload for specific field
  const handlePhotoChange = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), ...newPhotos]
      }));
      console.log(`[Photo] Added ${newPhotos.length} photo(s) to field ${fieldId}`);
    }
  };

  // 🆕 Remove photo from specific field
  const removePhoto = (fieldId: string, index: number) => {
    setPhotos(prev => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((_, i) => i !== index)
    }));
    console.log(`[Photo] Removed photo ${index} from field ${fieldId}`);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    console.log(`[FieldChange] Setting field ${fieldId} to:`, value, Array.isArray(value) ? '(array)' : '(single)');
    setFormData(prev => {
      const updated = { ...prev, [fieldId]: value };
      console.log('[FieldChange] FormData after update:', updated);
      return updated;
    });
    
    // Check if this is a shop selection (format: "partner_name / usdm_name")
    if (typeof value === 'string' && value.includes(' / ')) {
      handleShopDropdownSelection(fieldId, value);
    }
    
    // 🆕 Check if this is a database dropdown selection that should auto-populate other fields
    const field = fields.find(f => f.id === fieldId);
    if (field?.field_type === 'dropdown' && field.options?.database_source) {
      // 🔥 If value is an array (multi-site selection), use the FIRST value for auto-populate
      const valueForAutoPopulate = Array.isArray(value) ? value[0] : value;
      if (valueForAutoPopulate) {
        console.log(`[FieldChange] Auto-populating from:`, valueForAutoPopulate, Array.isArray(value) ? `(first of ${value.length} sites)` : '');
        handleDatabaseDropdownSelection(fieldId, valueForAutoPopulate, field);
      }
    }
  };

  // Handle shop selection from dropdown fields
  const handleShopDropdownSelection = async (fieldId: string, selectedValue: string) => {
    try {
      console.log('[Shop Dropdown] Selection triggered for field:', fieldId, 'Value:', selectedValue);
      
      // 🔥 NEW: Use instant lookup map instead of database query
      const shopData = shopLookupMap[selectedValue];
      
      if (!shopData) {
        console.warn('[Shop Dropdown] ⚠️ Shop not found in lookup map:', selectedValue);
        console.log('[Shop Dropdown] Available keys sample:', Object.keys(shopLookupMap).slice(0, 5));
        return;
      }
      
      console.log('[Shop Dropdown] ✅ Shop details loaded instantly:', shopData);
      console.log('[Shop Dropdown] Setting fieldShopSelections for field:', fieldId);
      
      // Store shop details for this field
      const updatedSelections = {
        ...fieldShopSelections,
        [fieldId]: shopData
      };
      setFieldShopSelections(updatedSelections);
      
      console.log('[Shop Dropdown] Field shop selections updated:', updatedSelections);
      
      // 🔥 IMPORTANT: Also update formData to include shop details for submission
      setFormData({
        ...formData,
        [fieldId]: selectedValue, // Keep the display value
        [`${fieldId}_shop_code`]: shopData.shop_code,
        [`${fieldId}_fp_code`]: shopData.fp_code,
        [`${fieldId}_usdm_name`]: shopData.usdm_name,
        [`${fieldId}_partner_name`]: shopData.partner_name
      });
      
      console.log('[Shop Dropdown] ✅ Shop details added to formData for submission');
    } catch (err) {
      console.error('[Shop Dropdown] Failed to fetch shop details:', err);
    }
  };

  // 🆕 Handle database dropdown selection and auto-populate metadata fields
  const handleDatabaseDropdownSelection = (fieldId: string, selectedValue: string, field: any) => {
    try {
      const dbSource = field.options?.database_source;
      if (!dbSource || !dbSource.metadata_fields || dbSource.metadata_fields.length === 0) {
        console.log('[AutoPopulate] No metadata fields configured for this field');
        return;
      }

      // 🆕 If value is empty, clear the metadata display
      if (!selectedValue || selectedValue === '') {
        setFieldMetadata(prev => {
          const updated = { ...prev };
          delete updated[fieldId];
          return updated;
        });
        console.log('[AutoPopulate] Cleared metadata for field:', fieldId);
        return;
      }

      console.log('[AutoPopulate] ��� Database dropdown selection:', {
        field: field.field_label,
        value: selectedValue,
        table: dbSource.table,
        displayField: dbSource.display_field,
        metadataFields: dbSource.metadata_fields,
      });

      // Find the selected row data — check server search results first, then pre-loaded data
      const dbData = serverSearchResults[fieldId]?.length
        ? serverSearchResults[fieldId]
        : (databaseDropdownData[fieldId] || []);
      if (!dbData || dbData.length === 0) {
        console.warn('[AutoPopulate] ⚠️ No data loaded for this field');
        return;
      }

      // Find the row that matches the selected value
      const selectedRow = dbData.find((row: any) => row[dbSource.display_field] === selectedValue);
      if (!selectedRow) {
        console.warn('[AutoPopulate] ⚠️ Selected value not found in loaded data:', selectedValue);
        return;
      }

      console.log('[AutoPopulate] ✅ Found selected row:', selectedRow);

      // Store the metadata for display in blue box
      const metadataToShow: Record<string, any> = {};
      dbSource.metadata_fields.forEach((metadataFieldName: string) => {
        if (selectedRow[metadataFieldName] !== undefined) {
          metadataToShow[metadataFieldName] = selectedRow[metadataFieldName];
        }
      });

      // Update metadata display state
      if (Object.keys(metadataToShow).length > 0) {
        setFieldMetadata(prev => ({
          ...prev,
          [fieldId]: {
            label: selectedValue,
            data: metadataToShow
          }
        }));
        console.log('[AutoPopulate] 📦 Stored metadata for display:', metadataToShow);
      }

      // Auto-populate: Find all fields that match metadata field names and fill them
      const autoPopulatedValues: Record<string, any> = {};
      const populatedFields: string[] = [];

      dbSource.metadata_fields.forEach((metadataFieldName: string) => {
        // Find a field in the form that matches this metadata field name
        const targetField = fields.find(f => {
          const normalizedFieldName = f.field_name.toLowerCase().replace(/_/g, '').replace(/\s/g, '');
          const normalizedMetadata = metadataFieldName.toLowerCase().replace(/_/g, '').replace(/\s/g, '');
          return normalizedFieldName === normalizedMetadata;
        });

        if (targetField && selectedRow[metadataFieldName] !== undefined) {
          const valueToSet = selectedRow[metadataFieldName];
          autoPopulatedValues[targetField.id] = valueToSet;
          populatedFields.push(`${targetField.field_label} = ${valueToSet}`);
          console.log('[AutoPopulate] ✅ Auto-filled:', targetField.field_label, '→', valueToSet);
        }
      });

      // Update formData with all auto-populated values using functional update to avoid stale state
      if (Object.keys(autoPopulatedValues).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...autoPopulatedValues
        }));
        
        console.log('[AutoPopulate] 🎉 Auto-populated', populatedFields.length, 'fields:', populatedFields);
        
        // Show success message to user
        setAutoPopulateMessage(`✅ Auto-filled ${populatedFields.length} field${populatedFields.length > 1 ? 's' : ''}`);
        setTimeout(() => setAutoPopulateMessage(''), 3000); // Clear after 3 seconds
      } else {
        console.log('[AutoPopulate] ℹ️ No matching fields found to auto-populate');
      }
    } catch (err) {
      console.error('[AutoPopulate] ❌ Error during auto-population:', err);
    }
  };

  // Drop Pin - actively capture GPS location
  const dropPin = () => {
    if (navigator.geolocation) {
      setCapturingGPS(true);
      setGpsError('');
      setRetryCount(prev => prev + 1);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setAccuracy(position.coords.accuracy);
          console.log('[GPS] 📍 Pin dropped at:', position.coords.latitude.toFixed(6), position.coords.longitude.toFixed(6), 'Accuracy:', position.coords.accuracy.toFixed(0), 'm');
          setCapturingGPS(false);
        },
        (error) => {
          console.log('[GPS] ℹ️ Re-scan failed:', error.message, '(expected in preview environment)');
          setCapturingGPS(false);
          
          // User-friendly error messages
          if (error.code === error.PERMISSION_DENIED) {
            setGpsError('Location unavailable in preview - will work on deployed app');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGpsError('Location unavailable - ensure GPS is enabled');
          } else if (error.code === error.TIMEOUT) {
            setGpsError('Location timeout - try again in open area');
          } else {
            // Permissions policy or other browser security
            setGpsError('Location unavailable in preview - will work on deployed app');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Force fresh location
        }
      );
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate required fields
      const validationErrors: Record<string, boolean> = {};
      console.log('[Submit] Starting validation...', { 
        totalFields: fields.length, 
        formData,
        photos: Object.keys(photos).map(k => ({ fieldId: k, count: photos[k].length }))
      });
      
      for (const field of fields) {
        if (field.is_required) {
          // Special handling for photo upload fields
          if (field.field_type === 'photo' || field.field_type === 'photo_upload') {
            // Check if at least one photo has been uploaded for this field
            if (!photos[field.id] || photos[field.id].length === 0) {
              console.log(`[Submit] ❌ Validation failed for photo field: "${field.label}" (${field.id}) - no photos uploaded`);
              validationErrors[field.id] = true;
            } else {
              console.log(`[Submit] ✅ Photo field valid: "${field.label}" has ${photos[field.id].length} photo(s)`);
            }
          } 
          // 🆕 Special handling for repeatable_number fields
          else if (field.field_type === 'repeatable_number') {
            const entries = formData[field.id];
            const minEntries = field.options?.min_entries || 1;
            const digitLength = field.options?.digit_length;
            const preventDuplicates = field.options?.prevent_duplicates;
            const checkDatabase = field.options?.check_database;
            
            // Check if minimum entries are provided
            if (!entries || !Array.isArray(entries) || entries.length < minEntries) {
              console.log(`[Submit] ❌ Validation failed for repeatable_number field: "${field.label}" (${field.id}) - need ${minEntries}, have ${entries?.length || 0}`);
              validationErrors[field.id] = true;
            } else {
              // Check if all entries have values
              const hasEmptyEntries = entries.some((entry: any) => entry === '' || entry === null || entry === undefined);
              if (hasEmptyEntries) {
                console.log(`[Submit] ❌ Validation failed for repeatable_number field: "${field.label}" (${field.id}) - has empty entries`);
                validationErrors[field.id] = true;
              } else if (digitLength) {
                // 🆕 Check if all entries match the exact digit length requirement
                const invalidEntries = entries.filter((entry: any) => {
                  const entryStr = entry.toString();
                  return entryStr.length !== digitLength;
                });
                
                if (invalidEntries.length > 0) {
                  console.log(`[Submit] ❌ Validation failed for repeatable_number field: "${field.label}" (${field.id}) - ${invalidEntries.length} entries don't match required ${digitLength} digits`);
                  validationErrors[field.id] = true;
                } else if (preventDuplicates) {
                  // 🆕 Check for duplicate values within the same submission
                  const uniqueValues = new Set(entries.map((e: any) => e.toString()));
                  if (uniqueValues.size < entries.length) {
                    const duplicateCount = entries.length - uniqueValues.size;
                    console.log(`[Submit] ❌ Validation failed for repeatable_number field: "${field.label}" (${field.id}) - contains ${duplicateCount} duplicate value(s)`);
                    validationErrors[field.id] = true;
                    validationErrors[`${field.id}_duplicate`] = true; // Special flag for duplicate error
                  } else {
                    console.log(`[Submit] ✅ Repeatable field valid: "${field.label}" has ${entries.length} unique entries with exactly ${digitLength} digits each`);
                  }
                } else {
                  console.log(`[Submit] ✅ Repeatable field valid: "${field.label}" has ${entries.length} entries with exactly ${digitLength} digits each`);
                }
              } else if (preventDuplicates) {
                // Check for duplicates even without digit length requirement
                const uniqueValues = new Set(entries.map((e: any) => e.toString()));
                if (uniqueValues.size < entries.length) {
                  const duplicateCount = entries.length - uniqueValues.size;
                  console.log(`[Submit] ❌ Validation failed for repeatable_number field: "${field.label}" (${field.id}) - contains ${duplicateCount} duplicate value(s)`);
                  validationErrors[field.id] = true;
                  validationErrors[`${field.id}_duplicate`] = true;
                } else {
                  console.log(`[Submit] ✅ Repeatable field valid: "${field.label}" has ${entries.length} unique entries`);
                }
              } else {
                console.log(`[Submit] ✅ Repeatable field valid: "${field.label}" has ${entries.length} entries`);
              }
            }
          } 
          else {
            // For all other field types, check formData
            const value = formData[field.id];
            // Allow 0 and false as valid values, but reject null, undefined, and empty strings
            if (value === '' || value === null || value === undefined) {
              console.log(`[Submit] ❌ Validation failed for field: "${field.label}" (${field.id}, type: ${field.field_type}) - value is empty:`, value);
              validationErrors[field.id] = true;
            } else {
              console.log(`[Submit] ✅ Field valid: "${field.label}" = "${value}"`);
            }
          }
        }
      }
      
      if (Object.keys(validationErrors).length > 0) {
        console.log('[Submit] ❌ VALIDATION FAILED - Errors:', validationErrors);
        console.log('[Submit] Failed fields:', fields.filter(f => validationErrors[f.id]).map(f => ({ label: f.label, id: f.id, type: f.field_type })));
        setValidationErrors(validationErrors);
        setError('❌ Please fill in all required fields (marked with *)');
        setSubmitting(false);
        return;
      }
      
      // 🆕 Check database for same-day duplicates if configured
      console.log('[Submit] 🔍 Checking for database duplicate protection...');
      for (const field of fields) {
        if (field.field_type === 'repeatable_number' && field.options?.check_database) {
          const entries = formData[field.id];
          if (entries && Array.isArray(entries) && entries.length > 0) {
            console.log(`[Submit] 🔍 Checking database for duplicates in field: "${field.label}"`);
            
            // Get today's date range (start and end of day in local timezone)
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            try {
              // Query submissions for this program submitted today
              // NOTE: Using 'responses' column (not 'form_data')
              console.log(`[Submit] 🔍 Querying database using 'responses' column for program ${program.id}`);
              const supabase = getSupabaseClient();
              const { data: todaySubmissions, error: dbError } = await supabase
                .from('submissions')
                .select('responses')
                .eq('program_id', program.id)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());
              
              if (dbError) {
                console.error(`[Submit] ❌ Database check error for field "${field.label}":`, dbError);
                throw new Error(`Failed to check for duplicate entries: ${dbError.message}`);
              }
              
              console.log(`[Submit] 📊 Found ${todaySubmissions?.length || 0} submissions today for this program`);
              
              // Extract all values for this field from today's submissions
              const existingValues = new Set<string>();
              todaySubmissions?.forEach((submission: any) => {
                const fieldData = submission.responses?.[field.id];
                if (fieldData && Array.isArray(fieldData)) {
                  fieldData.forEach((value: any) => {
                    existingValues.add(value.toString());
                  });
                }
              });
              
              console.log(`[Submit] 📊 Found ${existingValues.size} existing values in database for field "${field.label}"`);
              
              // Check if any of the current entries already exist
              const duplicateEntries = entries.filter((entry: any) => 
                existingValues.has(entry.toString())
              );
              
              if (duplicateEntries.length > 0) {
                console.log(`[Submit] ❌ Database duplicate detected for field "${field.label}":`, duplicateEntries);
                validationErrors[field.id] = true;
                validationErrors[`${field.id}_database_duplicate`] = duplicateEntries; // Store the duplicate values
                setValidationErrors(validationErrors);
                setError(`❌ The following ${field.options.entry_label || 'number'}(s) were already submitted today: ${duplicateEntries.join(', ')}`);
                setSubmitting(false);
                return;
              }
              
              console.log(`[Submit] ✅ No database duplicates found for field "${field.label}"`);
            } catch (err: any) {
              console.error(`[Submit] ❌ Error checking database duplicates:`, err);
              setError(`❌ ${err.message}`);
              setSubmitting(false);
              return;
            }
          }
        }
      }
      
      console.log('[Submit] ✅ All validations passed!');

      // 🆕 Combine all photos from all fields into a single array
      const allPhotos: File[] = [];
      Object.values(photos).forEach(fieldPhotos => {
        allPhotos.push(...fieldPhotos);
      });

      console.log('[Submit] Starting submission...', {
        programId: program.id,
        userId,
        formData,
        totalPhotos: allPhotos.length,
        photosByField: Object.keys(photos).reduce((acc, fieldId) => {
          acc[fieldId] = photos[fieldId].length;
          return acc;
        }, {} as Record<string, number>),
        location,
        shopName,
        submissionDate,
        submissionTime,
      });

      // Convert photos to base64 for storage
      const photoData = [];
      for (const photo of allPhotos) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(photo);
        });
        photoData.push({
          name: photo.name,
          type: photo.type,
          size: photo.size,
          data: base64,
          timestamp: new Date().toISOString(),
        });
      }

      console.log('[Submit] Photos converted to base64:', photoData.length);

      // ✅ BYPASS EDGE FUNCTION - Write directly to Supabase database
      console.log('[Submit] Writing directly to database (bypassing Edge Function)...');
      
      const supabase = getSupabaseClient();
      
      // Award points based on program's points_enabled setting
      // Use nullish coalescing (??) so that 0 is treated as a valid value, not falsy
      const pointsToAward = (program.points_enabled !== false) ? (program.points_value ?? 10) : 0;
      console.log('[Submit] Points to award:', pointsToAward, '(points_enabled:', program.points_enabled, ')');

      const { data: submission, error: dbError } = await supabase
        .from('submissions')
        .insert({
          program_id: program.id,
          user_id: userId,
          responses: {
            ...formData,
            // Include auto-captured metadata in responses
            _shop_name: shopName,
            _submission_date: submissionDate,
            _submission_time: submissionTime,
          },
          photos: photoData.map(p => p.data), // Store base64 strings
          gps_location: location ? { lat: location.lat, lng: location.lng } : null,
          status: 'submitted', // All submissions are automatically collected
          points_awarded: pointsToAward, // Automatically award points
          // submitted_at will be auto-set by database DEFAULT NOW()
        })
        .select()
        .single();

      if (dbError) {
        console.error('[Submit] Database error:', dbError);
        throw new Error(dbError.message || 'Failed to save submission to database');
      }

      console.log('[Submit] ✅ Submission saved' + (pointsToAward > 0 ? ` and ${pointsToAward} points awarded!` : ' (no points - tracking only)'), submission);

      // Update user's total points only if points were awarded
      if (pointsToAward > 0) {
        const { data: currentUser } = await supabase
          .from('app_users')
          .select('total_points')
          .eq('id', userId)
          .single();

        const newTotal = (currentUser?.total_points || 0) + pointsToAward;

        const { error: pointsError } = await supabase
          .from('app_users')
          .update({ 
            total_points: newTotal
          })
          .eq('id', userId);

        if (pointsError) {
          console.error('[Submit] Error updating user points:', pointsError);
          // Don't throw - submission is already saved
        } else {
          console.log('[Submit] ✅ User points updated (+', pointsToAward, 'points). New total:', newTotal);
        }

        // Update localStorage with new points
        const storedUser = localStorage.getItem('tai_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.total_points = newTotal;
          localStorage.setItem('tai_user', JSON.stringify(user));
        }

        // ✅ Track the submission in analytics
        await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
          program_id: program.id,
          program_title: program.title,
          points_awarded: pointsToAward,
          photos_count: photos.length,
          has_gps: !!location,
          submission_id: submission.id,
        });

        onSuccess(pointsToAward, newTotal);
      } else {
        console.log('[Submit] ℹ️ No points awarded (points_enabled = false)');
        // Get current total for success callback
        const { data: currentUser } = await supabase
          .from('app_users')
          .select('total_points')
          .eq('id', userId)
          .single();
        
        // ✅ Track the submission in analytics (even though no points)
        await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
          program_id: program.id,
          program_title: program.title,
          points_awarded: 0,
          photos_count: photos.length,
          has_gps: !!location,
          submission_id: submission.id,
        });

        onSuccess(0, currentUser?.total_points || 0);
      }
    } catch (err: any) {
      console.error('[Submit] Error:', err);
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFields) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading program details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get user info for header badge
  const getUserInfo = () => {
    try {
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return {
          name: user.full_name || 'User',
          role: user.role || ''
        };
      }
    } catch (err) {
      console.error('[ProgramSubmitModal] Error getting user info:', err);
    }
    return { name: 'User', role: '' };
  };

  const userInfo = getUserInfo();
  const roleDisplay = userInfo.role === 'zonal_sales_manager' ? 'ZSM' :
                      userInfo.role === 'zone_business_lead' ? 'ZBM' :
                      userInfo.role === 'sales_executive' ? 'SE' : '';

  // 🆕 Check if user's role is allowed to submit this program
  const canSubmit = !program.who_can_submit || program.who_can_submit.length === 0 || program.who_can_submit.includes(userInfo.role);
  
  // If user cannot submit, show a different modal
  if (!canSubmit) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cannot Submit</h3>
            <p className="text-gray-600 mb-4">
              Your role ({roleDisplay || userInfo.role}) is not allowed to submit this program.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Only the following roles can submit: {program.who_can_submit?.map(r => 
                r === 'zonal_sales_manager' ? 'ZSM' :
                r === 'zone_business_lead' ? 'ZBM' :
                r === 'sales_executive' ? 'SE' : r
              ).join(', ')}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-2">{program.title}</h2>
            <p className="text-gray-600">{program.description}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {program.points_enabled !== false && (program.points_value > 0) ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Star className="w-5 h-5" />
                  <span>{program.points_value} points</span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold border border-gray-300">
                  📋 Tracking Only (No Points)
                </div>
              )}
              {roleDisplay && (
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                  ✅ Submitting as: {roleDisplay}
                </div>
              )}
              {/* GPS Status Indicator */}
              {capturingGPS && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Getting location...</span>
                </div>
              )}
              {location && !capturingGPS && (
                <div className="flex items-center gap-2 text-green-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">Location captured ✓</span>
                </div>
              )}
              {gpsError && !location && !capturingGPS && (
                <div className="flex items-center gap-2 text-orange-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">GPS unavailable (tap to retry)</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drop Pin Button - At the top (only if GPS auto-detect is enabled) */}
        {(program.gps_auto_detect_enabled !== false) && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-blue-900">📍 Fixed Live Location</h3>
            <div className="ml-auto">
              <span className="text-xs px-2 py-1 bg-blue-200 text-blue-900 rounded-full font-semibold">
                ��� Auto-Detect Only
              </span>
            </div>
          </div>
          
          {capturingGPS && (
            <div className="mb-4 bg-white border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-900 text-sm mb-1">Scanning for GPS signal...</div>
                  <div className="text-xs text-blue-700">Using high-accuracy mode {retryCount > 0 && `(Attempt ${retryCount + 1})`}</div>
                </div>
              </div>
            </div>
          )}
          
          {!location && !capturingGPS && (
            <button
              onClick={dropPin}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all"
            >
              <MapPin className="w-6 h-6" />
              📍 Auto-Detect My Location
            </button>
          )}
          
          {location && (
            <div className="bg-white border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-green-800 text-base mb-1">✅ Location Locked</div>
                  <div className="text-xs text-green-700 mb-2">Your exact position has been captured</div>
                  
                  {/* Coordinates Display */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-mono text-gray-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-bold">{location.lat.toFixed(8)}°</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-bold">{location.lng.toFixed(8)}°</span>
                      </div>
                      {accuracy && (
                        <div className="flex justify-between items-center border-t border-gray-200 pt-1 mt-1">
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="font-bold text-blue-700">±{accuracy.toFixed(0)}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg font-semibold transition-colors"
                    >
                      🗺️ View on Map
                    </a>
                    <button
                      onClick={dropPin}
                      disabled={capturingGPS}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      🔄 Re-scan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {gpsError && !location && !capturingGPS && (
            <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">⚠️</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-red-900 text-sm mb-1">GPS Signal Lost</div>
                  <div className="text-xs text-red-700 mb-3">{gpsError}</div>
                  
                  <button
                    onClick={dropPin}
                    disabled={capturingGPS}
                    className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <MapPin className="w-5 h-5" />
                    Retry Location Scan
                  </button>
                  
                  <div className="mt-3 text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                    <div className="font-semibold mb-1">💡 Boost GPS Accuracy:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Move to an open area away from buildings</li>
                      <li>Ensure location permissions are enabled</li>
                      <li>Wait a few seconds for GPS to lock on</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {/* 🆕 Auto-populate Success Toast */}
        {autoPopulateMessage && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg text-green-800 animate-pulse shadow-lg">
            <div className="font-semibold flex items-center gap-2">
              <span className="text-2xl">✨</span>
              {autoPopulateMessage}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <div className="font-semibold mb-2">{error}</div>
            {error.includes('permission denied') && (
              <div className="mt-3 p-3 bg-white border border-red-300 rounded text-sm">
                <div className="font-semibold text-red-900 mb-2">🔧 Quick Fix:</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Open Supabase SQL Editor</li>
                  <li>Run: <code className="bg-gray-100 px-1 py-0.5 rounded">/database/ONE-CLICK-FIX.sql</code></li>
                  <li>Refresh this page</li>
                </ol>
                <div className="mt-2 text-xs text-gray-600">
                  See <code>/database/QUICK-START.md</code> for details
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6" key={`fields-${shops.length}-${shopsLoaded}`}>
          {fields.map((field) => {
            // 🆕 SKIP Van Calendar site fields ONLY if progressive disclosure is enabled
            const isSiteField = /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\d+$/.test(field.field_name);
            if (shouldSkipField(field)) {
              return null;
            }
            
            // Support both field_label and label, field_type and type
            const label = field.field_label || field.label || field.field_name;
            let fieldType = field.field_type || field.type;
            const required = field.is_required || field.required;
            
            // 🆕 Check if this is a database dropdown field
            const isDatabaseDropdown = fieldType === 'dropdown' && field.options?.database_source;
            const dbSource = isDatabaseDropdown ? field.options.database_source : null;
            
            // 🔥 FIX: For shop dropdowns, use actual shops from database instead of static options
            // SAFETY: For database dropdowns, options should be empty array initially
            let options = field.options?.options || [];
            // If field.options exists but is not an array and has no 'options' property, it might be a config object
            if (!Array.isArray(options) && field.options && !field.options.options && !isDatabaseDropdown) {
              // This is an object like {database_source: {...}}, not an array
              options = [];
            }
            // Only detect as shop field if it's NOT a photo field and includes shop/location/amb name keywords
            const isShopField = !isDatabaseDropdown && fieldType !== 'photo' && 
              (label?.toLowerCase().includes('shop') || 
               label?.toLowerCase().includes('location') || 
               (label?.toLowerCase().includes('amb') && label?.toLowerCase().includes('name')));
            
            // 🔥 DEBUG: Log field rendering state
            if (isShopField) {
              console.log('[Field Render]', label, '| fieldType:', fieldType, '| shops.length:', shops.length, '| isShopField:', isShopField);
            }
            
            // 🔥 AUTO-CONVERT: If it's a shop field with many options, force it to be a searchable dropdown
            if (isShopField && shops.length > 0) {
              // Dynamically generate shop options from the loaded shops
              options = shops.map(shop => `${shop.partner_name} / ${shop.usdm_name}`);
              // Force dropdown/select type for shop fields (override radio)
              if (fieldType === 'radio' || options.length > 10) {
                const oldType = fieldType;
                fieldType = 'dropdown';
                console.log('[ProgramSubmitModal] 🔄 Auto-converted', label, 'from', oldType, 'to dropdown (', options.length, 'shops )');
              } else {
                console.log('[ProgramSubmitModal] 🔥 Using dynamic shop options:', options.length, 'shops');
              }
            }
            
            const hasError = validationErrors[field.id];
            const errorClass = hasError ? 'border-red-500 bg-red-50' : 'border-gray-300';

            return (
              <div key={field.id}>
                <label className="block mb-2 text-gray-800 font-medium text-sm">
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {/* 🔥 Show loading indicator for shop fields while shops are loading */}
                {isShopField && loadingShops && (
                  <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg bg-blue-50 flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-700 text-sm font-medium">Loading shops... ({shops.length} so far)</span>
                  </div>
                )}
                
                {/* 🔥 Only show field inputs if not a shop field OR if shops have finished loading */}
                {(!isShopField || !loadingShops) && (<>
                
                {/* Text Input */}
                {fieldType === 'text' && (
                  <input
                    type="text"
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2 border rounded-lg ${errorClass}`}
                  />
                )}

                {/* Long Text / Textarea */}
                {(fieldType === 'textarea' || fieldType === 'long_text') && (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg ${errorClass}`}
                  />
                )}

                {/* Number */}
                {fieldType === 'number' && (
                  <input
                    type="number"
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-2 border rounded-lg ${errorClass}`}
                  />
                )}

                {/* 🆕 Repeatable Number */}
                {fieldType === 'repeatable_number' && (() => {
                  const minEntries = field.options?.min_entries || 1;
                  const maxEntries = field.options?.max_entries;
                  const entryLabel = field.options?.entry_label || 'Entry';
                  const currentEntries = formData[field.id] || Array(minEntries).fill('');

                  const addEntry = () => {
                    if (!maxEntries || currentEntries.length < maxEntries) {
                      handleFieldChange(field.id, [...currentEntries, '']);
                    }
                  };

                  const removeEntry = (index: number) => {
                    if (currentEntries.length > minEntries) {
                      const newEntries = currentEntries.filter((_: any, i: number) => i !== index);
                      handleFieldChange(field.id, newEntries);
                    }
                  };

                  const updateEntry = (index: number, value: string) => {
                    const newEntries = [...currentEntries];
                    let processedValue = value;
                    
                    console.log(`[RepeatableNumber] 🔢 Input received:`, { value, digitLength, beforeLength: processedValue.length });
                    
                    // 🆕 Only allow numeric characters
                    processedValue = processedValue.replace(/[^0-9]/g, '');
                    
                    // 🆕 Enforce digit length restriction (prevent typing more digits)
                    if (digitLength && processedValue && processedValue.length > digitLength) {
                      console.log(`[RepeatableNumber] ✂️ Truncating from ${processedValue.length} to ${digitLength} digits`);
                      processedValue = processedValue.substring(0, digitLength);
                    }
                    
                    // 🆕 Auto-remove leading zero if configured
                    if (field.options?.remove_leading_zero && processedValue && processedValue.startsWith('0')) {
                      console.log(`[RepeatableNumber] 🔄 Removing leading zero`);
                      processedValue = processedValue.substring(1);
                    }
                    
                    console.log(`[RepeatableNumber] ✅ Final value:`, processedValue);
                    newEntries[index] = processedValue ? parseFloat(processedValue) : '';
                    handleFieldChange(field.id, newEntries);
                  };

                  const digitLength = field.options?.digit_length;
                  const removeLeadingZero = field.options?.remove_leading_zero;
                  const preventDuplicates = field.options?.prevent_duplicates;
                  const checkDatabase = field.options?.check_database;
                  const databaseDuplicates = validationErrors[`${field.id}_database_duplicate`];
                  
                  // 🆕 Check if entries match digit length requirement
                  const getEntryError = (entry: any) => {
                    if (!entry && entry !== 0) return false;
                    if (!digitLength) return false;
                    const entryStr = entry.toString();
                    return entryStr.length !== digitLength;
                  };

                  // 🆕 Check for duplicate values
                  const getDuplicates = () => {
                    const valueCounts = new Map<string, number>();
                    currentEntries.forEach((entry: any) => {
                      if (entry || entry === 0) {
                        const key = entry.toString();
                        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
                      }
                    });
                    return Array.from(valueCounts.entries())
                      .filter(([_, count]) => count > 1)
                      .map(([value, _]) => value);
                  };

                  const isDuplicate = (entry: any) => {
                    if (!entry && entry !== 0) return false;
                    if (!preventDuplicates) return false;
                    const duplicates = getDuplicates();
                    return duplicates.includes(entry.toString());
                  };

                  const isInDatabase = (entry: any) => {
                    if (!entry && entry !== 0) return false;
                    if (!databaseDuplicates || !Array.isArray(databaseDuplicates)) return false;
                    return databaseDuplicates.some((dup: any) => dup.toString() === entry.toString());
                  };

                  return (
                    <div className="space-y-3">
                      <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                        <p className="text-xs text-gray-600">
                          Required: {minEntries} {entryLabel.toLowerCase()}{minEntries !== 1 ? 's' : ''}
                          {maxEntries && ` | Maximum: ${maxEntries}`}
                        </p>
                        {digitLength && (
                          <p className="text-xs text-teal-700 font-medium mt-1">
                            📱 Each number must be exactly {digitLength} digits
                            {removeLeadingZero && ' (leading 0 will be removed)'}
                          </p>
                        )}
                        {(preventDuplicates || checkDatabase) && (
                          <p className="text-xs text-red-700 font-medium mt-1">
                            🛡️ No duplicates allowed
                          </p>
                        )}
                      </div>
                      
                      {validationErrors[`${field.id}_duplicate`] && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                          <strong className="font-bold">Duplicate entries detected!</strong>
                          <span className="block sm:inline"> You cannot enter the same {entryLabel.toLowerCase()} twice.</span>
                        </div>
                      )}
                      
                      {databaseDuplicates && Array.isArray(databaseDuplicates) && databaseDuplicates.length > 0 && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                          <strong className="font-bold">Already submitted today!</strong>
                          <span className="block sm:inline"> The following {entryLabel.toLowerCase()}(s) were already submitted today: {databaseDuplicates.join(', ')}</span>
                        </div>
                      )}
                      
                      {currentEntries.map((value: any, index: number) => {
                        const hasError = getEntryError(value);
                        const hasDuplicate = isDuplicate(value);
                        const inDatabase = isInDatabase(value);
                        const hasAnyError = hasError || hasDuplicate || inDatabase;
                        return (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-24 flex-shrink-0">
                            {entryLabel} {index + 1}:
                          </span>
                          <div className="flex-1">
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={value}
                              onChange={(e) => updateEntry(index, e.target.value)}
                              placeholder={digitLength ? `${digitLength} digits` : "Enter number"}
                              className={`w-full px-4 py-2 border rounded-lg ${
                                inDatabase ? 'border-red-600 bg-red-100' : 
                                hasDuplicate ? 'border-orange-500 bg-orange-50' :
                                hasError ? 'border-red-500 bg-red-50' : 
                                errorClass
                              }`}
                            />
                            {inDatabase && (
                              <p className="text-xs text-red-600 font-bold mt-1">
                                ❌ Already submitted today by someone else!
                              </p>
                            )}
                            {!inDatabase && hasDuplicate && (
                              <p className="text-xs text-orange-600 font-bold mt-1">
                                ⚠️ Duplicate! This number appears multiple times
                              </p>
                            )}
                            {!inDatabase && !hasDuplicate && hasError && (
                              <p className="text-xs text-red-600 mt-1">
                                Must be exactly {digitLength} digits (currently {value.toString().length})
                              </p>
                            )}
                          </div>
                          {currentEntries.length > minEntries && (
                            <button
                              type="button"
                              onClick={() => removeEntry(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        );
                      })}
                      
                      {(!maxEntries || currentEntries.length < maxEntries) && (
                        <button
                          type="button"
                          onClick={addEntry}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors font-medium"
                        >
                          + Add More {entryLabel}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Dropdown / Select */}
                {(fieldType === 'select' || fieldType === 'dropdown') && (
                  <>
                    {/* 🆕 Database Dropdown Loading Indicator */}
                    {isDatabaseDropdown && loadingDatabaseDropdowns[field.id] && (
                      <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg bg-blue-50 flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-700 text-sm font-medium">Loading {field.field_label || label}...</span>
                      </div>
                    )}
                    
                    {/* Show dropdown when not loading (or when regular dropdown) */}
                    {(!isDatabaseDropdown || !loadingDatabaseDropdowns[field.id]) && (() => {
                      // 🚀 Server-search mode: use server results; otherwise use pre-loaded data
                      const isServerSearch = isDatabaseDropdown && serverSearchRequired[field.id];
                      let dropdownOptions = options;
                      if (isDatabaseDropdown) {
                        const sourceData = isServerSearch
                          ? (serverSearchResults[field.id] || [])
                          : (databaseDropdownData[field.id] || []);
                        dropdownOptions = sourceData.map((row: any) => row[dbSource!.display_field]);
                        if (!isServerSearch) {
                          console.log(`[DatabaseDropdown] Generated ${dropdownOptions.length} options for ${label}`);
                        }
                      }
                      
                      // 🔥 SAFETY CHECK: Ensure dropdownOptions is always an array
                      if (!Array.isArray(dropdownOptions)) {
                        dropdownOptions = [];
                      }
                      
                      const itemsLabel = isDatabaseDropdown ? (field.field_label || label) : 'shops';
                      
                      return (
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="search"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          value={field.id in fieldSearchQueries ? fieldSearchQueries[field.id] : (formData[field.id] || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            console.log('[Dropdown] ⌨️ Input changed:', val);
                            setFieldSearchQueries({ ...fieldSearchQueries, [field.id]: val });
                            setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: true });
                            if (val === '') handleFieldChange(field.id, '');
                            // 🚀 Server-side search: debounce 300ms
                            if (isServerSearch) {
                              clearTimeout(serverSearchTimers.current[field.id]);
                              serverSearchTimers.current[field.id] = setTimeout(() => {
                                performServerSearch(field.id, val, dbSource);
                              }, 300);
                            }
                          }}
                          onFocus={() => {
                            console.log('[Dropdown] 🔍 Search input focused - opening dropdown');
                            setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: true });
                          }}
                          onTouchStart={() => {
                            console.log('[Dropdown] 👆 Touch detected on search input (Android)');
                          }}
                          onClick={() => {
                            console.log('[Dropdown] 🖱️ Click detected on search input');
                            setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: true });
                          }}
                          placeholder={isServerSearch
                            ? `🔍 Type to search ${itemsLabel}...`
                            : `🔍 Search ${itemsLabel}...`}
                          className={`w-full pl-4 pr-10 py-3 border-2 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all active:border-blue-500 ${errorClass}`}
                          style={{ 
                            fontSize: '16px', // Prevents iOS zoom on focus
                            WebkitAppearance: 'none', // Remove iOS styling
                            WebkitTapHighlightColor: 'transparent' // Remove tap highlight on Android
                          }}
                        />
                        {/* Search Icon */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                          🔍
                        </div>
                      </div>
                      
                      {/* Helper text for mobile */}
                      {!fieldDropdownOpen[field.id] && !formData[field.id] && (
                        <p className="text-xs text-gray-500 mt-1">
                          {isServerSearch
                            ? `💡 Type to search ${itemsLabel}`
                            : `💡 Tap to search ${itemsLabel}`}
                        </p>
                      )}
                      {/* Server search loading indicator */}
                      {isServerSearch && serverSearchLoading[field.id] && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-blue-600">Searching...</span>
                        </div>
                      )}
                      {/* Server search: prompt to type when open but no results yet */}
                      {isServerSearch && fieldDropdownOpen[field.id] && !serverSearchLoading[field.id] && dropdownOptions.length === 0 && (
                        <div className="absolute z-[10000] w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                          {(fieldSearchQueries[field.id] || '').length < 2
                            ? '🔍 Type at least 2 characters to search...'
                            : 'No results found. Try a different search term.'}
                        </div>
                      )}
                      
                      {/* 📱 MOBILE-FIRST ANDROID-ROBUST DROPDOWN */}
                      {fieldDropdownOpen[field.id] && !serverSearchLoading[field.id] && dropdownOptions.length > 0 && (() => {
                        // For server-search: results already filtered by DB; for client-search: filter locally
                        const filteredOptions = isServerSearch
                          ? dropdownOptions
                          : dropdownOptions.filter((option: string) =>
                              option.toLowerCase().includes((fieldSearchQueries[field.id] || '').toLowerCase())
                            );
                        const preventDuplicates = field.options?.prevent_duplicates || field.validation?.prevent_duplicates;
                        const submittedCount = preventDuplicates ? filteredOptions.filter(opt => submittedValues[field.id]?.includes(opt)).length : 0;
                        const availableCount = filteredOptions.length - submittedCount;
                        
                        return (
                          <>
                            {/* 🎯 BACKDROP OVERLAY - Semi-transparent, fixed, closable */}
                            <div 
                              className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-[1px]"
                              onClick={() => {
                                console.log('[Shop Dropdown] 📱 Backdrop clicked - closing dropdown');
                                setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: false });
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                console.log('[Shop Dropdown] 👆 Backdrop touched - closing dropdown');
                                setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: false });
                              }}
                              style={{ WebkitTapHighlightColor: 'transparent' }}
                            />
                            
                            {/* 📋 DROPDOWN CONTAINER - Highest z-index, elevated design */}
                            <div 
                              className="absolute z-[10000] w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-[320px] overflow-hidden"
                              style={{ 
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y' // Allow only vertical scrolling
                              }}
                            >
                              {/* 📌 STICKY INTERACTION HEADER - Blue, with active indicator and DONE button */}
                              <div className="sticky top-0 bg-blue-600 px-4 py-3 border-b-2 border-blue-700 z-[10001] flex items-center justify-between">
                                {/* Left: Active indicator + Label */}
                                <div className="flex items-center gap-2">
                                  {/* Pulsing Active Dot */}
                                  <div className="relative">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                  </div>
                                  <span className="text-white font-bold text-sm tracking-wide">SELECT SHOP</span>
                                  <span className="text-blue-200 text-xs font-medium">
                                    ({filteredOptions.length})
                                  </span>
                                </div>
                                
                                {/* Right: Large DONE button for thumb tapping */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('[Shop Dropdown] ✅ DONE button clicked');
                                    setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: false });
                                  }}
                                  onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: false });
                                  }}
                                  className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-sm px-6 py-2 rounded-lg border-2 border-white/30 transition-all shadow-lg"
                                  style={{ 
                                    WebkitTapHighlightColor: 'transparent',
                                    minHeight: '44px', // Apple's recommended touch target
                                    minWidth: '80px'
                                  }}
                                >
                                  DONE
                                </button>
                              </div>
                              
                              {/* 📜 SCROLLABLE OPTIONS LIST - Touch optimized */}
                              <div 
                                className="overflow-y-auto"
                                style={{ 
                                  maxHeight: '276px', // 320px total - 44px header
                                  WebkitOverflowScrolling: 'touch',
                                  overscrollBehavior: 'contain'
                                }}
                              >
                                {/* All Options - Tall touch targets */}
                                {filteredOptions.map((option: string, optionIndex: number) => {
                                  const isAlreadySubmitted = submittedValues[field.id]?.includes(option);
                                  
                                  return (
                                    <button
                                      key={`${field.id}-option-${optionIndex}`}
                                      type="button"
                                      onClick={() => {
                                        console.log('[Shop Dropdown] 🎯 Option clicked:', option);
                                        if (isAlreadySubmitted && preventDuplicates) {
                                          console.log('[Shop Dropdown] 🔒 Option already submitted, blocked');
                                          return;
                                        }
                                        handleFieldChange(field.id, option);
                                        setFieldSearchQueries({ ...fieldSearchQueries, [field.id]: option });
                                        setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: false });
                                      }}
                                      onTouchEnd={(e) => {
                                        console.log('[Shop Dropdown] 👆 Touch end on option:', option);
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (isAlreadySubmitted && preventDuplicates) {
                                          return;
                                        }
                                        handleFieldChange(field.id, option);
                                        setFieldSearchQueries({ ...fieldSearchQueries, [field.id]: option });
                                        setFieldDropdownOpen({ ...fieldDropdownOpen, [field.id]: false });
                                      }}
                                      disabled={isAlreadySubmitted && preventDuplicates}
                                      className={`w-full text-left px-4 py-4 border-b border-gray-200 last:border-b-0 transition-all text-sm font-medium ${
                                        isAlreadySubmitted && preventDuplicates
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                          : 'text-gray-900 hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                                      }`}
                                      style={{ 
                                        WebkitTapHighlightColor: 'transparent',
                                        minHeight: '56px',
                                        color: (isAlreadySubmitted && preventDuplicates) ? undefined : '#111827' // force dark text via inline style as failsafe
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className={isAlreadySubmitted && preventDuplicates ? 'line-through text-gray-400' : 'text-gray-900'}>
                                          {option}
                                        </span>
                                        {isAlreadySubmitted && preventDuplicates && (
                                          <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-semibold">
                                            🔒 SUBMITTED
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                                
                                {/* Empty State */}
                                {filteredOptions.length === 0 && (
                                  <div className="px-4 py-8 text-center">
                                    <div className="text-4xl mb-2">🔍</div>
                                    <div className="text-sm font-semibold text-gray-700 mb-1">No shops found</div>
                                    <div className="text-xs text-gray-500">Try a different search term</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    
                    {/* Auto-populated Shop Details */}
                    {fieldShopSelections[field.id] && (
                      <div className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-4">
                        <div className="text-xs font-semibold text-green-900 mb-2">✅ Shop Details Auto-Populated</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600">Partner Name:</span>
                            <div className="font-semibold text-gray-900">{fieldShopSelections[field.id].partner_name}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Shop Code:</span>
                            <div className="font-semibold text-gray-900">{fieldShopSelections[field.id].shop_code}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">FP Code:</span>
                            <div className="font-semibold text-gray-900">{fieldShopSelections[field.id].fp_code}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">USDM Name:</span>
                            <div className="font-semibold text-gray-900">{fieldShopSelections[field.id].usdm_name}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 🆕 Database Dropdown Metadata Display */}
                    {isDatabaseDropdown && fieldMetadata[field.id] && (
                      <div className="mt-3 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                        <div className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <span className="text-blue-600">ℹ️</span>
                          <span>Details for: {fieldMetadata[field.id].label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {Object.entries(fieldMetadata[field.id].data).map(([key, value]) => (
                            <div key={key} className="break-words">
                              <span className="text-gray-600 block mb-0.5">{key.replace(/_/g, ' ').toUpperCase()}:</span>
                              <div className="font-semibold text-gray-900">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                      );
                    })()}
                  </>
                )}

                {/* Radio Buttons */}
                {fieldType === 'radio' && (
                  <div className="space-y-2">
                    {options.map((option: string, optionIndex: number) => (
                      <label key={`${field.id}-radio-${optionIndex}`} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="radio"
                          name={field.id}
                          value={option}
                          checked={formData[field.id] === option}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-4 h-4 text-red-600 flex-shrink-0"
                        />
                        <span className="text-gray-800 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkboxes / Multi-Select */}
                {(fieldType === 'checkbox' || fieldType === 'multi_select') && (
                  <>
                    {/* 🆕 Database Multi-Select Loading Indicator */}
                    {isDatabaseDropdown && loadingDatabaseDropdowns[field.id] && (
                      <div className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg bg-blue-50 flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-700 text-sm font-medium">Loading {dbSource?.table} data...</span>
                      </div>
                    )}
                    
                    {/* Show multi-select when not loading */}
                    {(!isDatabaseDropdown || !loadingDatabaseDropdowns[field.id]) && (() => {
                      console.log(`[DatabaseMultiSelect] 🔍 Rendering ${label}:`, {
                        fieldId: field.id,
                        fieldType,
                        isDatabaseDropdown,
                        isLoading: loadingDatabaseDropdowns[field.id],
                        hasData: !!databaseDropdownData[field.id],
                        dataLength: databaseDropdownData[field.id]?.length,
                        allKeys: Object.keys(databaseDropdownData)
                      });
                      
                      // 🆕 For database dropdowns, generate options from loaded data
                      let multiSelectOptions = options;
                      if (isDatabaseDropdown && databaseDropdownData[field.id]) {
                        const dbData = databaseDropdownData[field.id];
                        multiSelectOptions = dbData.map((row: any) => row[dbSource!.display_field]);
                        console.log(`[DatabaseMultiSelect] ✅ Generated ${multiSelectOptions.length} options for ${label}`);
                      } else if (isDatabaseDropdown && !databaseDropdownData[field.id]) {
                        console.warn(`[DatabaseMultiSelect] ⚠️ No data loaded for ${label}. isDatabaseDropdown: ${isDatabaseDropdown}, hasData: ${!!databaseDropdownData[field.id]}`);
                        console.log(`[DatabaseMultiSelect] dbSource:`, dbSource);
                        console.log(`[DatabaseMultiSelect] All loaded data keys:`, Object.keys(databaseDropdownData));
                      }
                      
                      // 🔥 SAFETY CHECK: Ensure multiSelectOptions is always an array
                      if (!Array.isArray(multiSelectOptions)) {
                        console.warn(`[DatabaseMultiSelect] options is not an array for ${label}, converting:`, multiSelectOptions);
                        multiSelectOptions = [];
                      }
                      
                      const itemsLabel = isDatabaseDropdown ? (field.field_label || label) : 'options';
                      const selectedValues = formData[field.id] || [];
                      
                      return (
                        <div className="space-y-2">
                          {/* Search Input for Database Multi-Select */}
                          {isDatabaseDropdown && multiSelectOptions.length > 10 && (
                            <div className="relative mb-3">
                              <input
                                type="text"
                                inputMode="search"
                                autoComplete="off"
                                value={fieldSearchQueries[field.id] || ''}
                                onChange={(e) => setFieldSearchQueries({ ...fieldSearchQueries, [field.id]: e.target.value })}
                                placeholder={`🔍 Search ${itemsLabel}... (${selectedValues.length} selected)`}
                                className="w-full pl-4 pr-10 py-3 border-2 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                style={{ fontSize: '16px' }}
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                🔍
                              </div>
                            </div>
                          )}
                          
                          {/* Selected Items Summary */}
                          {selectedValues.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                              <div className="text-xs font-semibold text-blue-900 mb-2">
                                ✅ {selectedValues.length} {itemsLabel} selected
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {selectedValues.slice(0, 5).map((val: string, idx: number) => (
                                  <span key={idx} className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                    {val}
                                  </span>
                                ))}
                                {selectedValues.length > 5 && (
                                  <span className="inline-block px-2 py-1 bg-gray-400 text-white text-xs rounded">
                                    +{selectedValues.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Checkbox List */}
                          <div className="max-h-64 overflow-y-auto border-2 border-gray-300 rounded-lg p-2">
                            {(() => {
                              const searchQuery = (fieldSearchQueries[field.id] || '').toLowerCase();
                              const filteredOptions = searchQuery
                                ? multiSelectOptions.filter((opt: string) => opt.toLowerCase().includes(searchQuery))
                                : multiSelectOptions;
                              
                              if (filteredOptions.length === 0) {
                                return (
                                  <div className="text-center py-8 text-gray-500">
                                    {searchQuery ? '🔍 No matching sites found' : `No ${itemsLabel} available`}
                                  </div>
                                );
                              }
                              
                              return filteredOptions.map((option: string, optionIndex: number) => (
                                <label key={`${field.id}-checkbox-${optionIndex}`} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option)}
                                    onChange={(e) => {
                                      const updated = e.target.checked
                                        ? [...selectedValues, option]
                                        : selectedValues.filter((v: string) => v !== option);
                                      handleFieldChange(field.id, updated);
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                  />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ));
                            })()}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* Date */}
                {fieldType === 'date' && (
                  <input
                    type="date"
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                )}

                {/* Time */}
                {fieldType === 'time' && (
                  <input
                    type="time"
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                )}

                {/* Yes/No Toggle */}
                {fieldType === 'yes_no' && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={field.id}
                        value="yes"
                        checked={formData[field.id] === 'yes'}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-4 h-4 text-red-600"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={field.id}
                        value="no"
                        checked={formData[field.id] === 'no'}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-4 h-4 text-red-600"
                      />
                      <span>No</span>
                    </label>
                  </div>
                )}

                {/* Star Rating */}
                {fieldType === 'rating' && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleFieldChange(field.id, star)}
                        className="text-3xl transition-all"
                      >
                        {formData[field.id] >= star ? '⭐' : '☆'}
                      </button>
                    ))}
                    {formData[field.id] && (
                      <span className="ml-2 text-sm text-gray-600">
                        {formData[field.id]} / 5
                      </span>
                    )}
                  </div>
                )}

                {/* 🆕 Photo Upload Field */}
                {(fieldType === 'photo' || fieldType === 'photo_upload') && (
                  <div>
                    {/* Camera Capture Button */}
                    <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => handlePhotoChange(field.id, e)}
                        className="hidden"
                        id={`photo-${field.id}`}
                      />
                      <label htmlFor={`photo-${field.id}`} className="cursor-pointer block">
                        <Upload className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                        <p className="text-base text-blue-700 font-semibold">📷 Take Photo</p>
                        <p className="text-xs text-blue-600 mt-1">Tap to capture with camera</p>
                      </label>
                    </div>

                    {/* Photo Preview Grid */}
                    {photos[field.id] && photos[field.id].length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {photos[field.id].map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`${label} ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(field.id, index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Photo Count */}
                    {photos[field.id] && photos[field.id].length > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        📸 {photos[field.id].length} photo{photos[field.id].length !== 1 ? 's' : ''} added
                      </p>
                    )}
                  </div>
                )}
                
                {/* 🔥 Close the wrapper for non-shop fields or loaded shop fields */}
                </>)}
              </div>
            );
          })}
          
          {/* 🆕 NEW: Progressive Disclosure for Single Site Fields (monday_sites, tuesday_sites, etc.) */}
          {(() => {
            // Detect NEW pattern: monday_sites, tuesday_sites (without numbers)
            const newSiteFields = fields.filter(f => /^(monday|tuesday|wednesday|thursday|friday|saturday)_sites$/.test(f.field_name));
            
            if (newSiteFields.length === 0) return null;
            
            // Check if progressive disclosure is enabled
            const useProgressiveDisclosure = program.progressive_disclosure_enabled === true;
            
            if (!useProgressiveDisclosure) return null; // If disabled, render normally in main loop
            
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            return (
              <div className="space-y-4 mt-6">
                <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-1">🚐 Weekly Route Planning</h3>
                  <p className="text-sm text-blue-700">Select up to 4 sites per day. Click "+ Add Site" to add more.</p>
                </div>
                
                {days.map((dayKey, index) => {
                  const dayLabel = dayLabels[index];
                  const field = newSiteFields.find(f => f.field_name === `${dayKey}_sites`);
                  
                  if (!field) return null;
                  
                  return (
                    <ProgressiveSiteSelector
                      key={dayKey}
                      day={dayLabel}
                      dayKey={dayKey}
                      field={field}
                      formData={formData}
                      databaseDropdownData={databaseDropdownData}
                      loadingDatabaseDropdowns={loadingDatabaseDropdowns}
                      onFieldChange={handleFieldChange}
                      fieldMetadata={fieldMetadata}
                    />
                  );
                })}
              </div>
            );
          })()}
          
          {/* 🆕 Van Calendar Site Fields - Progressive Disclosure (1-4 sites per day) */}
          {(() => {
            // Group site fields by day
            const siteFields = fields.filter(f => /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\d+$/.test(f.field_name));
            
            if (siteFields.length === 0) return null;
            
            // 🆕 Check if progressive disclosure is enabled for this program
            const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false; // Default true if not set
            
            // Group by day
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            // 🎯 PROGRESSIVE DISCLOSURE UI (default)
            if (useProgressiveDisclosure) {
              return (
                <div className="space-y-4 mt-6">
                  <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-blue-900 mb-1">🚐 Weekly Route Planning</h3>
                    <p className="text-sm text-blue-700">Select up to 4 sites per day. Click "+ Add Another Site" to add more sites.</p>
                  </div>
                  
                  {days.map((dayKey, index) => {
                    const dayLabel = dayLabels[index];
                    const dayFields = siteFields.filter(f => f.field_name.startsWith(`${dayKey}_site_`));
                    
                    if (dayFields.length === 0) return null;
                    
                    return (
                      <VanCalendarSiteSelector
                        key={dayKey}
                        day={dayLabel}
                        dayKey={dayKey}
                        siteFields={dayFields}
                        formData={formData}
                        databaseDropdownData={databaseDropdownData}
                        loadingDatabaseDropdowns={loadingDatabaseDropdowns}
                        onFieldChange={handleFieldChange}
                      />
                    );
                  })}
                </div>
              );
            }
            
            // 📋 TRADITIONAL UI (show all fields at once)
            // Note: This will be rendered in the main fields loop since we DON'T skip them
            return null;
          })()}
        </div>



        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit ({program.points_value} pts)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}