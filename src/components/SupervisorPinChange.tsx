import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupervisorPinChange({ supervisorId, currentPin, onPinChanged }: { supervisorId: number, currentPin: string, onPinChanged?: () => void }) {
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
    if (oldPin !== currentPin) {
      setError('Old PIN is incorrect');
      return;
    }
    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
      .update({ "Supervisor PIN": newPin })
      .eq('ID', supervisorId);
    setLoading(false);
    if (error) {
      setError('Failed to update PIN');
    } else {
      setSuccess('PIN updated successfully');
      setOldPin(''); setNewPin(''); setConfirmPin('');
      onPinChanged?.();
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
