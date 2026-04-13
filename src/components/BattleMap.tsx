import { useState, useEffect, useMemo, useRef } from 'react';
import { getHotspots, getCompetitorActivity, getSubmissions, getAnalytics, getActiveLocations, getLocationHistory } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { LiveLocationTracker } from './LiveLocationTracker';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Hotspot {
  id: string;
  name: string;
  hotspot_type: string;
  priority_level: string;
  location: any;
  radius_meters: number;
  target_submissions: number;
  is_active: boolean;
  submissions?: number;
  avgPoints?: number;
  dominant?: string;
  trend?: string;
}

interface CompetitorSighting {
  id: string;
  competitor_name: string;
  activity_type: string;
  sighting_date: string;
  location: any;
  location_name: string;
  reported_by: string;
  notes: string;
}

interface Submission {
  id: string;
  se_id: string;
  mission_type_id: string;
  status: string;
  points_awarded: number;
  location?: {
    coordinates?: [number, number];
  };
  location_name?: string;
  created_at: string;
  users?: any; // Add users relation for region filtering
  mission_types?: any;
}

// Component to handle map interactions
function MapController({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export function BattleMap() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week'>('today');
  const [missionFilter, setMissionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [competitorSightings, setCompetitorSightings] = useState<CompetitorSighting[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Live Tracking State
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [historyPath, setHistoryPath] = useState<[number, number][]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-1.2921, 36.8219]); // Nairobi default
  const [mapZoom, setMapZoom] = useState(13);

  useEffect(() => {
    loadMapData();
    // Poll for active users every 5s for the map view
    const interval = setInterval(loadActiveUsers, 5000);
    return () => clearInterval(interval);
  }, [selectedRegion, filterType, missionFilter]);

  const loadActiveUsers = async () => {
    const { data } = await getActiveLocations();
    if (data) setActiveUsers(data);
  };

  const loadMapData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [hotspotsResult, competitorResult, submissionsResult, analyticsResult, activeUsersResult] = await Promise.all([
        getHotspots(),
        getCompetitorActivity(),
        getSubmissions({ limit: 100, offset: 0, status: 'approved' }),
        getAnalytics(),
        getActiveLocations()
      ]);

      if (hotspotsResult.error) throw new Error(hotspotsResult.error);
      if (competitorResult.error) throw new Error(competitorResult.error);
      // submissions might fail if table empty, handle gracefully
      
      setHotspots(hotspotsResult.data || []);
      setCompetitorSightings(competitorResult.data || []);
      setRecentSubmissions(submissionsResult.data || []);
      setAnalytics(analyticsResult.data);
      setActiveUsers(activeUsersResult.data || []);

    } catch (err: any) {
      console.error('Error loading map data:', err);
      // Don't block UI if just one fails
      // setError(err.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection from list or map
  const handleUserSelect = async (userId: string, lat: number, lng: number) => {
    setSelectedUserId(userId);
    setMapCenter([lat, lng]);
    setMapZoom(16); // Zoom in
    
    // Fetch history
    try {
      const { data } = await getLocationHistory(userId);
      if (data && Array.isArray(data)) {
        // Sort by timestamp
        const sorted = data.sort((a: any, b: any) => a.t - b.t);
        setHistoryPath(sorted.map((p: any) => [p.lat, p.lng]));
      } else {
        setHistoryPath([]);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  // Calculate region statistics
  const regionStats = useMemo(() => {
    const stats: { [key: string]: { submissions: number; hotspots: number; competitors: number } } = {};
    recentSubmissions.forEach(sub => {
      const region = sub.users?.region || 'unknown';
      if (!stats[region]) stats[region] = { submissions: 0, hotspots: 0, competitors: 0 };
      stats[region].submissions++;
    });
    // Add logic for hotspots/competitors if they had region data
    return stats;
  }, [recentSubmissions]);

  // Extract unique regions
  const regions = useMemo(() => {
    const uniqueRegions = new Set<string>();
    recentSubmissions.forEach(sub => {
      if (sub.users?.region) uniqueRegions.add(sub.users.region);
    });
    return Array.from(uniqueRegions).map(region => ({
      id: region.toLowerCase(),
      name: region,
      submissions: recentSubmissions.filter(s => s.users?.region === region).length,
      hotspots: regionStats[region]?.hotspots || 0,
      competitors: regionStats[region]?.competitors || 0
    })).sort((a, b) => b.submissions - a.submissions);
  }, [recentSubmissions, regionStats]);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = [...recentSubmissions];
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(s => s.users?.region?.toLowerCase() === selectedRegion);
    }
    // Date filtering logic...
    return filtered;
  }, [recentSubmissions, selectedRegion, filterType, missionFilter]);

  // Calculate stats for top cards
  const stats = useMemo(() => {
    return {
      totalSubmissions: filteredSubmissions.length,
      activeHotspots: hotspots.filter(h => h.is_active).length,
      competitorSightings: competitorSightings.length,
      activeSEs: new Set(recentSubmissions.map(s => s.se_id)).size
    };
  }, [filteredSubmissions, hotspots, competitorSightings, recentSubmissions]);

  if (loading && !activeUsers.length) {
    return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Battle Map</h1>
        <p className="text-gray-600">Real-time intelligence across all regions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Active Hotspots</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeHotspots}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Competitor Sightings</p>
          <p className="text-3xl font-bold text-gray-900">{stats.competitorSightings}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Active SEs</p>
          <p className="text-3xl font-bold text-gray-900">{activeUsers.length}</p>
          <p className="text-sm text-green-600">Online Now</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[600px] relative z-0">
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={mapCenter} zoom={mapZoom} />
              
              {/* Render Active Users */}
              {activeUsers.map(user => (
                <Marker 
                  key={user.userId} 
                  position={[user.lat, user.lng]}
                  eventHandlers={{
                    click: () => handleUserSelect(user.userId, user.lat, user.lng),
                  }}
                >
                  <Popup>
                    <div className="font-sans">
                      <p className="font-bold">{user.userDetails?.name || 'Unknown'}</p>
                      <p className="text-xs">{user.userDetails?.role}</p>
                      <p className="text-xs text-gray-500">
                        Last seen: {new Date(user.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Render History Path if selected */}
              {selectedUserId && historyPath.length > 0 && (
                <Polyline 
                  positions={historyPath} 
                  pathOptions={{ color: 'blue', weight: 4, opacity: 0.6, dashArray: '10, 10' }} 
                />
              )}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-lg text-xs z-[1000]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Active Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-blue-500 border-dashed border-white"></div>
                <span>History Trail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Live Location List */}
          <LiveLocationTracker onUserSelect={handleUserSelect} />

          {/* Activity Feed (Simplified) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Recent Submissions</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredSubmissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="text-sm p-2 border-b">
                  <span className="font-medium">{sub.users?.full_name}</span> completed a mission
                </div>
              ))}
              {filteredSubmissions.length === 0 && (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
