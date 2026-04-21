import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * 진단용 API: 특정 캐릭터의 최신 스냅샷 원본을 그대로 반환
 * GET /api/debug-snapshot?characterId=xxx
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'characterId 파라미터 필요' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('character_snapshots')
    .select('*')
    .eq('character_id', characterId)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: '스냅샷 없음' });
  }

  // 각 필드의 존재 여부와 값 길이만 요약하여 반환 (큰 JSON 직접 노출 방지)
  return NextResponse.json({
    snapshot_at: data.snapshot_at,
    columns: {
      equipment:  Array.isArray(data.equipment)  ? `array(${data.equipment.length})`  : String(data.equipment),
      oath:       data.oath  != null             ? 'exists'                           : 'null',
      status:     Array.isArray(data.status)     ? `array(${data.status.length})`     : String(data.status),
      avatar:     Array.isArray(data.avatar)     ? `array(${data.avatar.length})`     : String(data.avatar),
      creature:   data.creature != null          ? JSON.stringify(data.creature).slice(0, 80) + '...' : 'null',
    },
    // 아바타 첫 번째 슬롯 원본 (optionAbility 필드 실제 값 확인용)
    avatar_slot_0: Array.isArray(data.avatar) && data.avatar.length > 0 ? data.avatar[0] : null,
  });
}
