import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchDundamSearch, triggerDundamRefresh } from '@/lib/dundam-parser';
import { toNeopleServerId } from '@/lib/neople-server-map';

export const dynamic = 'force-dynamic';

// Vercel Serverless Function timeout configuration
// Allows up to 60 seconds (Hobby max is dependent on account, but standard is 10-15s, this helps explicit config).
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { adventureName } = await req.json();

    if (!adventureName) {
      return NextResponse.json({ error: 'Adventure name is required' }, { status: 400 });
    }

    // 1. Fetch character data from Dundam
    let characters = await fetchDundamSearch(adventureName);

    if (!characters.length) {
      return NextResponse.json({ error: 'No characters found or failed to fetch' }, { status: 404 });
    }

    // NEW: Trigger refresh on Dundam servers for each character
    await triggerDundamRefresh(characters);

    // FETCH AGAIN to get the updated data after triggers
    characters = await fetchDundamSearch(adventureName);

    // 2. Fetch or Create Adventure in DB
    let adventureId: string;
    const { data: existingAdv, error: findAdvError } = await supabase
      .from('adventures')
      .select('id')
      .eq('name', adventureName)
      .single();

    if (existingAdv) {
      adventureId = existingAdv.id;
    } else {
      const { data: newAdv, error: createAdvError } = await supabase
        .from('adventures')
        .insert({ name: adventureName })
        .select('id')
        .single();
        
      if (createAdvError || !newAdv) {
        throw new Error(createAdvError?.message || 'Failed to create adventure');
      }
      adventureId = newAdv.id;
    }

    // 3. Upsert characters
    const characterUpserts = characters.map(c => ({
      adventure_id: adventureId,
      character_name: c.characterName,
      server: c.server,
      job: c.job,
      role: c.role,
      fame: c.fame,
      damage: c.damage,
      buff_power: c.buffPower,
      neople_character_id: c.key || null,
      neople_server_id: c.server ? toNeopleServerId(c.server) : null,
      updated_at: new Date().toISOString()
    }));

    // Use upsert matching `adventure_id` and `character_name` uniquely.
    const { data: upsertData, error: upsertError } = await supabase
      .from('characters')
      .upsert(characterUpserts, {
        onConflict: 'adventure_id, character_name'
      })
      .select();

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return NextResponse.json({
      success: true,
      updatedCount: (upsertData || []).length
    });

  } catch (err: any) {
    console.error('Error in /api/sync:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
