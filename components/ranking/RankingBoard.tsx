'use client';

import { useState } from 'react';
import { formatWeekLabel } from '@/lib/gear-week';

interface WeekScore {
  adventure_id: string;
  week_key: string;
  covenant_relic_count: number;
  covenant_epic_count: number;
  crystal_relic_count: number;
  crystal_epic_count: number;
  item_relic_count: number;
  item_epic_count: number;
  total_score: number;
}

interface DropLog {
  id: string;
  adventure_id: string;
  character_id: string;
  item_name: string;
  item_rarity: string;
  timeline_code: number;
  dropped_at: string;
  characters: { character_name: string } | null;
}

const COVENANT_CODES = [550, 551, 552];

function getItemCategory(timelineCode: number, itemName: string): { label: string; className: string } {
  if (COVENANT_CODES.includes(timelineCode)) {
    if (itemName.includes('결정')) {
      return { label: '서약결정', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: '서약', className: 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-300' };
  }
  return { label: '장비', className: 'bg-gray-100 text-gray-600' };
}

interface Adventure {
  id: string;
  name: string;
}

interface RankingBoardProps {
  adventures: Adventure[];
  currentWeekKey: string;
  weekScores: WeekScore[];
  recentScores: WeekScore[];
  dropLogs: DropLog[];
}

function getBadges(adventureId: string, currentWeekKey: string, allScores: WeekScore[]): string[] {
  const advScores = allScores
    .filter(s => s.adventure_id === adventureId)
    .sort((a, b) => b.week_key.localeCompare(a.week_key));

  const current = advScores.find(s => s.week_key === currentWeekKey);
  const badges: string[] = [];

  if (!current || current.total_score === 0) {
    const recent = advScores.filter(s => s.week_key <= currentWeekKey).slice(0, 3);
    if (recent.length >= 3 && recent.every(s => s.total_score === 0)) {
      badges.push('💀 불운의 아이콘');
    }
    return badges;
  }

  const totalRelics = (current.covenant_relic_count ?? 0) + (current.crystal_relic_count ?? 0) + (current.item_relic_count ?? 0);
  const totalEpics  = (current.covenant_epic_count ?? 0) + (current.crystal_epic_count ?? 0) + (current.item_epic_count ?? 0);

  if (totalRelics >= 2) badges.push('🎰 대박');
  if (totalRelics >= 1 && totalEpics >= 3) badges.push('⚡ 행운아');

  const recent3 = advScores.filter(s => s.week_key <= currentWeekKey).slice(0, 3);
  if (recent3.length === 3 && recent3.every(s => s.total_score > 0)) {
    badges.push('🔥 연속 드랍');
  }

  return badges;
}

// 최근 8주 week_key 목록 (내림차순)
function getRecentWeekKeys(scores: WeekScore[]): string[] {
  return [...new Set(scores.map(s => s.week_key))].sort((a, b) => b.localeCompare(a)).slice(0, 8);
}

export default function RankingBoard({
  adventures,
  currentWeekKey,
  weekScores,
  recentScores,
  dropLogs,
}: RankingBoardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [selectedAdventureId, setSelectedAdventureId] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    setSyncProgress(null);

    const results: string[] = [];
    try {
      for (let i = 0; i < adventures.length; i++) {
        const adv = adventures[i];
        setSyncProgress(`(${i + 1}/${adventures.length}) ${adv.name} 갱신 중...`);

        const res = await fetch('/api/gear-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adventureId: adv.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          results.push(`${adv.name}: 오류 (${data.error})`);
        } else {
          results.push(`${adv.name}: ${data.totalDropsFound}개`);
        }
      }
      setSyncMsg(`갱신 완료 — ${results.join(' / ')}`);
      window.location.reload();
    } catch (err: any) {
      setSyncMsg(`오류: ${err.message}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // 이번 주 랭킹 정렬
  const ranked = adventures
    .map(adv => {
      const score = weekScores.find(s => s.adventure_id === adv.id);
      return {
        ...adv,
        covenantRelicCount: score?.covenant_relic_count ?? 0,
        covenantEpicCount:  score?.covenant_epic_count ?? 0,
        crystalRelicCount:  score?.crystal_relic_count ?? 0,
        crystalEpicCount:   score?.crystal_epic_count ?? 0,
        itemRelicCount:     score?.item_relic_count ?? 0,
        itemEpicCount:      score?.item_epic_count ?? 0,
        totalScore:         score?.total_score ?? 0,
        badges: getBadges(adv.id, currentWeekKey, recentScores),
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const weekKeys = getRecentWeekKeys(recentScores);

  const selectedDrops = selectedAdventureId
    ? dropLogs.filter(l => l.adventure_id === selectedAdventureId)
    : [];

  return (
    <div className="flex flex-col gap-6">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">이번 주 랭킹</h2>
          <p className="text-sm text-gray-500 mt-0.5">{formatWeekLabel(currentWeekKey)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
          >
            {isSyncing ? '갱신 중...' : '드랍 데이터 갱신'}
          </button>
          {syncProgress && <p className="text-xs text-blue-500">{syncProgress}</p>}
          {!syncProgress && syncMsg && <p className="text-xs text-gray-500">{syncMsg}</p>}
        </div>
      </div>

      {/* 랭킹 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">모험단</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-cyan-500 uppercase">서약<br/>태초</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-cyan-400 uppercase">결정<br/>태초</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-orange-500 uppercase">서약<br/>에픽</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-orange-400 uppercase">결정<br/>에픽</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-cyan-300 uppercase">장비<br/>태초</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-orange-300 uppercase">장비<br/>에픽</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">점수</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">칭호</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranked.map((adv, i) => {
              const hasCovRelic = adv.covenantRelicCount > 0;
              const rowBg = selectedAdventureId === adv.id
                ? 'bg-blue-50'
                : hasCovRelic
                  ? 'bg-cyan-50 hover:bg-cyan-100'
                  : 'hover:bg-gray-50';
              return (
              <tr
                key={adv.id}
                className={`cursor-pointer transition-colors ${rowBg}`}
                onClick={() => setSelectedAdventureId(selectedAdventureId === adv.id ? null : adv.id)}
              >
                <td className="px-4 py-4 text-sm font-bold text-gray-400">{i + 1}</td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">{adv.name}</td>

                {/* 서약 태초 — 채운 배지 + 글로우 */}
                <td className="px-4 py-4 text-center">
                  {adv.covenantRelicCount > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-sm font-black bg-cyan-500 text-white ring-2 ring-cyan-300 shadow-sm shadow-cyan-300">
                      {adv.covenantRelicCount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-200">—</span>
                  )}
                </td>

                {/* 결정 태초 — pill 배지 */}
                <td className="px-4 py-4 text-center">
                  {adv.crystalRelicCount > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-sm font-bold bg-cyan-100 text-cyan-700">
                      {adv.crystalRelicCount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-200">—</span>
                  )}
                </td>

                {/* 서약 에픽 — 채운 배지 + 테두리 */}
                <td className="px-4 py-4 text-center">
                  {adv.covenantEpicCount > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-sm font-black bg-orange-500 text-white ring-1 ring-orange-300">
                      {adv.covenantEpicCount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-200">—</span>
                  )}
                </td>

                {/* 결정 에픽 — pill 배지 */}
                <td className="px-4 py-4 text-center">
                  {adv.crystalEpicCount > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                      {adv.crystalEpicCount}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-200">—</span>
                  )}
                </td>

                {/* 장비 태초 — 텍스트만 */}
                <td className="px-4 py-4 text-center">
                  <span className={`text-sm font-bold ${adv.itemRelicCount > 0 ? 'text-cyan-500' : 'text-gray-200'}`}>
                    {adv.itemRelicCount > 0 ? adv.itemRelicCount : '—'}
                  </span>
                </td>

                {/* 장비 에픽 — 텍스트만 */}
                <td className="px-4 py-4 text-center">
                  <span className={`text-sm font-bold ${adv.itemEpicCount > 0 ? 'text-orange-500' : 'text-gray-200'}`}>
                    {adv.itemEpicCount > 0 ? adv.itemEpicCount : '—'}
                  </span>
                </td>

                <td className="px-4 py-4 text-center">
                  <span className={`text-sm font-bold ${adv.totalScore > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                    {adv.totalScore.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm">{adv.badges.join(' ')}</td>
              </tr>
              );
            })}
            {ranked.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                  이번 주 데이터가 없습니다. 갱신 버튼을 눌러주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 드랍 상세 */}
      {selectedAdventureId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">
              {adventures.find(a => a.id === selectedAdventureId)?.name} — 이번 주 드랍 내역
            </h3>
          </div>
          {selectedDrops.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">이번 주 드랍 기록 없음</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">캐릭터</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">아이템</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">등급</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">항목</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">획득 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedDrops
                  .sort((a, b) => new Date(b.dropped_at).getTime() - new Date(a.dropped_at).getTime())
                  .map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-700">{log.characters?.character_name ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">{log.item_name}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          log.item_rarity === '태초'
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {log.item_rarity}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {(() => {
                          const cat = getItemCategory(log.timeline_code, log.item_name);
                          return (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cat.className}`}>
                              {cat.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-400">{log.dropped_at.slice(0, 16).replace('T', ' ')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 주간 추이 */}
      {weekKeys.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-4">주간 점수 추이 (최근 {weekKeys.length}주)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="pr-4 py-1 text-left text-gray-500 font-medium whitespace-nowrap">모험단</th>
                  {weekKeys.map(wk => (
                    <th key={wk} className="px-2 py-1 text-center text-gray-400 font-normal whitespace-nowrap">
                      {wk.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adventures.map(adv => (
                  <tr key={adv.id}>
                    <td className="pr-4 py-2 font-semibold text-gray-700 whitespace-nowrap">{adv.name}</td>
                    {weekKeys.map(wk => {
                      const s = recentScores.find(sc => sc.adventure_id === adv.id && sc.week_key === wk);
                      const score = s?.total_score ?? 0;
                      const relics = (s?.covenant_relic_count ?? 0) + (s?.crystal_relic_count ?? 0) + (s?.item_relic_count ?? 0);
                      return (
                        <td key={wk} className="px-2 py-2 text-center">
                          {score > 0 ? (
                            <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                              relics > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {score}
                            </span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
