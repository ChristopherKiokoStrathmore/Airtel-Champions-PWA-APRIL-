import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupervisorLogin({ onLogin }: { onLogin: (supervisor: any) => void }) {
  const [number, setNumber] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Query supervisor by number
    const { data, error } = await supabase
      .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
      .select('*')
      .eq('Supervisor number', Number(number))
      .single();
    if (error || !data) {
      setError('Supervisor not found');
      setLoading(false);
      return;
    }
    if (String(data['Supervisor PIN']) !== pin) {
      setError('Incorrect PIN');
      setLoading(false);
      return;
    }
    setLoading(false);
    onLogin(data);
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
