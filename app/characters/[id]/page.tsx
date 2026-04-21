import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BackButton from '@/components/characters/BackButton';
import CharacterDetail from '@/components/characters/CharacterDetail';

export const revalidate = 0;

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: character, error } = await supabase
    .from('characters')
    .select('*, adventures(name)')
    .eq('id', id)
    .single();

  if (error || !character) notFound();

  const { data: snapshotData } = await supabase
    .from('character_snapshots')
    .select('snapshot_at, equipment, oath, status, relic_count, epic_count, set_names, avatar, creature')
    .eq('character_id', id)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isDealer = character.role === 'dealer';
  const snapshot = snapshotData ?? null;

  return (
    <main className="p-4 md:p-8 max-w-3xl mx-auto min-h-screen">
      <div className="mb-4">
        <BackButton fallback="/characters" label="← 뒤로" />
      </div>

      <div className="border-b pb-3 md:pb-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {character.character_name}
          </h1>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              isDealer
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            {isDealer ? 'Dealer' : 'Buffer'}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {character.adventures?.name} · {character.server} · {character.job}
        </p>
      </div>

      {/* 기본 스텟 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="명성" value={character.fame.toLocaleString('en-US')} />
        {isDealer ? (
          <StatCard label="딜량" value={character.damage.toFixed(1)} />
        ) : (
          <StatCard label="버프력" value={character.buff_power.toLocaleString('en-US')} />
        )}
        <StatCard
          label="최근 갱신"
          value={new Date(character.updated_at).toLocaleDateString('ko-KR')}
        />
      </div>

      <CharacterDetail
        characterId={id}
        hasNeopleId={!!(character.neople_character_id && character.neople_server_id)}
        initialSnapshot={snapshot}
      />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}
