import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchCharacterDrops } from '@/lib/neople-timeline';
import { getWeekKeyForDate, calculateScore, formatNeopleDate, SEASON_START, getItemType } from '@/lib/gear-week';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { adventureId } = body;

    const apiKey = process.env.NEOPLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'NEOPLE_API_KEY 미설정' }, { status: 500 });

    const endDate = formatNeopleDate(new Date());

    let query = supabase.from('adventures').select('id, name');
    if (adventureId) query = query.eq('id', adventureId);
    const { data: adventures, error: advError } = await query;
    if (advError) throw new Error(advError.message);

    const results = [];

    for (const adventure of adventures ?? []) {
      const { data: characters } = await supabase
        .from('characters')
        .select('id, character_name, neople_character_id, neople_server_id')
        .eq('adventure_id', adventure.id)
        .not('neople_character_id', 'is', null)
        .not('neople_server_id', 'is', null);

      const dropLogs: any[] = [];
      const charDebug: any[] = [];

      for (const char of characters ?? []) {
        const { data: lastLog } = await supabase
          .from('gear_drop_logs')
          .select('dropped_at')
          .eq('neople_character_id', char.neople_character_id)
          .order('dropped_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const startDate = lastLog?.dropped_at
          ? formatNeopleDate(new Date(lastLog.dropped_at))
          : SEASON_START;

        const items = await fetchCharacterDrops(
          char.neople_server_id,
          char.neople_character_id,
          startDate,
          endDate,
          apiKey
        );

        charDebug.push({ name: char.character_name, startDate, dropsFound: items.length });

        for (const item of items) {
          const droppedAt = new Date(item.date);
          const weekKey = getWeekKeyForDate(droppedAt);
          const itemType = getItemType(item.itemRarity, item.code, item.itemName);
          if (!itemType) continue;

          dropLogs.push({
            adventure_id: adventure.id,
            character_id: char.id,
            neople_character_id: char.neople_character_id,
            item_id: item.itemId,
            item_name: item.itemName,
            item_rarity: item.itemRarity,
            timeline_code: item.code,
            dropped_at: droppedAt.toISOString(),
            week_key: weekKey,
          });
        }
      }

      if (dropLogs.length > 0) {
        const { error: upsertError } = await supabase
          .from('gear_drop_logs')
          .upsert(dropLogs, { onConflict: 'neople_character_id, item_id, dropped_at' });
        if (upsertError) console.error('upsert error:', upsertError.message);
      }

      // 전체 로그 기반 주차별 점수 재계산
      const { data: allLogs } = await supabase
        .from('gear_drop_logs')
        .select('item_rarity, item_name, timeline_code, week_key')
        .eq('adventure_id', adventure.id);

      const weekGroups: Record<string, { rc: number; rk: number; r: number; e: number }> = {};
      for (const log of allLogs ?? []) {
        const type = getItemType(log.item_rarity, log.timeline_code, log.item_name);
        if (!type) continue;
        if (!weekGroups[log.week_key]) weekGroups[log.week_key] = { rc: 0, rk: 0, r: 0, e: 0 };
        if (type === 'relic_covenant') weekGroups[log.week_key].rc++;
        else if (type === 'relic_crystal') weekGroups[log.week_key].rk++;
        else if (type === 'relic') weekGroups[log.week_key].r++;
        else if (type === 'epic') weekGroups[log.week_key].e++;
      }

      for (const [wk, c] of Object.entries(weekGroups)) {
        await supabase
          .from('gear_weekly_scores')
          .upsert(
            {
              adventure_id: adventure.id,
              week_key: wk,
              relic_covenant_count: c.rc,
              relic_crystal_count: c.rk,
              relic_count: c.r,
              epic_count: c.e,
              total_score: calculateScore(c.rc, c.rk, c.r, c.e),
              snapshot_at: new Date().toISOString(),
            },
            { onConflict: 'adventure_id, week_key' }
          );
      }

      results.push({
        adventure: adventure.name,
        charactersChecked: charDebug.length,
        totalDropsFound: dropLogs.length,
        charDebug,
      });
    }

    return NextResponse.json({ success: true, endDate, results });
  } catch (err: any) {
    console.error('gear-sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
