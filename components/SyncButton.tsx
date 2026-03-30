'use client';

import { useState } from 'react';

export default function SyncButton() {
  const [adventureName, setAdventureName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    if (!adventureName.trim()) {
      setMessage('Please enter an adventure name.');
      return;
    }

    setLoading(true);
    setMessage('Syncing with Dundam...');

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adventureName: adventureName.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync');
      }

      setMessage(`Success! Updated ${data.updatedCount} characters.`);
      // Reload page to show updated characters
      window.location.reload();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-start py-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter Adventure Name (모험단)"
          className="border border-gray-300 p-2 rounded w-64 text-black"
          value={adventureName}
          onChange={(e) => setAdventureName(e.target.value)}
        />
        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Syncing...' : 'Sync Characters'}
        </button>
      </div>
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
}
