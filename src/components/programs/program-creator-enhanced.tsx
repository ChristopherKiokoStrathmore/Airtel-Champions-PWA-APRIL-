import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, GripVertical, Eye, Settings, Save, 
  Type, FileText, Hash, ChevronDown, List, ToggleLeft, 
  Calendar, Clock, Image, MapPin, Star, AlertCircle,
  Copy, ChevronRight, Download, ListOrdered // Added Download and ListOrdered icons
} from 'lucide-react';
import { ProgramExcelImporter } from './program-excel-importer';
import { ProgramGFormsImporter } from './program-gforms-importer';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../../utils/supabase/client';
import { notifyNewProgram } from '../../utils/notifications';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { programsAPI } from './programs-api';

// ============================================================================
// FALLBACK TABLES (used only if dynamic loading fails)
// ============================================================================
const FALLBACK_TABLES = [
  { name: 'app_users', label: 'APP USERS' },
  { name: 'programs', label: 'PROGRAMS' },
  { name: 'submissions', label: 'SUBMISSIONS' },
  { name: 'social_posts', label: 'SOCIAL POSTS' },
  { name: 'groups', label: 'GROUPS' },
  { name: 'group_members', label: 'GROUP MEMBERS' },
  { name: 'van_db', label: 'VAN DATABASE' },
  { name: 'amb_shops', label: 'AMBASSADOR SHOPS' },
  { name: 'amb_sitewise', label: 'AMBASSADOR SITEWISE' },
  { name: 'sitewise', label: 'SITE INFORMATION' },
  { name: 'retailer_dump', label: 'RETAILER DUMP' },
  { name: 'retailer_dump_full', label: 'RETAILER DUMP FULL' },
  { name: 'user_sessions', label: 'USER SESSIONS' },
  { name: 'se_login_audit', label: 'SE LOGIN AUDIT' },
  { name: 'departments', label: 'DEPARTMENTS' },
  { name: 'regions', label: 'REGIONS' },
  { name: 'teams', label: 'TEAMS' },
  { name: 'achievements', label: 'ACHIEVEMENTS' },
  { name: 'mission_types', label: 'MISSION TYPES' },
  { name: 'challenges', label: 'CHALLENGES' },
];

interface ProgramField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: { 
    options?: string[];
    prevent_duplicates?: boolean;
    database_source?: {
      table: string;
      display_field: string;
      metadata_fields?: string[];
    };
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    error_message?: string;
    prevent_duplicates?: boolean;
  };
  conditional_logic?: {
    show_if_field: string;
    show_if_value: string;
  };
  order_index: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  fields: ProgramField[];
}

interface ProgramCreatorEnhancedProps {
  onClose: () => void;
  onSuccess: () => void;
  editingProgram?: any; // Program to edit
}

interface WhitelistField {
  label: string;
  db_column: string;
  input_type: 'text' | 'dropdown';
  source_table?: string;
  source_column?: string;
}

