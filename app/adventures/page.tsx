import { supabase } from '@/lib/supabase';
import AdventureCard from '@/components/adventures/AdventureCard';

export const revalidate = 0;

export default async function AdventuresPage() {
  const [{ data: adventureData }, { data: characterData }, { data: snapshotData }] = await Promise.all([
    supabase.from('adventures').select('id, name').order('name', { ascending: true }),
    supabase.from('characters').select('id, adventure_id, character_name, job, role, fame').order('fame', { ascending: false }),
    supabase.from('character_snapshots').select('character_id, oath, snapshot_at').order('snapshot_at', { ascending: false }),
  ]);

  const adventures = adventureData ?? [];
  const characters = characterData ?? [];
  const snapshots = snapshotData ?? [];

  // 캐릭터별 최신 스냅샷
  const latestSnapshot = new Map<string, any>();
  for (const snap of snapshots) {
    if (!latestSnapshot.has(snap.character_id)) {
      latestSnapshot.set(snap.character_id, snap.oath);
    }
  }

  // 전체 요약
  const totalDealers = characters.filter((c: any) => c.role === 'dealer').length;
  const totalBuffers = characters.filter((c: any) => c.role === 'buffer').length;
  const totalOathPoints = [...latestSnapshot.values()].reduce(
    (sum, oath) => sum + (oath?.setInfo?.active?.setPoint?.current ?? 0), 0
  );

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4 dark:text-gray-100">
        모험단
      </h1>

      {/* 전체 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">전체 캐릭터</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{characters.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">딜러 / 버퍼</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalDealers} / {totalBuffers}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">모험단 수</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adventures.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">전체 서약 포인트</div>
          <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{totalOathPoints.toLocaleString('en-US')}</div>
        </div>
      </div>

      {/* 모험단 카드 목록 */}
      <div className="space-y-3">
        {adventures.map((adv: any) => {
          const chars = characters
            .filter((c: any) => c.adventure_id === adv.id)
            .map((c: any) => {
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

          return <AdventureCard key={adv.id} name={adv.name} characters={chars} />;
        })}
      </div>
    </main>
  );
}
