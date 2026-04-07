import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchCharacterEquipment, fetchCharacterOath, fetchCharacterStatus } from '@/lib/neople-character';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const { characterId } = await req.json();
    if (!characterId) {
      return NextResponse.json({ error: 'characterId 필수' }, { status: 400 });
    }

    const apiKey = process.env.NEOPLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'NEOPLE_API_KEY 미설정' }, { status: 500 });

    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('id, neople_character_id, neople_server_id')
      .eq('id', characterId)
      .single();

    if (charError || !character) {
      return NextResponse.json({ error: '캐릭터 없음' }, { status: 404 });
    }
    if (!character.neople_character_id || !character.neople_server_id) {
      return NextResponse.json({ error: 'Neople ID 미등록 캐릭터' }, { status: 400 });
    }

    const [equipment, oath, status] = await Promise.all([
      fetchCharacterEquipment(character.neople_server_id, character.neople_character_id, apiKey),
      fetchCharacterOath(character.neople_server_id, character.neople_character_id, apiKey),
      fetchCharacterStatus(character.neople_server_id, character.neople_character_id, apiKey),
    ]);

    const relicItems = equipment.filter(e => e.itemRarity === '태초');
    const epicItems  = equipment.filter(e => e.itemRarity === '에픽');
    const setNames   = [...new Set(
      equipment.map(e => e.setItemName).filter(Boolean) as string[]
    )];

    const { data: snapshot, error: insertError } = await supabase
      .from('character_snapshots')
      .insert({
        character_id: character.id,
        equipment,
        oath,
        status,
        relic_count: relicItems.length,
        epic_count:  epicItems.length,
        set_names:   setNames,
        snapshot_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    // 최신 1건만 유지: 방금 저장한 것 외 이전 스냅샷 삭제
    await supabase
      .from('character_snapshots')
      .delete()
      .eq('character_id', character.id)
      .neq('id', snapshot.id);

    return NextResponse.json({ success: true, snapshot });
  } catch (err: any) {
    console.error('character-snapshot error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