const PROMOTER_TL_WHITELIST_DEFAULTS: WhitelistField[] = [
  { label: 'Name',    db_column: 'full_name',  input_type: 'text' },
  { label: 'MSISDN',  db_column: 'msisdn',     input_type: 'text' },
  { label: 'Cluster', db_column: 'se_cluster', input_type: 'dropdown', source_table: '', source_column: '' },
  { label: 'ZSM',     db_column: 'zone',       input_type: 'dropdown', source_table: '', source_column: '' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', icon: Type, description: 'Single line text input', color: 'blue' },
  { value: 'long_text', label: 'Paragraph', icon: FileText, description: 'Multi-line text area', color: 'indigo' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input with validation', color: 'green' },
  { value: 'repeatable_number', label: 'Repeatable Numbers', icon: ListOrdered, description: 'Multiple number entries with min/max', color: 'teal' },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown, description: 'Select one option', color: 'purple' },
  { value: 'multi_select', label: 'Checkboxes', icon: List, description: 'Select multiple options', color: 'pink' },
  { value: 'radio', label: 'Multiple Choice', icon: ToggleLeft, description: 'Choose one option', color: 'orange' },
  // Date, Time, and Location are now auto-captured for every form submission
  { value: 'photo', label: 'Photo Upload', icon: Image, description: 'Upload image with GPS', color: 'red' },
  { value: 'yes_no', label: 'Yes/No', icon: ToggleLeft, description: 'Boolean toggle', color: 'emerald' },
  { value: 'rating', label: 'Rating', icon: Star, description: 'Star rating 1-5', color: 'amber' },
  { value: 'section', label: 'Section Break', icon: Settings, description: 'Organize form into sections', color: 'gray' },
];

const TARGET_ROLES = [
  { value: 'sales_executive', label: '📱 Sales Executives', count: 662 },
  { value: 'zonal_sales_manager', label: '👔 Zonal Sales Managers', count: 25 },
  { value: 'zonal_business_manager', label: '💼 Zonal Business Managers', count: 8 },
  { value: 'hq_command_center', label: ' HQ Command Center', count: 12 },
  { value: 'director', label: '👑 Director', count: 1 },
];

export function ProgramCreatorEnhanced({ onClose, onSuccess, editingProgram }: ProgramCreatorEnhancedProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'settings'>('build');
  
  // Program settings
  const [title, setTitle] = useState(editingProgram?.title || '');
  const [description, setDescription] = useState(editingProgram?.description || '');
  const [category, setCategory] = useState(editingProgram?.category || 'Network Experience');
  const [pointsValue, setPointsValue] = useState(editingProgram?.points_value || 50);
  const [pointsEnabled, setPointsEnabled] = useState(editingProgram?.points_enabled !== undefined ? editingProgram.points_enabled : true); // 🆕 Points toggle
  const [gpsAutoDetectEnabled, setGpsAutoDetectEnabled] = useState(editingProgram?.gps_auto_detect_enabled !== undefined ? editingProgram.gps_auto_detect_enabled : true); // 🆕 GPS Auto-Detect toggle
  const [progressiveDisclosureEnabled, setProgressiveDisclosureEnabled] = useState(editingProgram?.progressive_disclosure_enabled !== undefined ? editingProgram.progressive_disclosure_enabled : false); // 🆕 Progressive Disclosure UI for multi-field patterns
  const [zoneFilteringEnabled, setZoneFilteringEnabled] = useState(editingProgram?.zone_filtering_enabled !== undefined ? editingProgram.zone_filtering_enabled : false); // 🆕 Zone-based filtering for dropdowns
  const [vanCheckoutEnforcementEnabled, setVanCheckoutEnforcementEnabled] = useState(editingProgram?.van_checkout_enforcement_enabled !== undefined ? editingProgram.van_checkout_enforcement_enabled : false); // 🆕 Van checkout enforcement per-program
  const [sessionCheckinEnabled, setSessionCheckinEnabled] = useState(false); // 📋 Session-based check-in (loaded from KV store)
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistTarget, setWhitelistTarget] = useState<'promoter_team_lead' | 'airtel_champions' | ''>('');
  const [whitelistFields, setWhitelistFields] = useState<WhitelistField[]>([]);
  const [wlAvailableTables, setWlAvailableTables] = useState<string[]>([]);
  const [wlAvailableColumns, setWlAvailableColumns] = useState<Record<number, string[]>>({});
  const [linkedCheckinProgramId, setLinkedCheckinProgramId] = useState(''); // 🔗 Link to another program for checkout mode
  const [allProgramsForLinking, setAllProgramsForLinking] = useState<{id: string; title: string}[]>([]); // Programs list for linking dropdown
  const [targetRoles, setTargetRoles] = useState<string[]>(editingProgram?.target_roles || ['sales_executive']);
  const [whoCanSubmit, setWhoCanSubmit] = useState<string[]>(editingProgram?.who_can_submit || ['sales_executive']); // 🆕 Who can submit
  const [startDate, setStartDate] = useState(editingProgram?.start_date || '');
  const [endDate, setEndDate] = useState(editingProgram?.end_date || '');
  const [icon, setIcon] = useState(editingProgram?.icon || '📊');
  const [color, setColor] = useState(editingProgram?.color || '#EF4444');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // New state for emoji picker
  
  // Form builder state
  const [sections, setSections] = useState<Section[]>(editingProgram?.sections || [
    { id: 'section_1', title: 'General Information', description: '', fields: [] }
  ]);
  const [activeSection, setActiveSection] = useState(editingProgram?.sections ? editingProgram?.sections[0].id : 'section_1');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  // Field editor state
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<ProgramField | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPreventDuplicates, setFieldPreventDuplicates] = useState(false); // 🆕 Prevent duplicate selections
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldHelp, setFieldHelp] = useState('');
  const [fieldOptions, setFieldOptions] = useState<string[]>(['']);
  const [fieldValidation, setFieldValidation] = useState({ min: '', max: '', pattern: '', error_message: '' });
  const [showConditional, setShowConditional] = useState(false);
  const [conditionalField, setConditionalField] = useState('');
  const [conditionalValue, setConditionalValue] = useState('');
  const [isLoadingZSMs, setIsLoadingZSMs] = useState(false);

  // 🆕 Database Dropdown Configuration
  const [dropdownSource, setDropdownSource] = useState<'static' | 'database'>('static');
  const [dbTable, setDbTable] = useState('');
  const [dbDisplayField, setDbDisplayField] = useState('');
  const [dbMetadataFields, setDbMetadataFields] = useState<string[]>([]);
  const [dbMultiSelect, setDbMultiSelect] = useState(false);
  const [dbRepeatableDropdown, setDbRepeatableDropdown] = useState(false); // 🆕 Progressive/repeatable dropdown entries
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [availableColumns, setAvailableColumns] = useState<any[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // 🆕 Repeatable Number Configuration
  const [repeatableMinEntries, setRepeatableMinEntries] = useState('');
  const [repeatableMaxEntries, setRepeatableMaxEntries] = useState('');
  const [repeatableEntryLabel, setRepeatableEntryLabel] = useState('Entry'); // Label for each entry (e.g., "Promoter", "Van")
  const [repeatableDigitLength, setRepeatableDigitLength] = useState(''); // 🆕 Restrict to exact digit length (e.g., "9" for phone numbers)
  const [repeatableRemoveLeadingZero, setRepeatableRemoveLeadingZero] = useState(false); // 🆕 Auto-remove leading "0"
  const [repeatablePreventDuplicates, setRepeatablePreventDuplicates] = useState(false); // 🆕 Prevent duplicate values within submission
  const [repeatableCheckDatabase, setRepeatableCheckDatabase] = useState(false); // 🆕 Check if value exists in database for today

  const currentSection = sections.find(s => s.id === activeSection);

  // Load available tables by probing directly against the user's Supabase project.
  // NOTE: The server's SUPABASE_URL points to the Make host project (mcbbtrrhqweypfnlzwht),
  // NOT the user's data project (xspogpfohjmkykfjadhk) — so we must NOT use the server
  // endpoint here. Instead, the frontend supabase client already points to the right project.
  const loadAvailableTables = async () => {
    setIsLoadingTables(true);
    try {
      console.log('[Database Dropdown] 🔄 Discovering tables from user project...');

      // METHOD 0: Fetch PostgREST OpenAPI spec — lists ALL public tables dynamically.
      // This discovers every table automatically, including new ones like retailer_dump_full.
      try {
        const specRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (specRes.ok) {
          const spec = await specRes.json();
          // PostgREST OpenAPI spec stores table/view names as keys under `definitions`
          const defs = spec?.definitions ?? spec?.components?.schemas ?? {};
          const tableNames = Object.keys(defs).filter(
            // Exclude PostgREST internal virtual entries (_insert, _update, etc.)
            (k) => !/_(insert|update|filter|order|by_pkey|response|error|message)$/.test(k) && !/^\d/.test(k)
          );
          if (tableNames.length > 0) {
            const tables = tableNames
              .sort()
              .map((name) => ({ name, label: name.replace(/_/g, ' ').toUpperCase() }));
            setAvailableTables(tables);
            console.log('[Database Dropdown] ✅ Loaded tables via OpenAPI spec:', tables.length);
            return;
          }
        }
      } catch (specErr) {
        console.warn('[Database Dropdown] ⚠️ OpenAPI spec fetch failed, falling back:', specErr);
      }

      // METHOD 1: Try get_public_tables() RPC (works if user created this SQL function).
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_public_tables');
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          const tables = rpcData.map((row: any) => {
            const name = row.table_name ?? row;
            return { name, label: name.replace(/_/g, ' ').toUpperCase() };
          });
          setAvailableTables(tables);
          console.log('[Database Dropdown] ✅ Loaded tables via RPC:', tables.length);
          return;
        }
      } catch {
        // RPC function not created — fall through to probe method
      }

      // METHOD 2: Probe candidate tables directly via the frontend Supabase client.
      // RLS is disabled so a .limit(1) select will succeed for existing tables,
      // and return error code "42P01" / "does not exist" for missing ones.
      const candidates = [
        'van_db', 'sitewise', 'retailer_dump', 'retailer_dump_full', 'app_users', 'submissions',
        'social_posts', 'groups', 'group_members', 'amb_shops', 'amb_sitewise',
        'user_sessions', 'se_login_audit', 'programs', 'departments', 'regions',
        'teams', 'achievements', 'mission_types', 'challenges',
      ];

      const accessible: { name: string; label: string }[] = [];
      await Promise.all(
        candidates.map(async (tableName) => {
          try {
            const { error } = await supabase.from(tableName).select('*').limit(1);
            // Only exclude if the table genuinely doesn't exist
            const missing =
              error?.code === '42P01' ||
              error?.message?.includes('does not exist') ||
              error?.message?.includes('relation') && error?.message?.includes('not exist');
            if (!missing) {
              accessible.push({ name: tableName, label: tableName.replace(/_/g, ' ').toUpperCase() });
            }
          } catch {
            // Skip silently
          }
        })
      );

      if (accessible.length > 0) {
        accessible.sort((a, b) => a.name.localeCompare(b.name));
        setAvailableTables(accessible);
        console.log('[Database Dropdown] ✅ Probed & found tables:', accessible.length);
        return;
      }

      // METHOD 3: Hard fallback — pre-defined list always includes retailer_dump
      setAvailableTables(FALLBACK_TABLES);
      console.log('[Database Dropdown] ✅ Using fallback table list:', FALLBACK_TABLES.length);
    } catch (error) {
      console.error('[Database Dropdown] ❌ Error loading tables:', error);
      setAvailableTables(FALLBACK_TABLES);
    } finally {
      setIsLoadingTables(false);
    }
  };

  // 🆕 Load columns for selected table (DIRECT DATABASE ACCESS)
  const loadColumnsForTable = async (tableName: string) => {
    if (!tableName) return;
    
    setIsLoadingColumns(true);
    try {
      console.log('[Database Dropdown] 🔄 Loading columns for table:', tableName);
      console.log('[Database Dropdown] 📊 Using direct Supabase client query');
      
      // Query the table directly to get column names from the first row
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.error('[Database Dropdown] ❌ Supabase error:', error);
        
        // Show helpful error message based on error type
        let errorMsg = `Failed to load columns for table: ${tableName}`;
        
        if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          errorMsg = `❌ Table '${tableName}' is not accessible.\n\n` +
                     `This could mean:\n` +
                     `1. The table doesn't exist yet\n` +
                     `2. PostgREST schema cache needs reload\n\n` +
                     `To fix:\n` +
                     `• Go to Supabase Dashboard → Settings → API\n` +
                     `• Click "Restart PostgREST"\n` +
                     `• Wait 20 seconds and try again\n\n` +
                     `Or select a different table.`;
        } else if (error.code === '42501' || error.message?.includes('permission')) {
          errorMsg = `❌ Permission denied for table '${tableName}'.\n\n` +
                     `To fix:\n` +
                     `1. Open Supabase Dashboard → SQL Editor\n` +
                     `2. Run: GRANT SELECT ON ${tableName} TO anon, authenticated;\n` +
                     `3. Try again`;
        }
        
        throw new Error(errorMsg);
      }

      // Extract column names from the first row
      const columns = data && data.length > 0 
        ? Object.keys(data[0]).map(columnName => ({
            name: columnName,
            label: columnName.replace(/_/g, ' ').toUpperCase(),
          }))
        : [];

      if (columns.length === 0) {
        console.warn('[Database Dropdown] ⚠️ Table exists but has no data or no columns');
        throw new Error(`Table '${tableName}' exists but appears to be empty or has no columns.\n\nPlease add at least one row of data to this table.`);
      }

      setAvailableColumns(columns);
      console.log('[Database Dropdown] ✅ Loaded columns for', tableName, ':', columns.length, columns);
    } catch (error: any) {
      console.error('[Database Dropdown] ❌ Error loading columns:', error);
      alert(error.message || `Failed to load columns for table: ${tableName}`);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  // Function to load ZSMs from database
  const loadZSMsFromDatabase = async () => {
    setIsLoadingZSMs(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/users/zsms`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ZSMs');
      }

      const data = await response.json();
      
      // Sort ZSMs alphabetically by full_name
      const sortedZSMs = data.zsms
        .filter((zsm: any) => zsm.full_name && zsm.full_name !== '0') // Filter out invalid names
        .sort((a: any, b: any) => a.full_name.localeCompare(b.full_name));
      
      // Format as "Name (Zone)" for better clarity
      const zsmOptions = sortedZSMs.map((zsm: any) => `${zsm.full_name} (${zsm.zone})`);
      
      if (zsmOptions.length > 0) {
        setFieldOptions(zsmOptions);
        alert(`✅ Loaded ${zsmOptions.length} ZSMs from database!`);
      } else {
        alert('No ZSMs found in database');
      }
    } catch (error) {
      console.error('Error loading ZSMs:', error);
      alert('Failed to load ZSMs from database');
    } finally {
      setIsLoadingZSMs(false);
    }
  };

  // Function to load AMB Shops from database
  const loadAMBShopsFromDatabase = async () => {
    setIsLoadingZSMs(true); // Reuse the same loading state
    try {
      console.log('[AMB Shops] 🔄 Fetching ALL shops from database (paginated)...');
      
      // Supabase has a hard limit of 1000 rows per query
      // So we need to paginate to get all 2,674+ shops
      let allShops: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        console.log(`[AMB Shops] 📦 Fetching batch ${page + 1} (rows ${from}-${to})...`);

        const { data, error } = await supabase
          .from('amb_shops')
          .select('*')
          .order('partner_name', { ascending: true })
          .range(from, to);

        if (error) {
          throw new Error('Failed to fetch AMB shops');
        }

        if (data && data.length > 0) {
          allShops = [...allShops, ...data];
          console.log(`[AMB Shops] ✅ Batch ${page + 1}: ${data.length} shops (Total so far: ${allShops.length})`);
          
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

      console.log('[AMB Shops] ✅ Total fetched from database:', allShops.length, 'shops');

      // Filter out null/empty values and format as "partner_name / usdm_name"
      const shopOptions = allShops
        .filter((shop: any) => shop.partner_name && shop.usdm_name)
        .map((shop: any) => `${shop.partner_name} / ${shop.usdm_name}`);
      
      console.log('[AMB Shops] ✅ After filtering:', shopOptions.length, 'shops');
      
      if (shopOptions.length > 0) {
        // Append to existing options
        setFieldOptions([...fieldOptions, ...shopOptions]);
        alert(`✅ Added ${shopOptions.length} AMB shops to dropdown!`);
      } else {
        alert('No AMB shops found in database');
      }
    } catch (error) {
      console.error('Error loading AMB shops:', error);
      alert('Failed to load AMB shops from database');
    } finally {
      setIsLoadingZSMs(false);
    }
  };

  const fetchColumnsForField = async (fieldIndex: number, tableName: string) => {
    if (!tableName) return;
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/schema/tables/${encodeURIComponent(tableName)}/columns`);
      const d = await res.json();
      setWlAvailableColumns(prev => ({ ...prev, [fieldIndex]: d.columns ?? [] }));
    } catch (err) {
      console.error('[Whitelist] Failed to fetch columns for', tableName, err);
    }
  };

  // Load session checkin flag from KV store when editing a program
  useEffect(() => {
    if (editingProgram?.id) {
      programsAPI.getCheckinFlags().then(flags => {
        const flag = flags[editingProgram.id] || false;
        console.log('[ProgramCreator] Loaded session checkin flag from KV:', flag);
        setSessionCheckinEnabled(flag);
      }).catch(err => {
        console.error('[ProgramCreator] Error loading checkin flag:', err);
      });

      // Load linked_checkin_program_id from form config
      programsAPI.getProgramFormConfig(editingProgram.id).then(cfg => {
        if (cfg?.linked_checkin_program_id) {
          console.log('[ProgramCreator] Loaded linked checkin program:', cfg.linked_checkin_program_id);
          setLinkedCheckinProgramId(cfg.linked_checkin_program_id);
        }
      }).catch(err => {
        console.error('[ProgramCreator] Error loading form config:', err);
      });
    }

    // Load all programs for the linking dropdown
    const loadProgramsForLinking = async () => {
      try {
        const { data } = await supabase.from('programs').select('id, title').order('title');
        if (data) setAllProgramsForLinking(data);
      } catch (err) {
        console.error('[ProgramCreator] Error loading programs for linking:', err);
      }
    };
    loadProgramsForLinking();
  }, [editingProgram?.id]);

  // Load existing fields when editing a program
  useEffect(() => {
    if (editingProgram && editingProgram.fields && editingProgram.fields.length > 0) {
      console.log('[ProgramCreator] Loading fields for editing:', editingProgram.fields);
      
      // Convert database fields to sections format
      const loadedFields: ProgramField[] = editingProgram.fields.map((field: any, index: number) => ({
        id: field.id || `field_${Date.now()}_${index}`,
        field_name: field.field_name,
        field_label: field.field_label || field.field_name,
        field_type: field.field_type,
        is_required: field.is_required || false,
        placeholder: field.placeholder,
        help_text: field.help_text,
        options: field.options,
        validation: field.validation,
        conditional_logic: field.conditional_logic,
        order_index: index,
      }));

      setSections([{
        id: 'section_1',
        title: 'General Information',
        description: '',
        fields: loadedFields
      }]);
    }

    setWhitelistEnabled(editingProgram.whitelist_enabled ?? false);
    setWhitelistTarget((editingProgram.whitelist_target as 'promoter_team_lead' | 'airtel_champions' | '') ?? '');
    setWhitelistFields((editingProgram.whitelist_fields as WhitelistField[]) ?? []);

    if (editingProgram.whitelist_fields?.length) {
      (editingProgram.whitelist_fields as WhitelistField[]).forEach((field, idx) => {
        if (field.input_type === 'dropdown' && field.source_table) {
          fetchColumnsForField(idx, field.source_table);
        }
      });
    }
  }, [editingProgram]);

  useEffect(() => {
    if (!whitelistEnabled || wlAvailableTables.length > 0) return;
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/schema/tables`)
      .then(r => r.json())
      .then(d => setWlAvailableTables(d.tables ?? []))
      .catch(console.error);
  }, [whitelistEnabled]);

  // Add or update field
  const saveField = () => {
    if (!fieldLabel.trim()) {
      alert('Field label is required');
      return;
    }

    const fieldData: ProgramField = {
      id: editingField?.id || `field_${Date.now()}`,
      field_name: fieldName || fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      field_label: fieldLabel,
      field_type: fieldType,
      is_required: fieldRequired,
      placeholder: fieldPlaceholder,
      help_text: fieldHelp,
      order_index: editingField?.order_index ?? currentSection!.fields.length,
    };

    // Add options for choice fields
    if (['dropdown', 'multi_select', 'radio'].includes(fieldType)) {
      // 🆕 Check if using database source
      if (fieldType === 'dropdown' && dropdownSource === 'database') {
        // Validate database config
        if (!dbTable || !dbDisplayField) {
          alert('Please select both a table and display field for database dropdown');
          return;
        }
        
        console.log('[ProgramCreator] 💾 Saving database dropdown:', {
          table: dbTable,
          display_field: dbDisplayField,
          metadata_fields: dbMetadataFields,
          multi_select: dbMultiSelect,
          repeatable_dropdown: dbRepeatableDropdown,
        });
        
        fieldData.options = {
          database_source: {
            table: dbTable,
            display_field: dbDisplayField,
            metadata_fields: dbMetadataFields.length > 0 ? dbMetadataFields : undefined,
            multi_select: dbMultiSelect,
            repeatable_dropdown: dbRepeatableDropdown, // 🆕 Progressive dropdown entries
          },
          prevent_duplicates: fieldPreventDuplicates,
        } as any;
      } else {
        // Static options
        const validOptions = fieldOptions.filter(opt => opt.trim());
        if (validOptions.length === 0) {
          alert('Please add at least one option');
          return;
        }
        fieldData.options = { 
          options: validOptions,
          prevent_duplicates: fieldPreventDuplicates // 🆕 Store prevent_duplicates setting
        };
      }
    }

    // 🆕 Add configuration for repeatable_number field type
    if (fieldType === 'repeatable_number') {
      const minEntries = repeatableMinEntries ? parseInt(repeatableMinEntries) : 1;
      const maxEntries = repeatableMaxEntries ? parseInt(repeatableMaxEntries) : undefined;
      const digitLength = repeatableDigitLength ? parseInt(repeatableDigitLength) : undefined;
      
      if (minEntries < 1) {
        alert('Minimum entries must be at least 1');
        return;
      }
      
      if (maxEntries && maxEntries < minEntries) {
        alert('Maximum entries cannot be less than minimum entries');
        return;
      }
      
      if (digitLength && (digitLength < 1 || digitLength > 20)) {
        alert('Digit length must be between 1 and 20');
        return;
      }
      
      fieldData.options = {
        min_entries: minEntries,
        max_entries: maxEntries,
        entry_label: repeatableEntryLabel || 'Entry',
        digit_length: digitLength, // 🆕 Exact digit length requirement
        remove_leading_zero: repeatableRemoveLeadingZero, // 🆕 Auto-remove leading "0"
        prevent_duplicates: repeatablePreventDuplicates, // 🆕 Prevent duplicate values within submission
        check_database: repeatableCheckDatabase, // 🆕 Check if value exists in database for today
      };
    }

    // Add validation rules
    if (fieldValidation.min || fieldValidation.max || fieldValidation.pattern || fieldValidation.error_message) {
      fieldData.validation = {
        min: fieldValidation.min ? parseInt(fieldValidation.min) || undefined : undefined,
        max: fieldValidation.max ? parseInt(fieldValidation.max) || undefined : undefined,
        pattern: fieldValidation.pattern || undefined,
        error_message: fieldValidation.error_message || undefined,
        prevent_duplicates: fieldPreventDuplicates, // 🆕 Also store in validation
      };
    } else if (fieldPreventDuplicates) {
      // Create validation object if it doesn't exist but prevent_duplicates is enabled
      fieldData.validation = {
        prevent_duplicates: true,
      };
    }

    // Add conditional logic
    if (showConditional && conditionalField && conditionalValue) {
      fieldData.conditional_logic = {
        show_if_field: conditionalField,
        show_if_value: conditionalValue,
      };
    }

    setSections(sections.map(section => {
      if (section.id === activeSection) {
        if (editingField) {
          // 🔍 Debug log for field updates
          console.log('[ProgramCreator] 🔄 Updating field:', {
            fieldId: editingField.id,
            fieldLabel: fieldData.field_label,
            fieldType: fieldData.field_type,
            options: fieldData.options,
          });
          // ✅ Show success message for repeatable_number updates
          if (fieldData.field_type === 'repeatable_number') {
            console.log('[ProgramCreator] ✅ Repeatable Number field updated! Remember to click "Confirm edits" to save to database.');
            alert(`✅ Field "${fieldData.field_label}" updated to Repeatable Numbers!\n\n⚠️ IMPORTANT: Click "Confirm edits" at the bottom to save changes to the database.`);
          }
          return {
            ...section,
            fields: section.fields.map(f => f.id === editingField.id ? fieldData : f)
          };
        } else {
          console.log('[ProgramCreator] ➕ Adding new field:', {
            fieldLabel: fieldData.field_label,
            fieldType: fieldData.field_type,
            options: fieldData.options,
          });
          return {
            ...section,
            fields: [...section.fields, fieldData]
          };
        }
      }
      return section;
    }));

    closeFieldEditor();
  };

  const openFieldEditor = (field?: ProgramField) => {
    if (field) {
      setEditingField(field);
      setFieldName(field.field_name);
      setFieldLabel(field.field_label);
      setFieldType(field.field_type);
      setFieldRequired(field.is_required);
      setFieldPreventDuplicates(field.options?.prevent_duplicates || field.validation?.prevent_duplicates || false); // 🆕 Load prevent_duplicates
      setFieldPlaceholder(field.placeholder || '');
      setFieldHelp(field.help_text || '');
      setFieldOptions(field.options?.options || ['Option 1', 'Option 2', 'Option 3']);
      setFieldValidation({
        min: field.validation?.min?.toString() || '',
        max: field.validation?.max?.toString() || '',
        pattern: field.validation?.pattern || '',
        error_message: field.validation?.error_message || '',
      });
      setShowConditional(!!field.conditional_logic);
      setConditionalField(field.conditional_logic?.show_if_field || '');
      setConditionalValue(field.conditional_logic?.show_if_value || '');
      
      // 🆕 Load database dropdown config if exists
      const dbSource = field.options?.database_source;
      if (dbSource && typeof dbSource === 'object') {
        setDropdownSource('database');
        setDbTable(dbSource.table || '');
        setDbDisplayField(dbSource.display_field || '');
        setDbMetadataFields(dbSource.metadata_fields || []);
        setDbMultiSelect(dbSource.multi_select || false);
        setDbRepeatableDropdown(dbSource.repeatable_dropdown || false); // 🆕 Load repeatable_dropdown
        if (dbSource.table) {
          loadColumnsForTable(dbSource.table);
        }
      } else {
        setDropdownSource('static');
        setDbTable('');
        setDbDisplayField('');
        setDbMetadataFields([]);
        setDbMultiSelect(false);
        setDbRepeatableDropdown(false); // 🆕 Reset repeatable_dropdown
      }

      // 🆕 Load repeatable number config if exists
      if (field.field_type === 'repeatable_number' && field.options) {
        setRepeatableMinEntries(field.options.min_entries?.toString() || '');
        setRepeatableMaxEntries(field.options.max_entries?.toString() || '');
        setRepeatableEntryLabel(field.options.entry_label || 'Entry');
        setRepeatableDigitLength(field.options.digit_length?.toString() || '');
        setRepeatableRemoveLeadingZero(field.options.remove_leading_zero || false);
        setRepeatablePreventDuplicates(field.options.prevent_duplicates || false);
        setRepeatableCheckDatabase(field.options.check_database || false);
      } else {
        setRepeatableMinEntries('');
        setRepeatableMaxEntries('');
        setRepeatableEntryLabel('Entry');
        setRepeatableDigitLength('');
        setRepeatableRemoveLeadingZero(false);
        setRepeatablePreventDuplicates(false);
        setRepeatableCheckDatabase(false);
      }
    } else {
      setEditingField(null);
      setFieldName('');
      setFieldLabel('');
      setFieldType('text');
      setFieldRequired(false);
      setFieldPreventDuplicates(false); // 🆕 Reset prevent_duplicates
      setFieldPlaceholder('');
      setFieldHelp('');
      setFieldOptions(['Option 1', 'Option 2', 'Option 3']);
      setFieldValidation({ min: '', max: '', pattern: '', error_message: '' });
      setShowConditional(false);
      setConditionalField('');
      setConditionalValue('');
      
      // 🆕 Reset database dropdown config
      setDropdownSource('static');
      setDbTable('');
      setDbDisplayField('');
      setDbMetadataFields([]);
      setDbMultiSelect(false);
      setDbRepeatableDropdown(false); // 🆕 Reset repeatable_dropdown
      setAvailableColumns([]);

      // 🆕 Reset repeatable number config
      setRepeatableMinEntries('');
      setRepeatableMaxEntries('');
      setRepeatableEntryLabel('Entry');
    }
    setShowFieldEditor(true);
    
    // 🆕 Load available tables when opening the modal
    loadAvailableTables();
  };

  const closeFieldEditor = () => {
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    if (!confirm('Delete this field?')) return;
    setSections(sections.map(section => ({
      ...section,
      fields: section.fields.filter(f => f.id !== fieldId)
    })));
  };

  const duplicateField = (field: ProgramField) => {
    const newField = {
      ...field,
      id: `field_${Date.now()}`,
      field_label: `${field.field_label} (Copy)`,
      order_index: currentSection!.fields.length,
    };
    setSections(sections.map(section => {
      if (section.id === activeSection) {
        return {
          ...section,
          fields: [...section.fields, newField]
        };
      }
      return section;
    }));
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    setSections(sections.map(section => {
      if (section.id === activeSection) {
        const fields = [...section.fields];
        const index = fields.findIndex(f => f.id === fieldId);
        if (index === -1) return section;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return section;
        
        [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
        fields.forEach((f, idx) => f.order_index = idx);
        
        return { ...section, fields };
      }
      return section;
    }));
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section_${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      description: '',
      fields: []
    };
    setSections([...sections, newSection]);
    setActiveSection(newSection.id);
  };

  const deleteSection = (sectionId: string) => {
    if (sections.length === 1) {
      alert('Cannot delete the last section');
      return;
    }
    if (!confirm('Delete this section and all its fields?')) return;
    setSections(sections.filter(s => s.id !== sectionId));
    if (activeSection === sectionId) {
      setActiveSection(sections[0].id);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const createProgram = async () => {
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

    if (sections.every(s => s.fields.length === 0)) {
      setError('Please add at least one field');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) throw new Error('Not authenticated');
      const user = JSON.parse(storedUser);

      let program;

      if (editingProgram && editingProgram.id) {
        // UPDATE EXISTING PROGRAM
        console.log('[ProgramCreator] Updating program:', editingProgram.id, title);

        const { data: updatedProgram, error: programError } = await supabase
          .from('programs')
          .update({
            title,
            description,
            category,
            icon,
            color,
            points_value: pointsValue,
            points_enabled: pointsEnabled, // 🆕 Points toggle
            gps_auto_detect_enabled: gpsAutoDetectEnabled, // 🆕 GPS Auto-Detect toggle
            progressive_disclosure_enabled: progressiveDisclosureEnabled, // 🆕 Progressive Disclosure toggle
            zone_filtering_enabled: zoneFilteringEnabled, // 🆕 Zone filtering toggle
            van_checkout_enforcement_enabled: vanCheckoutEnforcementEnabled, // 🚐 Van checkout enforcement
            whitelist_enabled: whitelistEnabled,
            whitelist_target: whitelistTarget || null,
            whitelist_fields: whitelistFields,
            // session_checkin_enabled is stored in KV store, not programs table
            target_roles: targetRoles,
            who_can_submit: whoCanSubmit, // 🆕 Who can submit
            status: 'active',
          })
          .eq('id', editingProgram.id)
          .select()
          .single();

        if (programError) {
          console.error('[ProgramCreator] Error updating program:', programError);
          throw new Error(programError.message);
        }

        program = updatedProgram;
        console.log('[ProgramCreator] ✅ Program updated:', program.id);

        // Save session checkin flag to KV store (separate from programs table)
        try {
          await programsAPI.setCheckinFlag(program.id, sessionCheckinEnabled);
          console.log('[ProgramCreator] ✅ Session checkin flag saved to KV');
        } catch (kvErr) {
          console.error('[ProgramCreator] ⚠️ Failed to save session checkin flag:', kvErr);
        }

        // Save form config (linked program + session checkin) — always save
        try {
          const existingConfig = await programsAPI.getProgramFormConfig(program.id);
          await programsAPI.saveProgramFormConfig(program.id, {
            ...existingConfig,
            session_checkin_enabled: sessionCheckinEnabled,
            linked_checkin_program_id: linkedCheckinProgramId || '',
          });
          console.log('[ProgramCreator] ✅ Form config saved (linked:', linkedCheckinProgramId || 'none', ')');
        } catch (linkErr) {
          console.error('[ProgramCreator] ⚠️ Failed to save form config:', linkErr);
        }

        // Delete existing fields and recreate them
        const { error: deleteError } = await supabase
          .from('program_fields')
          .delete()
          .eq('program_id', program.id);

        if (deleteError) {
          console.error('[ProgramCreator] Error deleting old fields:', deleteError);
        }
      } else {
        // CREATE NEW PROGRAM
        console.log('[ProgramCreator] Creating program:', title);

        const { data: newProgram, error: programError } = await supabase
          .from('programs')
          .insert({
            title,
            description,
            category,
            icon,
            color,
            points_value: pointsValue,
            points_enabled: pointsEnabled, // 🆕 Points toggle
            gps_auto_detect_enabled: gpsAutoDetectEnabled, // 🆕 GPS Auto-Detect toggle
            progressive_disclosure_enabled: progressiveDisclosureEnabled, // 🆕 Progressive Disclosure toggle
            zone_filtering_enabled: zoneFilteringEnabled, // 🆕 Zone filtering toggle
            van_checkout_enforcement_enabled: vanCheckoutEnforcementEnabled, // 🚐 Van checkout enforcement
            whitelist_enabled: whitelistEnabled,
            whitelist_target: whitelistTarget || null,
            whitelist_fields: whitelistFields,
            // session_checkin_enabled is stored in KV store, not programs table
            target_roles: targetRoles,
            who_can_submit: whoCanSubmit, // 🆕 Who can submit
            status: 'active',
          })
          .select()
          .single();

        if (programError) {
          console.error('[ProgramCreator] Error creating program:', programError);
          throw new Error(programError.message);
        }

        program = newProgram;
        console.log('[ProgramCreator] ✅ Program created:', program.id);

        // Save session checkin flag to KV store (separate from programs table)
        try {
          await programsAPI.setCheckinFlag(program.id, sessionCheckinEnabled);
          console.log('[ProgramCreator] ✅ Session checkin flag saved to KV');
        } catch (kvErr) {
          console.error('[ProgramCreator] ⚠️ Failed to save session checkin flag:', kvErr);
        }

        // Save form config (for new programs) — always save
        try {
          await programsAPI.saveProgramFormConfig(program.id, {
            session_checkin_enabled: sessionCheckinEnabled,
            linked_checkin_program_id: linkedCheckinProgramId || '',
          });
          console.log('[ProgramCreator] ✅ Form config saved for new program');
        } catch (linkErr) {
          console.error('[ProgramCreator] ⚠️ Failed to save form config:', linkErr);
        }
      }

      // Step 2: Create all fields (for both create and update)
      const allFields = sections.flatMap((section, sectionIndex) => 
        section.fields.map((field, fieldIndex) => ({
          program_id: program.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          options: field.options || null,
          order_index: fieldIndex,
        }))
      );

      // 🔍 Debug log for fields being saved
      console.log('[ProgramCreator] 💾 Saving fields to database:', allFields.map(f => ({
        label: f.field_label,
        type: f.field_type,
        options: f.options,
      })));

      if (allFields.length > 0) {
        const { error: fieldsError } = await supabase
          .from('program_fields')
          .insert(allFields);

        if (fieldsError) {
          console.error('[ProgramCreator] Error creating fields:', fieldsError);
          // Don't fail if fields fail - program is already created/updated
        } else {
          console.log(`[ProgramCreator] ✅ Created ${allFields.length} fields`);
        }
      }

      console.log(`[ProgramCreator] ✅ Program ${editingProgram ? 'updated' : 'created'} successfully:`, program.title);
      
      // Step 3: Send notifications to all target users
      // TODO: Re-enable notifications once notifications table is created
      /*
      await notifyNewProgram({
        id: program.id,
        title: program.title,
        description: program.description,
        points_value: program.points_value,
        target_roles: program.target_roles
      });
      */
      
      onSuccess();
    } catch (err: any) {
      console.error('[ProgramCreator] Error:', err);
      setError(err.message || 'Failed to create program');
    } finally {
      setIsCreating(false);
    }
  };

  const allFields = sections.flatMap(s => s.fields);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white font-bold">{editingProgram ? '✏️ Edit Program' : '✨ Create New Program'}</h2>
            <p className="text-sm text-red-100">Google Forms-style Dynamic Builder</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'build'
                ? 'bg-white text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🏗️ Build
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* BUILD TAB */}
          {activeTab === 'build' && (
            <div className="space-y-6">
              {/* Program Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Program Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Network Coverage Assessment"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Sections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Form Sections</h3>
                  <button
                    onClick={addSection}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </button>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap font-semibold transition-colors ${
                        activeSection === section.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>

                {/* Active Section Editor */}
                {currentSection && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={currentSection.title}
                          onChange={(e) => updateSection(currentSection.id, { title: e.target.value })}
                          placeholder="Section title"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg mb-2 font-semibold"
                        />
                        <textarea
                          value={currentSection.description}
                          onChange={(e) => updateSection(currentSection.id, { description: e.target.value })}
                          placeholder="Section description (optional)"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm resize-none"
                          rows={2}
                        />
                      </div>
                      {sections.length > 1 && (
                        <button
                          onClick={() => deleteSection(currentSection.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Fields in Section */}
                    <div className="space-y-3">
                      {currentSection.fields.map((field, index) => {
                        const fieldTypeInfo = FIELD_TYPES.find(ft => ft.value === field.field_type);
                        const FieldIcon = fieldTypeInfo?.icon || Type;
                        
                        return (
                          <div
                            key={field.id}
                            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-red-300 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <button className="text-gray-400 hover:text-gray-600 cursor-move">
                                <GripVertical className="w-5 h-5" />
                              </button>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FieldIcon className="w-4 h-4 text-gray-600" />
                                  <span className="font-semibold text-gray-800">{field.field_label}</span>
                                  {field.is_required && (
                                    <span className="text-red-600 text-sm">*</span>
                                  )}
                                  {field.conditional_logic && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                      Conditional
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {fieldTypeInfo?.label}
                                  {field.help_text && ` • ${field.help_text}`}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => moveField(field.id, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                >
                                  ▲
                                </button>
                                <button
                                  onClick={() => moveField(field.id, 'down')}
                                  disabled={index === currentSection.fields.length - 1}
                                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                >
                                  ▼
                                </button>
                                <button
                                  onClick={() => openFieldEditor(field)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => duplicateField(field)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteField(field.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Field Button */}
                      <button
                        onClick={() => openFieldEditor()}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add Field
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-t-xl p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">{title || 'Untitled Program'}</h2>
                <p className="text-white opacity-90">{description || 'No description'}</p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-black font-semibold">
                    ⭐ {pointsValue} points
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-black font-semibold">
                    {allFields.length} fields
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-b-xl shadow-lg p-6 space-y-6">
                {sections.map((section) => (
                  <div key={section.id}>
                    {section.title && (
                      <div className="mb-4 pb-2 border-b-2 border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      {section.fields.map((field) => {
                        const fieldTypeInfo = FIELD_TYPES.find(ft => ft.value === field.field_type);
                        const FieldIcon = fieldTypeInfo?.icon || Type;
                        
                        return (
                          <div key={field.id} className="space-y-2">
                            <label className="block">
                              <div className="flex items-center gap-2 mb-2">
                                <FieldIcon className="w-4 h-4 text-gray-600" />
                                <span className="font-semibold text-gray-800">
                                  {field.field_label}
                                  {field.is_required && <span className="text-red-600 ml-1">*</span>}
                                </span>
                              </div>
                              {field.help_text && (
                                <p className="text-sm text-gray-600 mb-2">{field.help_text}</p>
                              )}
                              
                              {field.field_type === 'text' && (
                                <input
                                  type="text"
                                  placeholder={field.placeholder}
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                                  disabled
                                />
                              )}
                              {field.field_type === 'long_text' && (
                                <textarea
                                  placeholder={field.placeholder}
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg resize-none"
                                  rows={3}
                                  disabled
                                />
                              )}
                              {field.field_type === 'number' && (
                                <input
                                  type="number"
                                  placeholder={field.placeholder}
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                                  disabled
                                />
                              )}
                              {field.field_type === 'repeatable_number' && (
                                <div className="space-y-2">
                                  <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 mb-2">
                                    <p className="text-xs text-gray-600">
                                      Min: {field.options?.min_entries || 1} entries
                                      {field.options?.max_entries && ` | Max: ${field.options.max_entries} entries`}
                                    </p>
                                  </div>
                                  {Array.from({ length: Math.min(field.options?.min_entries || 3, 3) }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600 w-20">{field.options?.entry_label || 'Entry'} {i + 1}:</span>
                                      <input
                                        type="number"
                                        placeholder="Enter number"
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg"
                                        disabled
                                      />
                                    </div>
                                  ))}
                                  {(field.options?.min_entries || 1) > 3 && (
                                    <p className="text-xs text-gray-500 italic">
                                      ... and {(field.options?.min_entries || 1) - 3} more entries
                                    </p>
                                  )}
                                  <button
                                    type="button"
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 text-sm"
                                    disabled
                                  >
                                    + Add More {field.options?.entry_label || 'Entry'}
                                  </button>
                                </div>
                              )}
                              {field.field_type === 'dropdown' && (
                                <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white" disabled>
                                  <option>Select an option...</option>
                                  {field.options?.options?.map((opt, i) => (
                                    <option key={i}>{opt}</option>
                                  ))}
                                </select>
                              )}
                              {(field.field_type === 'multi_select' || field.field_type === 'radio') && (
                                <div className="space-y-2">
                                  {field.options?.options?.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <input
                                        type={field.field_type === 'radio' ? 'radio' : 'checkbox'}
                                        className="w-4 h-4"
                                        disabled
                                      />
                                      <span className="text-gray-800">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {field.field_type === 'date' && (
                                <input
                                  type="date"
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white"
                                  disabled
                                />
                              )}
                              {field.field_type === 'time' && (
                                <input
                                  type="time"
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white"
                                  disabled
                                />
                              )}
                              {field.field_type === 'photo' && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                                  <Image className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600">Photo upload with GPS</p>
                                </div>
                              )}
                              {field.field_type === 'location' && gpsAutoDetectEnabled && (
                                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-5 h-5" />
                                    <span className="text-sm">GPS Location will be captured</span>
                                  </div>
                                </div>
                              )}
                              {field.field_type === 'location' && !gpsAutoDetectEnabled && (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                    <span className="text-sm italic">GPS disabled — location not captured for this program</span>
                                  </div>
                                </div>
                              )}
                              {field.field_type === 'yes_no' && (
                                <div className="flex gap-4">
                                  <button className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold border-2 border-green-200 hover:bg-green-200 transition-colors">
                                    ✓ Yes
                                  </button>
                                  <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold border-2 border-gray-200 hover:bg-gray-200 transition-colors">
                                     No
                                  </button>
                                </div>
                              )}
                              {field.field_type === 'rating' && (
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} className="text-3xl text-yellow-400 hover:text-yellow-500 transition-colors">⭐</button>
                                  ))}
                                </div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {allFields.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No fields added yet. Go to Build tab to add fields.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this program..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option>Network Experience</option>
                    <option>Market Intelligence</option>
                    <option>Competitor Analysis</option>
                    <option>Customer Insights</option>
                    <option>Infrastructure</option>
                    <option>Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Points Value
                  </label>
                  <input
                    type="number"
                    value={pointsValue}
                    onChange={(e) => setPointsValue(parseInt(e.target.value) || 0)}
                    disabled={!pointsEnabled}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 🆕 Points System Toggle */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="pointsEnabled"
                    checked={pointsEnabled}
                    onChange={(e) => setPointsEnabled(e.target.checked)}
                    className="w-6 h-6 text-red-600 rounded-lg focus:ring-2 focus:ring-red-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="pointsEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>⭐ Award Points for This Program</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {pointsEnabled 
                        ? `✅ Users will earn ${pointsValue} points per submission. Points will be added to leaderboard and total scores.`
                        : '❌ This is a tracking-only program. Submissions will be recorded but no points will be awarded. Useful for operational tasks like planning, reporting, or data collection.'
                      }
                    </p>
                    {!pointsEnabled && (
                      <div className="mt-3 bg-white border border-orange-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-orange-800">💡 Use Cases for Non-Points Programs:</p>
                        <ul className="text-xs text-orange-700 mt-1 space-y-1 ml-4">
                          <li>• Weekly planning and calendars (Van Calendar, Route Planning)</li>
                          <li>• Administrative reporting (Attendance, Stock Reports)</li>
                          <li>• Data collection forms (Surveys, Feedback)</li>
                          <li>• Manager-only submissions (ZSM Reports, HQ Updates)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🆕 GPS Auto-Detect Toggle */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="gpsAutoDetectEnabled"
                    checked={gpsAutoDetectEnabled}
                    onChange={(e) => setGpsAutoDetectEnabled(e.target.checked)}
                    className="w-6 h-6 text-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="gpsAutoDetectEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>📍 Enable GPS Auto-Detect Button</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {gpsAutoDetectEnabled 
                        ? '✅ Users will see the "Auto-Detect My Location" button when submitting. GPS coordinates will be automatically captured.'
                        : '❌ GPS auto-detection is disabled. Location will not be captured for this program. Useful for desk-based or planning activities that don\'t require field location verification.'
                      }
                    </p>
                    {!gpsAutoDetectEnabled && (
                      <div className="mt-3 bg-white border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-800">💡 Use Cases for No-GPS Programs:</p>
                        <ul className="text-xs text-blue-700 mt-1 space-y-1 ml-4">
                          <li>• Planning forms (Van Calendar, Route Planning)</li>
                          <li>• Office-based reporting (Monthly Reports, Analysis)</li>
                          <li>• Data entry tasks (Inventory Updates, Approvals)</li>
                          <li>• HQ/ZSM submissions that don't require field verification</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🆕 Progressive Disclosure Toggle */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="progressiveDisclosureEnabled"
                    checked={progressiveDisclosureEnabled}
                    onChange={(e) => setProgressiveDisclosureEnabled(e.target.checked)}
                    className="w-6 h-6 text-purple-600 rounded-lg focus:ring-2 focus:ring-purple-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="progressiveDisclosureEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>🎯 Enable Progressive Disclosure UI</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {progressiveDisclosureEnabled 
                        ? '✅ Multi-field patterns (like Van Calendar sites) will show 1 field initially with "+ Add Another" buttons to reveal more. Clean, uncluttered interface.'
                        : '❌ All fields will be shown at once. Use this if you want users to see all input slots upfront without needing to click "Add" buttons.'
                      }
                    </p>
                    {progressiveDisclosureEnabled && (
                      <div className="mt-3 bg-white border border-purple-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800">✨ How It Works:</p>
                        <ul className="text-xs text-purple-700 mt-1 space-y-1 ml-4">
                          <li>• Van Calendar: Shows 1 site per day, click to add up to 4</li>
                          <li>• Reduces visual clutter (6 days × 1 field vs 6 days × 4 fields)</li>
                          <li>• Users add only what they need (1-4 sites per day)</li>
                          <li>• Better mobile experience with less scrolling</li>
                        </ul>
                      </div>
                    )}
                    {!progressiveDisclosureEnabled && (
                      <div className="mt-3 bg-white border border-purple-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800">📋 Traditional View:</p>
                        <ul className="text-xs text-purple-700 mt-1 space-y-1 ml-4">
                          <li>• All 4 site dropdowns visible for each day (24 fields total)</li>
                          <li>• Users can see all slots without clicking</li>
                          <li>• Best for power users who fill all fields every time</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🆕 Zone Filtering Toggle */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="zoneFilteringEnabled"
                    checked={zoneFilteringEnabled}
                    onChange={(e) => setZoneFilteringEnabled(e.target.checked)}
                    className="w-6 h-6 text-green-600 rounded-lg focus:ring-2 focus:ring-green-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="zoneFilteringEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>🔒 Lock Dropdowns to User's Zone</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {zoneFilteringEnabled 
                        ? '✅ Database dropdowns (like sites) will ONLY show items from the user\'s zone. Users cannot see or select sites from other zones. Perfect for zone-specific planning.'
                        : '❌ Dropdowns show all items from the database, regardless of zone. Users can see and select any site across all zones.'
                      }
                    </p>
                    {zoneFilteringEnabled && (
                      <div className="mt-3 bg-white border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-800">🔒 How Zone Filtering Works:</p>
                        <ul className="text-xs text-green-700 mt-1 space-y-1 ml-4">
                          <li>• Van Calendar: ZSMs only see sites in their zone (e.g., NAIROBI)</li>
                          <li>• Prevents cross-zone selection errors</li>
                          <li>• Faster dropdown loading (fewer items)</li>
                          <li>• Example: If user is in NAIROBI zone, they only see NAIROBI sites</li>
                        </ul>
                      </div>
                    )}
                    {!zoneFilteringEnabled && (
                      <div className="mt-3 bg-white border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-800">🌍 All Zones Visible:</p>
                        <ul className="text-xs text-green-700 mt-1 space-y-1 ml-4">
                          <li>• Users see ALL sites across ALL zones</li>
                          <li>• Useful for HQ Command Center or regional reports</li>
                          <li>• ZSMs can view (but shouldn't select) sites from other zones</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🚐 Van Checkout Enforcement Toggle */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="vanCheckoutEnforcementEnabled"
                    checked={vanCheckoutEnforcementEnabled}
                    onChange={(e) => setVanCheckoutEnforcementEnabled(e.target.checked)}
                    className="w-6 h-6 text-red-600 rounded-lg focus:ring-2 focus:ring-red-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="vanCheckoutEnforcementEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>🚐 Van Checkout Enforcement</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {vanCheckoutEnforcementEnabled 
                        ? '✅ Agents must check out the van before they can check in again. When a number plate is selected, the system will verify that the van was previously checked out.'
                        : '❌ No checkout verification. Agents can check in vans without checking out first.'
                      }
                    </p>
                    {vanCheckoutEnforcementEnabled && (
                      <div className="mt-3 bg-white border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-800">🔒 How It Works:</p>
                        <ul className="text-xs text-red-700 mt-1 space-y-1 ml-4">
                          <li>• When agent selects a number plate, system checks checkout history</li>
                          <li>• If van was NOT checked out → red banner, submit blocked</li>
                          <li>• If van WAS checked out → green banner, submit allowed</li>
                          <li>• Real-time check before form submission</li>
                        </ul>
                      </div>
                    )}
                    {!vanCheckoutEnforcementEnabled && (
                      <div className="mt-3 bg-white border border-orange-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-orange-800">💡 When to Enable:</p>
                        <ul className="text-xs text-orange-700 mt-1 space-y-1 ml-4">
                          <li>• For check-in programs that require prior van checkout</li>
                          <li>• To prevent agents from checking in without checking out first</li>
                          <li>• Enforces proper van usage workflow</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 📋 Session-Based Check-In Toggle */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="sessionCheckinEnabled"
                    checked={sessionCheckinEnabled}
                    onChange={(e) => setSessionCheckinEnabled(e.target.checked)}
                    className="w-6 h-6 text-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="sessionCheckinEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>📋 Session-Based Check-In</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {sessionCheckinEnabled
                        ? '✅ Day-long open session mode. Agents check in once, add sites and promoter MSISDNs throughout the day, enter GAs after 6 PM EAT, then close.'
                        : '❌ Standard one-shot submission mode. Each submission is independent.'
                      }
                    </p>
                    {sessionCheckinEnabled && (
                      <div className="mt-3 bg-white border border-indigo-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-indigo-800">📋 How Session Check-In Works:</p>
                        <ul className="text-xs text-indigo-700 mt-1 space-y-1 ml-4">
                          <li>• Agent opens program → a day-long session is created (or resumed)</li>
                          <li>• Sites and promoter MSISDNs can be added/removed throughout the day</li>
                          <li>• All changes auto-save instantly</li>
                          <li>• After 6 PM EAT, a GA input column appears for each promoter</li>
                          <li>• Agent manually closes the session when done → submission record created</li>
                        </ul>
                      </div>
                    )}
                    {!sessionCheckinEnabled && (
                      <div className="mt-3 bg-white border border-purple-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800">💡 When to Enable:</p>
                        <ul className="text-xs text-purple-700 mt-1 space-y-1 ml-4">
                          <li>• For check-in programs where agents visit multiple sites per day</li>
                          <li>• When GA data needs to be collected at end-of-day</li>
                          <li>• To allow flexible, incremental data entry throughout the day</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Auto Whitelist ─────────────────────────────────────────────────────── */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="whitelistEnabled"
                    checked={whitelistEnabled}
                    onChange={(e) => {
                      setWhitelistEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setWhitelistTarget('');
                        setWhitelistFields([]);
                      }
                    }}
                    className="w-6 h-6 text-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="whitelistEnabled" className="text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                      <span>✅ Auto Whitelist on Submission</span>
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {whitelistEnabled
                        ? 'Submitting this form will automatically create a login account for the person whose details are collected.'
                        : 'Disabled. Submissions do not create any login accounts.'}
                    </p>

                    {whitelistEnabled && (
                      <div className="mt-4 space-y-4">
                        {/* Target selector */}
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">Whitelist Target</label>
                          <select
                            value={whitelistTarget}
                            onChange={(e) => {
                              const t = e.target.value as typeof whitelistTarget;
                              setWhitelistTarget(t);
                              if (t === 'promoter_team_lead' && whitelistFields.length === 0) {
                                setWhitelistFields([...PROMOTER_TL_WHITELIST_DEFAULTS]);
                              }
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">— Select target —</option>
                            <option value="promoter_team_lead">Promoter Team Lead</option>
                          </select>
                        </div>

                        {/* Field configuration */}
                        {whitelistTarget && (
                          <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Whitelist Fields</label>
                            <div className="space-y-3">
                              {whitelistFields.map((field, idx) => (
                                <div key={field.db_column || idx} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                                  <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-500 block mb-1">Label</label>
                                      <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => {
                                          const updated = [...whitelistFields];
                                          updated[idx] = { ...updated[idx], label: e.target.value };
                                          setWhitelistFields(updated);
                                        }}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-500 block mb-1">DB Column</label>
                                      <input
                                        type="text"
                                        value={field.db_column}
                                        onChange={(e) => {
                                          const updated = [...whitelistFields];
                                          updated[idx] = { ...updated[idx], db_column: e.target.value };
                                          setWhitelistFields(updated);
                                        }}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    </div>
                                    <div className="w-28">
                                      <label className="text-xs text-gray-500 block mb-1">Type</label>
                                      <select
                                        value={field.input_type}
                                        onChange={(e) => {
                                          const updated = [...whitelistFields];
                                          updated[idx] = {
                                            ...updated[idx],
                                            input_type: e.target.value as 'text' | 'dropdown',
                                            source_table: '',
                                            source_column: '',
                                          };
                                          setWhitelistFields(updated);
                                          setWlAvailableColumns(prev => {
                                            const next = { ...prev };
                                            delete next[idx];
                                            return next;
                                          });
                                        }}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                      >
                                        <option value="text">Text</option>
                                        <option value="dropdown">Dropdown</option>
                                      </select>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWhitelistFields(whitelistFields.filter((_, i) => i !== idx));
                                        setWlAvailableColumns(prev => {
                                          const next: Record<number, string[]> = {};
                                          Object.entries(prev).forEach(([k, v]) => {
                                            const ki = Number(k);
                                            if (ki < idx) next[ki] = v;
                                            else if (ki > idx) next[ki - 1] = v;
                                            // ki === idx is dropped
                                          });
                                          return next;
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-sm"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {field.input_type === 'dropdown' && (
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-500 block mb-1">Source Table</label>
                                        <select
                                          value={field.source_table ?? ''}
                                          onChange={(e) => {
                                            const updated = [...whitelistFields];
                                            updated[idx] = { ...updated[idx], source_table: e.target.value, source_column: '' };
                                            setWhitelistFields(updated);
                                            fetchColumnsForField(idx, e.target.value);
                                          }}
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                        >
                                          <option value="">— Select table —</option>
                                          {wlAvailableTables.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-500 block mb-1">Source Column</label>
                                        <select
                                          value={field.source_column ?? ''}
                                          onChange={(e) => {
                                            const updated = [...whitelistFields];
                                            updated[idx] = { ...updated[idx], source_column: e.target.value };
                                            setWhitelistFields(updated);
                                          }}
                                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                          disabled={!field.source_table}
                                        >
                                          <option value="">— Select column —</option>
                                          {(wlAvailableColumns[idx] ?? []).map(col => (
                                            <option key={col} value={col}>{col}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setWhitelistFields([
                                ...whitelistFields,
                                { label: '', db_column: '', input_type: 'text' },
                              ])}
                              className="mt-2 text-sm text-emerald-700 font-semibold hover:underline"
                            >
                              + Add Field
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 🔗 Link Forms — works independently of session check-in */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-base">🔗</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-base font-bold text-gray-800 flex items-center gap-2">
                      Link Forms
                      {linkedCheckinProgramId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-violet-100 text-violet-700">
                          LINKED
                        </span>
                      )}
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Link this form to a check-in program. When a user opens this form, MSISDNs from today's check-in will auto-populate with a GA input next to each. If no check-in exists, the form is blocked.
                    </p>
                    <div className="mt-3">
                      <select
                        value={linkedCheckinProgramId}
                        onChange={(e) => setLinkedCheckinProgramId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm border-2 border-violet-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
                      >
                        <option value="">-- No linked form --</option>
                        {allProgramsForLinking
                          .filter(p => p.id !== editingProgram?.id)
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))
                        }
                      </select>
                    </div>
                    {linkedCheckinProgramId && (
                      <div className="mt-3 bg-white border border-violet-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-violet-800">🔗 Linked Checkout Mode:</p>
                        <ul className="text-xs text-violet-700 mt-1 space-y-1 ml-4">
                          <li>• User must complete the linked check-in first</li>
                          <li>• MSISDNs from today's check-in auto-populate after selecting number plate</li>
                          <li>• GA input appears next to each MSISDN</li>
                          <li>• Users can still add new MSISDNs manually</li>
                        </ul>
                      </div>
                    )}
                    {!linkedCheckinProgramId && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Leave empty for a standalone form with no linked check-in dependency.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    placeholder="📊"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-2xl cursor-pointer"
                    readOnly
                  />
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute z-10 mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-2xl p-4 w-full max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-6 gap-2">
                        {['📊', '📈', '📉', '📌', '📍', '📷', '📸', '📹', '🎯', '🎪', '🎨', '🎭', 
                          '🏆', '🏅', '🥇', '🥈', '🥉', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', 
                          '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '📡', '📻', '📱', '📲', 
                          '💻', '⌨️', '🖥️', '🖨️', '💾', '💿', '📀', '📼', '🎥', '🎬', 
                          '💰', '💵', '💴', '💶', '💷', '💸', '💳', '💹', '📊', '📈', 
                          '✅', '❌', '⭐', '🌟', '💫', '✨', '🔥', '💯', '🎉', '🎊', 
                          '🚀', '🛰️', '🌈', '☀️', '⛅', '☁️', '🌤️', '⛈️', '🌩️', '🌧️', 
                          '💡', '🔦', '🕯️', '💤', '💥', '💢', '💬', '💭', '🗨️', '🗯️',
                          '🎁', '🎀', '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎏',
                          '🔔', '🔕', '🎵', '🎶', '🎤', '🎧', '📻', '.sax', '🎸', '🎹',
                          '👍', '👎', '✊', '✌️', '🤝', '👏', '🙌', '👊', '💪', '🦾',
                          '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👂', '👃', '👅'
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setIcon(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-2xl hover:bg-gray-100 rounded-lg p-2 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-12 border-2 border-gray-300 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Target Roles *
                </label>
                <p className="text-xs text-gray-600 mb-2">Who can SEE this program</p>
                <div className="space-y-2">
                  {TARGET_ROLES.map((role) => (
                    <label key={role.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetRoles.includes(role.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetRoles([...targetRoles, role.value]);
                          } else {
                            setTargetRoles(targetRoles.filter(r => r !== role.value));
                          }
                        }}
                        className="w-5 h-5 text-red-600 rounded"
                      />
                      <span className="flex-1 font-medium">{role.label}</span>
                      <span className="text-sm text-gray-500">{role.count} users</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Who Can Submit *
                </label>
                <p className="text-xs text-gray-600 mb-2">Who can FILL OUT this form</p>
                <div className="space-y-2">
                  {TARGET_ROLES.map((role) => (
                    <label key={role.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whoCanSubmit.includes(role.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWhoCanSubmit([...whoCanSubmit, role.value]);
                          } else {
                            setWhoCanSubmit(whoCanSubmit.filter(r => r !== role.value));
                          }
                        }}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <span className="flex-1 font-medium">{role.label}</span>
                      <span className="text-sm text-gray-500">{role.count} users</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-between">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {!error && (
            <div className="text-sm text-gray-600">
              {allFields.length} field{allFields.length !== 1 ? 's' : ''} • {sections.length} section{sections.length !== 1 ? 's' : ''}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={createProgram}
              disabled={isCreating || !title.trim()}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingProgram ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingProgram ? 'Confirm edits' : 'Create Program'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Field Editor Modal */}
      {showFieldEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl text-white font-bold">
                {editingField ? '✏️ Edit Field' : '➕ Add New Field'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g., Site Name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Field Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {FIELD_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = fieldType === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          setFieldType(type.value);
                          // Auto-populate options for choice fields if empty
                          if (['dropdown', 'multi_select', 'radio'].includes(type.value)) {
                            if (fieldOptions.length === 0 || fieldOptions.every(opt => !opt.trim())) {
                              setFieldOptions(['Option 1', 'Option 2', 'Option 3']);
                            }
                          }
                        }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                          <span className={`font-semibold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{type.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 🆕 Database vs Static Options Toggle for Dropdown */}
              {fieldType === 'dropdown' && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📊 Dropdown Data Source *
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDropdownSource('static')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        dropdownSource === 'static'
                          ? 'bg-white border-purple-600 shadow-md'
                          : 'bg-white border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">📝</div>
                        <div className={`font-semibold text-sm ${dropdownSource === 'static' ? 'text-purple-900' : 'text-gray-700'}`}>
                          Static Options
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Manually enter options
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDropdownSource('database')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        dropdownSource === 'database'
                          ? 'bg-white border-purple-600 shadow-md'
                          : 'bg-white border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🗄️</div>
                        <div className={`font-semibold text-sm ${dropdownSource === 'database' ? 'text-purple-900' : 'text-gray-700'}`}>
                          Database Source
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Pull from database table
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* 🆕 Database Dropdown Configuration */}
              {fieldType === 'dropdown' && dropdownSource === 'database' && (
                <div className="space-y-4 bg-white p-4 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
                    <span className="text-xl">🗄️</span>
                    <span>Database Configuration</span>
                  </div>

                  {/* Table Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Table *
                    </label>
                    <select
                      value={dbTable}
                      onChange={(e) => {
                        setDbTable(e.target.value);
                        setDbDisplayField('');
                        setDbMetadataFields([]);
                        if (e.target.value) {
                          loadColumnsForTable(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white"
                      disabled={isLoadingTables}
                    >
                      <option value="">-- Choose a table --</option>
                      {availableTables.map((table) => (
                        <option key={table.name} value={table.name}>
                          {table.label} ({table.name})
                        </option>
                      ))}
                    </select>
                    {isLoadingTables && (
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading tables...
                      </div>
                    )}
                  </div>

                  {/* Display Field Selection */}
                  {dbTable && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Display Field * <span className="text-xs text-gray-500">(shown in dropdown)</span>
                      </label>
                      <select
                        value={dbDisplayField}
                        onChange={(e) => setDbDisplayField(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white"
                        disabled={isLoadingColumns || availableColumns.length === 0}
                      >
                        <option value="">-- Choose display field --</option>
                        {availableColumns.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.label} ({column.name})
                          </option>
                        ))}
                      </select>
                      {isLoadingColumns && (
                        <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          Loading columns...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata Fields Selection */}
                  {dbTable && dbDisplayField && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Metadata Fields <span className="text-xs text-gray-500">(optional - shown as details)</span>
                      </label>
                      <div className="max-h-40 overflow-y-auto border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                        {availableColumns
                          .filter(col => col.name !== dbDisplayField)
                          .map((column) => (
                            <label key={column.name} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={dbMetadataFields.includes(column.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDbMetadataFields([...dbMetadataFields, column.name]);
                                  } else {
                                    setDbMetadataFields(dbMetadataFields.filter(f => f !== column.name));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 rounded"
                              />
                              <span className="text-sm">{column.label}</span>
                            </label>
                          ))}
                      </div>
                      {dbMetadataFields.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dbMetadataFields.map((field) => (
                            <span key={field} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview */}
                  {dbTable && dbDisplayField && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-blue-900 mb-1">📋 Configuration Preview:</div>
                      <div className="text-xs text-blue-800 font-mono">
                        <div>Table: <span className="font-bold">{dbTable}</span></div>
                        <div>Display: <span className="font-bold">{dbDisplayField}</span></div>
                        {dbMetadataFields.length > 0 && (
                          <div>Metadata: <span className="font-bold">{dbMetadataFields.join(', ')}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multi-Select Toggle */}
                  {dbTable && dbDisplayField && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dbMultiSelect || false}
                          onChange={(e) => {
                            setDbMultiSelect(e.target.checked);
                            // ⚠️ Mutual exclusivity: Disable repeatable_dropdown if multi_select is enabled
                            if (e.target.checked && dbRepeatableDropdown) {
                              setDbRepeatableDropdown(false);
                              alert('⚠️ Multi-Select and Repeatable Dropdown cannot be enabled at the same time.\n\nRepeatable Dropdown has been disabled.');
                            }
                          }}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div>
                          <div className="text-sm font-semibold text-purple-900">
                            ✨ Allow Multiple Selections
                          </div>
                          <div className="text-xs text-purple-700">
                            Users can select multiple options from this dropdown
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* 🆕 Repeatable Dropdown Toggle */}
                  {dbTable && dbDisplayField && (
                    <div className="bg-teal-50 border-2 border-teal-300 rounded-lg p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dbRepeatableDropdown || false}
                          onChange={(e) => {
                            setDbRepeatableDropdown(e.target.checked);
                            // ⚠️ Mutual exclusivity: Disable multi_select if repeatable_dropdown is enabled
                            if (e.target.checked && dbMultiSelect) {
                              setDbMultiSelect(false);
                              alert('⚠️ Repeatable Dropdown and Multi-Select cannot be enabled at the same time.\n\nMulti-Select has been disabled.');
                            }
                          }}
                          className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-bold text-teal-900 flex items-center gap-2">
                            <span>🔄</span>
                            <span>Enable Repeatable Dropdown Entries</span>
                          </div>
                          <div className="text-xs text-teal-700 mt-1">
                            <strong>Progressive dropdown:</strong> Add multiple entries one by one (like Van Calendar sites). Each entry gets its own dropdown that appears after filling the previous one.
                          </div>
                          <div className="bg-white rounded border border-teal-200 p-2 mt-2">
                            <p className="text-xs text-gray-700">
                              <strong>💡 Example:</strong> "Select Sites Visited" - Users can add Site 1, Site 2, Site 3... Each site appears in a new dropdown as they add more.
                            </p>
                          </div>
                          <div className="bg-teal-100 rounded p-2 mt-2">
                            <p className="text-xs text-teal-800">
                              <strong>⚠️ Note:</strong> Cannot be used with "Multiple Selections" at the same time. Choose one or the other.
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Static Options (only show if not database source OR if not dropdown type) */}
              {['dropdown', 'multi_select', 'radio'].includes(fieldType) && 
               (fieldType !== 'dropdown' || dropdownSource === 'static') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Options *
                  </label>
                  <div className="space-y-2">
                    {fieldOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...fieldOptions];
                            newOptions[index] = e.target.value;
                            setFieldOptions(newOptions);
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={() => {
                            // Prevent deleting all options
                            if (fieldOptions.length > 1) {
                              setFieldOptions(fieldOptions.filter((_, i) => i !== index));
                            } else {
                              alert('At least one option is required');
                            }
                          }}
                          disabled={fieldOptions.length === 1}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFieldOptions([...fieldOptions, ''])}
                        className="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-semibold"
                      >
                        + Add Option
                      </button>
                      <button
                        onClick={loadZSMsFromDatabase}
                        disabled={isLoadingZSMs}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoadingZSMs ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Load ZSMs
                          </>
                        )}
                      </button>
                      <button
                        onClick={loadAMBShopsFromDatabase}
                        disabled={isLoadingZSMs}
                        className="flex-1 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoadingZSMs ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Add AMB Shops
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 🆕 Repeatable Number Configuration */}
              {fieldType === 'repeatable_number' && (
                <div className="bg-gradient-to-r from-teal-50 to-green-50 p-4 rounded-xl border-2 border-teal-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🔢 Repeatable Entry Configuration *
                  </label>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Entry Label (e.g., "Promoter", "Van", "Item")
                      </label>
                      <input
                        type="text"
                        value={repeatableEntryLabel}
                        onChange={(e) => setRepeatableEntryLabel(e.target.value)}
                        placeholder="Entry"
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Minimum Entries Required *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={repeatableMinEntries}
                          onChange={(e) => setRepeatableMinEntries(e.target.value)}
                          placeholder="e.g., 6"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Maximum Entries (Optional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={repeatableMaxEntries}
                          onChange={(e) => setRepeatableMaxEntries(e.target.value)}
                          placeholder="Unlimited"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          📱 Exact Digit Length (Optional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={repeatableDigitLength}
                          onChange={(e) => setRepeatableDigitLength(e.target.value)}
                          placeholder="e.g., 9 for phone"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty for any length
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer mt-6">
                          <input
                            type="checkbox"
                            checked={repeatableRemoveLeadingZero}
                            onChange={(e) => setRepeatableRemoveLeadingZero(e.target.checked)}
                            className="w-5 h-5 text-teal-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Remove Leading "0"
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          0785638462 → 785638462
                        </p>
                      </div>
                    </div>

                    {/* 🆕 Anti-Fraud / Duplicate Prevention */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-red-900">🛡️ Anti-Fraud Protection</h4>
                          <p className="text-xs text-red-700 mt-1">
                            Prevent malicious users from double-counting the same phone numbers
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer bg-white p-3 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={repeatablePreventDuplicates}
                            onChange={(e) => setRepeatablePreventDuplicates(e.target.checked)}
                            className="w-5 h-5 text-red-600 rounded mt-0.5 flex-shrink-0"
                          />
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">
                              Prevent Duplicate Values in Same Submission
                            </span>
                            <span className="text-xs text-gray-600 block mt-1">
                              Users cannot enter the same number twice (e.g., 785638462 can only appear once)
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer bg-white p-3 rounded-lg border-2 border-red-200 hover:bg-red-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={repeatableCheckDatabase}
                            onChange={(e) => setRepeatableCheckDatabase(e.target.checked)}
                            className="w-5 h-5 text-red-600 rounded mt-0.5 flex-shrink-0"
                          />
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">
                              Check Database for Same-Day Duplicates
                            </span>
                            <span className="text-xs text-gray-600 block mt-1">
                              Reject if number was already submitted by ANYONE today for this program
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="bg-red-100 p-2 rounded border border-red-300">
                        <p className="text-xs text-red-800">
                          <strong>⚠️ Use Case:</strong> Enable both options to stop SEs from submitting the same promoter phone numbers multiple times on the same day.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-teal-200">
                      <p className="text-xs text-gray-600">
                        <strong>Example:</strong> If you set minimum to 6, SEs will need to provide at least 6 number entries. They can always add more beyond the minimum.
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        <strong>Phone Numbers:</strong> Set digit length to 9 and enable "Remove Leading 0" to enforce format like 785638462 (9 digits without leading zero).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                    placeholder="Hint text..."
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldRequired}
                      onChange={(e) => setFieldRequired(e.target.checked)}
                      className="w-5 h-5 text-red-600 rounded"
                    />
                    <span className="font-semibold text-gray-700">Required Field</span>
                  </label>
                </div>
                
                {/* 🆕 Prevent Duplicate Selections - Only show for dropdown/select fields */}
                {(fieldType === 'dropdown' || fieldType === 'select') && (
                  <div className="flex items-center mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fieldPreventDuplicates}
                        onChange={(e) => setFieldPreventDuplicates(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <div>
                        <span className="font-semibold text-gray-700">🔒 Prevent Duplicate Selections</span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Once selected in a submission, option will be grayed out for future submissions
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Help Text
                </label>
                <textarea
                  value={fieldHelp}
                  onChange={(e) => setFieldHelp(e.target.value)}
                  placeholder="Additional instructions for this field..."
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg resize-none"
                  rows={2}
                />
              </div>

              {fieldType === 'number' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min Value
                    </label>
                    <input
                      type="number"
                      value={fieldValidation.min}
                      onChange={(e) => setFieldValidation({ ...fieldValidation, min: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Value
                    </label>
                    <input
                      type="number"
                      value={fieldValidation.max}
                      onChange={(e) => setFieldValidation({ ...fieldValidation, max: e.target.value })}
                      placeholder="100"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <button
                  onClick={() => setShowConditional(!showConditional)}
                  className="flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700"
                >
                  {showConditional ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  Conditional Logic (Advanced)
                </button>
                
                {showConditional && (
                  <div className="mt-3 p-4 bg-purple-50 rounded-lg space-y-3">
                    <p className="text-sm text-gray-700">Show this field only if:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={conditionalField}
                        onChange={(e) => setConditionalField(e.target.value)}
                        className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select field...</option>
                        {allFields
                          .filter(f => f.id !== editingField?.id)
                          .map(f => (
                            <option key={f.id} value={f.field_name}>
                              {f.field_label}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={conditionalValue}
                        onChange={(e) => setConditionalValue(e.target.value)}
                        placeholder="equals value..."
                        className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeFieldEditor}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveField}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                {editingField ? 'Update Field' : 'Add Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}