// Day Plan Card Component - Simplified for performance
import React from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface Site {
  site_id: string;
  site_name: string;
  order: number;
}

interface SitewiseData {
  'SITE ID': string;
  'SITE': string;
  'TOWN CATEGORY': string;
  'CLUSTER (691)': string;
  'TSE': string;
  'ZSM': string;
  'ZBM': string;
  'ZONE': string;
}

interface DailyPlan {
  day: string;
  date: string;
  day_index: number;
  is_rest_day: boolean;
  sites: Site[];
}

interface DayPlanCardProps {
  dayPlan: DailyPlan;
  dayIndex: number;
  sites: SitewiseData[];
  restDay: number;
  onRestDayChange: (dayIndex: number) => void;
  onAddSite: (dayIndex: number) => void;
  onRemoveSite: (dayIndex: number, siteIndex: number) => void;
  onUpdateSite: (dayIndex: number, siteIndex: number, newSiteId: string, newSiteName: string) => void;
  duplicateSites: Set<string>;
}

export function DayPlanCard({ 
  dayPlan, 
  dayIndex, 
  sites, 
  restDay,
  onRestDayChange,
  onAddSite, 
  onRemoveSite, 
  onUpdateSite,
  duplicateSites
}: DayPlanCardProps) {
  
  // Safety check
  if (!dayPlan) {
    console.error('[DayPlanCard] dayPlan is undefined for dayIndex:', dayIndex);
    return null;
  }

  const isRestDay = dayPlan.is_rest_day || dayIndex === restDay;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-2 ${isRestDay ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          📅 {dayPlan.day}, {dayPlan.date}
        </h3>
        
        <div className="flex items-center gap-3">
          {/* Rest Day Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRestDay}
              onChange={() => onRestDayChange(dayIndex)}
              className="w-5 h-5 cursor-pointer"
            />
            <span className="font-semibold text-gray-700">🛏️ Rest Day</span>
          </label>
        </div>
      </div>

      {isRestDay ? (
        <p className="text-gray-500 italic">No routes planned - rest day</p>
      ) : (
        <>
          <div className="space-y-4">
            {dayPlan.sites.map((site, siteIdx) => {
              const isDuplicate = duplicateSites.has(site.site_id);
              
              return (
                <div 
                  key={`${dayPlan.day_index}-site-${siteIdx}`} 
                  className={`border-2 rounded-lg p-4 ${isDuplicate ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      Site {siteIdx + 1}
                      {isDuplicate && (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Duplicate!
                        </span>
                      )}
                    </h4>
                    <button
                      onClick={() => onRemoveSite(dayIndex, siteIdx)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Remove site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📍 Site Name *
                      </label>
                      <select
                        value={site.site_id || ''}
                        onChange={(e) => {
                          const selectedSite = sites.find(s => s['SITE ID'] === e.target.value);
                          if (selectedSite) {
                            onUpdateSite(dayIndex, siteIdx, selectedSite['SITE ID'], selectedSite['SITE']);
                          }
                        }}
                        className={`w-full p-3 border-2 rounded-lg focus:outline-none ${
                          isDuplicate 
                            ? 'border-red-500 focus:border-red-600 bg-red-50' 
                            : 'border-gray-300 focus:border-red-500'
                        }`}
                      >
                        <option value="">-- Select Site --</option>
                        {sites.map((s, idx) => (
                          <option key={`site-option-${dayIndex}-${siteIdx}-${idx}`} value={s['SITE ID']}>
                            {s['SITE']} ({s['SITE ID']}) - {s['ZONE']}
                          </option>
                        ))}
                      </select>
                      
                      {site.site_name && !isDuplicate && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                          ✅ Selected: {site.site_name}
                        </div>
                      )}
                      
                      {isDuplicate && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800 font-semibold">
                          ⚠️ This site is selected multiple times this week. Please choose a different site.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onAddSite(dayIndex)}
            className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:text-red-600 transition-colors w-full justify-center"
          >
            <Plus className="w-4 h-4" />
            Add Site for {dayPlan.day}
          </button>
        </>
      )}
    </div>
  );
}
