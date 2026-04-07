import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PATCH /api/schedules/[id]  { name }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('schedules')
      .update({ name: name.trim() })
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ schedule: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
