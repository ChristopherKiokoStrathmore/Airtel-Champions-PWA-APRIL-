import { useState, useEffect } from 'react';
import { getActiveLocations } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface LocationData {
  userId: string;
  lat: number;
  lng: number;
  timestamp: number;
  userDetails: {
    name: string;
    role: string;
    region?: string;
    team?: string;
    avatar?: string;
  };
}

export function LiveLocationTracker({ onUserSelect }: { onUserSelect?: (userId: string, lat: number, lng: number) => void }) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLocations = async () => {
    try {
      const { data, error } = await getActiveLocations();
      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }
      setLocations(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Exception fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 2000); // Refresh every 2s
    return () => clearInterval(interval);
  }, []);

  function getTimeAgo(date: number) {
    const seconds = Math.floor((Date.now() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="font-bold text-gray-900">Live Team Locations</h3>
          <p className="text-xs text-gray-500">
            {locations.length} active users • Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchLocations(); }}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Refresh"
        >
          🔄
        </button>
      </div>
      
      {loading && locations.length === 0 ? (
        <div className="p-8 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : locations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="text-2xl mb-2">📡</p>
          <p>No active users found</p>
          <p className="text-xs mt-1">Users must have the app open to be tracked</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {locations.map((loc) => (
            <div 
              key={loc.userId} 
              className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onUserSelect?.(loc.userId, loc.lat, loc.lng)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white shadow-sm">
                  {loc.userDetails.avatar ? (
                    <img src={loc.userDetails.avatar} alt={loc.userDetails.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    loc.userDetails.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {loc.userDetails.name || 'Unknown User'}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getTimeAgo(loc.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                      loc.userDetails.role === 'sales_executive' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      loc.userDetails.role === 'zonal_sales_manager' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {loc.userDetails.role?.replace(/_/g, ' ') || 'User'}
                    </span>
                    {loc.userDetails.region && (
                      <span className="flex items-center gap-1">
                        • {loc.userDetails.region}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-gray-400 mt-1 flex items-center gap-1">
                    <span>📍 {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
