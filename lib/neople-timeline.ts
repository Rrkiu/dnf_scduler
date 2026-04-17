// 타임라인 코드
// 일반 아이템: 504(항아리), 505(던전드랍), 507(레이드카드), 513(던전카드)
// 서약/서약결정: 550(던전드랍), 551(레이드카드), 552(항아리) — 554(제작서)는 제외
const DROP_CODES = [504, 505, 507, 513, 550, 551, 552, 557];
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
