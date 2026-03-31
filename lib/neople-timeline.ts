// 타임라인 코드: 아이템 드랍만 수집 (업그레이드/서약 제외)
const DROP_CODES = [504, 505, 507, 513];
const SCORE_RARITIES = ['태초', '에픽'];
const MAX_PAGES = 10;

export interface TimelineItem {
  code: number;
  date: string;
  itemId: string;
  itemName: string;
  itemRarity: string;
}

export async function fetchCharacterDrops(
  serverId: string,
  characterId: string,
  startDate: string,
  endDate: string,
  apiKey: string
): Promise<TimelineItem[]> {
  const results: TimelineItem[] = [];
  let next: string | null = null;
  let page = 0;

  do {
    const params = new URLSearchParams({
      apikey: apiKey,
      limit: '100',
      code: DROP_CODES.join(','),
    });

    if (next) {
      params.set('next', next);
    } else {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }

    const url = `https://api.neople.co.kr/df/servers/${serverId}/characters/${characterId}/timeline?${params}`;

    try {
      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      const rows: any[] = data?.timeline?.rows ?? [];

      for (const row of rows) {
        if (!DROP_CODES.includes(row.code)) continue;
        if (!row.data?.itemId) continue;
        if (!SCORE_RARITIES.includes(row.data?.itemRarity)) continue;

        results.push({
          code: row.code,
          date: row.date,
          itemId: row.data.itemId,
          itemName: row.data.itemName,
          itemRarity: row.data.itemRarity,
        });
      }

      next = data?.timeline?.next ?? null;
      page++;
    } catch {
      break;
    }
  } while (next && page < MAX_PAGES);

  return results;
}
