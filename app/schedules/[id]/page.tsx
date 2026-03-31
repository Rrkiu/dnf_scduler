import { supabase } from '@/lib/supabase';
import ScheduleBoard from '@/components/schedules/ScheduleBoard';
import Link from 'next/link';

export const revalidate = 0;

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: scheduleId } = await params;

  const [scheduleRes, slotsRes, charactersRes, adventuresRes] = await Promise.all([
    supabase.from('schedules').select('*').eq('id', scheduleId).single(),
    supabase.from('schedule_slots').select('*, characters(*)').eq('schedule_id', scheduleId).order('position', { ascending: true }),
    supabase.from('characters').select('*').order('fame', { ascending: false }),
    supabase.from('adventures').select('*').order('name', { ascending: true }),
  ]);

  if (scheduleRes.error) {
    return <div className="p-8"><p className="text-red-500">Failed to load schedule. It may not exist.</p></div>;
  }

  const schedule = scheduleRes.data;
  const initialSlots = slotsRes.data || [];
  const allCharacters = charactersRes.data || [];
  const allAdventures = adventuresRes.data || [];

  const rawOwners = schedule.column_owners;
  const initialColumnOwners: (string | null)[] =
    Array.isArray(rawOwners) && rawOwners.length === 4
      ? rawOwners
      : [null, null, null, null];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6 flex justify-between items-center border-b pb-4">
        <div>
          <Link href="/schedules" className="text-sm font-medium text-blue-500 hover:text-blue-700 mb-2 inline-block">&larr; Back to Schedules</Link>
          <h1 className="text-3xl font-bold text-gray-900">{schedule.name}</h1>
        </div>
      </div>

      <ScheduleBoard
        scheduleId={schedule.id}
        initialSlots={initialSlots}
        initialColumnOwners={initialColumnOwners}
        allCharacters={allCharacters}
        allAdventures={allAdventures}
      />
    </div>
  );
}
