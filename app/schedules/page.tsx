import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import CreateScheduleButton from '@/components/schedules/CreateScheduleButton';
import ScheduleCard from '@/components/schedules/ScheduleCard';
import { SkeletonCard } from '@/components/ui/Skeleton';

// ── 실제 스케줄 목록 (데이터 fetch) ──────────────────────────────
async function ScheduleList() {
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching schedules:', error);

  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-gray-500 dark:text-gray-400 text-center">
        No schedules found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {schedules.map((sched: any) => (
        <ScheduleCard
          key={sched.id}
          id={sched.id}
          name={sched.name}
          createdAt={sched.created_at}
        />
      ))}
    </div>
  );
}

// ── count만 빠르게 가져와서 그 수만큼 스켈레톤 표시 ─────────────────
async function SkeletonsByCount() {
  const { count } = await supabase
    .from('schedules')
    .select('*', { count: 'exact', head: true });

  const n = count ?? 1;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: n }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── 스켈레톤 레이어: count 오는 동안은 1개, 이후 정확한 수 표시 ────
function SmartSkeleton() {
  return (
    <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><SkeletonCard /></div>}>
      <SkeletonsByCount />
    </Suspense>
  );
}

// ── 페이지 진입점: 헤더는 즉시, 목록은 Suspense로 ─────────────────
export const revalidate = 0;

export default function SchedulesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Schedules</h1>
        <CreateScheduleButton />
      </div>

      <Suspense fallback={<SmartSkeleton />}>
        <ScheduleList />
      </Suspense>
    </div>
  );
}
