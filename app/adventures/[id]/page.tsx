import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdventureDetail from '@/components/adventures/AdventureDetail';
import { getCompletedWeekKeys } from '@/lib/gear-week';

export const revalidate = 0;

export default async function AdventureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const completedWeeks = getCompletedWeekKeys();

  const [{ data: adventure }, { data: characterData }, { data: snapshotData }, { data: hellEntryData }, { data: weekScoreData }] = await Promise.all([
    supabase.from('adventures').select('id, name').eq('id', id).single(),
    supabase.from('characters').select('id, character_name, job, role, fame').eq('adventure_id', id).order('fame', { ascending: false }),
    supabase.from('character_snapshots').select('character_id, oath, snapshot_at').order('snapshot_at', { ascending: false }),
    supabase.from('adventure_hell_entries').select('week_key, entry_count').eq('adventure_id', id).eq('content_type', 'hell'),
    supabase.from('gear_weekly_scores')
      .select('week_key, covenant_relic_count, covenant_epic_count, crystal_relic_count, crystal_epic_count, item_relic_count, item_epic_count')
      .eq('adventure_id', id),
  ]);

  if (!adventure) notFound();

  const characters = characterData ?? [];
  const snapshots = snapshotData ?? [];

  const latestSnapshot = new Map<string, any>();
  for (const snap of snapshots) {
    if (!latestSnapshot.has(snap.character_id)) {
      latestSnapshot.set(snap.character_id, snap.oath);
    }
  }

  const enrichedCharacters = characters.map((c: any) => {
    const oath = latestSnapshot.get(c.id);
    return {
      id: c.id,
      character_name: c.character_name,
      job: c.job,
      role: c.role,
      fame: c.fame,
      oathSetName: oath?.setInfo?.setName ?? null,
      oathSetRarityName: oath?.setInfo?.setRarityName ?? null,
      oathSetPoint: oath?.setInfo?.active?.setPoint?.current ?? null,
    };
  });

  // week_key → entry_count
  const hellEntries: Record<string, number> = {};
  for (const e of (hellEntryData ?? [])) {
    hellEntries[e.week_key] = e.entry_count;
  }

  // week_key → scores
  const weekScores: Record<string, any> = {};
  for (const s of (weekScoreData ?? [])) {
    weekScores[s.week_key] = s;
  }

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link href="/adventures" className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
          ← 모험단 목록
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2 text-gray-900 dark:text-gray-100">{adventure.name}</h1>
      </div>

      <AdventureDetail
        adventureId={adventure.id}
        adventureName={adventure.name}
        characters={enrichedCharacters}
        completedWeeks={completedWeeks}
        hellEntries={hellEntries}
        weekScores={weekScores}
      />
    </main>
  );
}
