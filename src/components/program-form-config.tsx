import { useState, useEffect, useCallback } from 'react';
import {
  X, Settings, MapPin, Phone, Target, TrendingUp, Clock,
  Navigation, Lock, ChevronDown, ChevronUp, Loader2, Check,
  AlertCircle, ToggleLeft, ToggleRight, Search, Link2
} from 'lucide-react';
import programsAPI from './programs/programs-api';
import { getSupabaseClient } from '../utils/supabase/client';
import { useTheme } from './theme-provider';

export interface ProgramFormConfig {
  session_checkin_enabled: boolean;
  site_selection_enabled: boolean;
  msisdn_collection_enabled: boolean;
  ga_target_enabled: boolean;
  ga_actual_enabled: boolean;
  time_gate_enabled: boolean;
  time_gate_hour: number;
  gps_capture_enabled: boolean;
  content_lock_after_gate: boolean;
  linked_checkin_program_id?: string; // Checkout mode: link to a check-in program to auto-populate MSISDNs
}

const DEFAULT_CONFIG: ProgramFormConfig = {
  session_checkin_enabled: false,
  site_selection_enabled: true,
  msisdn_collection_enabled: true,
  ga_target_enabled: true,
  ga_actual_enabled: true,
  time_gate_enabled: true,
  time_gate_hour: 18,
  gps_capture_enabled: true,
  content_lock_after_gate: true,
  linked_checkin_program_id: '',
};

const FEATURE_META: { key: keyof ProgramFormConfig; label: string; icon: any; description: string; color: string; dependsOn?: keyof ProgramFormConfig }[] = [
  {
    key: 'session_checkin_enabled',
    label: 'Session-Based Check-In',
    icon: Settings,
    description: 'Day-long open session mode. Agents check in once and add data throughout the day. When OFF, program uses standard one-shot form submission.',
    color: '#6366f1', // indigo
  },
  {
    key: 'site_selection_enabled',
    label: 'Site Selection',
    icon: MapPin,
    description: 'Agents select sites from the database. Each site becomes an expandable card in the session.',
    color: '#8b5cf6', // violet
    dependsOn: 'session_checkin_enabled',
  },
  {
    key: 'msisdn_collection_enabled',
    label: 'MSISDN / Promoter Collection',
    icon: Phone,
    description: 'Collect promoter MSISDNs per site. Each site has its own promoter list.',
    color: '#3b82f6', // blue
    dependsOn: 'session_checkin_enabled',
  },
  {
    key: 'ga_target_enabled',
    label: 'GA Target per Site',
    icon: Target,
    description: 'Agents enter a GA target number for each site. Shown in the site header row.',
    color: '#f59e0b', // amber
    dependsOn: 'session_checkin_enabled',
  },
  {
    key: 'ga_actual_enabled',
    label: 'GA Actual / GAs Done',
    icon: TrendingUp,
    description: 'After time gate, agents enter the GAs actually achieved per site. Shows instant achievement % vs target.',
    color: '#22c55e', // green
    dependsOn: 'session_checkin_enabled',
  },
  {
    key: 'time_gate_enabled',
    label: 'Time Gate (6 PM Cutoff)',
    icon: Clock,
    description: 'After the configured hour (default 6 PM EAT), sites & MSISDNs lock and the GAs Done column goes live. Session can only be closed after this time.',
    color: '#ef4444', // red
    dependsOn: 'session_checkin_enabled',
  },
  {
    key: 'gps_capture_enabled',
    label: 'GPS Auto-Capture',
    icon: Navigation,
    description: 'Automatically capture GPS coordinates when a site is added.',
    color: '#14b8a6', // teal
    dependsOn: 'session_checkin_enabled',
  },
  {
    key: 'content_lock_after_gate',
    label: 'Content Lock After Time Gate',
    icon: Lock,
    description: 'After the time gate, prevent adding/removing sites and MSISDNs. Only GA actual inputs remain editable.',
    color: '#f97316', // orange
    dependsOn: 'time_gate_enabled',
  },
];

interface Program {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

interface Props {
  onClose: () => void;
}

export function ProgramFormConfigPanel({ onClose }: Props) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [config, setConfig] = useState<ProgramFormConfig>(DEFAULT_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allConfigs, setAllConfigs] = useState<Record<string, ProgramFormConfig>>({});

  // Load programs from frontend Supabase
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const supabase = getSupabaseClient();
        const { data, error: fetchErr } = await supabase
          .from('programs')
          .select('id, title, description, status')
          .order('title');

        if (fetchErr) {
          console.error('[FormConfig] Error loading programs:', fetchErr);
          setError('Failed to load programs');
        } else {
          setPrograms(data || []);
        }

