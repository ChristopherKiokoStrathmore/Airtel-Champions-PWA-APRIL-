import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

type ComparisonType = 'se' | 'zsm' | 'zone';

interface AnalyticsData {
  totalPoints: number;
  totalSubmissions: number;
  programBreakdown: {
    program: string;
    count: number;
    points: number;
  }[];
  avgPointsPerSubmission: number;
  topPerformer?: string;
  seCount?: number;
}

export function AdvancedCompare({ onClose, allSEs }: { onClose: () => void; allSEs: any[] }) {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('se');
  const [entity1, setEntity1] = useState<any>(null);
  const [entity2, setEntity2] = useState<any>(null);
  const [analytics1, setAnalytics1] = useState<AnalyticsData | null>(null);
  const [analytics2, setAnalytics2] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [selectedZSMFilter, setSelectedZSMFilter] = useState('');
  
  // Search states
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');

  // Extract unique zones and ZSMs
  const zones = [...new Set(allSEs.map(se => se.zone).filter(Boolean))].sort();
  const zsms = [...new Set(allSEs.map(se => se.zsm).filter(Boolean))].sort();

  // Get filtered entities based on comparison type and filters
  const getFilteredEntities = () => {
    let entities: any[] = [];
    
    switch (comparisonType) {
      case 'se':
        entities = allSEs;
        // Apply ZSM filter for SE comparison
        if (selectedZSMFilter) {
          entities = entities.filter(se => se.zsm === selectedZSMFilter);
        }
        break;
      case 'zsm':
        entities = zsms.map(zsm => {
          // Get zone for this ZSM
          const seWithThisZSM = allSEs.find(se => se.zsm === zsm);
          return { 
            name: zsm, 
            type: 'zsm',
            zone: seWithThisZSM?.zone || 'Unknown'
          };
        });
        // Apply Zone filter for ZSM comparison
        if (selectedZoneFilter) {
          entities = entities.filter(zsmEntity => zsmEntity.zone === selectedZoneFilter);
        }
        break;
      case 'zone':
        entities = zones.map(zone => ({ name: zone, type: 'zone' }));
        break;
      default:
        return [];
    }

    return entities;
  };

  const entities = getFilteredEntities();

  // Get available ZSMs for filter (all ZSMs)
  const availableZSMsForFilter = zsms;
  
  // Get available Zones for filter (all zones)
  const availableZonesForFilter = zones;

  // Reset filters when comparison type changes
  useEffect(() => {
    setSelectedZoneFilter('');
    setSelectedZSMFilter('');
    setSearchQuery1('');
    setSearchQuery2('');
  }, [comparisonType]);

  // Fetch analytics for selected entities
  useEffect(() => {
    if (entity1 && entity2) {
      fetchAnalytics();
    }
  }, [entity1, entity2, comparisonType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch all programs once to map program_id -> title
      const { data: programsData } = await supabase.from('programs').select('id, title');
      const programNameMap: { [id: string]: string } = {};
      (programsData || []).forEach((p: any) => { programNameMap[p.id] = p.title; });

      const data1 = await getAnalyticsForEntity(entity1, programNameMap);
      const data2 = await getAnalyticsForEntity(entity2, programNameMap);
      setAnalytics1(data1);
      setAnalytics2(data2);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const getAnalyticsForEntity = async (entity: any, programNameMap: { [id: string]: string }): Promise<AnalyticsData> => {
    let submissions: any[] = [];
    let totalPoints = 0;
    let seCount = 0;
    let topPerformer = '';

    // Helper: fetch submissions in batches to avoid timeout on large IN lists
    // Only select the columns we need (program_id, points_awarded) to keep queries fast
    const fetchSubmissionsBatched = async (userIds: string[]): Promise<any[]> => {
      const BATCH_SIZE = 50;
      const results: any[] = [];
      for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('submissions')
          .select('program_id, points_awarded')
          .in('user_id', batch);
        if (error) {
          console.error('[Compare] Error fetching submissions batch:', error);
        } else {
          results.push(...(data || []));
        }
      }
      return results;
    };

    if (comparisonType === 'se') {
      // For SE: get their submissions using user_id (the entity.id is the UUID)
      const { data, error } = await supabase
        .from('submissions')
        .select('program_id, points_awarded')
        .eq('user_id', entity.id);
      
      if (error) {
        console.error('[Compare] Error fetching submissions for SE:', error);
        console.error('[Compare] SE details:', { id: entity.id, employee_id: entity.employee_id, name: entity.full_name });
        submissions = [];
      } else {
        submissions = data || [];
        console.log(`[Compare] Found ${submissions.length} submissions for ${entity.full_name}`);
      }
      totalPoints = entity.total_points || 0;
    } else if (comparisonType === 'zsm') {
      // For ZSM: get all SEs under this ZSM and their submissions
      const sesUnderZSM = allSEs.filter(se => se.zsm === entity.name);
      seCount = sesUnderZSM.length;
      totalPoints = sesUnderZSM.reduce((sum, se) => sum + (se.total_points || 0), 0);
      
      // Get top performer
      const topSE = [...sesUnderZSM].sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];
      topPerformer = topSE?.full_name || '';

      // Get all submissions from SEs under this ZSM (batched)
      const employeeIds = sesUnderZSM.map(se => se.id);
      if (employeeIds.length > 0) {
        submissions = await fetchSubmissionsBatched(employeeIds);
        console.log(`[Compare] Found ${submissions.length} submissions for ZSM ${entity.name}`);
      }
    } else if (comparisonType === 'zone') {
      // For Zone: get all SEs in this zone and their submissions
      const sesInZone = allSEs.filter(se => se.zone === entity.name);
      seCount = sesInZone.length;
      totalPoints = sesInZone.reduce((sum, se) => sum + (se.total_points || 0), 0);
      
      // Get top performer
      const topSE = [...sesInZone].sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];
      topPerformer = topSE?.full_name || '';

      // Get all submissions from SEs in this zone (batched)
      const employeeIds = sesInZone.map(se => se.id);
      if (employeeIds.length > 0) {
        submissions = await fetchSubmissionsBatched(employeeIds);
        console.log(`[Compare] Found ${submissions.length} submissions for Zone ${entity.name}`);
      }
    }

    // Calculate program breakdown
    const programMap: { [key: string]: { count: number; points: number } } = {};
    submissions.forEach(sub => {
      const program = (sub.program_id && programNameMap[sub.program_id]) || 'Unknown';
      if (!programMap[program]) {
        programMap[program] = { count: 0, points: 0 };
      }
      programMap[program].count++;
      programMap[program].points += sub.points_awarded || 0;
    });

    const programBreakdown = Object.entries(programMap).map(([program, data]) => ({
      program,
      count: data.count,
      points: data.points,
    })).sort((a, b) => b.points - a.points);

    return {
      totalPoints,
      totalSubmissions: submissions.length,
      programBreakdown,
      avgPointsPerSubmission: submissions.length > 0 ? totalPoints / submissions.length : 0,
      topPerformer: topPerformer || undefined,
      seCount: seCount > 0 ? seCount : undefined,
    };
  };

  const resetSelection = () => {
    setEntity1(null);
    setEntity2(null);
    setAnalytics1(null);
    setAnalytics2(null);
    setSearchQuery1('');
    setSearchQuery2('');
  };

  const handleTypeChange = (type: ComparisonType) => {
    setComparisonType(type);
    resetSelection();
  };

  const getEntityDisplay = (entity: any) => {
    if (comparisonType === 'se') {
      return {
        name: entity.full_name,
        subtitle: `${entity.zone} • ${entity.zsm}`,
        badge: `#${entity.rank}`,
      };
    } else if (comparisonType === 'zsm') {
      return {
        name: entity.name,
        subtitle: entity.zone || 'ZSM',
        badge: null,
      };
    } else {
      return {
        name: entity.name,
        subtitle: 'Zone',
        badge: null,
      };
    }
  };

  // Filter entities based on search
  const getSearchFilteredEntities = (forSlot: 1 | 2) => {
    const searchQuery = forSlot === 1 ? searchQuery1 : searchQuery2;
    if (!searchQuery) return entities;
    
    return entities.filter(entity => {
      const display = getEntityDisplay(entity);
      return display.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const renderAnalyticsCard = (analytics: AnalyticsData, entity: any, color: string) => {
    const display = getEntityDisplay(entity);
    
    return (
      <div className={`${color} rounded-lg p-6 border-2`}>
        <div className="text-center mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3 ${
            color.includes('blue') ? 'bg-blue-600' : 'bg-green-600'
          }`}>
            {display.name.substring(0, 1)}
          </div>
          <h4 className="font-bold text-lg">{display.name}</h4>
          <p className="text-sm text-gray-600">{display.subtitle}</p>
          {display.badge && <p className="text-sm font-semibold text-blue-600 mt-1">{display.badge}</p>}
        </div>

        {/* Key Metrics */}
        <div className="space-y-3 mb-4">
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Points</p>
            <p className="text-2xl font-bold text-blue-600">{analytics.totalPoints.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Submissions</p>
            <p className="text-xl font-bold">{analytics.totalSubmissions}</p>
          </div>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Avg Points/Submission</p>
            <p className="text-xl font-bold">{analytics.avgPointsPerSubmission.toFixed(1)}</p>
          </div>
          {analytics.seCount !== undefined && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Sales Executives</p>
              <p className="text-xl font-bold">{analytics.seCount}</p>
            </div>
          )}
          {analytics.topPerformer && (
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Top Performer</p>
              <p className="font-semibold text-sm">🏆 {analytics.topPerformer}</p>
            </div>
          )}
        </div>

        {/* Program Breakdown */}
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2 font-semibold">Program Breakdown</p>
          <div className="space-y-2">
            {analytics.programBreakdown.slice(0, 5).map((prog, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium text-xs truncate">{prog.program}</p>
                  <div className="bg-gray-200 h-1.5 rounded-full mt-1">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${(prog.points / analytics.totalPoints) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <p className="font-bold text-xs">{prog.count}</p>
                  <p className="text-xs text-gray-500">{prog.points} pts</p>
                </div>
              </div>
            ))}
            {analytics.programBreakdown.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">No submissions yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWinnerAnalysis = () => {
    if (!analytics1 || !analytics2) return null;

    const pointsWinner = analytics1.totalPoints > analytics2.totalPoints ? 1 : 2;
    const submissionsWinner = analytics1.totalSubmissions > analytics2.totalSubmissions ? 1 : 2;
    const efficiencyWinner = analytics1.avgPointsPerSubmission > analytics2.avgPointsPerSubmission ? 1 : 2;

    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <h4 className="text-xl font-bold mb-4 text-center">📊 Head-to-Head Analysis</h4>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Most Points */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Most Points</p>
            <div className={`p-4 rounded-lg ${pointsWinner === 1 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-green-100 border-2 border-green-500'}`}>
              <p className="font-bold text-sm">{pointsWinner === 1 ? getEntityDisplay(entity1).name.split(' ')[0] : getEntityDisplay(entity2).name.split(' ')[0]}</p>
              <p className="text-2xl">🏆</p>
            </div>
          </div>

          {/* Point Difference */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Point Gap</p>
            <div className="p-4 rounded-lg bg-white">
              <p className="text-2xl font-bold text-purple-600">{Math.abs(analytics1.totalPoints - analytics2.totalPoints).toLocaleString()}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>

          {/* Most Efficient */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Most Efficient</p>
            <div className={`p-4 rounded-lg ${efficiencyWinner === 1 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-green-100 border-2 border-green-500'}`}>
              <p className="font-bold text-sm">{efficiencyWinner === 1 ? getEntityDisplay(entity1).name.split(' ')[0] : getEntityDisplay(entity2).name.split(' ')[0]}</p>
              <p className="text-2xl">⭐</p>
            </div>
          </div>
        </div>

        {/* Submission Difference */}
        <div className="text-center p-4 bg-white rounded-lg mt-4">
          <p className="text-sm text-gray-600 mb-1">Submission Difference</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.abs(analytics1.totalSubmissions - analytics2.totalSubmissions)} submissions
          </p>
        </div>
      </div>
    );
  };

  // Render selection slot (inspired by screenshot)
  const renderSelectionSlot = (slot: 1 | 2) => {
    const entity = slot === 1 ? entity1 : entity2;
    const setEntity = slot === 1 ? setEntity1 : setEntity2;
    const searchQuery = slot === 1 ? searchQuery1 : searchQuery2;
    const setSearchQuery = slot === 1 ? setSearchQuery1 : setSearchQuery2;
    const bgColor = slot === 1 ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500';
    const textColor = slot === 1 ? 'text-blue-600' : 'text-green-600';
    const filteredEntities = getSearchFilteredEntities(slot);

    return (
      <div className="flex-1">
        <div className={`p-4 rounded-lg border-2 ${entity ? bgColor : 'bg-gray-50 border-gray-300 border-dashed'} mb-3`}>
          {entity ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${textColor}`}>
                  {slot === 1 ? 'First' : 'Second'} {comparisonType.toUpperCase()}
                </span>
                <button
                  onClick={() => setEntity(null)}
                  className={`${textColor} hover:opacity-70`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h4 className="font-semibold">{getEntityDisplay(entity).name}</h4>
              <p className="text-xs text-gray-600 mt-1">{getEntityDisplay(entity).subtitle}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                {slot === 1 ? 'First' : 'Second'} {comparisonType.toUpperCase()}
              </p>
            </div>
          )}
        </div>

        {/* Search Input - Inspired by screenshot */}
        {!entity && (
          <>
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Entity List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredEntities.length > 0 ? (
                filteredEntities.map((ent, idx) => {
                  const isOtherSelected = (slot === 1 ? entity2 : entity1) === ent;
                  const display = getEntityDisplay(ent);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (!isOtherSelected) {
                          setEntity(ent);
                          setSearchQuery('');
                        }
                      }}
                      disabled={isOtherSelected}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        isOtherSelected 
                          ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs mr-2">
                          {display.name.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{display.name}</h4>
                          <p className="text-xs text-gray-600 truncate">{display.subtitle}</p>
                        </div>
                        {display.badge && (
                          <div className="text-right ml-2">
                            <p className="text-sm font-bold text-blue-600">{display.badge}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No results found</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl">Advanced Analytics Comparison</h3>
              <p className="text-sm text-blue-100 mt-1">Compare performance across Zones, ZSMs, or Individual SEs</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Comparison Type Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleTypeChange('se')}
              className={`px-4 py-2 rounded-lg transition-all ${
                comparisonType === 'se' 
                  ? 'bg-white text-blue-600 font-semibold' 
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              SE vs SE
            </button>
            <button
              onClick={() => handleTypeChange('zsm')}
              className={`px-4 py-2 rounded-lg transition-all ${
                comparisonType === 'zsm' 
                  ? 'bg-white text-blue-600 font-semibold' 
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              ZSM vs ZSM
            </button>
            <button
              onClick={() => handleTypeChange('zone')}
              className={`px-4 py-2 rounded-lg transition-all ${
                comparisonType === 'zone' 
                  ? 'bg-white text-blue-600 font-semibold' 
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              Zone vs Zone
            </button>
          </div>

          {/* Filter Controls */}
          {comparisonType === 'se' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={selectedZSMFilter}
                  onChange={(e) => {
                    setSelectedZSMFilter(e.target.value);
                    resetSelection();
                  }}
                  className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                >
                  <option value="">All ZSMs</option>
                  {availableZSMsForFilter.map(zsm => (
                    <option key={zsm} value={zsm}>{zsm}</option>
                  ))}
                </select>
              </div>
              {selectedZSMFilter && (
                <button
                  onClick={() => {
                    setSelectedZSMFilter('');
                    resetSelection();
                  }}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {comparisonType === 'zsm' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={selectedZoneFilter}
                  onChange={(e) => {
                    setSelectedZoneFilter(e.target.value);
                    resetSelection();
                  }}
                  className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
                >
                  <option value="">All Zones</option>
                  {availableZonesForFilter.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
              {selectedZoneFilter && (
                <button
                  onClick={() => {
                    setSelectedZoneFilter('');
                    resetSelection();
                  }}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!entity1 || !entity2 ? (
            <div>
              {/* Selection Interface - Inspired by Screenshot */}
              <div className="flex gap-6 mb-6">
                {renderSelectionSlot(1)}
                {renderSelectionSlot(2)}
              </div>

              {/* Helper Text */}
              <div className="text-center text-sm text-gray-500">
                {!entity1 && !entity2 
                  ? `Select two ${comparisonType === 'se' ? 'Sales Executives' : comparisonType === 'zsm' ? 'ZSMs' : 'Zones'} to compare` 
                  : entity1 && !entity2 
                  ? 'Now select the second one to compare' 
                  : 'Now select the first one to compare'}
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          ) : (
            <div>
              <button
                onClick={resetSelection}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Change selection
              </button>
              
              {/* Side-by-Side Analytics Cards */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {analytics1 && renderAnalyticsCard(analytics1, entity1, 'bg-blue-50 border-blue-500')}
                {analytics2 && renderAnalyticsCard(analytics2, entity2, 'bg-green-50 border-green-500')}
              </div>

              {/* Winner Analysis */}
              {renderWinnerAnalysis()}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}