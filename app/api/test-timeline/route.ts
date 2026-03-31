import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 테스트용 엔드포인트 — 타임라인 응답 구조 확인
// 사용법 (캐릭터명으로 조회 — 서버 자동):
//   GET /api/test-timeline?characterName=캐릭터명
// 사용법 (직접 지정):
//   GET /api/test-timeline?serverId=cain&neopleCharacterId=xxx
// 선택: &code=504,505 &limit=10 &startDate=20260101T0000 &endDate=20260401T2359

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const characterName     = searchParams.get('characterName');
  const manualServerId    = searchParams.get('serverId');
  const manualCharacterId = searchParams.get('neopleCharacterId');
  const code              = searchParams.get('code') ?? '';
  const limit             = searchParams.get('limit') ?? '10';
  const startDate         = searchParams.get('startDate') ?? '';
  const endDate           = searchParams.get('endDate') ?? '';

  const apiKey = process.env.NEOPLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NEOPLE_API_KEY 미설정' }, { status: 500 });
  }

  let serverId: string;
  let neopleCharacterId: string;
  let dbCharacterName: string | null = null;

  if (characterName) {
    // DB에서 캐릭터명으로 서버/ID 자동 조회
    const { data, error } = await supabase
      .from('characters')
      .select('character_name, neople_character_id, neople_server_id')
      .ilike('character_name', characterName)
      .not('neople_character_id', 'is', null)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `'${characterName}' 캐릭터를 찾을 수 없거나 neople ID가 미등록 상태입니다. 먼저 모험단 갱신을 실행해주세요.` },
        { status: 404 }
      );
    }

    serverId = data.neople_server_id;
    neopleCharacterId = data.neople_character_id;
    dbCharacterName = data.character_name;
  } else if (manualServerId && manualCharacterId) {
    serverId = manualServerId;
    neopleCharacterId = manualCharacterId;
  } else {
    return NextResponse.json(
      { error: 'characterName 또는 (serverId + neopleCharacterId) 중 하나를 입력해주세요.' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({ apikey: apiKey, limit });
  if (code)      params.set('code', code);
  if (startDate) params.set('startDate', startDate);
  if (endDate)   params.set('endDate', endDate);

  const url = `https://api.neople.co.kr/df/servers/${serverId}/characters/${neopleCharacterId}/timeline?${params}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

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
      resolvedFrom: dbCharacterName ? `DB (${dbCharacterName})` : '직접 입력',
      usedServerId: serverId,
      usedCharacterId: neopleCharacterId,
      characterName: data.characterName,
      next: data.timeline?.next ?? null,
      totalRows: rows.length,
      codeSummary,
      rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