        // Also load all configs to show status badges
        const configs = await programsAPI.getAllProgramFormConfigs();
        setAllConfigs(configs as Record<string, ProgramFormConfig>);
      } catch (err: any) {
        console.error('[FormConfig] Error:', err);
        setError(err.message);
      } finally {
        setLoadingPrograms(false);
      }
    };
    loadPrograms();
  }, []);

  // Load config when a program is selected
  useEffect(() => {
    if (!selectedProgramId) return;
    const loadConfig = async () => {
      setLoadingConfig(true);
      setError('');
      try {
        const cfg = await programsAPI.getProgramFormConfig(selectedProgramId);
        const merged = { ...DEFAULT_CONFIG, ...cfg };
        setConfig(merged as ProgramFormConfig);
      } catch (err: any) {
        console.error('[FormConfig] Error loading config:', err);
        setError('Failed to load config');
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, [selectedProgramId]);

  const handleToggle = useCallback((key: keyof ProgramFormConfig) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: !prev[key] };

      // If master toggle is turned off, don't change sub-features
      // (they stay remembered for when master is turned back on)

      // If time_gate is turned off, also turn off content_lock
      if (key === 'time_gate_enabled' && !updated.time_gate_enabled) {
        updated.content_lock_after_gate = false;
      }

      return updated;
    });
    setSaved(false);
  }, []);

  const handleTimeGateHourChange = useCallback((hour: number) => {
    setConfig(prev => ({ ...prev, time_gate_hour: hour }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedProgramId) return;
    setSaving(true);
    setError('');
    try {
      await programsAPI.saveProgramFormConfig(selectedProgramId, config);
      setSaved(true);
      // Update the allConfigs cache
      setAllConfigs(prev => ({ ...prev, [selectedProgramId]: config }));
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('[FormConfig] Save error:', err);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, [selectedProgramId, config]);

  const filteredPrograms = programs.filter(p =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: tc.bgCard, boxShadow: `0 25px 60px ${tc.shadowColor}` }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${tc.primaryGradientFrom}, ${tc.primaryGradientTo})` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Settings className="w-5 h-5" style={{ color: tc.textOnPrimary }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: tc.textOnPrimary }}>Program Form Configuration</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Configure session check-in features per program</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <X className="w-4 h-4" style={{ color: tc.textOnPrimary }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Program Selector */}
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${tc.border}` }}>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: tc.textMuted }}>Select Program</label>

            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-4 justify-center" style={{ color: tc.textMuted }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Loading programs...
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tc.textMuted }} />
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: tc.bgSubtle, border: `1px solid ${tc.border}`, color: tc.textPrimary }}
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-xl space-y-1">
                  {filteredPrograms.map(prog => {
                    const progConfig = allConfigs[prog.id];
                    const isSessionEnabled = progConfig?.session_checkin_enabled;
                    const isSelected = selectedProgramId === prog.id;
                    return (
                      <button
                        key={prog.id}
                        onClick={() => setSelectedProgramId(prog.id)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2"
                        style={{
                          backgroundColor: isSelected ? tc.primaryLight : tc.bgSubtle,
                          border: isSelected ? `2px solid ${tc.primary}` : `1px solid transparent`,
                          color: tc.textPrimary,
                        }}
                      >
                        <span className="flex-1 font-medium truncate">{prog.title}</span>
                        {isSessionEnabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: `${tc.success}15`, color: tc.success }}>
                            SESSION
                          </span>
                        )}
                        {isSessionEnabled === false && progConfig && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: tc.bgSubtle, color: tc.textMuted }}>
                            STANDARD
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredPrograms.length === 0 && (
                    <p className="text-xs text-center py-3" style={{ color: tc.textMuted }}>No programs found</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Config Panel */}
          {selectedProgramId && (
            <div className="px-6 py-4 space-y-3">
              {loadingConfig ? (
                <div className="flex items-center gap-2 py-8 justify-center" style={{ color: tc.textMuted }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading configuration...
                </div>
              ) : (
                <>
                  {/* Selected program name */}
                  <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: tc.bgSubtle, border: `1px solid ${tc.border}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: tc.primaryLight }}>
                      {selectedProgram?.title?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: tc.textPrimary }}>{selectedProgram?.title}</p>
                      <p className="text-[11px]" style={{ color: tc.textMuted }}>
                        {config.session_checkin_enabled ? 'Session Check-In Mode' : 'Standard Form Mode'}
                      </p>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  {FEATURE_META.map(feature => {
                    const isEnabled = config[feature.key] as boolean;
                    const IconComp = feature.icon;

                    // Check if this feature's dependency is met
                    const dependencyMet = !feature.dependsOn || (config[feature.dependsOn] as boolean);
                    const isDisabled = !dependencyMet;
                    const isMasterToggle = feature.key === 'session_checkin_enabled';

                    return (
                      <div key={feature.key}>
                        <div
                          className="rounded-xl p-3 transition-all"
                          style={{
                            backgroundColor: isMasterToggle
                              ? (isEnabled ? `${feature.color}10` : tc.bgSubtle)
                              : tc.bgSubtle,
                            border: `1px solid ${isMasterToggle && isEnabled ? `${feature.color}30` : tc.border}`,
                            opacity: isDisabled ? 0.45 : 1,
                            marginLeft: isMasterToggle ? 0 : 16,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${feature.color}15` }}>
                              <IconComp className="w-4 h-4" style={{ color: feature.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: tc.textPrimary }}>{feature.label}</span>
                                {isMasterToggle && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{
                                    backgroundColor: isEnabled ? `${tc.success}15` : `${tc.danger}15`,
                                    color: isEnabled ? tc.success : tc.danger,
                                  }}>
                                    {isEnabled ? 'ON' : 'OFF'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: tc.textSecondary }}>
                                {feature.description}
                              </p>
                              {/* Time gate hour selector */}
                              {feature.key === 'time_gate_enabled' && isEnabled && !isDisabled && (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[11px] font-semibold" style={{ color: tc.textMuted }}>Gate hour (EAT):</span>
                                  <select
                                    value={config.time_gate_hour}
                                    onChange={(e) => handleTimeGateHourChange(parseInt(e.target.value))}
                                    className="px-2 py-1 rounded-lg text-xs font-bold focus:outline-none focus:ring-2"
                                    style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}`, color: tc.textPrimary }}
                                  >
                                    {Array.from({ length: 13 }, (_, i) => i + 12).map(h => (
                                      <option key={h} value={h}>{h}:00 ({h > 12 ? `${h - 12} PM` : '12 PM'})</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => !isDisabled && handleToggle(feature.key)}
                              disabled={isDisabled}
                              className="shrink-0 mt-0.5 transition-all"
                              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                            >
                              {isEnabled ? (
                                <ToggleRight className="w-8 h-8" style={{ color: feature.color }} />
                              ) : (
                                <ToggleLeft className="w-8 h-8" style={{ color: tc.textMuted }} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Linked Check-In Program — shown immediately after the master toggle */}
                        {isMasterToggle && isEnabled && (
                          <div
                            className="rounded-xl p-3 transition-all mt-3"
                            style={{
                              backgroundColor: config.linked_checkin_program_id ? '#7c3aed10' : tc.bgSubtle,
                              border: `1px solid ${config.linked_checkin_program_id ? '#7c3aed30' : tc.border}`,
                              marginLeft: 16,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#7c3aed15' }}>
                                <Link2 className="w-4 h-4" style={{ color: '#7c3aed' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold" style={{ color: tc.textPrimary }}>Linked Check-In Program (Checkout Mode)</span>
                                  {config.linked_checkin_program_id && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}>
                                      LINKED
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: tc.textSecondary }}>
                                  Link this checkout program to a check-in program. MSISDNs from today's check-in will auto-populate in the checkout form, with a GA column next to each number.
                                </p>
                                <div className="mt-2">
                                  <select
                                    value={config.linked_checkin_program_id || ''}
                                    onChange={(e) => {
                                      setConfig(prev => ({ ...prev, linked_checkin_program_id: e.target.value || '' }));
                                      setSaved(false);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                                    style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}`, color: tc.textPrimary }}
                                  >
                                    <option value="">-- No linked program (standalone) --</option>
                                    {programs
                                      .filter(p => p.id !== selectedProgramId)
                                      .map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                      ))
                                    }
                                  </select>
                                </div>
                                {config.linked_checkin_program_id && (
                                  <div className="mt-2 rounded-lg p-2" style={{ backgroundColor: '#7c3aed10', border: '1px solid #7c3aed20' }}>
                                    <p className="text-[11px] font-semibold" style={{ color: '#7c3aed' }}>Checkout Mode Active</p>
                                    <ul className="text-[11px] mt-1 space-y-0.5 ml-3" style={{ color: tc.textSecondary }}>
                                      <li>- MSISDNs from today's check-in auto-populate</li>
                                      <li>- GA column appears next to each MSISDN</li>
                                      <li>- Users can add new MSISDNs + GAs manually</li>
                                      <li>- No time gate needed for checkout</li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Info box when session mode is off */}
                  {!config.session_checkin_enabled && (
                    <div className="rounded-xl p-3 mt-2" style={{ backgroundColor: tc.warningLight, border: `1px solid ${tc.warning}30` }}>
                      <p className="text-xs font-semibold" style={{ color: tc.textPrimary }}>Standard Form Mode</p>
                      <p className="text-[11px] mt-0.5" style={{ color: tc.textSecondary }}>
                        This program uses a standard one-shot form. Turn on "Session-Based Check-In" above to enable the day-long session workflow with sites, MSISDNs, GA targets, and time-gated GA entry.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!selectedProgramId && !loadingPrograms && (
            <div className="px-6 py-12 text-center">
              <Settings className="w-10 h-10 mx-auto mb-3" style={{ color: tc.textMuted, opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ color: tc.textMuted }}>Select a program above to configure its form features</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedProgramId && !loadingConfig && (
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${tc.border}`, backgroundColor: tc.bgSubtle }}>
            {error && (
              <div className="flex items-center gap-1 text-xs" style={{ color: tc.danger }}>
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: tc.success }}>
                <Check className="w-3.5 h-3.5" /> Configuration saved
              </div>
            )}
            {!error && !saved && <div />}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ color: tc.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${tc.primaryGradientFrom}, ${tc.primaryGradientTo})`, color: tc.textOnPrimary, boxShadow: `0 4px 14px ${tc.primary}30` }}
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Configuration</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}