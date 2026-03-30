import { supabase } from '@/lib/supabase';
import CreateScheduleButton from '@/components/schedules/CreateScheduleButton';
import Link from 'next/link';

export const revalidate = 0;

export default async function SchedulesPage() {
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching schedules:', error);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Schedules</h1>
        <CreateScheduleButton />
      </div>

      {!schedules || schedules.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-gray-500 text-center">
          No schedules found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((sched: any) => (
            <Link key={sched.id} href={`/schedules/${sched.id}`}>
              <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block border border-gray-100">
                <h2 className="text-xl font-semibold mb-2 text-blue-600">{sched.name}</h2>
                <div className="text-sm text-gray-500">
                  Created at: {new Date(sched.created_at).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
