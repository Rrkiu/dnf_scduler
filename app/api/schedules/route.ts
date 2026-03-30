import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Schedule name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert({ name })
      .select('id')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, schedule: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
