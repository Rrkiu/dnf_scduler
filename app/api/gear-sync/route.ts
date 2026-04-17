import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchCharacterDrops } from '@/lib/neople-timeline';
import {
  getWeekKeyForDate, calculateScore, formatNeopleDate,
  SEASON_START, getItemType, emptyCounts, WeekCounts,
} from '@/lib/gear-week';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const CONCURRENCY = 4;

async function processInParallel<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map(fn));
    results.push(...settled);
  }
  return results;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { adventureId, force } = body;

    if (!adventureId) {
      return NextResponse.json({ error: 'adventureId 필수' }, { status: 400 });
    }

    const apiKey = process.env.NEOPLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'NEOPLE_API_KEY 미설정' }, { status: 500 });

    const endDate = formatNeopleDate(new Date());

    const { data: adventure, error: advError } = await supabase
      .from('adventures')
      .select('id, name')
      .eq('id', adventureId)
      .single();
    if (advError || !adventure) throw new Error(advError?.message ?? '모험단 없음');

    const { data: characters } = await supabase
      .from('characters')
      .select('id, character_name, neople_character_id, neople_server_id')
      .eq('adventure_id', adventure.id)
      .not('neople_character_id', 'is', null)
      .not('neople_server_id', 'is', null);

    if (!characters || characters.length === 0) {
      return NextResponse.json({ success: true, adventure: adventure.name, totalDropsFound: 0 });
    }

    // ② lastLog 배치 쿼리 — 캐릭터마다 개별 조회 대신 한 번에
    const { data: lastLogs } = await supabase
      .from('gear_drop_logs')
      .select('neople_character_id, dropped_at')
      .eq('adventure_id', adventure.id)
      .order('dropped_at', { ascending: false });

    const lastLogMap = new Map<string, string>();
    for (const log of lastLogs ?? []) {
      if (!lastLogMap.has(log.neople_character_id)) {
        lastLogMap.set(log.neople_character_id, log.dropped_at);
      }
    }

    // ③ 캐릭터 API 호출 병렬화
    const charDebug: any[] = [];
    const dropLogs: any[] = [];

    const settled = await processInParallel(characters, async (char) => {
      const lastDroppedAt = lastLogMap.get(char.neople_character_id);
      const startDate = (!force && lastDroppedAt)
        ? formatNeopleDate(new Date(lastDroppedAt))
        : SEASON_START;

      const items = await fetchCharacterDrops(
        char.neople_server_id,
        char.neople_character_id,
        startDate,
        endDate,
        apiKey
      );

      return { char, startDate, items };
    }, CONCURRENCY);

    for (const result of settled) {
      if (result.status === 'rejected') {
        console.error('character fetch error:', result.reason);
        continue;
      }
      const { char, startDate, items } = result.value;
      charDebug.push({ name: char.character_name, startDate, dropsFound: items.length });

      for (const item of items) {
        const droppedAt = new Date(item.date);
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
          week_key: getWeekKeyForDate(droppedAt),
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

    const weekGroups: Record<string, WeekCounts> = {};
    for (const log of allLogs ?? []) {
      // Supabase가 BIGINT 컬럼을 문자열로 반환할 수 있으므로 Number()로 명시 변환
      const type = getItemType(log.item_rarity, Number(log.timeline_code), log.item_name);
      if (!type) continue;
      if (!weekGroups[log.week_key]) weekGroups[log.week_key] = emptyCounts();
      weekGroups[log.week_key][type]++;
    }

    for (const [wk, c] of Object.entries(weekGroups)) {
      const { error: scoreUpsertError } = await supabase
        .from('gear_weekly_scores')
        .upsert(
          {
            adventure_id: adventure.id,
            week_key: wk,
            covenant_relic_count: c.covenant_relic,
            covenant_epic_count:  c.covenant_epic,
            crystal_relic_count:  c.crystal_relic,
            crystal_epic_count:   c.crystal_epic,
            item_relic_count:     c.item_relic,
            item_epic_count:      c.item_epic,
            total_score: calculateScore(c),
            snapshot_at: new Date().toISOString(),
          },
          { onConflict: 'adventure_id, week_key' }
        );
      if (scoreUpsertError) {
        console.error(`[gear-sync] score upsert error (${wk}):`, scoreUpsertError.message);
      }
    }

    return NextResponse.json({
      success: true,
      adventure: adventure.name,
      charactersChecked: charDebug.length,
      totalDropsFound: dropLogs.length,
      charDebug,
    });
  } catch (err: any) {
    console.error('gear-sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
