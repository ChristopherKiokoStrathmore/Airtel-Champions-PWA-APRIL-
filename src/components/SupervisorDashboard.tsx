import { useEffect, useState } from 'react';
import { supabase, getInstallerLiveLocations } from '../lib/supabase';

export function SupervisorDashboard({ supervisorNumber }: { supervisorNumber: number }) {
  const [installers, setInstallers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstallers() {
      const { data, error } = await supabase
        .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
        .select('*')
        .eq('Supervisor number', supervisorNumber);
      setInstallers(data || []);
    }
    fetchInstallers();
  }, [supervisorNumber]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchLocations() {
      const { data } = await getInstallerLiveLocations();
      setLocations(data || []);
    }
    fetchLocations();
    interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  function getInstallerLocation(installerId: number) {
    return locations.find((loc: any) => loc.installer_id === installerId);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h2 className="font-bold mb-4">Supervisor Dashboard</h2>
      <h3 className="font-semibold mb-2">Your Installers</h3>
      {installers.length === 0 ? (
        <div>No installers found.</div>
      ) : (
        <ul>
          {installers.map(inst => {
            const loc = getInstallerLocation(inst.ID);
            return (
              <li key={inst.ID} className="mb-3">
                <strong>{inst["Installer name"]}</strong> — {inst["Installer contact"]}
                <div className="text-xs text-gray-500">
                  {loc ? (
                    <>
                      Last location: {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                      <span className="ml-2">({new Date(loc.updated_at).toLocaleTimeString()})</span>
                    </>
                  ) : (
                    <>No location reported</>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
