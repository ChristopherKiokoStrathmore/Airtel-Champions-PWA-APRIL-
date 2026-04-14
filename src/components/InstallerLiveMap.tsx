import { useEffect, useState } from 'react';
import { getInstallerLiveLocations } from '../lib/supabase';

interface InstallerLiveLocation {
  id: number;
  installer_id: number;
  latitude: number;
  longitude: number;
  updated_at: string;
  installer: {
    ID: number;
    "Installer name": string;
    "Installer contact": number;
    "Supervisor": string;
    "Supervisor number": number;
    "Zone": string;
    "Town": string;
  };
}

export function InstallerLiveMap() {
  const [locations, setLocations] = useState<InstallerLiveLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchLocations() {
      setLoading(true);
      const { data, error } = await getInstallerLiveLocations();
      if (!error && data) setLocations(data);
      setLoading(false);
    }
    fetchLocations();
    interval = setInterval(fetchLocations, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="font-bold text-gray-900 mb-2">Installer Live Locations</h3>
      {loading ? (
        <div>Loading...</div>
      ) : locations.length === 0 ? (
        <div>No installers reporting location.</div>
      ) : (
        <ul>
          {locations.map(loc => (
            <li key={loc.id} className="mb-2">
              <strong>{loc.installer["Installer name"]}</strong> — {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
              <span className="ml-2 text-xs text-gray-500">(Last updated: {new Date(loc.updated_at).toLocaleTimeString()})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
