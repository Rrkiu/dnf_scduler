'use client';

import { useState } from 'react';

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

interface AdventureCardProps {
  name: string;
  characters: Character[];
}

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

export default function AdventureCard({ name, characters }: AdventureCardProps) {
  const [open, setOpen] = useState(false);

  const dealers = characters.filter(c => c.role === 'dealer').length;
  const buffers = characters.filter(c => c.role === 'buffer').length;
  const avgFame = characters.length
    ? Math.round(characters.reduce((s, c) => s + c.fame, 0) / characters.length)
    : 0;
  const oathTotal = characters.reduce((sum, c) => sum + (c.oathSetPoint ?? 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* 헤더 — 클릭으로 토글 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{characters.length}명 (딜{dealers} / 버{buffers})</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">평균 명성 {avgFame.toLocaleString('en-US')}</span>
          <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">서약 합계 {oathTotal.toLocaleString('en-US')}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 캐릭터 목록 */}
      {open && (
        characters.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">캐릭터 없음</p>
        ) : (
          <>
            {/* 모바일: 카드 리스트 */}
            <ul className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {characters.map(c => (
                <li key={c.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.character_name}</span>
                      <span className={`shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        c.role === 'dealer'
                          ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20'
                          : 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20'
                      }`}>{c.role}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{c.job} · 명성 {c.fame.toLocaleString('en-US')}</div>
                    {c.oathSetName && c.oathSetRarityName ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetName}</span>
                        <span className={`text-xs font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetRarityName}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {c.oathSetPoint !== null ? (
                      <span className={`text-sm font-semibold ${getRarityColor(c.oathSetRarityName ?? '')}`}>
                        {c.oathSetPoint.toLocaleString('en-US')}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xs italic">-</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* 데스크탑: 테이블 */}
            <table className="hidden sm:table min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-2 text-left font-medium">캐릭터</th>
                  <th className="px-3 py-2 text-left font-medium">직업</th>
                  <th className="px-3 py-2 text-left font-medium">역할</th>
                  <th className="px-3 py-2 text-left font-medium">명성</th>
                  <th className="px-3 py-2 text-left font-medium">서약 세트</th>
                  <th className="px-5 py-2 text-right font-medium">서약 포인트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {characters.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{c.character_name}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.job}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        c.role === 'dealer'
                          ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20'
                          : 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20'
                      }`}>{c.role}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{c.fame.toLocaleString('en-US')}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {c.oathSetName && c.oathSetRarityName ? (
                        <span className="flex items-center gap-1.5">
                          <span className={`text-sm font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetName}</span>
                          <span className={`text-xs font-semibold ${getRarityColor(c.oathSetRarityName)}`}>{c.oathSetRarityName}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {c.oathSetPoint !== null ? (
                        <span className={`font-semibold ${getRarityColor(c.oathSetRarityName ?? '')}`}>
                          {c.oathSetPoint.toLocaleString('en-US')}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )
      )}
    </div>
  );
}
