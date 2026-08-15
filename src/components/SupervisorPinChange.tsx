import { useState } from 'react';

// currentPin is no longer used for verification (the old PIN is checked
// server-side by the supervisor-auth Edge Function); kept for prop compatibility.
export function SupervisorPinChange({ supervisorId, onPinChanged }: { supervisorId: number, currentPin?: string, onPinChanged?: () => void }) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${base}/functions/v1/supervisor-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({ action: 'change-pin', supervisorId, oldPin, newPin }),
      });
      const j = await res.json().catch(() => ({} as any));
      setLoading(false);
      if (!res.ok || !j.ok) {
        setError(j.error || 'Failed to update PIN');
        return;
      }
      setSuccess('PIN updated successfully');
      setOldPin(''); setNewPin(''); setConfirmPin('');
      onPinChanged?.();
    } catch {
      setLoading(false);
      setError('Could not reach the server. Check your connection.');
    }
  }

  return (
    <form onSubmit={handleChange} className="max-w-xs mx-auto p-4 bg-white rounded shadow mt-4">
      <h2 className="font-bold mb-2">Change Supervisor PIN</h2>
      <input
        type="password"
        placeholder="Old PIN"
        value={oldPin}
        onChange={e => setOldPin(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="New PIN"
        value={newPin}
        onChange={e => setNewPin(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Confirm New PIN"
        value={confirmPin}
        onChange={e => setConfirmPin(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
        required
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
      <button type="submit" className="w-full bg-red-600 text-white p-2 rounded" disabled={loading}>
        {loading ? 'Updating...' : 'Change PIN'}
      </button>
    </form>
  );
}
