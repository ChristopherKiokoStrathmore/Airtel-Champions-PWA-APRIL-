// Site Search Dropdown - Searchable site selector for Van Calendar
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

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

interface SiteSearchDropdownProps {
  value: string;
  onChange: (siteId: string, siteName: string) => void;
  sites: SitewiseData[];
  loadingSites: boolean;
  placeholder?: string;
}

export function SiteSearchDropdown({ 
  value, 
  onChange, 
  sites, 
  loadingSites,
  placeholder = 'Search for a site...'
}: SiteSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update display value when value prop changes
  useEffect(() => {
    if (value) {
      const site = sites.find(s => s['SITE ID'] === value);
      setDisplayValue(site?.['SITE'] || value);
    } else {
      setDisplayValue('');
    }
  }, [value, sites]);

  // Filter sites based on search query
  const filteredSites = sites.filter(site => {
    const search = searchQuery.toLowerCase();
    return (
      site['SITE']?.toLowerCase().includes(search) ||
      site['SITE ID']?.toLowerCase().includes(search) ||
      site['ZONE']?.toLowerCase().includes(search) ||
      site['ZSM']?.toLowerCase().includes(search) ||
      site['CLUSTER (691)']?.toLowerCase().includes(search)
    );
  });

  // Close dropdown when clicking outside
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

  const handleSelect = (site: SitewiseData) => {
    console.log('[Van Calendar Site] ✅ Site selected:', { 
      siteId: site['SITE ID'], 
      siteName: site['SITE'],
      zone: site['ZONE']
    });
    onChange(site['SITE ID'], site['SITE']);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
          placeholder={loadingSites ? 'Loading sites...' : placeholder}
          value={isOpen ? searchQuery : displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery('');
          }}
          disabled={loadingSites}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Dropdown Results */}
      {isOpen && !loadingSites && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Container */}
          <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-blue-500 rounded-lg shadow-2xl max-h-[320px] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-blue-600 px-4 py-3 border-b-2 border-blue-700 z-[10000] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-white font-bold text-sm tracking-wide">SELECT SITE</span>
                <span className="text-blue-200 text-xs font-medium">
                  ({filteredSites.length})
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-sm px-6 py-2 rounded-lg border-2 border-white/30 transition-all shadow-lg"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  minWidth: '80px'
                }}
              >
                DONE
              </button>
            </div>
            
            {/* Scrollable Options List */}
            <div 
              className="overflow-y-auto"
              style={{ 
                maxHeight: '276px',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {filteredSites.map((site, index) => (
                <button
                  key={`site-${site['SITE ID']}-${index}`}
                  type="button"
                  onClick={() => handleSelect(site)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(site);
                  }}
                  className="w-full text-left px-4 py-4 border-b border-gray-200 last:border-b-0 transition-all hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '56px'
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900">{site['SITE']}</span>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">ID: {site['SITE ID']}</span>
                      <span className="bg-blue-100 px-2 py-0.5 rounded">Zone: {site['ZONE']}</span>
                      {site['CLUSTER (691)'] && (
                        <span className="bg-green-100 px-2 py-0.5 rounded">Cluster: {site['CLUSTER (691)']}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Empty State */}
              {filteredSites.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">No sites found</div>
                  <div className="text-xs text-gray-500">Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Selected Site Metadata Display */}
      {value && !isOpen && sites.length > 0 && (() => {
        const selectedSite = sites.find(s => s['SITE ID'] === value);
        if (!selectedSite) return null;
        
        return (
          <div className="mt-2 bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span className="text-blue-600">ℹ️</span>
              <span>Site Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600 block">SITE ID:</span>
                <div className="font-semibold text-gray-900">{selectedSite['SITE ID']}</div>
              </div>
              <div>
                <span className="text-gray-600 block">ZONE:</span>
                <div className="font-semibold text-gray-900">{selectedSite['ZONE']}</div>
              </div>
              <div>
                <span className="text-gray-600 block">TOWN CATEGORY:</span>
                <div className="font-semibold text-gray-900">{selectedSite['TOWN CATEGORY']}</div>
              </div>
              <div>
                <span className="text-gray-600 block">CLUSTER:</span>
                <div className="font-semibold text-gray-900">{selectedSite['CLUSTER (691)']}</div>
              </div>
              {selectedSite['ZSM'] && (
                <div className="col-span-2">
                  <span className="text-gray-600 block">ZSM:</span>
                  <div className="font-semibold text-gray-900">{selectedSite['ZSM']}</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
