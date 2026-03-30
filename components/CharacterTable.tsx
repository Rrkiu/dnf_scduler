'use client';

import { useState } from 'react';
import { Character } from '@/types';
import { supabase } from '@/lib/supabase';

interface CharacterTableProps {
  characters: Character[];
}

export default function CharacterTable({ characters: initialCharacters }: CharacterTableProps) {
  const [characters, setCharacters] = useState(initialCharacters);
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this character?')) return;
    try {
      const { error } = await supabase.from('characters').delete().eq('id', id);
      if (error) throw error;
      setCharacters(characters.filter(c => c.id !== id));
    } catch (err: any) {
      alert(`Failed to delete character: ${err.message}`);
    }
  };

  if (!characters.length) {
    return <p className="text-gray-500 py-4">No characters found. Sync to fetch data.</p>;
  }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg text-black mt-4">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Adventure ID</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Server</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Job</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fame</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Damage</th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Buff Power</th>
            <th className="relative px-3 py-3.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {characters.map((char) => (
            <tr key={char.id} className="hover:bg-gray-50 transition-colors">
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{char.adventure_id}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{char.character_name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{char.server}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{char.job}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${char.role === 'dealer' ? 'bg-red-50 text-red-700 ring-red-600/10' : 'bg-blue-50 text-blue-700 ring-blue-600/10'}`}>
                  {char.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{char.fame.toLocaleString()}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{char.damage ? char.damage.toFixed(2) : '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{char.buff_power > 0 ? char.buff_power.toLocaleString() : '-'}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-red-600 hover:text-red-900 cursor-pointer" onClick={() => handleDelete(char.id)}>
                Delete
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
