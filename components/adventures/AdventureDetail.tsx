'use client';

import { useState } from 'react';
import { formatWeekLabel, HELL_DROP_MULTIPLIERS } from '@/lib/gear-week';

const RARITY_COLOR: Record<string, string> = {
  '태초':     'text-cyan-700 dark:text-cyan-400',
  '에픽':     'text-yellow-600 dark:text-yellow-400',
  '레전더리': 'text-amber-700 dark:text-amber-500',
  '유니크':   'text-pink-500 dark:text-pink-400',
  '레어':     'text-purple-600 dark:text-purple-400',
};

function getRarityColor(name: string): string {
  for (const rarity of ['태초', '에픽', '레전더리', '유니크', '레어']) {
    if (name.includes(rarity)) return RARITY_COLOR[rarity] ?? '';
  }
  return 'text-gray-500 dark:text-gray-400';
}

interface Character {
  id: string;
  character_name: string;
  job: string;
  role: 'dealer' | 'buffer';
  fame: number;
  oathSetName: string | null;
  oathSetRarityName: string | null;
  oathSetPoint: number | null;
}

interface AdventureDetailProps {
  adventureId: string;
  adventureName: string;
  characters: Character[];
  completedWeeks: string[];
  hellEntries: Record<string, number>;   // week_key → entry_count
  weekScores: Record<string, any>;       // week_key → gear_weekly_scores row
}

type Tab = 'oath' | 'hell';

export default function AdventureDetail({
  adventureId, adventureName, characters,
  completedWeeks, hellEntries: initialHellEntries, weekScores,
}: AdventureDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('oath');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'oath', label: '서약 현황' },
    { key: 'hell', label: '헬 드랍률' },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'oath' && <OathTab characters={characters} />}
        {activeTab === 'hell' && (
          <HellTab
            adventureId={adventureId}
            completedWeeks={completedWeeks}
            initialHellEntries={initialHellEntries}
            weekScores={weekScores}
          />
        )}
      </div>
    </div>
  );
}

// ─── 서약 현황 탭 ───────────────────────────────────────────────────────────

