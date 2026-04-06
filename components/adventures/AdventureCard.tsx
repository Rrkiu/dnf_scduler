'use client';

import Link from 'next/link';

interface AdventureCardProps {
  id: string;
  name: string;
  characterCount: number;
  dealerCount: number;
  bufferCount: number;
  avgFame: number;
  oathTotal: number;
}

export default function AdventureCard({
  id, name, characterCount, dealerCount, bufferCount, avgFame, oathTotal,
}: AdventureCardProps) {
  return (
    <Link
      href={`/adventures/${id}`}
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{characterCount}명 (딜{dealerCount} / 버{bufferCount})</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">평균 명성 {avgFame.toLocaleString('en-US')}</span>
          <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">서약 합계 {oathTotal.toLocaleString('en-US')}</span>
        </div>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
