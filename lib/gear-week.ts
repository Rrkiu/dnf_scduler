// 던파 주차 기준: 목요일 10:00 KST ~ 다음 목요일 09:59 KST
// week_key 형식: 'YYYY-MM-DD' (해당 주 목요일 날짜)

export function getCurrentWeekKey(): string {
  return getWeekKeyForDate(new Date());
}

export function getWeekKeyForDate(date: Date): string {
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const kst = new Date(date.getTime() + KST_OFFSET);

  const day = kst.getUTCDay(); // 0=일 ~ 6=토, 4=목
  const hour = kst.getUTCHours();

  // 가장 최근 목요일 10:00 KST 기준으로 며칠 뒤로 갈지 계산
  let daysBack = (day - 4 + 7) % 7;
  if (day === 4 && hour < 10) daysBack = 7; // 목요일이지만 10시 이전이면 전주

  const thursday = new Date(kst);
  thursday.setUTCDate(kst.getUTCDate() - daysBack);

  const y = thursday.getUTCFullYear();
  const m = String(thursday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(thursday.getUTCDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

// 네오플 API 요청용 날짜 범위 반환 (KST 기준 문자열)
export function getWeekDateRange(weekKey: string): { startDate: string; endDate: string } {
  const [y, m, d] = weekKey.split('-').map(Number);

  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${y}${pad(m)}${pad(d)}T1000`;

  const nextThu = new Date(Date.UTC(y, m - 1, d + 7));
  const ny = nextThu.getUTCFullYear();
  const nm = nextThu.getUTCMonth() + 1;
  const nd = nextThu.getUTCDate();
  const endDate = `${ny}${pad(nm)}${pad(nd)}T0959`;

  return { startDate, endDate };
}

export function formatWeekLabel(weekKey: string): string {
  return `${weekKey} (목) 주차`;
}

// 네오플 API 날짜 형식 (KST 기준): YYYYMMDDTHHmm
export function formatNeopleDate(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y  = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d  = String(kst.getUTCDate()).padStart(2, '0');
  const h  = String(kst.getUTCHours()).padStart(2, '0');
  const mi = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${y}${mo}${d}T${h}${mi}`;
}

// 시즌 시작일 (KST)
export const SEASON_START = '20260326T1000';

const COVENANT_CODES = [550, 551, 552];

// 6가지 아이템 분류
// 서약: covenant_relic / covenant_epic
// 서약 결정: crystal_relic / crystal_epic
// 장비: item_relic / item_epic
export type ItemType =
  | 'covenant_relic'
  | 'covenant_epic'
  | 'crystal_relic'
  | 'crystal_epic'
  | 'item_relic'
  | 'item_epic';

export function getItemType(itemRarity: string, timelineCode: number, itemName: string): ItemType | null {
  const isCovenant = COVENANT_CODES.includes(timelineCode);
  const isCrystal  = isCovenant && itemName.includes('결정');
  const isCovOnly  = isCovenant && !itemName.includes('결정');

  if (itemRarity === '태초') {
    if (isCrystal)  return 'crystal_relic';
    if (isCovOnly)  return 'covenant_relic';
    return 'item_relic';
  }
  if (itemRarity === '에픽') {
    if (isCrystal)  return 'crystal_epic';
    if (isCovOnly)  return 'covenant_epic';
    return 'item_epic';
  }
  return null;
}

// 아이템 종류별 점수 (에픽은 종류 무관 10점)
export const ITEM_SCORES: Record<ItemType, number> = {
  covenant_relic: 300,
  crystal_relic:  100,
  item_relic:      50,
  covenant_epic:   10,
  crystal_epic:    10,
  item_epic:       10,
};

export interface WeekCounts {
  covenant_relic: number;
  covenant_epic:  number;
  crystal_relic:  number;
  crystal_epic:   number;
  item_relic:     number;
  item_epic:      number;
}

export function emptyCounts(): WeekCounts {
  return { covenant_relic: 0, covenant_epic: 0, crystal_relic: 0, crystal_epic: 0, item_relic: 0, item_epic: 0 };
}

export function calculateScore(counts: WeekCounts): number {
  return (
    counts.covenant_relic * ITEM_SCORES.covenant_relic +
    counts.crystal_relic  * ITEM_SCORES.crystal_relic  +
    counts.item_relic     * ITEM_SCORES.item_relic     +
    counts.covenant_epic  * ITEM_SCORES.covenant_epic  +
    counts.crystal_epic   * ITEM_SCORES.crystal_epic   +
    counts.item_epic      * ITEM_SCORES.item_epic
  );
}
