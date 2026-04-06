import { supabase } from '@/lib/supabase';
import AdventureCard from '@/components/adventures/AdventureCard';

export const revalidate = 0;

export default async function AdventuresPage() {
  const [{ data: adventureData }, { data: characterData }, { data: snapshotData }] = await Promise.all([
    supabase.from('adventures').select('id, name').order('name', { ascending: true }),
    supabase.from('characters').select('id, adventure_id, role, fame').order('fame', { ascending: false }),
    supabase.from('character_snapshots').select('character_id, oath, snapshot_at').order('snapshot_at', { ascending: false }),
  ]);

  const adventures = adventureData ?? [];
  const characters = characterData ?? [];
  const snapshots = snapshotData ?? [];

  const latestSnapshot = new Map<string, any>();
  for (const snap of snapshots) {
    if (!latestSnapshot.has(snap.character_id)) {
      latestSnapshot.set(snap.character_id, snap.oath);
    }
  }

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
          const chars = characters.filter((c: any) => c.adventure_id === adv.id);
          const dealers = chars.filter((c: any) => c.role === 'dealer').length;
          const buffers = chars.filter((c: any) => c.role === 'buffer').length;
          const avgFame = chars.length
            ? Math.round(chars.reduce((s: number, c: any) => s + c.fame, 0) / chars.length)
            : 0;
          const oathTotal = chars.reduce((sum: number, c: any) => {
            return sum + (latestSnapshot.get(c.id)?.setInfo?.active?.setPoint?.current ?? 0);
          }, 0);

          return (
            <AdventureCard
              key={adv.id}
              id={adv.id}
              name={adv.name}
              characterCount={chars.length}
              dealerCount={dealers}
              bufferCount={buffers}
              avgFame={avgFame}
              oathTotal={oathTotal}
            />
          );
        })}
      </div>
    </main>
  );
}
