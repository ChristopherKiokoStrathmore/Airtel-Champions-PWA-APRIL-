import { useState } from 'react';

export function SupervisorLogin({ onLogin }: { onLogin: (supervisor: any) => void }) {
  const [number, setNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Authenticate server-side: the supervisor-auth Edge Function reads
    // INHOUSE_INSTALLER_6TOWNS_MARCH with the service role and checks the PIN, so
    // the table is no longer anon-readable. It returns the supervisor record
    // (without the PIN) and an authenticated token for the dashboard reads.
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${base}/functions/v1/supervisor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({ action: 'login', number, pin }),
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok || !j.success) {
        setError(j.error || 'Supervisor not found or incorrect PIN');
        setLoading(false);
        return;
      }
      if (j.access_token) {
        localStorage.setItem('acp.session', JSON.stringify({
          accessToken: j.access_token,
          expiresAt: Date.now() + (j.expires_in ?? 0) * 1000,
        }));
      }
      setLoading(false);
      onLogin(j.supervisor);
    } catch {
      setError('Could not reach the server. Check your connection.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="max-w-xs mx-auto p-4 bg-white rounded shadow">
      <h2 className="font-bold mb-2">Supervisor Login</h2>
      <input
        type="text"
        placeholder="Supervisor Number"
        value={number}
        onChange={e => setNumber(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="PIN"
        value={pin}
        onChange={e => setPin(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
        required
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button type="submit" className="w-full bg-red-600 text-white p-2 rounded" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
