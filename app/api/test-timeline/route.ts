import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 테스트용 엔드포인트 — 타임라인 응답 구조 확인
// 사용법: GET /api/test-timeline?serverId=cain&characterId=xxx
// 선택: &code=101,102 (특정 코드만 필터) &limit=10

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serverId    = searchParams.get('serverId');
  const characterId = searchParams.get('characterId');
  const code        = searchParams.get('code') ?? '';
  const limit       = searchParams.get('limit') ?? '10';
  const startDate   = searchParams.get('startDate') ?? '';
  const endDate     = searchParams.get('endDate') ?? '';

  if (!serverId || !characterId) {
    return NextResponse.json(
      { error: 'serverId, characterId 필수입니다.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEOPLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NEOPLE_API_KEY 미설정' }, { status: 500 });
  }

  const params = new URLSearchParams({ apikey: apiKey, limit });
  if (code)      params.set('code', code);
  if (startDate) params.set('startDate', startDate);
  if (endDate)   params.set('endDate', endDate);

  const url = `https://api.neople.co.kr/df/servers/${serverId}/characters/${characterId}/timeline?${params}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    // 코드별 종류 요약 — 어떤 코드가 어떤 이벤트인지 파악용
    const rows = data?.timeline?.rows ?? [];
    const codeSummary: Record<string, { name: string; count: number; sample: any }> = {};
    for (const row of rows) {
      const key = String(row.code);
      if (!codeSummary[key]) {
        codeSummary[key] = { name: row.name ?? '', count: 0, sample: row.data ?? null };
      }
      codeSummary[key].count++;
    }

    return NextResponse.json({
      characterId: data.characterId,
      characterName: data.characterName,
      next: data.timeline?.next ?? null,
      totalRows: rows.length,
      codeSummary,   // 어떤 code가 무슨 이벤트인지 요약
      rows,          // 전체 원본 rows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
