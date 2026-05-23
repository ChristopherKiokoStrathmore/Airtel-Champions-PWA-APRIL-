import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface DirectorReportingStructureProps {
  userName: string;
  userInitial: string;
  isOnLeave: boolean;
  onLeaveToggle: () => void;
}

export function DirectorReportingStructure({ 
  userName, 
  userInitial, 
  isOnLeave,
  onLeaveToggle 
}: DirectorReportingStructureProps) {
  const [showZBMList, setShowZBMList] = useState(false);
  const [showZSMList, setShowZSMList] = useState(false);
  const [showSEList, setShowSEList] = useState(false);
  const [zbms, setZBMs] = useState<any[]>([]);
  const [allZSMs, setAllZSMs] = useState<any[]>([]);
  const [allSEs, setAllSEs] = useState<any[]>([]);
  const [filteredZSMs, setFilteredZSMs] = useState<any[]>([]);
  const [filteredSEs, setFilteredSEs] = useState<any[]>([]);
  const [zsmFilter, setZsmFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [seZsmFilter, setSEZsmFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Load ZBMs
  const loadZBMs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'zonal_business_manager')
        .order('full_name');
      
      if (error) throw error;
      setZBMs(data || []);
    } catch (error) {
      console.error('Error loading ZBMs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load ZSMs
  const loadZSMs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'zonal_sales_manager')
        .order('full_name');
      
      if (error) throw error;
      setAllZSMs(data || []);
      setFilteredZSMs(data || []);
    } catch (error) {
      console.error('Error loading ZSMs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load SEs
  const loadSEs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false });
      
      if (error) throw error;
      setAllSEs(data || []);
      setFilteredSEs(data || []);
    } catch (error) {
      console.error('Error loading SEs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter ZSMs by ZBM
  useEffect(() => {
    if (zsmFilter === 'all') {
      setFilteredZSMs(allZSMs);
    } else {
      setFilteredZSMs(allZSMs.filter(zsm => zsm.zbm === zsmFilter));
    }
  }, [zsmFilter, allZSMs]);

  // Filter SEs by zone and ZSM
  useEffect(() => {
    let filtered = allSEs;
    
    if (zoneFilter !== 'all') {
      filtered = filtered.filter(se => se.region === zoneFilter);
    }
    
    if (seZsmFilter !== 'all') {
      filtered = filtered.filter(se => se.zsm === seZsmFilter);
    }
    
    setFilteredSEs(filtered);
  }, [zoneFilter, seZsmFilter, allSEs]);

  // Get unique values for filters
  const zbmsForFilter = ['all', ...Array.from(new Set(allZSMs.map(zsm => zsm.zbm).filter(Boolean)))];
  const zones = ['all', ...Array.from(new Set(allSEs.map(se => se.region).filter(Boolean)))];
  const zsmsForSEFilter = ['all', ...Array.from(new Set(allSEs.map(se => se.zsm).filter(Boolean)))];

  // Handle contact
  const handleWhatsApp = (phone: string, name: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('254') ? cleanPhone : `254${cleanPhone}`;
      window.open(`https://wa.me/${formattedPhone}`, '_blank');
      console.log(`[Analytics] Director WhatsApp: ${name}`);
    }
  };

  const handleCall = (phone: string, name: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.location.href = `tel:${cleanPhone}`;
      console.log(`[Analytics] Director Call: ${name}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">🏢 Reporting Structure</h4>
        <button
          onClick={onLeaveToggle}
          className={`text-xs px-3 py-1 rounded-full transition-all ${
            isOnLeave ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}
        >
          {isOnLeave ? '🏖️ On Leave' : '✅ Active'}
        </button>
      </div>

      <div className="space-y-3">
        {/* Director - Single Card */}
        <div className={`bg-gradient-to-br from-red-50 to-red-100 border-2 rounded-xl p-4 ${
          isOnLeave ? 'border-orange-300' : 'border-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md relative ${
              isOnLeave ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              {userInitial}
              {isOnLeave && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs">🏖️</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{userName}</p>
              <p className="text-xs text-gray-600">Director • Sales & Distribution {isOnLeave && '(On Leave)'}</p>
            </div>
          </div>
        </div>

        {/* Team Management */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-3">👥 You Manage:</p>
          
          <div className="space-y-2">
            {/* ZBMs - Clickable */}
            <button
              onClick={() => {
                setShowZBMList(!showZBMList);
                if (!showZBMList && zbms.length === 0) loadZBMs();
              }}
              className="w-full bg-purple-50 rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md text-xs font-semibold">
                  ZB
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800">Zonal Business Managers (ZBM)</p>
                  <p className="text-xs text-gray-600">12 ZBMs • Click to view</p>
                </div>
                <svg className={`w-5 h-5 text-purple-600 transition-transform ${showZBMList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* ZBM List */}
            {showZBMList && (
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200 space-y-2 animate-slide-down">
                <p className="text-xs font-semibold text-purple-900 mb-2">📋 All ZBMs ({zbms.length})</p>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : zbms.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto px-1">
                    {zbms.map((zbm) => (
                      <div key={zbm.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-base font-semibold flex-shrink-0">
                          {zbm.full_name?.substring(0, 1) || 'Z'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-900 truncate">{zbm.full_name}</p>
                          <p className="text-sm text-gray-600 truncate">{zbm.region || 'N/A'}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleWhatsApp(zbm.phone_number, zbm.full_name)}
                            className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-xl flex items-center justify-center text-white transition-colors active:scale-95"
                            title="WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCall(zbm.phone_number, zbm.full_name)}
                            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-colors active:scale-95"
                            title="Call"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">No ZBMs found</p>
                )}
              </div>
            )}

            {/* Connector */}
            <div className="flex justify-center">
              <div className="w-0.5 h-4 bg-gray-300"></div>
            </div>

            {/* ZSMs - Clickable */}
            <button
              onClick={() => {
                setShowZSMList(!showZSMList);
                if (!showZSMList && allZSMs.length === 0) loadZSMs();
              }}
              className="w-full bg-blue-50 rounded-xl p-4 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md text-xs font-semibold">
                  ZM
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800">Zonal Sales Managers (ZSM)</p>
                  <p className="text-xs text-gray-600">Managed by ZBMs • Click to view</p>
                </div>
                <svg className={`w-5 h-5 text-blue-600 transition-transform ${showZSMList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* ZSM List with Filter */}
            {showZSMList && (
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 space-y-3 animate-slide-down">
                <p className="text-xs font-semibold text-blue-900 mb-2">📋 All ZSMs ({filteredZSMs.length})</p>
                
                {/* Filter by ZBM */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">🔍 Filter by ZBM:</label>
                  <select
                    value={zsmFilter}
                    onChange={(e) => setZsmFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {zbmsForFilter.map((zbm) => (
                      <option key={zbm} value={zbm}>
                        {zbm === 'all' ? '✨ All ZBMs' : zbm}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ZSM List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : filteredZSMs.length > 0 ? (
                    filteredZSMs.map((zsm) => (
                      <div key={zsm.id} className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {zsm.full_name?.substring(0, 1) || 'Z'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{zsm.full_name}</p>
                          <p className="text-xs text-gray-600">{zsm.region || 'N/A'} • ZBM: {zsm.zbm || 'N/A'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleWhatsApp(zsm.phone_number, zsm.full_name)}
                            className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition-colors"
                            title="WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCall(zsm.phone_number, zsm.full_name)}
                            className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white transition-colors"
                            title="Call"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No ZSMs found with selected filter</p>
                  )}
                </div>
              </div>
            )}

            {/* Connector */}
            <div className="flex justify-center">
              <div className="w-0.5 h-4 bg-gray-300"></div>
            </div>

            {/* SEs - Clickable */}
            <button
              onClick={() => {
                setShowSEList(!showSEList);
                if (!showSEList && allSEs.length === 0) loadSEs();
              }}
              className="w-full bg-green-50 rounded-xl p-4 border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white shadow-md text-xs font-semibold">
                  SE
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800">Sales Executives</p>
                  <p className="text-xs text-gray-600">605 total SEs • Click to view</p>
                </div>
                <svg className={`w-5 h-5 text-green-600 transition-transform ${showSEList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* SE List with Filters */}
            {showSEList && (
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200 space-y-3 animate-slide-down">
                <p className="text-xs font-semibold text-green-900 mb-2">📋 All SEs ({filteredSEs.length})</p>
                
                {/* Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">🌍 Zone:</label>
                    <select
                      value={zoneFilter}
                      onChange={(e) => setZoneFilter(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-green-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {zones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone === 'all' ? '✨ All Zones' : zone}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">👔 ZSM:</label>
                    <select
                      value={seZsmFilter}
                      onChange={(e) => setSEZsmFilter(e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-green-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {zsmsForSEFilter.map((zsm) => (
                        <option key={zsm} value={zsm}>
                          {zsm === 'all' ? '✨ All ZSMs' : zsm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SE List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : filteredSEs.length > 0 ? (
                    filteredSEs.map((se) => (
                      <div key={se.id} className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {se.full_name?.substring(0, 1) || 'S'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{se.full_name}</p>
                          <p className="text-xs text-gray-600">{se.region || 'N/A'} • {se.zsm || 'N/A'} • 🏆 {se.total_points || 0} pts</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleWhatsApp(se.phone_number, se.full_name)}
                            className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center text-white transition-colors"
                            title="WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCall(se.phone_number, se.full_name)}
                            className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center text-white transition-colors"
                            title="Call"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 text-center py-4">No SEs found with selected filters</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}