import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// DELETE /api/schedules/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    console.log('[DELETE schedule] id:', id);

    const { data, error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .select('id');

    console.log('[DELETE schedule] result:', { data, error });

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: `삭제 실패: DB에서 해당 스케줄을 찾을 수 없거나 권한이 없습니다. (id: ${id})` }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
