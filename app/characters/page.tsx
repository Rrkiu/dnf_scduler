import { supabase } from '@/lib/supabase';
import CharacterTable from '@/components/CharacterTable';
import SyncButton from '@/components/SyncButton';
import SnapshotAllButton from '@/components/SnapshotAllButton';
import { Character } from '@/types';

// Force revalidation so we don't cache database old results in dev/prod
export const revalidate = 0;

export default async function CharactersPage() {
  const [{ data, error }, { data: adventureData }, { data: latestSnapshotData }, { data: latestSyncData }] = await Promise.all([
    supabase.from('characters').select('*').order('fame', { ascending: false }),
    supabase.from('adventures').select('*').order('name', { ascending: true }),
    supabase.from('character_snapshots').select('snapshot_at').order('snapshot_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('characters').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (error) {
    console.error('Error fetching characters:', error);
  }

  const characters: Character[] = data || [];
  const adventures = adventureData || [];

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4 dark:text-gray-100">
        DNF Scheduler - Characters
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">Sync with Dundam</h2>
        <p className="text-gray-500 text-sm mb-4 dark:text-gray-400">
          Enter your adventure name (모험단) to fetch and save your character roster from Dundam.
        </p>
        <SyncButton adventures={adventures} lastSyncAt={latestSyncData?.updated_at ?? null} />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Character Roster</h2>
          <SnapshotAllButton characters={characters} lastSnapshotAt={latestSnapshotData?.snapshot_at ?? null} />
        </div>
        <CharacterTable characters={characters} adventures={adventures} />
      </div>
    </main>
  );
}
