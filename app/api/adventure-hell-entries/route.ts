import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/adventure-hell-entries?adventureId=xxx&weekKey=yyyy-mm-dd
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adventureId = searchParams.get('adventureId');
  const weekKey = searchParams.get('weekKey');

  if (!adventureId || !weekKey) {
    return NextResponse.json({ error: 'adventureId, weekKey 필수' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('adventure_hell_entries')
    .select('id, entry_count, content_type, updated_at')
    .eq('adventure_id', adventureId)
    .eq('week_key', weekKey)
    .eq('content_type', 'hell')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entry: data });
}

// POST /api/adventure-hell-entries  { adventureId, weekKey, entryCount }
export async function POST(req: Request) {
  try {
    const { adventureId, weekKey, entryCount } = await req.json();

    if (!adventureId || !weekKey || entryCount == null) {
      return NextResponse.json({ error: 'adventureId, weekKey, entryCount 필수' }, { status: 400 });
    }
    if (!Number.isInteger(entryCount) || entryCount < 0) {
      return NextResponse.json({ error: 'entryCount는 0 이상의 정수' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('adventure_hell_entries')
      .upsert(
        {
          adventure_id: adventureId,
          week_key: weekKey,
          entry_count: entryCount,
          content_type: 'hell',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'adventure_id,week_key,content_type' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ entry: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