function OathTab({ characters }: { characters: Character[] }) {
  if (!characters.length) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">캐릭터 없음</p>;
  }

  const oathTotal = characters.reduce((sum, c) => sum + (c.oathSetPoint ?? 0), 0);

  return (
    <div>
      {/* 모바일 */}
      <ul className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {characters.map(c => (
          <li key={c.id} className="py-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.character_name}</span>
                <RoleBadge role={c.role} />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{c.job} · 명성 {c.fame.toLocaleString('en-US')}</div>
              {c.oathSetName && c.oathSetRarityName && (
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-xs font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetName}</span>
                  <span className={`text-xs font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetRarityName}</span>
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              {c.oathSetPoint !== null ? (
                <span className={`text-sm font-semibold ${getRarityColor(c.oathSetRarityName ?? '')}`}>
                  {c.oathSetPoint.toLocaleString('en-US')}
                </span>
              ) : <Dash />}
            </div>
          </li>
        ))}
      </ul>

      {/* 데스크탑 */}
      <table className="hidden sm:table min-w-full divide-y divide-gray-100 dark:divide-gray-700">
        <thead>
          <tr className="text-xs text-gray-500 dark:text-gray-400">
            <th className="py-2 pr-3 text-left font-medium">캐릭터</th>
            <th className="px-3 py-2 text-left font-medium">직업</th>
            <th className="px-3 py-2 text-left font-medium">역할</th>
            <th className="px-3 py-2 text-left font-medium">명성</th>
            <th className="px-3 py-2 text-left font-medium">서약 세트</th>
            <th className="pl-3 py-2 text-right font-medium">서약 포인트</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {characters.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm">
              <td className="py-3 pr-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{c.character_name}</td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.job}</td>
              <td className="px-3 py-3 whitespace-nowrap"><RoleBadge role={c.role} /></td>
              <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.fame.toLocaleString('en-US')}</td>
              <td className="px-3 py-3 whitespace-nowrap">
                {c.oathSetName && c.oathSetRarityName ? (
                  <span className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetName}</span>
                    <span className={`text-xs font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetRarityName}</span>
                  </span>
                ) : <Dash />}
              </td>
              <td className="pl-3 py-3 text-right whitespace-nowrap">
                {c.oathSetPoint !== null ? (
                  <span className={`font-semibold ${getRarityColor(c.oathSetRarityName ?? '')}`}>
                    {c.oathSetPoint.toLocaleString('en-US')}
                  </span>
                ) : <Dash />}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-sm border-t-2 border-gray-200 dark:border-gray-600">
            <td colSpan={5} className="py-2 pr-3 text-right text-xs text-gray-500 dark:text-gray-400 font-medium">합계</td>
            <td className="pl-3 py-2 text-right font-bold text-cyan-700 dark:text-cyan-400">{oathTotal.toLocaleString('en-US')}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── 헬 드랍률 탭 ───────────────────────────────────────────────────────────

interface HellTabProps {
  adventureId: string;
  completedWeeks: string[];
  initialHellEntries: Record<string, number>;
  weekScores: Record<string, any>;
}

function HellTab({ adventureId, completedWeeks, initialHellEntries, weekScores }: HellTabProps) {
  const [hellEntries, setHellEntries] = useState<Record<string, number>>(initialHellEntries);
  const [selectedWeek, setSelectedWeek] = useState<string>(completedWeeks[0] ?? '');
  const [inputValue, setInputValue] = useState<string>(
    completedWeeks[0] ? String(initialHellEntries[completedWeeks[0]] ?? '') : ''
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (completedWeeks.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 italic py-6 text-center">
        아직 완료된 주차가 없습니다.
      </p>
    );
  }

  const handleWeekChange = (week: string) => {
    setSelectedWeek(week);
    setInputValue(String(hellEntries[week] ?? ''));
    setSaveError(null);
  };

  const handleSave = async () => {
    const count = parseInt(inputValue, 10);
    if (isNaN(count) || count < 0) {
      setSaveError('0 이상의 정수를 입력하세요.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/adventure-hell-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adventureId, weekKey: selectedWeek, entryCount: count }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '저장 실패');
      setHellEntries(prev => ({ ...prev, [selectedWeek]: count }));
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const entryCount = hellEntries[selectedWeek] ?? null;
  const scores = weekScores[selectedWeek] ?? null;

  const categories = [
    { label: '서약',      relicKey: 'covenant_relic_count', epicKey: 'covenant_epic_count', multiplier: HELL_DROP_MULTIPLIERS.covenant },
    { label: '서약 결정', relicKey: 'crystal_relic_count',  epicKey: 'crystal_epic_count',  multiplier: HELL_DROP_MULTIPLIERS.crystal },
    { label: '장비',      relicKey: 'item_relic_count',     epicKey: 'item_epic_count',     multiplier: HELL_DROP_MULTIPLIERS.item },
  ];

  const effectiveRuns = (multiplier: number) =>
    entryCount !== null ? entryCount * multiplier : null;

  const dropRate = (count: number, runs: number | null) => {
    if (runs === null || runs === 0) return null;
    return (count / runs) * 100;
  };

  return (
    <div className="space-y-5">
      {/* 주차 선택 + 입장 횟수 입력 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">주차 선택</label>
          <select
            value={selectedWeek}
            onChange={e => handleWeekChange(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {completedWeeks.map(w => {
              const hasEntry = hellEntries[w] != null;
              return (
                <option key={w} value={w}>
                  {formatWeekLabel(w)}{hasEntry ? '' : ' (미입력)'}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">헬던전 입장 횟수</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="0"
              className="w-24 text-sm border border-gray-200 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">회</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {saveError && <p className="text-xs text-red-500">{saveError}</p>}

      {/* 드랍률 테이블 */}
      {entryCount === null || scores === null ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
          {entryCount === null ? '입장 횟수를 입력하면 드랍률이 표시됩니다.' : '해당 주차의 드랍 기록이 없습니다.'}
        </p>
      ) : (
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            총 입장 {entryCount.toLocaleString('en-US')}회 기준
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-2.5 text-left font-medium">카테고리</th>
                  <th className="px-4 py-2.5 text-center font-medium">
                    <span className={RARITY_COLOR['태초']}>태초</span> 드랍수
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium">
                    <span className={RARITY_COLOR['태초']}>태초</span> 드랍률
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium">
                    <span className={RARITY_COLOR['에픽']}>에픽</span> 드랍수
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium">
                    <span className={RARITY_COLOR['에픽']}>에픽</span> 드랍률
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {categories.map(cat => {
                  const relicCount = scores[cat.relicKey] ?? 0;
                  const epicCount  = scores[cat.epicKey]  ?? 0;
                  const runs = effectiveRuns(cat.multiplier);
                  const relicRate = dropRate(relicCount, runs);
                  const epicRate  = dropRate(epicCount,  runs);

                  return (
                    <tr key={cat.label} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{cat.label}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${RARITY_COLOR['태초']}`}>{relicCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {relicRate !== null ? (
                          <span className={`font-semibold ${RARITY_COLOR['태초']}`}>{relicRate.toFixed(1)}%</span>
                        ) : <Dash />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${RARITY_COLOR['에픽']}`}>{epicCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {epicRate !== null ? (
                          <span className={`font-semibold ${RARITY_COLOR['에픽']}`}>{epicRate.toFixed(1)}%</span>
                        ) : <Dash />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 전체 집계 드랍률 */}
          {(() => {
            const totalRelic = categories.reduce((s, cat) => s + (scores[cat.relicKey] ?? 0), 0);
            const totalEpic  = categories.reduce((s, cat) => s + (scores[cat.epicKey]  ?? 0), 0);
            const totalRelicRate = entryCount > 0 ? (totalRelic / entryCount) * 100 : null;
            const totalEpicRate  = entryCount > 0 ? (totalEpic  / entryCount) * 100 : null;
            return (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                전체 집계 —{' '}
                <span className={`font-semibold ${RARITY_COLOR['태초']}`}>태초</span>{' '}
                {totalRelic}회{totalRelicRate !== null && ` (${totalRelicRate.toFixed(1)}%)`}
                {' · '}
                <span className={`font-semibold ${RARITY_COLOR['에픽']}`}>에픽</span>{' '}
                {totalEpic}회{totalEpicRate !== null && ` (${totalEpicRate.toFixed(1)}%)`}
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── 공통 소형 컴포넌트 ─────────────────────────────────────────────────────

function RoleBadge({ role }: { role: 'dealer' | 'buffer' }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      role === 'dealer'
        ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20'
        : 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20'
    }`}>{role}</span>
  );
}

function Dash() {
  return <span className="text-gray-400 dark:text-gray-600 text-xs italic">-</span>;
}
