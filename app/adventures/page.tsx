import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import AdventureCard from '@/components/adventures/AdventureCard';
import { SkeletonBlock, SkeletonText } from '@/components/ui/Skeleton';

// ── 스켈레톤 단위 컴포넌트 ─────────────────────────────────────────
function SkeletonSummaryCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
      <SkeletonText className="w-16 mx-auto mb-2" />
      <SkeletonBlock className="h-8 w-12 mx-auto rounded" />
    </div>
  );
}

function SkeletonAdventureCard() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-32 h-5" />
        <SkeletonText className="w-48" />
      </div>
      <div className="flex gap-3">
        <SkeletonBlock className="h-8 w-16 rounded" />
        <SkeletonBlock className="h-8 w-16 rounded" />
        <SkeletonBlock className="h-8 w-16 rounded" />
      </div>
    </div>
  );
}

// ── 요약 스탯 4칸 스켈레톤 ─────────────────────────────────────────
function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonSummaryCard key={i} />
      ))}
    </div>
  );
}

// ── count만 가져와서 정확한 수의 스켈레톤 생성 ─────────────────────
async function AdventureSkeletonsByCount() {
  const { count } = await supabase
    .from('adventures')
    .select('*', { count: 'exact', head: true });

  const n = count ?? 1;
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <SkeletonAdventureCard key={i} />
      ))}
    </div>
  );
}

// ── 스마트 스켈레톤: count 오는 동안 1개, 이후 정확한 수 ────────────
function SmartAdventureSkeleton() {
  return (
    <>
      <SummarySkeleton />
      <Suspense fallback={<div className="space-y-3"><SkeletonAdventureCard /></div>}>
        <AdventureSkeletonsByCount />
      </Suspense>
    </>
  );
}

// ── 실제 데이터 fetch 컴포넌트 ──────────────────────────────────────
async function AdventureList() {
  const [{ data: adventureData }, { data: characterData }, { data: snapshotData }] = await Promise.all([
    supabase.from('adventures').select('id, name').order('name', { ascending: true }),
    supabase.from('characters').select('id, adventure_id, role, fame').order('fame', { ascending: false }),
    supabase.from('character_snapshots').select('character_id, oath, snapshot_at').order('snapshot_at', { ascending: false }),
  ]);

  const adventures = adventureData ?? [];
  const characters = characterData ?? [];
  const snapshots  = snapshotData  ?? [];

  const latestSnapshot = new Map<string, any>();
  for (const snap of snapshots) {
    if (!latestSnapshot.has(snap.character_id)) {
      latestSnapshot.set(snap.character_id, snap.oath);
    }
  }

  const totalDealers   = characters.filter((c: any) => c.role === 'dealer').length;
  const totalBuffers   = characters.filter((c: any) => c.role === 'buffer').length;
  const totalOathPoints = [...latestSnapshot.values()].reduce(
    (sum, oath) => sum + (oath?.setInfo?.active?.setPoint?.current ?? 0), 0
  );

  return (
    <>
      {/* 전체 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {(
          [
            { label: '전체 캐릭터', value: characters.length, color: '' },
            { label: '딜러 / 버퍼',  value: `${totalDealers} / ${totalBuffers}`, color: '' },
            { label: '모험단 수',    value: adventures.length, color: '' },
            { label: '전체 서약 포인트', value: totalOathPoints.toLocaleString('en-US'), color: 'text-cyan-700 dark:text-cyan-400' },
          ] as const
        ).map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color || 'text-gray-900 dark:text-gray-100'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* 모험단 카드 목록 */}
      <div className="space-y-3">
        {adventures.map((adv: any) => {
          const chars     = characters.filter((c: any) => c.adventure_id === adv.id);
          const dealers   = chars.filter((c: any) => c.role === 'dealer').length;
          const buffers   = chars.filter((c: any) => c.role === 'buffer').length;
          const avgFame   = chars.length
            ? Math.round(chars.reduce((s: number, c: any) => s + c.fame, 0) / chars.length)
            : 0;
          const oathTotal = chars.reduce((sum: number, c: any) =>
            sum + (latestSnapshot.get(c.id)?.setInfo?.active?.setPoint?.current ?? 0), 0);

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
    </>
  );
}

// ── 페이지 진입점 ──────────────────────────────────────────────────
export const revalidate = 0;

export default function AdventuresPage() {
  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-4 dark:text-gray-100">
        모험단
      </h1>

      <Suspense fallback={<SmartAdventureSkeleton />}>
        <AdventureList />
      </Suspense>
    </main>
  );
}
