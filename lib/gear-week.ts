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

export function calculateScore(relicCount: number, epicCount: number): number {
  const base = relicCount * 100 + epicCount * 10;
  const bonus = relicCount + epicCount >= 2 ? Math.floor(base * 0.5) : 0;
  return base + bonus;
}
