import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';

interface ClusterRow {
  'CLUSTER (691)': string;
  'COUNTY'?: string;
  'ZONE'?: string;
  'ZBM'?: string;
  'TOWN'?: string;
  'SUB-COUNTY'?: string;
  'POPULATION'?: string | number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function PromoterClusterDropdown({ value, onChange }: Props) {
  const [rows, setRows] = useState<ClusterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadClusters = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('sitewise_lat_long')
          .select('*')
          .range(0, 9999);

        if (error || !data) {
          setRows([]);
          return;
        }

        const seen = new Map<string, ClusterRow>();
        (data as ClusterRow[]).forEach(row => {
          const clusterName = (row['CLUSTER (691)'] || '').toString().trim();
          if (!clusterName || seen.has(clusterName)) return;
          seen.set(clusterName, row);
        });

        setRows([...seen.values()].sort((a, b) => (a['CLUSTER (691)'] || '').localeCompare(b['CLUSTER (691)'] || '')));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadClusters();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedRow = useMemo(() => rows.find(row => row['CLUSTER (691)'] === value), [rows, value]);
  const displayValue = selectedRow?.['CLUSTER (691)'] || value || '';

  const filteredRows = rows.filter(row => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [
      row['CLUSTER (691)'],
      row['COUNTY'],
      row['ZONE'],
      row['ZBM'],
      row['TOWN'],
      row['SUB-COUNTY'],
      row['POPULATION']?.toString(),
    ].some(field => field?.toLowerCase().includes(query));
  });

  const handleSelect = (row: ClusterRow) => {
    onChange(row['CLUSTER (691)']);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="text-[10px] uppercase tracking-wide font-bold text-gray-400">Cluster</label>

      <div className="relative mt-2">
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          value={isOpen ? searchQuery : displayValue}
          onChange={e => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery('');
          }}
          onClick={() => setIsOpen(true)}
          placeholder={loading ? 'Loading clusters...' : 'Search cluster...'}
          className="w-full pl-4 pr-10 py-3 border-2 border-gray-300 rounded-lg text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all active:border-blue-500"
          style={{ fontSize: '16px', WebkitAppearance: 'none', WebkitTapHighlightColor: 'transparent' }}
          disabled={loading}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {isOpen && !loading && (
        <>
          <div className="fixed inset-0 z-[9998] bg-black/30" onClick={() => setIsOpen(false)} />
          <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-[320px] overflow-hidden">
            <div className="sticky top-0 bg-blue-600 px-4 py-3 border-b-2 border-blue-700 z-[10000] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-white font-bold text-sm tracking-wide">SELECT CLUSTER</span>
                <span className="text-blue-200 text-xs font-medium">({filteredRows.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-sm px-6 py-2 rounded-lg border-2 border-white/30 transition-all shadow-lg"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '80px' }}
              >
                DONE
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '276px', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              {filteredRows.map((row, index) => (
                <button
                  key={`${row['CLUSTER (691)']}-${index}`}
                  type="button"
                  onClick={() => handleSelect(row)}
                  onTouchEnd={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(row);
                  }}
                  className="w-full text-left px-4 py-4 border-b border-gray-200 last:border-b-0 transition-all hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '56px' }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900">{row['CLUSTER (691)']}</span>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {row['COUNTY'] && <span className="bg-gray-100 px-2 py-0.5 rounded">County: {row['COUNTY']}</span>}
                      {row['ZONE'] && <span className="bg-blue-100 px-2 py-0.5 rounded">Zone: {row['ZONE']}</span>}
                      {row['ZBM'] && <span className="bg-violet-100 px-2 py-0.5 rounded">ZBM: {row['ZBM']}</span>}
                    </div>
                  </div>
                </button>
              ))}

              {filteredRows.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">No clusters found</div>
                  <div className="text-xs text-gray-500">Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {value && !isOpen && selectedRow && (
        <div className="mt-2 bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
          <div className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span className="text-blue-600">ℹ️</span>
            <span>Cluster Details</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {selectedRow['COUNTY'] && (
              <div>
                <span className="text-gray-600 block">COUNTY:</span>
                <div className="font-semibold text-gray-900">{selectedRow['COUNTY']}</div>
              </div>
            )}
            {selectedRow['ZONE'] && (
              <div>
                <span className="text-gray-600 block">ZONE:</span>
                <div className="font-semibold text-gray-900">{selectedRow['ZONE']}</div>
              </div>
            )}
            {selectedRow['ZBM'] && (
              <div>
                <span className="text-gray-600 block">ZBM:</span>
                <div className="font-semibold text-gray-900">{selectedRow['ZBM']}</div>
              </div>
            )}
            {selectedRow['TOWN'] && (
              <div>
                <span className="text-gray-600 block">TOWN:</span>
                <div className="font-semibold text-gray-900">{selectedRow['TOWN']}</div>
              </div>
            )}
            {selectedRow['SUB-COUNTY'] && (
              <div>
                <span className="text-gray-600 block">SUB-COUNTY:</span>
                <div className="font-semibold text-gray-900">{selectedRow['SUB-COUNTY']}</div>
              </div>
            )}
            {selectedRow['POPULATION'] && (
              <div>
                <span className="text-gray-600 block">POPULATION:</span>
                <div className="font-semibold text-gray-900">{selectedRow['POPULATION']}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}