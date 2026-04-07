import { supabase } from '@/lib/supabase';
import { getCurrentWeekKey } from '@/lib/gear-week';
import RankingBoard from '@/components/ranking/RankingBoard';

export const revalidate = 0;

export default async function RankingPage() {
  const currentWeekKey = getCurrentWeekKey();

  const [adventuresRes, currentScoresRes, recentScoresRes, dropLogsRes, allTimeScoresRes, lastSyncRes] = await Promise.all([
    supabase.from('adventures').select('id, name').order('name'),
    supabase
      .from('gear_weekly_scores')
      .select('adventure_id, week_key, covenant_relic_count, covenant_epic_count, crystal_relic_count, crystal_epic_count, item_relic_count, item_epic_count, total_score')
      .eq('week_key', currentWeekKey),
    supabase
      .from('gear_weekly_scores')
      .select('adventure_id, week_key, covenant_relic_count, covenant_epic_count, crystal_relic_count, crystal_epic_count, item_relic_count, item_epic_count, total_score')
      .order('week_key', { ascending: false })
      .limit(8 * 10),
    supabase
      .from('gear_drop_logs')
      .select('id, adventure_id, character_id, item_name, item_rarity, timeline_code, dropped_at, characters(character_name)')
      .eq('week_key', currentWeekKey)
      .order('dropped_at', { ascending: false }),
    supabase
      .from('gear_weekly_scores')
      .select('adventure_id, covenant_relic_count, covenant_epic_count, crystal_relic_count, crystal_epic_count, item_relic_count, item_epic_count, total_score'),
    supabase
      .from('gear_weekly_scores')
      .select('snapshot_at')
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const adventures = adventuresRes.data ?? [];
  const weekScores = (currentScoresRes.data ?? []) as any[];
  const recentScores = (recentScoresRes.data ?? []) as any[];
  const dropLogs = (dropLogsRes.data ?? []) as any[];
  const allTimeScores = (allTimeScoresRes.data ?? []) as any[];
  const lastSyncAt = lastSyncRes.data?.snapshot_at ?? null;

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="border-b pb-3 md:pb-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">드랍 랭킹</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">태초 · 에픽 드랍 기반 주간 운 랭킹</p>
      </div>

      <RankingBoard
        adventures={adventures}
        currentWeekKey={currentWeekKey}
        weekScores={weekScores}
        recentScores={recentScores}
        dropLogs={dropLogs}
        allTimeScores={allTimeScores}
        lastSyncAt={lastSyncAt}
      />
    </main>
  );
}
