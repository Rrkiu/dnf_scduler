import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchCharacterDrops } from '@/lib/neople-timeline';
import { getCurrentWeekKey, getWeekDateRange, calculateScore } from '@/lib/gear-week';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { adventureId } = body; // 미전달 시 전체 갱신

    const apiKey = process.env.NEOPLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'NEOPLE_API_KEY 미설정' }, { status: 500 });

    const weekKey = getCurrentWeekKey();
    const { startDate, endDate } = getWeekDateRange(weekKey);

    // 대상 모험단 조회
    let query = supabase.from('adventures').select('id, name');
    if (adventureId) query = query.eq('id', adventureId);
    const { data: adventures, error: advError } = await query;
    if (advError) throw new Error(advError.message);

    const results = [];

    for (const adventure of adventures ?? []) {
      // neople ID가 있는 캐릭터만
      const { data: characters } = await supabase
        .from('characters')
        .select('id, character_name, neople_character_id, neople_server_id')
        .eq('adventure_id', adventure.id)
        .not('neople_character_id', 'is', null)
        .not('neople_server_id', 'is', null);

      const dropLogs: any[] = [];

      for (const char of characters ?? []) {
        const items = await fetchCharacterDrops(
          char.neople_server_id,
          char.neople_character_id,
          startDate,
          endDate,
          apiKey
        );

        for (const item of items) {
          dropLogs.push({
            adventure_id: adventure.id,
            character_id: char.id,
            neople_character_id: char.neople_character_id,
            item_id: item.itemId,
            item_name: item.itemName,
            item_rarity: item.itemRarity,
            timeline_code: item.code,
            dropped_at: new Date(item.date).toISOString(),
            week_key: weekKey,
          });
        }
      }

      // 드랍 로그 upsert (중복 방지: neople_character_id + item_id + dropped_at)
      if (dropLogs.length > 0) {
        await supabase
          .from('gear_drop_logs')
          .upsert(dropLogs, { onConflict: 'neople_character_id, item_id, dropped_at' });
      }

      // DB에서 이번 주 집계 재계산 (중복 없는 정확한 수치)
      const { data: logs } = await supabase
        .from('gear_drop_logs')
        .select('item_rarity')
        .eq('adventure_id', adventure.id)
        .eq('week_key', weekKey);

      const relicCount = logs?.filter(l => l.item_rarity === '태초').length ?? 0;
      const epicCount = logs?.filter(l => l.item_rarity === '에픽').length ?? 0;
      const totalScore = calculateScore(relicCount, epicCount);

      await supabase
        .from('gear_weekly_scores')
        .upsert(
          { adventure_id: adventure.id, week_key: weekKey, relic_count: relicCount, epic_count: epicCount, total_score: totalScore, snapshot_at: new Date().toISOString() },
          { onConflict: 'adventure_id, week_key' }
        );

      results.push({ adventure: adventure.name, relicCount, epicCount, totalScore });
    }

    return NextResponse.json({ success: true, weekKey, results });
  } catch (err: any) {
    console.error('gear-sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
