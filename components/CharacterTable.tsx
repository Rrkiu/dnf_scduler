'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Character, Adventure } from '@/types';
import { supabase } from '@/lib/supabase';

interface CharacterTableProps {
  characters: Character[];
  adventures: Adventure[];
}

export default function CharacterTable({ characters: initialCharacters, adventures }: CharacterTableProps) {
  const router = useRouter();
  const [characters, setCharacters] = useState(initialCharacters);
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  const adventureName = (id: string) =>
    adventures.find(a => a.id === id)?.name ?? id;

  const filtered = characters
    .filter(c => !selectedAdventureId || c.adventure_id === selectedAdventureId)
    .filter(c => !search || c.character_name.toLowerCase().includes(search.toLowerCase()));

  if (!characters.length) {
    return <p className="text-gray-500 dark:text-gray-400 py-4">No characters found. Sync to fetch data.</p>;
  }

  return (
    <div className="mt-4">
      {/* Adventure 필터 탭 + 검색 */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => setSelectedAdventureId(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedAdventureId === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          전체
        </button>
        {adventures.map(adv => (
          <button
            key={adv.id}
            onClick={() => setSelectedAdventureId(adv.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedAdventureId === adv.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {adv.name}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="캐릭터 검색..."
          className="ml-auto px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="overflow-x-auto shadow ring-1 ring-black/5 dark:ring-white/10 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">모험단</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Server</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Job</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Role</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Fame</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Damage</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Buff Power</th>
              <th className="relative px-3 py-3.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {filtered.map((char) => (
              <tr key={char.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{adventureName(char.adventure_id)}</td>
                <td
                  className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
                  title="더블클릭으로 상세 보기"
                  onDoubleClick={() => router.push(`/characters/${char.id}`)}
                >{char.character_name}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{char.server}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{char.job}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    char.role === 'dealer'
                      ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20'
                      : 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20'
                  }`}>
                    {char.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{char.fame.toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{char.damage ? char.damage.toFixed(2) : '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{char.buff_power > 0 ? char.buff_power.toLocaleString() : '-'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-red-600 hover:text-red-400 dark:text-red-500 dark:hover:text-red-400 cursor-pointer" onClick={() => handleDelete(char.id)}>
                  Delete
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
